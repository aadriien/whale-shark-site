import { pageMap, pageContent } from "./LogbookContent.js";


function PageFAQ ({ currentPage }) {
    const pageLabelPath = pageMap[currentPage];
    const pageOverviewFAQs = pageContent[currentPage];

    return (
        <div className="logbook-section page-faq">
            <p>Welcome to the <span className="logbook-page-name">{pageLabelPath.label}</span> page!</p>

            <br/>
            
            <div>
                {pageOverviewFAQs.faqs.map(({ q, a }, idx) => {
                    return (
                        <div key={idx}>
                            <p>{q}</p>
                            <p>{a}</p>
                            <br/>
                        </div>
                    );
                })}
            </div>

        </div>
    );
} 

export default PageFAQ;
