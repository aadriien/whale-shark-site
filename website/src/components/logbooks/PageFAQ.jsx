import { useState } from "react";

import { pageContent } from "./LogbookContent.js";


function PageFAQ({ currentPage }) {
    const pageOverviewFAQs = pageContent[currentPage];
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (idx) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <div className="logbook-section page-faq">
            <div className="faqBox">
                {pageOverviewFAQs.faqs.map(({ q, a }, idx) => (
                    <div key={idx} className={`faqItem ${openIndex === idx ? "open" : ""}`}>
                        <button
                            className="faq-toggle"
                            onClick={() => toggleFAQ(idx)}
                            aria-expanded={openIndex === idx}
                        >
                            {q}
                        </button>
                        <div className="faq-answer-container">
                            <p className="faq-answer">{a}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PageFAQ;
