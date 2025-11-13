export const BottomSection = ({ suggestions = [] }) => {
  // Take first 2 suggestions
  const displaySuggestions = suggestions.slice(0, 2)

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '30px 20px 30px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
      zIndex: 10
    }}>
      {/* What's next section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'white',
          marginBottom: 12,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          What's next?
        </div>

        <div style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap'
        }}>
          {displaySuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                // TODO: Implement suggestion click
                console.log('Suggestion clicked:', suggestion)
              }}
              style={{
                flex: '1 1 auto',
                minWidth: 140,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 25,
                padding: '12px 18px',
                fontSize: 14,
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{ fontSize: 16 }}>✨</span>
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

const BottomNavigation = () => {
  const navItems = [
    { icon: '🏠', label: 'Home' },
    { icon: '💗', label: 'Likes', badge: true },
    { icon: '😊', label: 'Mood' },
    { icon: '💗', label: 'Favorites', badge: true },
    { icon: '👤', label: 'Profile' }
  ]

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 8
    }}>
      {navItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            // TODO: Implement navigation
            console.log('Nav clicked:', item.label)
          }}
          style={{
            position: 'relative',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 28,
            cursor: 'pointer',
            padding: 8,
            transition: 'transform 0.2s ease',
            outline: 'none',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          {item.icon}
          {item.badge && (
            <span style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#FF3B30',
              border: '2px solid #000'
            }} />
          )}
        </button>
      ))}
    </div>
  )
}
