import { z } from 'zod';
import Quiz from '../models/quiz.model.js';
import { generateQuizFromText } from '../services/gemini.service.js';

const CreateQuizSchema = z.object({
  title: z.string().min(1, 'title không được để trống'),
  text: z.string().min(10, 'text quá ngắn, tối thiểu 10 ký tự'),
  model: z.string().optional(),
  createdBy: z.string().email().optional(),
});

export async function createQuiz(req, res, next) {
  try {
    const { title, text, model, createdBy } = CreateQuizSchema.parse(req.body);
    const generated = await generateQuizFromText(text, model);
    const doc = await Quiz.create({
      title,
      sourceText: text,
      model: generated.model,
      questions: generated.questions,
      createdBy,
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

export async function listQuizzes(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Quiz.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Quiz.countDocuments(),
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
    res.json(quiz);
  } catch (err) {
    next(err);
  }
}

export default { createQuiz, listQuizzes, getQuizById };

