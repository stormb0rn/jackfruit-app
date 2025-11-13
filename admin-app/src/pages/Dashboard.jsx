import { Card, Row, Col, Statistic } from 'antd'
import {
  UserOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  CloudServerOutlined
} from '@ant-design/icons'

export const Dashboard = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="LookGen Users"
              value={1234}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Characters"
              value={5}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Statuses"
              value={23}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Assets"
              value={145}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="系统状态" bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <CloudServerOutlined style={{ fontSize: 20, marginRight: 12, color: '#52c41a' }} />
              <div>
                <div style={{ fontWeight: 500 }}>Supabase</div>
                <div style={{ fontSize: 12, color: '#999' }}>Connected</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CloudServerOutlined style={{ fontSize: 20, marginRight: 12, color: '#52c41a' }} />
              <div>
                <div style={{ fontWeight: 500 }}>Edge Functions</div>
                <div style={{ fontSize: 12, color: '#999' }}>Ready</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="快速操作" bordered={false}>
            <div style={{ color: '#666', fontSize: 14 }}>
              <p>• 从侧边栏选择功能模块</p>
              <p>• Character Status: 管理 AI 角色和状态</p>
              <p>• LookGen: 管理变换和模板配置</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
