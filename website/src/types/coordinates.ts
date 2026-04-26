/* Coordinates types */

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


export type PlottedCoordinatePoint = {
    id: string;
    lat: number;
    lng: number;
    date: string; // date string
    size: number;
    ringMaxSize: number;
    ringPropagationSpeed: number;
    ringRepeatPeriod: number;
};


// Base type for grid-based Copernicus marine data 
// (lat/lng always present, extra fields vary by dataset)
export type OceanGridPoint = {
    lat: number;
    lng: number;
    [field: string]: number;
};

// Applicable for Copernicus chlorophyll CSV data (global_{YYYY}_chlorophyll.csv)
export type ChlorophyllGridPoint = {
    lat: number;
    lng: number;
    meanCHL: number;
};

