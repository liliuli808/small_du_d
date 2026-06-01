import { Card, Table, Button, Space, Tag } from 'antd'

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' },
  1: { text: '报名中', color: 'processing' },
  2: { text: '投票中', color: 'warning' },
  3: { text: '公示中', color: 'success' },
  4: { text: '已结束', color: 'default' },
  5: { text: '已取消', color: 'error' },
}

const mockElections = [
  { id: 1, category: '游戏', title: '游戏分区负责人选举', status: 2, signupStart: '2024-03-01', voteEnd: '2024-03-10' },
  { id: 2, category: '情感', title: '情感分区负责人选举', status: 4, signupStart: '2024-02-01', voteEnd: '2024-02-10' },
]

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '分区', dataIndex: 'category' },
  { title: '标题', dataIndex: 'title' },
  {
    title: '状态',
    dataIndex: 'status',
    render: (status: number) => (
      <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
    ),
    width: 100,
  },
  { title: '报名开始', dataIndex: 'signupStart', width: 120 },
  { title: '投票结束', dataIndex: 'voteEnd', width: 120 },
  {
    title: '操作',
    render: () => (
      <Space>
        <Button type="link" size="small">查看</Button>
        <Button type="link" size="small">结果</Button>
      </Space>
    ),
    width: 120,
  },
]

export default function Elections() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1E293B' }}>选举管理</h2>
        <Button type="primary" style={{ background: '#3B82F6', borderColor: '#3B82F6' }}>
          创建选举
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={mockElections}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
