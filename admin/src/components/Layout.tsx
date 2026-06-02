import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  WarningOutlined,
  SafetyOutlined,
  TrophyOutlined,
  GavelOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

const { Sider, Content, Header } = AntLayout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/categories', icon: <AppstoreOutlined />, label: '分区管理' },
  { key: '/posts', icon: <FileTextOutlined />, label: '帖子管理' },
  { key: '/reports', icon: <WarningOutlined />, label: '举报管理' },
  { key: '/moderators', icon: <SafetyOutlined />, label: '负责人管理' },
  { key: '/elections', icon: <TrophyOutlined />, label: '选举管理' },
  { key: '/appeals', icon: <GavelOutlined />, label: '申诉管理' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#F1F5F9' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
        }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <h2 style={{ color: '#3B82F6', fontSize: collapsed ? 14 : 18, margin: 0 }}>
            {collapsed ? '匿' : '匿名社区'}
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
      <AntLayout style={{ background: '#F1F5F9' }}>
        <Header
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <span style={{ color: '#64748B' }}>
            管理后台
          </span>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: logout,
                },
              ],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#3B82F6' }}>
                {user?.nickname?.[0] || 'A'}
              </Avatar>
              <span style={{ color: '#1E293B' }}>{user?.nickname || '管理员'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
