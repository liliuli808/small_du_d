package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func JWTAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "请先登录", "data": nil})
			c.Abort()
			return
		}

		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "Token格式错误", "data": nil})
			c.Abort()
			return
		}

		token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "Token无效或已过期", "data": nil})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 20001, "message": "Token解析失败", "data": nil})
			c.Abort()
			return
		}

		c.Set("userID", uint64(claims["user_id"].(float64)))
		c.Set("username", claims["username"].(string))
		c.Set("role", int8(claims["role"].(float64)))
		c.Next()
	}
}

func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role.(int8) != 1 {
			c.JSON(http.StatusForbidden, gin.H{"code": 70001, "message": "无权访问", "data": nil})
			c.Abort()
			return
		}
		c.Next()
	}
}
