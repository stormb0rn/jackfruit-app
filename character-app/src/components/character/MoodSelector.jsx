import { motion } from 'framer-motion'

const MOOD_EMOJI = {
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  calm: '😌',
  anxious: '😰',
  angry: '😠',
  neutral: '😐'
}

const MOOD_COLORS = {
  happy: '#FFD700',
  sad: '#6B9BD1',
  excited: '#FF6B35',
  calm: '#90EE90',
  anxious: '#FF6B9D',
  angry: '#DC143C',
  neutral: '#A9A9A9'
}

export const MoodSelector = ({ statuses = [], currentStatus, onSelectStatus }) => {
  if (!statuses || statuses.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 12,
        padding: '12px 20px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: 50,
        zIndex: 20
      }}
    >
      {statuses.map((status) => {
        const isActive = currentStatus?.status_id === status.status_id
        const moodColor = MOOD_COLORS[status.mood] || '#A9A9A9'

        return (
          <motion.button
            key={status.status_id}
            onClick={() => onSelectStatus(status)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: isActive ? `3px solid ${moodColor}` : '3px solid rgba(255,255,255,0.2)',
              backgroundColor: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: isActive ? `0 0 20px ${moodColor}` : 'none'
            }}
          >
            <div style={{ fontSize: 28 }}>
              {MOOD_EMOJI[status.mood] || '😐'}
            </div>
            {isActive && (
              <div style={{ fontSize: 10, color: '#333', marginTop: 2, fontWeight: 600 }}>
                {status.mood}
              </div>
            )}
          </motion.button>
        )
      })}
    </motion.div>
  )
}
