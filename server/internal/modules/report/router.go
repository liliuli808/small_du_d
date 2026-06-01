package report

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

// Create 创建举报
func (h *Handler) Create(c *gin.Context) {
	userID := c.GetUint64("userID")

	var req struct {
		TargetType int8   `json:"targetType" binding:"required,oneof=1 2 3 4"`
		TargetID   uint64 `json:"targetId" binding:"required"`
		CategoryID uint64 `json:"categoryId"`
		ReasonType int8   `json:"reasonType" binding:"required"`
		ReasonText string `json:"reasonText" binding:"max=500"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误: "+err.Error())
		return
	}

	report := config.Report{
		ReporterID: userID,
		TargetType: req.TargetType,
		TargetID:   req.TargetID,
		ReasonType: req.ReasonType,
		ReasonText: req.ReasonText,
		Status:     0,
	}

	if req.CategoryID > 0 {
		report.CategoryID = &req.CategoryID
	}

	if err := h.db.Create(&report).Error; err != nil {
		response.Error(c, 10001, "举报失败")
		return
	}

	response.Success(c, nil)
}

// GetMyReports 获取我的举报记录
func (h *Handler) GetMyReports(c *gin.Context) {
	userID := c.GetUint64("userID")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var reports []config.Report
	if err := h.db.Where("reporter_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&reports).Error; err != nil {
		response.Error(c, 10001, "获取举报记录失败")
		return
	}

	response.Success(c, reports)
}

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)
	r.POST("/reports", h.Create)
	r.GET("/reports/my", h.GetMyReports)
}
