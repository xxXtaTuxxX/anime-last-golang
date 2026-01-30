package service

import (
	"backend/internal/adapters/repository"
	"backend/internal/core/domain"
)

type EpisodeService struct {
	repo *repository.SQLiteRepository
}

func NewEpisodeService(repo *repository.SQLiteRepository) *EpisodeService {
	return &EpisodeService{repo: repo}
}

func (s *EpisodeService) Create(episode *domain.Episode) error {
	return s.repo.CreateEpisode(episode)
}

func (s *EpisodeService) GetAll() ([]domain.Episode, error) {
	return s.repo.GetAllEpisodes()
}

func (s *EpisodeService) GetLatest(limit int) ([]domain.Episode, error) {
	return s.repo.GetLatestEpisodes(limit)
}

func (s *EpisodeService) GetByID(id uint) (*domain.Episode, error) {
	return s.repo.GetEpisodeByID(id)
}

func (s *EpisodeService) GetByAnimeID(animeID uint) ([]domain.Episode, error) {
	return s.repo.GetEpisodesByAnimeID(animeID)
}

func (s *EpisodeService) Update(episode *domain.Episode) error {
	return s.repo.UpdateEpisode(episode)
}

func (s *EpisodeService) Delete(id uint) error {
	return s.repo.DeleteEpisode(id)
}

func (s *EpisodeService) Search(query string) ([]domain.Episode, error) {
	return s.repo.SearchEpisodes(query)
}
