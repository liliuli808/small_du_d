import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { chatAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/Avatar';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface ConversationItem {
  id: number;
  userAId: number;
  userBId: number;
  status: number;
  lastMessageId?: number;
  lastMessageAt?: string;
  createdAt: string;
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function MessageScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((state) => state.user);

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatAPI.getConversations() as Promise<ConversationItem[]>,
  });

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const getOtherUserId = (conv: ConversationItem) => {
    return conv.userAId === user?.id ? conv.userBId : conv.userAId;
  };

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const otherId = getOtherUserId(item);
    const nickname = `用户${otherId}`;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          navigation.navigate('ChatDetail', {
            conversationId: item.id,
            nickname,
            targetUserId: otherId,
          })
        }
      >
        <Avatar nickname={nickname} size={48} />
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.nickname}>{nickname}</Text>
            <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessageId ? '...' : '暂无消息'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>消息</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#3B82F6" />
      ) : (
        <FlatList
          data={conversations || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#3B82F6" />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="message-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>暂无消息</Text>
              <Text style={styles.emptyHint}>从帖子详情页点击"私聊"开始聊天</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  loader: {
    marginTop: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nickname: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '500',
  },
  time: {
    color: '#94A3B8',
    fontSize: 12,
  },
  lastMessage: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    flex: 1,
    marginRight: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 76,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  emptyHint: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 4,
  },
});
