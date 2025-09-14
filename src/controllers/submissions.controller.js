import { z } from 'zod';
import Submission from '../models/submission.model.js';
import Quiz from '../models/quiz.model.js';
import ReviewSchedule from '../models/reviewSchedule.model.js';
import User from '../models/user.model.js';
import { validateOwnership } from '../helpers/permissions.js';
import ReviewScheduleLogger from '../helpers/reviewScheduleLogger.js';

const SubmitQuizSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID không được để trống'),
  answers: z.array(z.object({
    questionIndex: z.number().min(0, 'Question index phải >= 0'),
    selectedChoiceIndex: z.number().min(0, 'Choice index phải >= 0'),
  })).min(1, 'Phải có ít nhất 1 câu trả lời'),
  timeSpent: z.number().optional(), // thời gian làm bài (giây)
});

// Nộp bài quiz
export async function submitQuiz(req, res, next) {
  try {
    const { quizId, answers, timeSpent } = SubmitQuizSchema.parse(req.body);
    const userEmail = req.user.email; // Lấy email từ JWT token
    
    // Kiểm tra quiz có tồn tại không
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Không tìm thấy quiz' });
    }

    // Kiểm tra số lượng câu trả lời
    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({ 
        message: `Số câu trả lời (${answers.length}) không khớp với số câu hỏi (${quiz.questions.length})` 
      });
    }

    // Tính điểm
    let correctAnswers = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = quiz.questions[answer.questionIndex];
      if (!question) {
        throw new Error(`Không tìm thấy câu hỏi tại index ${answer.questionIndex}`);
      }

      const selectedChoice = question.choices[answer.selectedChoiceIndex];
      if (!selectedChoice) {
        throw new Error(`Không tìm thấy lựa chọn tại index ${answer.selectedChoiceIndex} cho câu hỏi ${answer.questionIndex}`);
      }

      const isCorrect = selectedChoice.isCorrect;
      if (isCorrect) {
        correctAnswers++;
      }

      return {
        questionIndex: answer.questionIndex,
        selectedChoiceIndex: answer.selectedChoiceIndex,
        isCorrect,
      };
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    // Lưu submission
    const submission = await Submission.create({
      quiz: quizId,
      user: req.user._id,
      userEmail,
      answers: processedAnswers,
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeSpent,
    });

    // 🤖 AUTO: Tự động tạo/cập nhật review schedule với spaced repetition
    try {
      let reviewSchedule = await ReviewSchedule.findOne({
        user: req.user._id,
        quiz: quizId
      });

      if (reviewSchedule) {
        // Đã có lịch ôn tập → Cập nhật với spaced repetition logic
        const oldInterval = reviewSchedule.reviewInterval;
        await reviewSchedule.updateNextReview(score);
        
        // Special logging for immediate retry
        if (score < 50) {
          ReviewScheduleLogger.logImmediateRetry(
            req.user._id,
            quiz.title,
            score,
            reviewSchedule.nextReviewAt
          );
        } else {
          // Normal update logging
          ReviewScheduleLogger.logAutoUpdate(
            req.user._id, 
            quiz.title, 
            score, 
            oldInterval, 
            reviewSchedule.reviewInterval, 
            reviewSchedule.nextReviewAt
          );
        }
      } else {
        // Chưa có → Tạo mới với interval ban đầu = 3 ngày
        const nextReviewAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const newSchedule = await ReviewSchedule.create({
          user: req.user._id,
          quiz: quizId,
          reviewInterval: 3,
          nextReviewAt,
          lastScore: score,
          averageScore: score,
          reviewCount: 1, // Đây là lần đầu tiên làm bài
          isActive: true,
          lastReviewedAt: new Date()
        });
        
        // Log automation success
        ReviewScheduleLogger.logAutoCreation(
          req.user._id, 
          quiz.title, 
          score, 
          nextReviewAt
        );
      }
    } catch (reviewError) {
      // Log automation error
      ReviewScheduleLogger.logError('AUTO_SCHEDULE', reviewError, {
        userId: req.user._id,
        quizId: quizId,
        score: score
      });
    }

    // Cập nhật thống kê user
    try {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalQuizzesCompleted: 1 },
        $set: { 
          averageScore: await calculateUserAverageScore(req.user._id) 
        }
      });
    } catch (userUpdateError) {
      console.log('Error updating user stats:', userUpdateError.message);
    }

    // Model đã tự động populate, không cần populate thủ công

    res.status(201).json({
      message: 'Nộp bài thành công',
      submission: {
        id: submission._id,
        quiz: submission.quiz,
        score: submission.score,
        correctAnswers: submission.correctAnswers,
        totalQuestions: submission.totalQuestions,
        scorePercentage: submission.scorePercentage,
        timeSpent: submission.timeSpent,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Lấy danh sách submissions của user
export async function getUserSubmissions(req, res, next) {
  try {
    const userEmail = req.user.email; // Lấy email từ JWT token

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find({ userEmail })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('score correctAnswers totalQuestions timeSpent submittedAt quiz user'), // Model đã tự động populate
      Submission.countDocuments({ userEmail }),
    ]);

    res.json({
      submissions,
      page,
      limit,
      total,
    });
  } catch (err) {
    next(err);
  }
}

// Lấy submissions theo ngày (1 submission/ngày)
export async function getSubmissionsByDate(req, res, next) {
  try {
    const userEmail = req.user.email;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '30', 10), 1), 90); // Tối đa 90 ngày
    const skip = (page - 1) * limit;

    // Aggregation để lấy 1 submission đại diện cho mỗi ngày
    const submissionsByDate = await Submission.aggregate([
      { 
        $match: { userEmail } 
      },
      {
        $addFields: {
          dateOnly: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$submittedAt"
            }
          }
        }
      },
      {
        $sort: { submittedAt: -1 } // Sắp xếp mới nhất trước để lấy submission gần nhất của ngày
      },
      {
        $group: {
          _id: "$dateOnly",
          submission: { $first: "$$ROOT" }, // Lấy submission đầu tiên (gần nhất) của ngày
          submissionsCount: { $sum: 1 }, // Đếm số submission trong ngày
          averageScore: { $avg: "$score" },
          totalCorrect: { $sum: "$correctAnswers" },
          totalQuestions: { $sum: "$totalQuestions" }
        }
      },
      {
        $sort: { "_id": -1 } // Sắp xếp theo ngày giảm dần
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "submission.quiz",
          foreignField: "_id",
          as: "quizInfo"
        }
      },
      {
        $project: {
          date: "$_id",
          submission: {
            _id: "$submission._id",
            quiz: { $arrayElemAt: ["$quizInfo", 0] },
            score: "$submission.score",
            scorePercentage: "$submission.scorePercentage",
            correctAnswers: "$submission.correctAnswers",
            totalQuestions: "$submission.totalQuestions",
            timeSpent: "$submission.timeSpent",
            submittedAt: "$submission.submittedAt"
          },
          dailyStats: {
            submissionsCount: "$submissionsCount",
            averageScore: { $round: ["$averageScore", 1] },
            totalCorrect: "$totalCorrect",
            totalQuestions: "$totalQuestions",
            successRate: { 
              $round: [
                { $multiply: [{ $divide: ["$totalCorrect", "$totalQuestions"] }, 100] }, 
                1
              ] 
            }
          }
        }
      }
    ]);

    // Đếm tổng số ngày có submission
    const totalDaysWithSubmissions = await Submission.aggregate([
      { $match: { userEmail } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$submittedAt"
            }
          }
        }
      },
      { $count: "totalDays" }
    ]);

    const total = totalDaysWithSubmissions[0]?.totalDays || 0;

    res.status(200).json({
      message: 'Lấy submissions theo ngày thành công',
      data: submissionsByDate,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      summary: {
        totalDaysWithActivity: total,
        averageDailySubmissions: submissionsByDate.length > 0 
          ? Math.round(submissionsByDate.reduce((acc, day) => acc + day.dailyStats.submissionsCount, 0) / submissionsByDate.length * 10) / 10
          : 0
      }
    });
  } catch (err) {
    next(err);
  }
}

