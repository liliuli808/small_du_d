import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        // V3 浅色主题: 65%浅蓝灰 + 20%白色 + 10%品牌蓝 + 5%状态色
        token: {
          colorPrimary: '#3B82F6',
          colorBgBase: '#F1F5F9',
          colorBgContainer: '#FFFFFF',
          colorBgElevated: '#FFFFFF',
          colorBorder: '#E2E8F0',
          colorText: '#1E293B',
          colorTextSecondary: '#64748B',
          colorTextTertiary: '#94A3B8',
          borderRadius: 12,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
