import mongoose from 'mongoose';

const DailyVocabularySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      }
    },
    vocabularyWords: [{
      word: { type: String, required: true },
      meaning: { type: String, required: true },
      pronunciation: { type: String },
      example: { type: String },
      difficulty: { 
        type: String, 
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate' 
      },
      category: { type: String },
      isLearned: { type: Boolean, default: false },
      reviewCount: { type: Number, default: 0 },
      lastReviewedAt: { type: Date }
    }],
    totalWords: {
      type: Number,
      default: 10
    },
    completedWords: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual để tính progress percentage
DailyVocabularySchema.virtual('progressPercentage').get(function() {
  if (this.totalWords === 0) return 0;
  return Math.round((this.completedWords / this.totalWords) * 100);
});

// Index cho performance
DailyVocabularySchema.index({ user: 1, date: 1 }, { unique: true });
DailyVocabularySchema.index({ user: 1, isCompleted: 1 });
DailyVocabularySchema.index({ date: 1 });

// Method để đánh dấu từ đã học
DailyVocabularySchema.methods.markWordAsLearned = function(wordIndex) {
  if (this.vocabularyWords[wordIndex] && !this.vocabularyWords[wordIndex].isLearned) {
    this.vocabularyWords[wordIndex].isLearned = true;
    this.vocabularyWords[wordIndex].lastReviewedAt = new Date();
    this.vocabularyWords[wordIndex].reviewCount += 1;
    this.completedWords += 1;
    
    // Check if all words completed
    if (this.completedWords >= this.totalWords) {
      this.isCompleted = true;
    }
  }
  return this.save();
};

