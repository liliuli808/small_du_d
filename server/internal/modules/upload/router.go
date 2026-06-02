package upload

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"anonymous-community/internal/config"
	"anonymous-community/internal/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Handler struct {
	db  *gorm.DB
	rdb *redis.Client
	cfg *config.Config
}

func NewHandler(db *gorm.DB, rdb *redis.Client, cfg *config.Config) *Handler {
	return &Handler{db: db, rdb: rdb, cfg: cfg}
}

// Upload 上传单张图片
func (h *Handler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.Error(c, 80001, "请上传文件")
		return
	}
	defer file.Close()

	// 校验文件类型
	if !isValidImage(header) {
		response.Error(c, 80002, "仅支持 JPG/PNG/WEBP/GIF 格式")
		return
	}

	// 校验文件大小（最大 10MB）
	if header.Size > 10*1024*1024 {
		response.Error(c, 80003, "单张图片不能超过 10MB")
		return
	}

	// 读取文件内容
	data, err := io.ReadAll(file)
	if err != nil {
		response.Error(c, 10001, "读取文件失败")
		return
	}

	// 生成唯一文件名
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	objectKey := fmt.Sprintf("images/%d/%s%s", time.Now().Year(), generateFileID(), ext)

	var imageURL string

	// 如果有对象存储配置，上传到对象存储
	if h.cfg.StorageEndpoint != "" {
		url, err := h.uploadToStorage(objectKey, data, header.Header.Get("Content-Type"))
		if err != nil {
			response.Error(c, 10001, "上传失败: "+err.Error())
			return
		}
		imageURL = url
	} else {
		// 开发环境：保存到本地
		localPath := filepath.Join("uploads", objectKey)
		if err := os.MkdirAll(filepath.Dir(localPath), 0755); err != nil {
			response.Error(c, 10001, "创建目录失败")
			return
		}
		if err := os.WriteFile(localPath, data, 0644); err != nil {
			response.Error(c, 10001, "保存文件失败")
			return
		}
		imageURL = "/uploads/" + objectKey
	}

	response.Success(c, gin.H{
		"url":       imageURL,
		"objectKey": objectKey,
		"width":     0, // TODO: 读取图片尺寸
		"height":    0,
	})
}

// UploadMultiple 上传多张图片
func (h *Handler) UploadMultiple(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		response.Error(c, 80001, "请上传文件")
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		response.Error(c, 80001, "请上传文件")
		return
	}

	if len(files) > 9 {
		response.Error(c, 80004, "最多上传 9 张图片")
		return
	}

	var results []gin.H
	for _, header := range files {
		if !isValidImage(header) {
			continue
		}
		if header.Size > 10*1024*1024 {
			continue
		}

		file, err := header.Open()
		if err != nil {
			continue
		}

		data, err := io.ReadAll(file)
		file.Close()
		if err != nil {
			continue
		}

		ext := filepath.Ext(header.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		objectKey := fmt.Sprintf("images/%d/%s%s", time.Now().Year(), generateFileID(), ext)

		var imageURL string
		if h.cfg.StorageEndpoint != "" {
			url, err := h.uploadToStorage(objectKey, data, header.Header.Get("Content-Type"))
			if err != nil {
				continue
			}
			imageURL = url
		} else {
			localPath := filepath.Join("uploads", objectKey)
			os.MkdirAll(filepath.Dir(localPath), 0755)
			os.WriteFile(localPath, data, 0644)
			imageURL = "/uploads/" + objectKey
		}

		results = append(results, gin.H{
			"url":       imageURL,
			"objectKey": objectKey,
			"width":     0,
			"height":    0,
		})
	}

	response.Success(c, gin.H{
		"items": results,
		"count": len(results),
	})
}

func isValidImage(header *multipart.FileHeader) bool {
	contentType := header.Header.Get("Content-Type")
	validTypes := []string{
		"image/jpeg", "image/jpg", "image/png",
		"image/webp", "image/gif",
	}
	for _, t := range validTypes {
		if strings.HasPrefix(contentType, t) {
			return true
		}
	}
	return false
}

func generateFileID() string {
	return fmt.Sprintf("%d_%d", time.Now().UnixNano(), time.Now().Unix())
}

func (h *Handler) uploadToStorage(objectKey string, data []byte, contentType string) (string, error) {
	// TODO: 接入实际的对象存储（S3/MinIO/OSS/Cloudinary 等）
	// 当前返回本地路径作为占位
	return "/uploads/" + objectKey, nil
}

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client, cfg *config.Config) {
	h := NewHandler(db, rdb, cfg)

	// 需要登录才能上传
	auth := r.Group("")
	auth.Use(func(c *gin.Context) {
		// 复用 JWT 中间件，这里已经在主路由中注册了
		c.Next()
	})
	{
		auth.POST("/upload", h.Upload)
		auth.POST("/upload/batch", h.UploadMultiple)
	}
}
