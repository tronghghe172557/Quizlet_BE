import { verifyAccessToken } from '../services/jwt.service.js';
import User from '../models/user.model.js';

// Middleware xác thực token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Tìm user trong database
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or inactive'
      });
    }
    
    // Attach user info to request
    req.user = user.toSafeObject();
    next();
    
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Invalid token'
    });
  }
};

// Middleware kiểm tra role admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  
  next();
};

// Middleware linh hoạt để check role - có thể truyền nhiều roles
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    
    next();
  };
};

// Middleware check owner hoặc admin (cho các resource mà user chỉ có thể truy cập của mình)
export const requireOwnerOrAdmin = (resourceUserField = 'createdBy') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    // Nếu là admin thì cho phép truy cập tất cả
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Kiểm tra xem user có phải là owner của resource không
    // Sẽ được validate trong controller với resource cụ thể
    req.requireOwnership = {
      userId: req.user._id,
      field: resourceUserField
    };
    
    next();
  };
};

// Middleware optional authentication (không bắt buộc có token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user.toSafeObject();
      }
    }
    
    next();
  } catch (error) {
    // Không trả về lỗi, chỉ tiếp tục mà không set req.user
    next();
  }
};

export default { 
  authenticate, 
  requireAdmin, 
  requireRole, 
  requireOwnerOrAdmin, 
  optionalAuth 
};