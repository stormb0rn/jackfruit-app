import { Result } from 'antd'
import { RocketOutlined } from '@ant-design/icons'

export const ComingSoon = ({ title = 'Under Development', description = 'This feature is under development, coming soon...' }) => {
  return (
    <Result
      icon={<RocketOutlined style={{ color: '#1890ff' }} />}
      title={title}
      subTitle={description}
    />
  )
}
