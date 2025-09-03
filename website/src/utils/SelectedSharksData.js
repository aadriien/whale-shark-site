import { cleanLifestage, extractContinents, parseSpecificRegion } from './DataUtils.js';


export function createDataOverviewDataset(selectedSharks, allSharksData = [], groupBy = 'shark') {
    if (!selectedSharks || selectedSharks.length === 0) {
        return [];
    }

    const sharksArray = Array.isArray(selectedSharks) ? selectedSharks : Array.from(selectedSharks);
    
    let sharkObjects = sharksArray;
    if (sharksArray.length > 0 && (typeof sharksArray[0] === 'string' || typeof sharksArray[0] === 'number')) {
        const selectedIds = new Set(sharksArray.map(id => String(id)));
        sharkObjects = allSharksData.filter(shark => 
            selectedIds.has(String(shark.whaleSharkID)) ||
            selectedIds.has(String(shark.identificationID)) ||
            selectedIds.has(String(shark.id))
        );
    }

    switch (groupBy) {
        case 'shark':
            return createSharkBasedDataset(sharkObjects);
        case 'country':
            return createCountryBasedDataset(sharkObjects);
        case 'year':
            return createYearBasedDataset(sharkObjects);
        case 'continent':
            return createContinentBasedDataset(sharkObjects);
        default:
            return createSharkBasedDataset(sharkObjects);
    }
}

function createSharkBasedDataset(sharkObjects) {
    return sharkObjects.map((shark, index) => {
        const sharkId = shark.whaleSharkID || shark.identificationID || shark.id || `shark_${index}`;
        const country = extractCountry(shark);
        const continent = extractContinent(shark);
        const year = extractYear(shark);
        const sex = shark.sex || 'Unknown';
        const lifeStage = extractLifeStage(shark);
        const occurrences = parseInt(shark['Total Occurrences']) || 1;
        const observationType = getObservationType(shark);
        const location = extractLocation(shark);

        return {
            'Shark ID': sharkId,
            'Total Occurrences': occurrences,
            'Country': country,
            'Continent': continent,
            'Year': year,
            'Sex': sex,
            'Life Stage': lifeStage,
            'Observation Type': observationType,
            'Location': location,
            'Newest Occurrence': shark['Newest Occurrence'] || 'Unknown',
            'Oldest Occurrence': shark['Oldest Occurrence'] || 'Unknown',
            'HUMAN_OBSERVATION': shark.HUMAN_OBSERVATION || 0,
            'MACHINE_OBSERVATION': shark.MACHINE_OBSERVATION || 0
        };
    });
}

function createCountryBasedDataset(sharkObjects) {
    const countryGroups = {};
    
    sharkObjects.forEach(shark => {
        const country = extractCountry(shark);
        if (!countryGroups[country]) {
            countryGroups[country] = {
                sharks: [],
                totalOccurrences: 0,
                humanObservations: 0,
                machineObservations: 0,
                years: new Set(),
                sexes: { Male: 0, Female: 0, Unknown: 0 },
                lifeStages: {}
            };
        }
        
        countryGroups[country].sharks.push(shark);
        countryGroups[country].totalOccurrences += parseInt(shark['Total Occurrences']) || 1;
        countryGroups[country].humanObservations += parseInt(shark.HUMAN_OBSERVATION) || 0;
        countryGroups[country].machineObservations += parseInt(shark.MACHINE_OBSERVATION) || 0;
        countryGroups[country].years.add(extractYear(shark));
        
        const sex = shark.sex || 'Unknown';
        countryGroups[country].sexes[sex] = (countryGroups[country].sexes[sex] || 0) + 1;
        
        const lifeStage = extractLifeStage(shark);
        countryGroups[country].lifeStages[lifeStage] = (countryGroups[country].lifeStages[lifeStage] || 0) + 1;
    });

    return Object.entries(countryGroups).map(([country, data]) => ({
        'Country': country,
        'Total Occurrences': data.totalOccurrences,
        'Unique Sharks (with ID)': data.sharks.length,
        'Years Active': Array.from(data.years).sort().join(', '),
        'HUMAN_OBSERVATION': data.humanObservations,
        'MACHINE_OBSERVATION': data.machineObservations,
        'Sex Distribution': Object.entries(data.sexes)
            .filter(([_, count]) => count > 0)
            .map(([sex, count]) => `${sex}: ${count}`)
            .join(', '),
        'Life Stage Distribution': Object.entries(data.lifeStages)
            .filter(([_, count]) => count > 0)
            .map(([stage, count]) => `${stage}: ${count}`)
            .join(', ')
    }));
}

