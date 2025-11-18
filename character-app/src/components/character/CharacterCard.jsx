export const CharacterCard = ({ character, onClick }) => {
  // Check if character has avatar URL
  const hasAvatar = character.avatar_url && character.avatar_url.trim() !== ''

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 20,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
      }}
    >
      {/* Character Avatar/Image */}
      <div style={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: 16,
        background: hasAvatar
          ? 'rgba(0,0,0,0.3)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {hasAvatar ? (
          <img
            src={character.avatar_url}
            alt={character.name || 'Character'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div style={{
          width: '100%',
          height: '100%',
          display: hasAvatar ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(48px, 12vw, 72px)'
        }}>
          {character.avatar_emoji || '🤖'}
        </div>
      </div>

      {/* Character Name */}
      <h3 style={{
        fontSize: 'clamp(18px, 5vw, 22px)',
        fontWeight: 600,
        color: 'white',
        margin: '0 0 6px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {character.name || 'Unnamed Character'}
      </h3>

      {/* Character Description */}
      {character.description && (
        <p style={{
          fontSize: 'clamp(12px, 3.5vw, 14px)',
          color: 'rgba(255,255,255,0.8)',
          margin: '0 0 12px',
          textAlign: 'center',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minHeight: '2.8em'
        }}>
          {character.description}
        </p>
      )}

      {/* Character Metadata */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.15)',
        gap: 8,
        flexWrap: 'wrap'
      }}>
        {/* Age */}
        {character.age && (
          <div style={{
            textAlign: 'center',
            minWidth: 60
          }}>
            <div style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 2,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Age
            </div>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'white'
            }}>
              {character.age}
            </div>
          </div>
        )}

        {/* Personality */}
        {character.personality && (
          <div style={{
            textAlign: 'center',
            flex: '1 1 auto',
            minWidth: 80
          }}>
            <div style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 2,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Type
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {character.personality}
            </div>
          </div>
        )}

        {/* Occupation */}
        {character.occupation && (
          <div style={{
            textAlign: 'center',
            flex: '1 1 auto',
            minWidth: 80
          }}>
            <div style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: 2,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Role
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {character.occupation}
            </div>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 100%)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        borderRadius: 20
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0'
      }}
      />
    </div>
  )
}
