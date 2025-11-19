import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { OnboardingEngine } from './pages/Onboarding'
import { CharacterList } from './pages/CharacterList'
import { CharacterView } from './pages/CharacterView'
import VoiceChat from './pages/VoiceChat'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding 成为新首页 */}
        <Route path="/" element={<OnboardingEngine />} />

        {/* 角色主页 */}
        <Route path="/character/:characterId" element={<CharacterView />} />

        {/* 角色列表（移到 /characters） */}
        <Route path="/characters" element={<CharacterList />} />

        {/* 语音聊天页面 */}
        <Route path="/voice-chat" element={<VoiceChat />} />
        <Route path="/voice-chat/:characterId" element={<VoiceChat />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
