package election

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

// List 选举列表
func (h *Handler) List(c *gin.Context) {
	status, _ := strconv.Atoi(c.DefaultQuery("status", "-1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var elections []config.Election
	query := h.db
	if status >= 0 {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&elections).Error; err != nil {
		response.Error(c, 10001, "获取选举列表失败")
		return
	}

	response.Success(c, elections)
}

// Get 选举详情
func (h *Handler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var election config.Election
	if err := h.db.First(&election, id).Error; err != nil {
		response.Error(c, 60001, "选举不存在")
		return
	}

	response.Success(c, election)
}

// Signup 报名参选
func (h *Handler) Signup(c *gin.Context) {
	userID := c.GetUint64("userID")
	electionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var req struct {
		Manifesto string `json:"manifesto" binding:"required,min=10,max=2000"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 60002, "请填写竞选宣言")
		return
	}

	// 检查选举状态
	var election config.Election
	if err := h.db.First(&election, electionID).Error; err != nil {
		response.Error(c, 60001, "选举不存在")
		return
	}
	if election.Status != 1 {
		response.Error(c, 60003, "当前不在报名期")
		return
	}

	// 检查是否已报名
	var existing config.ElectionCandidate
	if err := h.db.Where("election_id = ? AND user_id = ?", electionID, userID).First(&existing).Error; err == nil {
		response.Error(c, 60004, "您已报名该选举")
		return
	}

	candidate := config.ElectionCandidate{
		ElectionID: electionID,
		UserID:     userID,
		Manifesto:  req.Manifesto,
		Status:     1,
	}

	if err := h.db.Create(&candidate).Error; err != nil {
		response.Error(c, 10001, "报名失败")
		return
	}

	response.Success(c, candidate)
}

// GetCandidates 获取候选人列表
func (h *Handler) GetCandidates(c *gin.Context) {
	electionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var candidates []config.ElectionCandidate
	if err := h.db.Where("election_id = ? AND status = ?", electionID, 1).
		Preload("User").
		Order("vote_count DESC, created_at ASC").
		Find(&candidates).Error; err != nil {
		response.Error(c, 10001, "获取候选人失败")
		return
	}

	response.Success(c, candidates)
}

// Vote 投票
func (h *Handler) Vote(c *gin.Context) {
	userID := c.GetUint64("userID")
	electionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var req struct {
		CandidateID uint64 `json:"candidateId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 60005, "请选择候选人")
		return
	}

	// 检查选举状态
	var election config.Election
	if err := h.db.First(&election, electionID).Error; err != nil {
		response.Error(c, 60001, "选举不存在")
		return
	}
	if election.Status != 2 {
		response.Error(c, 60006, "当前不在投票期")
		return
	}

	// 检查是否已投票
	var existing config.ElectionVote
	if err := h.db.Where("election_id = ? AND voter_user_id = ?", electionID, userID).First(&existing).Error; err == nil {
		response.Error(c, 60007, "您已投过票")
		return
	}

	// 创建投票记录并更新票数（事务）
	err = h.db.Transaction(func(tx *gorm.DB) error {
		vote := config.ElectionVote{
			ElectionID:  electionID,
			CandidateID: req.CandidateID,
			VoterUserID: userID,
			IP:          c.ClientIP(),
		}
		if err := tx.Create(&vote).Error; err != nil {
			return err
		}
		if err := tx.Model(&config.ElectionCandidate{}).Where("id = ?", req.CandidateID).
			Update("vote_count", gorm.Expr("vote_count + 1")).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		response.Error(c, 10001, "投票失败")
		return
	}

	response.Success(c, nil)
}

// GetResult 获取选举结果
func (h *Handler) GetResult(c *gin.Context) {
	electionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var election config.Election
	if err := h.db.First(&election, electionID).Error; err != nil {
		response.Error(c, 60001, "选举不存在")
		return
	}

	if election.Status < 3 {
		response.Error(c, 60008, "选举尚未结束")
		return
	}

	var candidates []config.ElectionCandidate
	h.db.Where("election_id = ? AND status = ?", electionID, 1).
		Preload("User").
		Order("vote_count DESC").
		Find(&candidates)

	response.Success(c, gin.H{
		"election":   election,
		"candidates": candidates,
	})
}

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)

	elections := r.Group("/elections")
	{
		elections.GET("", h.List)
		elections.GET("/:id", h.Get)
		elections.POST("/:id/candidates", h.Signup)
		elections.GET("/:id/candidates", h.GetCandidates)
		elections.POST("/:id/vote", h.Vote)
		elections.GET("/:id/result", h.GetResult)
	}
}
