import { useState, useEffect } from 'react'
import { Form, Input, Button, Upload, message, Tabs, Card, Select, Space } from 'antd'
import { UploadOutlined, PlayCircleOutlined, SoundOutlined } from '@ant-design/icons'
import { supabase } from '../../services/supabaseClient'

const { TabPane } = Tabs
const { TextArea } = Input

/**
 * Onboarding Theme Editor
 * 管理 onboarding_theme 表中的视觉配置（包括视频和音频）
 */
export const OnboardingThemeEditor = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('onboarding_theme')
        .select('*')
        .eq('theme_name', 'Default Theme')
        .single()

      if (error) throw error

      setTheme(data)

      // 填充表单
      if (data) {
        form.setFieldsValue({
          // Step 1
          step1_background_type: data.step_1_splash?.visual?.background_type || 'solid',
          step1_background_url: data.step_1_splash?.visual?.background_url || '',
          step1_background_audio_url: data.step_1_splash?.visual?.background_audio_url || '',
          step1_title: data.step_1_splash?.content?.title || '',
        })
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

      // 构建更新的配置
      const updatedStep1 = {
        ...theme.step_1_splash,
        visual: {
          ...theme.step_1_splash?.visual,
          background_type: values.step1_background_type,
          background_url: values.step1_background_url,
          background_audio_url: values.step1_background_audio_url
        },
        content: {
          ...theme.step_1_splash?.content,
          title: values.step1_title
        }
      }

      // 更新数据库
      const { error } = await supabase
        .from('onboarding_theme')
        .update({
          step_1_splash: updatedStep1,
          updated_at: new Date().toISOString()
        })
        .eq('theme_name', 'Default Theme')

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

  return (
    <div style={{ padding: 24 }}>
      <h1>Onboarding Theme Editor</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Manage background videos and audio resources for the Onboarding flow
      </p>

      <Form form={form} layout="vertical">
        <Tabs defaultActiveKey="1">
          <TabPane tab="Step 1 - Splash" key="1">
            <Card title="Background Settings">
              <Form.Item
                label="Background Type"
                name="step1_background_type"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="solid">Solid Color</Select.Option>
                  <Select.Option value="video">Video Background</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Background Video URL"
                name="step1_background_url"
                help="Video will auto-loop"
              >
                <Input
                  placeholder="https://your-video-url.com/video.mp4"
                  addonAfter={
                    <Upload
                      accept="video/*"
                      showUploadList={false}
                      customRequest={(options) => customUploadVideo(options, 1)}
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
                name="step1_background_audio_url"
                help="Audio will play on user interaction (to avoid browser autoplay restrictions)"
              >
                <Input
                  placeholder="https://your-audio-url.com/audio.mp3"
                  addonAfter={
                    <Upload
                      accept="audio/*"
                      showUploadList={false}
                      customRequest={(options) => customUploadAudio(options, 1)}
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

              {form.getFieldValue('step1_background_url') && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    <PlayCircleOutlined /> Video Preview:
                  </p>
                  <video
                    src={form.getFieldValue('step1_background_url')}
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

              {form.getFieldValue('step1_background_audio_url') && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    <SoundOutlined /> Audio Preview:
                  </p>
                  <audio
                    src={form.getFieldValue('step1_background_audio_url')}
                    controls
                    style={{ width: '100%', maxWidth: 400 }}
                  />
                </div>
              )}
            </Card>

            <Card title="Content Settings" style={{ marginTop: 16 }}>
              <Form.Item
                label="Title"
                name="step1_title"
                rules={[{ required: true }]}
              >
                <Input placeholder="START YOUR SECOND LIFE" />
              </Form.Item>
            </Card>
          </TabPane>

          <TabPane tab="Step 2 - Guidance" key="2" disabled>
            <Card>
              <p>Coming soon...</p>
            </Card>
          </TabPane>

          <TabPane tab="Other Steps" key="3" disabled>
            <Card>
              <p>Coming soon...</p>
            </Card>
          </TabPane>
        </Tabs>

        <div style={{ marginTop: 24 }}>
          <Space>
            <Button
              type="primary"
              size="large"
              onClick={handleSaveTheme}
              loading={loading}
            >
              Save Configuration
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

export default OnboardingThemeEditor