// Static method để tạo vocabulary cho ngày mới
DailyVocabularySchema.statics.createDailyVocabulary = async function(userId, wordCount = 10) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if already exists for today
  const existing = await this.findOne({ user: userId, date: today });
  if (existing) return existing;
  
  console.log(`📚 Creating daily vocabulary for user ${userId}, wordCount: ${wordCount}`);
  
  // SIMPLIFIED LOGIC: Lấy từ vựng từ quiz database
  const Quiz = mongoose.model('Quiz');
  let vocabularyFromQuizzes = [];
  
  try {
    // Lấy quiz và extract từ vựng một cách đơn giản
    const quizzes = await Quiz.find({}).limit(50);
    console.log(`Found ${quizzes.length} quizzes in database`);
    
    for (const quiz of quizzes) {
      for (const question of quiz.questions) {
        // Extract từ trong dấu nháy đơn từ prompt
        const wordMatch = question.prompt.match(/'([^']+)'/);
        if (wordMatch) {
          const word = wordMatch[1];
          
          // Tìm đáp án đúng
          const correctChoice = question.choices.find(choice => choice.isCorrect);
          if (correctChoice) {
            const meaning = correctChoice.text;
            
            // Extract pronunciation từ explanation nếu có
            const pronunciationMatch = question.explanation ? 
              question.explanation.match(/\/[^\/]+\//) : null;
            const pronunciation = pronunciationMatch ? pronunciationMatch[0] : '';
            
            vocabularyFromQuizzes.push({
              word: word,
              meaning: meaning,
              pronunciation: pronunciation,
              example: `Example: ${word} - ${meaning}`,
              category: 'vocabulary',
              difficulty: 'intermediate'
            });
            
            // Đủ từ rồi thì break
            if (vocabularyFromQuizzes.length >= wordCount) break;
          }
        }
      }
      if (vocabularyFromQuizzes.length >= wordCount) break;
    }
    
    console.log(`Extracted ${vocabularyFromQuizzes.length} words from quizzes`);
  } catch (error) {
    console.error('Error extracting words from quizzes:', error.message);
  }
  
  // Từ mặc định chất lượng cao
  const defaultWords = [
    {
      word: 'beautiful',
      meaning: 'đẹp',
      pronunciation: '/ˈbjuːtɪfəl/',
      example: 'She has a beautiful smile.',
      category: 'adjective',
      difficulty: 'beginner'
    },
    {
      word: 'important',
      meaning: 'quan trọng',
      pronunciation: '/ɪmˈpɔːtənt/',
      example: 'Education is very important.',
      category: 'adjective',
      difficulty: 'intermediate'
    },
    {
      word: 'understand',
      meaning: 'hiểu',
      pronunciation: '/ʌndəˈstænd/',
      example: 'Do you understand this lesson?',
      category: 'verb',
      difficulty: 'intermediate'
    },
    {
      word: 'knowledge',
      meaning: 'kiến thức',
      pronunciation: '/ˈnɒlɪdʒ/',
      example: 'Knowledge is power.',
      category: 'noun',
      difficulty: 'advanced'
    },
    {
      word: 'experience',
      meaning: 'kinh nghiệm',
      pronunciation: '/ɪkˈspɪəriəns/',
      example: 'I have 5 years of experience.',
      category: 'noun',
      difficulty: 'advanced'
    },
    {
      word: 'learn',
      meaning: 'học',
      pronunciation: '/lɜːn/',
      example: 'I want to learn English.',
      category: 'verb',
      difficulty: 'beginner'
    },
    {
      word: 'speak',
      meaning: 'nói',
      pronunciation: '/spiːk/',
      example: 'Can you speak English?',
      category: 'verb',
      difficulty: 'beginner'
    },
    {
      word: 'listen',
      meaning: 'nghe',
      pronunciation: '/ˈlɪsən/',
      example: 'Please listen carefully.',
      category: 'verb',
      difficulty: 'beginner'
    },
    {
      word: 'write',
      meaning: 'viết',
      pronunciation: '/raɪt/',
      example: 'I write emails every day.',
      category: 'verb',
      difficulty: 'beginner'
    },
    {
      word: 'read',
      meaning: 'đọc',
      pronunciation: '/riːd/',
      example: 'I read books every night.',
      category: 'verb',
      difficulty: 'beginner'
    },
    {
      word: 'happy',
      meaning: 'vui vẻ, hạnh phúc',
      pronunciation: '/ˈhæpi/',
      example: 'I am very happy today.',
      category: 'adjective',
      difficulty: 'beginner'
    },
    {
      word: 'friend',
      meaning: 'bạn bè',
      pronunciation: '/frend/',
      example: 'She is my best friend.',
      category: 'noun',
      difficulty: 'beginner'
    }
  ];
  
  // Combine từ quiz và từ mặc định
  const finalVocabulary = [];
  
  // Thêm từ từ quiz trước (ưu tiên)
  for (const word of vocabularyFromQuizzes) {
    if (finalVocabulary.length < wordCount) {
      finalVocabulary.push(word);
    }
  }
  
  // Thêm từ mặc định nếu thiếu
  for (const defaultWord of defaultWords) {
    if (finalVocabulary.length < wordCount) {
      // Tránh duplicate
      if (!finalVocabulary.find(w => w.word.toLowerCase() === defaultWord.word.toLowerCase())) {
        finalVocabulary.push(defaultWord);
      }
    }
  }
  
  // Shuffle array for randomness
  const shuffledVocabulary = finalVocabulary.sort(() => 0.5 - Math.random());
  
  console.log(`📚 Final vocabulary summary:`);
  console.log(`- From quizzes: ${vocabularyFromQuizzes.length}`);
  console.log(`- Total words: ${shuffledVocabulary.length}`);
  console.log(`- Words: ${shuffledVocabulary.map(w => w.word).join(', ')}`);
  
  return this.create({
    user: userId,
    date: today,
    vocabularyWords: shuffledVocabulary.slice(0, wordCount),
    totalWords: wordCount
  });
};

// Static method để cập nhật streak
DailyVocabularySchema.statics.updateUserStreak = async function(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const yesterdayRecord = await this.findOne({ 
    user: userId, 
    date: yesterday,
    isCompleted: true
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayRecord = await this.findOne({ 
    user: userId, 
    date: today,
    isCompleted: true
  });
  
  let newStreak = 1;
  
  if (todayRecord) {
    if (yesterdayRecord) {
      // Nếu hôm qua cũng hoàn thành, tăng streak
      newStreak = (user.vocabularyStreak || 0) + 1;
    } else {
      // Reset streak
      newStreak = 1;
    }
    
    await User.findByIdAndUpdate(userId, { 
      vocabularyStreak: newStreak,
      lastVocabularyDate: today
    });
  }
  
  return newStreak;
};

export default mongoose.model('DailyVocabulary', DailyVocabularySchema);