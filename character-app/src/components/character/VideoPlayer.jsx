import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export const VideoPlayer = ({ videosPlaylist = [] }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && videosPlaylist.length > 0) {
      videoRef.current.load()
      videoRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err)
      })
    }
  }, [currentVideoIndex, videosPlaylist])

  const handleVideoEnd = () => {
    if (videosPlaylist.length === 0) return
    const nextIndex = (currentVideoIndex + 1) % videosPlaylist.length
    setCurrentVideoIndex(nextIndex)
  }

  if (!videosPlaylist || videosPlaylist.length === 0) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: 24,
        textAlign: 'center',
        padding: 40
      }}>
        <div>
          <div style={{ marginBottom: 16, fontSize: 48 }}>📹</div>
          <div>No videos available</div>
        </div>
      </div>
    )
  }

  const currentVideo = videosPlaylist[currentVideoIndex]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <video
        ref={videoRef}
        onEnded={handleVideoEnd}
        autoPlay
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000'
        }}
      >
        <source src={currentVideo.video_url} type="video/mp4" />
      </video>

      {videosPlaylist.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 6,
          zIndex: 10
        }}>
          {videosPlaylist.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentVideoIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === currentVideoIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
