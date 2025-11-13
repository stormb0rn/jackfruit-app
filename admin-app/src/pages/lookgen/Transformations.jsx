import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, Switch, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { lookgenService } from '../../services/lookgenService'

export const Transformations = () => {
  const [transformations, setTransformations] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadTransformations()
  }, [])

  const loadTransformations = async () => {
    try {
      setLoading(true)
      const data = await lookgenService.getTransformations()
      setTransformations(data)
    } catch (error) {
      message.error(`Failed to load: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      enabled: true,
      display_order: (transformations.length + 1) * 10
    })
    setModalVisible(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)

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
      await lookgenService.deleteTransformation(id)
      message.success('Deleted successfully')
      loadTransformations()
    } catch (error) {
      message.error(`Failed to delete: ${error.message}`)
    }
  }

  const handleSubmit = async (values) => {
    try {
      // Construct prompts JSONB structure
      const transformationData = {
        id: values.id,
        name: values.name,
        prompts: {
          fal: values.fal_prompt || '',
          negative: values.negative_prompt || ''
        },
        display_order: values.display_order,
        enabled: values.enabled
      }

      if (editingItem) {
        await lookgenService.updateTransformation(editingItem.id, transformationData)
        message.success('Updated successfully')
      } else {
        await lookgenService.createTransformation(transformationData)
        message.success('Created successfully')
      }

      setModalVisible(false)
      form.resetFields()
      loadTransformations()
    } catch (error) {
      message.error(`Failed to save: ${error.message}`)
    }
  }

  const columns = [
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
            title="Are you sure you want to delete this transformation?"
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
        <h2>Transformations Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create New Transformation
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={transformations}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingItem ? 'Edit Transformation' : 'Create New Transformation'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="id"
            label="Transformation ID"
            rules={[
              { required: true, message: 'Please enter transformation ID' },
              { pattern: /^[a-z_]+$/, message: 'Only lowercase letters and underscores allowed' }
            ]}
            extra="e.g., better_looking, japanese_style"
          >
            <Input placeholder="better_looking" disabled={!!editingItem} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Display Name"
            rules={[{ required: true, message: 'Please enter display name' }]}
          >
            <Input placeholder="Better Looking" />
          </Form.Item>

          <Form.Item
            name="fal_prompt"
            label="FAL Prompt"
            rules={[{ required: true, message: 'Please enter FAL prompt' }]}
            extra="AI prompt for image transformation"
          >
            <Input.TextArea
              rows={4}
              placeholder="make the person more attractive, enhance facial features..."
            />
          </Form.Item>

          <Form.Item
            name="negative_prompt"
            label="Negative Prompt (Optional)"
            extra="Things to avoid in the transformation"
          >
            <Input.TextArea
              rows={3}
              placeholder="ugly, distorted, low quality..."
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
