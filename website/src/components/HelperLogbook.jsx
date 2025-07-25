import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import PageOverview from "./logbooks/PageOverview.jsx";
import PageFAQ from "./logbooks/PageFAQ.jsx";
import VisitedStamps from "./logbooks/VisitedStamps.jsx";
import SavedSharks from "./logbooks/SavedSharks.jsx";


function Logbook() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("overview");

    // Figure out which page user is on & update logbook display
    const location = useLocation();
    const currentPath = location.pathname;
    const pageSlug = currentPath.split("/").filter(Boolean).pop(); 

    const SECTION_COMPONENTS = {
        overview: <PageOverview currentPage={pageSlug} />,
        faq: <PageFAQ currentPage={pageSlug} />,
        stamps: <VisitedStamps />,
        saved: <SavedSharks />
    };


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
                    <div className="logbook-inner">

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
                </div>
            )}
        </>
    );
}

export default Logbook;
