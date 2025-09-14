import { z } from 'zod';
import Quiz from '../models/quiz.model.js';
import User from '../models/user.model.js';
import { generateQuizFromText } from '../services/gemini.service.js';
import mongoose from 'mongoose';

const CreateQuizSchema = z.object({
  title: z.string().min(1, 'title không được để trống'),
  text: z.string().min(10, 'text quá ngắn, tối thiểu 10 ký tự'),
  model: z.string().optional(),
  // Quiz configuration fields - để frontend có thể truyền vào
  questionCount: z.number().min(1, 'Số câu hỏi phải ít nhất 1').max(25, 'Số câu hỏi tối đa 25').optional(),
  questionType: z.enum(['vocabulary', 'grammar', 'reading', 'conversation', 'mixed']).optional(),
  choicesPerQuestion: z.number().min(2, 'Tối thiểu 2 lựa chọn').max(6, 'Tối đa 6 lựa chọn').optional(),
  englishLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  displayLanguage: z.enum(['vietnamese', 'english', 'mixed']).optional(),
  // Prompt mở rộng để thay thế prompt mặc định
  promptExtension: z.string().max(4000, 'Prompt mở rộng không được quá 4000 ký tự').optional(),
});

export async function createQuiz(req, res, next) {
  try {
    // Parse và validate input từ frontend
    const validatedData = CreateQuizSchema.parse(req.body);
    const { 
      title, 
      text, 
      model = 'gemini-2.0-flash',
      questionCount = 4,
      questionType = 'mixed',
      choicesPerQuestion = 4,
      englishLevel = 'B1',
      displayLanguage = 'vietnamese',
      promptExtension = null
    } = validatedData;

    // Parse vocabulary từ text (mỗi dòng là 1 từ)
    const vocabulary = text.split(/[,\n]/).map(word => word.trim()).filter(word => word.length > 0);

    // Tạo config cho Gemini AI theo format mong muốn
    const quizConfig = {
      "số câu": questionCount,
      "dạng tạo câu hỏi": questionType,
      "số lựa chọn trong 1 câu": choicesPerQuestion,
      "note": "mỗi câu có đúng 1 đáp án đúng",
      "từ mới": vocabulary,
      "cấp độ tiếng Anh": englishLevel,
      "ngôn ngữ hiển thị câu hỏi": displayLanguage === 'vietnamese' ? 'Vietnamese' : displayLanguage === 'english' ? 'English' : 'Mixed'
    };

    // Gọi AI service để tạo quiz
    const generated = await generateQuizFromText(text, model, quizConfig, promptExtension);
    
    // Lưu vào database với đầy đủ metadata
    const doc = await Quiz.create({
      title,
      sourceText: text,
      model: generated.model,
      questions: generated.questions,
      createdBy: req.user._id,
      // Metadata fields theo đúng schema
      questionCount,
      questionType,
      choicesPerQuestion,
      vocabulary,
      englishLevel,
      displayLanguage,
      note: 'mỗi câu có đúng 1 đáp án đúng',
      promptExtension
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
    // Cả admin và user đều có thể chia sẻ quiz của mình
    // Admin có thể chia sẻ bất kỳ quiz nào, user chỉ chia sẻ quiz của mình
    const quiz = req.resource; // Từ middleware validateResourceOwnership
    const isOwner = quiz.createdBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền chia sẻ quiz này'
      });
    }

    const ShareQuizSchema = z.object({
      userEmails: z.array(z.string().email('Email không hợp lệ')).min(1, 'Phải có ít nhất 1 email')
    });
    
    const { userEmails } = ShareQuizSchema.parse(req.body);
    
    // Tìm users theo email
    const users = await User.find({ 
      email: { $in: userEmails },
      isActive: true
    }).select('_id email role');
    
    if (users.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Không tìm thấy user hợp lệ nào với email đã cung cấp'
      });
    }
    
    // User thường không thể chia sẻ với admin
    if (req.user.role !== 'admin') {
      const adminUsers = users.filter(user => user.role === 'admin');
      if (adminUsers.length > 0) {
        return res.status(403).json({
          status: 'error',
          message: 'User không thể chia sẻ quiz với admin'
        });
      }
    }
    
    // Thêm users vào danh sách chia sẻ (không trùng lặp)
    const userIds = users.map(user => user._id);
    const currentSharedWith = quiz.sharedWith || [];
    const newSharedWith = [...new Set([
      ...currentSharedWith.map(id => id.toString()),
      ...userIds.map(id => id.toString())
    ])].map(id => new mongoose.Types.ObjectId(id));
    
    quiz.sharedWith = newSharedWith;
    await quiz.save();
    
    res.json({
      status: 'success',
      message: `Đã chia sẻ quiz với ${users.length} user(s)`,
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
    // Cả admin và owner đều có thể hủy chia sẻ
    const quiz = req.resource; // Từ middleware validateResourceOwnership
    const isOwner = quiz.createdBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Bạn không có quyền hủy chia sẻ quiz này'
      });
    }

    const UnshareQuizSchema = z.object({
      userEmails: z.array(z.string().email('Email không hợp lệ')).min(1, 'Phải có ít nhất 1 email')
    });
    
    const { userEmails } = UnshareQuizSchema.parse(req.body);
    
    // Tìm users theo email
    const users = await User.find({ 
      email: { $in: userEmails }
    }).select('_id email');
    
    const userIds = users.map(user => user._id.toString());
    
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

