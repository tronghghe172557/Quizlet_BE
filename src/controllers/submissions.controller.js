import { z } from 'zod';
import Submission from '../models/submission.model.js';
import Quiz from '../models/quiz.model.js';
import { validateOwnership } from '../helpers/permissions.js';

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

export default { 
  submitQuiz, 
  getUserSubmissions, 
  getQuizSubmissions, 
  getSubmissionById,
  getQuizStats,
  getAllSubmissionsAdmin 
};