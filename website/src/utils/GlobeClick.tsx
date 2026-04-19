import { useRef, useEffect } from "react";

import { UseGlobeClickProps, SharkClickProps } from "../types/globes";
import { WhaleSharkDatasetNormalized } from "../types/sharks";
import { PlottedCoordinatePoint } from "../types/coordinates";


export function useGlobeClick({ 
    sharks, 
    pointsData, 
    allSharksVisible, 
    onSharkSelect 
}: UseGlobeClickProps) {
    // Use refs to always have current values 
    const sharksRef = useRef<WhaleSharkDatasetNormalized>(sharks);
    const pointsDataRef = useRef<PlottedCoordinatePoint[]>(pointsData);
    const allSharksVisibleRef = useRef<boolean>(allSharksVisible);
    const onSharkSelectRef = useRef(onSharkSelect);
    
    // Update refs whenever props change
    useEffect(() => {
        sharksRef.current = sharks;
        pointsDataRef.current = pointsData;
        allSharksVisibleRef.current = allSharksVisible;
        onSharkSelectRef.current = onSharkSelect;
    });
    
    const handleSelectShark = (arg: SharkClickProps | string) => {
        // Check if arg is object (from globe click) or string (from dropdown)
        if (typeof arg === "object" && arg.lat !== undefined && arg.lng !== undefined) {
            if (!allSharksVisibleRef.current) {
                console.log("Ignoring click because not all sharks are visible.");
                return;
            }
            
            const { lat, lng } = arg;
            console.log("Clicked at lat/lng:", lat, lng);
            
            const tolerance = 3.0;
            const found = pointsDataRef.current.find(s => {
                const dLat = Math.abs(s.lat - lat);
                const dLng = Math.abs(s.lng - lng);

                return dLat < tolerance && dLng < tolerance;
            });
    
            if (found) {
                const cleanID = found.id.split("-")[0];
                console.log("Matched shark:", found.id, " with ID: ", cleanID);

                const foundShark = sharksRef.current.find(shark => shark.id === cleanID);

                console.log("Sending shark object:", foundShark);
                onSharkSelectRef.current(foundShark);
            }
            else {
                console.log("No nearby shark found.");
                onSharkSelectRef.current(null);
            }
        } 
        else {
            // Coming from dropdown (arg = sharkId or null)
            const foundShark = sharksRef.current.find(shark => shark.id === arg);
            onSharkSelectRef.current(foundShark);
        }
    };

    return handleSelectShark;
}

export default useGlobeClick;
  
