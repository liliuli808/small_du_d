package post

import (
	"anonymous-community/internal/config"
	"anonymous-community/internal/pkg/response"
	"net/http"
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

// Feed 首页信息流
func (h *Handler) Feed(c *gin.Context) {
	sort := c.DefaultQuery("sort", "latest") // latest, hot
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 50 {
		limit = 50
	}
	cursor := c.Query("cursor")

	var posts []config.Post
	query := h.db.Where("status = ?", 0).
		Preload("User").
		Preload("Images").
		Preload("Category").
		Limit(limit)

	if sort == "hot" {
		query = query.Order("hot_score DESC, created_at DESC")
		if cursor != "" {
			score, _ := strconv.ParseFloat(cursor, 64)
			query = query.Where("hot_score < ?", score)
		}
	} else {
		query = query.Order("created_at DESC")
		if cursor != "" {
			query = query.Where("created_at < ?", cursor)
		}
	}

	if err := query.Find(&posts).Error; err != nil {
		response.Error(c, 10001, "获取信息流失败")
		return
	}

	var nextCursor string
	hasMore := len(posts) == limit
	if len(posts) > 0 {
		if sort == "hot" {
			nextCursor = strconv.FormatFloat(posts[len(posts)-1].HotScore, 'f', -1, 64)
		} else {
			nextCursor = posts[len(posts)-1].CreatedAt.Format("2006-01-02T15:04:05")
		}
	}

	response.Page(c, posts, nextCursor, hasMore)
}

// Create 创建帖子
func (h *Handler) Create(c *gin.Context) {
	userID := c.GetUint64("userID")

	var req struct {
		CategoryID uint64               `json:"categoryId" binding:"required"`
		Content    string               `json:"content" binding:"required,min=1,max=5000"`
		Images     []config.PostImage   `json:"images"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 30001, "参数错误: "+err.Error())
		return
	}

	// 检查分区是否存在
	var category config.Category
	if err := h.db.First(&category, req.CategoryID).Error; err != nil {
		response.Error(c, 30002, "分区不存在")
		return
	}

	post := config.Post{
		UserID:     userID,
		CategoryID: req.CategoryID,
		Content:    req.Content,
		Status:     0,
		Images:     req.Images,
	}

	if err := h.db.Create(&post).Error; err != nil {
		response.Error(c, 10001, "发布失败")
		return
	}

	// 更新分区帖子数
	h.db.Model(&category).Update("post_count", gorm.Expr("post_count + 1"))

	response.Success(c, post)
}

// Get 获取帖子详情
func (h *Handler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 30001, "参数错误")
		return
	}

	var post config.Post
	if err := h.db.Preload("User").Preload("Images").Preload("Category").First(&post, id).Error; err != nil {
		response.Error(c, 30003, "帖子不存在")
		return
	}

	if post.Status != 0 {
		response.Error(c, 30004, "帖子已被删除或隐藏")
		return
	}

	// 增加浏览数
	h.db.Model(&post).Update("view_count", gorm.Expr("view_count + 1"))

	response.Success(c, post)
}

// Delete 删除自己的帖子
func (h *Handler) Delete(c *gin.Context) {
	userID := c.GetUint64("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 30001, "参数错误")
		return
	}

	var post config.Post
	if err := h.db.First(&post, id).Error; err != nil {
		response.Error(c, 30003, "帖子不存在")
		return
	}

	// 只能删除自己的帖子
	if post.UserID != userID {
		response.Error(c, 30005, "无权删除该帖子")
		return
	}

	post.Status = 1
	post.DeletedBy = &userID
	now := config.Post{}.DeletedAt // workaround for time
	_ = now
	h.db.Save(&post)

	response.Success(c, nil)
}
