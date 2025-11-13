import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CharacterList } from './pages/CharacterList'
import { CharacterView } from './pages/CharacterView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CharacterList />} />
        <Route path="/character/:characterId" element={<CharacterView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
