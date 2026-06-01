package moderation

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)

	mod := r.Group("/moderation")
	{
		mod.POST("/posts/:id/delete", h.DeletePost)
		mod.POST("/comments/:id/delete", h.DeleteComment)
		mod.GET("/categories/:id/reports", h.GetReports)
		mod.POST("/reports/:id/handle", h.HandleReport)
		mod.POST("/categories/:id/announcement", h.UpdateAnnouncement)
		mod.POST("/categories/:id/rules", h.UpdateRules)
		mod.GET("/logs", h.GetLogs)
	}
}
