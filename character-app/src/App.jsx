import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CharacterView } from './pages/CharacterView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/character/:characterId" element={<CharacterView />} />
        <Route path="/" element={<CharacterView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
