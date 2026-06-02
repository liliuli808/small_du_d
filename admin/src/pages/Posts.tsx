import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Input, Select, message, Popconfirm, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { postAPI, Post } from '../api/post'

const { Option } = Select

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '已发布', color: 'success' },
  1: { text: '已删除', color: 'error' },
  2: { text: '已隐藏', color: 'warning' },
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<number | undefined>()
  const [keyword, setKeyword] = useState('')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await postAPI.getList({
        status,
        keyword: keyword || undefined,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      })
      setPosts(res.items || [])
      setTotal(res.total || 0)
    } catch (err: any) {
      message.error(err?.message || '获取帖子列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [status, pagination.current, pagination.pageSize])

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchPosts()
  }

  const handleDelete = async (id: number) => {
    try {
      await postAPI.delete(id, '后台管理员删除')
      message.success('删除成功')
      fetchPosts()
    } catch (err: any) {
      message.error(err?.message || '删除失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '内容',
      dataIndex: 'content',
      ellipsis: true,
      render: (v: string) => v.slice(0, 50) + (v.length > 50 ? '...' : ''),
    },
    {
      title: '分区',
      dataIndex: 'category',
      width: 120,
      render: (v: any) => v?.name || '-',
    },
    {
      title: '作者',
      dataIndex: 'user',
      width: 120,
      render: (v: any) => v?.nickname || '-',
    },
    { title: '点赞', dataIndex: 'likeCount', width: 80 },
    { title: '评论', dataIndex: 'commentCount', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => (
        <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: Post) => (
        <Space>
          {record.status === 0 && (
            <Popconfirm
              title="确定删除该帖子？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

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
            <Option value={0}>已发布</Option>
            <Option value={1}>已删除</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
      </Card>
      <Table
        columns={columns}
        dataSource={posts}
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
