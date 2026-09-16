const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./env');

// Set reliable public DNS servers for MongoDB+srv SRV lookups to prevent querySrv ECONNREFUSED
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('[DNS Warning] Could not set custom DNS servers:', err.message);
}

const connectDB = async (retries = 5, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(config.mongoUri, {
        autoIndex: config.env !== 'production',
        serverSelectionTimeoutMS: 10000,
      });

      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.error(`[Database Error] (Attempt ${i}/${retries}) Failed to connect to MongoDB: ${error.message}`);
      if (i < retries) {
        console.log(`[Database] Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[Database Error] All connection attempts failed. Check MONGODB_URI and Atlas IP Access.');
      }
    }
  }
};

module.exports = connectDB;
