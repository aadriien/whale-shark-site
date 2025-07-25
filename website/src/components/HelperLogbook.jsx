import React, { useEffect, useState } from "react";

import PageOverview from "./logbooks/PageOverview.jsx";
import PageFAQ from "./logbooks/PageFAQ.jsx";
import VisitedStamps from "./logbooks/VisitedStamps.jsx";
import SavedSharks from "./logbooks/SavedSharks.jsx";


const SECTION_COMPONENTS = {
    overview: <PageOverview />,
    faq: <PageFAQ />,
    stamps: <VisitedStamps />,
    saved: <SavedSharks />
};


function Logbook() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("overview");

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
                        X
                        </button>
                    </div>

                    <div className="logbook-body">
                        <p>Whale shark helper logs will go here</p>
                        {/* Logs, sections, etc go here */}
                        {SECTION_COMPONENTS[activeSection]}
                    </div>

                    <div className="logbook-nav">
                        <h4><a onClick={() => setActiveSection("overview")}>
                            Page Overview
                        </a></h4>
                        <span>|</span>
                        <h4><a onClick={() => setActiveSection("faq")}>
                            Page FAQs
                        </a></h4>
                        <span>|</span>
                        <h4><a onClick={() => setActiveSection("stamps")}>
                            Visited Stamps
                        </a></h4>
                        <span>|</span>
                        <h4><a onClick={() => setActiveSection("saved")}>
                            Saved Sharks
                        </a></h4>
                    </div>

                </div>
            )}
        </>
    );
}

export default Logbook;
