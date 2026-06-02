package main

import (
	"anonymous-community/internal/config"
	"anonymous-community/internal/middleware"
	"anonymous-community/internal/pkg/logger"
	"anonymous-community/internal/modules/account"
	"anonymous-community/internal/modules/category"
	"anonymous-community/internal/modules/post"
	"anonymous-community/internal/modules/comment"
	"anonymous-community/internal/modules/like"
	"anonymous-community/internal/modules/chat"
	"anonymous-community/internal/modules/moderation"
	"anonymous-community/internal/modules/report"
	"anonymous-community/internal/modules/election"
	"anonymous-community/internal/modules/notification"
	"anonymous-community/internal/modules/upload"
	"anonymous-community/internal/modules/admin"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// 初始化配置
	cfg := config.Load()

	// 初始化日志
	log := logger.Init(cfg.LogLevel)
	defer log.Sync()

	// 初始化数据库
	db := config.InitDB(cfg)
	defer config.CloseDB(db)

	// 初始化Redis
	rdb := config.InitRedis(cfg)
	defer rdb.Close()

	// 初始化Gin
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()

	// 全局中间件
	r.Use(middleware.CORS())
	r.Use(middleware.Recovery(log))
	r.Use(middleware.RequestLog(log))

	// 注册路由
	api := r.Group("/api/v1")
	{
		// 认证相关（公开）
		account.RegisterAuthRoutes(api, db, rdb, cfg)

		// 需要登录的路由
		auth := api.Group("")
		auth.Use(middleware.JWTAuth(cfg.JWTSecret))
		{
			account.RegisterUserRoutes(auth, db, rdb)
			category.RegisterRoutes(auth, db, rdb)
			post.RegisterRoutes(auth, db, rdb)
			comment.RegisterRoutes(auth, db, rdb)
			like.RegisterRoutes(auth, db, rdb)
			chat.RegisterRoutes(auth, db, rdb)
			moderation.RegisterRoutes(auth, db, rdb)
			report.RegisterRoutes(auth, db, rdb)
			election.RegisterRoutes(auth, db, rdb)
			notification.RegisterRoutes(auth, db, rdb)
			upload.RegisterRoutes(auth, db, rdb, cfg)
		}

		// 后台管理路由（需要管理员权限）
		adminGroup := api.Group("/admin")
		adminGroup.Use(middleware.JWTAuth(cfg.JWTSecret))
		adminGroup.Use(middleware.AdminAuth())
		{
			admin.RegisterRoutes(adminGroup, db, rdb)
		}
	}

	// 启动WebSocket服务
	go chat.StartWebSocketServer(r, db, rdb, cfg)

	log.Info("Server starting", zap.String("addr", cfg.ServerAddr))
	if err := r.Run(cfg.ServerAddr); err != nil {
		log.Fatal("Server failed to start", zap.Error(err))
	}
}
