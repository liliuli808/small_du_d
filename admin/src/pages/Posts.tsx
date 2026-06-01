import { useState } from 'react'
import { Card, Table, Button, Space, Input, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '已发布', color: 'success' },
  1: { text: '已删除', color: 'error' },
  2: { text: '已隐藏', color: 'warning' },
}

const mockPosts = [
  { id: 1, content: '今天天气不错...', author: '神秘的路人', category: '情感', likeCount: 12, commentCount: 5, status: 0, createdAt: '2024-03-01' },
  { id: 2, content: '有人一起打游戏吗？', author: '孤独的猫', category: '游戏', likeCount: 8, commentCount: 3, status: 0, createdAt: '2024-03-02' },
  { id: 3, content: '这是一个广告帖', author: '未知用户', category: '校园', likeCount: 0, commentCount: 0, status: 1, createdAt: '2024-03-03' },
]

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '内容', dataIndex: 'content', ellipsis: true },
  { title: '作者', dataIndex: 'author', width: 120 },
  { title: '分区', dataIndex: 'category', width: 100 },
  { title: '点赞', dataIndex: 'likeCount', width: 80 },
  { title: '评论', dataIndex: 'commentCount', width: 80 },
  {
    title: '状态',
    dataIndex: 'status',
    render: (status: number) => (
      <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
    ),
    width: 100,
  },
  { title: '发布时间', dataIndex: 'createdAt', width: 120 },
  {
    title: '操作',
    render: () => (
      <Space>
        <Button type="link" size="small">查看</Button>
        <Button type="link" size="small" danger>删除</Button>
      </Space>
    ),
    width: 120,
  },
]

export default function Posts() {
  const [keyword, setKeyword] = useState('')

  return (
    <div>
      <h2 style={{ color: '#1E293B', marginBottom: 24 }}>帖子管理</h2>
      <Card style={{ background: '#FFFFFF', borderColor: '#E2E8F0', marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索帖子内容"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 300, background: '#F1F5F9', borderColor: '#E2E8F0', color: '#1E293B' }}
          />
          <Button type="primary" style={{ background: '#3B82F6', borderColor: '#3B82F6' }}>
            查询
          </Button>
        </Space>
      </Card>
      <Table
        columns={columns}
        dataSource={mockPosts}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
