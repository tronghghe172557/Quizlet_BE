import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedChoiceIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    quiz: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Quiz', 
      required: true 
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userEmail: { 
      type: String, 
      required: true 
    },
    answers: { 
      type: [AnswerSchema], 
      required: true 
    },
    score: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100
    },
    correctAnswers: { 
      type: Number, 
      required: true,
      min: 0
    },
    totalQuestions: { 
      type: Number, 
      required: true,
      min: 1
    },
    timeSpent: { 
      type: Number, // thời gian làm bài (giây)
      default: null 
    },
    submittedAt: { 
      type: Date, 
      default: Date.now 
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual để tính phần trăm điểm
SubmissionSchema.virtual('scorePercentage').get(function() {
  return Math.round((this.correctAnswers / this.totalQuestions) * 100);
});

// Index để tìm kiếm nhanh theo user và quiz
SubmissionSchema.index({ user: 1, quiz: 1 });
SubmissionSchema.index({ quiz: 1 });
SubmissionSchema.index({ user: 1 });
SubmissionSchema.index({ userEmail: 1 }); // Giữ lại để backward compatibility

// Middleware tự động populate quiz và user khi find
SubmissionSchema.pre(/^find/, function() {
  this.populate({
    path: 'quiz',
    select: 'title createdAt'
  }).populate({
    path: 'user',
    select: 'name email'
  });
});

export default mongoose.model('Submission', SubmissionSchema);