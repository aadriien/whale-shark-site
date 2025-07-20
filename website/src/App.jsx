import { HashRouter, Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react";

import Navbar from "./components/Navbar.jsx";

const ResearchReef = lazy(() => import("./pages/ResearchReef.jsx"));
const CreativeCurrent = lazy(() => import("./pages/CreativeCurrent.jsx"));

const Home = lazy(() => import("./pages/Home.jsx"));
const About = lazy(() => import("./pages/About.jsx"));

const GlobeViews = lazy(() => import("./pages/GlobeViews.jsx"));
const SharkTracker = lazy(() => import("./pages/SharkTracker.jsx"));
const DataVisuals = lazy(() => import("./pages/DataVisuals.jsx"));
const Environment = lazy(() => import("./pages/Environment.jsx"));
const BuildAShark = lazy(() => import("./pages/BuildAShark.jsx"));
const Animation = lazy(() => import("./pages/Animation.jsx"));

function App() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HashRouter>
                {/* Navbar outside Routes so it's always shown on pages */}
                <Navbar />
                <Routes>
                    <Route path="/" element={<Navigate to="/home" />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/about" element={<About />} />

                    <Route path="/research" element={<ResearchReef />} />
                    <Route path="/creative" element={<CreativeCurrent />} />

                    {/* Research Reef */}
                    <Route path="/research/globeviews" element={<GlobeViews />} />
                    <Route path="/research/sharktracker" element={<SharkTracker />} />
                    <Route path="/research/datavisuals" element={<DataVisuals />} />
                    <Route path="/research/environment" element={<Environment />} />

                    {/* Creative Current */}
                    <Route path="/creative/buildashark" element={<BuildAShark />} />
                    <Route path="/creative/animation" element={<Animation />} />
                </Routes>
            </HashRouter>
        </Suspense>
    )
}

export default App;


