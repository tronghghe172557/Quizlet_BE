// 404
export function notFoundHandler(_req, res, _next) {
  res.status(404).json({ message: 'Not Found' });
}

// Global error handler
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Zod validation
  if (err?.issues && Array.isArray(err.issues)) {
    return res.status(400).json({ message: 'Validation error', issues: err.issues });
  }

  console.error('Error:', err);
  res.status(status).json({ message });
}

