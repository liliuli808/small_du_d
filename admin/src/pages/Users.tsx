import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Input, Select, Space, message, Popconfirm } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { userAPI, User } from '../api/user'

const { Option } = Select

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '正常', color: 'success' },
  1: { text: '禁言', color: 'warning' },
  2: { text: '封禁', color: 'error' },
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<number | undefined>()
  const [keyword, setKeyword] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await userAPI.getList({
        status,
        keyword: keyword || undefined,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      })
      setUsers(res.items || [])
      setTotal(res.total || 0)
    } catch (err: any) {
      message.error(err?.message || '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [status, pagination.current, pagination.pageSize])

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchUsers()
  }

  const handleUpdateStatus = async (id: number, newStatus: number) => {
    try {
      await userAPI.updateStatus(id, newStatus)
      message.success('状态更新成功')
      fetchUsers()
    } catch (err: any) {
      message.error(err?.message || '更新失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '账号名', dataIndex: 'username' },
    { title: '匿名昵称', dataIndex: 'nickname' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: User) => (
        <Space>
          {record.status === 0 && (
            <>
              <Popconfirm
                title="确定禁言该用户？"
                onConfirm={() => handleUpdateStatus(record.id, 1)}
              >
                <Button type="link" size="small">禁言</Button>
              </Popconfirm>
              <Popconfirm
                title="确定封禁该用户？"
                onConfirm={() => handleUpdateStatus(record.id, 2)}
              >
                <Button type="link" size="small" danger>封禁</Button>
              </Popconfirm>
            </>
          )}
          {record.status !== 0 && (
            <Popconfirm
              title="确定恢复该用户？"
              onConfirm={() => handleUpdateStatus(record.id, 0)}
            >
              <Button type="link" size="small" style={{ color: '#10B981' }}>恢复</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

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
            onPressEnter={handleSearch}
            style={{ width: 240 }}
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
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
      </Card>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 20 }),
        }}
      />
    </div>
  )
}
