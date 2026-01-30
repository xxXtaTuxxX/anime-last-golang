package handler

import (
	"backend/internal/core/domain"
	"backend/internal/core/service"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type AnimeHandler struct {
	service *service.AnimeService
}

func NewAnimeHandler(service *service.AnimeService) *AnimeHandler {
	return &AnimeHandler{service: service}
}

// sanitizeAnime removes the hardcoded localhost:8080 prefix from image URLs
// This fixes Mixed Content errors when serving over HTTPS
func (h *AnimeHandler) sanitizeAnime(a *domain.Anime) {
	if a == nil {
		return
	}
	a.Image = strings.ReplaceAll(a.Image, "http://localhost:8080", "")
	a.Cover = strings.ReplaceAll(a.Cover, "http://localhost:8080", "")
	// Also sanitize relative paths if they don't start with / but should (optional safeguard)
	if !strings.HasPrefix(a.Image, "http") && !strings.HasPrefix(a.Image, "/") && a.Image != "" {
		a.Image = "/" + a.Image
	}
	if !strings.HasPrefix(a.Cover, "http") && !strings.HasPrefix(a.Cover, "/") && a.Cover != "" {
		a.Cover = "/" + a.Cover
	}
}

func (h *AnimeHandler) Create(c *gin.Context) {
	var anime domain.Anime
	if err := c.ShouldBindJSON(&anime); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdAnime, err := h.service.Create(&anime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.sanitizeAnime(createdAnime)
	c.JSON(http.StatusCreated, createdAnime)
}

func (h *AnimeHandler) GetAll(c *gin.Context) {
	animes, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i := range animes {
		h.sanitizeAnime(&animes[i])
	}
	c.JSON(http.StatusOK, animes)
}

func (h *AnimeHandler) GetByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	anime, err := h.service.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Anime not found"})
		return
	}
	h.sanitizeAnime(anime)
	c.JSON(http.StatusOK, anime)
}

func (h *AnimeHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var anime domain.Anime
	if err := c.ShouldBindJSON(&anime); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	anime.ID = uint(id)

	updatedAnime, err := h.service.Update(&anime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.sanitizeAnime(updatedAnime)
	c.JSON(http.StatusOK, updatedAnime)
}

func (h *AnimeHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Anime deleted"})
}

func (h *AnimeHandler) GetLatest(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	animes, err := h.service.GetLatest(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i := range animes {
		h.sanitizeAnime(&animes[i])
	}
	c.JSON(http.StatusOK, animes)
}

func (h *AnimeHandler) GetByType(c *gin.Context) {
	animeType := c.Param("type")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "0"))
	animes, err := h.service.GetByType(animeType, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i := range animes {
		h.sanitizeAnime(&animes[i])
	}
	c.JSON(http.StatusOK, animes)
}

func (h *AnimeHandler) Search(c *gin.Context) {
	query := c.Query("search")
	if query == "" {
		c.JSON(http.StatusOK, []domain.Anime{})
		return
	}

	animes, err := h.service.Search(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i := range animes {
		h.sanitizeAnime(&animes[i])
	}
	c.JSON(http.StatusOK, animes)
}
