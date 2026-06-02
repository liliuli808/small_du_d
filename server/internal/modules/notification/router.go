package notification

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)

	notifications := r.Group("/notifications")
	{
		notifications.GET("", h.List)
		notifications.POST("/:id/read", h.MarkRead)
		notifications.POST("/read-all", h.MarkAllRead)
	}
}
