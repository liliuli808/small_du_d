package notification

import (
	"anonymous-community/internal/config"
	"anonymous-community/internal/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Handler struct {
	db  *gorm.DB
	rdb *redis.Client
}

func NewHandler(db *gorm.DB, rdb *redis.Client) *Handler {
	return &Handler{db: db, rdb: rdb}
}

// List 获取通知列表
func (h *Handler) List(c *gin.Context) {
	userID := c.GetUint64("userID")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var notifications []config.Notification
	if err := h.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&notifications).Error; err != nil {
		response.Error(c, 10001, "获取通知失败")
		return
	}

	// 统计未读数
	var unreadCount int64
	h.db.Model(&config.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&unreadCount)

	response.Success(c, gin.H{
		"items":       notifications,
		"unreadCount": unreadCount,
	})
}

// MarkRead 标记已读
func (h *Handler) MarkRead(c *gin.Context) {
	userID := c.GetUint64("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	if err := h.db.Model(&config.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_read", true).Error; err != nil {
		response.Error(c, 10001, "标记失败")
		return
	}

	response.Success(c, nil)
}

// MarkAllRead 全部已读
func (h *Handler) MarkAllRead(c *gin.Context) {
	userID := c.GetUint64("userID")

	if err := h.db.Model(&config.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error; err != nil {
		response.Error(c, 10001, "标记失败")
		return
	}

	response.Success(c, nil)
}

// CreateNotification 创建通知（内部方法，其他模块调用）
func (h *Handler) CreateNotification(userID uint64, notifyType int8, title, content string, targetType int8, targetID uint64) error {
	notification := config.Notification{
		UserID:     userID,
		Type:       notifyType,
		Title:      title,
		Content:    content,
		TargetType: targetType,
		TargetID:   targetID,
	}
	return h.db.Create(&notification).Error
}
