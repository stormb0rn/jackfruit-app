import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, message, Select, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { promptService } from '../../services/promptService'

const PROMPT_TYPES = [
  { value: 'video_generation', label: '视频生成', color: 'blue' },
  { value: 'image_generation', label: '图片生成', color: 'green' },
  { value: 'text_generation', label: '文本生成', color: 'orange' }
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
      message.error(`加载失败: ${error.message}`)
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
      message.success('删除成功')
      loadPrompts()
    } catch (error) {
      message.error(`删除失败: ${error.message}`)
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingPrompt) {
        await promptService.update(editingPrompt.prompt_id, values)
        message.success('更新成功')
      } else {
        await promptService.create(values)
        message.success('创建成功')
      }

      setModalVisible(false)
      form.resetFields()
      loadPrompts()
    } catch (error) {
      message.error(`保存失败: ${error.message}`)
    }
  }

  const getTypeInfo = (type) => {
    return PROMPT_TYPES.find(t => t.value === type) || {}
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'prompt_name',
      key: 'name',
      width: 200
    },
    {
      title: '类型',
      dataIndex: 'prompt_type',
      key: 'type',
      width: 150,
      render: (type) => {
        const info = getTypeInfo(type)
        return <Tag color={info.color}>{info.label}</Tag>
      }
    },
    {
      title: 'Prompt 内容',
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
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个提示词吗？"
            onConfirm={() => handleDelete(record.prompt_id)}
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
          <h2 style={{ marginBottom: 8 }}>System Prompts</h2>
          <Space>
            <span>筛选类型：</span>
            <Select
              style={{ width: 150 }}
              placeholder="全部类型"
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
          创建新 Prompt
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
        title={editingPrompt ? '编辑 Prompt' : '创建新 Prompt'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="prompt_name"
            label="Prompt 名称"
            rules={[{ required: true, message: '请输入 Prompt 名称' }]}
          >
            <Input placeholder="e.g., IMAGE_GEN" />
          </Form.Item>

          <Form.Item
            name="prompt_type"
            label="Prompt 类型"
            rules={[{ required: true, message: '请选择 Prompt 类型' }]}
          >
            <Select placeholder="选择类型">
              {PROMPT_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>{type.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="prompt_content"
            label="Prompt 内容"
            rules={[{ required: true, message: '请输入 Prompt 内容' }]}
          >
            <Input.TextArea
              rows={10}
              placeholder="输入完整的 Prompt 模板..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
