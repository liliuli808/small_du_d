import { Card, Table, Button, Space, Tag } from 'antd'

const roleMap: Record<number, string> = {
  1: '负责人',
  2: '副负责人',
}

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '在任', color: 'success' },
  1: { text: '暂停', color: 'warning' },
  2: { text: '卸任', color: 'default' },
}

const mockModerators = [
  { id: 1, category: '游戏', user: '神秘的路人', role: 1, status: 0, termStart: '2024-01-01', termEnd: '2024-04-01' },
  { id: 2, category: '游戏', user: '孤独的猫', role: 2, status: 0, termStart: '2024-01-01', termEnd: '2024-04-01' },
  { id: 3, category: '情感', user: '快乐的风', role: 1, status: 0, termStart: '2024-02-01', termEnd: '2024-05-01' },
]

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '分区', dataIndex: 'category' },
  { title: '用户', dataIndex: 'user' },
  {
    title: '角色',
    dataIndex: 'role',
    render: (role: number) => <Tag color={role === 1 ? 'blue' : 'cyan'}>{roleMap[role]}</Tag>,
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (status: number) => (
      <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
    ),
    width: 100,
  },
  { title: '任期开始', dataIndex: 'termStart', width: 120 },
  { title: '任期结束', dataIndex: 'termEnd', width: 120 },
  {
    title: '操作',
    render: () => (
      <Space>
        <Button type="link" size="small">查看日志</Button>
        <Button type="link" size="small" danger>撤销</Button>
      </Space>
    ),
    width: 160,
  },
]

export default function Moderators() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1E293B' }}>负责人管理</h2>
        <Button type="primary" style={{ background: '#3B82F6', borderColor: '#3B82F6' }}>
          任命负责人
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={mockModerators}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
