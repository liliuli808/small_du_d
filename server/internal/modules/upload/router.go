package upload

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
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

// Upload 上传单张图片，自动压缩生成缩略图
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

	// 解码图片获取尺寸
	img, format, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		response.Error(c, 80005, "图片解码失败: "+err.Error())
		return
	}
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// 生成唯一文件名
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	objectKey := fmt.Sprintf("images/%d/%s%s", time.Now().Year(), generateFileID(), ext)
	thumbKey := fmt.Sprintf("images/%d/%s_thumb.jpg", time.Now().Year(), generateFileID())

	// 保存原图
	imageURL, err := h.saveImage(objectKey, data)
	if err != nil {
		response.Error(c, 10001, "保存原图失败: "+err.Error())
		return
	}

	// 生成并保存缩略图（最大边 480px）
	thumbURL := ""
	thumbWidth, thumbHeight := width, height
	if width > 480 || height > 480 {
		thumbImg := resizeImage(img, 480, 480)
		thumbBounds := thumbImg.Bounds()
		thumbWidth = thumbBounds.Dx()
		thumbHeight = thumbBounds.Dy()

		thumbData, err := encodeImage(thumbImg, "jpeg", 80)
		if err == nil {
			thumbURL, _ = h.saveImage(thumbKey, thumbData)
		}
	}

	response.Success(c, gin.H{
		"url":        imageURL,
		"thumbUrl":   thumbURL,
		"objectKey":  objectKey,
		"thumbKey":   thumbKey,
		"width":      width,
		"height":     height,
		"thumbWidth": thumbWidth,
		"thumbHeight": thumbHeight,
		"format":     format,
		"size":       header.Size,
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

		f, err := header.Open()
		if err != nil {
			continue
		}

		data, err := io.ReadAll(f)
		f.Close()
		if err != nil {
			continue
		}

		img, format, err := image.Decode(bytes.NewReader(data))
		if err != nil {
			continue
		}
		bounds := img.Bounds()
		width := bounds.Dx()
		height := bounds.Dy()

		ext := filepath.Ext(header.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		objectKey := fmt.Sprintf("images/%d/%s%s", time.Now().Year(), generateFileID(), ext)
		thumbKey := fmt.Sprintf("images/%d/%s_thumb.jpg", time.Now().Year(), generateFileID())

		imageURL, err := h.saveImage(objectKey, data)
		if err != nil {
			continue
		}

		thumbURL := ""
		thumbWidth, thumbHeight := width, height
		if width > 480 || height > 480 {
			thumbImg := resizeImage(img, 480, 480)
			tb := thumbImg.Bounds()
			thumbWidth = tb.Dx()
			thumbHeight = tb.Dy()
			thumbData, err := encodeImage(thumbImg, "jpeg", 80)
			if err == nil {
				thumbURL, _ = h.saveImage(thumbKey, thumbData)
			}
		}

		results = append(results, gin.H{
			"url":         imageURL,
			"thumbUrl":    thumbURL,
			"objectKey":   objectKey,
			"thumbKey":    thumbKey,
			"width":       width,
			"height":      height,
			"thumbWidth":  thumbWidth,
			"thumbHeight": thumbHeight,
			"format":      format,
			"size":        header.Size,
		})
	}

	response.Success(c, gin.H{
		"items": results,
		"count": len(results),
	})
}

// saveImage 保存图片到本地或对象存储
func (h *Handler) saveImage(objectKey string, data []byte) (string, error) {
	if h.cfg.StorageEndpoint != "" {
		return h.uploadToStorage(objectKey, data, "image/jpeg")
	}
	localPath := filepath.Join("uploads", objectKey)
	if err := os.MkdirAll(filepath.Dir(localPath), 0755); err != nil {
		return "", err
	}
	if err := os.WriteFile(localPath, data, 0644); err != nil {
		return "", err
	}
	return "/uploads/" + objectKey, nil
}

// resizeImage 等比例缩放图片，最大边不超过 maxSize
func resizeImage(src image.Image, maxWidth, maxHeight int) image.Image {
	bounds := src.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	scaleX := float64(maxWidth) / float64(width)
	scaleY := float64(maxHeight) / float64(height)
	scale := scaleX
	if scaleY < scaleX {
		scale = scaleY
	}
	if scale >= 1 {
		return src
	}

	newWidth := int(float64(width) * scale)
	newHeight := int(float64(height) * scale)
	if newWidth < 1 {
		newWidth = 1
	}
	if newHeight < 1 {
		newHeight = 1
	}

	dst := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))

	// 双线性插值缩放
	srcBounds := src.Bounds()
	for y := 0; y < newHeight; y++ {
		for x := 0; x < newWidth; x++ {
			srcX := float64(x) * float64(width) / float64(newWidth)
			srcY := float64(y) * float64(height) / float64(newHeight)
			c := bilinearSample(src, srcX+float64(srcBounds.Min.X), srcY+float64(srcBounds.Min.Y))
			dst.Set(x, y, c)
		}
	}

	return dst
}

// bilinearSample 双线性采样
func bilinearSample(img image.Image, x, y float64) color.Color {
	x0 := int(x)
	y0 := int(y)
	x1 := x0 + 1
	y1 := y0 + 1

	dx := x - float64(x0)
	dy := y - float64(y0)

	c00 := img.At(x0, y0)
	c10 := img.At(x1, y0)
	c01 := img.At(x0, y1)
	c11 := img.At(x1, y1)

	r00, g00, b00, a00 := c00.RGBA()
	r10, g10, b10, a10 := c10.RGBA()
	r01, g01, b01, a01 := c01.RGBA()
	r11, g11, b11, a11 := c11.RGBA()

	// 双线性插值
	w00 := (1 - dx) * (1 - dy)
	w10 := dx * (1 - dy)
	w01 := (1 - dx) * dy
	w11 := dx * dy

	r := uint32(float64(r00)*w00 + float64(r10)*w10 + float64(r01)*w01 + float64(r11)*w11)
	g := uint32(float64(g00)*w00 + float64(g10)*w10 + float64(g01)*w01 + float64(g11)*w11)
	b := uint32(float64(b00)*w00 + float64(b10)*w10 + float64(b01)*w01 + float64(b11)*w11)
	a := uint32(float64(a00)*w00 + float64(a10)*w10 + float64(a01)*w01 + float64(a11)*w11)

	return color.NRGBA{
		R: uint8(r >> 8),
		G: uint8(g >> 8),
		B: uint8(b >> 8),
		A: uint8(a >> 8),
	}
}

// encodeImage 将图片编码为指定格式
func encodeImage(img image.Image, format string, quality int) ([]byte, error) {
	var buf bytes.Buffer
	switch format {
	case "jpeg", "jpg":
		op := &jpeg.Options{Quality: quality}
		if err := jpeg.Encode(&buf, img, op); err != nil {
			return nil, err
		}
	case "png":
		if err := png.Encode(&buf, img); err != nil {
			return nil, err
		}
	case "gif":
		op := &gif.Options{NumColors: 256}
		if err := gif.Encode(&buf, img, op); err != nil {
			return nil, err
		}
	default:
		op := &jpeg.Options{Quality: quality}
		if err := jpeg.Encode(&buf, img, op); err != nil {
			return nil, err
		}
	}
	return buf.Bytes(), nil
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
	return "/uploads/" + objectKey, nil
}

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client, cfg *config.Config) {
	h := NewHandler(db, rdb, cfg)
	r.POST("/upload", h.Upload)
	r.POST("/upload/batch", h.UploadMultiple)
}
