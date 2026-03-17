const Notification = require('../models/Notification');

/**
 * Create a new in-app notification for a user
 * @param {String} userId - User ID to notify
 * @param {Object} data - Notification details
 * @param {String} data.title - Title of the notification
 * @param {String} data.message - Message content
 * @param {String} data.type - Type ('info', 'success', 'warning', 'danger')
 */
const createNotification = async (userId, { title, message, type = 'info' }) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type
    });

    await notification.save();
    console.log(`[Notification Service] Created notification for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error(`[Notification Service] Error creating notification for user ${userId}:`, error);
    // Don't throw error to avoid crashing main flow, just log it
    return null;
  }
};

module.exports = {
  createNotification
};
