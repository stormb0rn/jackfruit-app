export const MobileFrame = ({ children }) => {
  return (
    <>
      {/* Desktop container with iPhone frame */}
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: '#2a2a2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}
      className="desktop-container"
      >
        {/* iPhone Frame */}
        <div style={{
          width: 390,
          height: 844,
          borderRadius: 40,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          backgroundColor: '#000',
          position: 'relative'
        }}
        className="iphone-frame"
        >
          {children}
        </div>
      </div>

      {/* Mobile-specific styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-container {
            padding: 0;
            min-height: 100vh;
            height: 100vh;
          }
          .iphone-frame {
            width: 100vw !important;
            height: 100vh !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  )
}
