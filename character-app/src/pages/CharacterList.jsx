import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { characterService } from '../services/characterService'
import { CharacterCard } from '../components/character/CharacterCard'

export const CharacterList = () => {
  const navigate = useNavigate()
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCharacters()
  }, [])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await characterService.getAllCharacters()
      setCharacters(data)
    } catch (err) {
      console.error('Failed to load characters:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCharacter = (characterId) => {
    navigate(`/character/${characterId}`)
  }

  if (loading) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: 24
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, fontSize: 48 }}>⏳</div>
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        fontSize: 24,
        textAlign: 'center',
        padding: 40
      }}>
        <div>
          <div style={{ marginBottom: 16, fontSize: 48 }}>❌</div>
          <div>Failed to Load</div>
          <div style={{ fontSize: 14, marginTop: 8, opacity: 0.8 }}>
            {error}
          </div>
          <button
            onClick={loadCharacters}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              fontSize: 16,
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid white',
              borderRadius: 12,
              color: 'white',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        color: '#333',
        fontSize: 24,
        textAlign: 'center',
        padding: 40
      }}>
        <div>
          <div style={{ marginBottom: 16, fontSize: 48 }}>🤖</div>
          <div>No Characters Available</div>
          <div style={{ fontSize: 14, marginTop: 8, opacity: 0.7 }}>
            Please create characters in the admin panel
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '60px 20px 40px',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 48px)',
          fontWeight: 700,
          color: 'white',
          margin: '0 0 12px',
          textShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          Choose Your Character
        </h1>
        <p style={{
          fontSize: 'clamp(14px, 4vw, 18px)',
          color: 'rgba(255,255,255,0.9)',
          margin: 0
        }}>
          Explore unique personalities
        </p>
      </div>

      {/* Character Grid */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
        gap: 20,
        padding: '0'
      }}>
        {characters.map((character) => (
          <CharacterCard
            key={character.character_id}
            character={character}
            onClick={() => handleSelectCharacter(character.character_id)}
          />
        ))}
      </div>
    </div>
  )
}
