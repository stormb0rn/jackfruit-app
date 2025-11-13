import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Upload, message, Avatar, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { characterService } from '../../services/characterService'

export const Characters = () => {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      const data = await characterService.getAll()

      // 为每个角色加载 Statuses 数量
      const charactersWithCount = await Promise.all(
        data.map(async (char) => {
          const count = await characterService.getStatusesCount(char.character_id)
          return { ...char, statusesCount: count }
        })
      )

      setCharacters(charactersWithCount)
    } catch (error) {
      message.error(`加载失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCharacter(null)
    setAvatarUrl('')
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (character) => {
    setEditingCharacter(character)
    setAvatarUrl(character.avatar_url)
    form.setFieldsValue({
      name: character.name,
      description: character.description
    })
    setModalVisible(true)
  }

  const handleDelete = async (characterId) => {
    try {
      await characterService.delete(characterId)
      message.success('删除成功')
      loadCharacters()
    } catch (error) {
      message.error(`删除失败: ${error.message}`)
    }
  }

  const handleAvatarUpload = async ({ file }) => {
    try {
      setUploading(true)
      const url = await characterService.uploadAvatar(file)
      setAvatarUrl(url)
      message.success('Avatar 上传成功')
    } catch (error) {
      message.error(`上传失败: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (values) => {
    if (!avatarUrl) {
      message.error('请上传 Avatar 图片')
      return
    }

    try {
      const characterData = {
        name: values.name,
        description: values.description || '',
        avatar_url: avatarUrl
      }

      if (editingCharacter) {
        await characterService.update(editingCharacter.character_id, characterData)
        message.success('更新成功')
      } else {
        await characterService.create(characterData)
        message.success('创建成功')
      }

      setModalVisible(false)
      form.resetFields()
      setAvatarUrl('')
      loadCharacters()
    } catch (error) {
      message.error(`保存失败: ${error.message}`)
    }
  }

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar_url',
      key: 'avatar',
      width: 80,
      render: (url) => <Avatar src={url} size={50} />
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Statuses 数',
      dataIndex: 'statusesCount',
      key: 'statusesCount',
      width: 120,
      render: (count) => count || 0
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
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/character-status/statuses?character=${record.character_id}`)}
          >
            查看 Statuses
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个角色吗？"
            description="这将同时删除该角色的所有 Statuses"
            onConfirm={() => handleDelete(record.character_id)}
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
        <h2>AI Characters 管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          创建新 Character
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={characters}
        rowKey="character_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingCharacter ? '编辑 Character' : '创建新 Character'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="e.g., Alex" />
          </Form.Item>

          <Form.Item name="description" label="角色描述">
            <Input.TextArea rows={3} placeholder="角色背景介绍..." />
          </Form.Item>

          <Form.Item label="Avatar 图片" required>
            <Upload
              customRequest={handleAvatarUpload}
              accept="image/*"
              showUploadList={false}
              disabled={uploading}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? '上传中...' : '上传 Avatar'}
              </Button>
            </Upload>
            {avatarUrl && (
              <div style={{ marginTop: 10 }}>
                <Avatar src={avatarUrl} size={100} />
                <p style={{ marginTop: 8, color: '#52c41a' }}>✓ Avatar 已上传</p>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
