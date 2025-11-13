import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  UserOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  CloudServerOutlined
} from '@ant-design/icons'
import { supabase } from '../services/supabaseClient'

export const Dashboard = () => {
  const [stats, setStats] = useState({
    characters: 0,
    statuses: 0,
    assets: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Get character count
      const { count: characterCount } = await supabase
        .from('ai_characters')
        .select('*', { count: 'exact', head: true })

      // Get status count
      const { count: statusCount } = await supabase
        .from('character_statuses')
        .select('*', { count: 'exact', head: true })

      // Get assets count
      const { count: assetsCount } = await supabase
        .from('character_assets')
        .select('*', { count: 'exact', head: true })

      setStats({
        characters: characterCount || 0,
        statuses: statusCount || 0,
        assets: assetsCount || 0
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Characters"
              value={stats.characters}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Statuses"
              value={stats.statuses}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Assets"
              value={stats.assets}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="System Status" bordered={false}>
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
          <Card title="Quick Actions" bordered={false}>
            <div style={{ color: '#666', fontSize: 14 }}>
              <p>• Select function modules from the sidebar</p>
              <p>• Character Status: Manage AI characters and statuses</p>
              <p>• LookGen: Manage transformations and template configurations</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
