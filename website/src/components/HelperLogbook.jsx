import React, { useState } from "react";
import { useLocation } from "react-router-dom";

import PageOverview from "./logbooks/PageOverview.jsx";
import PageFAQ from "./logbooks/PageFAQ.jsx";
import VisitedStamps from "./logbooks/VisitedStamps.jsx";
import SavedSharks from "./logbooks/SavedSharks.jsx";

import { pageMap } from "./logbooks/LogbookContent.js";


function Logbook({ isLogbookOpen, setIsLogbookOpen }) {
    const [activeSection, setActiveSection] = useState("overview");

    // Figure out which page user is on & update logbook display
    const location = useLocation();
    const currentPath = location.pathname;
    const pageSlug = currentPath.split("/").filter(Boolean).pop(); 

    const pageLabelPath = pageMap[pageSlug];

    return (
        <>
            {/* This part is invisible when closed */}
            {isLogbookOpen && (
                <div className="logbook-container">
                    <div className="logbook-inner">

                        <div className="logbook-header">
                            {/* Add id to h2 elem for aria-label accessibility  */}
                            <h2 id="logbook-title" className="logbook-title">Shark Helper Logbook</h2>
                            <button
                                onClick={() => setIsLogbookOpen(false)}
                                className="logbook-close-button"
                                aria-label="Close Logbook"
                                type="button"
                            >
                            X
                            </button>
                        </div>

                        <div className="logbook-body">
                            <h4>📍 <span className="logbook-page-name">{pageLabelPath.label}</span> page</h4>
                            <PageOverview currentPage={pageSlug} />,
                            <PageFAQ currentPage={pageSlug} />,
                            <VisitedStamps currentPage={pageSlug} />,
                            <SavedSharks />
                        </div>

                        <div className="logbook-nav">
                            <h4>
                                <a 
                                    onClick={() => setActiveSection("overview")}
                                    className={activeSection === "overview" ? "active" : ""}
                                >
                                    Page Overview
                                </a>
                            </h4>
                            <span>|</span>
                            <h4>
                                <a 
                                    onClick={() => setActiveSection("faq")}
                                    className={activeSection === "faq" ? "active" : ""}
                                >
                                    Page FAQs
                                </a>
                            </h4>
                            <span>|</span>
                            <h4>
                                <a 
                                    onClick={() => setActiveSection("stamps")}
                                    className={activeSection === "stamps" ? "active" : ""}
                                >
                                    Visited Stamps
                                </a>
                            </h4>
                            <span>|</span>
                            <h4>
                                <a 
                                    onClick={() => setActiveSection("saved")}
                                    className={activeSection === "saved" ? "active" : ""}
                                >
                                    Saved Sharks
                                </a>
                            </h4>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}

export default Logbook;
