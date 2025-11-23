import { useState } from "react";

import { FAQ } from "../../types/logbooks.ts";


const faqs = [
    { 
        q: "Are whale sharks dangerous?", 
        a: "No, they're harmless filter feeders." 
    },
    { 
        q: "How long do they live?", 
        a: "70-100 years in the wild." 
    },
];


const FAQAccordion = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    
    return (
        <section className="faq-accordion">
            <h2>FAQs</h2>

            <div className="faq-list">
                {faqs.map(({ q, a }: FAQ, index: number) => (
                    <div key={index} className="faq-item">
                        <button onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                            {q}
                        </button>
                            {openIndex === index && <p>{a}</p>}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FAQAccordion;

        