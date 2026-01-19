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


// Applicable for data in `GBIF_shark_image_occurrences_validated.json` 
export type WhaleSharkEntryVision = {
    whaleSharkID: string;
        
    identificationID: string;
    occurrenceID: string;

    key: number;
    image_id: number;

    decimalLatitude: number;
    decimalLongitude: number;

    eventDate: string; // date string
    
    "Oldest Occurrence": string; // date string
    "Newest Occurrence": string; // date string

    "country (year)": string;
    "stateProvince - verbatimLocality (month year)": string;

    matched_shark_id: string;
    matched_image_id: number;

    match_distance: number;

    matched_decimalLatitude?: number;
    matched_decimalLongitude?: number;

    matched_eventDate?: string; // date string

    distance_km?: number;
    days_between?: number;
    implied_speed_km_per_day?: number;

    plausibility: string;
};

export type WhaleSharkDatasetVision = WhaleSharkEntryVision[];


// Applicable for data in `GBIF_media_matches.json` 
export type WhaleSharkMediaEntry = {
    image_id: number;
    key: number;

    occurrenceID: string;
    identificationID: string;

    format: string;
    references: string;
    identifier: string;

    miewid_closest_whale_shark_id: string;
    miewid_matched_image_id: number;
    miewid_matched_annotation_id: number;
    miewid_distance: number;

    dinov2_closest_whale_shark_id: string;
    dinov2_matched_image_id: number;
    dinov2_matched_annotation_id: number;
    dinov2_distance: number;
};

export type WhaleSharkDatasetMedia = WhaleSharkMediaEntry[];


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

    // LLM fields
    cartoonImageURL?: string;
    name?: string;
    gemmaName?: string;

    // CV fields    
    occurrenceID?: string;
    image_id?: number;

    matched_shark_id?: string;
    matched_image_id?: number;

    miewid_match_distance?: number;

    distance_km?: number;
    days_between?: number;
    implied_speed_km_per_day?: number;

    plausibility?: string;
};

export type WhaleSharkDatasetNormalized = WhaleSharkEntryNormalized[];


export type SavedSharkIDs = Set<string>;

export type CondensedGridProps = {
    saved: SavedSharkIDs;
};


export type IndividualSharkProps = {
    shark: WhaleSharkEntryNormalized;
};


