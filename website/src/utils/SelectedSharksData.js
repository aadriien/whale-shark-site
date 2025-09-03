import { parseSpecificRegion, getDate } from './DataUtils.js';


function extractCountry(shark) {
    if (shark.country) return shark.country;

    if (shark.countries) {
        // Get 1st country from comma-separated list
        const firstCountry = shark.countries.split(',')[0];
        return parseSpecificRegion(firstCountry);
    }

    if (shark['country (year)']) {
        return parseSpecificRegion(shark['country (year)']);
    }

    return 'Unknown';
}


function extractYear(shark) {
    if (shark.year) return shark.year;

    if (shark.newest) {
        return new Date(shark.newest).getFullYear();
    }
    if (shark['Newest Occurrence']) {
        return new Date(shark['Newest Occurrence']).getFullYear();
    }

    if (shark.oldest) {
        return new Date(shark.oldest).getFullYear();
    }
    if (shark['Oldest Occurrence']) {
        return new Date(shark['Oldest Occurrence']).getFullYear();
    }

    if (shark.countries) {
        // Try to extract year from country field using getDate 
        const dateStr = getDate(shark.countries);
        if (dateStr !== 'Unknown') {
            const match = dateStr.match(/(\d{4})/);
            if (match) return parseInt(match[1]);
        }
    }
    return new Date().getFullYear();
}


function extractPublishingCountry(shark) {
    if (shark.publishing) {
        // Get 1st publishingCountry from comma-separated list
        const firstPub = shark.publishing.split(',')[0];
        return parseSpecificRegion(firstPub);
    }
    if (shark['publishingCountry (year)']) {
        return parseSpecificRegion(shark['publishingCountry (year)']);
    }
    return 'Unknown';
}


// Get shark objects from IDs or return them if already objects
function getSharkObjects(selectedSharks, allSharksData) {
    if (!selectedSharks || selectedSharks.length === 0) {
        return [];
    }

    const sharksArray = Array.isArray(selectedSharks) ? selectedSharks : Array.from(selectedSharks);
    
    // If we have IDs, look up actual shark objects
    if (sharksArray.length > 0 && (typeof sharksArray[0] === 'string' || typeof sharksArray[0] === 'number')) {
        const selectedIds = new Set(sharksArray.map(id => String(id)));

        return allSharksData.filter(shark => 
            selectedIds.has(String(shark.whaleSharkID)) ||
            selectedIds.has(String(shark.identificationID)) ||
            selectedIds.has(String(shark.id))
        );
    }
    
    return sharksArray;
}


export function createSummaryDataset(selectedSharks, allSharksData = []) {
    const sharkObjects = getSharkObjects(selectedSharks, allSharksData);
    
    if (sharkObjects.length === 0) {
        return [{
            'Summary': 'No sharks selected',
            'Total Selected': 0,
            'Total Occurrences': 0,
            'Countries': 'N/A',
            'Years': 'N/A',
            'Top 3 Publishing Countries': 'N/A'
        }];
    }

    // Aggregate data from all selected sharks
    const countries = new Set();
    const years = new Set();
    const publishingCountries = new Map();
    let totalOccurrences = 0;

    sharkObjects.forEach(shark => {
        countries.add(extractCountry(shark));        
        years.add(extractYear(shark));
        
        const occurrences = parseInt(shark['Total Occurrences']) || 
                           parseInt(shark.occurrences) || 
                           parseInt(shark.TotalOccurrences) || 1;
        totalOccurrences += occurrences;
        
        const pubCountry = extractPublishingCountry(shark);
        if (pubCountry !== 'Unknown') {
            publishingCountries.set(pubCountry, (publishingCountries.get(pubCountry) || 0) + 1);
        }
    });
    
    const top3Publishing = Array.from(publishingCountries.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([country]) => country)
        .join(' > ');

    const yearsArray = Array.from(years);
    const countriesArray = Array.from(countries);

    return [{
        'Summary': `${sharkObjects.length} Selected Sharks`,
        'Total Selected': sharkObjects.length,
        'Total Occurrences': totalOccurrences,
        'Countries': countriesArray.slice(0, 3).join(', ') + (countriesArray.length > 3 ? '...' : ''),
        'Years': yearsArray.length > 0 ? `${Math.min(...yearsArray)} - ${Math.max(...yearsArray)}` : 'N/A',
        'Unique Countries': countriesArray.length,
        'Year Range': yearsArray.length > 0 ? Math.max(...yearsArray) - Math.min(...yearsArray) + 1 : 0,
        'Top 3 Publishing Countries': top3Publishing || 'Unknown'
    }];
}

export default createSummaryDataset;


