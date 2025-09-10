import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import './config/mongoose.js';
import quizzesRouter from './routes/quizzes.routes.js';
import skillsRouter from './routes/skills.routes.js';

const app = express();

// init middlewares
app.use(morgan("dev")); // hiển thị status khi code được khởi chạy
app.use(helmet()); // giấu thông tin mình dùng gì để code
app.use(compression()); // nén băng thông
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// init routes
app.use('/api/quizzes', quizzesRouter);
app.use('/api/skills', skillsRouter);

// func middleware
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

// func handle error
app.use((error, req, res, next) => {
  let statusCode = error.status || 500;
  let message = error.message || 'Internal Server Error';

  // Handle MongoDB connection errors
  if (error.name === 'MongooseError' || error.name === 'MongoError') {
    statusCode = 503;
    message = 'Database connection error. Please try again later.';
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map(err => err.message).join(', ');
  }

  // Handle duplicate key errors
  if (error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Log error for debugging (but don't crash)
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  return res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default app;

