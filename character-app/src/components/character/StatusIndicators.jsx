export const StatusIndicators = ({ activeOverlay, onToggleOverlay }) => {
  const indicators = [
    {
      id: 'now',
      icon: '🔴🟢',
      bgColor: 'rgba(255, 255, 255, 0.15)',
      size: 44
    },
    {
      id: 'health',
      icon: '💗',
      bgColor: 'rgba(255, 192, 203, 0.2)',
      size: 44
    },
    {
      id: 'mood',
      icon: '😊',
      bgColor: 'rgba(255, 215, 0, 0.2)',
      size: 44
    }
  ]

  return (
    <div style={{
      position: 'absolute',
      left: 16,
      top: 100,
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      {indicators.map((indicator) => (
        <button
          key={indicator.id}
          onClick={() => onToggleOverlay(indicator.id)}
          style={{
            width: indicator.size,
            height: indicator.size,
            borderRadius: '50%',
            border: activeOverlay === indicator.id
              ? '2px solid rgba(255, 255, 255, 0.8)'
              : '2px solid rgba(255, 255, 255, 0.3)',
            backgroundColor: activeOverlay === indicator.id
              ? 'rgba(255, 255, 255, 0.25)'
              : indicator.bgColor,
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: indicator.id === 'now' ? 14 : 20,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: activeOverlay === indicator.id
              ? '0 4px 12px rgba(255, 255, 255, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
            outline: 'none'
          }}
        >
          {indicator.icon}
        </button>
      ))}

      {/* Add button (disabled for now) */}
      <button
        disabled
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          cursor: 'not-allowed',
          opacity: 0.5,
          outline: 'none'
        }}
      >
        ➕
      </button>
    </div>
  )
}
