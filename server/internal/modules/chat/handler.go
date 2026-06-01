package chat

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

// ListConversations 获取会话列表
func (h *Handler) ListConversations(c *gin.Context) {
	userID := c.GetUint64("userID")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var conversations []config.Conversation
	if err := h.db.Where("(user_a_id = ? OR user_b_id = ?) AND status = ?", userID, userID, 0).
		Order("last_message_at DESC").
		Limit(limit).Offset(offset).
		Find(&conversations).Error; err != nil {
		response.Error(c, 10001, "获取会话列表失败")
		return
	}

	response.Success(c, conversations)
}

// CreateConversation 创建或获取会话
func (h *Handler) CreateConversation(c *gin.Context) {
	userID := c.GetUint64("userID")

	var req struct {
		TargetUserID uint64 `json:"targetUserId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 50001, "参数错误")
		return
	}

	if req.TargetUserID == userID {
		response.Error(c, 50002, "不能和自己创建会话")
		return
	}

	// 检查是否已存在会话
	var conversation config.Conversation
	a, b := userID, req.TargetUserID
	if a > b {
		a, b = b, a
	}

	result := h.db.Where("user_a_id = ? AND user_b_id = ?", a, b).First(&conversation)
	if result.Error == nil {
		response.Success(c, conversation)
		return
	}

	// 创建新会话
	conversation = config.Conversation{
		UserAID: a,
		UserBID: b,
		Status:  0,
	}
	if err := h.db.Create(&conversation).Error; err != nil {
		response.Error(c, 10001, "创建会话失败")
		return
	}

	response.Success(c, conversation)
}

// GetMessages 获取消息列表
func (h *Handler) GetMessages(c *gin.Context) {
	userID := c.GetUint64("userID")
	convID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 50001, "参数错误")
		return
	}

	// 验证会话归属
	var conversation config.Conversation
	if err := h.db.First(&conversation, convID).Error; err != nil {
		response.Error(c, 50003, "会话不存在")
		return
	}
	if conversation.UserAID != userID && conversation.UserBID != userID {
		response.Error(c, 50004, "无权查看该会话")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit > 100 {
		limit = 100
	}
	cursor := c.Query("cursor")

	var messages []config.Message
	query := h.db.Where("conversation_id = ?", convID).Order("created_at DESC").Limit(limit)
	if cursor != "" {
		query = query.Where("created_at < ?", cursor)
	}

	if err := query.Find(&messages).Error; err != nil {
		response.Error(c, 10001, "获取消息失败")
		return
	}

	response.Success(c, messages)
}
