import { pageMap, pageContent } from "./LogbookContent.js";


function PageFAQ ({ currentPage }) {
    const pageLabelPath = pageMap[currentPage];
    const pageOverviewFAQs = pageContent[currentPage];

    return (
        <div className="logbook-section page-faq">
            <h4>Welcome to the <span className="logbook-page-name">{pageLabelPath.label}</span> page!</h4>
            
            <div className="faqBox">
                {pageOverviewFAQs.faqs.map(({ q, a }, idx) => {
                    return (
                        <div key={idx} className="faqItem">
                            <p className="faq-question">{q}</p>
                            <p className="faq-answer">{a}</p>
                        </div>
                    );
                })}
            </div>

        </div>
    );
} 

export default PageFAQ;
