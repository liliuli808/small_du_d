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
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { api, postAPI } from '../../api';
import { useAppStore } from '../../store/appStore';

interface SelectedImage {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  originalSize?: number;
  compressQuality?: number;
}

interface UploadedImage {
  url: string;
  thumbUrl: string;
  objectKey: string;
  width: number;
  height: number;
  thumbWidth?: number;
  thumbHeight?: number;
}

interface UploadResponse {
  url: string;
  thumbUrl: string;
  objectKey: string;
  width: number;
  height: number;
  thumbWidth?: number;
  thumbHeight?: number;
}

export default function PublishScreen() {
  const navigation = useNavigation();
  const showToast = useAppStore((state) => state.showToast);

  const [content, setContent] = useState('');
  const [categoryId] = useState<number | null>(1);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 根据原图大小计算合适的压缩参数
  const getCompressOptions = (asset: Asset) => {
    const width = asset.width || 0;
    const height = asset.height || 0;
    const fileSize = asset.fileSize || 0;
    const maxPixels = width * height;

    // 智能压缩策略
    let quality = 0.9;
    let maxW = 1920;
    let maxH = 1920;

    if (fileSize > 5 * 1024 * 1024) {
      // 大于 5MB：强压缩
      quality = 0.6;
      maxW = 1280;
      maxH = 1280;
    } else if (fileSize > 2 * 1024 * 1024) {
      // 2-5MB：中等压缩
      quality = 0.7;
      maxW = 1440;
      maxH = 1440;
    } else if (fileSize > 500 * 1024) {
      // 500KB-2MB：轻度压缩
      quality = 0.8;
      maxW = 1600;
      maxH = 1600;
    } else {
      // 小于 500KB：最小压缩
      quality = 0.9;
      maxW = 1920;
      maxH = 1920;
    }

    // 超高分辨率图片额外限制
    if (maxPixels > 4000 * 3000) {
      maxW = 1280;
      maxH = 1280;
      quality = Math.min(quality, 0.7);
    }

    return { quality, maxWidth: maxW, maxHeight: maxH };
  };

  // 选择图片
  const handleSelectImages = () => {
    const remainingSlots = 9 - images.length;
    if (remainingSlots <= 0) {
      showToast('最多上传 9 张图片', 'error');
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: remainingSlots,
        includeBase64: false,
        quality: 0.85 as any,
        maxWidth: 1920,
        maxHeight: 1920,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          showToast(response.errorMessage || '选择图片失败', 'error');
          return;
        }

        const newImages: SelectedImage[] = (response.assets || []).map((asset: Asset) => {
          const opts = getCompressOptions(asset);
          return {
            uri: asset.uri || '',
            width: asset.width || 0,
            height: asset.height || 0,
            type: asset.type,
            fileName: asset.fileName,
            // 记录压缩参数，用于显示
            originalSize: asset.fileSize || 0,
            compressQuality: opts.quality,
          };
        }).filter(img => img.uri);

        setImages((prev) => [...prev, ...newImages]);
      }
    );
  };

  // 删除已选图片
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 上传单张图片
  const uploadImage = async (image: SelectedImage): Promise<UploadedImage | null> => {
    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      type: image.type || 'image/jpeg',
      name: image.fileName || `image_${Date.now()}.jpg`,
    } as any);

    try {
      const res = await api.post<UploadResponse>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      return {
        url: res.url,
        thumbUrl: res.thumbUrl || res.url,
        objectKey: res.objectKey,
        width: res.width || image.width,
        height: res.height || image.height,
        thumbWidth: res.thumbWidth,
        thumbHeight: res.thumbHeight,
      };
    } catch (err: any) {
      console.error('Upload error:', err);
      return null;
    }
  };

  // 发布
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

    // 如果有未上传的图片，先上传
    let finalImages = [...uploadedImages];
    const pendingImages = images.slice(uploadedImages.length);

    if (pendingImages.length > 0) {
      setUploading(true);
      for (const image of pendingImages) {
        const uploaded = await uploadImage(image);
        if (uploaded) {
          finalImages.push(uploaded);
        } else {
          setUploading(false);
          setLoading(false);
          Alert.alert('上传失败', '部分图片上传失败，请重试');
          return;
        }
      }
      setUploadedImages(finalImages);
      setUploading(false);
    }

    try {
      await postAPI.createPost({
        categoryId,
        content: content.trim(),
        images: finalImages.map((img) => ({
          objectKey: img.objectKey,
          imageUrl: img.url,
          thumbUrl: img.thumbUrl,
          width: img.width,
          height: img.height,
        })),
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
          style={[styles.publishButton, (loading || uploading) && styles.publishButtonDisabled]}
          onPress={handlePublish}
          disabled={loading || uploading}
        >
          {loading || uploading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.publishButtonText}>发布</Text>
          )}
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

        {/* 已选图片预览 */}
        {images.length > 0 && (
          <View style={styles.imageGrid}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Icon name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
                {uploading && index >= uploadedImages.length && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
                {/* 压缩信息标签 */}
                <View style={styles.compressBadge}>
                  <Text style={styles.compressBadgeText}>
                    {img.originalSize && img.originalSize > 0
                      ? `${(img.originalSize / 1024 / 1024).toFixed(1)}MB → ${Math.round((img.compressQuality || 0.85) * 100)}%`
                      : `${Math.round((img.compressQuality || 0.85) * 100)}%`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 图片上传区 */}
        {images.length < 9 && (
          <TouchableOpacity style={styles.addImageButton} onPress={handleSelectImages}>
            <Icon name="image-plus" size={28} color="#6B7280" />
            <Text style={styles.addImageText}>
              添加图片 {images.length > 0 ? `(${images.length}/9)` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 底部工具栏 */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleSelectImages}>
          <Icon name="image-outline" size={22} color={images.length > 0 ? '#3B82F6' : '#9CA3AF'} />
        </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
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
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 11,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compressBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compressBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
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
    marginTop: 16,
  },
  addImageText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 24,
  },
  toolbarButton: {
    padding: 4,
  },
});
