// V3 浅色主题颜色系统
// 配色法则: 65% 浅蓝灰 + 20% 白色 + 10% 品牌蓝 + 5% 状态色

export const colors = {
  // 基础色 (65% + 20%)
  pageBg: '#F1F5F9',
  cardBg: '#FFFFFF',
  hoverBg: '#F8FAFC',
  pressedBg: '#E2E8F0',

  // 品牌色 (10%)
  brand: '#3B82F6',
  brandLight: '#60A5FA',
  brandDark: '#2563EB',
  brandBg: '#EFF6FF',

  // 文字色
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#3B82F6',

  // 边框
  border: '#E2E8F0',
  borderFocus: '#3B82F6',

  // 状态色 (5%)
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#8B5CF6',
};

export const categoryColors = [
  { main: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', name: '游戏' },
  { main: '#EC4899', bg: 'rgba(236,72,153,0.1)', name: '情感' },
  { main: '#14B8A6', bg: 'rgba(20,184,166,0.1)', name: '校园' },
  { main: '#F59E0B', bg: 'rgba(245,158,11,0.1)', name: '职场' },
  { main: '#10B981', bg: 'rgba(16,185,129,0.1)', name: '兴趣' },
  { main: '#3B82F6', bg: 'rgba(59,130,246,0.1)', name: '生活' },
];

export const avatarColors = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#10B981',
];
