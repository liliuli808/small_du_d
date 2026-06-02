import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from '../../components/Avatar';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../navigation/RootNavigator';

export default function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState('');

  const updateMutation = useMutation({
    mutationFn: () => authAPI.updateMe({ nickname: nickname.trim() || undefined, bio: bio.trim() || undefined }),
    onSuccess: () => {
      updateUser({ nickname: nickname.trim() });
      queryClient.invalidateQueries({ queryKey: ['users/me'] });
      Alert.alert('成功', '资料已更新');
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('失败', err?.message || '更新失败');
    },
  });

  const handleSave = () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '昵称不能为空');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>编辑资料</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          {updateMutation.isPending ? (
            <ActivityIndicator color="#3B82F6" size="small" />
          ) : (
            <Text style={styles.saveText}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 头像 */}
        <View style={styles.avatarSection}>
          <Avatar nickname={user?.nickname || '?'} size={80} />
          <Text style={styles.avatarHint}>头像由昵称自动生成</Text>
        </View>

        {/* 表单 */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>账号名</Text>
            <Text style={styles.readonlyValue}>{user?.username || ''}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>匿名昵称</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="输入昵称"
              placeholderTextColor="#94A3B8"
              maxLength={50}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>个人简介</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="简单介绍一下自己..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
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
    width: 50,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  saveButton: {
    padding: 4,
    width: 50,
    alignItems: 'flex-end',
  },
  saveText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarHint: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  field: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  readonlyValue: {
    fontSize: 15,
    color: '#94A3B8',
  },
  input: {
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 8,
  },
  bioInput: {
    minHeight: 80,
    lineHeight: 22,
  },
});
