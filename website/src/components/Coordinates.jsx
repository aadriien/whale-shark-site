import coordinatesData from '../assets/data/gbif_shark_tracking.json';


const getCoordinates = () => {
  // TEST with specific whale shark to start ("Karla")
  const shark = coordinatesData.find(shark => shark.whaleSharkID == "Karla");

  if (!shark) return [];

  return shark.coordinates.map(coord => {
    // Randomize delay in ring propagation
    const baseDelay = Math.random() * 2000;

    return {
      id: `${coord.whaleSharkID}-${coord.lat}-${coord.long}`,
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

export default getCoordinates;
