package notification

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	// TODO: 通知模块
	// 包括系统通知、评论通知、点赞通知、删帖通知等
}
