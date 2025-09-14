import { z } from 'zod';
import Quiz from '../models/quiz.model.js';
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
    const [items, total] = await Promise.all([
      Quiz.find({ createdBy: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Quiz.countDocuments({ createdBy: userId }),
    ]);
    res.json({ items, page, limit, total });
  } catch (err) {
    next(err);
  }
}

export async function getQuizById(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id); // Loại bỏ populate vì model đã tự động populate
    if (!quiz) return res.status(404).json({ message: 'Không tìm thấy quiz' });
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
    
    const [items, total] = await Promise.all([
      Quiz.find({ createdBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit), // Loại bỏ populate vì model đã tự động populate
      Quiz.countDocuments({ createdBy: req.user._id }),
    ]);
    
    res.json({ 
      status: 'success',
      data: {
        items, 
        page, 
        limit, 
        total 
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
  getMyQuizzes 
};

