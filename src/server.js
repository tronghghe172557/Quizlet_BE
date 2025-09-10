import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app.js';

const port = process.env.PORT || 3000;

const server = createServer(app);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  console.log('Shutting down gracefully...');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  console.error(err.stack);
  console.log('Shutting down gracefully...');
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

