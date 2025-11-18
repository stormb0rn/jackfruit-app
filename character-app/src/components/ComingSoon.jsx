import { motion } from 'framer-motion'

export const ComingSoon = ({ characterName }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      padding: 20,
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 style={{ fontSize: 48, marginBottom: 20, fontWeight: 'bold' }}>
          {characterName || 'Character'}
        </h1>
        <p style={{ fontSize: 24, opacity: 0.9 }}>
          is coming soon...
        </p>
      </motion.div>
    </div>
  )
}
