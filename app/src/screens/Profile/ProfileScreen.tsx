import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import Avatar from '../../components/Avatar';
import { RootStackParamList } from '../../navigation/RootNavigator';

const menuItems = [
  { icon: 'file-document-outline', label: '我的帖子', color: '#3B82F6' },
  { icon: 'comment-outline', label: '我的评论', color: '#14B8A6' },
  { icon: 'bookmark-outline', label: '我的收藏', color: '#F59E0B' },
  { icon: 'vote-outline', label: '分区选举', color: '#8B5CF6', route: 'Election' },
  { icon: 'gavel', label: '我的申诉', color: '#EC4899', route: 'MyAppeals' },
  { icon: 'block-helper', label: '黑名单', color: '#EF4444' },
  { icon: 'shield-account-outline', label: '账号与安全', color: '#8B5CF6' },
  { icon: 'information-outline', label: '关于我们', color: '#94A3B8' },
];



export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const showToast = useAppStore((state) => state.showToast);

    
  const handleLogout = () => {
    logout();
    showToast('已退出登录', 'info');
  };

  return (
    <ScrollView style={styles.container}>
      {/* 顶部区域 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="cog-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Avatar nickname={user?.nickname || '?'} size={80} />
        <Text style={styles.nickname}>{user?.nickname || '匿名用户'}</Text>
        <Text style={styles.userId}>ID: {user?.id || '---'}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>编辑资料</Text>
        </TouchableOpacity>
      </View>

      {/* 数据统计 */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>帖子</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>获赞</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>评论</Text>
        </View>
      </View>

      {/* 功能列表 */}
      <View style={styles.menu}>
        {menuItems.map((item: any) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => {
              if (item.route) {
                navigation.navigate(item.route as any);
              }
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Icon name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Icon name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
        ))}
      </View>

      {/* 退出登录 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#1E293B',
    fontSize: 36,
    fontWeight: '700',
  },
  nickname: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  userId: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#1E293B',
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  menu: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    color: '#1E293B',
    fontSize: 15,
    flex: 1,
  },
  logoutButton: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '500',
  },
});
