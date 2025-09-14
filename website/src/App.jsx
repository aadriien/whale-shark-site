import { Suspense, lazy, useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom"

import Navbar from "./components/Navbar.jsx";
import Logbook from "./components/HelperLogbook.jsx";

const ResearchReef = lazy(() => import("./pages/ResearchReef.jsx"));
const CreativeCurrent = lazy(() => import("./pages/CreativeCurrent.jsx"));

const Home = lazy(() => import("./pages/Home.jsx"));
const About = lazy(() => import("./pages/About.jsx"));

const GlobeViews = lazy(() => import("./pages/GlobeViews.jsx"));
const SharkTracker = lazy(() => import("./pages/SharkTracker.jsx"));
const GeoLabs = lazy(() => import("./pages/GeoLabs.jsx"));
const DataVisuals = lazy(() => import("./pages/DataVisuals.jsx"));
const Environment = lazy(() => import("./pages/Environment.jsx"));

const BuildAShark = lazy(() => import("./pages/BuildAShark.jsx"));
const Animation = lazy(() => import("./pages/Animation.jsx"));


function App() {
    const [isLogbookOpen, setIsLogbookOpen] = useState(false);
    const [theme, setTheme] = useState("light");

    // Keep track of browser light vs dark mode 
    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e) => setTheme(e.matches ? "dark" : "light");

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);


    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HashRouter>
                {/* Navbar outside Routes so it's always shown on pages */}
                <Navbar 
                    isLogbookOpen={isLogbookOpen}
                    setIsLogbookOpen={setIsLogbookOpen}
                    theme={theme} 
                    setTheme={setTheme}
                />

                {/* Logbook overlay (always there but conditionally rendered) */}
                <Logbook 
                    isLogbookOpen={isLogbookOpen}
                    setIsLogbookOpen={setIsLogbookOpen}
                />

                <Routes>
                    <Route path="/" element={<Navigate to="/home" />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/about" element={<About />} />

                    <Route path="/research" element={<ResearchReef />} />
                    <Route path="/creative" element={<CreativeCurrent />} />

                    {/* Research Reef */}
                    <Route path="/research/globeviews" element={<GlobeViews />} />
                    <Route path="/research/sharktracker" element={<SharkTracker />} />
                    <Route path="/research/geolabs" element={<GeoLabs />} />
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


