import { motion } from 'framer-motion'

export const ActionSuggestions = ({ suggestions = [] }) => {
  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 30
      }}
    >
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          color: '#FFD700',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 18 }}>💡</span>
          SUGGESTIONS
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                fontSize: 14,
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,215,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#FFD700',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {index + 1}
              </div>
              <div style={{ flex: 1, lineHeight: 1.4 }}>
                {suggestion}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
