import { pageContent } from "./LogbookContent.ts";

import { PageContent } from "../../types/constants.ts";


type PageOverviewProps = {
    // Ensure only valid keys are allowed
    currentPage: keyof PageContent; 
};


function PageOverview ({ currentPage }: PageOverviewProps) {
    const pageOverviewFAQs = pageContent[currentPage];

    return (
        <div className="logbook-section page-overview">
            <div className="overview-box">
                <p>{pageOverviewFAQs.overview}</p>
            </div>
        </div>
    );
} 

export default PageOverview;

