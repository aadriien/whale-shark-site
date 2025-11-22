import { useState } from "react";

import { pageContent } from "./LogbookContent.ts";
import { FAQ, PageContentProps } from "../../types/logbooks.ts";


function PageFAQ({ currentPage }: PageContentProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    
    const pageOverviewFAQs = pageContent[currentPage];

    const toggleFAQ = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <div className="logbook-section page-faq">
            <div className="faqBox">
                {pageOverviewFAQs.faqs.map(({ q, a }: FAQ, idx: number) => (
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

