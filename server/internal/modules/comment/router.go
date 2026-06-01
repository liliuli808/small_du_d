package comment

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)

	// 帖子评论
	r.GET("/posts/:id/comments", h.List)
	r.POST("/posts/:id/comments", h.Create)
	r.DELETE("/comments/:id", h.Delete)
}
