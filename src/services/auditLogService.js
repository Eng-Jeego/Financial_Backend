const AdminAuditLog = require('../models/AdminAuditLog');

class AuditLogService {
  /**
   * Log an administrative action
   */
  async logAction({
    adminId,
    adminEmail,
    action,
    targetUserId = null,
    targetUserEmail = null,
    description,
    metadata = {},
  }) {
    try {
      // Ensure sensitive data like passwords/tokens are never logged
      const safeMetadata = { ...metadata };
      delete safeMetadata.password;
      delete safeMetadata.newPassword;
      delete safeMetadata.confirmPassword;
      delete safeMetadata.token;

      return await AdminAuditLog.create({
        adminId,
        adminEmail: adminEmail ? adminEmail.toLowerCase() : 'unknown@admin',
        action,
        targetUserId,
        targetUserEmail: targetUserEmail ? targetUserEmail.toLowerCase() : null,
        description,
        metadata: safeMetadata,
      });
    } catch (error) {
      console.error('[AuditLogService] Failed to record audit log:', error.message);
      // Non-blocking: audit log failure should not crash the primary transaction
      return null;
    }
  }

  /**
   * Fetch paginated audit logs with optional filters
   */
  async getAuditLogs({ page = 1, limit = 20, action, adminId, targetUserId, search }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (action) {
      query.action = action.toUpperCase();
    }

    if (adminId) {
      query.adminId = adminId;
    }

    if (targetUserId) {
      query.targetUserId = targetUserId;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { adminEmail: searchRegex },
        { targetUserEmail: searchRegex },
        { description: searchRegex },
      ];
    }

    const [logs, total] = await Promise.all([
      AdminAuditLog.find(query)
        .populate('adminId', 'fullName email role')
        .populate('targetUserId', 'fullName email role status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AdminAuditLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }
}

module.exports = new AuditLogService();
