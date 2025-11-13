import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Upload, message, Image, Select, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { assetService } from '../../services/assetService'

const ASSET_TYPES = ['服饰', '地点', '道具', '其他']

export const Assets = () => {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [filterType, setFilterType] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadAssets()
  }, [filterType])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const data = filterType
        ? await assetService.getByType(filterType)
        : await assetService.getAll()
      setAssets(data)
    } catch (error) {
      message.error(`加载失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAsset(null)
    setImageUrl('')
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (asset) => {
    setEditingAsset(asset)
    setImageUrl(asset.image_url)
    form.setFieldsValue({
      asset_name: asset.asset_name,
      asset_type: asset.asset_type
    })
    setModalVisible(true)
  }

  const handleDelete = async (assetId) => {
    try {
      await assetService.delete(assetId)
      message.success('删除成功')
      loadAssets()
    } catch (error) {
      message.error(`删除失败: ${error.message}`)
    }
  }

  const handleImageUpload = async ({ file }) => {
    try {
      setUploading(true)
      const url = await assetService.uploadImage(file)
      setImageUrl(url)
      message.success('图片上传成功')
    } catch (error) {
      message.error(`上传失败: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (values) => {
    if (!imageUrl) {
      message.error('请上传资产图片')
      return
    }

    try {
      const assetData = {
        asset_name: values.asset_name,
        asset_type: values.asset_type,
        image_url: imageUrl
      }

      if (editingAsset) {
        await assetService.update(editingAsset.asset_id, assetData)
        message.success('更新成功')
      } else {
        await assetService.create(assetData)
        message.success('创建成功')
      }

      setModalVisible(false)
      form.resetFields()
      setImageUrl('')
      loadAssets()
    } catch (error) {
      message.error(`保存失败: ${error.message}`)
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      '服饰': 'blue',
      '地点': 'green',
      '道具': 'orange',
      '其他': 'default'
    }
    return colors[type] || 'default'
  }

  const columns = [
    {
      title: '预览',
      dataIndex: 'image_url',
      key: 'image',
      width: 100,
      render: (url) => <Image src={url} width={60} height={60} style={{ objectFit: 'cover' }} />
    },
    {
      title: '名称',
      dataIndex: 'asset_name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'asset_type',
      key: 'type',
      width: 120,
      render: (type) => <Tag color={getTypeColor(type)}>{type}</Tag>
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
            title="确定删除这个资产吗？"
            onConfirm={() => handleDelete(record.asset_id)}
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
          <h2 style={{ marginBottom: 8 }}>Assets Library</h2>
          <Space>
            <span>筛选类型：</span>
            <Select
              style={{ width: 150 }}
              placeholder="全部类型"
              allowClear
              value={filterType}
              onChange={setFilterType}
            >
              {ASSET_TYPES.map(type => (
                <Select.Option key={type} value={type}>{type}</Select.Option>
              ))}
            </Select>
          </Space>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          上传新 Asset
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={assets}
        rowKey="asset_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingAsset ? '编辑 Asset' : '上传新 Asset'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="asset_name"
            label="资产名称"
            rules={[{ required: true, message: '请输入资产名称' }]}
          >
            <Input placeholder="e.g., 黑色运动服" />
          </Form.Item>

          <Form.Item
            name="asset_type"
            label="资产类型"
            rules={[{ required: true, message: '请选择资产类型' }]}
          >
            <Select placeholder="选择类型">
              {ASSET_TYPES.map(type => (
                <Select.Option key={type} value={type}>{type}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="资产图片" required>
            <Upload
              customRequest={handleImageUpload}
              accept="image/*"
              showUploadList={false}
              disabled={uploading}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? '上传中...' : '上传图片'}
              </Button>
            </Upload>
            {imageUrl && (
              <div style={{ marginTop: 10 }}>
                <Image src={imageUrl} width={200} />
                <p style={{ marginTop: 8, color: '#52c41a' }}>✓ 图片已上传</p>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
