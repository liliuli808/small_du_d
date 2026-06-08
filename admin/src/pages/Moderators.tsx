import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm } from 'antd'
import { moderatorAPI, Moderator } from '../api/moderator'

const roleMap: Record<number, string> = {
  1: '负责人',
  2: '副负责人',
}

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '在任', color: 'success' },
  1: { text: '暂停', color: 'warning' },
  2: { text: '卸任', color: 'default' },
}

export default function Moderators() {
  const [moderators, setModerators] = useState<Moderator[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchModerators = async () => {
    setLoading(true)
    try {
      const res = await moderatorAPI.getList()
      setModerators(res || [])
    } catch (err: any) {
      message.error(err?.message || '获取负责人列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModerators()
  }, [])

  const handleCreate = async () => {
    const values = await form.validateFields()
    try {
      await moderatorAPI.create(values)
      message.success('任命成功')
      setModalVisible(false)
      form.resetFields()
      fetchModerators()
    } catch (err: any) {
      message.error(err?.message || '任命失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await moderatorAPI.delete(id)
      message.success('已撤销')
      fetchModerators()
    } catch (err: any) {
      message.error(err?.message || '撤销失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '分区',
      dataIndex: 'category',
      render: (v: any) => v?.name || '-',
    },
    {
      title: '用户',
      dataIndex: 'user',
      render: (v: any) => v?.nickname || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (v: number) => (
        <Tag color={v === 1 ? 'blue' : 'cyan'}>{roleMap[v]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => (
        <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag>
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: Moderator) => (
        <Space>
          {record.status === 0 && (
            <Popconfirm
              title="确定撤销该负责人？"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" size="small" danger>撤销</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1E293B' }}>负责人管理</h2>
        <Button type="primary" onClick={() => setModalVisible(true)}>任命负责人</Button>
      </div>
      <Table
        columns={columns}
        dataSource={moderators}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="任命负责人"
        open={modalVisible}
        onOk={handleCreate}
        onCancel={() => { setModalVisible(false); form.resetFields() }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="categoryId" label="分区ID" rules={[{ required: true }]}>
            <Input placeholder="输入分区ID" />
          </Form.Item>
          <Form.Item name="userId" label="用户ID" rules={[{ required: true }]}>
            <Input placeholder="输入用户ID" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select placeholder="选择角色">
              <Select.Option value={1}>负责人</Select.Option>
              <Select.Option value={2}>副负责人</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
