package category

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

// List 获取分区列表
func (h *Handler) List(c *gin.Context) {
	var categories []config.Category
	if err := h.db.Where("status = ?", 0).Order("sort_weight DESC, id ASC").Find(&categories).Error; err != nil {
		response.Error(c, 10001, "获取分区列表失败")
		return
	}

	response.Success(c, categories)
}

// Get 获取分区详情
func (h *Handler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var category config.Category
	if err := h.db.First(&category, id).Error; err != nil {
		response.Error(c, 20009, "分区不存在")
		return
	}

	response.Success(c, category)
}

// GetPosts 获取分区帖子列表
func (h *Handler) GetPosts(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 50 {
		limit = 50
	}
	cursor := c.Query("cursor")

	var posts []config.Post
	query := h.db.Where("category_id = ? AND status = ?", id, 0).
		Preload("User").
		Preload("Images").
		Order("created_at DESC").
		Limit(limit)

	if cursor != "" {
		query = query.Where("created_at < ?", cursor)
	}

	if err := query.Find(&posts).Error; err != nil {
		response.Error(c, 10001, "获取帖子列表失败")
		return
	}

	var nextCursor string
	hasMore := len(posts) == limit
	if len(posts) > 0 {
		nextCursor = posts[len(posts)-1].CreatedAt.Format("2006-01-02T15:04:05")
	}

	response.Page(c, posts, nextCursor, hasMore)
}

// GetModerators 获取分区负责人
func (h *Handler) GetModerators(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var moderators []config.CategoryModerator
	if err := h.db.Where("category_id = ? AND status = ?", id, 0).
		Preload("User").
		Find(&moderators).Error; err != nil {
		response.Error(c, 10001, "获取负责人失败")
		return
	}

	response.Success(c, moderators)
}