function createYearBasedDataset(sharkObjects) {
    const yearGroups = {};
    
    sharkObjects.forEach(shark => {
        const year = extractYear(shark);
        if (!yearGroups[year]) {
            yearGroups[year] = {
                sharks: [],
                totalOccurrences: 0,
                humanObservations: 0,
                machineObservations: 0,
                countries: new Set(),
                sexes: { Male: 0, Female: 0, Unknown: 0 }
            };
        }
        
        yearGroups[year].sharks.push(shark);
        yearGroups[year].totalOccurrences += parseInt(shark['Total Occurrences']) || 1;
        yearGroups[year].humanObservations += parseInt(shark.HUMAN_OBSERVATION) || 0;
        yearGroups[year].machineObservations += parseInt(shark.MACHINE_OBSERVATION) || 0;
        yearGroups[year].countries.add(extractCountry(shark));
        
        const sex = shark.sex || 'Unknown';
        yearGroups[year].sexes[sex] = (yearGroups[year].sexes[sex] || 0) + 1;
    });

    return Object.entries(yearGroups).map(([year, data]) => ({
        'year': parseInt(year),
        'Total Occurrences': data.totalOccurrences,
        'Unique Sharks (with ID)': data.sharks.length,
        'Top Countries': Array.from(data.countries).slice(0, 3).join(' > '),
        'HUMAN_OBSERVATION': data.humanObservations,
        'MACHINE_OBSERVATION': data.machineObservations,
        'Sex: Male': data.sexes.Male,
        'Sex: Female': data.sexes.Female,
        'Sex: Unknown': data.sexes.Unknown
    }));
}

function createContinentBasedDataset(sharkObjects) {
    const continentGroups = {};
    
    sharkObjects.forEach(shark => {
        const continent = extractContinent(shark);
        if (!continentGroups[continent]) {
            continentGroups[continent] = {
                sharks: [],
                totalOccurrences: 0,
                countries: new Set(),
                years: new Set()
            };
        }
        
        continentGroups[continent].sharks.push(shark);
        continentGroups[continent].totalOccurrences += parseInt(shark['Total Occurrences']) || 1;
        continentGroups[continent].countries.add(extractCountry(shark));
        continentGroups[continent].years.add(extractYear(shark));
    });

    return Object.entries(continentGroups).map(([continent, data]) => ({
        'Continent': continent,
        'Total Occurrences': data.totalOccurrences,
        'Unique Sharks (with ID)': data.sharks.length,
        'Countries': Array.from(data.countries).join(', '),
        'Years Active': Array.from(data.years).sort().join(', ')
    }));
}

function extractCountry(shark) {
    if (shark.country) return shark.country;
    if (shark['country (year)']) {
        return shark['country (year)'].split(' (')[0];
    }
    return 'Unknown';
}

function extractContinent(shark) {
    if (shark.continent) return shark.continent;
    if (shark['continent (year)']) {
        const continentStr = shark['continent (year)'].split(' (')[0];
        const continents = extractContinents(continentStr);
        return continents.length > 0 ? continents[0] : 'Unknown';
    }
    return 'Unknown';
}

function extractYear(shark) {
    if (shark.year) return shark.year;
    if (shark['Newest Occurrence']) {
        return new Date(shark['Newest Occurrence']).getFullYear();
    }
    if (shark['Oldest Occurrence']) {
        return new Date(shark['Oldest Occurrence']).getFullYear();
    }
    if (shark['country (year)']) {
        const match = shark['country (year)'].match(/\((\d{4})\)/);
        if (match) return parseInt(match[1]);
    }
    return new Date().getFullYear();
}

function extractLifeStage(shark) {
    if (shark.lifeStage) {
        return cleanLifestage({ lifeStage: shark.lifeStage });
    }
    if (shark['lifeStage (year)']) {
        return cleanLifestage({ lifeStage: shark['lifeStage (year)'] });
    }
    return 'Unknown';
}

function getObservationType(shark) {
    const human = parseInt(shark.HUMAN_OBSERVATION) || 0;
    const machine = parseInt(shark.MACHINE_OBSERVATION) || 0;
    
    if (human > 0 && machine > 0) return 'Both';
    if (human > 0) return 'Human';
    if (machine > 0) return 'Machine';
    return 'Unknown';
}

function extractLocation(shark) {
    if (shark['stateProvince - verbatimLocality (month year)']) {
        return parseSpecificRegion(shark['stateProvince - verbatimLocality (month year)']);
    }
    if (shark.stateProvince) return shark.stateProvince;
    if (shark.verbatimLocality) return shark.verbatimLocality;
    return 'Unknown';
}

export function createSummaryDataset(selectedSharks, allSharksData = []) {
    const dataset = createDataOverviewDataset(selectedSharks, allSharksData, 'shark');
    
    if (dataset.length === 0) {
        return [{
            'Summary': 'No sharks selected',
            'Total Selected': 0,
            'Countries': 'N/A',
            'Years': 'N/A'
        }];
    }

    const countries = new Set(dataset.map(row => row.Country));
    const years = new Set(dataset.map(row => row.Year));
    const totalOccurrences = dataset.reduce((sum, row) => sum + row['Total Occurrences'], 0);

    return [{
        'Summary': `${dataset.length} Selected Sharks`,
        'Total Selected': dataset.length,
        'Total Occurrences': totalOccurrences,
        'Countries': Array.from(countries).slice(0, 3).join(', ') + (countries.size > 3 ? '...' : ''),
        'Years': `${Math.min(...years)} - ${Math.max(...years)}`,
        'Unique Countries': countries.size,
        'Year Range': Math.max(...years) - Math.min(...years) + 1
    }];
}

export default createDataOverviewDataset;
