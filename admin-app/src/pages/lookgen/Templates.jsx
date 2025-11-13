import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, Switch, Upload, message, Popconfirm, Tag, Image } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { lookgenService } from '../../services/lookgenService'

export const Templates = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await lookgenService.getTemplates()
      setTemplates(data)
    } catch (error) {
      message.error(`Failed to load: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingItem(null)
    setImageUrl('')
    form.resetFields()
    form.setFieldsValue({
      enabled: true,
      display_order: (templates.length + 1) * 10
    })
    setModalVisible(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setImageUrl(item.image_path || '')

    // Parse prompts JSONB to form values
    const promptsData = item.prompts || {}

    form.setFieldsValue({
      id: item.id,
      name: item.name,
      display_order: item.display_order,
      enabled: item.enabled,
      // Flatten prompts for form editing
      fal_prompt: promptsData.fal || '',
      negative_prompt: promptsData.negative || ''
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await lookgenService.deleteTemplate(id)
      message.success('Deleted successfully')
      loadTemplates()
    } catch (error) {
      message.error(`Failed to delete: ${error.message}`)
    }
  }

  const handleImageUpload = async ({ file }) => {
    try {
      setUploading(true)
      const url = await lookgenService.uploadImage(file, 'templates')
      setImageUrl(url)
      message.success('Image uploaded successfully')
    } catch (error) {
      message.error(`Failed to upload: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (values) => {
    if (!imageUrl) {
      message.error('Please upload template image')
      return
    }

    try {
      // Construct prompts JSONB structure
      const templateData = {
        id: values.id,
        name: values.name,
        prompts: {
          fal: values.fal_prompt || '',
          negative: values.negative_prompt || ''
        },
        image_path: imageUrl,
        display_order: values.display_order,
        enabled: values.enabled
      }

      if (editingItem) {
        await lookgenService.updateTemplate(editingItem.id, templateData)
        message.success('Updated successfully')
      } else {
        await lookgenService.createTemplate(templateData)
        message.success('Created successfully')
      }

      setModalVisible(false)
      form.resetFields()
      setImageUrl('')
      loadTemplates()
    } catch (error) {
      message.error(`Failed to save: ${error.message}`)
    }
  }

  const columns = [
    {
      title: 'Preview',
      dataIndex: 'image_path',
      key: 'preview',
      width: 100,
      render: (imagePath) => (
        imagePath ? <Image src={imagePath} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 4 }} /> : '-'
      )
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 150
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'FAL Prompt',
      dataIndex: 'prompts',
      key: 'fal_prompt',
      ellipsis: true,
      render: (prompts) => {
        // prompts is JSONB object: { fal: '...', negative: '...' }
        const fal = prompts?.fal || prompts?.prompt || '-'
        return (
          <div style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fal}>
            {fal}
          </div>
        )
      }
    },
    {
      title: 'Display Order',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 120,
      sorter: (a, b) => a.display_order - b.display_order
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'default'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Tag>
      )
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date) => date ? new Date(date).toLocaleString('en-US') : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this template?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
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
        <h2>Style Templates Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create New Template
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1300 }}
      />

      <Modal
        title={editingItem ? 'Edit Template' : 'Create New Template'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="id"
            label="Template ID"
            rules={[
              { required: true, message: 'Please enter template ID' },
              { pattern: /^[A-Z0-9_]+$/, message: 'Only uppercase letters, numbers, and underscores allowed' }
            ]}
            extra="e.g., T1, T2, CASUAL_STYLE"
          >
            <Input placeholder="T1" disabled={!!editingItem} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Display Name"
            rules={[{ required: true, message: 'Please enter display name' }]}
          >
            <Input placeholder="Casual Style" />
          </Form.Item>

          <Form.Item label="Template Image" required>
            <Upload
              customRequest={handleImageUpload}
              accept="image/*"
              showUploadList={false}
              disabled={uploading}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? 'Uploading...' : 'Upload Template Image'}
              </Button>
            </Upload>
            {imageUrl && (
              <div style={{ marginTop: 10 }}>
                <Image src={imageUrl} width={150} height={150} style={{ objectFit: 'cover', borderRadius: 4 }} />
                <p style={{ marginTop: 8, color: '#52c41a' }}>✓ Image Uploaded</p>
              </div>
            )}
          </Form.Item>

          <Form.Item
            name="fal_prompt"
            label="FAL Prompt"
            rules={[{ required: true, message: 'Please enter FAL prompt' }]}
            extra="AI prompt for style transformation"
          >
            <Input.TextArea
              rows={4}
              placeholder="apply casual clothing style, relaxed pose..."
            />
          </Form.Item>

          <Form.Item
            name="negative_prompt"
            label="Negative Prompt (Optional)"
            extra="Things to avoid in the transformation"
          >
            <Input.TextArea
              rows={3}
              placeholder="formal wear, suit, tie..."
            />
          </Form.Item>

          <Form.Item
            name="display_order"
            label="Display Order"
            rules={[{ required: true, message: 'Please enter display order' }]}
            extra="Lower number appears first"
          >
            <InputNumber min={0} step={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="Enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
