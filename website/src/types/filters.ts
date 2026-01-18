/* Filter types */

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

export type SharkMatchFields = {
  hasMatchedImages: boolean;
  miewidDistanceRange: [number, number];
  showOnlyConfidentMatches: boolean;
  plausibility: string;
};

export type SharkMatchCriteria = SharkBaseCriteria & SharkMatchFields;

export type SharkCriteria = SharkBaseCriteria & Partial<SharkMatchFields>;


export type SharkFilterOptions = {
    countries: string[];
    publishingCountries?: string[];

    minYear: number;
    maxYear: number;
    months: string[];

    minRecords?: number;
    maxRecords?: number;
};


export type BaseFilterProps = {
    criteria: SharkCriteria;
    onChange: React.Dispatch<React.SetStateAction<SharkCriteria>>;
};

export type LocationFilterProps = BaseFilterProps & {
    countries: string[];
    publishingCountries?: string[];
};

export type TimeFilterProps = BaseFilterProps & {
    minYear: number;
    maxYear: number;
    months: string[];
};

export type MetadataFilterProps = BaseFilterProps & {
    minRecords: number;
    maxRecords: number;
};

export type SharkFilterProps = BaseFilterProps & {
    options: SharkFilterOptions;
};


