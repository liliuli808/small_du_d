import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import HomeScreen from '../screens/Home/HomeScreen';
import CategoryScreen from '../screens/Category/CategoryScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { notificationAPI } from '../api';
import { RootStackParamList } from './RootNavigator';

export type MainTabParamList = {
  Home: undefined;
  Category: undefined;
  Message: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function PublishButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity
      style={styles.publishButton}
      onPress={() => navigation.navigate('Publish')}
      activeOpacity={0.8}>
      <Icon name="plus" size={28} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

// 消息图标（带红点）
function MessageIcon({ color, size }: { color: string; size: number }) {
  const { data } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationAPI.getList(1, 0) as Promise<{ unreadCount: number }>,
  });
  const unreadCount = data?.unreadCount || 0;

  return (
    <View>
      <Icon name="bell-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

// 空组件（消息页通过导航跳转）
function EmptyComponent() {
  return <View />;
}

export default function MainTabs() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
          tabBarLabel: '首页',
        }}
      />
      <Tab.Screen
        name="Category"
        component={CategoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="grid" size={size} color={color} />,
          tabBarLabel: '分区',
        }}
      />
      <Tab.Screen
        name="Publish"
        component={View}
        options={{
          tabBarButton: () => <PublishButton />,
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="Message"
        component={EmptyComponent}
        options={{
          tabBarIcon: ({ color, size }) => <MessageIcon color={color} size={size} />,
          tabBarLabel: '消息',
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Notification');
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="account" size={size} color={color} />,
          tabBarLabel: '我的',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  publishButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
