import React, { useEffect, useState, useMemo } from "react";

const pageMap = {
    home: "Home",
    about: "About",
    research: "Research Reef",
    creative: "Creative Current",
    globeviews: "Globe Views",
    sharktracker: "Shark Tracker",
    datavisuals: "Data Visuals",
    environment: "Environment",
    buildashark: "Build-A-Shark",
    animation: "Animation",
};

const STORAGE_KEY = "visitedPages";


function VisitedStamps({ currentPage }) {
    // Initialize from localStorage or empty set
    const [visited, setVisited] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });
    
    // Precompute random blob styles once
    const blobStyles = useMemo(
        () =>
            Object.keys(pageMap).map(() => ({
            hue: Math.floor(Math.random() * 360),
            borderRadius: `
                ${30 + Math.random() * 40}% 
                ${30 + Math.random() * 40}% 
                ${30 + Math.random() * 40}% 
                ${30 + Math.random() * 40}% / 
                ${30 + Math.random() * 40}% 
                ${30 + Math.random() * 40}% 
                ${30 + Math.random() * 40}% 
                ${30 + Math.random() * 40}%
            `,
        })),
        []
    );

    // Allow user to reset stamps
    const clearVisited = () => {
        localStorage.removeItem(STORAGE_KEY);
        setVisited(new Set());
    };
    
    useEffect(() => {
        if (!currentPage) return;

        setVisited(prev => {
            if (prev.has(currentPage)) return prev; // no change
            const updated = new Set(prev);
            updated.add(currentPage);
            
            // Save updated set to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...updated]));
            return updated;
        });
    }, [currentPage]);
    
    return (
        <div className="logbook-section visited-stamps">
            <div className="visited-stamps-header">
                <h3>Visited Stamps</h3>
                <button onClick={clearVisited} className="clear-button">
                    Clear All
                </button>
            </div>

            <div className="stamp-grid">
                {Object.entries(pageMap).map(([path, label], idx) => {
                    const isStamped = visited.has(path);
                    const { hue, borderRadius } = blobStyles[idx];
                    
                    return (
                        <div
                            key={path}
                            className={`stamp ${isStamped ? "stamped" : ""}`}
                        >
                            <div
                                className="stamp-blob"
                                style={{ "--hue": hue, borderRadius }}

                            />
                            <span className="stamp-label">{label}</span>
                                {isStamped && (
                                <span className="stamp-insignia" aria-label="Visited mark" role="img">
                                    ✔️
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 

export default VisitedStamps;
