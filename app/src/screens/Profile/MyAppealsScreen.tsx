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
import { useQuery } from '@tanstack/react-query';
import { appealAPI } from '../../api';
import { Appeal } from '../../api/appeal';

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

const statusMap: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '待处理', color: '#F59E0B', bg: '#FEF3C7' },
  1: { label: '已通过', color: '#14B8A6', bg: '#D1FAE5' },
  2: { label: '已驳回', color: '#EF4444', bg: '#FEE2E2' },
};

export default function MyAppealsScreen() {
  const navigation = useNavigation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-appeals'],
    queryFn: () => appealAPI.getMyAppeals(50, 0) as Promise<Appeal[]>,
  });

  const appeals = data || [];

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const renderItem = ({ item }: { item: Appeal }) => {
    const status = statusMap[item.status] || statusMap[0];
    const targetTypeText = item.targetType === 1 ? '帖子' : '评论';

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <View style={[styles.typeTag, { backgroundColor: '#EFF6FF' }]}>
            <Text style={styles.typeTagText}>{targetTypeText} #{item.targetId}</Text>
          </View>
          <View style={[styles.statusTag, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusTagText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.itemBody}>
          <Text style={styles.label}>申诉理由：</Text>
          <Text style={styles.reason}>{item.reason}</Text>
        </View>

        {item.handleResult ? (
          <View style={styles.itemBody}>
            <Text style={styles.label}>处理结果：</Text>
            <Text style={styles.result}>{item.handleResult}</Text>
          </View>
        ) : null}

        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的申诉</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={appeals}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="gavel" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>暂无申诉记录</Text>
            <Text style={styles.emptySubText}>当您的内容被删除时，可以发起申诉</Text>
          </View>
        }
        contentContainerStyle={appeals.length === 0 ? { flex: 1 } : undefined}
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
  placeholder: {
    width: 40,
  },
  item: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemBody: {
    marginBottom: 8,
  },
  label: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 4,
  },
  reason: {
    color: '#1E293B',
    fontSize: 14,
    lineHeight: 20,
  },
  result: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubText: {
    color: '#CBD5E1',
    fontSize: 13,
    marginTop: 8,
  },
});
