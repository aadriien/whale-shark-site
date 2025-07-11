import coordinatesData from '../assets/data/json/gbif_shark_tracking.json';


export function getCoordinates(sharkDict, limit = Infinity) {
  if (!sharkDict) return [];

  // Grab the last N points per shark (if you grab everything, then globe laggy)
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
    const limitResults = 5;

    coordinatesData.forEach(sharkDict => {
        let currResult = getCoordinates(sharkDict, limitResults);
        fullResult.push(...currResult);
    })
    return fullResult;
};


export function getSharkCoordinates(sharkID) {
    if (!sharkID) return [];

    const sharkDict = coordinatesData.find(
        shark => shark.whaleSharkID == sharkID
    );
    return getCoordinates(sharkDict);
};

