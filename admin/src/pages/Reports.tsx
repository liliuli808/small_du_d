import { Card, Table, Tag } from 'antd'

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

export default function Reports() {
  return (
    <div>
      <h2 style={{ color: '#1E293B', marginBottom: 24 }}>举报管理</h2>
      <Card style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}>
        <p style={{ color: '#64748B' }}>
          举报管理需通过各分区负责人面板处理，后台暂不支持直接查看全部举报。
        </p>
        <p style={{ color: '#94A3B8', fontSize: 13 }}>
          请进入"分区管理" -> 选择对应分区 -> 查看举报列表进行处理。
        </p>
      </Card>
    </div>
  )
}
