import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên kỹ năng là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên kỹ năng không được vượt quá 100 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  category: {
    type: String,
    required: [true, 'Danh mục kỹ năng là bắt buộc'],
    enum: ['Technical', 'Soft Skills', 'Language', 'Other'],
    default: 'Technical'
  },
  createdBy: {
    type: String,
    required: [true, 'Người tạo là bắt buộc'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Tự động tạo createdAt và updatedAt
  collection: 'skills'
});

// Index để tìm kiếm nhanh
skillSchema.index({ name: 1, createdBy: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ level: 1 });

// Virtual field để hiển thị thông tin đầy đủ
skillSchema.virtual('fullInfo').get(function() {
  return `${this.name} (${this.level}) - Tạo bởi: ${this.createdBy}`;
});

// Method để cập nhật level
skillSchema.methods.updateLevel = function(newLevel) {
  this.level = newLevel;
  return this.save();
};

// Static method để tìm skills theo người tạo
skillSchema.statics.findByCreator = function(creatorName) {
  return this.find({ createdBy: creatorName, isActive: true });
};

// Static method để tìm skills theo category
skillSchema.statics.findByCategory = function(category) {
  return this.find({ category: category, isActive: true });
};

const Skill = mongoose.model('Skill', skillSchema);

export default Skill;
