import { Card, Table, Button, Space, Tag } from 'antd'

const targetTypeMap: Record<number, string> = {
  1: '帖子',
  2: '评论',
  3: '用户',
  4: '私聊消息',
}

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待处理', color: 'warning' },
  1: { text: '已处理', color: 'success' },
  2: { text: '驳回', color: 'error' },
}

const mockReports = [
  { id: 1, reporter: '用户A', targetType: 1, target: '帖子 #1234', reason: '与分区主题无关', status: 0, createdAt: '2024-03-01' },
  { id: 2, reporter: '用户B', targetType: 2, target: '评论 #567', reason: '人身攻击', status: 1, createdAt: '2024-03-02' },
  { id: 3, reporter: '用户C', targetType: 1, target: '帖子 #5678', reason: '广告导流', status: 0, createdAt: '2024-03-03' },
]

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '举报人', dataIndex: 'reporter' },
  {
    title: '举报对象类型',
    dataIndex: 'targetType',
    render: (type: number) => targetTypeMap[type],
    width: 120,
  },
  { title: '举报对象', dataIndex: 'target' },
  { title: '原因', dataIndex: 'reason' },
  {
    title: '状态',
    dataIndex: 'status',
    render: (status: number) => (
      <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
    ),
    width: 100,
  },
  { title: '举报时间', dataIndex: 'createdAt', width: 120 },
  {
    title: '操作',
    render: () => (
      <Space>
        <Button type="link" size="small">处理</Button>
        <Button type="link" size="small" danger>驳回</Button>
      </Space>
    ),
    width: 120,
  },
]

export default function Reports() {
  return (
    <div>
      <h2 style={{ color: '#1E293B', marginBottom: 24 }}>举报管理</h2>
      <Table
        columns={columns}
        dataSource={mockReports}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
