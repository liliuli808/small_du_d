package post

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)

	posts := r.Group("/posts")
	{
		posts.GET("/feed", h.Feed)
		posts.POST("", h.Create)
		posts.GET("/:id", h.Get)
		posts.DELETE("/:id", h.Delete)
	}
}
