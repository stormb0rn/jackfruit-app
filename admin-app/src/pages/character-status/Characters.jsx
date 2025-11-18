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

      // Load status count for each character
      const charactersWithCount = await Promise.all(
        data.map(async (char) => {
          const count = await characterService.getStatusesCount(char.character_id)
          return { ...char, statusesCount: count }
        })
      )

      setCharacters(charactersWithCount)
    } catch (error) {
      message.error(`Failed to load: ${error.message}`)
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
      message.success('Deleted successfully')
      loadCharacters()
    } catch (error) {
      message.error(`Failed to delete: ${error.message}`)
    }
  }

  const handleAvatarUpload = async ({ file }) => {
    try {
      setUploading(true)
      const url = await characterService.uploadAvatar(file)
      setAvatarUrl(url)
      message.success('Avatar uploaded successfully')
    } catch (error) {
      message.error(`Failed to upload: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (values) => {
    if (!avatarUrl) {
      message.error('Please upload avatar image')
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
        message.success('Updated successfully')
      } else {
        await characterService.create(characterData)
        message.success('Created successfully')
      }

      setModalVisible(false)
      form.resetFields()
      setAvatarUrl('')
      loadCharacters()
    } catch (error) {
      message.error(`Failed to save: ${error.message}`)
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Status Count',
      dataIndex: 'statusesCount',
      key: 'statusesCount',
      width: 120,
      render: (count) => count || 0
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('en-US')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/character-status/statuses?character=${record.character_id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this character?"
            description="This will also delete all statuses for this character"
            onConfirm={() => handleDelete(record.character_id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>AI Characters Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create New Character
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={characters}
        rowKey="character_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingCharacter ? 'Edit Character' : 'Create New Character'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Character Name"
            rules={[{ required: true, message: 'Please enter character name' }]}
          >
            <Input placeholder="e.g., Alex" />
          </Form.Item>

          <Form.Item name="description" label="Character Description">
            <Input.TextArea rows={3} placeholder="Character background..." />
          </Form.Item>

          <Form.Item label="Avatar Image" required>
            <Upload
              customRequest={handleAvatarUpload}
              accept="image/*"
              showUploadList={false}
              disabled={uploading}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? 'Uploading...' : 'Upload Avatar'}
              </Button>
            </Upload>
            {avatarUrl && (
              <div style={{ marginTop: 10 }}>
                <Avatar src={avatarUrl} size={100} />
                <p style={{ marginTop: 8, color: '#52c41a' }}>✓ Avatar Uploaded</p>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
