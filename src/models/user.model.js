import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false // Không trả về password khi query
    },
    name: {
      type: String,
      required: [true, 'Tên là bắt buộc'],
      trim: true,
      maxlength: [50, 'Tên không được vượt quá 50 ký tự']
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    refreshToken: {
      type: String,
      select: false
    },
    // Thống kê học tập
    vocabularyStreak: {
      type: Number,
      default: 0
    },
    lastVocabularyDate: {
      type: Date
    },
    totalQuizzesCompleted: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    learningPreferences: {
      dailyWordGoal: {
        type: Number,
        default: 10
      },
      reminderTime: {
        type: String,
        default: '09:00' // Format: HH:MM
      },
      difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
      }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware để hash password trước khi save
UserSchema.pre('save', async function(next) {
  // Chỉ hash password nếu nó được modify
  if (!this.isModified('password')) return next();
  
  // Hash password với cost 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method để compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method để tạo user object không có sensitive data
UserSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.__v;
  return userObject;
};

export default mongoose.model('User', UserSchema);