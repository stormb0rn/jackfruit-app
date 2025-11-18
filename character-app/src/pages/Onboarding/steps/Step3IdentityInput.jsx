import { useState } from 'react'
import '../styles/onboarding.css'

/**
 * Step 3: 身份输入 (Identity Input)
 *
 * 配置示例:
 * {
 *   visual: {
 *     background_type: "solid"
 *   },
 *   content: {
 *     title: "WHO ARE YOU?",
 *     fields: [
 *       { id: "name", label: "YOUR NAME", placeholder: "Enter your name...", required: true },
 *       { id: "photo", label: "YOUR PHOTO", type: "file", accept: "image/*", required: false },
 *       { id: "voice", label: "YOUR VOICE", type: "file", accept: "audio/*", required: false }
 *     ]
 *   },
 *   interaction: {
 *     type: "button",
 *     button_text: "[ NEXT ]"
 *   }
 * }
 */
export const Step3IdentityInput = ({ config, globalStyles, onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
    voice_url: ''
  })

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleFileUpload = async (fieldId, file) => {
    // TODO: 实现文件上传到 Supabase Storage
    console.log(`[Step3IdentityInput] Uploading file for ${fieldId}:`, file.name)

    // 临时方案：使用本地 URL
    const localUrl = URL.createObjectURL(file)
    const urlField = `${fieldId}_url`
    setFormData(prev => ({
      ...prev,
      [urlField]: localUrl
    }))
  }

  const handleSubmit = () => {
    const fields = config.content?.fields || []
    const requiredFields = fields.filter(f => f.required)

    // 验证必填字段
    for (const field of requiredFields) {
      if (field.type === 'file') {
        const urlField = `${field.id}_url`
        if (!formData[urlField]) {
          alert(`请上传 ${field.label}`)
          return
        }
      } else {
        if (!formData[field.id]) {
          alert(`请填写 ${field.label}`)
          return
        }
      }
    }

    console.log('[Step3IdentityInput] Form submitted:', formData)
    onComplete(formData)
  }

  const renderField = (field) => {
    if (field.type === 'file') {
      return (
        <div key={field.id} className="input-field">
          <label
            className="input-label"
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: globalStyles?.primary_color || '#00FF41'
            }}
          >
            &gt; {field.label}{field.required && ' *'}
          </label>
          <input
            type="file"
            accept={field.accept}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(field.id, file)
            }}
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: '#FFFFFF',
              backgroundColor: 'transparent',
              border: `1px solid ${globalStyles?.primary_color || '#00FF41'}`,
              padding: '8px 12px',
              fontSize: 16,
              marginTop: 8
            }}
          />
          {formData[`${field.id}_url`] && (
            <div
              style={{
                marginTop: 8,
                color: globalStyles?.primary_color || '#00FF41',
                fontSize: 14
              }}
            >
              ✓ 已上传
            </div>
          )}
        </div>
      )
    }

    return (
      <div key={field.id} className="input-field">
        <label
          className="input-label"
          style={{
            fontFamily: globalStyles?.font_family || "'VT323', monospace",
            color: globalStyles?.primary_color || '#00FF41'
          }}
        >
          &gt; {field.label}{field.required && ' *'}
        </label>
        <input
          type="text"
          placeholder={field.placeholder}
          value={formData[field.id] || ''}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
          className="terminal-input"
          style={{
            fontFamily: globalStyles?.font_family || "'VT323', monospace",
            color: '#FFFFFF',
            backgroundColor: 'transparent',
            border: `1px solid ${globalStyles?.primary_color || '#00FF41'}`,
            padding: '8px 12px',
            fontSize: 18,
            marginTop: 8,
            width: '100%'
          }}
        />
      </div>
    )
  }

  return (
    <div className="onboarding-step step-3-identity-input">
      <div className="content-layer">
        {/* 标题 */}
        {config.content?.title && (
          <h1
            className="splash-title"
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: '#FFFFFF',
              marginBottom: 48
            }}
          >
            {config.content.title}
          </h1>
        )}

        {/* 表单字段 */}
        <div className="identity-form">
          {(config.content?.fields || []).map(field => renderField(field))}
        </div>

        {/* 提交按钮 */}
        <div className="button-container" style={{ marginTop: 32 }}>
          <button
            className="terminal-button"
            onClick={handleSubmit}
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: globalStyles?.primary_color || '#00FF41',
              borderColor: globalStyles?.primary_color || '#00FF41'
            }}
          >
            {config.interaction?.button_text || '[ NEXT ]'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step3IdentityInput
