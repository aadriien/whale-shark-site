import { useCallback } from "react";


export function useGlobeClick({ 
    sharks, 
    pointsData, 
    allSharksVisible, 
    onSharkSelect 
}) {
    const handleSelectShark = useCallback((arg) => {
        // Check if arg is object (from globe click) or string (from dropdown)
        if (typeof arg === "object" && arg.lat !== undefined && arg.lng !== undefined) {
            if (!allSharksVisible) {
                console.log("Ignoring click because not all sharks are visible.");
                return;
            }
            
            const { lat, lng } = arg;
            console.log("Clicked at lat/lng:", lat, lng);
            
            const tolerance = 3.0;
            const found = pointsData.find(s => {
                const dLat = Math.abs(s.lat - lat);
                const dLng = Math.abs(s.lng - lng);

                return dLat < tolerance && dLng < tolerance;
            });
    
            if (found) {
                const cleanID = found.id.split("-")[0];
                console.log("Matched shark:", found.id, " with ID: ", cleanID);

                // Using "==" instead of "===" in case different types for ID
                const foundShark = sharks.find(shark => shark.id == cleanID) || null;

                console.log("Sending shark object:", foundShark);
                onSharkSelect(foundShark);
            } 
            else {
                console.log("No nearby shark found.");
                onSharkSelect(null);
            }
        } 
        else {
            // Coming from dropdown (arg = sharkId or null)
            const foundShark = sharks.find(shark => shark.id == arg) || null;
            onSharkSelect(foundShark);
        }
    }, [sharks, pointsData, allSharksVisible, onSharkSelect]);

    return handleSelectShark;
}

export default useGlobeClick;
  
