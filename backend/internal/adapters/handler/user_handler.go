package handler

import (
	"backend/internal/core/domain"
	"backend/internal/core/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) GetAll(c *gin.Context) {
	query := c.Query("q")
	var users []domain.User
	var err error

	if query != "" {
		users, err = h.service.Search(query)
	} else {
		users, err = h.service.GetAll()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	RoleID   uint   `json:"role_id" binding:"required"`
}

func (h *UserHandler) Create(c *gin.Context) {
	name := c.PostForm("name")
	email := c.PostForm("email")
	password := c.PostForm("password")
	roleIDStr := c.PostForm("role_id")
	roleID, _ := strconv.Atoi(roleIDStr)

	var avatarPath string
	file, err := c.FormFile("avatar")
	if err == nil {
		filename := strconv.FormatInt(int64(c.Writer.Status()), 10) + "_" + file.Filename // Simple unique name
		// In production use UUID or similar
		dst := "uploads/avatars/" + filename
		if err := c.SaveUploadedFile(file, dst); err == nil {
			avatarPath = "/uploads/avatars/" + filename
		}
	}

	if err := h.service.Create(name, email, password, uint(roleID), avatarPath); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

func (h *UserHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	name := c.PostForm("name")
	email := c.PostForm("email")
	roleIDStr := c.PostForm("role_id")
	roleID, _ := strconv.Atoi(roleIDStr)

	var avatarPath string
	file, err := c.FormFile("avatar")
	if err == nil {
		filename := strconv.FormatInt(int64(id), 10) + "_" + file.Filename
		dst := "uploads/avatars/" + filename
		if err := c.SaveUploadedFile(file, dst); err == nil {
			avatarPath = "/uploads/avatars/" + filename
		}
	}

	// We need to pass avatarPath to Update. If empty, service logic should decide whether to keep old one or clear it.
	// For simplicity, let's assume if empty we don't update it, or we need a way to clear it.
	// We'll update service signature shortly.
	password := c.PostForm("password")
	if err := h.service.Update(uint(id), name, email, password, uint(roleID), avatarPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Fetch updated user to return
	updatedUser, err := h.service.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User updated but failed to fetch details"})
		return
	}

	c.JSON(http.StatusOK, updatedUser)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
