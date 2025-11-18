import { useState } from 'react'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  PictureOutlined,
  FormatPainterOutlined,
  RobotOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

export const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    },
    {
      key: 'onboarding',
      icon: <PlayCircleOutlined />,
      label: 'Onboarding Management',
      children: [
        {
          key: '/admin/onboarding/configs',
          label: 'Flow Configuration'
        },
        {
          key: '/admin/onboarding/theme-full',
          label: 'Theme & Media'
        }
      ]
    },
    {
      key: 'lookgen',
      icon: <PictureOutlined />,
      label: 'LookGen Management',
      children: [
        {
          key: '/admin/lookgen/transformations',
          icon: <FormatPainterOutlined />,
          label: 'Transformations'
        },
        {
          key: '/admin/lookgen/templates',
          icon: <AppstoreOutlined />,
          label: 'Style Templates'
        }
      ]
    },
    {
      key: 'character-status',
      icon: <RobotOutlined />,
      label: 'Character Status',
      children: [
        {
          key: '/admin/character-status/characters',
          icon: <UserOutlined />,
          label: 'AI Characters'
        },
        {
          key: '/admin/character-status/statuses',
          icon: <ThunderboltOutlined />,
          label: 'Character Statuses'
        },
        {
          key: '/admin/character-status/prompts',
          icon: <FileTextOutlined />,
          label: 'System Prompts'
        },
        {
          key: '/admin/character-status/assets',
          icon: <AppstoreOutlined />,
          label: 'Assets Library'
        }
      ]
    }
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={250}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? 'Admin' : 'Admin Panel'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['onboarding', 'lookgen', 'character-status']}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            Admin Dashboard
          </div>
          <div style={{ color: '#666' }}>
            Social Look App
          </div>
        </Header>
        <Content style={{
          margin: '24px',
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          minHeight: 280
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
