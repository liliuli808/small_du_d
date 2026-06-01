import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { categoryAPI } from '../../api';
import { Category } from '../../api/category';

const categoryColors = [
  ['#3B82F6', '#8B5CF6'],
  ['#14B8A6', '#06B6D4'],
  ['#F43F5E', '#FB7185'],
  ['#F59E0B', '#FBBF24'],
  ['#10B981', '#34D399'],
  ['#8B5CF6', '#A78BFA'],
];

export default function CategoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getList,
  });

  const renderItem = ({ item, index }: { item: Category; index: number }) => {
    const colors = categoryColors[index % categoryColors.length];
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors[0] + '20' }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CategoryDetail', { categoryId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors[0] }]}>
            <Icon name="folder-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{item.name}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || '暂无描述'}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.statsText}>{item.postCount} 帖子</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>探索分区</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索分区..."
          placeholderTextColor="#6B7280"
        />
      </View>

      <FlatList
        data={categories || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>暂无分区</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1E293B',
    fontSize: 15,
  },
  list: {
    padding: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  name: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
