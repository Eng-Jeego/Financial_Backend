const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
      index: true,
    },
    adminEmail: {
      type: String,
      required: [true, 'Admin email is required'],
      lowercase: true,
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'LOGIN',
        'VIEW_USER',
        'CREATE_USER',
        'UPDATE_USER',
        'ACTIVATE_USER',
        'DEACTIVATE_USER',
        'RESET_PASSWORD',
        'DELETE_USER',
      ],
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    targetUserEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Log description is required'],
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

module.exports = AdminAuditLog;
