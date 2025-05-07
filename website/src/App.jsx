import { HashRouter, Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react";

import Navbar from "./components/Navbar.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const GlobeViews = lazy(() => import("./pages/GlobeViews.jsx"));
const SharkTracker = lazy(() => import("./pages/SharkTracker.jsx"));
const DataVisuals = lazy(() => import("./pages/DataVisuals.jsx"));
const BuildAShark = lazy(() => import("./pages/BuildAShark.jsx"));
const Animation = lazy(() => import("./pages/Animation.jsx"));

function App() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HashRouter>
                {/* Navbar outside Routes so it's always shown on pages */}
                <Navbar />
                <Routes>
                    {/* Redirect root to /home */}
                    <Route path="/" element={<Navigate to="/home" />} />  
                    <Route path="/home" element={<Home />} />

                    <Route path="/globeviews" element={<GlobeViews />} />
                    <Route path="/sharktracker" element={<SharkTracker />} />
                    <Route path="/datavisuals" element={<DataVisuals />} />
                    <Route path="/buildashark" element={<BuildAShark />} />
                    <Route path="/animation" element={<Animation />} />
                </Routes>
            </HashRouter>
        </Suspense>
    )
}

export default App;


