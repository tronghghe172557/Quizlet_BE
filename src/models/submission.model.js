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
SubmissionSchema.index({ userEmail: 1, quiz: 1 });
SubmissionSchema.index({ quiz: 1 });
SubmissionSchema.index({ userEmail: 1 });

export default mongoose.model('Submission', SubmissionSchema);