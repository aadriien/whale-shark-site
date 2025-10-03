import React, { useState } from "react";
import { useLocation } from "react-router-dom";

import PageOverview from "./logbooks/PageOverview.jsx";
import PageFAQ from "./logbooks/PageFAQ.jsx";
import VisitedStamps from "./logbooks/VisitedStamps.jsx";
import SavedSharks from "./logbooks/SavedSharks.jsx";

import { pageMap } from "./logbooks/LogbookContent.js";

function Logbook({ setIsLogbookOpen }) {
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
                    { /* How did we get from h2 to h4 here? What happened to h3? */}
                    <h4>📍 <span className="logbook-page-name">{pageLabelPath.label}</span> page</h4>
                    <PageOverview currentPage={pageSlug} />,
                    <PageFAQ currentPage={pageSlug} />,
                    <VisitedStamps currentPage={pageSlug} />,
                    <SavedSharks />
                </div>

                <LogbookNav>
                    <NavLink page="overview">
                        Page Overview
                    </NavLink>
                    <NavLink page="faq">
                        Page FAQs
                    </NavLink>
                    <NavLink page="stamps">
                        Visited Stamps
                    </NavLink>
                    <NavLink page="saved">
                        Saved Sharks
                    </NavLink>
                </LogbookNav>
            </div>
        </div>
    );
}

const LogbookContext = React.createContext();

function LogbookNav({ children }) {
    const [activeSection, setActiveSection] = useState("overview");
    const items = React.Children.toArray(children);
    return (
        <LogbookContext.Provider value={{ activeSection, setActiveSection }}>
            <div className="logbook-nav">
            {
                items.map((item, index) => (
                    <>
                        {/* h3 skipped? Are h* tags appropriate for navigation? */}
                        <h4 key={index}>
                            {item}
                        </h4>
                        {index < items.length - 1 && <span>|</span>}
                    </>
                ))
            }
            </div>
        </LogbookContext.Provider>
    )
}

function NavLink({ page, children }) {
    const { activeSection, setActiveSection } = useContext(LogbookContext);
    return (
        <a
            onClick={() => setActiveSection(page)}
            className={activeSection === page ? "active" : ""}
        >
            {children}
        </a>
    );
}

export default Logbook;
