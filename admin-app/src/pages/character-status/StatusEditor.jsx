import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Steps, Form, Input, Select, Button, Space, message, Spin,
  Divider, Row, Col, Image, Upload, Tag, Modal
} from 'antd'
import {
  SaveOutlined, ThunderboltOutlined, ArrowLeftOutlined,
  UploadOutlined, PlusOutlined, DeleteOutlined, MenuOutlined
} from '@ant-design/icons'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { statusService } from '../../services/statusService'
import { characterService } from '../../services/characterService'

const { TextArea } = Input

const MOOD_OPTIONS = [
  'happy', 'sad', 'excited', 'calm', 'anxious', 'angry', 'neutral'
]

// Sortable Video Item Component
const SortableVideoItem = ({ video, index, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: video.video_url })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 16,
    padding: 16,
    border: '1px solid #f0f0f0',
    borderRadius: 4,
    backgroundColor: '#fff',
    cursor: 'move'
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MenuOutlined style={{ color: '#999' }} />
          <Tag color="green">Video {index + 1}</Tag>
          <span>{video.scene_prompt}</span>
        </div>
        <Space>
          <a href={video.video_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
            Preview
          </a>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(index)
            }}
          >
            Delete
          </Button>
        </Space>
      </div>
    </div>
  )
}

