package like

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)

	r.POST("/posts/:id/like", h.Like)
	r.DELETE("/posts/:id/like", h.Like) // 取消点赞用同一handler
	r.POST("/comments/:id/like", h.LikeComment)
	r.DELETE("/comments/:id/like", h.LikeComment)
}
