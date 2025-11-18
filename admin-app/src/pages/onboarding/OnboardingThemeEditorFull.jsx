import { useState, useEffect } from 'react'
import { Form, Input, Button, Upload, message, Tabs, Card, Select, Space } from 'antd'
import { UploadOutlined, PlayCircleOutlined, SoundOutlined } from '@ant-design/icons'
import { supabase } from '../../services/supabaseClient'

const { TabPane } = Tabs
const { TextArea } = Input

/**
 * Onboarding Theme Editor - Full Version
 * 支持所有 7 个步骤的视频和音频配置
 */
export const OnboardingThemeEditorFull = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Step configurations
  const steps = [
    { key: 1, name: 'Step 1 - Splash', dbKey: 'step_1_splash', title: 'Splash & Worldview' },
    { key: 2, name: 'Step 2 - Guidance', dbKey: 'step_2_guidance', title: 'Assistant Guidance' },
    { key: 3, name: 'Step 3 - Identity', dbKey: 'step_3_identity_input', title: 'Identity Input' },
    { key: 4, name: 'Step 4 - Choice', dbKey: 'step_4_choice', title: 'Core Choice' },
    { key: 5, name: 'Step 5 - Creation', dbKey: 'step_5_creation', title: 'Identity Creation' },
    { key: 6, name: 'Step 6 - Finalizing', dbKey: 'step_6_finalizing', title: 'Confirm & Loading' },
    { key: 7, name: 'Step 7 - Entry', dbKey: 'step_7_entry', title: 'Enter World' }
  ]

  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('onboarding_theme')
        .select('*')
        .single()

      if (error) throw error

      setTheme(data)

      // 填充所有步骤的表单数据
      if (data) {
        const formValues = {}
        steps.forEach(step => {
          const stepData = data[step.dbKey]
          formValues[`step${step.key}_background_type`] = stepData?.visual?.background_type || 'solid'
          formValues[`step${step.key}_background_url`] = stepData?.visual?.background_url || ''
          formValues[`step${step.key}_background_audio_url`] = stepData?.visual?.background_audio_url || ''
          formValues[`step${step.key}_title`] = stepData?.content?.title || ''
        })
        form.setFieldsValue(formValues)
      }
    } catch (error) {
      console.error('Error loading theme:', error)
      message.error('Failed to load theme: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadMedia = async (file, mediaType, stepNum) => {
    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `step${stepNum}/${mediaType}-${Date.now()}.${fileExt}`

      // 上传到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('onboarding-resources')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from('onboarding-resources')
        .getPublicUrl(fileName)

      message.success(`${mediaType === 'video' ? 'Video' : 'Audio'} uploaded successfully!`)
      return urlData.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      message.error('Upload failed: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSaveTheme = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // 构建所有步骤的更新配置
      const updates = {}

      steps.forEach(step => {
        const existingData = theme[step.dbKey] || {}
        updates[step.dbKey] = {
          ...existingData,
          visual: {
            ...existingData.visual,
            background_type: values[`step${step.key}_background_type`],
            background_url: values[`step${step.key}_background_url`] || '',
            background_audio_url: values[`step${step.key}_background_audio_url`] || ''
          },
          content: {
            ...existingData.content,
            title: values[`step${step.key}_title`] || ''
          }
        }
      })

      // 更新数据库
      const { error } = await supabase
        .from('onboarding_theme')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('theme_id', theme.theme_id)

      if (error) throw error

      message.success('Theme configuration saved successfully!')
      loadTheme()
    } catch (error) {
      console.error('Save error:', error)
      message.error('Save failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const customUploadVideo = async ({ file, onSuccess, onError }, stepNum) => {
    const url = await handleUploadMedia(file, 'video', stepNum)
    if (url) {
      form.setFieldsValue({ [`step${stepNum}_background_url`]: url })
      onSuccess()
    } else {
      onError()
    }
  }

  const customUploadAudio = async ({ file, onSuccess, onError }, stepNum) => {
    const url = await handleUploadMedia(file, 'audio', stepNum)
    if (url) {
      form.setFieldsValue({ [`step${stepNum}_background_audio_url`]: url })
      onSuccess()
    } else {
      onError()
    }
  }

  // 渲染单个步骤的配置表单
  const renderStepConfig = (step) => {
    return (
      <TabPane tab={step.name} key={step.key}>
        <Card title={`${step.title} - Background Settings`}>
          <Form.Item
            label="Background Type"
            name={`step${step.key}_background_type`}
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="solid">Solid Color</Select.Option>
              <Select.Option value="video">Video Background</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Background Video URL"
            name={`step${step.key}_background_url`}
            help="Video will auto-loop"
          >
            <Input
              placeholder="https://your-video-url.com/video.mp4"
              addonAfter={
                <Upload
                  accept="video/*"
                  showUploadList={false}
                  customRequest={(options) => customUploadVideo(options, step.key)}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploading}
                    size="small"
                  >
                    Upload Video
                  </Button>
                </Upload>
              }
            />
          </Form.Item>

          <Form.Item
            label="Background Audio URL (Optional)"
            name={`step${step.key}_background_audio_url`}
            help="Audio will play on user interaction (to avoid browser autoplay restrictions)"
          >
            <Input
              placeholder="https://your-audio-url.com/audio.mp3"
              addonAfter={
                <Upload
                  accept="audio/*"
                  showUploadList={false}
                  customRequest={(options) => customUploadAudio(options, step.key)}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploading}
                    size="small"
                  >
                    Upload Audio
                  </Button>
                </Upload>
              }
            />
          </Form.Item>

          {form.getFieldValue(`step${step.key}_background_url`) && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 'bold', marginBottom: 8 }}>
                <PlayCircleOutlined /> Video Preview:
              </p>
              <video
                src={form.getFieldValue(`step${step.key}_background_url`)}
                controls
                style={{
                  width: '100%',
                  maxWidth: 400,
                  borderRadius: 8,
                  border: '1px solid #d9d9d9'
                }}
              />
            </div>
          )}

          {form.getFieldValue(`step${step.key}_background_audio_url`) && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 'bold', marginBottom: 8 }}>
                <SoundOutlined /> Audio Preview:
              </p>
              <audio
                src={form.getFieldValue(`step${step.key}_background_audio_url`)}
                controls
                style={{ width: '100%', maxWidth: 400 }}
              />
            </div>
          )}
        </Card>

        <Card title="Content Settings" style={{ marginTop: 16 }}>
          <Form.Item
            label="Title"
            name={`step${step.key}_title`}
          >
            <Input placeholder={`Step ${step.key} Title`} />
          </Form.Item>
        </Card>
      </TabPane>
    )
  }

  if (loading && !theme) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Onboarding Theme Editor (Full Version)</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Manage background videos and audio resources for all 7 steps
      </p>

      <Form form={form} layout="vertical">
        <Tabs defaultActiveKey="1">
          {steps.map(step => renderStepConfig(step))}
        </Tabs>

        <div style={{ marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              size="large"
              onClick={handleSaveTheme}
              loading={loading}
            >
              Save All Configurations
            </Button>
            <Button size="large" onClick={loadTheme}>
              Reload
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}

export default OnboardingThemeEditorFull
