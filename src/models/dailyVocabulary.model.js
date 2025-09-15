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
  
  // ENHANCED LOGIC: Lấy từ vựng từ quiz database với ưu tiên model mới nhất
  const Quiz = mongoose.model('Quiz');
  let vocabularyFromQuizzes = [];
  
  try {
    // Lấy tất cả quiz có vocabulary và shuffle random
    const quizzes = await Quiz.find({
      vocabulary: { $exists: true, $not: { $size: 0 } }
    }).limit(100);
    
    console.log(`Found ${quizzes.length} quizzes with vocabulary in database`);
    
    // Shuffle quizzes ngay từ đầu để random
    const shuffledQuizzes = quizzes.sort(() => 0.5 - Math.random());
    
    for (const quiz of shuffledQuizzes) {
      console.log(`Processing quiz: ${quiz.title} (Model: ${quiz.model}, Vocabulary: ${quiz.vocabulary?.length || 0} words)`);
      
      // SIMPLIFIED LOGIC: Lấy trực tiếp từ vocabulary array và shuffle
      if (quiz.vocabulary && Array.isArray(quiz.vocabulary) && quiz.vocabulary.length > 0) {
        // Shuffle vocabulary items ngay từ đầu
        const shuffledVocab = quiz.vocabulary.sort(() => 0.5 - Math.random());
        
        for (const vocabItem of shuffledVocab) {
          if (typeof vocabItem === 'string' && vocabItem.trim()) {
            // Parse vocabulary item (có thể có format "1.notepad" hoặc chỉ "notepad")
            let cleanWord = vocabItem.trim();
            
            // Loại bỏ số thứ tự nếu có (ví dụ: "1.notepad" -> "notepad")
            const numberPrefixMatch = cleanWord.match(/^\d+\.\s*(.+)$/);
            if (numberPrefixMatch) {
              cleanWord = numberPrefixMatch[1].trim();
            }
            
            // Validate từ vựng
            if (this.isValidWord(cleanWord)) {
              // Tránh duplicate
              if (!vocabularyFromQuizzes.find(v => v.word.toLowerCase() === cleanWord.toLowerCase())) {
                vocabularyFromQuizzes.push({
                  word: cleanWord,
                  meaning: `Nghĩa của ${cleanWord}`, // Placeholder meaning
                  pronunciation: '',
                  example: `Example with ${cleanWord}`,
                  category: quiz.questionType || 'vocabulary',
                  difficulty: this.mapEnglishLevelToDifficulty(quiz.englishLevel),
                  sourceQuiz: quiz.title,
                  sourceModel: quiz.model
                });
                
                console.log(`✅ Added word from vocabulary: ${cleanWord} (${quiz.model})`);
              }
            }
          }
          
          // Đủ từ rồi thì break
          if (vocabularyFromQuizzes.length >= wordCount * 2) break;
        }
      }
      
      if (vocabularyFromQuizzes.length >= wordCount * 2) break;
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
  
  // RANDOM COMBINATION LOGIC: Lấy random từ tất cả sources
  const finalVocabulary = [];
  
  // Shuffle tất cả từ vựng từ quiz + default words
  const allWords = [...vocabularyFromQuizzes, ...defaultWords];
  const shuffledAllWords = allWords.sort(() => 0.5 - Math.random());
  
  console.log(`📊 Word sources summary:`);
  console.log(`- From quizzes: ${vocabularyFromQuizzes.length} words`);
  console.log(`- Default words: ${defaultWords.length} words`);
  console.log(`- Total available: ${allWords.length} words`);
  
  // Lấy random words tránh duplicate
  for (const word of shuffledAllWords) {
    if (finalVocabulary.length >= wordCount) break;
    
    // Tránh duplicate
    const isDuplicate = finalVocabulary.find(w => 
      w.word.toLowerCase() === word.word.toLowerCase()
    );
    
    if (!isDuplicate) {
      finalVocabulary.push({
        word: word.word,
        meaning: word.meaning,
        pronunciation: word.pronunciation || '',
        example: word.example || `Example: ${word.word} means ${word.meaning}`,
        category: word.category || 'vocabulary',
        difficulty: word.difficulty || 'intermediate'
      });
    }
  }
  
  // Final shuffle để đảm bảo random hoàn toàn
  const finalShuffledVocabulary = finalVocabulary.sort(() => 0.5 - Math.random());
  
  console.log(`📚 Final vocabulary summary:`);
  console.log(`- Total selected: ${finalShuffledVocabulary.length}/${wordCount}`);
  console.log(`- Random selection from all sources`);
  console.log(`- Words: ${finalShuffledVocabulary.map(w => w.word).join(', ')}`);
  
  return this.create({
    user: userId,
    date: today,
    vocabularyWords: finalShuffledVocabulary.slice(0, wordCount),
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

// Helper methods cho createDailyVocabulary
DailyVocabularySchema.statics.mapEnglishLevelToDifficulty = function(englishLevel) {
  const mapping = {
    'A1': 'beginner',
    'A2': 'beginner', 
    'B1': 'intermediate',
    'B2': 'intermediate',
    'C1': 'advanced',
    'C2': 'advanced'
  };
  return mapping[englishLevel] || 'intermediate';
};

DailyVocabularySchema.statics.isValidWord = function(word) {
  // Kiểm tra từ có hợp lệ không
  if (!word || typeof word !== 'string') return false;
  word = word.trim();
  if (word.length < 2 || word.length > 50) return false; // Tăng độ dài để chấp nhận phrase
  return true; // Chấp nhận tất cả các từ vựng
};

DailyVocabularySchema.statics.isValidMeaning = function(meaning) {
  // Kiểm tra nghĩa có hợp lệ không
  if (!meaning || typeof meaning !== 'string') return false;
  meaning = meaning.trim();
  if (meaning.length < 1 || meaning.length > 100) return false;
  // Loại bỏ những nghĩa không hợp lệ
  const invalidPhrases = ['text', 'string', 'boolean', 'undefined', 'null'];
  return !invalidPhrases.some(phrase => meaning.toLowerCase().includes(phrase));
};

DailyVocabularySchema.statics.generateExample = function(word, meaning, explanation) {
  // Tạo example từ explanation hoặc tạo mới
  if (explanation && explanation.length > 10) {
    // Extract câu ví dụ từ explanation
    const exampleMatch = explanation.match(/[A-Z][^.!?]*\b${word}\b[^.!?]*[.!?]/i);
    if (exampleMatch) {
      return exampleMatch[0];
    }
    
    // Nếu explanation có hội thoại
    const dialogMatch = explanation.match(/[A-B]:\s*"[^"]*"/);
    if (dialogMatch) {
      return dialogMatch[0];
    }
  }
  
  // Tạo example đơn giản
  return `This ${word} means "${meaning}" in Vietnamese.`;
};

export default mongoose.model('DailyVocabulary', DailyVocabularySchema);