import React from "react";

/* Helper logbook types */

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

export type PageContent = Record<
    string,
    {
        overview: string;
        faqs: FAQ[];
    }
>;

export type PageContentProps = {
    // Ensure only valid keys are allowed (+ enforce type string)
    currentPage: Extract<keyof PageContent, string>;
};

export type FavoriteButtonProps = {
    sharkId: string;
    className?: string;
};

// Matches are undirected, i.e. "A matches B" == "B matches A"
export type MatchedPair = {
    sharkIdA: string;
    sharkIdB: string;
};

export type MatchButtonProps = {
    querySharkId: string;
    matchedSharkId: string;
    className?: string;
};

export type MatchGroupNotesProps = {
    sharkIds: string[];
};

export type LogbookProps = {
    setIsLogbookOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
