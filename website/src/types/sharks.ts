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

    identificationID: string | null;
    occurrenceID: string;

    key: number;
    image_id: number;

    decimalLatitude: number | null;
    decimalLongitude: number | null;

    eventDate: string; // date string

    "Oldest Occurrence": string; // date string
    "Newest Occurrence": string; // date string

    "country (year)": string;
    "stateProvince - verbatimLocality (month year)": string;

    matched_shark_id: string | null;
    matched_image_id: number | null;

    match_distance: number | null;

    matched_shark_id_ningaloo: string | null;
    matched_image_id_ningaloo: number | null;

    match_distance_ningaloo: number | null;

    matched_decimalLatitude?: number | null;
    matched_decimalLongitude?: number | null;

    matched_eventDate?: string | null; // date string

    distance_km?: number | null;
    days_between?: number | null;
    implied_speed_km_per_day?: number | null;

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

    miewid_gbif_closest_whale_shark_id: string;
    miewid_gbif_matched_image_id: number;
    miewid_gbif_matched_annotation_id: number;
    miewid_gbif_distance: number;

    miewid_ningaloo_closest_whale_shark_id: string;
    miewid_ningaloo_matched_image_id: number;
    miewid_ningaloo_matched_annotation_id: number;
    miewid_ningaloo_distance: number;

    dinov2_gbif_closest_whale_shark_id: string;
    dinov2_gbif_matched_image_id: number;
    dinov2_gbif_matched_annotation_id: number;
    dinov2_gbif_distance: number;

    dinov2_ningaloo_closest_whale_shark_id: string;
    dinov2_ningaloo_matched_image_id: number;
    dinov2_ningaloo_matched_annotation_id: number;
    dinov2_ningaloo_distance: number;
};

export type WhaleSharkDatasetMedia = WhaleSharkMediaEntry[];

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

    monthsToYears?: Record<string, number[]>;

    remarks?: string;
    image?: string;

    // LLM fields
    cartoonImageURL?: string;
    name?: string;
    gemmaName?: string;

    // CV fields
    occurrenceID?: string;
    image_id?: number;
    identifier_url?: string;

    matched_shark_id?: string;
    matched_image_id?: number;

    miewid_match_distance?: number;

    matched_shark_id_ningaloo?: string;
    matched_image_id_ningaloo?: number;

    miewid_match_distance_ningaloo?: number;

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
    imageUrl?: string;
    onImageClick?: () => void;
};

export type IndividualSharkOrNullProps = {
    shark: WhaleSharkEntryNormalized | null;
};

export type ImageMetadata = {
    url: string;
    license?: string;
    creator?: string;
};

export type ImagesWithMetadata = ImageMetadata[];

// A single parsed "Places Visited" timeline row for 1 shark record
export type SharkTimelineEntry = {
    header: string;
    date: string;
    region: string;
    publishing: string;
    remarks: string;
};
