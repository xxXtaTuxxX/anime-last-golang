package domain

import (
	"encoding/json"
	"time"
)

// NotificationType defines the type of notification
type NotificationType string

const (
	NotificationTypeReply   NotificationType = "reply"
	NotificationTypeLike    NotificationType = "like"
	NotificationTypeSystem  NotificationType = "system"
	NotificationTypeNewPost NotificationType = "new_post" // New anime/episode
)

// Notification represents a user notification
type Notification struct {
	ID        uint             `json:"id" gorm:"primaryKey"`
	UserID    uint             `json:"user_id" gorm:"not null"` // Recipient
	Type      NotificationType `json:"type" gorm:"size:50;not null"`
	Data      json.RawMessage  `json:"data" gorm:"type:json"` // Flexible payload (e.g. { "comment_id": 123, "actor_name": "John" })
	IsRead    bool             `json:"is_read" gorm:"default:false"`
	CreatedAt time.Time        `json:"created_at"`
}
