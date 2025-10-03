import React, { useState } from "react";
import { useLocation } from "react-router-dom";

import PageOverview from "./logbooks/PageOverview.jsx";
import PageFAQ from "./logbooks/PageFAQ.jsx";
import VisitedStamps from "./logbooks/VisitedStamps.jsx";
import SavedSharks from "./logbooks/SavedSharks.jsx";

import { pageMap } from "./logbooks/LogbookContent.js";


function Logbook({ setIsLogbookOpen }) {
    const [activeSection, setActiveSection] = useState("overview");

    // Figure out which page user is on & update logbook display
    const location = useLocation();
    const currentPath = location.pathname;
    const pageSlug = currentPath.split("/").filter(Boolean).pop(); 

    const pageLabelPath = pageMap[pageSlug];

    return (
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

                <LogbookNav>
                    <a 
                        onClick={() => setActiveSection("overview")}
                        className={activeSection === "overview" ? "active" : ""}
                    >
                        Page Overview
                    </a>
                    <a 
                        onClick={() => setActiveSection("faq")}
                        className={activeSection === "faq" ? "active" : ""}
                    >
                        Page FAQs
                    </a>
                    <a 
                        onClick={() => setActiveSection("stamps")}
                        className={activeSection === "stamps" ? "active" : ""}
                    >
                        Visited Stamps
                    </a>
                    <a 
                        onClick={() => setActiveSection("saved")}
                        className={activeSection === "saved" ? "active" : ""}
                    >
                        Saved Sharks
                    </a>
                </LogbookNav>
            </div>
        </div>
    );
}

function LogbookNav({ children }) {
    const items = React.Children.toArray(children);
    return (
        <div className="logbook-nav">
        {
            items.map((item, index) => (
                <>
                    <h4 key={index}>
                        {item}
                    </h4>
                    {index < items.length - 1 && <span>|</span>}
                </>
            ))
        }
        </div>
}

export default Logbook;
