import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Upload, message, Image, Select, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { assetService } from '../../services/assetService'

const ASSET_TYPES = ['Clothing', 'Location', 'Props', 'Other']

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
      message.error(`Failed to load: ${error.message}`)
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
      message.success('Deleted successfully')
      loadAssets()
    } catch (error) {
      message.error(`Failed to delete: ${error.message}`)
    }
  }

  const handleImageUpload = async ({ file }) => {
    try {
      setUploading(true)
      const url = await assetService.uploadImage(file)
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
      message.error('Please upload asset image')
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
        message.success('Updated successfully')
      } else {
        await assetService.create(assetData)
        message.success('Created successfully')
      }

      setModalVisible(false)
      form.resetFields()
      setImageUrl('')
      loadAssets()
    } catch (error) {
      message.error(`Failed to save: ${error.message}`)
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      'Clothing': 'blue',
      'Location': 'green',
      'Props': 'orange',
      'Other': 'default'
    }
    return colors[type] || 'default'
  }

  const columns = [
    {
      title: 'Preview',
      dataIndex: 'image_url',
      key: 'image',
      width: 100,
      render: (url) => <Image src={url} width={60} height={60} style={{ objectFit: 'cover' }} />
    },
    {
      title: 'Name',
      dataIndex: 'asset_name',
      key: 'name'
    },
    {
      title: 'Type',
      dataIndex: 'asset_type',
      key: 'type',
      width: 120,
      render: (type) => <Tag color={getTypeColor(type)}>{type}</Tag>
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
            title="Are you sure you want to delete this asset?"
            onConfirm={() => handleDelete(record.asset_id)}
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
          <h2 style={{ marginBottom: 8 }}>Assets Library</h2>
          <Space>
            <span>Filter by Type:</span>
            <Select
              style={{ width: 150 }}
              placeholder="All Types"
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
          Upload New Asset
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
        title={editingAsset ? 'Edit Asset' : 'Upload New Asset'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="asset_name"
            label="Asset Name"
            rules={[{ required: true, message: 'Please enter asset name' }]}
          >
            <Input placeholder="e.g., Black Sports Jacket" />
          </Form.Item>

          <Form.Item
            name="asset_type"
            label="Asset Type"
            rules={[{ required: true, message: 'Please select asset type' }]}
          >
            <Select placeholder="Select Type">
              {ASSET_TYPES.map(type => (
                <Select.Option key={type} value={type}>{type}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Asset Image" required>
            <Upload
              customRequest={handleImageUpload}
              accept="image/*"
              showUploadList={false}
              disabled={uploading}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </Upload>
            {imageUrl && (
              <div style={{ marginTop: 10 }}>
                <Image src={imageUrl} width={200} />
                <p style={{ marginTop: 8, color: '#52c41a' }}>✓ Image Uploaded</p>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
