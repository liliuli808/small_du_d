import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import PostDetailScreen from '../screens/Post/PostDetailScreen';
import ChatDetailScreen from '../screens/Chat/ChatDetailScreen';
import PublishScreen from '../screens/Publish/PublishScreen';
import CategoryDetailScreen from '../screens/Category/CategoryDetailScreen';
import ModeratorPanelScreen from '../screens/Category/ModeratorPanelScreen';
import ElectionScreen from '../screens/Category/ElectionScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PostDetail: { postId: number };
  ChatDetail: { conversationId: number; nickname: string; targetUserId: number };
  Publish: undefined;
  CategoryDetail: { categoryId: number };
  ModeratorPanel: { categoryId: number; categoryName: string };
  Election: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="ChatDetail"
            component={ChatDetailScreen}
            options={{ animation: 'slide_from_right', headerShown: true }}
          />
          <Stack.Screen
            name="CategoryDetail"
            component={CategoryDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="ModeratorPanel"
            component={ModeratorPanelScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Election"
            component={ElectionScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Publish"
            component={PublishScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
