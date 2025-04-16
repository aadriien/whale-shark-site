import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import GlobeViews from './pages/GlobeViews.jsx'
import SharkTracker from './pages/SharkTracker.jsx'
import Animation from './pages/Animation.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Navigate to="/home" />} />  {/* Redirect root to /home */}
        <Route path="/home" element={<Home />} />
        <Route path="/globeviews" element={<GlobeViews />} />
        <Route path="/sharktracker" element={<SharkTracker />} />
        <Route path="/animation" element={<Animation />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App


