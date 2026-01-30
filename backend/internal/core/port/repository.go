package port

import "backend/internal/core/domain"

type UserRepository interface {
	CreateUser(user *domain.User) error
	GetByEmail(email string) (*domain.User, error)
	GetUserByID(id uint) (*domain.User, error)
	GetAllUsers() ([]domain.User, error)
	UpdateUser(user *domain.User) error
	DeleteUser(id uint) error
	SearchUsers(query string) ([]domain.User, error)
}

type RoleRepository interface {
	GetByName(name string) (*domain.Role, error)
	GetRoleByID(id uint) (*domain.Role, error)
	GetAllRoles() ([]domain.Role, error)
	CreateRole(role *domain.Role) error
	UpdateRole(role *domain.Role) error
	DeleteRole(id uint) error
	SearchRoles(query string) ([]domain.Role, error)
}

type PermissionRepository interface {
	GetPermissionByID(id uint) (*domain.Permission, error)
	GetAllPermissions() ([]domain.Permission, error)
	CreatePermission(perm *domain.Permission) error
	UpdatePermission(perm *domain.Permission) error
	DeletePermission(id uint) error
	SearchPermissions(query string) ([]domain.Permission, error)
}

type ModelRepository interface {
	CreateModel(model *domain.Model) error
	GetAllModels() ([]domain.Model, error)
	GetModelByID(id uint) (*domain.Model, error)
	UpdateModel(model *domain.Model) error
	DeleteModel(id uint) error
}

type CategoryRepository interface {
	CreateCategory(category *domain.Category) error
	GetAllCategories() ([]domain.Category, error)
	GetCategoryByID(id uint) (*domain.Category, error)
	UpdateCategory(category *domain.Category) error
	DeleteCategory(id uint) error
}

type AnimeRepository interface {
	CreateAnime(anime *domain.Anime) error
	GetAnimeByID(id uint) (*domain.Anime, error)
	GetAllAnimes() ([]domain.Anime, error)
	GetLatestAnimes(limit int) ([]domain.Anime, error)
	GetAnimesByType(animeType string, limit int) ([]domain.Anime, error)
	UpdateAnime(anime *domain.Anime) error
	DeleteAnime(id uint) error
	SearchAnimes(query string) ([]domain.Anime, error)
}

type TypeRepository interface {
	CreateType(t *domain.Type) error
	GetTypeByID(id uint) (*domain.Type, error)
	GetAllTypes() ([]domain.Type, error)
	UpdateType(t *domain.Type) error
	DeleteType(id uint) error
}

type SeasonRepository interface {
	CreateSeason(s *domain.Season) error
	GetSeasonByID(id uint) (*domain.Season, error)
	GetAllSeasons() ([]domain.Season, error)
	UpdateSeason(s *domain.Season) error
	DeleteSeason(id uint) error
}

type StudioRepository interface {
	CreateStudio(s *domain.Studio) error
	GetStudioByID(id uint) (*domain.Studio, error)
	GetAllStudios() ([]domain.Studio, error)
	UpdateStudio(s *domain.Studio) error
	DeleteStudio(id uint) error
}

type LanguageRepository interface {
	CreateLanguage(l *domain.Language) error
	GetLanguageByID(id uint) (*domain.Language, error)
	GetAllLanguages() ([]domain.Language, error)
	UpdateLanguage(l *domain.Language) error
	DeleteLanguage(id uint) error
}

type HistoryRepository interface {
	CreateHistory(history *domain.History) error
	GetUserHistory(userID uint, limit int, offset int) ([]domain.History, error)
	GetUserHistoryByType(userID uint, activityType domain.ActivityType, limit int) ([]domain.History, error)
	DeleteUserHistory(userID uint) error
	DeleteOldHistory(days int) error
}

type WatchLaterRepository interface {
	AddToWatchLater(entry *domain.WatchLater) error
	RemoveFromWatchLater(userID uint, animeID *uint, episodeID *uint) error
	GetWatchLaterByUser(userID uint) ([]domain.WatchLater, error)
	IsWatchLater(userID uint, animeID *uint, episodeID *uint) (bool, error)
}
