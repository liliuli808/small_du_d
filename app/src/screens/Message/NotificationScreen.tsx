import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../../api';
import { Notification } from '../../api/notification';

function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

const typeMap: Record<number, { icon: string; color: string }> = {
  1: { icon: 'bell-outline', color: '#3B82F6' },
  2: { icon: 'comment-outline', color: '#14B8A6' },
  3: { icon: 'heart-outline', color: '#F43F5E' },
  4: { icon: 'alert-circle-outline', color: '#F59E0B' },
  5: { icon: 'shield-check-outline', color: '#8B5CF6' },
};

export default function NotificationScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getList(50, 0) as Promise<{ items: Notification[]; unreadCount: number }>,
  });

  const notifications = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  const markRead = useMutation({
    mutationFn: (id: number) => notificationAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const renderItem = ({ item }: { item: Notification }) => {
    const type = typeMap[item.type] || typeMap[1];
    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => {
          if (!item.isRead) {
            markRead.mutate(item.id);
          }
        }}
      >
        <View style={[styles.iconCircle, { backgroundColor: type.color + '20' }]}>
          <Icon name={type.icon} size={20} color={type.color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.content}
          </Text>
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>通知</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text style={styles.markAllText}>全部已读</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={styles.placeholder} />}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell-off-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>暂无通知</Text>
          </View>
        }
      />
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
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  markAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    paddingRight: 8,
  },
  placeholder: {
    width: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  itemUnread: {
    backgroundColor: '#EFF6FF',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  titleUnread: {
    color: '#1E293B',
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginTop: 4,
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
});
