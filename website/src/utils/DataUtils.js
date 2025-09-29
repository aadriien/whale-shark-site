import { getCode } from "country-list";

import storySharkOptions from "../assets/data/json/gbif_story_sharks_named.json";
import selectedStorySharks from "../assets/data/json/gbif_story_shark_images.json";
import hasMediaSharks from "../assets/data/json/gbif_media_sharks.json";
import allSharkData from "../assets/data/json/gbif_individual_sharks_stats.json";

import coordinatesData from '../assets/data/json/gbif_shark_tracking.json';


export const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const FULLMONTHS = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];


const sharksOfInterest = [
    "101373b", // total: 5 --> Male Adult --> Belize (2011), Guatemala (2011), Honduras (2011), Trinidad and Tobago (2011)
    "101376a", // total: 11 --> Male Adult --> Colombia (2011), Cuba (2010), Mexico (2010), Mexico (year Unknown), Nicaragua (2011), United States (2010)
    "57829", // total: 12 --> Male Adult --> Australia (2019), Australia (year Unknown), Indonesia (2018)
    "101373a", // total: 21 --> Male Adult --> Bahamas (2010), Canada (2010), Cuba (2010), Mexico (2010), Mexico (year Unknown), United States (2010), United States (year Unknown)
    "Ranger", // total: 25 --> Unknown Unknown --> Ecuador (2011), Ecuador (2015), Peru (2016)
    "101371a", // total: 28 --> Female Juvenile --> Bahamas (2010), Bahamas (2011), Cuba (2010), Mexico (2010), Mexico (year Unknown), United States (2010), United States (2011), United States (year Unknown)
    "57828", // total: 29 --> Male Subadult --> Australia (2018), Australia (year Unknown), Indonesia (2018), Indonesia (year Unknown)
    "112470", // total: 31 --> Male Subadult --> Mexico (2013), Mexico (year Unknown), United States (2013), United States (year Unknown)
    "57821", // total: 35 --> Female Subadult --> Australia (year Unknown), Christmas Island (2018), Cocos (Keeling) Islands (2018)
    "George", // total: 106 --> Unknown Unknown --> Colombia (2015), Ecuador (2015), Ecuador (2016)
]

const selectedSharkIDs = [
    "101376a",
    "101373a",
    "Ranger",
    "101371a",
    "57828",
    "57821",
]

const keyMap = {
    "whaleSharkID": "id",
    "LLM-Gen Image (API)": "cartoonImageURL",
    "LLM-Gen Name (openai API)": "name",
    "LLM-Gen Name (gemma:2b local)": "gemmaName",
    "Total Occurrences": "occurrences",
    "Oldest Occurrence": "oldest",
    "Newest Occurrence": "newest",
    "HUMAN_OBSERVATION": "human",
    "MACHINE_OBSERVATION": "machine",
    "lifeStage (year)": "lifeStage",
    "country (year)": "countries",
    "stateProvince - verbatimLocality (month year)": "regions",
};

const keyMapHasMedia = {
    "whaleSharkID": "id",
    "Total Occurrences": "occurrences",
    "Oldest Occurrence": "oldest",
    "Newest Occurrence": "newest",
    "HUMAN_OBSERVATION": "human",
    "MACHINE_OBSERVATION": "machine",
    "lifeStage (year)": "lifeStage",
    "continent (year)": "continent",
    "publishingCountry (year)": "publishing",
    "country (year)": "countries",
    "stateProvince - verbatimLocality (month year)": "regions",
    "occurrenceRemarks (eventDate)": "remarks",
    "imageURL (license, creator)": "image",
};


const storySharksRaw = selectedStorySharks.filter(
    shark => selectedSharkIDs.includes(shark.whaleSharkID)
);

export const storySharks = storySharksRaw.map(obj => formatKeyVals(obj, keyMap));
export const mediaSharks = allSharkData.map(obj => formatKeyVals(obj, keyMapHasMedia));


export function cleanLifestage(obj) {
    const rawLifeStage = obj.lifeStage;
  
    const cleanedLifeStage =
        rawLifeStage
            ?.split(",")
            .map(stage => stage.trim())
            .find(stage => !stage.toLowerCase().startsWith("unknown"))
            ?.replace(/\s*\(\d{4}\)/, "") || "Unknown";
  
    return cleanedLifeStage;
}


export function extractContinents(continent) {
    if (!continent) return [];
    
    const continents = continent
        .split(",")
        .map(c => c.trim().replace(/\s*\(.*?\)/, "")) // Remove dates in parentheses
        .map(c => {
            const parts = c.split(" ");
            if (parts[0] === "North" || parts[0] === "South") return parts[0] + " America";
            return c;
        });
        
    // Remove duplicate continents before returning
    return [...new Set(continents)];
}


export function getCountryCode(countryName) {
    const trimmed = countryName.trim();
    const code = getCode(trimmed);

    return code ? code.toLowerCase() : null;
};  


export function getDate(region = "") {
    // Match text inside parentheses
    const match = region.match(/\(([^)]+)\)/); 
    return match ? match[1] : "Unknown";
}


export function parseSpecificRegion(regionEntry = "") {
    // Everything before the date
    const match = regionEntry.match(/^(.+?)\s*\([^)]*\)$/); 
    return match ? match[1].trim() : regionEntry;
}


export function parseRemarks(str = "") {
    if (!str || str === "Unknown") return "None";

    // Match everything up to & including date in parentheses
    const matches = str.match(/[^,]*?\(\d{4}-\d{2}-\d{2}\)/g) || [];

    // Filter out telemetry aggregation remarks
    const filtered = matches.filter(
        remark => !remark.trim().startsWith("Telemetry locations aggregated per species per 1-degree cell")
    );

    return filtered.length > 0 ? filtered.join(", ") : "None";
}


export function parseImageField(imageField = "") {
    // Split on comma that separates entries, not commas inside parentheses
    const entries = imageField.match(/(https?:\/\/[^\s,]+(?:jpg|png|jpeg)(?:\s*\([^)]*\))?)/g) || [];

    return entries.map((entry) => {
        const [urlPart, metaPart] = entry.split(/\s*\(/);
        const url = urlPart.trim();
        const meta = metaPart ? metaPart.replace(/\)$/, "") : "";

        const licenseMatch = meta.match(/license:\s*([^,]+)/i);
        const creatorMatch = meta.match(/creator:\s*([^,]+)/i);

        return {
            url,
            license: licenseMatch ? licenseMatch[1].trim() : "Unknown",
            creator: creatorMatch ? creatorMatch[1].trim() : "Unknown"
        };
    });
}


function extractMonths(obj) {
    let sharkMonths = [];
    const sharkCoordData = coordinatesData.find(shark => shark.whaleSharkID === obj.id);
    
    if (sharkCoordData && sharkCoordData.coordinates) {
        // Process each coordinate/occurrence for given shark
        sharkCoordData.coordinates.forEach(coord => {
            if (coord.eventDate) {
                const date = new Date(coord.eventDate);
                if (!isNaN(date.getTime())) {
                    const month = FULLMONTHS[date.getMonth()];
                    sharkMonths.push(month);
                }
            }
        });
    }

    // Remove duplicate months before returning
    return [...new Set(sharkMonths)];
}


function formatKeyVals(obj, keyMap) {
    // Adjust column names for easier access in shark card
    const renamed = Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [keyMap[key] || key, value])
    );

    // Extract just 1 lifeStage where available
    if (renamed.lifeStage) {
        renamed.lifeStage = cleanLifestage(renamed);
    }

    // Add new field for all months where shark had records
    renamed.months = extractMonths(renamed);

    return renamed;
}




