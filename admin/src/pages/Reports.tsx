export default function Reports() {
  return (
    <div>
      <h2 style={{ color: '#1E293B', marginBottom: 24 }}>举报管理</h2>
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24 }}>
        <p style={{ color: '#64748B' }}>
          举报管理需通过各分区负责人面板处理，后台暂不支持直接查看全部举报。
        </p>
        <p style={{ color: '#94A3B8', fontSize: 13 }}>
          请进入"分区管理" -&gt; 选择对应分区 -&gt; 查看举报列表进行处理。
        </p>
      </div>
    </div>
  )
}
