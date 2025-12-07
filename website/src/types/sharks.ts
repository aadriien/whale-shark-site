/* Shark data types */

export type WhaleSharkEntryLLM = {
    whaleSharkID: string;
    
    // GenAI stuff relevant for gbif_story_shark_images.json 
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


export type CoordinatePoint = {
    lat: number;
    long: number;
    region: string;
    eventDate: string; // date string
    parsedDate: string; // date string
};

export type WhaleSharkCoordinates = {
    whaleSharkID: string;
    coordinates: CoordinatePoint[];
};

export type WhaleSharkCoordinateDataset = WhaleSharkCoordinates[];


