import { useEffect, useState } from "react";


type StatusIUCN = {
    category: string;
    code: string;
}


const speciesName: string = "rhincodon typus";

const urlBase: string = `https://api.gbif.org/v1/species`;

const speciesMatchEndpoint: string = `match`;
const IUCNredListEndpoint: string = `iucnRedListCategory`;


const statusColors: Record<string, string> = {
    // Full names (uppercase)
    "LEAST CONCERN": "green",
    "NEAR THREATENED": "yellowgreen",
    "VULNERABLE": "orange",
    "ENDANGERED": "red",
    "CRITICALLY ENDANGERED": "darkred",
    "EXTINCT": "black",
    "DATA DEFICIENT": "gray",
    "NOT EVALUATED": "lightgray",
  
    // Abbreviations (codes)
    "LC": "green",
    "NT": "yellowgreen",
    "VU": "orange",
    "EN": "red",
    "CR": "darkred",
    "EX": "black",
    "DD": "gray",
    "NE": "lightgray",
};


async function getSpeciesKey(name: string = speciesName) {
    const queryParams = new URLSearchParams({ name }); 
    const url = `${urlBase}/${speciesMatchEndpoint}?${queryParams.toString()}`;
    // console.log("Querying GBIF to retrieve species key: ", url);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorText}`
            );
        }
        
        const data = await response.json();
        return data.usageKey || "(not found)";

    } catch (error) {
        console.error("Error retrieving species key: ", error);
        return "(error)";
    }
}


async function getRedListIUCN() {
    // Fall back on known status when GBIF has CORS issues
    const defaultStatus: StatusIUCN = {
        category: "ENDANGERED",
        code: "EN",
    };

    const keyStr = await getSpeciesKey();
    const usageKey = parseInt(keyStr, 10);

    const url = `${urlBase}/${usageKey}/${IUCNredListEndpoint}`;
    // console.log("Querying GBIF to retrieve IUCN Red List status: ", url);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorText}`
            );
        }
        
        const data = await response.json();
        return {
            category: data.category || defaultStatus.category,
            code: data.code || defaultStatus.code,
        };

    } catch (error) {
        console.error("Error retrieving IUCN Red List status: ", error);
        return defaultStatus;
    }
}


const ConservationStatus = () => {
    const [redListStatus, setRedListStatus] = useState<string>("(loading)");
    const [statusColor, setStatusColor] = useState<string>("lightgray");
    
    useEffect(() => {
        getRedListIUCN().then(({ category, code }) => {
            const statusString = `${category} (${code})`;
            setRedListStatus(statusString);

            setStatusColor(statusColors[category.toUpperCase()] || "lightgray");
        });
    }, []);
    
    return (
        <section className="conservation-status">
            <h2>Whale Shark Conservation</h2>

            <p>IUCN Red List Status: <strong style={{ color: statusColor }}>{redListStatus}</strong></p>

            <p>[Explain threats like overfishing, boat strikes, etc.]</p>
        
        
        </section>
    );
};
    
export default ConservationStatus;

        