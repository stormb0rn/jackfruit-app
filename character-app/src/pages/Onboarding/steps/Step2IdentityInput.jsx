import { useState, useEffect, useRef } from 'react'
import '../styles/onboarding.css'

/**
 * Step 2: 身份输入 (Identity Input)
 * 支持摄像头拍照或相册上传
 *
 * 配置示例:
 * {
 *   visual: {
 *     background_type: "camera"  // 使用摄像头
 *   },
 *   content: {
 *     title: "WHO ARE YOU?",
 *     fields: [
 *       { id: "name", label: "YOUR NAME", placeholder: "Enter your name...", required: true }
 *     ]
 *   },
 *   interaction: {
 *     type: "button",
 *     button_text: "[ CONFIRM ]"
 *   }
 * }
 */
export const Step2IdentityInput = ({ config, globalStyles, onComplete }) => {
  const [formData, setFormData] = useState({
    name: ''
  })
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [photoTaken, setPhotoTaken] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showHUD, setShowHUD] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState(null)  // 存储照片 Base64
  const [photoSource, setPhotoSource] = useState(null)    // 'camera' | 'upload'
  const [cameraReady, setCameraReady] = useState(false)   // 摄像头是否准备好

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)  // 文件输入框引用

  // 启动摄像头
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream

          // 监听视频元数据加载完成
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true)
            console.log('[Step2IdentityInput] Camera ready')
          }
        }

        console.log('[Step2IdentityInput] Camera started')
      } catch (err) {
        console.error('[Step2IdentityInput] Camera access denied:', err)
      }
    }

    startCamera()

    // 清理函数：停止摄像头
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        console.log('[Step2IdentityInput] Camera stopped')
      }
    }
  }, [])

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  // 播放背景音频
  const playBackgroundAudio = () => {
    if (config.visual?.background_audio_url && !audioPlaying) {
      const audio = document.getElementById('step2-background-audio')
      if (audio) {
        audio.play().catch(err => {
          console.log('[Step2IdentityInput] Audio autoplay prevented:', err.message)
        })
        setAudioPlaying(true)
      }
    }
  }

  // 相册上传处理
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    console.log('[Step2IdentityInput] Uploading photo from gallery...')
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotoDataUrl(e.target.result)
      setPhotoSource('upload')
      setPhotoTaken(true)
      console.log('[Step2IdentityInput] Photo uploaded from gallery')
    }
    reader.readAsDataURL(file)
  }

  // 拍照处理
  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    console.log('[Step2IdentityInput] Taking photo...')
    const canvas = canvasRef.current
    const video = videoRef.current

    // 设置 canvas 尺寸与 video 相同
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // 绘制当前帧到 canvas
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // 获取照片数据并保存
    const photoData = canvas.toDataURL('image/jpeg')
    setPhotoDataUrl(photoData)
    setPhotoSource('camera')
    console.log('[Step2IdentityInput] Photo captured')

    setPhotoTaken(true)
    setProcessing(true)

    // 模拟处理过程：2.5秒故障动画
    setTimeout(() => {
      setProcessing(false)
      setShowHUD(true)
      playBackgroundAudio()
      console.log('[Step2IdentityInput] Processing complete, HUD displayed')
    }, 2500)
  }

  const handleSubmit = () => {
    // 验证 name 字段
    if (!formData.name || formData.name.trim() === '') {
      alert('请输入您的名字')
      return
    }

    if (!photoDataUrl) {
      alert('请先拍照或上传照片')
      return
    }

    const submitData = {
      name: formData.name,
      photo: photoDataUrl,
      photoSource: photoSource
    }
    console.log('[Step2IdentityInput] Form submitted:', submitData)
    onComplete(submitData)
  }

  return (
    <div className="onboarding-step step-2-identity-input">
      {/* Speech 音频（单次播放） */}
      {config.visual?.background_audio_url && (
        <audio
          id="step2-background-audio"
          src={config.visual.background_audio_url}
          style={{ display: 'none' }}
        />
      )}

      {/* 背景层：摄像头或照片预览 */}
      <div className="background-layer">
        {/* Loading 指示器（摄像头加载中） */}
        {!cameraReady && !photoDataUrl && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <div className="loading-content">
              <div className="loading-message" style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: globalStyles?.primary_color || '#00FF41',
                fontSize: '20px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                &gt; INITIALIZING CAMERA...
              </div>
              <div className="loading-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}

        {!photoDataUrl && cameraReady ? (
          // 未拍照/上传：显示摄像头实时画面
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={processing ? 'glitch-active' : ''}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              transform: 'scaleX(-1)' // 镜像翻转，更自然
            }}
          />
        ) : photoDataUrl ? (
          // 已拍照/上传：显示照片预览
          <img
            src={photoDataUrl}
            alt="Photo Preview"
            className={processing ? 'glitch-active' : ''}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              transform: photoSource === 'camera' ? 'scaleX(-1)' : 'none' // 拍照的保持镜像
            }}
          />
        ) : null}
        <div
          className="background-overlay"
          style={{
            background: globalStyles?.background_overlay || 'rgba(0, 0, 0, 0.5)'
          }}
        />

        {/* Canvas 用于拍照 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* 取景框 */}
        <div className="camera-viewfinder">
          {/* 取景框四个角落 */}
          <div className="viewfinder-corner viewfinder-corner-tl" />
          <div className="viewfinder-corner viewfinder-corner-tr" />
          <div className="viewfinder-corner viewfinder-corner-bl" />
          <div className="viewfinder-corner viewfinder-corner-br" />
        </div>

        {/* 处理中文本 */}
        {processing && (
          <div className="processing-text">
            SYSTEM PROCESSING...
          </div>
        )}

        {/* HUD 信息标签 */}
        {showHUD && (
          <div className="hud-text hud-face-scan">
            FACE RECOGNIZED<br/>
            MEMORY UPDATED
          </div>
        )}

        {/* 相册按钮（右下角，仅未拍照时显示） */}
        {!photoTaken && (
          <>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div
              className="gallery-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                width: '50px',
                height: '50px',
                background: 'rgba(0, 0, 0, 0.7)',
                border: `2px solid ${globalStyles?.primary_color || '#00FF41'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                zIndex: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                transition: 'all 0.3s ease'
              }}
            >
              📁
            </div>
          </>
        )}
      </div>

      <div className="content-layer" style={{
        justifyContent: 'flex-start',
        paddingTop: '60px'
      }}>
        {/* 标题 - 放在上方 */}
        {config.content?.title && (
          <h1
            className="splash-title"
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: '#FFFFFF',
              marginBottom: 40,
              fontSize: 'clamp(28px, 7vw, 48px)',
              lineHeight: 1.2
            }}
          >
            {config.content.title}
          </h1>
        )}

        {/* 姓名输入框（仅拍照/上传后显示） */}
        {photoTaken && (
          <div className="identity-form fade-in" style={{ width: '100%', maxWidth: 400, marginTop: 'auto', marginBottom: 100 }}>
            <label
              className="input-label"
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: globalStyles?.primary_color || '#00FF41',
                fontSize: 18,
                marginBottom: 8,
                display: 'block'
              }}
            >
              &gt; YOUR NAME *
            </label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="terminal-input"
              autoFocus
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: '#FFFFFF',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${globalStyles?.primary_color || '#00FF41'}`,
                padding: '12px 16px',
                fontSize: 20,
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}
      </div>

      {/* 拍摄/确认按钮（底部居中固定位置） */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20
      }}>
        {!photoTaken ? (
          // 拍摄按钮
          <div style={{ textAlign: 'center' }}>
            <div
              className="shutter-btn"
              onClick={handleTakePhoto}
              style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                border: `4px solid ${globalStyles?.primary_color || '#00FF41'}`,
                background: 'transparent',
                position: 'relative',
                cursor: 'pointer',
                margin: '0 auto'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 55,
                height: 55,
                background: globalStyles?.primary_color || '#00FF41',
                borderRadius: '50%'
              }} />
            </div>
            <p style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: globalStyles?.primary_color || '#00FF41',
              fontSize: 16,
              marginTop: 12
            }}>
              TAKE A SELFIE
            </p>
          </div>
        ) : (
          // 确认按钮
          <button
            className="terminal-button"
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: globalStyles?.primary_color || '#00FF41',
              borderColor: globalStyles?.primary_color || '#00FF41',
              opacity: !formData.name.trim() ? 0.5 : 1,
              cursor: !formData.name.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {config.interaction?.button_text || '[ CONFIRM ]'}
          </button>
        )}
      </div>
    </div>
  )
}

export default Step2IdentityInput
