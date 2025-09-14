// Helper functions để validate quyền truy cập resources

export const validateOwnership = (resource, req, ownerField = 'createdBy') => {
  // Nếu là admin thì luôn có quyền
  if (req.user.role === 'admin') {
    return true;
  }
  
  // Kiểm tra ownership
  const resourceOwnerId = resource[ownerField];
  const currentUserId = req.user._id;
  
  // So sánh ObjectId
  if (resourceOwnerId.toString() === currentUserId.toString()) {
    return true;
  }
  
  return false;
};

export const validateQuizAccess = (quiz, req) => {
  // Nếu là admin thì luôn có quyền
  if (req.user.role === 'admin') {
    return true;
  }
  
  // Kiểm tra ownership
  const quizOwnerId = quiz.createdBy;
  const currentUserId = req.user._id;
  
  if (quizOwnerId.toString() === currentUserId.toString()) {
    return true;
  }
  
  // Kiểm tra quiz có được chia sẻ với user không
  if (quiz.sharedWith && quiz.sharedWith.some(sharedUserId => sharedUserId.toString() === currentUserId.toString())) {
    return true;
  }
  
  return false;
};

export const checkResourcePermission = (resource, req, ownerField = 'createdBy') => {
  if (!validateOwnership(resource, req, ownerField)) {
    const error = new Error('Access denied. You can only access your own resources.');
    error.status = 403;
    throw error;
  }
};

export const checkQuizPermission = (quiz, req) => {
  if (!validateQuizAccess(quiz, req)) {
    const error = new Error('Access denied. You can only access your own quizzes or quizzes shared with you.');
    error.status = 403;
    throw error;
  }
};

// Middleware để validate ownership cho các route parameters
export const validateResourceOwnership = (Model, ownerField = 'createdBy', paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          status: 'error',
          message: 'Resource not found'
        });
      }
      
      if (!validateOwnership(resource, req, ownerField)) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only access your own resources.'
        });
      }
      
      // Attach resource to request for use in controller
      req.resource = resource;
      next();
      
    } catch (error) {
      next(error);
    }
  };
};

export default {
  validateOwnership,
  validateQuizAccess,
  checkResourcePermission,
  checkQuizPermission,
  validateResourceOwnership
};