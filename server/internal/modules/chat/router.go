package chat

import (
	"encoding/json"
	"net/http"
	"time"

	"anonymous-community/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Hub struct {
	clients    map[uint64]map[*websocket.Conn]bool
	broadcast  chan *config.Message
	register   chan *Client
	unregister chan *Client
}

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	userID uint64
	send   chan []byte
}

type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

var hub *Hub

func init() {
	hub = &Hub{
		clients:    make(map[uint64]map[*websocket.Conn]bool),
		broadcast:  make(chan *config.Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB, rdb *redis.Client) {
	h := NewHandler(db, rdb)

	convs := r.Group("/conversations")
	{
		convs.GET("", h.ListConversations)
		convs.POST("", h.CreateConversation)
		convs.GET("/:id/messages", h.GetMessages)
	}
}

func StartWebSocketServer(r *gin.Engine, db *gorm.DB, rdb *redis.Client, cfg *config.Config) {
	go hub.run(db, rdb)

	r.GET("/ws", func(c *gin.Context) {
		token := c.Query("token")
		if token == "" {
			c.JSON(401, gin.H{"error": "missing token"})
			return
		}

		// 解析 JWT token 获取 userID
		tokenObj, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})
		if err != nil || !tokenObj.Valid {
			c.JSON(401, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := tokenObj.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(401, gin.H{"error": "invalid claims"})
			return
		}

		userID := uint64(claims["user_id"].(float64))

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}

		client := &Client{
			hub:    hub,
			conn:   conn,
			userID: userID,
			send:   make(chan []byte, 256),
		}
		hub.register <- client

		go client.writePump()
		go client.readPump(db, rdb)
	})
}

func (h *Hub) run(db *gorm.DB, rdb *redis.Client) {
	for {
		select {
		case client := <-h.register:
			if h.clients[client.userID] == nil {
				h.clients[client.userID] = make(map[*websocket.Conn]bool)
			}
			h.clients[client.userID][client.conn] = true

		case client := <-h.unregister:
			if _, ok := h.clients[client.userID]; ok {
				delete(h.clients[client.userID], client.conn)
				if len(h.clients[client.userID]) == 0 {
					delete(h.clients, client.userID)
				}
				close(client.send)
			}

		case message := <-h.broadcast:
			db.Create(message)
			db.Model(&config.Conversation{}).Where("id = ?", message.ConversationID).
				Updates(map[string]interface{}{
					"last_message_id": message.ID,
					"last_message_at": message.CreatedAt,
				})

			if conns, ok := h.clients[message.ReceiverID]; ok {
				data, _ := json.Marshal(message)
				for conn := range conns {
					conn.WriteMessage(websocket.TextMessage, data)
				}
			}
		}
	}
}

func (c *Client) readPump(db *gorm.DB, rdb *redis.Client) {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512 * 1024)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(data, &wsMsg); err != nil {
			continue
		}

		if wsMsg.Type == "chat.send" {
			var payload struct {
				ConversationID uint64 `json:"conversationId"`
				Content        string `json:"content"`
			}
			json.Unmarshal(wsMsg.Payload, &payload)

			msg := &config.Message{
				ConversationID: payload.ConversationID,
				SenderID:       c.userID,
				Content:        payload.Content,
				MessageType:    1,
				Status:         0,
				CreatedAt:      time.Now(),
			}

			c.hub.broadcast <- msg
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.conn.WriteMessage(websocket.TextMessage, message)

		case <-ticker.C:
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
