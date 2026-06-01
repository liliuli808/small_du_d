package account

import (
	"anonymous-community/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterAuthRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client, cfg *config.Config) {
	h := NewHandler(db, rdb, cfg.JWTSecret)

	auth := r.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
		auth.POST("/refresh", h.Refresh)
	}
}

func RegisterUserRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb, "")

	users := r.Group("/users")
	{
		users.GET("/me", h.GetMe)
		users.PUT("/me", h.UpdateMe)
		users.PUT("/me/password", h.ChangePassword)
	}
}
