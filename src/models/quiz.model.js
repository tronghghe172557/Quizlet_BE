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
    model: { type: String, default: 'gemini-1.5-flash' },
    questions: { type: [QuestionSchema], required: true },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
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

