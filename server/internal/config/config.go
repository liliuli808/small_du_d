package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"go.uber.org/zap"
)

type Config struct {
	Env         string
	ServerAddr  string
	DBHost      string
	DBPort      int
	DBUser      string
	DBPassword  string
	DBName      string
	RedisAddr   string
	RedisPass   string
	JWTSecret   string
	LogLevel    string
	StorageEndpoint string
	StorageKey      string
	StorageSecret   string
}

func Load() *Config {
	port, _ := strconv.Atoi(getEnv("DB_PORT", "5432"))
	return &Config{
		Env:         getEnv("ENV", "development"),
		ServerAddr:  getEnv("SERVER_ADDR", ":8080"),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      port,
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPassword:  getEnv("DB_PASSWORD", "postgres"),
		DBName:      getEnv("DB_NAME", "anonymous_community"),
		RedisAddr:   getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPass:   getEnv("REDIS_PASSWORD", ""),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		StorageEndpoint: getEnv("STORAGE_ENDPOINT", ""),
		StorageKey:      getEnv("STORAGE_KEY", ""),
		StorageSecret:   getEnv("STORAGE_SECRET", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func InitDB(cfg *Config) *gorm.DB {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		zap.L().Fatal("Failed to connect to database", zap.Error(err))
	}

	// 自动迁移
	autoMigrate(db)

	return db
}

func InitRedis(cfg *Config) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       0,
	})
}

func CloseDB(db *gorm.DB) {
	sqlDB, err := db.DB()
	if err != nil {
		return
	}
	sqlDB.Close()
}

func autoMigrate(db *gorm.DB) {
	// 自动迁移表结构
	db.AutoMigrate(
		&User{},
		&Category{},
		&Post{},
		&PostImage{},
		&Comment{},
		&Like{},
		&Conversation{},
		&Message{},
		&CategoryModerator{},
		&Election{},
		&ElectionCandidate{},
		&ElectionVote{},
		&Report{},
		&Notification{},
		&ModerationLog{},
	)
}
