import { pageMap, pageContent } from "./LogbookContent.js";


function PageOverview ({ currentPage }) {
    const pageLabelPath = pageMap[currentPage];
    const pageOverviewFAQs = pageContent[currentPage];

    return (
        <div className="logbook-section page-overview">
            <h4>Welcome to the <span className="logbook-page-name">{pageLabelPath.label}</span> page!</h4>

            <div className="overview-box">
                <p>{pageOverviewFAQs.overview}</p>
            </div>
        </div>
    );
} 

export default PageOverview;
