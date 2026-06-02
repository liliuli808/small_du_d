package config

import (
	"time"
)

// User 用户表
type User struct {
	ID           uint64    `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex;size:50;not null" json:"username"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	Nickname     string    `gorm:"size:50" json:"nickname"`
	AvatarURL    string    `gorm:"size:255" json:"avatarUrl"`
	Bio          string    `gorm:"size:200" json:"bio"`
	Status       int8      `gorm:"default:0" json:"status"` // 0:正常 1:禁言 2:封禁 3:注销
	Role         int8      `gorm:"default:0" json:"role"`   // 0:普通用户 1:后台管理员
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	LastLoginAt  *time.Time `json:"lastLoginAt"`
}

// Category 分区表
type Category struct {
	ID            uint64    `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"size:50;not null" json:"name"`
	IconURL       string    `gorm:"size:255" json:"iconUrl"`
	Description   string    `gorm:"size:500" json:"description"`
	Rules         string    `gorm:"type:text" json:"rules"`
	Announcement  string    `gorm:"type:text" json:"announcement"`
	AllowImage    bool      `gorm:"default:true" json:"allowImage"`
	EnableChat    bool      `gorm:"default:true" json:"enableChat"`
	EnableElection bool     `gorm:"default:true" json:"enableElection"`
	Status        int8      `gorm:"default:0" json:"status"` // 0:启用 1:停用
	SortWeight    int       `gorm:"default:0" json:"sortWeight"`
	PostCount     int       `gorm:"default:0" json:"postCount"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// Post 帖子表
type Post struct {
	ID           uint64     `gorm:"primaryKey" json:"id"`
	UserID       uint64     `gorm:"index;not null" json:"userId"`
	CategoryID   uint64     `gorm:"index;not null" json:"categoryId"`
	Content      string     `gorm:"type:text;not null" json:"content"`
	Status       int8       `gorm:"default:0" json:"status"` // 0:已发布 1:已删除 2:已隐藏 3:被举报待处理 4:申诉中 5:已恢复
	DeleteReason string     `gorm:"size:200" json:"deleteReason,omitempty"`
	DeletedBy    *uint64    `json:"deletedBy,omitempty"`
	DeletedAt    *time.Time `json:"deletedAt,omitempty"`
	LikeCount    int        `gorm:"default:0" json:"likeCount"`
	CommentCount int        `gorm:"default:0" json:"commentCount"`
	ViewCount    int        `gorm:"default:0" json:"viewCount"`
	HotScore     float64    `gorm:"default:0" json:"hotScore"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`

	// 关联
	User     User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Category Category    `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Images   []PostImage `gorm:"foreignKey:PostID" json:"images,omitempty"`
}

// PostImage 帖子图片表
type PostImage struct {
	ID         uint64 `gorm:"primaryKey" json:"id"`
	PostID     uint64 `gorm:"index;not null" json:"postId"`
	ImageURL   string `gorm:"size:500" json:"imageUrl"`
	ThumbURL   string `gorm:"size:500" json:"thumbUrl"`
	ObjectKey  string `gorm:"size:500" json:"objectKey"`
	Width      int    `json:"width"`
	Height     int    `json:"height"`
	SortOrder  int    `gorm:"default:0" json:"sortOrder"`
}

// Comment 评论表
type Comment struct {
	ID        uint64     `gorm:"primaryKey" json:"id"`
	PostID    uint64     `gorm:"index;not null" json:"postId"`
	UserID    uint64     `gorm:"index;not null" json:"userId"`
	ParentID  uint64     `gorm:"default:0" json:"parentId"`
	Content   string     `gorm:"type:text;not null" json:"content"`
	Status    int8       `gorm:"default:0" json:"status"` // 0:正常 1:删除
	DeletedBy *uint64    `json:"deletedBy,omitempty"`
	DeletedAt *time.Time `json:"deletedAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// Like 点赞表
type Like struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	UserID     uint64    `gorm:"uniqueIndex:idx_user_target;not null" json:"userId"`
	TargetType int8      `gorm:"uniqueIndex:idx_user_target;not null" json:"targetType"` // 1:帖子 2:评论
	TargetID   uint64    `gorm:"uniqueIndex:idx_user_target;not null" json:"targetId"`
	CreatedAt  time.Time `json:"createdAt"`
}

// Conversation 会话表
type Conversation struct {
	ID           uint64     `gorm:"primaryKey" json:"id"`
	UserAID      uint64     `gorm:"index;not null" json:"userAId"`
	UserBID      uint64     `gorm:"index;not null" json:"userBId"`
	Status       int8       `gorm:"default:0" json:"status"` // 0:正常 1:拉黑
	LastMessageID *uint64   `json:"lastMessageId,omitempty"`
	LastMessageAt *time.Time `json:"lastMessageAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// Message 消息表
type Message struct {
	ID             uint64    `gorm:"primaryKey" json:"id"`
	ConversationID uint64    `gorm:"index;not null" json:"conversationId"`
	SenderID       uint64    `gorm:"index;not null" json:"senderId"`
	ReceiverID     uint64    `gorm:"index;not null" json:"receiverId"`
	Content        string    `gorm:"type:text;not null" json:"content"`
	MessageType    int8      `gorm:"default:1" json:"messageType"` // 1:文本 2:系统
	Status         int8      `gorm:"default:0" json:"status"`       // 0:正常 1:撤回
	CreatedAt      time.Time `json:"createdAt"`
}

// CategoryModerator 分区负责人表
type CategoryModerator struct {
	ID          uint64     `gorm:"primaryKey" json:"id"`
	CategoryID  uint64     `gorm:"index;not null" json:"categoryId"`
	UserID      uint64     `gorm:"index;not null" json:"userId"`
	Role        int8       `gorm:"default:1" json:"role"` // 1:负责人 2:副负责人
	Status      int8       `gorm:"default:0" json:"status"` // 0:在任 1:暂停 2:卸任
	TermStartAt *time.Time `json:"termStartAt,omitempty"`
	TermEndAt   *time.Time `json:"termEndAt,omitempty"`
	SourceType  int8       `gorm:"default:1" json:"sourceType"` // 1:选举 2:后台任命
	SourceID    *uint64    `json:"sourceId,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// Election 选举表
type Election struct {
	ID               uint64     `gorm:"primaryKey" json:"id"`
	CategoryID       uint64     `gorm:"index;not null" json:"categoryId"`
	Title            string     `gorm:"size:100" json:"title"`
	Status           int8       `gorm:"default:0" json:"status"` // 0:草稿 1:报名中 2:投票中 3:公示中 4:已结束 5:已取消
	SignupStartAt    *time.Time `json:"signupStartAt,omitempty"`
	SignupEndAt      *time.Time `json:"signupEndAt,omitempty"`
	VoteStartAt      *time.Time `json:"voteStartAt,omitempty"`
	VoteEndAt        *time.Time `json:"voteEndAt,omitempty"`
	PublicityEndAt   *time.Time `json:"publicityEndAt,omitempty"`
	CreatedBy        uint64     `json:"createdBy"`
	CreatedAt        time.Time  `json:"createdAt"`
}

// ElectionCandidate 候选人表
type ElectionCandidate struct {
	ID        uint64    `gorm:"primaryKey" json:"id"`
	ElectionID uint64   `gorm:"index;not null" json:"electionId"`
	UserID    uint64    `gorm:"index;not null" json:"userId"`
	Manifesto string    `gorm:"type:text" json:"manifesto"`
	Status    int8      `gorm:"default:1" json:"status"` // 1:有效 2:取消资格
	VoteCount int       `gorm:"default:0" json:"voteCount"`
	CreatedAt time.Time `json:"createdAt"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// ElectionVote 投票表
type ElectionVote struct {
	ID           uint64    `gorm:"primaryKey" json:"id"`
	ElectionID   uint64    `gorm:"uniqueIndex:idx_election_voter;not null" json:"electionId"`
	CandidateID  uint64    `gorm:"index;not null" json:"candidateId"`
	VoterUserID  uint64    `gorm:"uniqueIndex:idx_election_voter;not null" json:"voterUserId"`
	DeviceID     string    `gorm:"size:100" json:"deviceId"`
	IP           string    `gorm:"size:50" json:"ip"`
	UserAgent    string    `gorm:"size:200" json:"userAgent"`
	CreatedAt    time.Time `json:"createdAt"`
}

// Report 举报表
type Report struct {
	ID          uint64     `gorm:"primaryKey" json:"id"`
	ReporterID  uint64     `gorm:"index;not null" json:"reporterId"`
	TargetType  int8       `gorm:"not null" json:"targetType"` // 1:帖子 2:评论 3:用户 4:私聊消息
	TargetID    uint64     `gorm:"index;not null" json:"targetId"`
	CategoryID  *uint64    `json:"categoryId,omitempty"`
	ReasonType  int8       `gorm:"not null" json:"reasonType"`
	ReasonText  string     `gorm:"type:text" json:"reasonText"`
	Status      int8       `gorm:"default:0" json:"status"` // 0:待处理 1:已处理 2:驳回
	HandlerID   *uint64    `json:"handlerId,omitempty"`
	HandlerRole int8       `json:"handlerRole,omitempty"` // 1:负责人 2:副负责人 3:后台管理员
	HandledAt   *time.Time `json:"handledAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

// Notification 通知表
type Notification struct {
	ID         uint64    `gorm:"primaryKey" json:"id"`
	UserID     uint64    `gorm:"index;not null" json:"userId"`
	Type       int8      `gorm:"not null" json:"type"` // 1:系统 2:评论 3:点赞 4:删帖 5:举报处理
	Title      string    `gorm:"size:100" json:"title"`
	Content    string    `gorm:"type:text" json:"content"`
	TargetType int8      `json:"targetType"` // 1:帖子 2:评论 3:用户
	TargetID   uint64    `json:"targetId"`
	IsRead     bool      `gorm:"default:false" json:"isRead"`
	CreatedAt  time.Time `json:"createdAt"`
}

// Appeal 申诉表
type Appeal struct {
	ID           uint64     `gorm:"primaryKey" json:"id"`
	UserID       uint64     `gorm:"index;not null" json:"userId"`
	TargetType   int8       `gorm:"not null" json:"targetType"` // 1:帖子 2:评论
	TargetID     uint64     `gorm:"index;not null" json:"targetId"`
	CategoryID   *uint64    `json:"categoryId,omitempty"`
	Reason       string     `gorm:"type:text;not null" json:"reason"`
	Status       int8       `gorm:"default:0" json:"status"` // 0:待处理 1:已通过 2:已驳回
	HandlerID    *uint64    `json:"handlerId,omitempty"`
	HandleResult string     `gorm:"type:text" json:"handleResult,omitempty"`
	HandledAt    *time.Time `json:"handledAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// ModerationLog 管理操作日志表
type ModerationLog struct {
	ID           uint64    `gorm:"primaryKey" json:"id"`
	OperatorID   uint64    `gorm:"index;not null" json:"operatorId"`
	OperatorRole int8      `gorm:"not null" json:"operatorRole"` // 1:负责人 2:副负责人 3:后台管理员
	CategoryID   *uint64   `json:"categoryId,omitempty"`
	ActionType   int8      `gorm:"not null" json:"actionType"` // 1:删除帖子 2:隐藏帖子 3:恢复帖子 4:处理举报 5:编辑公告 6:编辑规则
	TargetType   int8      `gorm:"not null" json:"targetType"` // 1:帖子 2:评论 3:举报
	TargetID     uint64    `gorm:"index;not null" json:"targetId"`
	Reason       string    `gorm:"size:200" json:"reason"`
	Remark       string    `gorm:"type:text" json:"remark"`
	CreatedAt    time.Time `json:"createdAt"`
}
