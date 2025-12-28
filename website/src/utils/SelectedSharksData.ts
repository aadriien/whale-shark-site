import { 
    parseSpecificRegion, getDate, 
    MONTHS 
} from "./DataUtils";

import coordinatesData from "../assets/data/json/gbif_shark_tracking.json";

import { HeatmapDataPoint } from "../types/charts";
import { WhaleSharkEntryNormalized, WhaleSharkDatasetNormalized } from "../types/sharks";


function extractCountry(shark: WhaleSharkEntryNormalized) {
    if (shark.countries) {
        // Get 1st country from comma-separated list
        const firstCountry = shark.countries.split(",")[0];
        return parseSpecificRegion(firstCountry);
    }
    return "Unknown";
}


function extractYear(shark: WhaleSharkEntryNormalized) {
    if (shark.newest) {
        return new Date(shark.newest).getFullYear();
    }
    if (shark.oldest) {
        return new Date(shark.oldest).getFullYear();
    }

    if (shark.countries) {
        // Try to extract year from country field using getDate 
        const dateStr = getDate(shark.countries);
        if (dateStr !== "Unknown") {
            const match = dateStr.match(/(\d{4})/);
            if (match) return parseInt(match[1]);
        }
    }
    return new Date().getFullYear();
}


function extractPublishingCountry(shark: WhaleSharkEntryNormalized) {
    if (shark.publishing) {
        // Get 1st publishingCountry from comma-separated list
        const firstPub = shark.publishing.split(",")[0];
        return parseSpecificRegion(firstPub);
    }
    return "Unknown";
}


export function createSummaryDataset(
    selectedSharkObjects: WhaleSharkDatasetNormalized
) {    
    if (selectedSharkObjects.length === 0) {
        return [{
            "lab": "No sharks selected",
            "Total Selected": 0,
            "Total Occurrences": 0,
            "Countries": "N/A",
            "Years": "N/A",
            "Top 3 Publishing Countries": "N/A"
        }];
    }

    // Aggregate data from all selected sharks
    const countries = new Set<string>();
    const years = new Set<number>();
    const publishingCountries = new Map<string, number>();
    let totalOccurrences = 0;

    selectedSharkObjects.forEach(shark => {
        countries.add(extractCountry(shark));        
        years.add(extractYear(shark));
        
        const occurrences = shark.occurrences || 1;
        totalOccurrences += occurrences;
        
        const pubCountry = extractPublishingCountry(shark);
        if (pubCountry !== "Unknown") {
            publishingCountries.set(
                pubCountry, 
                (publishingCountries.get(pubCountry) || 0) + 1
            );
        }
    });
    
    const top3Publishing = Array.from(publishingCountries.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([country]) => country)
        .join(" > ");

    const yearsArray = Array.from(years);
    const countriesArray = Array.from(countries);

    return [{
        "lab": `${selectedSharkObjects.length} Selected Sharks`,
        "Total Selected": selectedSharkObjects.length,
        "Total Occurrences": totalOccurrences,
        "Countries": countriesArray.slice(0, 3).join(", ") + (countriesArray.length > 3 ? "..." : ""),
        "Years": yearsArray.length > 0 ? `${Math.min(...yearsArray)} - ${Math.max(...yearsArray)}` : "N/A",
        "Unique Countries": countriesArray.length,
        "Year Range": yearsArray.length > 0 ? Math.max(...yearsArray) - Math.min(...yearsArray) + 1 : 0,
        "Top 3 Publishing Countries": top3Publishing || "Unknown"
    }];
}

// Create calendar heatmap data from selected sharks using coordinate data
export function createCalendarHeatmapData(selectedSharkIds: Set<string>) {
    if (!selectedSharkIds || selectedSharkIds.size === 0) {
        return [];
    }
        
    // Map to count occurrences by year-month
    const yearMonthCounts = new Map<string, number>();
    
    // Convert selectedSharkIds to array (since it's a set)
    const sharkIdsArray = Array.from(selectedSharkIds);
    
    sharkIdsArray.forEach(sharkId => {
        const sharkCoordData = coordinatesData.find(shark => shark.whaleSharkID === sharkId);
        
        if (sharkCoordData && sharkCoordData.coordinates) {
            // Process each coordinate/occurrence for given shark
            sharkCoordData.coordinates.forEach(coord => {
                if (coord.eventDate) {
                    const date = new Date(coord.eventDate);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = MONTHS[date.getMonth()];
                        const key = `${year}-${month}`;
                        
                        yearMonthCounts.set(key, (yearMonthCounts.get(key) || 0) + 1);
                    }
                }
            });
        }
    });
    
    // Convert map to heatmap format
    const heatmapData: HeatmapDataPoint[] = [];
    for (const [key, count] of yearMonthCounts.entries()) {
        const [year, month] = key.split("-");
        heatmapData.push({
            year: parseInt(year),
            month: month,
            value: count
        });
    }
    
    return heatmapData;
}

export default createSummaryDataset;


