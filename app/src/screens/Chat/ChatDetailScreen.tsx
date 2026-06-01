import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/RootNavigator';
import Avatar from '../../components/Avatar';

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

interface Message {
  id: number;
  senderId: number;
  content: string;
  createdAt: string;
  isSelf: boolean;
}

const mockMessages: Message[] = [
  {
    id: 1,
    senderId: 2,
    content: '你好，看到你的帖子，感觉我们兴趣挺像的',
    createdAt: '10:05',
    isSelf: false,
  },
  {
    id: 2,
    senderId: 1,
    content: '是的，我也觉得。你平时经常逛这个分区吗？',
    createdAt: '10:07',
    isSelf: true,
  },
  {
    id: 3,
    senderId: 2,
    content: '差不多每天都会来看看，有时候也发发帖',
    createdAt: '10:08',
    isSelf: false,
  },
  {
    id: 4,
    senderId: 1,
    content: '我也是！以后可以多交流交流',
    createdAt: '10:10',
    isSelf: true,
  },
];

export default function ChatDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatDetailRouteProp>();
  const { nickname } = route.params;
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({
      title: nickname,
    });
  }, [navigation, nickname]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now(),
      senderId: 1,
      content: inputText.trim(),
      createdAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageRow,
        item.isSelf ? styles.messageRowSelf : styles.messageRowOther,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isSelf ? styles.bubbleSelf : styles.bubbleOther,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isSelf ? styles.messageTextSelf : styles.messageTextOther,
          ]}
        >
          {item.content}
        </Text>
      </View>
      <Text style={styles.messageTime}>{item.createdAt}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.plusButton}>
          <Icon name="plus-circle-outline" size={26} color="#9CA3AF" />
        </TouchableOpacity>
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
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
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
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  messageRowSelf: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOther: {
    backgroundColor: '#F8FAFC',
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
    color: '#1E293B',
  },
  messageTime: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  plusButton: {
    padding: 4,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    opacity: 0.5,
  },
});
