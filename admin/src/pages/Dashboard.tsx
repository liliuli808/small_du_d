import { Card, Row, Col, Statistic } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  CommentOutlined,
  MessageOutlined,
} from '@ant-design/icons'

const stats = [
  { title: '总用户数', value: 1234, icon: <UserOutlined />, color: '#3B82F6' },
  { title: '总帖子数', value: 5678, icon: <FileTextOutlined />, color: '#14B8A6' },
  { title: '总评论数', value: 12345, icon: <CommentOutlined />, color: '#F59E0B' },
  { title: '今日活跃', value: 234, icon: <MessageOutlined />, color: '#F43F5E' },
]

export default function Dashboard() {
  return (
    <div>
      <h2 style={{ color: '#1E293B', marginBottom: 24 }}>数据看板</h2>
      <Row gutter={[16, 16]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card
              style={{
                background: '#FFFFFF',
                borderColor: '#E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: stat.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </div>
                <Statistic
                  title={<span style={{ color: '#64748B' }}>{stat.title}</span>}
                  value={stat.value}
                  valueStyle={{ color: '#1E293B', fontSize: 24, fontWeight: 'bold' }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
