const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Do not return password by default in queries
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'CNY', 'BRL', 'NGN', 'ZAR', 'KES', 'GHS', 'EGP', 'AED'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Pre-save middleware to automatically hash passwords before saving.
 * Only hashes if the password field has been modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compares an entered plain text password with the hashed password in the database.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generates a signed JWT authentication token containing the user's ID.
 */
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;