// Lấy submissions của một quiz cụ thể
export async function getQuizSubmissions(req, res, next) {
  try {
    const { quizId } = req.params;

    // Kiểm tra quiz có tồn tại không
    const quiz = await Quiz.findById(quizId).populate('createdBy', 'name email');
    if (!quiz) {
      return res.status(404).json({ message: 'Không tìm thấy quiz' });
    }

    // Validate permissions: chỉ quiz owner hoặc admin mới xem được tất cả submissions
    if (!validateOwnership(quiz, req, 'createdBy')) {
      return res.status(403).json({ 
        status: 'error',
        message: 'Access denied. You can only view submissions for your own quizzes.' 
      });
    }

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find({ quiz: quizId })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit), // Model đã tự động populate quiz và user
      Submission.countDocuments({ quiz: quizId }),
    ]);

    res.json({
      quiz: {
        id: quiz._id,
        title: quiz.title,
        createdBy: quiz.createdBy
      },
      submissions,
      page,
      limit,
      total,
    });
  } catch (err) {
    next(err);
  }
}

// Lấy chi tiết một submission
export async function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;
    
    const submission = await Submission.findById(id); // Model đã tự động populate

    if (!submission) {
      return res.status(404).json({ message: 'Không tìm thấy submission' });
    }

    // Validate ownership: chỉ owner hoặc admin mới xem được
    if (!validateOwnership(submission, req, 'user')) {
      return res.status(403).json({ 
        status: 'error',
        message: 'Access denied. You can only view your own submissions.' 
      });
    }

    res.json(submission);
  } catch (err) {
    next(err);
  }
}

