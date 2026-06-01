import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { postAPI } from '../../api';
import { useAppStore } from '../../store/appStore';

export default function PublishScreen() {
  const navigation = useNavigation();
  const showToast = useAppStore((state) => state.showToast);

  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(1);
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!content.trim()) {
      showToast('请输入内容', 'error');
      return;
    }
    if (!categoryId) {
      showToast('请选择分区', 'error');
      return;
    }

    setLoading(true);
    try {
      await postAPI.createPost({
        categoryId,
        content: content.trim(),
      });
      showToast('发布成功', 'success');
      navigation.goBack();
    } catch (error: any) {
      showToast(error.message || '发布失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>发布帖子</Text>
        <TouchableOpacity
          style={[styles.publishButton, loading && styles.publishButtonDisabled]}
          onPress={handlePublish}
          disabled={loading}
        >
          <Text style={styles.publishButtonText}>发布</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* 分区选择 */}
        <TouchableOpacity style={styles.categorySelector}>
          <Icon name="tag-outline" size={18} color="#3B82F6" />
          <Text style={styles.categoryText}>选择分区</Text>
          <Icon name="chevron-right" size={18} color="#6B7280" />
        </TouchableOpacity>

        {/* 文本输入 */}
        <TextInput
          style={styles.textInput}
          placeholder="分享你的想法..."
          placeholderTextColor="#6B7280"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={5000}
          textAlignVertical="top"
        />

        {/* 图片上传区 */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.addImageButton}>
            <Icon name="image-plus" size={28} color="#6B7280" />
            <Text style={styles.addImageText}>添加图片</Text>
          </TouchableOpacity>
          <Text style={styles.imageHint}>最多9张图片</Text>
        </View>
      </ScrollView>

      {/* 底部工具栏 */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton}>
          <Icon name="at" size={22} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Icon name="emoticon-outline" size={22} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton}>
          <Icon name="pound" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  cancelButton: {
    color: '#64748B',
    fontSize: 16,
  },
  headerTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '600',
  },
  publishButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishButtonText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  categoryText: {
    color: '#1E293B',
    fontSize: 14,
    flex: 1,
  },
  textInput: {
    color: '#1E293B',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginTop: 16,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addImageText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  imageHint: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 24,
  },
  toolbarButton: {
    padding: 4,
  },
});
