package comment

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

// List 获取评论列表
func (h *Handler) List(c *gin.Context) {
	postID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 40001, "参数错误")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 50 {
		limit = 50
	}
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var comments []config.Comment
	if err := h.db.Where("post_id = ? AND status = ?", postID, 0).
		Preload("User").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&comments).Error; err != nil {
		response.Error(c, 10001, "获取评论失败")
		return
	}

	response.Success(c, comments)
}

// Create 发表评论
func (h *Handler) Create(c *gin.Context) {
	userID := c.GetUint64("userID")
	postID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 40001, "参数错误")
		return
	}

	var req struct {
		Content  string `json:"content" binding:"required,min=1,max=1000"`
		ParentID uint64 `json:"parentId"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 40001, "参数错误: "+err.Error())
		return
	}

	// 检查用户状态
	var user config.User
	if err := h.db.First(&user, userID).Error; err != nil {
		response.Error(c, 20007, "用户不存在")
		return
	}
	if user.Status == 1 {
		response.Error(c, 20008, "账号已被禁言，无法评论")
		return
	}
	if user.Status == 2 {
		response.Error(c, 20009, "账号已被封禁")
		return
	}

	// 检查帖子是否存在
	var post config.Post
	if err := h.db.First(&post, postID).Error; err != nil {
		response.Error(c, 30003, "帖子不存在")
		return
	}

	comment := config.Comment{
		PostID:   postID,
		UserID:   userID,
		ParentID: req.ParentID,
		Content:  req.Content,
		Status:   0,
	}

	if err := h.db.Create(&comment).Error; err != nil {
		response.Error(c, 10001, "评论失败")
		return
	}

	// 更新帖子评论数
	h.db.Model(&post).Update("comment_count", gorm.Expr("comment_count + 1"))

	// 通知帖子作者（如果不是自己评论自己的帖子）
	if post.UserID != userID {
		notification := config.Notification{
			UserID:     post.UserID,
			Type:       2, // 评论通知
			Title:      "收到新评论",
			Content:    "有人评论了您的帖子",
			TargetType: 1,
			TargetID:   postID,
		}
		h.db.Create(&notification)
	}

	response.Success(c, comment)
}

// Delete 删除自己的评论
func (h *Handler) Delete(c *gin.Context) {
	userID := c.GetUint64("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 40001, "参数错误")
		return
	}

	var comment config.Comment
	if err := h.db.First(&comment, id).Error; err != nil {
		response.Error(c, 40002, "评论不存在")
		return
	}

	if comment.UserID != userID {
		response.Error(c, 40003, "无权删除该评论")
		return
	}

	comment.Status = 1
	comment.DeletedBy = &userID
	h.db.Save(&comment)

	// 减少帖子评论数
	h.db.Model(&config.Post{}).Where("id = ?", comment.PostID).Update("comment_count", gorm.Expr("comment_count - 1"))

	response.Success(c, nil)
}
