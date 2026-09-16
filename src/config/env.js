const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://yahyejeego1122:bbp6TnWDfhtU33gW@cluster0.s9qcq2b.mongodb.net/?appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_please_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

// Validate critical configurations
if (config.env === 'production' && config.jwtSecret === 'default_jwt_secret_please_change_in_production') {
  console.warn('WARNING: Running in production mode with default JWT_SECRET. Please configure a secure secret.');
}

module.exports = config;
