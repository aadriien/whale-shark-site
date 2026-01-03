/* Filter data types */

export type SharkBaseCriteria = {
    country: string;
    publishingCountry: string;

    yearRange: [string, string];
    month: string;

    sex: string;
    lifeStage: string;

    minRecords: number;
    observationType: string;

    showOnlyWithMedia: boolean;
    hasOccurrenceNotes: boolean;
};

export type SharkMatchCriteria = SharkBaseCriteria & {
    hasMatchedImages: boolean;
    miewidDistanceRange: [number, number];

    showOnlyConfidentMatches: boolean;
    plausibility: string;
};

export type SharkCriteria = SharkBaseCriteria | SharkMatchCriteria;


