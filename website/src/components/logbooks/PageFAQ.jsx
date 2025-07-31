import { pageContent } from "./LogbookContent.js";


function PageFAQ ({ currentPage }) {
    const pageOverviewFAQs = pageContent[currentPage];

    return (
        <div className="logbook-section page-faq">            
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
