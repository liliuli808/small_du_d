import { useState, useEffect } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, DatePicker, message, Popconfirm,
} from 'antd'
import { electionAPI, Election } from '../api/election'

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' },
  1: { text: '报名中', color: 'processing' },
  2: { text: '投票中', color: 'warning' },
  3: { text: '公示中', color: 'success' },
  4: { text: '已结束', color: 'default' },
  5: { text: '已取消', color: 'error' },
}

export default function Elections() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchElections = async () => {
    setLoading(true)
    try {
      const res = await electionAPI.getList()
      setElections(res || [])
    } catch (err: any) {
      message.error(err?.message || '获取选举列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElections()
  }, [])

  const handleCreate = async () => {
    const values = await form.validateFields()
    try {
      await electionAPI.create({
        categoryId: values.categoryId,
        title: values.title,
        signupStartAt: values.signupStartAt.toISOString(),
        signupEndAt: values.signupEndAt.toISOString(),
        voteStartAt: values.voteStartAt.toISOString(),
        voteEndAt: values.voteEndAt.toISOString(),
        publicityEndAt: values.publicityEndAt.toISOString(),
      })
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      fetchElections()
    } catch (err: any) {
      message.error(err?.message || '创建失败')
    }
  }

  const handleFinish = async (id: number) => {
    try {
      await electionAPI.finish(id)
      message.success('选举已结束，负责人已自动任命')
      fetchElections()
    } catch (err: any) {
      message.error(err?.message || '结束失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => (
        <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag>
      ),
    },
    {
      title: '报名开始',
      dataIndex: 'signupStartAt',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '投票结束',
      dataIndex: 'voteEndAt',
      width: 160,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      width: 200,
      render: (_: any, record: Election) => (
        <Space>
          {(record.status === 2 || record.status === 3) && (
            <Popconfirm
              title="确定结束该选举？结束后将自动任命负责人。"
              onConfirm={() => handleFinish(record.id)}
            >
              <Button type="link" size="small" style={{ color: '#F59E0B' }}>结束选举</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#1E293B' }}>选举管理</h2>
        <Button type="primary" onClick={() => setModalVisible(true)}>创建选举</Button>
      </div>
      <Table
        columns={columns}
        dataSource={elections}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="创建选举"
        open={modalVisible}
        onOk={handleCreate}
        onCancel={() => { setModalVisible(false); form.resetFields() }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="categoryId" label="选择分区" rules={[{ required: true, message: '请选择分区' }]}>
            <Input placeholder="输入分区ID" />
          </Form.Item>
          <Form.Item name="title" label="选举标题" rules={[{ required: true }]}>
            <Input placeholder="例如：XX分区负责人选举" />
          </Form.Item>
          <Form.Item name="signupStartAt" label="报名开始时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="signupEndAt" label="报名结束时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="voteStartAt" label="投票开始时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="voteEndAt" label="投票结束时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="publicityEndAt" label="公示结束时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
