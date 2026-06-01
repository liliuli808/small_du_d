import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationAPI } from '../../api';
import { RootStackParamList } from '../../navigation/RootNavigator';

type ModeratorPanelRouteProp = RouteProp<RootStackParamList, 'ModeratorPanel'>;

interface ReportItem {
  id: number;
  reporterId: number;
  targetType: number;
  targetId: number;
  reasonType: number;
  reasonText: string;
  status: number;
  createdAt: string;
}

export default function ModeratorPanelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ModeratorPanelRouteProp>();
  const { categoryId, categoryName } = route.params;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'announcement' | 'rules' | 'reports'>('reports');
  const [announcementText, setAnnouncementText] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [handleRemark, setHandleRemark] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 获取举报列表
  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['reports', categoryId],
    queryFn: async () => {
      const res = await moderationAPI.getReports(categoryId, 0, 50, 0);
      return (res.items || res || []) as ReportItem[];
    },
  });

  // 更新公告
  const updateAnnouncement = useMutation({
    mutationFn: (text: string) => moderationAPI.updateAnnouncement(categoryId, text),
    onSuccess: () => {
      Alert.alert('成功', '公告已更新');
      queryClient.invalidateQueries({ queryKey: ['categoryDetail', categoryId] });
    },
    onError: (err: any) => {
      Alert.alert('失败', err?.response?.data?.message || '更新公告失败');
    },
  });

  // 更新规则
  const updateRules = useMutation({
    mutationFn: (text: string) => moderationAPI.updateRules(categoryId, text),
    onSuccess: () => {
      Alert.alert('成功', '规则已更新');
      queryClient.invalidateQueries({ queryKey: ['categoryDetail', categoryId] });
    },
    onError: (err: any) => {
      Alert.alert('失败', err?.response?.data?.message || '更新规则失败');
    },
  });

  // 处理举报
  const handleReport = useMutation({
    mutationFn: ({ id, status, remark }: { id: number; status: number; remark?: string }) =>
      moderationAPI.handleReport(id, status, remark),
    onSuccess: () => {
      Alert.alert('成功', '举报已处理');
      setShowReportModal(false);
      setSelectedReport(null);
      setHandleRemark('');
      queryClient.invalidateQueries({ queryKey: ['reports', categoryId] });
    },
    onError: (err: any) => {
      Alert.alert('失败', err?.response?.data?.message || '处理失败');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openReportModal = (report: ReportItem) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const renderReports = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
    >
      {reports && reports.length > 0 ? (
        reports.map((report) => (
          <View key={report.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportTypeBadge}>
                <Text style={styles.reportTypeText}>
                  {report.targetType === 1 ? '帖子' : report.targetType === 2 ? '评论' : '其他'}
                </Text>
              </View>
              <Text style={styles.reportId}>ID: {report.targetId}</Text>
            </View>
            <Text style={styles.reportReason}>
              原因: {report.reasonText || `类型${report.reasonType}`}
            </Text>
            <Text style={styles.reportTime}>{new Date(report.createdAt).toLocaleString()}</Text>
            <View style={styles.reportActions}>
              <TouchableOpacity
                style={[styles.reportBtn, styles.reportBtnApprove]}
                onPress={() => openReportModal(report)}
              >
                <Text style={styles.reportBtnApproveText}>处理</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyBox}>
          <Icon name="check-circle-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>暂无待处理举报</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderAnnouncement = () => (
    <View style={styles.editContainer}>
      <Text style={styles.editLabel}>分区公告内容</Text>
      <TextInput
        style={styles.editInput}
        multiline
        numberOfLines={8}
        placeholder="输入公告内容..."
        placeholderTextColor="#94A3B8"
        value={announcementText}
        onChangeText={setAnnouncementText}
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={() => {
          if (!announcementText.trim()) {
            Alert.alert('提示', '公告内容不能为空');
            return;
          }
          updateAnnouncement.mutate(announcementText);
        }}
        disabled={updateAnnouncement.isPending}
      >
        {updateAnnouncement.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>发布公告</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRules = () => (
    <View style={styles.editContainer}>
      <Text style={styles.editLabel}>分区规则内容（仅负责人可编辑）</Text>
      <TextInput
        style={styles.editInput}
        multiline
        numberOfLines={10}
        placeholder="输入规则内容..."
        placeholderTextColor="#94A3B8"
        value={rulesText}
        onChangeText={setRulesText}
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={() => {
          if (!rulesText.trim()) {
            Alert.alert('提示', '规则内容不能为空');
            return;
          }
          updateRules.mutate(rulesText);
        }}
        disabled={updateRules.isPending}
      >
        {updateRules.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitBtnText}>更新规则</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {categoryName} - 管理
        </Text>
        <View style={styles.navRight} />
      </View>

      {/* Tab */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Icon
            name="alert-circle-outline"
            size={18}
            color={activeTab === 'reports' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            举报
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcement' && styles.tabActive]}
          onPress={() => setActiveTab('announcement')}
        >
          <Icon
            name="bullhorn-outline"
            size={18}
            color={activeTab === 'announcement' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'announcement' && styles.tabTextActive]}>
            公告
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rules' && styles.tabActive]}
          onPress={() => setActiveTab('rules')}
        >
          <Icon
            name="file-document-outline"
            size={18}
            color={activeTab === 'rules' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'rules' && styles.tabTextActive]}>
            规则
          </Text>
        </TouchableOpacity>
      </View>

      {/* 内容 */}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'announcement' && renderAnnouncement()}
      {activeTab === 'rules' && renderRules()}

      {/* 举报处理弹窗 */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>处理举报</Text>
            <Text style={styles.modalSubtitle}>
              {selectedReport?.targetType === 1 ? '帖子' : '评论'} ID: {selectedReport?.targetId}
            </Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              placeholder="处理备注（可选）..."
              placeholderTextColor="#94A3B8"
              value={handleRemark}
              onChangeText={setHandleRemark}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDismiss]}
                onPress={() => {
                  if (selectedReport) {
                    handleReport.mutate({ id: selectedReport.id, status: 2, remark: handleRemark });
                  }
                }}
                disabled={handleReport.isPending}
              >
                <Text style={styles.modalBtnDismissText}>驳回</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnResolve]}
                onPress={() => {
                  if (selectedReport) {
                    handleReport.mutate({ id: selectedReport.id, status: 1, remark: handleRemark });
                  }
                }}
                disabled={handleReport.isPending}
              >
                {handleReport.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnResolveText}>确认处理</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => {
                setShowReportModal(false);
                setSelectedReport(null);
                setHandleRemark('');
              }}
            >
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
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
  editContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    minHeight: 160,
    backgroundColor: '#F8FAFC',
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reportTypeBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  reportTypeText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  reportId: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reportReason: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 4,
  },
  reportTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reportBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportBtnApprove: {
    backgroundColor: '#EFF6FF',
  },
  reportBtnApproveText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 80,
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
  modalBtnDismiss: {
    backgroundColor: '#F1F5F9',
  },
  modalBtnDismissText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  modalBtnResolve: {
    backgroundColor: '#3B82F6',
  },
  modalBtnResolveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalCancel: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  modalCancelText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
