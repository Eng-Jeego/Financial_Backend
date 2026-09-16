const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sendSuccess } = require('./utils/apiResponse');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [config.clientUrl, 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || config.env === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);

app.use('/api', apiLimiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logger in development
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: config.env,
  }, 'Personal Finance Management API is healthy and operational');
});

// Root API information endpoint
app.get('/api', (req, res) => {
  return sendSuccess(res, {
    name: 'Personal Finance Management System API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: [
      '/api/auth',
      '/api/categories',
      '/api/incomes',
      '/api/expenses',
      '/api/budgets',
      '/api/dashboard',
      '/api/reports',
    ],
  }, 'Welcome to Personal Finance Management System API');
});

// Route imports
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Catch 404 for unhandled routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
