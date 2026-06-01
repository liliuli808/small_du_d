package category

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)

	cats := r.Group("/categories")
	{
		cats.GET("", h.List)
		cats.GET("/:id", h.Get)
		cats.GET("/:id/posts", h.GetPosts)
		cats.GET("/:id/moderators", h.GetModerators)
	}
}
