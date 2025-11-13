export const StatusOverlays = ({
  activeOverlay,
  currentStatus,
  allStatuses,
  onSelectStatus,
  onClose
}) => {
  if (!activeOverlay || !currentStatus) return null

  const overlayStyle = {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    borderRadius: 16,
    padding: 20,
    color: 'white',
    zIndex: 15,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  }

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginBottom: 12,
    textTransform: 'uppercase'
  }

  // NOW Overlay
  if (activeOverlay === 'now') {
    return (
      <div style={overlayStyle}>
        <div style={labelStyle}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#FF3B30'
          }} />
          AI: YOU NOW
        </div>
        <p style={{
          fontSize: 15,
          lineHeight: 1.6,
          margin: 0,
          color: 'rgba(255, 255, 255, 0.95)'
        }}>
          {currentStatus.overlays_content?.now || 'No status information available.'}
        </p>
      </div>
    )
  }

  // HEALTH Overlay
  if (activeOverlay === 'health') {
    const healthData = currentStatus.overlays_content?.health
    // Handle both string and object formats
    const healthLevel = typeof healthData === 'object' ? (healthData.level || 70) : 70
    const healthMessage = typeof healthData === 'string'
      ? healthData
      : (typeof healthData === 'object' ? healthData.message : 'AI You is feeling tired these days. Maybe an early night could help.')

    return (
      <div style={overlayStyle}>
        <div style={labelStyle}>
          <span style={{ fontSize: 16 }}>💗</span>
          HEALTH
        </div>

        {/* Health Bar */}
        <div style={{
          width: '100%',
          height: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 16
        }}>
          <div style={{
            width: `${healthLevel}%`,
            height: '100%',
            background: 'linear-gradient(to right, #F9C80E 0%, #F86624 100%)',
            borderRadius: 6,
            transition: 'width 0.5s ease'
          }} />
        </div>

        <p style={{
          fontSize: 15,
          lineHeight: 1.6,
          margin: 0,
          color: 'rgba(255, 255, 255, 0.95)'
        }}>
          {healthMessage}
        </p>
      </div>
    )
  }

  // MOOD Overlay
  if (activeOverlay === 'mood') {
    return (
      <div style={overlayStyle}>
        <div style={labelStyle}>
          <span style={{ fontSize: 16 }}>😊</span>
          MOOD
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {allStatuses.map((status) => {
            const isActive = status.status_id === currentStatus.status_id

            return (
              <button
                key={status.status_id}
                onClick={() => {
                  if (!isActive) {
                    onSelectStatus(status)
                    onClose()
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: 18,
                  fontWeight: 500,
                  color: 'white',
                  backgroundColor: isActive
                    ? 'rgba(255, 255, 255, 0.25)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: isActive
                    ? '2px solid rgba(255, 255, 255, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 12,
                  cursor: isActive ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }
                }}
              >
                {status.mood || status.mood_name || 'Unknown Mood'}
                {isActive && (
                  <span style={{
                    marginLeft: 8,
                    fontSize: 14,
                    opacity: 0.7
                  }}>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}
