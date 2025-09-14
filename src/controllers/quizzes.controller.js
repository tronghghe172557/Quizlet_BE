import { z } from 'zod';
import Quiz from '../models/quiz.model.js';
import User from '../models/user.model.js';
import { generateQuizFromText } from '../services/gemini.service.js';
import mongoose from 'mongoose';

const CreateQuizSchema = z.object({
  title: z.string().min(1, 'title không được để trống'),
  text: z.string().min(10, 'text quá ngắn, tối thiểu 10 ký tự'),
  model: z.string().optional(),
});

export async function createQuiz(req, res, next) {
  try {
    const { title, text, model } = CreateQuizSchema.parse(req.body);
    const generated = await generateQuizFromText(text, model);
    const doc = await Quiz.create({
      title,
      sourceText: text,
      model: generated.model,
      questions: generated.questions,
      createdBy: req.user._id,
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

export async function listQuizzes(req, res, next) {
  console.log(req.user)
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;
    
    // Query để lấy quiz của user hoặc quiz được chia sẻ với user
    const query = {
      $or: [
        { createdBy: userId }, // Quiz của user tạo
        { sharedWith: userId } // Quiz được chia sẻ với user
      ]
    };
    
    const [items, total] = await Promise.all([
      Quiz.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Quiz.countDocuments(query),
    ]);
    res.json({ items, page, limit, total });
  } catch (err) {
    next(err);
  }
}

export async function getQuizById(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Không tìm thấy quiz' });
    
    // Kiểm tra quyền truy cập
    const userId = req.user._id.toString();
    const isOwner = quiz.createdBy._id.toString() === userId;
    const isSharedWith = quiz.sharedWith && quiz.sharedWith.some(sharedUserId => sharedUserId.toString() === userId);
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isSharedWith && !isAdmin) {
      return res.status(403).json({ 
        status: 'error',
        message: 'Bạn không có quyền truy cập quiz này' 
      });
    }
    
    res.json(quiz);
  } catch (err) {
    next(err);
  }
}

// Cập nhật quiz
export async function updateQuiz(req, res, next) {
  try {
    const UpdateQuizSchema = z.object({
      title: z.string().min(1, 'title không được để trống').optional(),
    });
    
    const { title } = UpdateQuizSchema.parse(req.body);
    
    // req.resource đã được set bởi validateResourceOwnership middleware
    const quiz = req.resource;
    
    if (title) quiz.title = title;
    await quiz.save();
    
    res.json({
      status: 'success',
      message: 'Cập nhật quiz thành công',
      data: quiz
    });
  } catch (err) {
    next(err);
  }
}

// Xóa quiz
export async function deleteQuiz(req, res, next) {
  try {
    // req.resource đã được set bởi validateResourceOwnership middleware
    const quiz = req.resource;
    await Quiz.findByIdAndDelete(quiz._id);
    
    res.json({
      status: 'success',
      message: 'Xóa quiz thành công'
    });
  } catch (err) {
    next(err);
  }
}

// Lấy quiz của user hiện tại
export async function getMyQuizzes(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;
    const type = req.query.type || 'all'; // 'own', 'shared', 'all'
    
    let query = {};
    const userId = req.user._id;
    
    switch (type) {
      case 'own':
        query = { createdBy: userId };
        break;
      case 'shared':
        query = { sharedWith: userId };
        break;
      case 'all':
      default:
        query = {
          $or: [
            { createdBy: userId },
            { sharedWith: userId }
          ]
        };
        break;
    }
    
    const [items, total] = await Promise.all([
      Quiz.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Quiz.countDocuments(query),
    ]);
    
    res.json({ 
      status: 'success',
      data: {
        items, 
        page, 
        limit, 
        total,
        type
      }
    });
  } catch (err) {
    next(err);
  }
}

