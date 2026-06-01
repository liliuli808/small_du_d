package like

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

// Like 点赞/取消点赞帖子
func (h *Handler) Like(c *gin.Context) {
	userID := c.GetUint64("userID")
	postID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 30001, "参数错误")
		return
	}

	var liked bool
	err = h.db.Transaction(func(tx *gorm.DB) error {
		var like config.Like
		result := tx.Where("user_id = ? AND target_type = ? AND target_id = ?", userID, 1, postID).First(&like)

		if result.Error == nil {
			// 已点赞，取消点赞
			if err := tx.Delete(&like).Error; err != nil {
				return err
			}
			if err := tx.Model(&config.Post{}).Where("id = ?", postID).
				Update("like_count", gorm.Expr("like_count - 1")).Error; err != nil {
				return err
			}
			liked = false
			return nil
		}

		// 未点赞，添加点赞
		like = config.Like{
			UserID:     userID,
			TargetType: 1,
			TargetID:   postID,
		}
		if err := tx.Create(&like).Error; err != nil {
			return err
		}
		if err := tx.Model(&config.Post{}).Where("id = ?", postID).
			Update("like_count", gorm.Expr("like_count + 1")).Error; err != nil {
			return err
		}
		liked = true
		return nil
	})
	if err != nil {
		response.Error(c, 10001, "操作失败")
		return
	}

	response.Success(c, gin.H{"liked": liked})
}

// LikeComment 点赞评论
func (h *Handler) LikeComment(c *gin.Context) {
	userID := c.GetUint64("userID")
	commentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, 40001, "参数错误")
		return
	}

	var liked bool
	err = h.db.Transaction(func(tx *gorm.DB) error {
		var like config.Like
		result := tx.Where("user_id = ? AND target_type = ? AND target_id = ?", userID, 2, commentID).First(&like)

		if result.Error == nil {
			if err := tx.Delete(&like).Error; err != nil {
				return err
			}
			liked = false
			return nil
		}

		like = config.Like{
			UserID:     userID,
			TargetType: 2,
			TargetID:   commentID,
		}
		if err := tx.Create(&like).Error; err != nil {
			return err
		}
		liked = true
		return nil
	})
	if err != nil {
		response.Error(c, 10001, "操作失败")
		return
	}

	response.Success(c, gin.H{"liked": liked})
}
