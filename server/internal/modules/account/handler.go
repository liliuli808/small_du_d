package account

import (
	"net/http"
	"time"

	"anonymous-community/internal/config"
	"anonymous-community/internal/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type Handler struct {
	db     *gorm.DB
	rdb    *redis.Client
	secret string
}

func NewHandler(db *gorm.DB, rdb *redis.Client, secret string) *Handler {
	return &Handler{db: db, rdb: rdb, secret: secret}
}

// Register 注册
func (h *Handler) Register(c *gin.Context) {
	var req struct {
		Username        string `json:"username" binding:"required,min=3,max=20"`
		Password        string `json:"password" binding:"required,min=6,max=32"`
		ConfirmPassword string `json:"confirmPassword" binding:"required"`
		InviteCode      string `json:"inviteCode"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误: "+err.Error())
		return
	}

	if req.Password != req.ConfirmPassword {
		response.Error(c, 20003, "两次密码不一致")
		return
	}

	// 检查用户名是否已存在
	var existing config.User
	if err := h.db.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		response.Error(c, 20004, "账号名已被使用")
		return
	}

	// 密码哈希
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		response.Error(c, 10001, "密码加密失败")
		return
	}

	// 生成匿名昵称和头像
	nickname := generateAnonymousNickname()
	avatarURL := generateAvatarURL(nickname)

	user := config.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		Nickname:     nickname,
		AvatarURL:    avatarURL,
		Status:       0,
		Role:         0,
	}

	if err := h.db.Create(&user).Error; err != nil {
		response.Error(c, 10001, "注册失败")
		return
	}

	response.Success(c, gin.H{
		"id":        user.ID,
		"nickname":  user.Nickname,
		"avatarUrl": user.AvatarURL,
	})
}

// Login 登录
func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var user config.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		response.Error(c, 20005, "账号或密码错误")
		return
	}

	if user.Status == 2 {
		response.Error(c, 20006, "账号已被封禁")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		response.Error(c, 20005, "账号或密码错误")
		return
	}

	// 更新最后登录时间
	now := time.Now()
	user.LastLoginAt = &now
	h.db.Save(&user)

	// 生成Token
	accessToken, refreshToken, err := h.generateTokens(user.ID, user.Username, user.Role)
	if err != nil {
		response.Error(c, 10001, "Token生成失败")
		return
	}

	response.Success(c, gin.H{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"expiresIn":    7200,
		"user": gin.H{
			"id":        user.ID,
			"nickname":  user.Nickname,
			"avatarUrl": user.AvatarURL,
			"role":      user.Role,
		},
	})
}

// Refresh 刷新Token
func (h *Handler) Refresh(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refreshToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	token, err := jwt.Parse(req.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.secret), nil
	})
	if err != nil || !token.Valid {
		response.Error(c, 20001, "Refresh Token无效")
		return
	}

	claims, _ := token.Claims.(jwt.MapClaims)
	userID := uint64(claims["user_id"].(float64))
	username := claims["username"].(string)
	role := int8(claims["role"].(float64))

	accessToken, refreshToken, err := h.generateTokens(userID, username, role)
	if err != nil {
		response.Error(c, 10001, "Token生成失败")
		return
	}

	response.Success(c, gin.H{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"expiresIn":    7200,
	})
}

// GetMe 获取当前用户信息
func (h *Handler) GetMe(c *gin.Context) {
	userID := c.GetUint64("userID")

	var user config.User
	if err := h.db.First(&user, userID).Error; err != nil {
		response.Error(c, 20007, "用户不存在")
		return
	}

	response.Success(c, gin.H{
		"id":        user.ID,
		"username":  user.Username,
		"nickname":  user.Nickname,
		"avatarUrl": user.AvatarURL,
		"bio":       user.Bio,
		"status":    user.Status,
		"role":      user.Role,
		"createdAt": user.CreatedAt,
	})
}

// UpdateMe 更新用户信息
func (h *Handler) UpdateMe(c *gin.Context) {
	userID := c.GetUint64("userID")

	var req struct {
		Nickname  string `json:"nickname" binding:"max=50"`
		AvatarURL string `json:"avatarUrl" binding:"max=255"`
		Bio       string `json:"bio" binding:"max=200"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	updates := make(map[string]interface{})
	if req.Nickname != "" {
		updates["nickname"] = req.Nickname
	}
	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}
	if req.Bio != "" {
		updates["bio"] = req.Bio
	}

	if err := h.db.Model(&config.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		response.Error(c, 10001, "更新失败")
		return
	}

	response.Success(c, nil)
}

// ChangePassword 修改密码
func (h *Handler) ChangePassword(c *gin.Context) {
	userID := c.GetUint64("userID")

	var req struct {
		OldPassword string `json:"oldPassword" binding:"required"`
		NewPassword string `json:"newPassword" binding:"required,min=6,max=32"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 20002, "参数错误")
		return
	}

	var user config.User
	if err := h.db.First(&user, userID).Error; err != nil {
		response.Error(c, 20007, "用户不存在")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		response.Error(c, 20008, "旧密码错误")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		response.Error(c, 10001, "密码加密失败")
		return
	}

	h.db.Model(&user).Update("password_hash", string(hash))
	response.Success(c, nil)
}

func (h *Handler) generateTokens(userID uint64, username string, role int8) (string, string, error) {
	// Access Token - 2小时
	accessClaims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"role":     role,
		"exp":      time.Now().Add(2 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessString, err := accessToken.SignedString([]byte(h.secret))
	if err != nil {
		return "", "", err
	}

	// Refresh Token - 30天
	refreshClaims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"role":     role,
		"type":     "refresh",
		"exp":      time.Now().Add(30 * 24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshString, err := refreshToken.SignedString([]byte(h.secret))
	if err != nil {
		return "", "", err
	}

	return accessString, refreshString, nil
}
