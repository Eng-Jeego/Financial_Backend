const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    console.log('[Seed Admin] Connecting to database...');
    const conn = await connectDB(2, 2000);
    if (!conn) {
      console.error('[Seed Admin] Failed to connect to database. Aborting.');
      process.exit(1);
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@personalfinance.local').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    console.log(`[Seed Admin] Checking for administrator account: ${adminEmail}`);

    let admin = await User.findOne({ email: adminEmail }).select('+password');

    if (admin) {
      console.log(`[Seed Admin] User ${adminEmail} already exists. Ensuring ADMIN role and ACTIVE status...`);
      admin.role = 'ADMIN';
      admin.status = 'ACTIVE';
      if (process.env.ADMIN_FORCE_PASSWORD === 'true') {
        admin.password = adminPassword;
      }
      await admin.save();
      console.log(`[Seed Admin] Administrator account updated: ${admin.email} (Role: ${admin.role}, Status: ${admin.status})`);
    } else {
      console.log(`[Seed Admin] Creating new administrator account: ${adminEmail}`);
      admin = await User.create({
        fullName: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        currency: 'USD',
      });
      console.log(`[Seed Admin] Administrator account created successfully: ${admin.email} (ID: ${admin._id})`);
    }

    console.log('[Seed Admin] Seed completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Admin Error]', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
