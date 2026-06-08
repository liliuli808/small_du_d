import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import PostCard from '../../components/PostCard';
import Avatar from '../../components/Avatar';
import { categoryAPI } from '../../api';
import type { Moderator } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Post } from '../../api/post';
import { RootStackParamList } from '../../navigation/RootNavigator';

type CategoryDetailRouteProp = RouteProp<RootStackParamList, 'CategoryDetail'>;

export default function CategoryDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CategoryDetailRouteProp>();
  const { categoryId } = route.params;

  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'posts' | 'rules' | 'mods'>('posts');

  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // 获取分区详情
  const { data: category, refetch: refetchCategory } = useQuery({
    queryKey: ['categoryDetail', categoryId],
    queryFn: () => categoryAPI.getDetail(categoryId),
  });

  // 获取负责人列表
  const { data: moderators } = useQuery({
    queryKey: ['categoryModerators', categoryId],
    queryFn: () => categoryAPI.getModerators(categoryId),
  });

  const isModerator = user && moderators?.some((m: Moderator) => m.userId === user.id);

  // 获取帖子列表
  const { isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['categoryPosts', categoryId],
    queryFn: async () => {
      const res = await categoryAPI.getPosts(categoryId, undefined, 20);
      setPosts(res.items || []);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
      return res;
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategory(), refetchPosts()]);
    setRefreshing(false);
  }, [refetchCategory, refetchPosts]);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || !cursor || postsLoading) return;
    const res = await categoryAPI.getPosts(categoryId, cursor, 20);
    setPosts((prev) => [...prev, ...(res.items || [])]);
    setCursor(res.nextCursor);
    setHasMore(res.hasMore);
  }, [categoryId, cursor, hasMore, postsLoading]);

  const renderPostItem = useCallback(({ item }: { item: Post }) => (
    <PostCard post={item} />
  ), []);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* 分区标题 */}
      <View style={styles.titleRow}>
        <View style={styles.iconCircle}>
          <Icon name="folder-outline" size={28} color="#3B82F6" />
        </View>
        <View style={styles.titleInfo}>
          <Text style={styles.categoryName}>{category?.name}</Text>
          <Text style={styles.postCount}>{category?.postCount || 0} 帖子</Text>
        </View>
        {category?.allowImage && (
          <View style={styles.badge}>
            <Icon name="image" size={12} color="#3B82F6" />
            <Text style={styles.badgeText}>可发图</Text>
          </View>
        )}
      </View>

      {/* 分区描述 */}
      {category?.description && (
        <Text style={styles.description}>{category.description}</Text>
      )}

      {/* 公告 */}
      {category?.announcement && (
        <View style={styles.announcementBox}>
          <View style={styles.announcementHeader}>
            <Icon name="bullhorn" size={14} color="#F59E0B" />
            <Text style={styles.announcementTitle}>分区公告</Text>
          </View>
          <Text style={styles.announcementText}>{category.announcement}</Text>
        </View>
      )}

      {/* Tab 切换 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}>
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
            帖子
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rules' && styles.tabActive]}
          onPress={() => setActiveTab('rules')}>
          <Text style={[styles.tabText, activeTab === 'rules' && styles.tabTextActive]}>
            规则
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mods' && styles.tabActive]}
          onPress={() => setActiveTab('mods')}>
          <Text style={[styles.tabText, activeTab === 'mods' && styles.tabTextActive]}>
            负责人
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRules = () => (
    <ScrollView style={styles.rulesContainer}>
      {category?.rules ? (
        <Text style={styles.rulesText}>{category.rules}</Text>
      ) : (
        <View style={styles.emptyBox}>
          <Icon name="file-document-outline" size={40} color="#CBD5E1" />
          <Text style={styles.emptyText}>暂无分区规则</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderModerators = () => (
    <View style={styles.modsContainer}>
      {moderators && moderators.length > 0 ? (
        moderators.map((mod: Moderator) => (
          <View key={mod.id} style={styles.modItem}>
            <Avatar nickname={mod.user?.nickname || '?'} size={44} />
            <View style={styles.modInfo}>
              <Text style={styles.modName}>{mod.user?.nickname || '匿名用户'}</Text>
              <View style={[styles.modRole, mod.role === 1 ? styles.modRoleChief : styles.modRoleDeputy]}>
                <Text style={mod.role === 1 ? styles.modRoleChiefText : styles.modRoleDeputyText}>
                  {mod.role === 1 ? '负责人' : '副负责人'}
                </Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyBox}>
          <Icon name="account-group-outline" size={40} color="#CBD5E1" />
          <Text style={styles.emptyText}>暂无负责人</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {category?.name || '分区详情'}
        </Text>
        <View style={styles.navRight}>
          {isModerator && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ModeratorPanel', { categoryId, categoryName: category?.name || '' })}
            >
              <Icon name="cog-outline" size={22} color="#1E293B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {activeTab === 'posts' ? (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator style={styles.loader} color="#3B82F6" />
            ) : posts.length > 0 ? (
              <Text style={styles.noMore}>没有更多内容了</Text>
            ) : null
          }
          ListEmptyComponent={
            !postsLoading ? (
              <View style={styles.emptyBox}>
                <Icon name="post-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>暂无帖子</Text>
              </View>
            ) : null
          }
        />
      ) : activeTab === 'rules' ? (
        <>
          {renderHeader()}
          {renderRules()}
        </>
      ) : (
        <>
          {renderHeader()}
          {renderModerators()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  navBar: {
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
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  navRight: {
    width: 40,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  postCount: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  announcementTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  announcementText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  rulesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  rulesText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 22,
  },
  modsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  modItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modInfo: {
    marginLeft: 12,
    flex: 1,
  },
  modName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  modRole: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  modRoleChief: {
    backgroundColor: '#FEF3C7',
  },
  modRoleDeputy: {
    backgroundColor: '#E0E7FF',
  },
  modRoleChiefText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  modRoleDeputyText: {
    fontSize: 11,
    color: '#3730A3',
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  loader: {
    paddingVertical: 20,
  },
  noMore: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
