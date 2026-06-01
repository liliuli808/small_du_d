import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import { postAPI, reportAPI } from '../../api';
import Avatar from '../../components/Avatar';
import { RootStackParamList } from '../../navigation/RootNavigator';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;





export default function PostDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;

  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReasonType, setReportReasonType] = useState(1);
  const [reportText, setReportText] = useState('');
  const [reporting, setReporting] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postAPI.getPost(postId),
  });

  const handleLike = async () => {
    try {
      if (liked) {
        await postAPI.unlikePost(postId);
        setLiked(false);
      } else {
        await postAPI.likePost(postId);
        setLiked(true);
      }
    } catch (error) {
      // ignore
    }
  };

  const handleReport = async () => {
    if (!reportText.trim()) {
      Alert.alert('提示', '请填写举报原因');
      return;
    }
    setReporting(true);
    try {
      await reportAPI.create({
        targetType: 1, // 帖子
        targetId: postId,
        categoryId: post?.categoryId,
        reasonType: reportReasonType,
        reasonText: reportText,
      });
      setReporting(false);
      setShowReportModal(false);
      setReportText('');
      Alert.alert('成功', '举报已提交，我们会尽快处理');
    } catch (err: any) {
      setReporting(false);
      Alert.alert('失败', err?.response?.data?.message || '举报提交失败');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>帖子不存在</Text>
      </View>
    );
  }

    
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{post.category?.name || '帖子详情'}</Text>
        <TouchableOpacity onPress={() => setShowReportModal(true)}>
          <Icon name="dots-vertical" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* 作者信息 */}
        <View style={styles.authorRow}>
          <Avatar nickname={post.user?.nickname || '?'} size={44} />
          <View>
            <Text style={styles.nickname}>{post.user?.nickname || '匿名用户'}</Text>
            <Text style={styles.time}>{post.createdAt}</Text>
          </View>
        </View>

        {/* 帖子内容 */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* 图片 */}
        {post.images && post.images.length > 0 && (
          <View style={styles.imageContainer}>
            {post.images.map((img: any) => (
              <FastImage
                key={img.id}
                source={{ uri: img.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {/* 互动栏 */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Icon name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#EF4444' : '#9CA3AF'} />
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>{post.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="comment-outline" size={22} color="#9CA3AF" />
            <Text style={styles.actionText}>{post.commentCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="bookmark-outline" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="share-outline" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* 分区标签 */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{post.category?.name || '分区'}</Text>
        </View>

        {/* 评论区 */}
        <View style={styles.commentSection}>
          <Text style={styles.commentTitle}>评论 ({post.commentCount})</Text>
          {/* TODO: 加载评论列表 */}
          <View style={styles.emptyComments}>
            <Text style={styles.emptyText}>暂无评论，来说两句吧</Text>
          </View>
        </View>
      </ScrollView>

      {/* 底部评论输入 */}
      <View style={styles.commentInputBar}>
        <TextInput
          style={styles.commentInput}
          placeholder="写下你的评论..."
          placeholderTextColor="#6B7280"
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity style={styles.sendButton}>
          <Icon name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 举报弹窗 */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>举报帖子</Text>
            <Text style={styles.modalSubtitle}>请选择举报原因</Text>

            <View style={styles.reasonList}>
              {[
                { id: 1, label: '垃圾广告' },
                { id: 2, label: '色情低俗' },
                { id: 3, label: '政治敏感' },
                { id: 4, label: '人身攻击' },
                { id: 5, label: '与分区主题无关' },
                { id: 6, label: '其他' },
              ].map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonItem,
                    reportReasonType === reason.id && styles.reasonItemActive,
                  ]}
                  onPress={() => setReportReasonType(reason.id)}
                >
                  <View style={styles.radioCircle}>
                    {reportReasonType === reason.id && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.reasonText,
                      reportReasonType === reason.id && styles.reasonTextActive,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={3}
              placeholder="补充说明（可选）..."
              placeholderTextColor="#94A3B8"
              value={reportText}
              onChangeText={setReportText}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowReportModal(false);
                  setReportText('');
                }}
              >
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleReport}
                disabled={reporting}
              >
                {reporting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>提交举报</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '600',
  },
  nickname: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '500',
  },
  time: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    color: '#1E293B',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
  },
  imageContainer: {
    gap: 8,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#64748B',
    fontSize: 14,
  },
  actionTextActive: {
    color: '#EF4444',
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 24,
  },
  categoryText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  commentTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#1E293B',
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  reasonList: {
    gap: 8,
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  reasonItemActive: {
    backgroundColor: '#EFF6FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  reasonText: {
    fontSize: 14,
    color: '#64748B',
  },
  reasonTextActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 80,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F1F5F9',
  },
  modalBtnCancelText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  modalBtnSubmit: {
    backgroundColor: '#EF4444',
  },
  modalBtnSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
