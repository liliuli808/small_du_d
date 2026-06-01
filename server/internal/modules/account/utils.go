package account

import (
	"fmt"
	"math/rand"
)

var adjectives = []string{
	"神秘的", "孤独的", "快乐的", "忧郁的", "勇敢的", "安静的", "疯狂的",
	"温柔的", "冷酷的", "热情的", "懒散的", "勤奋的", "聪明的", "傻傻的",
	"深邃的", "闪烁的", "漂浮的", "沉睡的", "奔跑的", "微笑的",
}

var nouns = []string{
	"猫", "鱼", "鸟", "云", "风", "星", "月", "海", "山", "树",
	"花", "草", "雨", "雪", "火", "石", "沙", "叶", "影", "光",
	"路人", "旅人", "诗人", "画家", "歌手", "舞者", "梦者", "行者",
}

func generateAnonymousNickname() string {
	adj := adjectives[rand.Intn(len(adjectives))]
	noun := nouns[rand.Intn(len(nouns))]
	num := rand.Intn(9999)
	return fmt.Sprintf("%s%s%d", adj, noun, num)
}

func generateAvatarURL(nickname string) string {
	// 返回默认头像，实际使用头像服务或本地生成
	return ""
}
