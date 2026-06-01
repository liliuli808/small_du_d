import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from '../../components/Avatar';
import { electionAPI } from '../../api';
import { RootStackParamList } from '../../navigation/RootNavigator';

interface Election {
  id: number;
  categoryId: number;
  title: string;
  status: number;
  signupStartAt?: string;
  signupEndAt?: string;
  voteStartAt?: string;
  voteEndAt?: string;
  createdAt: string;
}

interface Candidate {
  id: number;
  userId: number;
  manifesto: string;
  voteCount: number;
  user?: {
    id: number;
    nickname: string;
    avatarUrl: string;
  };
}

export default function ElectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [manifesto, setManifesto] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 获取选举列表
  const { data: elections, isLoading, refetch } = useQuery({
    queryKey: ['elections'],
    queryFn: () => electionAPI.getList() as Promise<Election[]>,
  });

  // 获取选举详情
  const { data: electionDetail } = useQuery({
    queryKey: ['electionDetail', selectedElection?.id],
    queryFn: () => electionAPI.getDetail(selectedElection!.id) as Promise<Election>,
    enabled: !!selectedElection && showDetail,
  });

  // 获取候选人
  const { data: candidates, refetch: refetchCandidates } = useQuery({
    queryKey: ['candidates', selectedElection?.id],
    queryFn: () => electionAPI.getCandidates(selectedElection!.id) as Promise<Candidate[]>,
    enabled: !!selectedElection && showDetail,
  });

  // 报名参选
  const signupMutation = useMutation({
    mutationFn: () => electionAPI.signup(selectedElection!.id, manifesto),
    onSuccess: () => {
      Alert.alert('成功', '报名成功！');
      setShowSignupModal(false);
      setManifesto('');
      refetchCandidates();
    },
    onError: (err: any) => {
      Alert.alert('失败', err?.response?.data?.message || '报名失败');
    },
  });

  // 投票
  const voteMutation = useMutation({
    mutationFn: (candidateId: number) => electionAPI.vote(selectedElection!.id, candidateId),
    onSuccess: () => {
      Alert.alert('成功', '投票成功！');
      refetchCandidates();
    },
    onError: (err: any) => {
      Alert.alert('失败', err?.response?.data?.message || '投票失败');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openElectionDetail = (election: Election) => {
    setSelectedElection(election);
    setShowDetail(true);
  };

  const getStatusLabel = (status: number) => {
    const labels: Record<number, { text: string; color: string; bg: string }> = {
      0: { text: '草稿', color: '#94A3B8', bg: '#F1F5F9' },
      1: { text: '报名中', color: '#3B82F6', bg: '#EFF6FF' },
      2: { text: '投票中', color: '#10B981', bg: '#ECFDF5' },
      3: { text: '公示中', color: '#F59E0B', bg: '#FEF3C7' },
      4: { text: '已结束', color: '#64748B', bg: '#F1F5F9' },
      5: { text: '已取消', color: '#EF4444', bg: '#FEE2E2' },
    };
    return labels[status] || labels[0];
  };

  const renderElectionList = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
    >
      {elections && elections.length > 0 ? (
        elections.map((election) => {
          const status = getStatusLabel(election.status);
          return (
            <TouchableOpacity
              key={election.id}
              style={styles.electionCard}
              onPress={() => openElectionDetail(election)}
              activeOpacity={0.8}
            >
              <View style={styles.electionHeader}>
                <Text style={styles.electionTitle}>{election.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                </View>
              </View>
              <View style={styles.electionInfo}>
                <Icon name="calendar-range" size={14} color="#94A3B8" />
                <Text style={styles.electionDate}>
                  {election.signupStartAt
                    ? new Date(election.signupStartAt).toLocaleDateString()
                    : '待定'}
                  {' ~ '}
                  {election.voteEndAt
                    ? new Date(election.voteEndAt).toLocaleDateString()
                    : '待定'}
                </Text>
              </View>
              <View style={styles.electionFooter}>
                <Text style={styles.electionId}>选举 #{election.id}</Text>
                <Icon name="chevron-right" size={18} color="#CBD5E1" />
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyBox}>
          <Icon name="vote-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>暂无选举活动</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderElectionDetail = () => {
    if (!selectedElection) return null;
    const status = getStatusLabel(electionDetail?.status ?? selectedElection.status);

    return (
      <View style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => setShowDetail(false)} style={styles.backButton}>
            <Icon name="chevron-left" size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>选举详情</Text>
          <View style={styles.navRight} />
        </View>

        <ScrollView style={styles.detailContent}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{selectedElection.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
            </View>
          </View>

          {/* 时间线 */}
          <View style={styles.timeline}>
            {[
              { icon: 'account-plus', label: '报名期', date: selectedElection.signupStartAt },
              { icon: 'vote', label: '投票期', date: selectedElection.voteStartAt },
            ].map((item, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Icon name={item.icon} size={16} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.timelineLabel}>{item.label}</Text>
                  <Text style={styles.timelineDate}>
                    {item.date ? new Date(item.date).toLocaleString() : '待定'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* 操作按钮 */}
          {selectedElection.status === 1 && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowSignupModal(true)}
            >
              <Icon name="account-plus" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>报名参选</Text>
            </TouchableOpacity>
          )}

          {/* 候选人列表 */}
          <View style={styles.candidatesSection}>
            <Text style={styles.sectionTitle}>
              候选人 ({candidates?.length || 0})
            </Text>
            {candidates && candidates.length > 0 ? (
              candidates.map((candidate, idx) => (
                <View key={candidate.id} style={styles.candidateCard}>
                  <View style={styles.candidateRank}>
                    {idx < 3 ? (
                      <View style={[styles.rankBadge, idx === 0 && styles.rankFirst]}>
                        <Text style={styles.rankText}>{idx + 1}</Text>
                      </View>
                    ) : (
                      <Text style={styles.rankTextPlain}>{idx + 1}</Text>
                    )}
                  </View>
                  <Avatar nickname={candidate.user?.nickname || '?'} size={40} />
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>
                      {candidate.user?.nickname || '匿名用户'}
                    </Text>
                    <Text style={styles.candidateManifesto} numberOfLines={2}>
                      {candidate.manifesto}
                    </Text>
                  </View>
                  <View style={styles.candidateVote}>
                    <Text style={styles.voteCount}>{candidate.voteCount}</Text>
                    <Text style={styles.voteLabel}>票</Text>
                  </View>
                  {selectedElection.status === 2 && (
                    <TouchableOpacity
                      style={styles.voteBtn}
                      onPress={() => voteMutation.mutate(candidate.id)}
                      disabled={voteMutation.isPending}
                    >
                      <Text style={styles.voteBtnText}>投TA</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>暂无候选人</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!showDetail ? (
        <>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="chevron-left" size={28} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>分区选举</Text>
            <View style={styles.navRight} />
          </View>
          {renderElectionList()}
        </>
      ) : (
        renderElectionDetail()
      )}

      {/* 报名弹窗 */}
      <Modal
        visible={showSignupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSignupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>报名参选</Text>
            <Text style={styles.modalSubtitle}>请填写你的竞选宣言（10-2000字）</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={6}
              placeholder="写下你的竞选宣言..."
              placeholderTextColor="#94A3B8"
              value={manifesto}
              onChangeText={setManifesto}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowSignupModal(false);
                  setManifesto('');
                }}
              >
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={() => {
                  if (manifesto.trim().length < 10) {
                    Alert.alert('提示', '竞选宣言至少需要10个字');
                    return;
                  }
                  signupMutation.mutate();
                }}
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>确认报名</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  electionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  electionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  electionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  electionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  electionDate: {
    fontSize: 13,
    color: '#64748B',
  },
  electionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  electionId: {
    fontSize: 12,
    color: '#94A3B8',
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  timeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  timelineDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  candidatesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  candidateRank: {
    width: 28,
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankFirst: {
    backgroundColor: '#FEF3C7',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  rankTextPlain: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  candidateManifesto: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  candidateVote: {
    alignItems: 'center',
    marginRight: 4,
  },
  voteCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  voteLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  voteBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  voteBtnText: {
    fontSize: 12,
    color: '#3B82F6',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
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
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 120,
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
    backgroundColor: '#3B82F6',
  },
  modalBtnSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
