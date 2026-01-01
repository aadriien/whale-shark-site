import { useState, useMemo } from "react";

import { 
    extractContinents, 
    getCountryCode, 
    parseSpecificRegion 
} from "../../utils/DataUtils";

import { WhaleSharkDatasetNormalized } from "../../types/sharks";

import { ContinentDisplayProps } from "../../types/panels";


const VALID_CONTINENTS = [
    "Africa",
    "Antarctica",
    "Asia",
    "Europe",
    "North America",
    "Oceania",
    "South America",
] as const;

type Continent = typeof VALID_CONTINENTS[number];


function ContinentDisplay({ sharks, onSelect, selectedSharkId }: ContinentDisplayProps) {
    const [openContinents, setOpenContinents] = useState<Partial<Record<Continent, boolean>>>({});

    const sharksByContinent = useMemo(() => {
        const byContinent: Partial<Record<Continent, WhaleSharkDatasetNormalized>> = {};
                
        sharks.forEach(shark => {
            const continents = extractContinents(shark.continent);
            
            continents.forEach(continent => {
                if (VALID_CONTINENTS.includes(continent as Continent)) {
                    if (!byContinent[continent]) {
                        byContinent[continent] = [];
                    }
                    byContinent[continent].push(shark);
                }
            });
        });
        
        console.log("Sharks by continent:", Object.keys(byContinent).map(c => 
            `${c}: ${byContinent[c].length}`
        ).join(", "));
        
        return byContinent;
    }, [sharks]);

    const toggleContinent = (continent: string) => {
        setOpenContinents(prev => ({
            ...prev,
            [continent]: !prev[continent],
        }));
    };

    return (
        <div className="scrollable-sharks-list">
            {Object.keys(sharksByContinent).length === 0 ? (
                <div className="no-sharks-message">
                    Sorry! No whale sharks match your current filters.
                </div>
            ) : (
            Object.entries(sharksByContinent)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([continent, continentSharks]) => {
                    const isOpen: boolean = openContinents[continent];
                    
                    return (  
                        <div key={continent} className="continent-dropdown">
                            <div
                                className="continent-header"
                                onClick={() => toggleContinent(continent)}
                            >
                                {continent} {isOpen ? "▾" : "▸"}
                            </div>
                            {isOpen && (
                                <div className="scrollable-shark-list">
                                    {continentSharks.map((shark) => (
                                        <div
                                            key={shark.id}
                                            className={`shark-selector-item ${shark.id === selectedSharkId ? "selected" : ""}`}
                                            onClick={() => onSelect(shark.id)}
                                        >
                                            {(() => {
                                                const countryName = parseSpecificRegion(shark.countries.trim());
                                                const code = getCountryCode(countryName);

                                                return (
                                                    <>
                                                    {code ? (
                                                        <div className="flag-and-code">
                                                            <img
                                                                src={`https://flagcdn.com/24x18/${code}.png`}
                                                                alt={countryName}
                                                                title={countryName}
                                                                className="flag-icon"
                                                                loading="lazy"
                                                            />
                                                            <span className="country-code">{code.toUpperCase()}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="flag-and-code" title={countryName} role="img" aria-label="unknown country">
                                                            🌍 <span className="country-code">N/A</span>
                                                        </span>
                                                    )}
                                                    {shark.id}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default ContinentDisplay;

