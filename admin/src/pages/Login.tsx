import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

const { Title, Text } = Typography

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      // TODO: 调用实际登录API
      // 模拟登录成功
      login('mock-token', {
        id: 1,
        username: values.username,
        nickname: '管理员',
        role: 1,
      })
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      message.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        background: '#F1F5F9',
      }}
    >
      {/* 左侧品牌区 */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 48,
        }}
      >
        <Title style={{ color: '#1E293B', fontSize: 36, marginBottom: 16 }}>
          匿名社区
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
          分区自治，高效管理
        </Text>
      </div>

      {/* 右侧登录表单 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 48,
        }}
      >
        <Card
          style={{
            width: 400,
            background: '#FFFFFF',
            borderColor: '#E2E8F0',
          }}
          bordered={false}
        >
          <Title level={3} style={{ color: '#1E293B', textAlign: 'center', marginBottom: 32 }}>
            管理员登录
          </Title>
          <Form onFinish={handleLogin}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#64748B' }} />}
                placeholder="账号"
                size="large"
                style={{ background: '#F1F5F9', borderColor: '#E2E8F0', color: '#1E293B' }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#64748B' }} />}
                placeholder="密码"
                size="large"
                style={{ background: '#F1F5F9', borderColor: '#E2E8F0', color: '#1E293B' }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ background: '#3B82F6', borderColor: '#3B82F6' }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}
