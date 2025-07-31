import { pageMap, pageContent } from "./LogbookContent.js";


function PageOverview ({ currentPage }) {
    const pageLabelPath = pageMap[currentPage];
    const pageOverviewFAQs = pageContent[currentPage];

    return (
        <div className="logbook-section page-overview">
            <p>Welcome to the <span className="logbook-page-name">{pageLabelPath.label}</span> page!</p>

            <br/>

            <div>
                <p>{pageOverviewFAQs.overview}</p>
            </div>
        </div>
    );
} 

export default PageOverview;
