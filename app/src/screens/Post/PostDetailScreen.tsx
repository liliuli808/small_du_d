import React, { useState, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import { postAPI, reportAPI, commentAPI, chatAPI, appealAPI } from '../../api';
import Avatar from '../../components/Avatar';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/authStore';
import { Comment } from '../../api/comment';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

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

export default function PostDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PostDetailRouteProp>();
  const queryClient = useQueryClient();
  const { postId } = route.params;
  const user = useAuthStore((state) => state.user);

  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [sending, setSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReasonType, setReportReasonType] = useState(1);
  const [reportText, setReportText] = useState('');
  const [reporting, setReporting] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [appealing, setAppealing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 获取帖子详情
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postAPI.getPost(postId),
  });

  // 获取评论列表
  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentAPI.getList(postId, 50, 0),
    select: (res) => res.items,
  });

  // 发表评论
  const sendComment = useMutation({
    mutationFn: (content: string) => commentAPI.create(postId, content),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: (err: any) => {
      Alert.alert('失败', err?.message || '评论发送失败');
    },
  });

  // 删除评论
  const deleteComment = useMutation({
    mutationFn: (id: number) => commentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: (err: any) => {
      Alert.alert('失败', err?.message || '删除失败');
    },
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
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    } catch (error) {
      // ignore
    }
  };

  const handleChat = async () => {
    if (!post?.userId || post.userId === user?.id) {
      Alert.alert('提示', '不能和自己私聊');
      return;
    }
    try {
      const res = await chatAPI.createConversation(post.userId);
      navigation.navigate('ChatDetail', {
        conversationId: res.id,
        nickname: post.user?.nickname || '匿名用户',
        targetUserId: post.userId,
      });
    } catch (err: any) {
      Alert.alert('失败', err?.message || '创建会话失败');
    }
  };

  const handleSendComment = async () => {
    const content = commentText.trim();
    if (!content) {
      Alert.alert('提示', '请输入评论内容');
      return;
    }
    setSending(true);
    try {
      await sendComment.mutateAsync(content);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (comment: Comment) => {
    Alert.alert('确认删除', '确定要删除这条评论吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteComment.mutate(comment.id),
      },
    ]);
  };

  const handleAppeal = async () => {
    const reason = appealText.trim();
    if (!reason) {
      Alert.alert('提示', '请填写申诉理由');
      return;
    }
    setAppealing(true);
    try {
      await appealAPI.create({
        targetType: 1,
        targetId: postId,
        categoryId: post?.categoryId,
        reason,
      });
      setAppealing(false);
      setShowAppealModal(false);
      setAppealText('');
      Alert.alert('成功', '申诉已提交，我们会尽快处理');
    } catch (err: any) {
      setAppealing(false);
      Alert.alert('失败', err?.response?.data?.message || err?.message || '申诉提交失败');
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
        targetType: 1,
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
      Alert.alert('失败', err?.message || '举报提交失败');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['post', postId] }),
      refetchComments(),
    ]);
    setRefreshing(false);
  }, [postId, queryClient, refetchComments]);

  // 举报评论
  const handleReportComment = (comment: Comment) => {
    Alert.alert(
      '举报评论',
      '请选择举报原因',
      [
        { text: '垃圾广告', onPress: () => submitReportComment(comment, 1) },
        { text: '色情低俗', onPress: () => submitReportComment(comment, 2) },
        { text: '人身攻击', onPress: () => submitReportComment(comment, 4) },
        { text: '其他', onPress: () => submitReportComment(comment, 6) },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const submitReportComment = async (comment: Comment, reasonType: number) => {
    try {
      await reportAPI.create({
        targetType: 2,
        targetId: comment.id,
        categoryId: post?.categoryId,
        reasonType,
        reasonText: '',
      });
      Alert.alert('成功', '举报已提交');
    } catch (err: any) {
      Alert.alert('失败', err?.message || '举报失败');
    }
  };

  // 渲染单条评论
  const renderComment = (comment: Comment) => {
    const isMine = user?.id === comment.userId;
    return (
      <View key={comment.id} style={styles.commentItem}>
        <Avatar nickname={comment.user?.nickname || '?'} size={36} />
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentNickname}>
              {comment.user?.nickname || '匿名用户'}
            </Text>
            <Text style={styles.commentTime}>
              {formatTime(comment.createdAt)}
            </Text>
          </View>
          <Text style={styles.commentContent}>{comment.content}</Text>
        </View>
        <View style={styles.commentActions}>
          {!isMine && (
            <TouchableOpacity
              style={styles.commentActionBtn}
              onPress={() => handleReportComment(comment)}
            >
              <Icon name="flag-outline" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
          {isMine && (
            <TouchableOpacity
              style={styles.commentActionBtn}
              onPress={() => handleDeleteComment(comment)}
            >
              <Icon name="trash-can-outline" size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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
          <Icon name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{post.category?.name || '帖子详情'}</Text>
        <TouchableOpacity onPress={() => setShowReportModal(true)}>
          <Icon name="dots-vertical" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* 作者信息 */}
        <View style={styles.authorRow}>
          <Avatar nickname={post.user?.nickname || '?'} size={44} />
          <View style={styles.authorInfo}>
            <Text style={styles.nickname}>{post.user?.nickname || '匿名用户'}</Text>
            <Text style={styles.time}>{formatTime(post.createdAt)}</Text>
          </View>
          {post.userId !== user?.id && (
            <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
              <Icon name="message-text-outline" size={16} color="#3B82F6" />
              <Text style={styles.chatButtonText}>私聊</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 帖子内容 */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* 申诉提示（帖子被删除时） */}
        {post.status === 1 && post.userId === user?.id && (
          <View style={styles.appealBanner}>
            <Icon name="alert-circle-outline" size={18} color="#F59E0B" />
            <Text style={styles.appealBannerText}>该帖子已被删除</Text>
            <TouchableOpacity style={styles.appealBannerBtn} onPress={() => setShowAppealModal(true)}>
              <Text style={styles.appealBannerBtnText}>申诉</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 图片 - 优先加载缩略图 */}
        {post.images && post.images.length > 0 && (
          <View style={styles.imageContainer}>
            {post.images.map((img: any) => (
              <FastImage
                key={img.id}
                source={{ uri: img.thumbUrl || img.imageUrl }}
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
        </View>

        {/* 分区标签 */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{post.category?.name || '分区'}</Text>
        </View>

        {/* 评论区 */}
        <View style={styles.commentSection}>
          <Text style={styles.commentTitle}>评论 ({post.commentCount})</Text>
          {commentsLoading ? (
            <ActivityIndicator style={styles.commentLoader} color="#3B82F6" />
          ) : comments && comments.length > 0 ? (
            comments.map(renderComment)
          ) : (
            <View style={styles.emptyComments}>
              <Icon name="comment-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyText}>暂无评论，来说两句吧</Text>
            </View>
          )}
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
          maxLength={1000}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!commentText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Icon name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* 申诉弹窗 */}
      <Modal
        visible={showAppealModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppealModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>内容申诉</Text>
            <Text style={styles.modalSubtitle}>请说明申诉理由，我们会尽快处理</Text>

            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={4}
              placeholder="填写申诉理由（5-500字）..."
              placeholderTextColor="#94A3B8"
              value={appealText}
              onChangeText={setAppealText}
              textAlignVertical="top"
              maxLength={500}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowAppealModal(false);
                  setAppealText('');
                }}
              >
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleAppeal}
                disabled={appealing || appealText.trim().length < 5}
              >
                {appealing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>提交申诉</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#FFFFFF',
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
    gap: 12,
  },
  authorInfo: {
    flex: 1,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  chatButtonText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '500',
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
  appealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  appealBannerText: {
    flex: 1,
    color: '#92400E',
    fontSize: 14,
  },
  appealBannerBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  appealBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  commentLoader: {
    paddingVertical: 40,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentNickname: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '500',
  },
  commentTime: {
    color: '#94A3B8',
    fontSize: 11,
  },
  commentContent: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
    paddingTop: 4,
  },
  commentActionBtn: {
    padding: 4,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
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
    maxHeight: 80,
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
