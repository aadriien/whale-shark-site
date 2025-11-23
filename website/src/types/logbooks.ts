/* Helper logbook types */

export type Page = { 
    label: string; 
    path: string 
};

export type PageMap = { 
    [key: string]: Page 
};

export type FAQ = { 
    q: string; 
    a: string 
};

export type PageContent = {
    [key: string]: {
        overview: string;
        faqs: FAQ[];
    };
};

export type PageContentProps = {
    // Ensure only valid keys are allowed (+ enforce type string)
    currentPage: Extract<keyof PageContent, string>; 
};



