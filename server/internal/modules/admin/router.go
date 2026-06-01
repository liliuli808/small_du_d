package admin

import (
	"anonymous-community/internal/config"
	"anonymous-community/internal/pkg/response"
	"strconv"
	"time"

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

// ===== 用户管理 =====

// ListUsers 用户列表
func (h *Handler) ListUsers(c *gin.Context) {
	status, _ := strconv.Atoi(c.DefaultQuery("status", "-1"))
	keyword := c.Query("keyword")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var users []config.User
	query := h.db
	if status >= 0 {
		query = query.Where("status = ?", status)
	}
	if keyword != "" {
		query = query.Where("nickname LIKE ? OR username LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Model(&config.User{}).Count(&total)

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		response.Error(c, 10001, "获取用户列表失败")
		return
	}

	response.Success(c, gin.H{
		"items": users,
		"total": total,
	})
}

// UpdateUserStatus 修改用户状态
func (h *Handler) UpdateUserStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var req struct {
		Status int8 `json:"status" binding:"required,oneof=0 1 2"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	if err := h.db.Model(&config.User{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		response.Error(c, 10001, "更新失败")
		return
	}

	response.Success(c, nil)
}

// ===== 分区管理 =====

// ListCategories 分区列表
func (h *Handler) ListCategories(c *gin.Context) {
	var categories []config.Category
	if err := h.db.Order("sort_weight DESC, id ASC").Find(&categories).Error; err != nil {
		response.Error(c, 10001, "获取分区列表失败")
		return
	}
	response.Success(c, categories)
}

// CreateCategory 创建分区
func (h *Handler) CreateCategory(c *gin.Context) {
	var req struct {
		Name           string `json:"name" binding:"required,max=50"`
		Description    string `json:"description" binding:"max=500"`
		Rules          string `json:"rules"`
		AllowImage     bool   `json:"allowImage"`
		EnableChat     bool   `json:"enableChat"`
		EnableElection bool   `json:"enableElection"`
		SortWeight     int    `json:"sortWeight"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误: "+err.Error())
		return
	}

	category := config.Category{
		Name:           req.Name,
		Description:    req.Description,
		Rules:          req.Rules,
		AllowImage:     req.AllowImage,
		EnableChat:     req.EnableChat,
		EnableElection: req.EnableElection,
		SortWeight:     req.SortWeight,
		Status:         0,
	}

	if err := h.db.Create(&category).Error; err != nil {
		response.Error(c, 10001, "创建分区失败")
		return
	}

	response.Success(c, category)
}

// UpdateCategory 更新分区
func (h *Handler) UpdateCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var req struct {
		Name           string `json:"name" binding:"max=50"`
		Description    string `json:"description" binding:"max=500"`
		Rules          string `json:"rules"`
		Announcement   string `json:"announcement"`
		AllowImage     bool   `json:"allowImage"`
		EnableChat     bool   `json:"enableChat"`
		EnableElection bool   `json:"enableElection"`
		Status         int8   `json:"status"`
		SortWeight     int    `json:"sortWeight"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	updates["description"] = req.Description
	updates["rules"] = req.Rules
	updates["announcement"] = req.Announcement
	updates["allow_image"] = req.AllowImage
	updates["enable_chat"] = req.EnableChat
	updates["enable_election"] = req.EnableElection
	updates["status"] = req.Status
	updates["sort_weight"] = req.SortWeight

	if err := h.db.Model(&config.Category{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		response.Error(c, 10001, "更新分区失败")
		return
	}

	response.Success(c, nil)
}

// ===== 帖子管理 =====

// ListPosts 帖子列表
func (h *Handler) ListPosts(c *gin.Context) {
	status, _ := strconv.Atoi(c.DefaultQuery("status", "-1"))
	categoryID, _ := strconv.ParseUint(c.DefaultQuery("categoryId", "0"), 10, 64)
	keyword := c.Query("keyword")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var posts []config.Post
	query := h.db.Preload("User").Preload("Category")
	if status >= 0 {
		query = query.Where("status = ?", status)
	}
	if categoryID > 0 {
		query = query.Where("category_id = ?", categoryID)
	}
	if keyword != "" {
		query = query.Where("content LIKE ?", "%"+keyword+"%")
	}

	var total int64
	query.Model(&config.Post{}).Count(&total)

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&posts).Error; err != nil {
		response.Error(c, 10001, "获取帖子列表失败")
		return
	}

	response.Success(c, gin.H{
		"items": posts,
		"total": total,
	})
}

// DeletePost 后台删除帖子
func (h *Handler) DeletePost(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 30001, "参数错误")
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 30001, "请填写删除原因")
		return
	}

	adminID := c.GetUint64("userID")

	var post config.Post
	if err := h.db.First(&post, id).Error; err != nil {
		response.Error(c, 30003, "帖子不存在")
		return
	}

	post.Status = 1
	post.DeletedBy = &adminID
	post.DeleteReason = req.Reason
	h.db.Save(&post)

	response.Success(c, nil)
}

// ===== 负责人管理 =====

// ListModerators 负责人列表
func (h *Handler) ListModerators(c *gin.Context) {
	categoryID, _ := strconv.ParseUint(c.Query("categoryId"), 10, 64)

	var moderators []config.CategoryModerator
	query := h.db.Preload("User").Preload("Category")
	if categoryID > 0 {
		query = query.Where("category_id = ?", categoryID)
	}

	if err := query.Find(&moderators).Error; err != nil {
		response.Error(c, 10001, "获取负责人列表失败")
		return
	}

	response.Success(c, moderators)
}

// CreateModerator 任命负责人
func (h *Handler) CreateModerator(c *gin.Context) {
	var req struct {
		CategoryID uint64     `json:"categoryId" binding:"required"`
		UserID     uint64     `json:"userId" binding:"required"`
		Role       int8       `json:"role" binding:"required,oneof=1 2"`
		TermStartAt string    `json:"termStartAt"`
		TermEndAt   string    `json:"termEndAt"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误: "+err.Error())
		return
	}

	moderator := config.CategoryModerator{
		CategoryID: req.CategoryID,
		UserID:     req.UserID,
		Role:       req.Role,
		Status:     0,
		SourceType: 2, // 后台任命
	}

	if req.TermStartAt != "" {
		start, _ := time.Parse(time.RFC3339, req.TermStartAt)
		moderator.TermStartAt = &start
	}
	if req.TermEndAt != "" {
		end, _ := time.Parse(time.RFC3339, req.TermEndAt)
		moderator.TermEndAt = &end
	}

	if err := h.db.Create(&moderator).Error; err != nil {
		response.Error(c, 10001, "任命失败")
		return
	}

	response.Success(c, moderator)
}

