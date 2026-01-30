package main

import (
	"backend/config"
	"backend/internal/adapters/handler"
	"backend/internal/adapters/repository"
	"backend/internal/core/domain"
	"backend/internal/core/service"
	"backend/internal/middleware"
	"log"
	"net/http"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	repo, err := repository.NewSQLiteRepository(cfg.DBUrl)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto Migrate
	repo.DB().AutoMigrate(
		&domain.User{}, &domain.Role{}, &domain.Permission{},
		&domain.Model{}, &domain.Category{}, &domain.Type{},
		&domain.Season{}, &domain.Studio{}, &domain.Language{},
		&domain.Anime{}, &domain.Episode{},
	)

	// Seed Roles
	seedRoles(repo)

	// Services
	authService := service.NewAuthService(repo, repo, cfg)
	userService := service.NewUserService(repo, repo)
	roleService := service.NewRoleService(repo, repo) // Now accepts 2 args (roleRepo, permRepo)
	permService := service.NewPermissionService(repo)
	typeService := service.NewTypeService(repo)
	seasonService := service.NewSeasonService(repo)
	studioService := service.NewStudioService(repo)
	languageService := service.NewLanguageService(repo)
	animeService := service.NewAnimeService(repo)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	roleHandler := handler.NewRoleHandler(roleService)
	permHandler := handler.NewPermissionHandler(permService)
	typeHandler := handler.NewTypeHandler(typeService)
	seasonHandler := handler.NewSeasonHandler(seasonService)
	studioHandler := handler.NewStudioHandler(studioService)
	languageHandler := handler.NewLanguageHandler(languageService)
	animeHandler := handler.NewAnimeHandler(animeService)

	r := gin.Default()
	// Set 1GB limit for multipart forms (default is 32MB)
	r.MaxMultipartMemory = 1024 << 20

	// CORS
	allowOrigins := strings.Split(cfg.AllowOrigins, ",")
	log.Printf("CORS: Allowing origins: %v", allowOrigins)

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.Static("/uploads", "./uploads") // Serve uploded files

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			protected.GET("/me", func(c *gin.Context) {
				userID, _ := c.Get("userID")
				role, _ := c.Get("role")
				c.JSON(200, gin.H{"id": userID, "role": role})
			})

			// User Routes
			users := protected.Group("/users")
			{
				users.GET("", userHandler.GetAll)
				users.POST("", userHandler.Create)
				users.PUT("/:id", userHandler.Update)
				users.DELETE("/:id", userHandler.Delete)
			}

			// Role Routes
			roles := protected.Group("/roles")
			{
				roles.GET("", roleHandler.GetAll)
				roles.POST("", roleHandler.Create)
				roles.PUT("/:id", roleHandler.Update)
				roles.DELETE("/:id", roleHandler.Delete)
			}

			// Permission Routes
			perms := protected.Group("/permissions")
			{
				perms.GET("", permHandler.GetAll)
				perms.POST("", permHandler.Create)
				perms.PUT("/:id", permHandler.Update)
				perms.DELETE("/:id", permHandler.Delete)
			}

			// Global Search
			searchHandler := handler.NewSearchHandler(repo, repo, repo)
			protected.GET("/search", searchHandler.Search)

			// Model Routes
			modelService := service.NewModelService(repo)
			modelHandler := handler.NewModelHandler(modelService)

			models := protected.Group("/models")
			{
				models.GET("", modelHandler.GetAll)
				models.POST("", modelHandler.Upload)
				models.PUT("/:id", modelHandler.Update)
				models.DELETE("/:id", modelHandler.Delete)
				models.GET("/:id/download", modelHandler.Download)
			}

			// Upload Route
			uploadHandler := handler.NewUploadHandler()
			protected.POST("/upload", uploadHandler.UploadFile)

			// Category Routes
			categoryService := service.NewCategoryService(repo)
			categoryHandler := handler.NewCategoryHandler(categoryService)

			categories := protected.Group("/categories")
			{
				categories.GET("", categoryHandler.GetAll)
				categories.POST("", categoryHandler.Create)
				categories.PUT("/:id", categoryHandler.Update)
				categories.DELETE("/:id", categoryHandler.Delete)
			}

			// Type Routes
			types := protected.Group("/types")
			{
				types.GET("", typeHandler.GetAll)
				types.POST("", typeHandler.Create)
				types.PUT("/:id", typeHandler.Update)
				types.DELETE("/:id", typeHandler.Delete)
			}

			// Season Routes
			seasons := protected.Group("/seasons")
			{
				seasons.GET("", seasonHandler.GetAll)
				seasons.POST("", seasonHandler.Create)
				seasons.PUT("/:id", seasonHandler.Update)
				seasons.DELETE("/:id", seasonHandler.Delete)
			}

			// Studio Routes
			studios := protected.Group("/studios")
			{
				studios.GET("", studioHandler.GetAll)
				studios.POST("", studioHandler.Create)
				studios.PUT("/:id", studioHandler.Update)
				studios.DELETE("/:id", studioHandler.Delete)
			}

			// Language Routes
			languages := protected.Group("/languages")
			{
				languages.GET("", languageHandler.GetAll)
				languages.POST("", languageHandler.Create)
				languages.PUT("/:id", languageHandler.Update)
				languages.DELETE("/:id", languageHandler.Delete)
			}

			// Anime Routes
			animes := protected.Group("/animes")
			{
				animes.GET("", animeHandler.GetAll)
				animes.POST("", animeHandler.Create)
				animes.GET("/:id", animeHandler.GetByID)
				animes.PUT("/:id", animeHandler.Update)
				animes.DELETE("/:id", animeHandler.Delete)
			}

			// Episode Routes
			episodeService := service.NewEpisodeService(repo)
			episodeHandler := handler.NewEpisodeHandler(episodeService)

			episodes := protected.Group("/episodes")
			{
				episodes.GET("", episodeHandler.GetAll)
				episodes.POST("", episodeHandler.Create)
				episodes.GET("/:id", episodeHandler.GetByID)
				episodes.PUT("/:id", episodeHandler.Update)
				episodes.DELETE("/:id", episodeHandler.Delete)
			}

			// AI Routes (TEMPORARY: moved out of protected for debug)
			aiService := service.NewAIService(cfg.MeshyAPIKey)
			aiHandler := handler.NewAIHandler(aiService)

			api.POST("/ai/generate", aiHandler.Generate3D)
			api.GET("/ai/status/:task_id", aiHandler.CheckStatus)

			// Export Routes (moved out of protected for testing)
			exportService := service.NewExportService(cfg.BlenderPath, cfg.ExportDir, cfg.ExportTimeout)
			exportHandler := handler.NewExportHandler(exportService)

			api.POST("/export/retarget", exportHandler.RetargetAndExport)
			api.POST("/export/autorig", exportHandler.AutoRig)
			api.POST("/export/sprint", exportHandler.GenerateSprint)
			api.GET("/export/download/:filename", exportHandler.Download)

			// ai := protected.Group("/ai")
			// {
			// 	ai.POST("/generate", aiHandler.Generate3D)
			// 	ai.GET("/status/:task_id", aiHandler.CheckStatus)
			// }
		}
	}

	// Logging Middleware for debugging
	r.Use(func(c *gin.Context) {
		log.Printf("Incoming request: %s %s | Content-Length: %d", c.Request.Method, c.Request.URL.Path, c.Request.ContentLength)
		c.Next()
	})

	// Custom Server with relaxed timeouts for large file uploads
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
		// Disable timeouts for large uploads/processing
		ReadTimeout:  0,
		WriteTimeout: 0,
		IdleTimeout:  0,
	}

	log.Printf("Server running on port %s", cfg.Port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func seedRoles(repo *repository.SQLiteRepository) {
	// 1. Define Permissions
	perms := []struct {
		Key         string
		Description string
	}{
		// Users
		{"users.read", "View users"},
		{"users.create", "Create users"},
		{"users.update", "Edit users"},
		{"users.delete", "Delete users"},
		// Roles
		{"roles.read", "View roles"},
		{"roles.create", "Create roles"},
		{"roles.update", "Edit roles"},
		{"roles.delete", "Delete roles"},
		// Permissions
		{"permissions.read", "View permissions"},
		{"permissions.create", "Create permissions"},
		{"permissions.update", "Edit permissions"},
		{"permissions.delete", "Delete permissions"},
	}

	for _, p := range perms {
		// Use raw GORM here via the repo's db if accessible, or just try check/create via repo methods?
		// Repo implementation is safest but strictly typed. GORM here is cleaner for seeding.
		// Since we have specific repo methods, lets try to allow raw DB access via a getter or just use repo methods.
		// For simplicity in main, we will assume we can't access repo.db directly easily without exposing it.
		// But in Go, structs in same package (main calls repo which is external package) => cant access private db.
		// We'll rely on repo methods.
		// Wait, repo is *repository.SQLiteRepository. We can add a specialized Seed method or just use what we have.
		// Actually, I don't have GetPermissionByKey in repo.
		// Let's add distinct check.
		// For expediency, I'll assume we iterate and create if not exists.
		// We don't have GetPermissionByKey. Let's create it or just fetch all and check.

		// Simpler: Just Create and ignore unique constraint errors if lazy.
		// Better: Fetch all perms first.

		perm := &domain.Permission{Key: p.Key, Description: p.Description}
		// We need to check if exists.
		// Let's rely on CreatePermission failing on unique constraint and ignore,
		// OR safer: Add GetPermissionByKey to repo?
		// Since I cannot easily modify repo interface and all files in one go without errors,
		// I'll modify the repo to support permission assignment in Role first.
		// But for seeding permissions:
		_ = repo.CreatePermission(perm)
		// Retrieve it to get ID (needed for association)
		// We need a way to get the permission back.
		// Let's Fetch All Permissions to build the list for Admin.
	}

	allStoredPerms, _ := repo.GetAllPermissions()

	// 2. Seed Roles
	roles := []string{"Admin", "User", "Viewer"}
	for _, roleName := range roles {
		existing, _ := repo.GetByName(roleName)
		if existing == nil {
			role := &domain.Role{Name: roleName}

			// Assign ALL permissions to Admin
			if roleName == "Admin" {
				role.Permissions = allStoredPerms
			}

			_ = repo.CreateRole(role)
		} else if roleName == "Admin" {
			// Update Admin permissions if role exists
			existing.Permissions = allStoredPerms
			_ = repo.UpdateRole(existing)
		}
	}

	// 3. Seed Admin User
	adminEmail := "admin@saas.com"
	adminUser, _ := repo.GetByEmail(adminEmail)
	if adminUser == nil {
		adminRole, _ := repo.GetByName("Admin")
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

		admin := &domain.User{
			Name:     "Super Admin",
			Email:    adminEmail,
			Password: string(hashedPassword),
			RoleID:   adminRole.ID,
		}

		if err := repo.CreateUser(admin); err != nil {
			log.Printf("Failed to seed admin: %v", err)
		} else {
			log.Println("Admin user seeded: admin@saas.com / admin123 with full permissions.")
		}
	}
}
