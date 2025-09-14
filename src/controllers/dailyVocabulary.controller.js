import { z } from 'zod';
import DailyVocabulary from '../models/dailyVocabulary.model.js';
import User from '../models/user.model.js';
import { asyncHandler } from '../helpers/asyncHandle.js';
import { OK, Created } from '../core/success.response.js';

// Schema validation
const MarkWordLearnedSchema = z.object({
  wordIndex: z.number().min(0, 'Word index phải >= 0')
});

const UpdatePreferencesSchema = z.object({
  dailyWordGoal: z.number().min(5).max(20).optional(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional()
});

// Lấy vocabulary hôm nay
export const getTodayVocabulary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  const wordCount = user.learningPreferences?.dailyWordGoal || 10;

  // Tạo hoặc lấy vocabulary cho hôm nay
  let todayVocab = await DailyVocabulary.createDailyVocabulary(userId, wordCount);

  new OK({
    message: 'Lấy từ vựng hôm nay thành công',
    metadata: todayVocab
  }).send(res);
});

// Đánh dấu từ đã học
export const markWordAsLearned = asyncHandler(async (req, res) => {
  const { wordIndex } = MarkWordLearnedSchema.parse(req.body);
  const userId = req.user._id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayVocab = await DailyVocabulary.findOne({
    user: userId,
    date: today
  });

  if (!todayVocab) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy từ vựng hôm nay'
    });
  }

  if (wordIndex >= todayVocab.vocabularyWords.length) {
    return res.status(400).json({
      success: false,
      message: 'Index từ vựng không hợp lệ'
    });
  }

  if (todayVocab.vocabularyWords[wordIndex].isLearned) {
    return res.status(400).json({
      success: false,
      message: 'Từ này đã được đánh dấu là đã học'
    });
  }

  await todayVocab.markWordAsLearned(wordIndex);

  // Cập nhật streak nếu hoàn thành hết từ trong ngày
  if (todayVocab.isCompleted) {
    await DailyVocabulary.updateUserStreak(userId);
  }

  new OK({
    message: 'Đánh dấu từ đã học thành công',
    metadata: todayVocab
  }).send(res);
});

// Lấy lịch sử học từ vựng
export const getVocabularyHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 7; // Mặc định 7 ngày
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    DailyVocabulary.find({ user: userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('-vocabularyWords.meaning -vocabularyWords.example'),
    DailyVocabulary.countDocuments({ user: userId })
  ]);

  new OK({
    message: 'Lấy lịch sử học từ vựng thành công',
    metadata: {
      history,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }
  }).send(res);
});

// Lấy thống kê học từ vựng
export const getVocabularyStatistics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  // Thống kê tổng quan
  const stats = await DailyVocabulary.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        completedDays: {
          $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
        },
        totalWords: { $sum: '$totalWords' },
        totalLearnedWords: { $sum: '$completedWords' },
        averageProgress: { $avg: '$progressPercentage' }
      }
    }
  ]);

  // Thống kê 30 ngày gần nhất
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentStats = await DailyVocabulary.find({
    user: userId,
    date: { $gte: thirtyDaysAgo }
  }).sort({ date: -1 });

  // Tính streak hiện tại
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < recentStats.length; i++) {
    const recordDate = new Date(recentStats[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (recordDate.getTime() === expectedDate.getTime() && recentStats[i].isCompleted) {
      currentStreak++;
    } else {
      break;
    }
  }

  const statistics = stats[0] || {
    totalDays: 0,
    completedDays: 0,
    totalWords: 0,
    totalLearnedWords: 0,
    averageProgress: 0
  };

  new OK({
    message: 'Lấy thống kê học từ vựng thành công',
    metadata: {
      statistics: {
        ...statistics,
        currentStreak,
        vocabularyStreak: user.vocabularyStreak || 0
      },
      recentActivity: recentStats
    }
  }).send(res);
});

// Cập nhật preferences học từ vựng
export const updateVocabularyPreferences = asyncHandler(async (req, res) => {
  const updateData = UpdatePreferencesSchema.parse(req.body);
  const userId = req.user._id;

  const preferences = {};
  if (updateData.dailyWordGoal) preferences['learningPreferences.dailyWordGoal'] = updateData.dailyWordGoal;
  if (updateData.reminderTime) preferences['learningPreferences.reminderTime'] = updateData.reminderTime;
  if (updateData.difficultyLevel) preferences['learningPreferences.difficultyLevel'] = updateData.difficultyLevel;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: preferences },
    { new: true, runValidators: true }
  );

  new OK({
    message: 'Cập nhật preferences thành công',
    metadata: {
      preferences: user.learningPreferences
    }
  }).send(res);
});

// Lấy từ vựng đã học để ôn tập
export const getWordsForReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 20;

  // Lấy các từ đã học trong 7 ngày qua
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const vocabularyRecords = await DailyVocabulary.find({
    user: userId,
    date: { $gte: sevenDaysAgo },
    'vocabularyWords.isLearned': true
  }).select('vocabularyWords date');

  // Lấy random từ đã học
  const learnedWords = [];
  vocabularyRecords.forEach(record => {
    record.vocabularyWords.forEach(word => {
      if (word.isLearned) {
        learnedWords.push({
          ...word.toObject(),
          learnedDate: record.date
        });
      }
    });
  });

  // Shuffle và lấy số lượng từ theo limit
  const shuffledWords = learnedWords.sort(() => 0.5 - Math.random()).slice(0, limit);

  new OK({
    message: 'Lấy từ vựng để ôn tập thành công',
    metadata: {
      words: shuffledWords,
      total: shuffledWords.length
    }
  }).send(res);
});

// Reset progress (chỉ admin hoặc user tự reset)
export const resetVocabularyProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Xóa tất cả records học từ vựng
  await DailyVocabulary.deleteMany({ user: userId });

  // Reset streak trong user
  await User.findByIdAndUpdate(userId, {
    vocabularyStreak: 0,
    lastVocabularyDate: null
  });

  new OK({
    message: 'Reset tiến trình học từ vựng thành công'
  }).send(res);
});