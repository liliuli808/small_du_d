import { useState, useEffect } from 'react'
import {
  Table, Button, Space, Switch, Modal, Form, Input, InputNumber,
  message,
} from 'antd'
import { categoryAPI, Category } from '../api/category'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form] = Form.useForm()

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await categoryAPI.getList()
      setCategories(res || [])
    } catch (err: any) {
      message.error(err?.message || '获取分区列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Category) => {
    setEditing(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    try {
      if (editing) {
        await categoryAPI.update(editing.id, values)
        message.success('更新成功')
      } else {
        await categoryAPI.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchCategories()
    } catch (err: any) {
      message.error(err?.message || '操作失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '分区名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '帖子数', dataIndex: 'postCount', width: 100 },
    {
      title: '允许图片',
      dataIndex: 'allowImage',
      width: 100,
      render: (v: boolean) => <Switch checked={v} size="small" disabled />,
    },
    {
      title: '开启选举',
      dataIndex: 'enableElection',
      width: 100,
      render: (v: boolean) => <Switch checked={v} size="small" disabled />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => (
        <span style={{ color: v === 0 ? '#10B981' : '#EF4444' }}>
          {v === 0 ? '启用' : '停用'}
        </span>
      ),
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: Category) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1E293B' }}>分区管理</h2>
        <Button type="primary" onClick={handleCreate}>创建分区</Button>
      </div>
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? '编辑分区' : '创建分区'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="分区名称" rules={[{ required: true }]}>
            <Input placeholder="请输入分区名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="分区简介" />
          </Form.Item>
          <Form.Item name="rules" label="规则">
            <Input.TextArea rows={4} placeholder="分区规则" />
          </Form.Item>
          <Form.Item name="announcement" label="公告">
            <Input.TextArea rows={3} placeholder="分区公告" />
          </Form.Item>
          <Form.Item name="allowImage" label="允许图片" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="enableChat" label="允许私聊" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="enableElection" label="开启选举" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="sortWeight" label="排序权重">
            <InputNumber min={0} max={9999} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
