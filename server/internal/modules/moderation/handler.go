package moderation

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

// isModerator 检查用户是否为分区负责人或副负责人
func (h *Handler) isModerator(userID, categoryID uint64) (bool, int8) {
	var moderator config.CategoryModerator
	if err := h.db.Where("user_id = ? AND category_id = ? AND status = ?", userID, categoryID, 0).
		First(&moderator).Error; err != nil {
		return false, 0
	}
	return true, moderator.Role
}

// DeletePost 负责人删除帖子
func (h *Handler) DeletePost(c *gin.Context) {
	userID := c.GetUint64("userID")
	postID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 30001, "参数错误")
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
		Remark string `json:"remark"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 30001, "请填写删除原因")
		return
	}

	// 获取帖子信息
	var post config.Post
	if err := h.db.First(&post, postID).Error; err != nil {
		response.Error(c, 30003, "帖子不存在")
		return
	}

	// 检查是否为该分区负责人
	isMod, role := h.isModerator(userID, post.CategoryID)
	if !isMod {
		response.Error(c, 30005, "无权删除该帖子")
		return
	}

	// 删除帖子
	post.Status = 1
	post.DeletedBy = &userID
	post.DeleteReason = req.Reason
	h.db.Save(&post)

	// 记录操作日志
	log := config.ModerationLog{
		OperatorID:   userID,
		OperatorRole: role,
		CategoryID:   &post.CategoryID,
		ActionType:   1, // 删除帖子
		TargetType:   1, // 帖子
		TargetID:     postID,
		Reason:       req.Reason,
		Remark:       req.Remark,
	}
	h.db.Create(&log)

	response.Success(c, nil)
}

// DeleteComment 负责人删除评论
func (h *Handler) DeleteComment(c *gin.Context) {
	userID := c.GetUint64("userID")
	commentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 40001, "参数错误")
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
		Remark string `json:"remark"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 40001, "请填写删除原因")
		return
	}

	// 获取评论和关联帖子
	var comment config.Comment
	if err := h.db.First(&comment, commentID).Error; err != nil {
		response.Error(c, 40002, "评论不存在")
		return
	}

	var post config.Post
	if err := h.db.First(&post, comment.PostID).Error; err != nil {
		response.Error(c, 30003, "帖子不存在")
		return
	}

	// 检查权限
	isMod, role := h.isModerator(userID, post.CategoryID)
	if !isMod {
		response.Error(c, 40003, "无权删除该评论")
		return
	}

	comment.Status = 1
	comment.DeletedBy = &userID
	h.db.Save(&comment)

	// 记录日志
	log := config.ModerationLog{
		OperatorID:   userID,
		OperatorRole: role,
		CategoryID:   &post.CategoryID,
		ActionType:   1, // 删除
		TargetType:   2, // 评论
		TargetID:     commentID,
		Reason:       req.Reason,
		Remark:       req.Remark,
	}
	h.db.Create(&log)

	response.Success(c, nil)
}

// GetReports 获取本分区的举报列表
func (h *Handler) GetReports(c *gin.Context) {
	userID := c.GetUint64("userID")
	categoryID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	// 检查权限
	isMod, _ := h.isModerator(userID, categoryID)
	if !isMod {
		response.Error(c, 30005, "无权查看")
		return
	}

	status, _ := strconv.Atoi(c.DefaultQuery("status", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var reports []config.Report
	query := h.db.Where("category_id = ?", categoryID)
	if status >= 0 {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&reports).Error; err != nil {
		response.Error(c, 10001, "获取举报列表失败")
		return
	}

	response.Success(c, reports)
}

// HandleReport 处理举报
func (h *Handler) HandleReport(c *gin.Context) {
	userID := c.GetUint64("userID")
	reportID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var req struct {
		Status int8   `json:"status" binding:"required"` // 1:已处理 2:驳回
		Remark string `json:"remark"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	// 获取举报信息
	var report config.Report
	if err := h.db.First(&report, reportID).Error; err != nil {
		response.Error(c, 20010, "举报不存在")
		return
	}

	// 检查权限
	isMod, role := h.isModerator(userID, *report.CategoryID)
	if !isMod {
		response.Error(c, 30005, "无权处理")
		return
	}

	report.Status = req.Status
	report.HandlerID = &userID
	report.HandlerRole = role
	h.db.Save(&report)

	// 记录日志
	actionType := int8(4) // 处理举报
	log := config.ModerationLog{
		OperatorID:   userID,
		OperatorRole: role,
		CategoryID:   report.CategoryID,
		ActionType:   actionType,
		TargetType:   3, // 举报
		TargetID:     reportID,
		Reason:       "处理举报",
		Remark:       req.Remark,
	}
	h.db.Create(&log)

	response.Success(c, nil)
}

// UpdateAnnouncement 编辑分区公告
func (h *Handler) UpdateAnnouncement(c *gin.Context) {
	userID := c.GetUint64("userID")
	categoryID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var req struct {
		Announcement string `json:"announcement" binding:"required,max=5000"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "请填写公告内容")
		return
	}

	// 检查权限
	isMod, role := h.isModerator(userID, categoryID)
	if !isMod {
		response.Error(c, 30005, "无权编辑该分区公告")
		return
	}

	// 更新公告
	if err := h.db.Model(&config.Category{}).Where("id = ?", categoryID).
		Update("announcement", req.Announcement).Error; err != nil {
		response.Error(c, 10001, "更新公告失败")
		return
	}

	// 记录日志
	log := config.ModerationLog{
		OperatorID:   userID,
		OperatorRole: role,
		CategoryID:   &categoryID,
		ActionType:   5, // 编辑公告
		TargetType:   4, // 分区
		TargetID:     categoryID,
		Reason:       "编辑分区公告",
	}
	h.db.Create(&log)

	response.Success(c, nil)
}

// UpdateRules 编辑分区规则
func (h *Handler) UpdateRules(c *gin.Context) {
	userID := c.GetUint64("userID")
	categoryID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var req struct {
		Rules string `json:"rules" binding:"required,max=10000"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "请填写规则内容")
		return
	}

	// 检查权限：只有负责人可以编辑规则，副负责人不行
	isMod, role := h.isModerator(userID, categoryID)
	if !isMod || role != 1 {
		response.Error(c, 30005, "只有负责人可以编辑分区规则")
		return
	}

	// 更新规则
	if err := h.db.Model(&config.Category{}).Where("id = ?", categoryID).
		Update("rules", req.Rules).Error; err != nil {
		response.Error(c, 10001, "更新规则失败")
		return
	}

	// 记录日志
	log := config.ModerationLog{
		OperatorID:   userID,
		OperatorRole: role,
		CategoryID:   &categoryID,
		ActionType:   6, // 编辑规则
		TargetType:   4, // 分区
		TargetID:     categoryID,
		Reason:       "编辑分区规则",
	}
	h.db.Create(&log)

	response.Success(c, nil)
}

// GetLogs 获取操作日志
func (h *Handler) GetLogs(c *gin.Context) {
	userID := c.GetUint64("userID")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var logs []config.ModerationLog
	if err := h.db.Where("operator_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&logs).Error; err != nil {
		response.Error(c, 10001, "获取日志失败")
		return
	}

	response.Success(c, logs)
}