export const StatusEditor = () => {
  const { statusId } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(statusId && statusId !== 'new')

  const [form] = Form.useForm()
  const [characters, setCharacters] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Step 1 state
  const [generatingText, setGeneratingText] = useState(false)
  const [overlaysContent, setOverlaysContent] = useState({ now: '', health: '' })
  const [suggestionsList, setSuggestionsList] = useState([])
  const [videoScenes, setVideoScenes] = useState([])

  // Step 2 state
  const [generatingImage, setGeneratingImage] = useState(false)
  const [startingImageUrl, setStartingImageUrl] = useState('')
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Step 3 state
  const [generatingVideos, setGeneratingVideos] = useState({})
  const [videosPlaylist, setVideosPlaylist] = useState([])
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    loadCharacters()
    if (isEditMode) {
      loadStatus()
    }
  }, [statusId])

  const loadCharacters = async () => {
    try {
      const data = await characterService.getAll()
      setCharacters(data)
    } catch (error) {
      message.error(`Load characters failed: ${error.message}`)
    }
  }

  const loadStatus = async () => {
    try {
      setLoading(true)
      const data = await statusService.getById(statusId)
      setStatus(data)

      // Fill form
      form.setFieldsValue({
        character_id: data.character_id,
        title: data.title,
        mood: data.mood,
        status_description: data.status_description
      })

      // Restore state
      setCurrentStep(data.generation_step)
      setOverlaysContent(data.overlays_content || { now: '', health: '' })
      setSuggestionsList(data.suggestions_list || [])
      setVideoScenes(data.video_scenes || [])
      setStartingImageUrl(data.starting_image_url || '')
      setVideosPlaylist(data.videos_playlist || [])
    } catch (error) {
      message.error(`Load failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Save
  const handleSave = async (autoSave = false) => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      const statusData = {
        character_id: values.character_id,
        title: values.title,
        mood: values.mood,
        status_description: values.status_description,
        generation_step: currentStep,
        generation_status: currentStep === 3 ? 'completed' : 'draft',
        overlays_content: overlaysContent,
        suggestions_list: suggestionsList,
        video_scenes: videoScenes,
        starting_image_url: startingImageUrl,
        videos_playlist: videosPlaylist
      }

      let result
      if (isEditMode) {
        result = await statusService.update(statusId, statusData)
      } else {
        result = await statusService.create(statusData)
        navigate(`/admin/character-status/statuses/${result.status_id}`, { replace: true })
      }

      setStatus(result)
      if (!autoSave) {
        message.success('Saved successfully')
      }
    } catch (error) {
      if (!autoSave) {
        message.error(`Save failed: ${error.message}`)
      }
    } finally {
      setSaving(false)
    }
  }

  // Step 1: Generate text content
  const handleGenerateText = async () => {
    try {
      await form.validateFields(['character_id', 'mood', 'status_description'])
      const values = form.getFieldsValue()

      await handleSave(true)

      setGeneratingText(true)
      const result = await statusService.generateTextContent(
        status?.status_id || statusId,
        values.character_id,
        values.mood,
        values.status_description
      )

      setOverlaysContent(result.overlays)
      setSuggestionsList(result.suggestions)
      setVideoScenes(result.video_scenes)
      setCurrentStep(1)

      message.success('Text content generated')
      await handleSave(true)
    } catch (error) {
      message.error(`Generation failed: ${error.message}`)
    } finally {
      setGeneratingText(false)
    }
  }

  // Step 2: Generate starting image
  const handleGenerateImage = async () => {
    if (!videoScenes || videoScenes.length === 0) {
      message.error('Please generate video scenes first')
      return
    }

    if (!status?.character?.avatar_url) {
      message.error('Character missing avatar')
      return
    }

    try {
      setGeneratingImage(true)
      const selectedScene = videoScenes[selectedSceneIndex] || videoScenes[0]

      const result = await statusService.generateStartingImage(
        statusId,
        status.character.avatar_url,
        selectedScene,
        form.getFieldValue('mood')
      )

      setStartingImageUrl(result.starting_image_url)
      setCurrentStep(2)
      message.success('Starting image generated')

      await handleSave(true)
    } catch (error) {
      message.error(`Generation failed: ${error.message}`)
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleUploadImage = async ({ file }) => {
    try {
      setUploadingImage(true)
      const url = await statusService.uploadImage(file)
      setStartingImageUrl(url)
      setCurrentStep(2)
      message.success('Image uploaded')

      await handleSave(true)
    } catch (error) {
      message.error(`Upload failed: ${error.message}`)
    } finally {
      setUploadingImage(false)
    }
  }

  // Step 3: Generate video
  const handleGenerateVideo = async (sceneIndex) => {
    if (!startingImageUrl) {
      message.error('Please generate starting image first')
      return
    }

    if (!videoScenes || !videoScenes[sceneIndex]) {
      message.error('Scene does not exist')
      return
    }

    try {
      setGeneratingVideos(prev => ({ ...prev, [sceneIndex]: true }))

      const result = await statusService.generateSingleVideo(
        statusId,
        startingImageUrl,
        videoScenes[sceneIndex],
        form.getFieldValue('mood'),
        3
      )

      const newVideo = {
        scene_index: sceneIndex,
        video_url: result.video_url,
        scene_prompt: videoScenes[sceneIndex],
        duration: 3
      }

      setVideosPlaylist(prev => [...prev, newVideo])
      setCurrentStep(3)
      message.success(`Scene ${sceneIndex + 1} video generated`)

      await handleSave(true)
    } catch (error) {
      message.error(`Generation failed: ${error.message}`)
    } finally {
      setGeneratingVideos(prev => ({ ...prev, [sceneIndex]: false }))
    }
  }

  const handleUploadVideo = async ({ file }) => {
    try {
      setUploadingVideo(true)
      const url = await statusService.uploadVideo(file)

      const newVideo = {
        scene_index: videosPlaylist.length,
        video_url: url,
        scene_prompt: 'Manual upload',
        duration: 3
      }

      setVideosPlaylist(prev => [...prev, newVideo])
      setCurrentStep(3)
      message.success('Video uploaded')

      await handleSave(true)
    } catch (error) {
      message.error(`Upload failed: ${error.message}`)
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleDeleteVideo = (index) => {
    const newPlaylist = videosPlaylist.filter((_, i) => i !== index)
    setVideosPlaylist(newPlaylist)
    handleSave(true)
  }

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = videosPlaylist.findIndex(v => v.video_url === active.id)
      const newIndex = videosPlaylist.findIndex(v => v.video_url === over.id)

      const newPlaylist = arrayMove(videosPlaylist, oldIndex, newIndex)
      setVideosPlaylist(newPlaylist)
      handleSave(true)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep0()
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      default:
        return renderStep0()
    }
  }

  // Step 0: Basic info
  const renderStep0 = () => (
    <Card title="Basic Information" style={{ marginTop: 24 }}>
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="character_id"
              label="Select Character"
              rules={[{ required: true, message: 'Please select character' }]}
            >
              <Select
                placeholder="Select character"
                options={characters.map(char => ({
                  value: char.character_id,
                  label: char.name
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="mood"
              label="Mood"
              rules={[{ required: true, message: 'Please select mood' }]}
            >
              <Select
                placeholder="Select mood"
                options={MOOD_OPTIONS.map(mood => ({
                  value: mood,
                  label: mood
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="title"
          label="Status Title"
          rules={[{ required: true, message: 'Please enter title' }]}
        >
          <Input placeholder="e.g., Morning Running" />
        </Form.Item>

        <Form.Item
          name="status_description"
          label="Status Description"
          rules={[{ required: true, message: 'Please enter description' }]}
        >
          <TextArea
            rows={4}
            placeholder="Describe this status in detail, AI will generate content based on this..."
          />
        </Form.Item>
      </Form>

      <Divider />

      <Space>
        <Button type="primary" onClick={() => { setCurrentStep(1); handleSave(true) }}>
          Next: Generate Text Content
        </Button>
        <Button onClick={handleSave} loading={saving} icon={<SaveOutlined />}>
          Save Draft
        </Button>
      </Space>
    </Card>
  )

  // Step 1: Text content generation
  const renderStep1 = () => (
    <Card title="Step 1: Text Content Generation" style={{ marginTop: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerateText}
            loading={generatingText}
            size="large"
          >
            AI Generate Text Content
          </Button>
          <div style={{ marginTop: 8, color: '#888' }}>
            Will call Gemini API to generate overlays, suggestions and video scenes
          </div>
        </div>

        <Divider />

        <div>
          <h4>Overlays Content</h4>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>NOW:</div>
              <TextArea
                rows={3}
                value={overlaysContent.now}
                onChange={(e) => setOverlaysContent({ ...overlaysContent, now: e.target.value })}
                placeholder="NOW panel content..."
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>HEALTH:</div>
              <TextArea
                rows={3}
                value={overlaysContent.health}
                onChange={(e) => setOverlaysContent({ ...overlaysContent, health: e.target.value })}
                placeholder="HEALTH panel content..."
              />
            </Col>
          </Row>
        </div>

        <div>
          <h4>Suggestions List</h4>
          {suggestionsList.map((suggestion, index) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <Input
                value={suggestion}
                onChange={(e) => {
                  const newList = [...suggestionsList]
                  newList[index] = e.target.value
                  setSuggestionsList(newList)
                }}
                addonAfter={
                  <DeleteOutlined
                    onClick={() => setSuggestionsList(suggestionsList.filter((_, i) => i !== index))}
                  />
                }
              />
            </div>
          ))}
          <Button
            icon={<PlusOutlined />}
            onClick={() => setSuggestionsList([...suggestionsList, ''])}
          >
            Add Suggestion
          </Button>
        </div>

        <div>
          <h4>Video Scenes</h4>
          {videoScenes.map((scene, index) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <Tag color="blue">Scene {index + 1}</Tag>
              <TextArea
                rows={2}
                value={scene}
                onChange={(e) => {
                  const newScenes = [...videoScenes]
                  newScenes[index] = e.target.value
                  setVideoScenes(newScenes)
                }}
                style={{ marginTop: 8 }}
              />
            </div>
          ))}
          <Button
            icon={<PlusOutlined />}
            onClick={() => setVideoScenes([...videoScenes, ''])}
          >
            Add Scene
          </Button>
        </div>

        <Divider />

        <Space>
          <Button onClick={() => setCurrentStep(0)}>Previous</Button>
          <Button type="primary" onClick={() => { setCurrentStep(2); handleSave(true) }}>
            Next: Generate Starting Image
          </Button>
          <Button onClick={handleSave} loading={saving} icon={<SaveOutlined />}>
            Save
          </Button>
        </Space>
      </Space>
    </Card>
  )

  // Step 2: Starting image generation
  const renderStep2 = () => (
    <Card title="Step 2: Starting Image Generation" style={{ marginTop: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 8 }}>Select Scene:</span>
            <Select
              style={{ width: 300 }}
              value={selectedSceneIndex}
              onChange={setSelectedSceneIndex}
              options={videoScenes.map((scene, index) => ({
                value: index,
                label: `Scene ${index + 1}: ${scene.substring(0, 50)}...`
              }))}
            />
          </div>

          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerateImage}
              loading={generatingImage}
              size="large"
            >
              AI Generate Starting Image
            </Button>
            <Upload
              customRequest={handleUploadImage}
              accept="image/*"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={uploadingImage}>
                Manual Upload Image
              </Button>
            </Upload>
          </Space>
        </div>

        {startingImageUrl && (
          <div>
            <h4>Starting Image Preview:</h4>
            <Image src={startingImageUrl} width={300} />
          </div>
        )}

        <Divider />

        <Space>
          <Button onClick={() => setCurrentStep(1)}>Previous</Button>
          <Button
            type="primary"
            onClick={() => { setCurrentStep(3); handleSave(true) }}
            disabled={!startingImageUrl}
          >
            Next: Generate Videos
          </Button>
          <Button onClick={handleSave} loading={saving} icon={<SaveOutlined />}>
            Save
          </Button>
        </Space>
      </Space>
    </Card>
  )

  // Step 3: Video generation
  const renderStep3 = () => (
    <Card title="Step 3: Video Generation" style={{ marginTop: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <h4>Generate video for each scene:</h4>
          {videoScenes.map((scene, index) => (
            <div key={index} style={{ marginBottom: 16, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
              <div style={{ marginBottom: 8 }}>
                <Tag color="blue">Scene {index + 1}</Tag>
                <span>{scene}</span>
              </div>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={() => handleGenerateVideo(index)}
                loading={generatingVideos[index]}
                disabled={videosPlaylist.some(v => v.scene_index === index)}
              >
                {videosPlaylist.some(v => v.scene_index === index) ? 'Generated' : 'Generate Video'}
              </Button>
            </div>
          ))}

          <Upload
            customRequest={handleUploadVideo}
            accept="video/*"
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} loading={uploadingVideo}>
              Manual Upload Video
            </Button>
          </Upload>
        </div>

        <Divider />

        <div>
          <h4>Videos Playlist ({videosPlaylist.length} videos) - Drag to reorder:</h4>
          {videosPlaylist.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={videosPlaylist.map(v => v.video_url)}
                strategy={verticalListSortingStrategy}
              >
                {videosPlaylist.map((video, index) => (
                  <SortableVideoItem
                    key={video.video_url}
                    video={video}
                    index={index}
                    onDelete={handleDeleteVideo}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
              No videos yet. Generate or upload videos above.
            </div>
          )}
        </div>

        <Divider />

        <Space>
          <Button onClick={() => setCurrentStep(2)}>Previous</Button>
          <Button type="primary" onClick={handleSave} loading={saving}>
            Complete and Save
          </Button>
        </Space>
      </Space>
    </Card>
  )

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/character-status/statuses')}
        >
          Back to List
        </Button>
        <h2 style={{ marginTop: 16 }}>
          {isEditMode ? `Edit Status: ${status?.title || ''}` : 'Create New Status'}
        </h2>
      </div>

      <Steps
        current={currentStep}
        items={[
          { title: 'Basic Info', description: 'Fill basic information' },
          { title: 'Text Content', description: 'AI generate or manual edit' },
          { title: 'Starting Image', description: 'Generate or upload image' },
          { title: 'Video Generation', description: 'Generate video playlist' }
        ]}
        onChange={setCurrentStep}
      />

      {renderStepContent()}
    </div>
  )
}
