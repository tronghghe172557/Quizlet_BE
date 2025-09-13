import { z } from 'zod';
import Submission from '../models/submission.model.js';
import Quiz from '../models/quiz.model.js';

const SubmitQuizSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID không được để trống'),
  userEmail: z.string().email('Email không hợp lệ'),
  answers: z.array(z.object({
    questionIndex: z.number().min(0, 'Question index phải >= 0'),
    selectedChoiceIndex: z.number().min(0, 'Choice index phải >= 0'),
  })).min(1, 'Phải có ít nhất 1 câu trả lời'),
  timeSpent: z.number().optional(), // thời gian làm bài (giây)
});

// Nộp bài quiz
export async function submitQuiz(req, res, next) {
  try {
    const { quizId, userEmail, answers, timeSpent } = SubmitQuizSchema.parse(req.body);
    
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
      userEmail,
      answers: processedAnswers,
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      timeSpent,
    });

    // Populate quiz info để trả về
    await submission.populate('quiz', 'title');

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
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({ message: 'userEmail là bắt buộc' });
    }

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      Submission.find({ userEmail })
        .populate('quiz', 'title createdAt')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('score correctAnswers totalQuestions timeSpent submittedAt'),
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
    const { userEmail } = req.query;

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    // Tạo filter
    const filter = { quiz: quizId };
    if (userEmail) {
      filter.userEmail = userEmail;
    }

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('quiz', 'title')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      Submission.countDocuments(filter),
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

// Lấy chi tiết một submission
export async function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;
    
    const submission = await Submission.findById(id)
      .populate('quiz', 'title questions');

    if (!submission) {
      return res.status(404).json({ message: 'Không tìm thấy submission' });
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

export default { 
  submitQuiz, 
  getUserSubmissions, 
  getQuizSubmissions, 
  getSubmissionById,
  getQuizStats 
};