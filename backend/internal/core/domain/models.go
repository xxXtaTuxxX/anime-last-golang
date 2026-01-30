package domain

import (
	"time"

	"gorm.io/gorm"
)

type Permission struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Key         string    `gorm:"uniqueIndex;not null" json:"key"` // e.g., "users.create"
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Role struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Name        string       `gorm:"uniqueIndex;not null" json:"name"` // e.g., "admin"
	Permissions []Permission `gorm:"many2many:role_permissions;" json:"permissions"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"` // Hide password in JSON
	Avatar    string         `json:"avatar"`            // URL or path to avatar image
	RoleID    uint           `json:"role_id"`
	Role      Role           `json:"role"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Type struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	NameEn    string         `gorm:"not null" json:"name_en"`
	Slug      string         `gorm:"uniqueIndex;not null" json:"slug"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	UserID    *uint          `json:"user_id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Season struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	NameEn    string         `gorm:"not null" json:"name_en"`
	Slug      string         `gorm:"uniqueIndex;not null" json:"slug"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	UserID    *uint          `json:"user_id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Studio struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	NameEn    string         `gorm:"not null" json:"name_en"`
	Slug      string         `gorm:"uniqueIndex;not null" json:"slug"`
	Date      *time.Time     `json:"date"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	UserID    *uint          `json:"user_id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Language struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	NameEn    string         `gorm:"not null" json:"name_en"`
	Slug      string         `gorm:"uniqueIndex;not null" json:"slug"`
	Date      *time.Time     `json:"date"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	UserID    *uint          `json:"user_id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Model struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"not null" json:"name"`
	Title        string         `json:"title"`                // New Title field
	Path         string         `gorm:"not null" json:"path"` // Path relative to uploads/
	Image        string         `json:"image"`                // Path to preview image
	MiniBlurPath string         `json:"mini_blur"`            // Path to blurred miniature
	Category     string         `json:"category"`             // fbx, fbx+animation, animation
	Size         int64          `json:"size"`                 // Size in bytes
	Type         string         `json:"type"`                 // fbx, glb, etc.
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type Category struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"not null" json:"title"`
	TitleEn     string         `json:"title_en"`
	Name        string         `gorm:"not null" json:"name"`
	NameEn      string         `json:"name_en"`
	Slug        string         `gorm:"uniqueIndex;not null" json:"slug"`
	Description string         `json:"description"`
	Status      string         `gorm:"default:'active'" json:"status"`
	UserID      *uint          `json:"user_id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Anime struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Title         string         `gorm:"not null" json:"title"`
	TitleEn       string         `json:"title_en"`
	Description   string         `json:"description"`
	DescriptionEn string         `json:"description_en"`
	Category      string         `json:"category"` // Deprecated in favor of M2M
	Categories    []Category     `gorm:"many2many:anime_categories;" json:"categories"`
	Seasons       int            `gorm:"default:1" json:"seasons_count"` // Renamed json to avoid conflict if needed, or keep as is. Let's keep json "seasons" for count.
	SeasonID      *uint          `json:"season_id"`
	Season        Season         `json:"season"`
	StudioID      *uint          `json:"studio_id"`
	Studio        Studio         `json:"studio"`
	LanguageID    *uint          `json:"language_id"`
	LanguageRel   Language       `gorm:"foreignKey:LanguageID" json:"language_rel"` // Distinct from string Language field
	Status        string         `gorm:"default:'Ongoing'" json:"status"`
	ReleaseDate   *time.Time     `json:"release_date"`
	Rating        float64        `json:"rating"`
	Image         string         `json:"image"`
	Cover         string         `json:"cover"`
	StudioName    string         `json:"studio_name"` // Legacy/Text
	Slug          string         `json:"slug"`
	SlugEn        string         `json:"slug_en"`
	Duration      int            `json:"duration"`
	Language      string         `json:"language"` // Legacy/Text
	Trailer       string         `json:"trailer"`
	Type          string         `json:"type"`
	IsActive      bool           `gorm:"default:true" json:"is_active"`
	UserID        *uint          `json:"user_id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}
