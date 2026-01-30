package handler

import (
	"backend/internal/core/domain"
	"backend/internal/core/service"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type EpisodeHandler struct {
	service *service.EpisodeService
}

func NewEpisodeHandler(service *service.EpisodeService) *EpisodeHandler {
	return &EpisodeHandler{service: service}
}

// sanitizeEpisode removes the hardcoded localhost:8080 prefix from image URLs
func (h *EpisodeHandler) sanitizeEpisode(e *domain.Episode) {
	if e == nil {
		return
	}
	e.Thumbnail = strings.ReplaceAll(e.Thumbnail, "http://localhost:8080", "")
	e.Banner = strings.ReplaceAll(e.Banner, "http://localhost:8080", "")
	// Also sanitize relative paths if they don't start with / but should
	if !strings.HasPrefix(e.Thumbnail, "http") && !strings.HasPrefix(e.Thumbnail, "/") && e.Thumbnail != "" {
		e.Thumbnail = "/" + e.Thumbnail
	}
	if !strings.HasPrefix(e.Banner, "http") && !strings.HasPrefix(e.Banner, "/") && e.Banner != "" {
		e.Banner = "/" + e.Banner
	}
	// Note: VideoURLs are JSON strings or external links, usually better left alone or parsed carefully if needed.
	// Assuming VideoURLs are usually external embeds or handled separately.
}

func (h *EpisodeHandler) Create(c *gin.Context) {
	var episode domain.Episode
	if err := c.ShouldBindJSON(&episode); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.service.Create(&episode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.sanitizeEpisode(&episode)
	c.JSON(http.StatusCreated, episode)
}

func (h *EpisodeHandler) GetAll(c *gin.Context) {
	// Support filtering by anime_id and episode_number via query params
	animeIDStr := c.Query("anime_id")
	episodeNumStr := c.Query("episode_number")

	// If anime_id is provided, filter by it
	if animeIDStr != "" {
		animeID, err := strconv.Atoi(animeIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid anime_id"})
			return
		}

		episodes, err := h.service.GetByAnimeID(uint(animeID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// If episode_number is also provided, filter further
		if episodeNumStr != "" {
			episodeNum, err := strconv.Atoi(episodeNumStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid episode_number"})
				return
			}

			// Find the specific episode
			for _, ep := range episodes {
				if ep.EpisodeNumber == episodeNum {
					h.sanitizeEpisode(&ep)
					c.JSON(http.StatusOK, []domain.Episode{ep})
					return
				}
			}
			c.JSON(http.StatusNotFound, gin.H{"error": "Episode not found"})
			return
		}

		for i := range episodes {
			h.sanitizeEpisode(&episodes[i])
		}
		c.JSON(http.StatusOK, episodes)
		return
	}

	// No filters, return all
	episodes, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i := range episodes {
		h.sanitizeEpisode(&episodes[i])
	}
	c.JSON(http.StatusOK, episodes)
}

func (h *EpisodeHandler) GetByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	episode, err := h.service.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Episode not found"})
		return
	}
	h.sanitizeEpisode(episode)
	c.JSON(http.StatusOK, episode)
}

func (h *EpisodeHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid episode ID"})
		return
	}
	var episode domain.Episode
	if err := c.ShouldBindJSON(&episode); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	episode.ID = uint(id)
	if err := h.service.Update(&episode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.sanitizeEpisode(&episode)
	c.JSON(http.StatusOK, episode)
}

func (h *EpisodeHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Episode deleted"})
}

func (h *EpisodeHandler) GetLatest(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	episodes, err := h.service.GetLatest(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i := range episodes {
		h.sanitizeEpisode(&episodes[i])
	}
	c.JSON(http.StatusOK, episodes)
}

func (h *EpisodeHandler) Search(c *gin.Context) {
	query := c.Query("search")
	if query == "" {
		c.JSON(http.StatusOK, []domain.Episode{})
		return
	}

	episodes, err := h.service.Search(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for i := range episodes {
		h.sanitizeEpisode(&episodes[i])
	}
	c.JSON(http.StatusOK, episodes)
}
