import mongoose from 'mongoose';

const ChoiceSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    choices: { type: [ChoiceSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
    explanation: { type: String },
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    sourceText: { type: String, required: true },
    model: { type: String, default: 'gemini-2.0-flash' },
    questions: { type: [QuestionSchema], required: true },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    sharedWith: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    // Quiz metadata fields
    questionCount: { 
      type: Number, 
      required: true 
    },
    questionType: { 
      type: String, 
      enum: ['vocabulary', 'grammar', 'reading', 'conversation', 'mixed'],
      required: true 
    },
    choicesPerQuestion: { 
      type: Number, 
      default: 4,
      min: 2,
      max: 6
    },
    vocabulary: [{ 
      type: String,
      trim: true
    }],
    englishLevel: { 
      type: String, 
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      required: true 
    },
    displayLanguage: { 
      type: String, 
      enum: ['vietnamese', 'english', 'mixed'],
      default: 'vietnamese' 
    },
    note: { 
      type: String, 
      default: 'mỗi câu có đúng 1 đáp án đúng' 
    },
    promptExtension: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: null
    }
  },
  { timestamps: true }
);

// Middleware tự động populate createdBy khi find
QuizSchema.pre(/^find/, function() {
  this.populate({
    path: 'createdBy',
    select: '-password -refreshToken -__v -isActive -role'
  });
});

export default mongoose.model('Quiz', QuizSchema);

