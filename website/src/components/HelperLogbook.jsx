import React, { useEffect, useState } from "react";


function Logbook() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const toggle = () => setIsOpen((prev) => !prev);
        window.addEventListener("toggleLogbook", toggle);
        return () => window.removeEventListener("toggleLogbook", toggle);
    }, []);

    return (
        <>
            {/* This part is invisible when closed */}
            {isOpen && (
                <div className="logbook-container">
                    <div className="logbook-header">
                        {/* Add id to h2 elem for aria-label accessibility  */}
                        <h2 id="logbook-title" className="logbook-title">Shark Helper Logbook</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="logbook-close-button"
                            aria-label="Close Logbook"
                            type="button"
                        >
                        ✕
                        </button>
                    </div>
                    <div className="logbook-body">
                        <p>Whale shark helper logs will go here</p>
                        {/* Logs, sections, etc go here */}
                    </div>
                </div>
            )}
        </>
    );
}

export default Logbook;
