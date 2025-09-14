import { z } from 'zod';
import User from '../models/user.model.js';
import { generateTokens, verifyRefreshToken } from '../services/jwt.service.js';

// Validation schemas
const RegisterSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  name: z.string().min(1, 'Tên không được để trống').max(50, 'Tên không được vượt quá 50 ký tự'),
});

const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token không được để trống'),
});

// Đăng ký user mới
export async function register(req, res, next) {
  try {
    const { email, password, name } = RegisterSchema.parse(req.body);
    
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email đã được sử dụng'
      });
    }
    
    // Tạo user mới
    const user = await User.create({
      email,
      password,
      name
    });
    
    // Tạo tokens
    const tokens = generateTokens({ 
      userId: user._id, 
      email: user.email,
      role: user.role 
    });
    
    // Lưu refresh token vào database
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Đăng ký thành công',
      data: {
        user: user.toSafeObject(),
        ...tokens
      }
    });
    
  } catch (err) {
    next(err);
  }
}

// Đăng nhập
export async function login(req, res, next) {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    
    // Tìm user và include password để so sánh
    const user = await User.findOne({ email, isActive: true }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Email hoặc mật khẩu không đúng'
      });
    }
    
    // Tạo tokens
    const tokens = generateTokens({ 
      userId: user._id, 
      email: user.email,
      role: user.role 
    });
    
    // Lưu refresh token vào database
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Đăng nhập thành công',
      data: {
        user: user.toSafeObject(),
        ...tokens
      }
    });
    
  } catch (err) {
    next(err);
  }
}

// Refresh access token
export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = RefreshTokenSchema.parse(req.body);
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Tìm user và kiểm tra refresh token trong database
    const user = await User.findById(decoded.userId).select('+refreshToken');
    
    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }
    
    // Tạo tokens mới
    const tokens = generateTokens({ 
      userId: user._id, 
      email: user.email,
      role: user.role 
    });
    
    // Cập nhật refresh token mới
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: tokens
    });
    
  } catch (err) {
    next(err);
  }
}

// Đăng xuất
export async function logout(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      // Xóa refresh token
      user.refreshToken = undefined;
      await user.save();
    }
    
    res.json({
      status: 'success',
      message: 'Đăng xuất thành công'
    });
    
  } catch (err) {
    next(err);
  }
}

// Lấy thông tin user hiện tại
export async function getProfile(req, res, next) {
  try {
    res.json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (err) {
    next(err);
  }
}

// Cập nhật profile
export async function updateProfile(req, res, next) {
  try {
    const UpdateProfileSchema = z.object({
      name: z.string().min(1, 'Tên không được để trống').max(50, 'Tên không được vượt quá 50 ký tự').optional(),
    });
    
    const { name } = UpdateProfileSchema.parse(req.body);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User không tồn tại'
      });
    }
    
    if (name) user.name = name;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Cập nhật profile thành công',
      data: {
        user: user.toSafeObject()
      }
    });
    
  } catch (err) {
    next(err);
  }
}

export default { 
  register, 
  login, 
  refreshToken, 
  logout, 
  getProfile, 
  updateProfile 
};