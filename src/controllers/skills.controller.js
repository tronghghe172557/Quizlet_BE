import Skill from '../models/skill.model.js';

// Tạo kỹ năng mới
export const createSkill = async (req, res) => {
  const { name, description, level, category, createdBy } = req.body;

  // Kiểm tra xem kỹ năng đã tồn tại cho người này chưa
  const existingSkill = await Skill.findOne({ 
    name: name.trim(), 
    createdBy: createdBy.trim() 
  });

  if (existingSkill) {
    return res.status(400).json({
      status: 'error',
      message: 'Kỹ năng này đã tồn tại cho người dùng này'
    });
  }

  const skill = new Skill({
    name: name.trim(),
    description: description?.trim(),
    level,
    category,
    createdBy: createdBy.trim()
  });

  const savedSkill = await skill.save();

  res.status(201).json({
    status: 'success',
    message: 'Tạo kỹ năng thành công',
    data: savedSkill
  });
};

// Lấy danh sách tất cả kỹ năng
export const getAllSkills = async (req, res) => {
  const { page = 1, limit = 10, category, level, createdBy, search } = req.query;

  const query = { isActive: true };

  // Lọc theo category
  if (category) {
    query.category = category;
  }

  // Lọc theo level
  if (level) {
    query.level = level;
  }

  // Lọc theo người tạo
  if (createdBy) {
    query.createdBy = { $regex: createdBy, $options: 'i' };
  }

  // Tìm kiếm theo tên
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const skills = await Skill.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Skill.countDocuments(query);

  res.json({
    status: 'success',
    data: {
      skills,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
};

// Lấy kỹ năng theo ID
export const getSkillById = async (req, res) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill || !skill.isActive) {
    return res.status(404).json({
      status: 'error',
      message: 'Không tìm thấy kỹ năng'
    });
  }

  res.json({
    status: 'success',
    data: skill
  });
};

// Lấy kỹ năng theo người tạo
export const getSkillsByCreator = async (req, res) => {
  const { creatorName } = req.params;
  const skills = await Skill.findByCreator(creatorName);

  res.json({
    status: 'success',
    data: skills
  });
};

// Lấy kỹ năng theo category
export const getSkillsByCategory = async (req, res) => {
  const { category } = req.params;
  const skills = await Skill.findByCategory(category);

  res.json({
    status: 'success',
    data: skills
  });
};

// Cập nhật kỹ năng
export const updateSkill = async (req, res) => {
  const { name, description, level, category } = req.body;

  const skill = await Skill.findById(req.params.id);

  if (!skill || !skill.isActive) {
    return res.status(404).json({
      status: 'error',
      message: 'Không tìm thấy kỹ năng'
    });
  }

  // Cập nhật các field
  if (name) skill.name = name.trim();
  if (description) skill.description = description.trim();
  if (level) skill.level = level;
  if (category) skill.category = category;

  const updatedSkill = await skill.save();

  res.json({
    status: 'success',
    message: 'Cập nhật kỹ năng thành công',
    data: updatedSkill
  });
};

// Cập nhật level kỹ năng
export const updateSkillLevel = async (req, res) => {
  const { level } = req.body;

  if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(level)) {
    return res.status(400).json({
      status: 'error',
      message: 'Level không hợp lệ'
    });
  }

  const skill = await Skill.findById(req.params.id);

  if (!skill || !skill.isActive) {
    return res.status(404).json({
      status: 'error',
      message: 'Không tìm thấy kỹ năng'
    });
  }

  const updatedSkill = await skill.updateLevel(level);

  res.json({
    status: 'success',
    message: 'Cập nhật level thành công',
    data: updatedSkill
  });
};

// Xóa mềm kỹ năng (đặt isActive = false)
export const deleteSkill = async (req, res) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill || !skill.isActive) {
    return res.status(404).json({
      status: 'error',
      message: 'Không tìm thấy kỹ năng'
    });
  }

  skill.isActive = false;
  await skill.save();

  res.json({
    status: 'success',
    message: 'Xóa kỹ năng thành công'
  });
};

// Thống kê kỹ năng
export const getSkillStats = async (req, res) => {
  const stats = await Skill.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalSkills: { $sum: 1 },
        categories: { $addToSet: '$category' },
        levels: { $addToSet: '$level' },
        creators: { $addToSet: '$createdBy' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSkills: 1,
        totalCategories: { $size: '$categories' },
        totalLevels: { $size: '$levels' },
        totalCreators: { $size: '$creators' },
        categories: 1,
        levels: 1
      }
    }
  ]);

  // Thống kê theo category
  const categoryStats = await Skill.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Thống kê theo level
  const levelStats = await Skill.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.json({
    status: 'success',
    data: {
      overview: stats[0] || {},
      categoryBreakdown: categoryStats,
      levelBreakdown: levelStats
    }
  });
};
