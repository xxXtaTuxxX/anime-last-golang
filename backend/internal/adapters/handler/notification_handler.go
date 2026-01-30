package handler

import (
	"backend/internal/adapters/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	repo *repository.NotificationRepository
}

func NewNotificationHandler(repo *repository.NotificationRepository) *NotificationHandler {
	return &NotificationHandler{repo: repo}
}

// GetUserNotifications
func (h *NotificationHandler) GetUserNotifications(c *gin.Context) {
	userID := c.GetUint("user_id")
	limit := 20 // Default limit

	notifs, err := h.repo.GetUserNotifications(userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, notifs)
}

// MarkRead
func (h *NotificationHandler) MarkRead(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	userID := c.GetUint("user_id")
	if err := h.repo.MarkRead(uint(id), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Success"})
}

// MarkAllRead
func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	if err := h.repo.MarkAllRead(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark all as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Success"})
}
