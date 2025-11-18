import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, message, Select, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { promptService } from '../../services/promptService'

const PROMPT_TYPES = [
  { value: 'video_generation', label: 'Video Generation', color: 'blue' },
  { value: 'image_generation', label: 'Image Generation', color: 'green' },
  { value: 'text_generation', label: 'Text Generation', color: 'orange' }
]

export const Prompts = () => {
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadPrompts()
  }, [filterType])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const data = filterType
        ? await promptService.getByType(filterType)
        : await promptService.getAll()
      setPrompts(data)
    } catch (error) {
      message.error(`Failed to load: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPrompt(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt)
    form.setFieldsValue({
      prompt_name: prompt.prompt_name,
      prompt_type: prompt.prompt_type,
      prompt_content: prompt.prompt_content
    })
    setModalVisible(true)
  }

  const handleDelete = async (promptId) => {
    try {
      await promptService.delete(promptId)
      message.success('Deleted successfully')
      loadPrompts()
    } catch (error) {
      message.error(`Failed to delete: ${error.message}`)
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingPrompt) {
        await promptService.update(editingPrompt.prompt_id, values)
        message.success('Updated successfully')
      } else {
        await promptService.create(values)
        message.success('Created successfully')
      }

      setModalVisible(false)
      form.resetFields()
      loadPrompts()
    } catch (error) {
      message.error(`Failed to save: ${error.message}`)
    }
  }

  const getTypeInfo = (type) => {
    return PROMPT_TYPES.find(t => t.value === type) || {}
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'prompt_name',
      key: 'name',
      width: 200
    },
    {
      title: 'Type',
      dataIndex: 'prompt_type',
      key: 'type',
      width: 150,
      render: (type) => {
        const info = getTypeInfo(type)
        return <Tag color={info.color}>{info.label}</Tag>
      }
    },
    {
      title: 'Prompt Content',
      dataIndex: 'prompt_content',
      key: 'content',
      ellipsis: true,
      render: (text) => (
        <div style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </div>
      )
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
      width: 150,
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
            title="Are you sure you want to delete this prompt?"
            onConfirm={() => handleDelete(record.prompt_id)}
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
        <div>
          <h2 style={{ marginBottom: 8 }}>System Prompts</h2>
          <Space>
            <span>Filter by Type:</span>
            <Select
              style={{ width: 150 }}
              placeholder="All Types"
              allowClear
              value={filterType}
              onChange={setFilterType}
            >
              {PROMPT_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>{type.label}</Select.Option>
              ))}
            </Select>
          </Space>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create New Prompt
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={prompts}
        rowKey="prompt_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="prompt_name"
            label="Prompt Name"
            rules={[{ required: true, message: 'Please enter prompt name' }]}
          >
            <Input placeholder="e.g., IMAGE_GEN" />
          </Form.Item>

          <Form.Item
            name="prompt_type"
            label="Prompt Type"
            rules={[{ required: true, message: 'Please select prompt type' }]}
          >
            <Select placeholder="Select Type">
              {PROMPT_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>{type.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="prompt_content"
            label="Prompt Content"
            rules={[{ required: true, message: 'Please enter prompt content' }]}
          >
            <Input.TextArea
              rows={10}
              placeholder="Enter complete prompt template..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
