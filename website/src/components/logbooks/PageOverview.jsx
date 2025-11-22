import { pageContent } from "./LogbookContent.ts";


function PageOverview ({ currentPage }) {
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
