import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { OnboardingEngine } from './pages/Onboarding'
import { CharacterList } from './pages/CharacterList'
import { CharacterView } from './pages/CharacterView'

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
