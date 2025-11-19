import { useState, useEffect } from 'react'
import { Tabs, Card, Select, Radio, Switch, Button, message, Modal, Form, Input, Space, Upload } from 'antd'
import { SaveOutlined, EyeOutlined, UploadOutlined, SoundOutlined } from '@ant-design/icons'
import { supabase } from '../../services/supabaseClient'

const { TabPane } = Tabs
const { TextArea } = Input

export const OnboardingConfigs = () => {
  const [config, setConfig] = useState(null)
  const [theme, setTheme] = useState(null)
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('global')
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load configuration
      const { data: configData, error: configError } = await supabase
        .from('onboarding_configs')
        .select('*')
        .eq('is_active', true)
        .single()

      if (configError) throw configError
      setConfig(configData)

      // Load theme
      const { data: themeData, error: themeError } = await supabase
        .from('onboarding_theme')
        .select('*')
        .single()

      if (themeError) throw themeError
      setTheme(themeData)

      // Load all characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('ai_characters')
        .select('character_id, name, avatar_url')
        .order('created_at', { ascending: false })

      if (charactersError) throw charactersError
      setCharacters(charactersData || [])

      // Set form initial values
      if (configData && themeData) {
        form.setFieldsValue({
          config_name: configData.config_name,
          flow_type: configData.flow_type,
          target_character_id: configData.target_character_id,
          is_active: configData.is_active,
          font_family: themeData.global_styles?.font_family || "'VT323', monospace",
          primary_color: themeData.global_styles?.primary_color || '#00FF41',
          background_overlay: themeData.global_styles?.background_overlay || 'rgba(0, 0, 0, 0.7)',
          animation_speed: themeData.global_styles?.animation_speed || 'medium',
          background_music_url: themeData.global_styles?.background_music_url || ''
        })
      }
    } catch (error) {
      message.error('Failed to load: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const saveGlobalConfig = async (values) => {
    try {
      setSaving(true)

      // Update configuration
      const { error: configError } = await supabase
        .from('onboarding_configs')
        .update({
          config_name: values.config_name,
          flow_type: values.flow_type,
          target_character_id: values.target_character_id,
          is_active: values.is_active
        })
        .eq('config_id', config.config_id)

      if (configError) throw configError

      // Update theme global styles
      const { error: themeError } = await supabase
        .from('onboarding_theme')
        .update({
          global_styles: {
            font_family: values.font_family,
            primary_color: values.primary_color,
            background_overlay: values.background_overlay,
            animation_speed: values.animation_speed,
            background_music_url: values.background_music_url || ''
          },
          updated_at: new Date().toISOString()
        })
        .eq('theme_id', theme.theme_id)

      if (themeError) throw themeError

      message.success('Saved successfully!')
      loadData()
    } catch (error) {
      message.error('Save failed: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUploadMusic = async ({ file, onSuccess, onError }) => {
    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `global-music/background-music-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('onboarding-resources')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('onboarding-resources')
        .getPublicUrl(fileName)

      message.success('Background music uploaded successfully!')
      form.setFieldsValue({ background_music_url: urlData.publicUrl })
      onSuccess()
    } catch (error) {
      console.error('Upload error:', error)
      message.error('Upload failed: ' + error.message)
      onError()
    } finally {
      setUploading(false)
    }
  }

  const saveStepConfig = async (stepKey, jsonValue) => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('onboarding_theme')
        .update({
          [stepKey]: jsonValue,
          updated_at: new Date().toISOString()
        })
        .eq('theme_id', theme.theme_id)

      if (error) throw error

      message.success('Saved successfully!')
      loadData()
    } catch (error) {
      message.error('Save failed: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const StepEditor = ({ stepKey, stepName }) => {
    const [jsonText, setJsonText] = useState('')
    const [isValid, setIsValid] = useState(true)

    useEffect(() => {
      if (theme && theme[stepKey]) {
        setJsonText(JSON.stringify(theme[stepKey], null, 2))
      }
    }, [theme])

    const handleChange = (e) => {
      const text = e.target.value
      setJsonText(text)

      try {
        JSON.parse(text)
        setIsValid(true)
      } catch {
        setIsValid(false)
      }
    }

    const handleSave = () => {
      try {
        const parsed = JSON.parse(jsonText)
        saveStepConfig(stepKey, parsed)
      } catch (error) {
        message.error('Invalid JSON format')
      }
    }

    return (
      <Card
        title={stepName}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!isValid}
            loading={saving}
          >
            Save
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <TextArea
          value={jsonText}
          onChange={handleChange}
          rows={15}
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            backgroundColor: isValid ? '#fff' : '#fff1f0'
          }}
        />
        {!isValid && (
          <div style={{ color: 'red', marginTop: 8 }}>
            ⚠️ Invalid JSON format
          </div>
        )}
      </Card>
    )
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Onboarding Configuration Management</h2>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Global Settings" key="global">
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={saveGlobalConfig}
            >
              <Form.Item
                label="Configuration Name"
                name="config_name"
                rules={[{ required: true, message: 'Please enter configuration name' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Flow Type"
                name="flow_type"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio value="fixed_character">Fixed Character</Radio>
                  <Radio value="user_creation">User Creation</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Target Character"
                name="target_character_id"
                rules={[{ required: true, message: 'Please select target character' }]}
              >
                <Select
                  placeholder="Select character"
                  showSearch
                  optionFilterProp="children"
                >
                  {characters.map(char => (
                    <Select.Option key={char.character_id} value={char.character_id}>
                      <Space>
                        {char.avatar_url && (
                          <img
                            src={char.avatar_url}
                            alt={char.name}
                            style={{ width: 24, height: 24, borderRadius: '50%' }}
                          />
                        )}
                        {char.name}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Active Status"
                name="is_active"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>

              <h3 style={{ marginTop: 24, marginBottom: 16 }}>Global Styles</h3>

              <Form.Item
                label="Font Family"
                name="font_family"
                help="CSS font-family value"
              >
                <Input placeholder="'VT323', monospace" />
              </Form.Item>

              <Form.Item
                label="Primary Color"
                name="primary_color"
                help="Main theme color used throughout the flow"
              >
                <Input type="color" style={{ width: 100 }} />
              </Form.Item>

              <Form.Item
                label="Background Overlay"
                name="background_overlay"
                help="CSS background overlay value (e.g., rgba(0, 0, 0, 0.7))"
              >
                <Input placeholder="rgba(0, 0, 0, 0.7)" />
              </Form.Item>

              <Form.Item
                label="Animation Speed"
                name="animation_speed"
              >
                <Radio.Group>
                  <Radio value="fast">Fast</Radio>
                  <Radio value="medium">Medium</Radio>
                  <Radio value="slow">Slow</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="Background Music URL"
                name="background_music_url"
                help="Global background music that loops continuously throughout all onboarding steps"
              >
                <Input
                  placeholder="https://your-audio-url.com/music.mp3"
                  addonAfter={
                    <Upload
                      accept="audio/*"
                      showUploadList={false}
                      customRequest={handleUploadMusic}
                    >
                      <Button
                        icon={<SoundOutlined />}
                        loading={uploading}
                        size="small"
                      >
                        Upload Music
                      </Button>
                    </Upload>
                  }
                />
              </Form.Item>

              {form.getFieldValue('background_music_url') && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    <SoundOutlined /> Background Music Preview:
                  </p>
                  <audio
                    src={form.getFieldValue('background_music_url')}
                    controls
                    loop
                    style={{ width: '100%', maxWidth: 400 }}
                  />
                </div>
              )}

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="Step Configurations" key="theme">
          <StepEditor stepKey="step_2_guidance" stepName="Step 2: Assistant Guidance" />
          <StepEditor stepKey="step_3_identity_input" stepName="Step 3: Identity Input" />
          <StepEditor stepKey="step_4_choice" stepName="Step 4: Core Choice" />
          <StepEditor stepKey="step_5_creation" stepName="Step 5: Identity Creation" />
          <StepEditor stepKey="step_6_finalizing" stepName="Step 6: Confirm & Loading" />
          <StepEditor stepKey="step_7_entry" stepName="Step 7: Enter World" />
        </TabPane>
      </Tabs>
    </div>
  )
}
