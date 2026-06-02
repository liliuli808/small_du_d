import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Post, postAPI } from '../api/post';
import Avatar from './Avatar';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
}

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

const PostCard = memo(function PostCard({ post }: PostCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liking, setLiking] = useState(false);

  const handleLike = useCallback(async () => {
    if (liking) return;
    setLiking(true);
    try {
      if (liked) {
        await postAPI.unlikePost(post.id);
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await postAPI.likePost(post.id);
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err: any) {
      Alert.alert('失败', err?.message || '操作失败');
    } finally {
      setLiking(false);
    }
  }, [liked, liking, post.id]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
      activeOpacity={0.9}>
      {/* 头部 */}
      <View style={styles.header}>
        <Avatar nickname={post.user?.nickname || '?'} size={36} />
        <Text style={styles.nickname}>{post.user?.nickname || '匿名用户'}</Text>
        <Text style={styles.time}>{formatTime(post.createdAt)}</Text>
      </View>

      {/* 内容 */}
      <Text style={styles.content} numberOfLines={5}>
        {post.content}
      </Text>

      {/* 图片 */}
      {post.images && post.images.length > 0 && (
        <View style={styles.imageGrid}>
          {post.images.slice(0, 3).map((img) => (
            <FastImage
              key={img.id}
              source={{ uri: img.imageUrl }}
              style={[
                styles.image,
                post.images!.length === 1 && styles.imageSingle,
              ]}
              resizeMode="cover"
            />
          ))}
          {post.images.length > 3 && (
            <View style={styles.moreImages}>
              <Text style={styles.moreImagesText}>+{post.images.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* 底部 */}
      <View style={styles.footer}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{post.category?.name || '分区'}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              handleLike();
            }}
          >
            <Icon
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? '#EF4444' : '#94A3B8'}
            />
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <Icon name="comment-outline" size={18} color="#94A3B8" />
            <Text style={styles.actionText}>{post.commentCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  nickname: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '500',
  },
  time: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 'auto',
  },
  content: {
    color: '#1E293B',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  image: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 8,
  },
  imageSingle: {
    width: width - 80,
    height: (width - 80) * 0.6,
    borderRadius: 12,
  },
  moreImages: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#64748B',
    fontSize: 13,
  },
  actionTextActive: {
    color: '#EF4444',
  },
});

export default PostCard;
