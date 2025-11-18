import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const OverlayPanel = ({ type, content }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const panelConfig = {
    now: {
      title: 'NOW',
      icon: '⏰',
      color: '#FF6B35',
      position: { top: 100, right: 20 }
    },
    health: {
      title: 'HEALTH',
      icon: '❤️',
      color: '#4ECDC4',
      position: { top: 200, right: 20 }
    }
  }

  const config = panelConfig[type] || panelConfig.now

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        position: 'absolute',
        ...config.position,
        zIndex: 30
      }}
    >
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          cursor: 'pointer',
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: isExpanded ? '16px' : '50px',
          padding: isExpanded ? '16px 20px' : '12px 20px',
          minWidth: isExpanded ? 280 : 120,
          transition: 'all 0.3s ease',
          border: `2px solid ${config.color}`
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'white'
        }}>
          <span style={{ fontSize: 24 }}>{config.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              color: config.color
            }}>
              {config.title}
            </div>
            {!isExpanded && content && (
              <div style={{
                fontSize: 11,
                opacity: 0.8,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 60
              }}>
                {content.substring(0, 10)}...
              </div>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 16, opacity: 0.7 }}
          >
            ▼
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && content && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid rgba(255,255,255,0.1)`,
                fontSize: 14,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.9)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
