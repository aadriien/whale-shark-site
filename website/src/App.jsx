import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import SharkTracker from './pages/SharkTracker.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Navigate to="/home" />} />  {/* Redirect root to /home */}
        <Route path="/home" element={<Home />} />
        <Route path="/sharktracker" element={<SharkTracker />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


