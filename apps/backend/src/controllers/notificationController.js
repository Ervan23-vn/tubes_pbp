import { query } from '../config/database.js';

/**
 * Notification Controller - Handle user notifications
 */

export async function createNotification(req, res) {
  try {
    const { 
      user_address, 
      notification_type, 
      title, 
      message, 
      item_id,
      related_data 
    } = req.body;

    // Ensure user exists
    await query(
      `INSERT INTO users_profile (wallet_address) 
       VALUES ($1) 
       ON CONFLICT (wallet_address) DO NOTHING`,
      [user_address]
    );

    const result = await query(
      `INSERT INTO notifications 
       (user_address, notification_type, title, message, item_id, related_data, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING *`,
      [
        user_address,
        notification_type,
        title,
        message,
        item_id,
        related_data ? JSON.stringify(related_data) : null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Notification created',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
}

export async function getUserNotifications(req, res) {
  try {
    const userAddress = req.user.walletAddress;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT id, notification_type, title, message, item_id, 
              is_read, read_at, created_at, related_data
       FROM notifications 
       WHERE user_address = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userAddress, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM notifications WHERE user_address = $1`,
      [userAddress]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
}

export async function markNotificationAsRead(req, res) {
  try {
    const { notification_id } = req.params;
    const userAddress = req.user.walletAddress;

    // Verify user owns this notification
    const notifResult = await query(
      `SELECT * FROM notifications WHERE id = $1`,
      [notification_id]
    );

    if (notifResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notifResult.rows[0].user_address !== userAddress) {
      return res.status(403).json({
        success: false,
        message: 'Cannot mark other user notifications'
      });
    }

    const result = await query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [notification_id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
}

export async function getUnreadNotificationCount(req, res) {
  try {
    const userAddress = req.user.walletAddress;

    const result = await query(
      `SELECT COUNT(*) as unread_count 
       FROM notifications 
       WHERE user_address = $1 AND is_read = FALSE`,
      [userAddress]
    );

    res.json({
      success: true,
      unread_count: parseInt(result.rows[0].unread_count)
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
}
