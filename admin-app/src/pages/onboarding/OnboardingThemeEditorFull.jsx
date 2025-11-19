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

          // Step 1 特有字段: lines
          if (step.key === 1) {
            const lines = stepData?.content?.lines || []
            formValues[`step${step.key}_lines`] = lines.join('\n')
          }

          // Step 2 特有字段: greeting 和 messages
          if (step.key === 2) {
            formValues[`step${step.key}_greeting`] = stepData?.content?.greeting || ''
            const messages = stepData?.content?.messages || []
            formValues[`step${step.key}_messages`] = messages.join('\n')
          }

          // Step 4 特有字段: question 和 options
          if (step.key === 4) {
            formValues[`step${step.key}_question`] = stepData?.content?.question || ''
            formValues[`step${step.key}_options`] = JSON.stringify(stepData?.content?.options || [], null, 2)
          }

          // Step 5 特有字段: stages
          if (step.key === 5) {
            const stages = stepData?.content?.stages || []
            formValues[`step${step.key}_stages`] = stages.join('\n')
          }

          // Step 6 特有字段: steps 和 completion_message
          if (step.key === 6) {
            const stepsArray = stepData?.content?.steps || []
            formValues[`step${step.key}_steps`] = stepsArray.join('\n')
            formValues[`step${step.key}_completion_message`] = stepData?.content?.completion_message || ''
          }

          // Step 7 特有字段: subtitle
          if (step.key === 7) {
            formValues[`step${step.key}_subtitle`] = stepData?.content?.subtitle || ''
          }
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
        const contentUpdate = {
          ...existingData.content,
          title: values[`step${step.key}_title`] || ''
        }

        // Step 1 特有字段: lines
        if (step.key === 1) {
          const linesText = values[`step${step.key}_lines`] || ''
          contentUpdate.lines = linesText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
        }

        // Step 2 特有字段: greeting 和 messages
        if (step.key === 2) {
          contentUpdate.greeting = values[`step${step.key}_greeting`] || ''
          const messagesText = values[`step${step.key}_messages`] || ''
          contentUpdate.messages = messagesText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
        }

        // Step 4 特有字段: question 和 options
        if (step.key === 4) {
          contentUpdate.question = values[`step${step.key}_question`] || ''
          try {
            contentUpdate.options = JSON.parse(values[`step${step.key}_options`] || '[]')
          } catch (e) {
            console.error('Invalid JSON for Step 4 options:', e)
            contentUpdate.options = []
          }
        }

        // Step 5 特有字段: stages
        if (step.key === 5) {
          const stagesText = values[`step${step.key}_stages`] || ''
          contentUpdate.stages = stagesText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
        }

        // Step 6 特有字段: steps 和 completion_message
        if (step.key === 6) {
          const stepsText = values[`step${step.key}_steps`] || ''
          contentUpdate.steps = stepsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
          contentUpdate.completion_message = values[`step${step.key}_completion_message`] || ''
        }

        // Step 7 特有字段: subtitle
        if (step.key === 7) {
          contentUpdate.subtitle = values[`step${step.key}_subtitle`] || ''
        }

        updates[step.dbKey] = {
          ...existingData,
          visual: {
            ...existingData.visual,
            background_type: values[`step${step.key}_background_type`],
            background_url: values[`step${step.key}_background_url`] || '',
            background_audio_url: values[`step${step.key}_background_audio_url`] || ''
          },
          content: contentUpdate
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
            label="Speech Audio URL (Optional)"
            name={`step${step.key}_background_audio_url`}
            help="Speech/narration audio - plays once on user interaction"
          >
            <Input
              placeholder="https://your-audio-url.com/speech.mp3"
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
                    Upload Speech
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
                <SoundOutlined /> Speech Audio Preview:
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

          {/* Step 1 特有字段: Lines */}
          {step.key === 1 && (
            <Form.Item
              label="Lines"
              name={`step${step.key}_lines`}
              help="Text lines to display (one per line)"
            >
              <TextArea
                rows={4}
                placeholder="> WELCOME.&#10;> BOOTING SYSTEM...&#10;> INITIALIZING...&#10;> IF YOU COULD HAVE A SECOND LIFE, WHO WOULD YOU BE?"
              />
            </Form.Item>
          )}

          {/* Step 2 特有字段: Greeting 和 Messages */}
          {step.key === 2 && (
            <>
              <Form.Item
                label="Greeting"
                name={`step${step.key}_greeting`}
                help="Initial greeting message for the assistant"
              >
                <Input placeholder="> I AM YOUR GUIDE IN THIS REALM." />
              </Form.Item>

              <Form.Item
                label="Messages"
                name={`step${step.key}_messages`}
                help="Array of messages (one per line)"
              >
                <TextArea
                  rows={4}
                  placeholder="> I WILL HELP YOU DISCOVER YOUR TRUE SELF.&#10;> ARE YOU READY TO BEGIN THIS JOURNEY?"
                />
              </Form.Item>
            </>
          )}

          {/* Step 4 特有字段: Question 和 Options */}
          {step.key === 4 && (
            <>
              <Form.Item
                label="Question"
                name={`step${step.key}_question`}
                help="Main question to ask the user"
              >
                <Input placeholder="WHAT DO YOU WANT?" />
              </Form.Item>

              <Form.Item
                label="Options (JSON)"
                name={`step${step.key}_options`}
                help="Array of choice options in JSON format"
              >
                <TextArea
                  rows={10}
                  placeholder={`[
  {
    "id": "stay",
    "label": "STAY AS MYSELF",
    "subtitle": "Keep your identity, enhance yourself"
  },
  {
    "id": "become",
    "label": "BECOME SOMEONE ELSE",
    "subtitle": "Transform into a new persona"
  }
]`}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </>
          )}

          {/* Step 5 特有字段: Stages */}
          {step.key === 5 && (
            <Form.Item
              label="Generation Stages"
              name={`step${step.key}_stages`}
              help="AI generation progress stages (one per line)"
            >
              <TextArea
                rows={4}
                placeholder="ANALYZING INPUT...&#10;PROCESSING IMAGE...&#10;CREATING PERSONA...&#10;FINALIZING..."
              />
            </Form.Item>
          )}

          {/* Step 6 特有字段: Steps 和 Completion Message */}
          {step.key === 6 && (
            <>
              <Form.Item
                label="Finalization Steps"
                name={`step${step.key}_steps`}
                help="Progress steps to display (one per line)"
              >
                <TextArea
                  rows={3}
                  placeholder="Saving profile...&#10;Setting up world...&#10;Preparing experience..."
                />
              </Form.Item>

              <Form.Item
                label="Completion Message"
                name={`step${step.key}_completion_message`}
                help="Message shown when finalization is complete"
              >
                <Input placeholder="YOUR SECOND LIFE AWAITS" />
              </Form.Item>
            </>
          )}

          {/* Step 7 特有字段: Subtitle */}
          {step.key === 7 && (
            <Form.Item
              label="Subtitle"
              name={`step${step.key}_subtitle`}
              help="Subtitle text (e.g., instructions to proceed)"
            >
              <Input placeholder="CLICK ANYWHERE TO ENTER" />
            </Form.Item>
          )}
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