// Chia sẻ quiz với users khác
export async function shareQuiz(req, res, next) {
  try {
    // Chỉ admin mới được chia sẻ quiz
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Chỉ admin mới có quyền chia sẻ quiz'
      });
    }

    const ShareQuizSchema = z.object({
      userIds: z.array(z.string().min(1, 'User ID không hợp lệ')).min(1, 'Phải có ít nhất 1 user')
    });
    
    const { userIds } = ShareQuizSchema.parse(req.body);
    const quiz = req.resource; // Từ middleware validateResourceOwnership
    
    // Validate user IDs
    const validUserIds = [];
    for (const userId of userIds) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        const user = await User.findById(userId);
        if (user && user.isActive) {
          validUserIds.push(new mongoose.Types.ObjectId(userId));
        }
      }
    }
    
    if (validUserIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Không có user hợp lệ nào để chia sẻ'
      });
    }
    
    // Thêm users vào danh sách chia sẻ (không trùng lặp)
    const currentSharedWith = quiz.sharedWith || [];
    const newSharedWith = [...new Set([
      ...currentSharedWith.map(id => id.toString()),
      ...validUserIds.map(id => id.toString())
    ])].map(id => new mongoose.Types.ObjectId(id));
    
    quiz.sharedWith = newSharedWith;
    await quiz.save();
    
    res.json({
      status: 'success',
      message: `Đã chia sẻ quiz với ${validUserIds.length} user(s)`,
      data: {
        quiz: quiz,
        sharedWithCount: quiz.sharedWith.length
      }
    });
    
  } catch (err) {
    next(err);
  }
}

// Hủy chia sẻ quiz với users
export async function unshareQuiz(req, res, next) {
  try {
    // Chỉ admin mới được hủy chia sẻ quiz
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Chỉ admin mới có quyền hủy chia sẻ quiz'
      });
    }

    const UnshareQuizSchema = z.object({
      userIds: z.array(z.string().min(1, 'User ID không hợp lệ')).min(1, 'Phải có ít nhất 1 user')
    });
    
    const { userIds } = UnshareQuizSchema.parse(req.body);
    const quiz = req.resource; // Từ middleware validateResourceOwnership
    
    // Loại bỏ users khỏi danh sách chia sẻ
    const currentSharedWith = quiz.sharedWith || [];
    const newSharedWith = currentSharedWith.filter(
      sharedUserId => !userIds.includes(sharedUserId.toString())
    );
    
    quiz.sharedWith = newSharedWith;
    await quiz.save();
    
    res.json({
      status: 'success',
      message: `Đã hủy chia sẻ quiz với ${currentSharedWith.length - newSharedWith.length} user(s)`,
      data: {
        quiz: quiz,
        sharedWithCount: quiz.sharedWith.length
      }
    });
    
  } catch (err) {
    next(err);
  }
}

// Lấy danh sách users được chia sẻ quiz
export async function getQuizSharedUsers(req, res, next) {
  try {
    const quiz = req.resource; // Từ middleware validateResourceOwnership
    
    await quiz.populate({
      path: 'sharedWith',
      select: '_id name email'
    });
    
    res.json({
      status: 'success',
      data: {
        sharedUsers: quiz.sharedWith || []
      }
    });
    
  } catch (err) {
    next(err);
  }
}

// Cập nhật câu hỏi cụ thể trong quiz
export async function updateQuizQuestion(req, res, next) {
  try {
    const quiz = req.resource; // Từ middleware validateResourceOwnership
    const questionIndex = parseInt(req.params.questionIndex);
    
    if (questionIndex < 0 || questionIndex >= quiz.questions.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Chỉ số câu hỏi không hợp lệ'
      });
    }

    const UpdateQuestionSchema = z.object({
      prompt: z.string().min(1, 'Câu hỏi không được để trống').optional(),
      explanation: z.string().optional(),
      choices: z.array(z.object({
        text: z.string().min(1, 'Lựa chọn không được để trống'),
        isCorrect: z.boolean()
      })).min(2, 'Phải có ít nhất 2 lựa chọn').optional()
    });
    
    const updateData = UpdateQuestionSchema.parse(req.body);
    
    // Cập nhật question
    if (updateData.prompt) {
      quiz.questions[questionIndex].prompt = updateData.prompt;
    }
    if (updateData.explanation !== undefined) {
      quiz.questions[questionIndex].explanation = updateData.explanation;
    }
    if (updateData.choices) {
      // Validate có ít nhất 1 đáp án đúng
      const hasCorrectAnswer = updateData.choices.some(choice => choice.isCorrect);
      if (!hasCorrectAnswer) {
        return res.status(400).json({
          status: 'error',
          message: 'Phải có ít nhất 1 đáp án đúng'
        });
      }
      quiz.questions[questionIndex].choices = updateData.choices;
    }
    
    await quiz.save();
    
    res.json({
      status: 'success',
      message: 'Cập nhật câu hỏi thành công',
      data: {
        question: quiz.questions[questionIndex],
        questionIndex
      }
    });
    
  } catch (err) {
    next(err);
  }
}

export default { 
  createQuiz, 
  listQuizzes, 
  getQuizById, 
  updateQuiz, 
  deleteQuiz, 
  getMyQuizzes,
  shareQuiz,
  unshareQuiz,
  getQuizSharedUsers,
  updateQuizQuestion 
};

