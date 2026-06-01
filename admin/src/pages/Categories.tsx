import { Card, Table, Button, Space, Switch } from 'antd'

const mockCategories = [
  { id: 1, name: '游戏', description: '游戏讨论区', postCount: 234, allowImage: true, status: 0, sortWeight: 100 },
  { id: 2, name: '情感', description: '情感交流', postCount: 567, allowImage: true, status: 0, sortWeight: 90 },
  { id: 3, name: '校园', description: '校园生活', postCount: 123, allowImage: true, status: 0, sortWeight: 80 },
  { id: 4, name: '职场', description: '职场交流', postCount: 345, allowImage: true, status: 1, sortWeight: 70 },
]

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '分区名称', dataIndex: 'name' },
  { title: '描述', dataIndex: 'description' },
  { title: '帖子数', dataIndex: 'postCount', width: 100 },
  {
    title: '允许图片',
    dataIndex: 'allowImage',
    render: (v: boolean) => <Switch checked={v} size="small" />,
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (v: number) => (
      <span style={{ color: v === 0 ? '#10B981' : '#EF4444' }}>
        {v === 0 ? '启用' : '停用'}
      </span>
    ),
    width: 80,
  },
  {
    title: '操作',
    render: () => (
      <Space>
        <Button type="link" size="small">编辑</Button>
        <Button type="link" size="small" danger>停用</Button>
      </Space>
    ),
  },
]

export default function Categories() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1E293B' }}>分区管理</h2>
        <Button type="primary" style={{ background: '#3B82F6', borderColor: '#3B82F6' }}>
          创建分区
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={mockCategories}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