// DeleteModerator 撤销负责人
func (h *Handler) DeleteModerator(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	if err := h.db.Model(&config.CategoryModerator{}).Where("id = ?", id).Update("status", 2).Error; err != nil {
		response.Error(c, 10001, "撤销失败")
		return
	}

	response.Success(c, nil)
}

// ===== 选举管理 =====

// ListElections 选举列表
func (h *Handler) ListElections(c *gin.Context) {
	var elections []config.Election
	if err := h.db.Order("created_at DESC").Find(&elections).Error; err != nil {
		response.Error(c, 10001, "获取选举列表失败")
		return
	}
	response.Success(c, elections)
}

// CreateElection 创建选举
func (h *Handler) CreateElection(c *gin.Context) {
	var req struct {
		CategoryID     string `json:"categoryId" binding:"required"`
		Title          string `json:"title" binding:"required,max=100"`
		SignupStartAt  string `json:"signupStartAt" binding:"required"`
		SignupEndAt    string `json:"signupEndAt" binding:"required"`
		VoteStartAt    string `json:"voteStartAt" binding:"required"`
		VoteEndAt      string `json:"voteEndAt" binding:"required"`
		PublicityEndAt string `json:"publicityEndAt" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误: "+err.Error())
		return
	}

	categoryID, _ := strconv.ParseUint(req.CategoryID, 10, 64)
	signupStart, _ := time.Parse(time.RFC3339, req.SignupStartAt)
	signupEnd, _ := time.Parse(time.RFC3339, req.SignupEndAt)
	voteStart, _ := time.Parse(time.RFC3339, req.VoteStartAt)
	voteEnd, _ := time.Parse(time.RFC3339, req.VoteEndAt)
	publicityEnd, _ := time.Parse(time.RFC3339, req.PublicityEndAt)

	election := config.Election{
		CategoryID:     categoryID,
		Title:          req.Title,
		Status:         1, // 报名中
		SignupStartAt:  &signupStart,
		SignupEndAt:    &signupEnd,
		VoteStartAt:    &voteStart,
		VoteEndAt:      &voteEnd,
		PublicityEndAt: &publicityEnd,
	}

	if err := h.db.Create(&election).Error; err != nil {
		response.Error(c, 10001, "创建选举失败")
		return
	}

	response.Success(c, election)
}

// FinishElection 结束选举并自动任命负责人
func (h *Handler) FinishElection(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	// 获取选举
	var election config.Election
	if err := h.db.First(&election, id).Error; err != nil {
		response.Error(c, 60001, "选举不存在")
		return
	}

	// 只能结束投票中或公示中的选举
	if election.Status != 2 && election.Status != 3 {
		response.Error(c, 60009, "当前选举状态不允许结束")
		return
	}

	// 获取候选人，按票数排序
	var candidates []config.ElectionCandidate
	if err := h.db.Where("election_id = ? AND status = ?", id, 1).
		Order("vote_count DESC, created_at ASC").
		Find(&candidates).Error; err != nil {
		response.Error(c, 10001, "获取候选人失败")
		return
	}

	if len(candidates) == 0 {
		response.Error(c, 60010, "没有有效候选人，无法任命")
		return
	}

	// 开始事务
	tx := h.db.Begin()

	// 卸任该分区所有现任负责人和副负责人
	if err := tx.Model(&config.CategoryModerator{}).
		Where("category_id = ? AND status = ?", election.CategoryID, 0).
		Update("status", 2).Error; err != nil {
		tx.Rollback()
		response.Error(c, 10001, "卸任前任负责人失败")
		return
	}

	// 任命新负责人（票数最高者）
	chief := config.CategoryModerator{
		CategoryID: election.CategoryID,
		UserID:     candidates[0].UserID,
		Role:       1, // 负责人
		Status:     0, // 在任
		SourceType: 1, // 选举产生
		SourceID:   &id,
	}
	if err := tx.Create(&chief).Error; err != nil {
		tx.Rollback()
		response.Error(c, 10001, "任命负责人失败")
		return
	}

	// 任命副负责人（票数第2、3名，最多2名）
	deputyCount := 0
	var deputies []config.CategoryModerator
	for i := 1; i < len(candidates) && i <= 2; i++ {
		deputy := config.CategoryModerator{
			CategoryID: election.CategoryID,
			UserID:     candidates[i].UserID,
			Role:       2, // 副负责人
			Status:     0, // 在任
			SourceType: 1, // 选举产生
			SourceID:   &id,
		}
		if err := tx.Create(&deputy).Error; err != nil {
			tx.Rollback()
			response.Error(c, 10001, "任命副负责人失败")
			return
		}
		deputies = append(deputies, deputy)
		deputyCount++
	}

	// 更新选举状态为已结束
	now := time.Now()
	if err := tx.Model(&config.Election{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     4,
		"updated_at": now,
	}).Error; err != nil {
		tx.Rollback()
		response.Error(c, 10001, "更新选举状态失败")
		return
	}

	tx.Commit()

	response.Success(c, gin.H{
		"election":  election,
		"chief":     chief,
		"deputies":  deputies,
		"deputyCount": deputyCount,
	})
}

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)

	// 用户管理
	r.GET("/users", h.ListUsers)
	r.PATCH("/users/:id/status", h.UpdateUserStatus)

	// 分区管理
	r.GET("/categories", h.ListCategories)
	r.POST("/categories", h.CreateCategory)
	r.PUT("/categories/:id", h.UpdateCategory)

	// 帖子管理
	r.GET("/posts", h.ListPosts)
	r.POST("/posts/:id/delete", h.DeletePost)

	// 负责人管理
	r.GET("/moderators", h.ListModerators)
	r.POST("/moderators", h.CreateModerator)
	r.DELETE("/moderators/:id", h.DeleteModerator)

	// 选举管理
	r.GET("/elections", h.ListElections)
	r.POST("/elections", h.CreateElection)
	r.POST("/elections/:id/finish", h.FinishElection)
}
