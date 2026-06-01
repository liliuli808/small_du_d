import { useState } from 'react'
import { Card, Table, Tag, Button, Input, Select, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

const { Option } = Select

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '正常', color: 'success' },
  1: { text: '禁言', color: 'warning' },
  2: { text: '封禁', color: 'error' },
}

const mockUsers = [
  { id: 1, username: 'user001', nickname: '神秘的路人', status: 0, createdAt: '2024-01-15' },
  { id: 2, username: 'user002', nickname: '孤独的猫', status: 0, createdAt: '2024-02-01' },
  { id: 3, username: 'user003', nickname: '快乐的风', status: 1, createdAt: '2024-02-10' },
  { id: 4, username: 'user004', nickname: '忧郁的星', status: 2, createdAt: '2024-03-01' },
]

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '账号名', dataIndex: 'username' },
  { title: '匿名昵称', dataIndex: 'nickname' },
  {
    title: '状态',
    dataIndex: 'status',
    render: (status: number) => (
      <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
    ),
  },
  { title: '注册时间', dataIndex: 'createdAt' },
  {
    title: '操作',
    render: () => (
      <Space>
        <Button type="link" size="small">查看</Button>
        <Button type="link" size="small" danger>封禁</Button>
      </Space>
    ),
  },
]

export default function Users() {
  const [status, setStatus] = useState<number | undefined>()
  const [keyword, setKeyword] = useState('')

  return (
    <div>
      <h2 style={{ color: '#1E293B', marginBottom: 24 }}>用户管理</h2>
      <Card style={{ background: '#FFFFFF', borderColor: '#E2E8F0', marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索昵称/账号"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 240, background: '#F1F5F9', borderColor: '#E2E8F0', color: '#1E293B' }}
          />
          <Select
            placeholder="状态"
            allowClear
            value={status}
            onChange={setStatus}
            style={{ width: 120 }}
          >
            <Option value={0}>正常</Option>
            <Option value={1}>禁言</Option>
            <Option value={2}>封禁</Option>
          </Select>
          <Button type="primary" style={{ background: '#3B82F6', borderColor: '#3B82F6' }}>
            查询
          </Button>
        </Space>
      </Card>
      <Table
        columns={columns}
        dataSource={mockUsers}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        style={{ background: '#FFFFFF' }}
      />
    </div>
  )
}
