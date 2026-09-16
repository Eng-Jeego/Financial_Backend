const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      autoIndex: true, // Build indexes automatically in development
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    // In local development or during bootstrapping, provide actionable advice
    console.error('Make sure MongoDB is installed and running locally, or update MONGODB_URI in backend/.env with your connection string.');
    process.exit(1);
  }
};

module.exports = connectDB;
