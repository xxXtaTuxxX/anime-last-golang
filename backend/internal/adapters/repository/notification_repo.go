package repository

import (
	"backend/internal/core/domain"

	"gorm.io/gorm"
)

type NotificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create adds a new notification
func (r *NotificationRepository) Create(notification *domain.Notification) error {
	return r.db.Create(notification).Error
}

// GetUserNotifications fetches unread or recent notifications for a user
func (r *NotificationRepository) GetUserNotifications(userID uint, limit int) ([]domain.Notification, error) {
	var notifications []domain.Notification
	err := r.db.Where("user_id = ?", userID).
		Order("created_at desc").
		Limit(limit).
		Find(&notifications).Error
	return notifications, err
}

// MarkRead marks a notification as read
func (r *NotificationRepository) MarkRead(id uint, userID uint) error {
	return r.db.Model(&domain.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_read", true).Error
}

// MarkAllRead marks all notifications for a user as read
func (r *NotificationRepository) MarkAllRead(userID uint) error {
	return r.db.Model(&domain.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}
