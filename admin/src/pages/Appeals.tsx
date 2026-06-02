import { useState } from 'react'
import { Table, Card, Tag, Button, Modal, Input, Select, message } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appealAPI } from '../api/appeal'

const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: '待处理', color: 'warning' },
  1: { label: '已通过', color: 'success' },
  2: { label: '已驳回', color: 'error' },
}

const targetTypeMap: Record<number, string> = {
  1: '帖子',
  2: '评论',
}

export default function Appeals() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined)
  const [handleModalVisible, setHandleModalVisible] = useState(false)
  const [currentAppeal, setCurrentAppeal] = useState<any>(null)
  const [handleResult, setHandleResult] = useState('')
  const [handleStatus, setHandleStatus] = useState<number>(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-appeals', statusFilter],
    queryFn: () => appealAPI.getList({ status: statusFilter, limit: 100, offset: 0 }),
  })

  const appeals = data?.items || []
  const total = data?.total || 0

  const handleMutation = useMutation({
    mutationFn: ({ id, status, handleResult }: { id: number; status: number; handleResult: string }) =>
      appealAPI.handle(id, { status, handleResult }),
    onSuccess: () => {
      message.success('处理成功')
      setHandleModalVisible(false)
      setHandleResult('')
      setCurrentAppeal(null)
      queryClient.invalidateQueries({ queryKey: ['admin-appeals'] })
    },
    onError: () => {
      message.error('处理失败')
    },
  })

  const openHandleModal = (appeal: any, status: number) => {
    setCurrentAppeal(appeal)
    setHandleStatus(status)
    setHandleResult('')
    setHandleModalVisible(true)
  }

  const submitHandle = () => {
    if (!currentAppeal) return
    handleMutation.mutate({
      id: currentAppeal.id,
      status: handleStatus,
      handleResult: handleResult.trim(),
    })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '申诉人',
      dataIndex: 'user',
      render: (user: any) => user?.nickname || `用户#${user?.id}`,
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      width: 80,
      render: (type: number) => targetTypeMap[type] || type,
    },
    {
      title: '目标ID',
      dataIndex: 'targetId',
      width: 80,
    },
    {
      title: '申诉理由',
      dataIndex: 'reason',
      ellipsis: true,
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: number) => {
        const s = statusMap[status] || { label: '未知', color: 'default' }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: '处理结果',
      dataIndex: 'handleResult',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => {
        if (record.status !== 0) {
          return <Tag>已处理</Tag>
        }
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              size="small"
              onClick={() => openHandleModal(record, 1)}
            >
              通过
            </Button>
            <Button
              danger
              size="small"
              onClick={() => openHandleModal(record, 2)}
            >
              驳回
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <Card
        title="申诉管理"
        extra={
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 120 }}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { label: '待处理', value: 0 },
              { label: '已通过', value: 1 },
              { label: '已驳回', value: 2 },
            ]}
          />
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={appeals}
          loading={isLoading}
          pagination={{
            total,
            pageSize: 20,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title={handleStatus === 1 ? '通过申诉' : '驳回申诉'}
        open={handleModalVisible}
        onOk={submitHandle}
        onCancel={() => {
          setHandleModalVisible(false)
          setHandleResult('')
          setCurrentAppeal(null)
        }}
        confirmLoading={handleMutation.isPending}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#64748B', marginBottom: 8 }}>申诉理由</div>
          <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6 }}>
            {currentAppeal?.reason}
          </div>
        </div>
        <div>
          <div style={{ color: '#64748B', marginBottom: 8 }}>
            {handleStatus === 1 ? '通过说明（可选）' : '驳回说明（可选）'}
          </div>
          <Input.TextArea
            rows={3}
            value={handleResult}
            onChange={(e) => setHandleResult(e.target.value)}
            placeholder="填写处理说明..."
            maxLength={500}
          />
        </div>
      </Modal>
    </div>
  )
}
