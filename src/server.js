const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');
const categoryService = require('./services/categoryService');

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Seed system default categories if needed
  try {
    await categoryService.seedDefaultCategories();
  } catch (err) {
    console.error('[Category Seed Error]', err.message);
  }

  // Start Express Server
  const server = app.listen(config.port, () => {
    console.log(`[Server] Personal Finance Server running in ${config.env} mode on port ${config.port}`);
    console.log(`[Server] Health Check: http://localhost:${config.port}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.name}: ${err.message}`);
    console.error(err.stack);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`[Uncaught Exception] ${err.name}: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });
};

startServer();
