import { useState } from "react";
import { useLocation } from "react-router-dom";

import PageOverview from "./logbooks/PageOverview";
import PageFAQ from "./logbooks/PageFAQ";
import VisitedStamps from "./logbooks/VisitedStamps";
import SavedSharks from "./logbooks/SavedSharks";

import { pageMap } from "./logbooks/LogbookContent";

import { LogbookProps } from "../types/logbooks"


function Logbook({ setIsLogbookOpen }: LogbookProps) {
    const [activeSection, setActiveSection] = useState<string>("overview");

    // Figure out which page user is on & update logbook display
    const location = useLocation();
    const currentPath = location.pathname;
    const pageSlug = currentPath.split("/").filter(Boolean).pop(); 

    const pageLabelPath = pageMap[pageSlug];

    const SECTION_COMPONENTS = {
        overview: <PageOverview currentPage={pageSlug} />,
        faq: <PageFAQ currentPage={pageSlug} />,
        stamps: <VisitedStamps currentPage={pageSlug} />,
        saved: <SavedSharks />
    };


    return (
        <>
            {/* This part is invisible when closed */}
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
                        {/* Logs, sections, etc go here */}
                        {SECTION_COMPONENTS[activeSection]}
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
        </>
    );
}

export default Logbook;

