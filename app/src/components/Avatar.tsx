import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  nickname: string;
  size?: number;
  style?: any;
}

// 6种渐变配色（中心色 → 边缘色）
const avatarGradients = [
  { center: '#60A5FA', edge: '#2563EB' },    // 蓝
  { center: '#2DD4BF', edge: '#0891B2' },    // 青
  { center: '#FB7185', edge: '#E11D48' },    // 红
  { center: '#FCD34D', edge: '#EA580C' },    // 橙
  { center: '#34D399', edge: '#059669' },    // 绿
  { center: '#A78BFA', edge: '#7C3AED' },    // 紫
];

function getAvatarGradient(nickname: string) {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

export default function Avatar({ nickname, size = 36, style }: AvatarProps) {
  const gradient = getAvatarGradient(nickname);
  const firstLetter = nickname?.[0] || '?';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: gradient.edge,
        },
        style,
      ]}
    >
      {/* 内层亮色圆模拟径向渐变中心 */}
      <View
        style={[
          styles.innerCircle,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.35,
            backgroundColor: gradient.center,
            opacity: 0.6,
          },
        ]}
      />
      <Text style={[styles.text, { fontSize: size * 0.45 }]}>
        {firstLetter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  innerCircle: {
    position: 'absolute',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    zIndex: 1,
  },
});
