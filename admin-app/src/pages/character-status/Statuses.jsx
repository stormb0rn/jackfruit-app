import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Select, Tag, Avatar, Popconfirm, message, Progress } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons'
import { statusService } from '../../services/statusService'
import { characterService } from '../../services/characterService'

const GENERATION_STATUS_COLORS = {
  draft: 'default',
  generating: 'processing',
  completed: 'success',
  failed: 'error'
}

const GENERATION_STATUS_LABELS = {
  draft: '草稿',
  generating: '生成中',
  completed: '已完成',
  failed: '失败'
}

const MOOD_COLORS = {
  happy: 'gold',
  sad: 'blue',
  excited: 'orange',
  calm: 'green',
  anxious: 'volcano',
  angry: 'red',
  neutral: 'default'
}

export const Statuses = () => {
  const navigate = useNavigate()
  const [statuses, setStatuses] = useState([])
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterCharacterId, setFilterCharacterId] = useState(null)

  useEffect(() => {
    loadCharacters()
    loadStatuses()
  }, [filterCharacterId])

  const loadCharacters = async () => {
    try {
      const data = await characterService.getAll()
      setCharacters(data)
    } catch (error) {
      message.error(`加载角色列表失败: ${error.message}`)
    }
  }

  const loadStatuses = async () => {
    try {
      setLoading(true)
      const data = filterCharacterId
        ? await statusService.getByCharacterId(filterCharacterId)
        : await statusService.getAll()
      setStatuses(data)
    } catch (error) {
      message.error(`加载失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    navigate('/admin/character-status/statuses/new')
  }

  const handleEdit = (statusId) => {
    navigate(`/admin/character-status/statuses/${statusId}`)
  }

  const handleDelete = async (statusId) => {
    try {
      await statusService.delete(statusId)
      message.success('删除成功')
      loadStatuses()
    } catch (error) {
      message.error(`删除失败: ${error.message}`)
    }
  }

  const handleSetDefault = async (characterId, statusId) => {
    try {
      await statusService.setDefault(characterId, statusId)
      message.success('已设为默认状态')
      loadStatuses()
    } catch (error) {
      message.error(`设置失败: ${error.message}`)
    }
  }

  const getGenerationProgress = (step) => {
    // step: 0-3
    // 0 = 0%, 1 = 33%, 2 = 66%, 3 = 100%
    return (step / 3) * 100
  }

  const columns = [
    {
      title: '角色',
      dataIndex: 'character',
      key: 'character',
      width: 200,
      render: (character) => character ? (
        <Space>
          <Avatar src={character.avatar_url} size={40} />
          <span>{character.name}</span>
        </Space>
      ) : '-'
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 180
    },
    {
      title: 'Mood',
      dataIndex: 'mood',
      key: 'mood',
      width: 120,
      render: (mood) => <Tag color={MOOD_COLORS[mood] || 'default'}>{mood}</Tag>
    },
    {
      title: '生成进度',
      dataIndex: 'generation_step',
      key: 'generation_step',
      width: 180,
      render: (step, record) => (
        <div>
          <Progress
            percent={getGenerationProgress(step)}
            size="small"
            status={record.generation_status === 'failed' ? 'exception' : 'normal'}
          />
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Step {step}/3
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'generation_status',
      key: 'generation_status',
      width: 120,
      render: (status) => (
        <Tag color={GENERATION_STATUS_COLORS[status]}>
          {GENERATION_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '视频数量',
      dataIndex: 'videos_playlist',
      key: 'videos_count',
      width: 100,
      render: (videos) => videos?.length || 0
    },
    {
      title: '默认',
      dataIndex: 'is_default',
      key: 'is_default',
      width: 80,
      render: (isDefault, record) => (
        isDefault ? (
          <StarFilled style={{ color: '#faad14', fontSize: 18 }} />
        ) : (
          <StarOutlined
            style={{ color: '#d9d9d9', fontSize: 18, cursor: 'pointer' }}
            onClick={() => handleSetDefault(record.character_id, record.status_id)}
          />
        )
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.status_id)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个状态吗？"
            onConfirm={() => handleDelete(record.status_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Character Statuses</h2>
          <Space>
            <span>筛选角色：</span>
            <Select
              style={{ width: 200 }}
              placeholder="全部角色"
              allowClear
              value={filterCharacterId}
              onChange={setFilterCharacterId}
              options={characters.map(char => ({
                value: char.character_id,
                label: (
                  <Space>
                    <Avatar src={char.avatar_url} size={24} />
                    {char.name}
                  </Space>
                )
              }))}
            />
          </Space>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          创建新 Status
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={statuses}
        rowKey="status_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1400 }}
      />
    </div>
  )
}
