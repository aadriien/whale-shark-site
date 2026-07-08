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

export type MatchGroup = {
    id: string;
    sharkIds: string[];
    name?: string;
};

export type MatchedSharkIDs = Set<string>;

// What groupDisplayLabel needs to build a label. Satisfied by a real
// MatchGroup, or by a consolidated shark's { groupName, memberIds }
export type NamedSharkGroup = {
    name?: string;
    sharkIds: string[];
};

export type MatchButtonProps = {
    querySharkId: string;
    matchedSharkId: string;
    className?: string;
};

export type MatchGroupNotesProps = {
    group: MatchGroup;
};

export type MatchRemoveButtonProps = {
    sharkId: string;
    onRemove: (sharkId: string) => void;
};

export type MatchMoveSelectProps = {
    sharkId: string;
    otherGroups: MatchGroup[];
    onMove: (sharkId: string, targetGroupId: string) => void;
};

export type LogbookProps = {
    setIsLogbookOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
