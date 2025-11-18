import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { characterService } from '../services/characterService'
import { MobileFrame } from '../components/layout/MobileFrame'
import { VideoPlayer } from '../components/character/VideoPlayer'
import { StatusIndicators } from '../components/character/StatusIndicators'
import { StatusOverlays } from '../components/character/StatusOverlays'
import { TopBar } from '../components/character/TopBar'
import { BottomSection } from '../components/character/BottomSection'

export const CharacterView = () => {
  const { characterId } = useParams()
  const [character, setCharacter] = useState(null)
  const [statuses, setStatuses] = useState([])
  const [currentStatus, setCurrentStatus] = useState(null)
  const [activeOverlay, setActiveOverlay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCharacterData()
  }, [characterId])

  const loadCharacterData = async () => {
    try {
      setLoading(true)
      setError(null)

      // If no characterId provided, get the first available character
      let targetCharacterId = characterId
      if (!targetCharacterId) {
        const allCharacters = await characterService.getAllCharacters()
        if (allCharacters.length === 0) {
          throw new Error('No characters found in database')
        }
        targetCharacterId = allCharacters[0].character_id
      }

      // Load character with all statuses
      const characterData = await characterService.getCharacterWithStatuses(targetCharacterId)
      setCharacter(characterData)

      // Get completed statuses
      const completedStatuses = await characterService.getCompletedStatuses(targetCharacterId)
      setStatuses(completedStatuses)

      // Get default or first completed status
      if (completedStatuses.length > 0) {
        try {
          const defaultStatus = await characterService.getDefaultStatus(targetCharacterId)
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

  const handleToggleOverlay = (overlayType) => {
    // Toggle: if clicking the same overlay, close it; otherwise switch to new one
    setActiveOverlay(activeOverlay === overlayType ? null : overlayType)
  }

  const handleSelectStatus = (status) => {
    setCurrentStatus(status)
    // Close overlay after selecting mood
    setActiveOverlay(null)
  }

  if (loading) {
    return (
      <MobileFrame>
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          color: '#00FF41',
          fontSize: 24,
          fontFamily: "'VT323', monospace"
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16, fontSize: 48 }}>⏳</div>
            <div>&gt; LOADING CHARACTER...</div>
          </div>
        </div>
      </MobileFrame>
    )
  }

  if (error) {
    return (
      <MobileFrame>
        <div style={{
          width: '100%',
          height: '100%',
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
      </MobileFrame>
    )
  }

  if (!character || !currentStatus) {
    return (
      <MobileFrame>
        <div style={{
          width: '100%',
          height: '100%',
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
      </MobileFrame>
    )
  }

  return (
    <MobileFrame>
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000'
      }}>
        {/* Video Background */}
        <VideoPlayer videosPlaylist={currentStatus.videos_playlist || []} />

        {/* Top Bar with Post button */}
        <TopBar />

        {/* Left Side Status Indicators */}
        <StatusIndicators
          activeOverlay={activeOverlay}
          onToggleOverlay={handleToggleOverlay}
        />

        {/* Status Overlays (NOW/HEALTH/MOOD) */}
        <StatusOverlays
          activeOverlay={activeOverlay}
          currentStatus={currentStatus}
          allStatuses={statuses}
          onSelectStatus={handleSelectStatus}
          onClose={() => setActiveOverlay(null)}
        />

        {/* Bottom Section with Suggestions and Navigation */}
        <BottomSection suggestions={currentStatus.suggestions_list || []} />
      </div>
    </MobileFrame>
  )
}
