import { pageContent } from "./LogbookContent.ts";

import { PageContentProps } from "../../types/logbooks.ts";


function PageOverview ({ currentPage }: PageContentProps) {
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

