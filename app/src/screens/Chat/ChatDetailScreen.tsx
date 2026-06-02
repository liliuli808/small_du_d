import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { MMKV } from 'react-native-mmkv';
import { chatAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/Avatar';
import { RootStackParamList } from '../../navigation/RootNavigator';

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

interface MessageItem {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  messageType: number;
  status: number;
  createdAt: string;
}

const storage = new MMKV();

function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatDetailRouteProp>();
  const { conversationId, nickname, targetUserId } = route.params;
  const user = useAuthStore((state) => state.user);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 加载历史消息
  const { isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await chatAPI.getMessages(conversationId, undefined, 100);
      const msgs = (res.items || res || []) as MessageItem[];
      // 按时间正序排列
      const sorted = msgs.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sorted);
      return sorted;
    },
  });

  // 建立 WebSocket 连接
  useEffect(() => {
    const token = storage.getString('accessToken');
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.conversationId === conversationId) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === msg.id);
            if (exists) return prev;
            return [...prev, msg];
          });
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [conversationId]);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // 设置导航标题
  useEffect(() => {
    navigation.setOptions({
      title: nickname,
      headerRight: () => (
        <View style={styles.headerStatus}>
          <View style={[styles.statusDot, wsConnected ? styles.statusOnline : styles.statusOffline]} />
        </View>
      ),
    });
  }, [navigation, nickname, wsConnected]);

  const sendMessage = useCallback(() => {
    const content = inputText.trim();
    if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      type: 'chat.send',
      payload: JSON.stringify({
        conversationId,
        content,
      }),
    };

    wsRef.current.send(JSON.stringify(payload));

    // 本地先添加一条 optimistic message
    const optimisticMsg: MessageItem = {
      id: Date.now(),
      conversationId,
      senderId: user?.id || 0,
      receiverId: targetUserId,
      content,
      messageType: 1,
      status: 0,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
  }, [inputText, conversationId, targetUserId, user?.id]);

  const isSelf = (msg: MessageItem) => msg.senderId === user?.id;

  const renderMessage = ({ item }: { item: MessageItem }) => {
    const self = isSelf(item);
    return (
      <View
        style={[
          styles.messageRow,
          self ? styles.messageRowSelf : styles.messageRowOther,
        ]}
      >
        {!self && <Avatar nickname={nickname} size={28} />}
        <View style={[styles.messageWrapper, self && styles.messageWrapperSelf]}>
          <View
            style={[
              styles.messageBubble,
              self ? styles.bubbleSelf : styles.bubbleOther,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                self ? styles.messageTextSelf : styles.messageTextOther,
              ]}
            >
              {item.content}
            </Text>
          </View>
          <Text style={[styles.messageTime, self && styles.messageTimeSelf]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      {!wsConnected && !isLoading && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>连接中...</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="输入消息..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || !wsConnected) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || !wsConnected}
        >
          <Icon name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStatus: {
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: '#10B981',
  },
  statusOffline: {
    backgroundColor: '#CBD5E1',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  messageRowSelf: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageWrapper: {
    marginLeft: 8,
    maxWidth: '85%',
  },
  messageWrapperSelf: {
    marginLeft: 0,
    marginRight: 0,
    alignItems: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  bubbleSelf: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextOther: {
    color: '#1E293B',
  },
  messageTextSelf: {
    color: '#FFFFFF',
  },
  messageTime: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeSelf: {
    alignSelf: 'flex-end',
  },
  offlineBar: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    alignItems: 'center',
  },
  offlineText: {
    color: '#92400E',
    fontSize: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#1E293B',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
