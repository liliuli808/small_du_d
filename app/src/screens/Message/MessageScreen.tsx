import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/RootNavigator';
import Avatar from '../../components/Avatar';

const mockConversations = [
  {
    id: 1,
    nickname: '深海潜水员',
    lastMessage: '好的，下次再聊...',
    time: '14:20',
    unread: 2,
    avatarColor: '#3B82F6',
  },
  {
    id: 2,
    nickname: '夜空中的星',
    lastMessage: '那个帖子我看了，写得真好',
    time: '昨天',
    unread: 0,
    avatarColor: '#14B8A6',
  },
  {
    id: 3,
    nickname: '漫步者',
    lastMessage: '可以加个联系方式吗？',
    time: '前天',
    unread: 1,
    avatarColor: '#F43F5E',
  },
];

export default function MessageScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const renderItem = ({ item }: { item: typeof mockConversations[0] }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        navigation.navigate('ChatDetail', {
          conversationId: item.id,
          nickname: item.nickname,
        })
      }
    >
      <Avatar nickname={item.nickname} size={48} />
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.nickname}>{item.nickname}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unread > 99 ? '99+' : item.unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>消息</Text>
        <TouchableOpacity>
          <Icon name="magnify" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockConversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="message-text-outline" size={48} color="#E2E8F0" />
            <Text style={styles.emptyText}>暂无消息</Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#FFFFFF',
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
});
