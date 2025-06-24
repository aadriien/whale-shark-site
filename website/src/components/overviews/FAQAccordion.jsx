import { useState } from "react";

const faqs = [
    { 
        question: "Are whale sharks dangerous?", 
        answer: "No, they're harmless filter feeders." 
    },
    { 
        question: "How long do they live?", 
        answer: "70-100 years in the wild." 
    },
];

const FAQAccordion = () => {
    const [openIndex, setOpenIndex] = useState(null);
    
    return (
        <section className="faq-accordion">
            <h2>FAQs</h2>

            <div className="faq-list">
                {faqs.map((item, index) => (
                    <div key={index} className="faq-item">
                        <button onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                            {item.question}
                        </button>
                            {openIndex === index && <p>{item.answer}</p>}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FAQAccordion;

        