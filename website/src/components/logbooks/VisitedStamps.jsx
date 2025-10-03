import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";

import { pageMap } from "./LogbookContent.js"


const STORAGE_KEY = "visitedPages";

function VisitedStamps({ currentPage }) {
    const [visited, setVisited] = useLocalStorage(
        STORAGE_KEY,
        () => new Set()
    );
    
    // Precompute random blob styles once
    const blobStyles = useMemo(
        () =>
            Object.keys(pageMap).map(() => ({
            hue: Math.floor(Math.random() * 360),
            borderRadius: `
                ${randomRange(30, 70)}% 
                ${randomRange(30, 70)}% 
                ${randomRange(30, 70)}% 
                ${randomRange(30, 70)}% / 
                ${randomRange(30, 70)}% 
                ${randomRange(30, 70)}% 
                ${randomRange(30, 70)}% 
                ${randomRange(30, 70)}%
            `,
        })),
        []
    );

    const clearVisited = () => {
        setVisited(new Set());
    }

    useEffect(() => {
        if (!currentPage) return;

        setVisited(prev => {
            if (prev.has(currentPage)) return prev; // no change
            const updated = new Set(prev);
            updated.add(currentPage);
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

function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            console.log(`Loading ${key} from localStorage: ${saved}`);
            if (saved !== null) {
                return JSON.parse(saved);
            }
            return defaultValue;
        } catch (e) {
            console.error(e);
            return defaultValue;
        }
    });

    useEffect(() => {
        if (value === null) {
            return;
        }
        const rawValue = JSON.stringify(value);
        localStorage.setItem(key, rawValue);
    }, [key, value]);

    const deleteValue = useCallback((): void => {
        console.log(`Deleting ${key} from localStorage`);
        localStorage.removeItem(key);
        setValue(defaultValue);
    }, [key, defaultValue]);

    return [value, setValue, deleteValue];
}

function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export default VisitedStamps;
