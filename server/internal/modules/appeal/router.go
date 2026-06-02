package appeal

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

// Create 提交申诉
func (h *Handler) Create(c *gin.Context) {
	userID := c.GetUint64("userID")

	var req struct {
		TargetType int8   `json:"targetType" binding:"required,oneof=1 2"`
		TargetID   uint64 `json:"targetId" binding:"required"`
		CategoryID uint64 `json:"categoryId"`
		Reason     string `json:"reason" binding:"required,min=5,max=500"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误: "+err.Error())
		return
	}

	// 校验目标是否存在
	if req.TargetType == 1 {
		var post config.Post
		if err := h.db.First(&post, req.TargetID).Error; err != nil {
			response.Error(c, 20004, "帖子不存在")
			return
		}
		// 只能申诉被删除/隐藏的帖子
		if post.Status != 1 && post.Status != 2 {
			response.Error(c, 20005, "该帖子状态不允许申诉")
			return
		}
		if post.UserID != userID {
			response.Error(c, 20006, "只能申诉自己的内容")
			return
		}
		req.CategoryID = post.CategoryID
	} else {
		var comment config.Comment
		if err := h.db.First(&comment, req.TargetID).Error; err != nil {
			response.Error(c, 20004, "评论不存在")
			return
		}
		if comment.Status != 1 {
			response.Error(c, 20005, "该评论状态不允许申诉")
			return
		}
		if comment.UserID != userID {
			response.Error(c, 20006, "只能申诉自己的内容")
			return
		}
	}

	// 检查是否已有待处理的申诉
	var existing config.Appeal
	if err := h.db.Where("user_id = ? AND target_type = ? AND target_id = ? AND status = 0",
		userID, req.TargetType, req.TargetID).First(&existing).Error; err == nil {
		response.Error(c, 20007, "已有待处理的申诉，请勿重复提交")
		return
	}

	appeal := config.Appeal{
		UserID:     userID,
		TargetType: req.TargetType,
		TargetID:   req.TargetID,
		CategoryID: nil,
		Reason:     req.Reason,
		Status:     0,
	}
	if req.CategoryID > 0 {
		appeal.CategoryID = &req.CategoryID
	}

	if err := h.db.Create(&appeal).Error; err != nil {
		response.Error(c, 10001, "提交申诉失败")
		return
	}

	response.Success(c, appeal)
}

// GetMyAppeals 获取我的申诉记录
func (h *Handler) GetMyAppeals(c *gin.Context) {
	userID := c.GetUint64("userID")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var appeals []config.Appeal
	if err := h.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&appeals).Error; err != nil {
		response.Error(c, 10001, "获取申诉记录失败")
		return
	}

	response.Success(c, appeals)
}

// GetAppealDetail 获取申诉详情
func (h *Handler) GetAppealDetail(c *gin.Context) {
	userID := c.GetUint64("userID")
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var appeal config.Appeal
	if err := h.db.First(&appeal, id).Error; err != nil {
		response.Error(c, 20004, "申诉记录不存在")
		return
	}

	if appeal.UserID != userID {
		response.Error(c, 20003, "无权查看")
		return
	}

	response.Success(c, appeal)
}

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)
	r.POST("/appeals", h.Create)
	r.GET("/appeals/my", h.GetMyAppeals)
	r.GET("/appeals/:id", h.GetAppealDetail)
}
