export const TopBar = () => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '50px 20px 20px',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 10
    }}>
      <button
        onClick={() => {
          // TODO: Implement post functionality
          console.log('Post clicked')
        }}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          color: '#000',
          border: 'none',
          borderRadius: 20,
          padding: '10px 24px',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        Post
      </button>
    </div>
  )
}
