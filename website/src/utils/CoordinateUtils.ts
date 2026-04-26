import coordinatesData from "../assets/data/json/gbif_shark_tracking.json";

import { WhaleSharkCoordinates, PlottedCoordinatePoint } from "types/coordinates";


// Target total rendered points to keep Three.js globe performant regardless of group size
const POINT_BUDGET = 3000;
const MAX_POINTS_PER_SHARK = 500;

// Per-shark cap used when total available points exceed the budget
function scalePointsPerShark(sharkCount: number): number {
    if (sharkCount <= 0) return MAX_POINTS_PER_SHARK;
    // Math.max(1, ...) guards against slice(-0), which returns the full array
    return Math.max(
        1, 
        Math.min(
            MAX_POINTS_PER_SHARK, 
            Math.floor(10 * POINT_BUDGET / sharkCount)
        )
    );
}

// Count-only passes to check budget without instantiating point objects
function countAllCoordinates(): number {
    return coordinatesData.reduce(
        (sum, s) => sum + s.coordinates.length, 
        0
    );
}

function countGroupCoordinates(allSharkIDs: string[]): number {
    return coordinatesData
        .filter(s => allSharkIDs.includes(s.whaleSharkID))
        .reduce((sum, s) => sum + s.coordinates.length, 0);
}


export function getCoordinates(
    sharkDict: WhaleSharkCoordinates, 
    limit: number = Infinity
) {
  if (!sharkDict) return [];

  // Grab last N points per shark (if you grab everything, then globe laggy)
  const coords = sharkDict.coordinates.slice(-limit); 

  return coords.map(coord => {
    // Randomize delay in ring propagation
    const baseDelay = Math.random() * 2000;

    return {
        id: `${sharkDict.whaleSharkID}-${coord.lat}-${coord.long}`,
        lat: coord.lat,
        lng: coord.long,
        date: coord.eventDate,
        size: 1,  
        ringMaxSize: 3,
        ringPropagationSpeed: 0.7,
        ringRepeatPeriod: 2000 + baseDelay,
    } as PlottedCoordinatePoint;
  });
};


export function getAllCoordinates() {
    const totalAvailable = countAllCoordinates();
    const limitResults = totalAvailable <= POINT_BUDGET
        ? Infinity
        : scalePointsPerShark(coordinatesData.length);

    let fullResult: PlottedCoordinatePoint[] = [];
    coordinatesData.forEach(sharkDict => {
        fullResult.push(...getCoordinates(sharkDict, limitResults));
    });
    return fullResult;
};


export function getGroupCoordinates(allSharkIDs: string[]) {
    // If no IDs provided, plot nothing
    if (!allSharkIDs) return [];

    const totalAvailable = countGroupCoordinates(allSharkIDs);
    const limitResults = totalAvailable <= POINT_BUDGET
        ? Infinity
        : scalePointsPerShark(allSharkIDs.length);

    let groupResult: PlottedCoordinatePoint[] = [];
    coordinatesData.forEach(sharkDict => {
        if (allSharkIDs.includes(sharkDict.whaleSharkID)) {
            groupResult.push(...getCoordinates(sharkDict, limitResults));
        }
    });
    return groupResult;
};


export function getSharkCoordinates(sharkID: string) {
    if (!sharkID) return [];

    const sharkDict = coordinatesData.find(
        shark => shark.whaleSharkID == sharkID
    );
    return getCoordinates(sharkDict);
};


// Filter coordinates by month & year
export function filterCoordinatesByDate(
    coordinates: PlottedCoordinatePoint[], 
    month: number, 
    year: number
) {
    if (!coordinates || coordinates.length === 0) return [];
    
    return coordinates.filter(coord => {
        if (!coord.date) return false;
        
        const coordDate = new Date(coord.date);
        if (isNaN(coordDate.getTime())) return false;
        
        const coordMonth = coordDate.getMonth() + 1; // getMonth() returns 0-11
        const coordYear = coordDate.getFullYear();
        
        return coordMonth === month && coordYear === year;
    });
}


// Get group coordinates filtered by timeline
export function getGroupCoordinatesByTimeline(
    allSharkIDs: string[], 
    month: number, 
    year: number
) {
    if (!allSharkIDs) return [];
    
    const totalAvailable = countGroupCoordinates(allSharkIDs);
    const limitResults = totalAvailable <= POINT_BUDGET
        ? Infinity
        : scalePointsPerShark(allSharkIDs.length);

    let groupResult: PlottedCoordinatePoint[] = [];

    coordinatesData.forEach(sharkDict => {
        if (allSharkIDs.includes(sharkDict.whaleSharkID)) {
            let currResult = getCoordinates(sharkDict, limitResults);
            
            // Filter by timeline if month & year provided
            if (month && year) {
                currResult = filterCoordinatesByDate(currResult, month, year);
            }

            groupResult.push(...currResult);
        }
    });
    return groupResult;
}

