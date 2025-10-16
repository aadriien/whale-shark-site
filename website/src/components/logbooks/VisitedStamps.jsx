import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import { pageMap } from "./LogbookContent.js"


const STORAGE_KEY = "visitedPages";


function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


function blobBorderRadius(min, max) {
    return `
        ${randomRange(min, max)}%
        ${randomRange(min, max)}%
        ${randomRange(min, max)}%
        ${randomRange(min, max)}% /
        ${randomRange(min, max)}%
        ${randomRange(min, max)}%
        ${randomRange(min, max)}%
        ${randomRange(min, max)}%
    `;
}


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
                borderRadius: blobBorderRadius(30, 70),
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
            <div className="visited-saved-header">
                <h3>Visited Stamps</h3>
                <button onClick={clearVisited} className="clear-button">
                    Clear All
                </button>
            </div>

            <div className="stamp-grid">
                {Object.entries(pageMap).map(([slug, { label, path }], idx) => {
                    const isStamped = visited.has(slug);
                    const { hue, borderRadius } = blobStyles[idx];

                    const stampContent = (
                        <>
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
                        </>
                    );

                    return (
                        <div
                            key={slug}
                            className={`stamp ${isStamped ? "stamped" : ""}`}
                        >
                            {/* Allow users to revisit stamped pages */}
                            {isStamped ? (
                                <Link
                                    to={path}
                                    className="stamp-link"
                                    tabIndex={0}
                                    aria-label={`Go to ${label} page`}
                                >
                                    {stampContent}
                                </Link>
                            ) : (
                                stampContent
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 

export default VisitedStamps;