// Lấy thống kê submissions của một quiz
export async function getQuizStats(req, res, next) {
  try {
    const { quizId } = req.params;

    // Kiểm tra quiz có tồn tại không
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Không tìm thấy quiz' });
    }

    // Tính thống kê
    const stats = await Submission.aggregate([
      { $match: { quiz: quiz._id } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          averageScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' },
          averageTime: { $avg: '$timeSpent' },
        }
      }
    ]);

    const result = stats[0] || {
      totalSubmissions: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
      averageTime: 0,
    };

    res.json({
      quiz: {
        id: quiz._id,
        title: quiz.title,
        totalQuestions: quiz.questions.length,
      },
      stats: {
        ...result,
        averageScore: Math.round(result.averageScore || 0),
        averageTime: Math.round(result.averageTime || 0),
      }
    });
  } catch (err) {
    next(err);
  }
}

// Admin function: Lấy tất cả submissions (chỉ dành cho admin)
export async function getAllSubmissionsAdmin(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const { userEmail, quizId } = req.query;
    const filter = {};
    
    if (userEmail) filter.userEmail = { $regex: userEmail, $options: 'i' };
    if (quizId) filter.quiz = quizId;

    const [submissions, total] = await Promise.all([
      Submission.find(filter) // Model đã tự động populate
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      Submission.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

// API tạo contribution graph giống GitHub
export async function getContributionGraph(req, res, next) {
  try {
    const userEmail = req.user.email;
    
    // Parse query parameters
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const days = parseInt(req.query.days) || 365; // Default 1 năm
    
    // Tính start date
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    
    // Set giờ để bao phủ cả ngày
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Aggregation để lấy submissions theo ngày
    const dailyContributions = await Submission.aggregate([
      {
        $match: {
          userEmail,
          submittedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $addFields: {
          dateOnly: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$submittedAt"
            }
          }
        }
      },
      {
        $group: {
          _id: "$dateOnly",
          count: { $sum: 1 },
          totalScore: { $sum: "$score" },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          totalTime: { $sum: { $ifNull: ["$timeSpent", 0] } }
        }
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          averageScore: { $round: ["$averageScore", 1] },
          bestScore: 1,
          totalTime: 1,
          intensity: {
            $switch: {
              branches: [
                { case: { $eq: ["$count", 0] }, then: 0 },
                { case: { $lte: ["$count", 2] }, then: 1 },
                { case: { $lte: ["$count", 4] }, then: 2 },
                { case: { $lte: ["$count", 8] }, then: 3 },
                { case: { $gt: ["$count", 8] }, then: 4 }
              ],
              default: 0
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Tạo một map để dễ tra cứu
    const contributionsMap = {};
    dailyContributions.forEach(day => {
      contributionsMap[day.date] = day;
    });

    // Tạo mảng đầy đủ cho tất cả các ngày trong khoảng thời gian
    const allDays = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const contribution = contributionsMap[dateString];
      
      allDays.push({
        date: dateString,
        count: contribution?.count || 0,
        intensity: contribution?.intensity || 0,
        averageScore: contribution?.averageScore || 0,
        bestScore: contribution?.bestScore || 0,
        totalTime: contribution?.totalTime || 0,
        weekday: currentDate.getDay(), // 0 = Chủ nhật, 1 = Thứ 2, ...
        week: Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Tính tổng thống kê
    const totalContributions = dailyContributions.reduce((sum, day) => sum + day.count, 0);
    const activeDays = dailyContributions.length;
    const maxDayCount = Math.max(...dailyContributions.map(d => d.count), 0);
    const averagePerDay = activeDays > 0 ? Math.round((totalContributions / activeDays) * 10) / 10 : 0;

    res.status(200).json({
      message: 'Lấy contribution graph thành công',
      data: {
        contributions: allDays,
        stats: {
          totalContributions,
          activeDays,
          totalDays: days,
          maxDayCount,
          averagePerDay,
          period: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            days
          }
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

// API tính streak (chuỗi ngày liên tiếp làm bài)
export async function getContributionStreaks(req, res, next) {
  try {
    const userEmail = req.user.email;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2); // Lấy 2 năm dữ liệu để tính streak

    // Lấy tất cả ngày có submission
    const activeDays = await Submission.aggregate([
      {
        $match: {
          userEmail,
          submittedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$submittedAt"
            }
          }
        }
      },
      {
        $sort: { _id: -1 } // Sắp xếp từ mới nhất về cũ nhất
      }
    ]);

    const activeDateStrings = activeDays.map(day => day._id);

    // Tính current streak
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateString = checkDate.toISOString().split('T')[0];
      if (activeDateStrings.includes(dateString)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Nếu hôm nay chưa làm bài, check hôm qua
        if (currentStreak === 0 && dateString === new Date().toISOString().split('T')[0]) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    // Tính longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate = null;

    // Sắp xếp lại theo thứ tự thời gian tăng dần để tính streak
    const sortedDates = activeDateStrings.sort();

    for (const dateString of sortedDates) {
      const currentDate = new Date(dateString);
      
      if (previousDate) {
        const diffTime = currentDate.getTime() - previousDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          // Ngày liên tiếp
          tempStreak++;
        } else {
          // Streak bị gián đoạn
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      
      previousDate = currentDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    // Thống kê thêm
    const totalActiveDays = activeDateStrings.length;
    const firstActivityDate = sortedDates[0] || null;
    const lastActivityDate = sortedDates[sortedDates.length - 1] || null;

    res.status(200).json({
      message: 'Lấy streak information thành công',
      data: {
        currentStreak,
        longestStreak,
        totalActiveDays,
        firstActivityDate,
        lastActivityDate,
        isActiveToday: activeDateStrings.includes(new Date().toISOString().split('T')[0]),
        streakInfo: {
          message: currentStreak > 0 
            ? `Bạn đã học liên tục ${currentStreak} ngày! 🔥`
            : 'Hãy bắt đầu streak mới bằng cách làm bài hôm nay! 💪',
          motivation: longestStreak > currentStreak 
            ? `Kỷ lục của bạn là ${longestStreak} ngày. Hãy cố gắng phá vỡ nó!`
            : currentStreak > 0 
              ? 'Bạn đang tạo kỷ lục mới! Tiếp tục phát huy! 🚀'
              : 'Mỗi hành trình đều bắt đầu từ bước đầu tiên! 🌟'
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

// API thống kê tổng quan về contributions
export async function getContributionSummary(req, res, next) {
  try {
    const userEmail = req.user.email;
    const currentYear = new Date().getFullYear();
    
    // Thống kê theo năm hiện tại
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    const yearlyStats = await Submission.aggregate([
      {
        $match: {
          userEmail,
          submittedAt: { $gte: yearStart, $lte: yearEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalScore: { $sum: "$score" },
          averageScore: { $avg: "$score" },
          bestScore: { $max: "$score" },
          totalTime: { $sum: { $ifNull: ["$timeSpent", 0] } },
          uniqueDays: {
            $addToSet: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$submittedAt"
              }
            }
          }
        }
      },
      {
        $project: {
          totalSubmissions: 1,
          averageScore: { $round: ["$averageScore", 1] },
          bestScore: 1,
          totalTime: 1,
          activeDays: { $size: "$uniqueDays" },
          averagePerActiveDay: {
            $round: [
              { $divide: ["$totalSubmissions", { $size: "$uniqueDays" }] },
              1
            ]
          }
        }
      }
    ]);

    // Thống kê theo tháng
    const monthlyStats = await Submission.aggregate([
      {
        $match: {
          userEmail,
          submittedAt: { $gte: yearStart, $lte: yearEnd }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$submittedAt" },
            year: { $year: "$submittedAt" }
          },
          count: { $sum: 1 },
          averageScore: { $avg: "$score" }
        }
      },
      {
        $sort: { "_id.month": 1 }
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          averageScore: { $round: ["$averageScore", 1] }
        }
      }
    ]);

    // Thống kê theo ngày trong tuần
    const weekdayStats = await Submission.aggregate([
      {
        $match: {
          userEmail,
          submittedAt: { $gte: yearStart, $lte: yearEnd }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: "$submittedAt" }, // 1 = Chủ nhật, 2 = Thứ 2, ...
          count: { $sum: 1 },
          averageScore: { $avg: "$score" }
        }
      },
      {
        $sort: { "_id": 1 }
      },
      {
        $project: {
          dayOfWeek: "$_id",
          dayName: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 1] }, then: "Chủ nhật" },
                { case: { $eq: ["$_id", 2] }, then: "Thứ 2" },
                { case: { $eq: ["$_id", 3] }, then: "Thứ 3" },
                { case: { $eq: ["$_id", 4] }, then: "Thứ 4" },
                { case: { $eq: ["$_id", 5] }, then: "Thứ 5" },
                { case: { $eq: ["$_id", 6] }, then: "Thứ 6" },
                { case: { $eq: ["$_id", 7] }, then: "Thứ 7" }
              ],
              default: "Unknown"
            }
          },
          count: 1,
          averageScore: { $round: ["$averageScore", 1] }
        }
      }
    ]);

    const stats = yearlyStats[0] || {
      totalSubmissions: 0,
      averageScore: 0,
      bestScore: 0,
      totalTime: 0,
      activeDays: 0,
      averagePerActiveDay: 0
    };

    res.status(200).json({
      message: 'Lấy contribution summary thành công',
      data: {
        year: currentYear,
        overview: {
          ...stats,
          totalTimeHours: Math.round((stats.totalTime / 3600) * 10) / 10,
          completionRate: stats.activeDays > 0 ? Math.round((stats.activeDays / 365) * 100) : 0
        },
        monthlyBreakdown: monthlyStats,
        weekdayPattern: weekdayStats,
        insights: {
          mostActiveMonth: monthlyStats.length > 0 
            ? monthlyStats.reduce((max, current) => current.count > max.count ? current : max).month
            : null,
          bestMonthScore: monthlyStats.length > 0 
            ? Math.max(...monthlyStats.map(m => m.averageScore))
            : 0,
          mostActiveWeekday: weekdayStats.length > 0 
            ? weekdayStats.reduce((max, current) => current.count > max.count ? current : max).dayName
            : null
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

// Helper function để tính average score của user
async function calculateUserAverageScore(userId) {
  const result = await Submission.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, averageScore: { $avg: '$score' } } }
  ]);
  
  return result.length > 0 ? Math.round(result[0].averageScore) : 0;
}

export default { 
  submitQuiz, 
  getUserSubmissions, 
  getSubmissionsByDate,
  getContributionGraph,
  getContributionStreaks,
  getContributionSummary,
  getQuizSubmissions, 
  getSubmissionById,
  getQuizStats,
  getAllSubmissionsAdmin 
};