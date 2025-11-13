import { Result } from 'antd'
import { RocketOutlined } from '@ant-design/icons'

export const ComingSoon = ({ title = '功能开发中', description = '此功能正在开发中，敬请期待...' }) => {
  return (
    <Result
      icon={<RocketOutlined style={{ color: '#1890ff' }} />}
      title={title}
      subTitle={description}
    />
  )
}
