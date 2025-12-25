/* Helper logbook types */

import { SetStateAction } from "react";

export type Page = { 
    label: string; 
    path: string; 
};

// Note that `Record<string, Page>` is equivalent to `[key: string]: Page`
export type PageMap = Record<string, Page>;

export type FAQ = { 
    q: string; 
    a: string; 
};

export type PageContent = Record<string, {
    overview: string;
    faqs: FAQ[];
}>;

export type PageContentProps = {
    // Ensure only valid keys are allowed (+ enforce type string)
    currentPage: Extract<keyof PageContent, string>; 
};


export type FavoriteButtonProps = { 
    sharkId: string; 
    className?: string; 
};


export type LogbookProps = {
    setIsLogbookOpen: React.Dispatch<React.SetStateAction<boolean>>;
};



