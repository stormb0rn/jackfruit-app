import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { characterService } from '../services/characterService'
import { VideoPlayer } from '../components/character/VideoPlayer'
import { MoodSelector } from '../components/character/MoodSelector'
import { OverlayPanel } from '../components/character/OverlayPanel'
import { ActionSuggestions } from '../components/character/ActionSuggestions'

export const CharacterView = () => {
  const { characterId } = useParams()
  const [character, setCharacter] = useState(null)
  const [statuses, setStatuses] = useState([])
  const [currentStatus, setCurrentStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCharacterData()
  }, [characterId])

  const loadCharacterData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load character with all statuses
      const characterData = await characterService.getCharacterWithStatuses(characterId)
      setCharacter(characterData)

      // Get completed statuses
      const completedStatuses = await characterService.getCompletedStatuses(characterId)
      setStatuses(completedStatuses)

      // Get default or first completed status
      if (completedStatuses.length > 0) {
        try {
          const defaultStatus = await characterService.getDefaultStatus(characterId)
          setCurrentStatus(defaultStatus)
        } catch (err) {
          // If no default, use first completed status
          setCurrentStatus(completedStatuses[0])
        }
      }
    } catch (err) {
      console.error('Failed to load character:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectStatus = (status) => {
    setCurrentStatus(status)
  }

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: 24
      }}>
        <div>
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
        height: '100vh',
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
          <div>Error loading character</div>
          <div style={{ fontSize: 14, marginTop: 8, opacity: 0.8 }}>
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!character || !currentStatus) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
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
          <div>Character not found or no statuses available</div>
          <div style={{ fontSize: 14, marginTop: 8, opacity: 0.7 }}>
            Please create statuses in the admin panel
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      {/* Video Background */}
      <VideoPlayer videosPlaylist={currentStatus.videos_playlist || []} />

      {/* Action Suggestions */}
      <ActionSuggestions suggestions={currentStatus.suggestions_list || []} />

      {/* Overlay Panels */}
      {currentStatus.overlays_content?.now && (
        <OverlayPanel type="now" content={currentStatus.overlays_content.now} />
      )}

      {currentStatus.overlays_content?.health && (
        <OverlayPanel type="health" content={currentStatus.overlays_content.health} />
      )}

      {/* Mood Selector */}
      <MoodSelector
        statuses={statuses}
        currentStatus={currentStatus}
        onSelectStatus={handleSelectStatus}
      />
    </div>
  )
}
