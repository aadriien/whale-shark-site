/* Shark data types */

// Applicable for data in `gbif_story_shark_images.json` 
export type WhaleSharkEntryLLM = {
    whaleSharkID: string;
    
    "LLM-Gen Image (API)": string;
    "LLM-Gen Name (gemma:2b local)": string;
    "LLM-Gen Name (openai API)": string;
    
    "Total Occurrences": number;
    "Oldest Occurrence": string; // date string
    "Newest Occurrence": string; // date string
    
    HUMAN_OBSERVATION: number;
    MACHINE_OBSERVATION: number;
    
    sex: string;
    
    "lifeStage (year)": string;
    "country (year)": string;
    "stateProvince - verbatimLocality (month year)": string;
    
    "occurrenceRemarks (eventDate)": string;
    "lat:decimalLatitude long:decimalLongitude (eventDate)": string;
    
    "imageURL (license, creator)": string;
};

export type WhaleSharkDatasetLLM = WhaleSharkEntryLLM[];


// Applicable for data in `gbif_individual_sharks_stats.json` 
export type WhaleSharkEntryRegular = {
    whaleSharkID: string;
    
    "Total Occurrences": number;
    
    organismID: string;
    identificationID: string;
    
    "Oldest Occurrence": string; // date string
    "Newest Occurrence": string; // date string
    
    HUMAN_OBSERVATION: number;
    MACHINE_OBSERVATION: number;
    
    sex: string;
    
    "lifeStage (year)": string;
    "continent (year)": string;
    "publishingCountry (year)": string;
    "country (year)": string;
    "stateProvince - verbatimLocality (month year)": string;
    
    "occurrenceRemarks (eventDate)": string;
    "lat:decimalLatitude long:decimalLongitude (eventDate)": string;
    
    "imageURL (license, creator)": string;
};

export type WhaleSharkDatasetRegular = WhaleSharkEntryRegular[];


// Applicable for data in `gbif_shark_tracking.json` 
export type CoordinatePoint = {
    lat: number;
    long: number;
    region?: string;
    eventDate?: string; // date string
    parsedDate?: string; // date string
};

export type WhaleSharkCoordinates = {
    whaleSharkID: string;
    coordinates?: CoordinatePoint[];
};

export type WhaleSharkCoordinateDataset = WhaleSharkCoordinates[];


// Applicable after string mapping for field names 
// Works for both datasets (LLM + regular), hence optional fields
export type WhaleSharkEntryNormalized = {
    id: string;

    occurrences: number;

    oldest: string;
    newest: string;

    human: number;
    machine: number;

    sex?: string;
    lifeStage?: string;

    continent?: string;
    countries?: string;
    publishing?: string;
    regions?: string;

    months?: string[];

    remarks?: string;
    image?: string;

    cartoonImageURL?: string;
    name?: string;
    gemmaName?: string;
};

export type WhaleSharkDatasetNormalized = WhaleSharkEntryNormalized[];


export type SavedSharkIDs = Set<string>;

export type CondensedGridProps = {
    saved: SavedSharkIDs;
};


export type SharkBannerProps = {
    shark: WhaleSharkEntryNormalized;
};


