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


