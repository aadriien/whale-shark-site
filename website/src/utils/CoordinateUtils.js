import coordinatesData from '../assets/data/json/gbif_shark_tracking.json';


export function getCoordinates(sharkDict, limit = Infinity) {
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
    };
  });
};


export function getAllCoordinates() {
    let fullResult = [];
    const limitResults = 25;

    coordinatesData.forEach(sharkDict => {
        let currResult = getCoordinates(sharkDict, limitResults);
        fullResult.push(...currResult);
    })
    return fullResult;
};


export function getGroupCoordinates(allSharkIDs) {
    let groupResult = [];
    const limitResults = 1000;

    // If no IDs provided, plot nothing
    if (!allSharkIDs) {
        return [];
    }

    coordinatesData.forEach(sharkDict => {
        if (allSharkIDs.includes(sharkDict.whaleSharkID)) {
            let currResult = getCoordinates(sharkDict, limitResults);
            groupResult.push(...currResult); 
        }
    });
    return groupResult;
};


export function getSharkCoordinates(sharkID) {
    if (!sharkID) return [];

    const sharkDict = coordinatesData.find(
        shark => shark.whaleSharkID == sharkID
    );
    return getCoordinates(sharkDict);
};


// Filter coordinates by month & year
export function filterCoordinatesByDate(coordinates, month, year) {
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
export function getGroupCoordinatesByTimeline(allSharkIDs, month, year) {
    if (!allSharkIDs) return [];
    
    let groupResult = [];
    const limitResults = 300;

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

