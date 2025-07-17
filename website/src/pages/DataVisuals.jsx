import { useState, useMemo } from "react";

import DataOverview from "../components/charts/DataOverview.jsx";
import CalendarData from "../components/visualizations/CalendarData.jsx";
import SexLifeStageData from "../components/visualizations/SexLifeStageData.jsx";
import ContinentData from "../components/visualizations/ContinentData.jsx";
import CountryData from "../components/visualizations/CountryData.jsx";
import PublishingCountryData from "../components/visualizations/PublishingCountryData.jsx";

import DataGrid from "../components/DataGrid.jsx";

import calendarStatsGBIF from "../assets/data/json/gbif_calendar_stats.json";
import continentStats from "../assets/data/json/gbif_continent_stats.json";
import countryStats from "../assets/data/json/gbif_country_stats.json";
import publishingStats from "../assets/data/json/gbif_publishingCountry_stats.json";


function DataVisuals() {
    const [selectedContinent, setSelectedContinent] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedPublisher, setSelectedPublisher] = useState("");
    const [selectedYear, setSelectedYear] = useState(""); // for calendar filter

    const renderFilter = ({ label, field, data, selectedValue, onChange }) => {
        const options = useMemo(() => {
            const uniqueValues = Array.from(new Set(data.map(d => d[field])));
            // Sort numeric descending or string ascending
            return uniqueValues.sort((a, b) => {
                if (typeof a === "number" && typeof b === "number") return b - a;
                return String(a).localeCompare(String(b));
            });
        }, [data, field]);

        return (
            <div style={{ marginBottom: "1rem" }}>
                <label htmlFor={`${field}-select`} style={{ fontWeight: "bold" }}>
                    Select a {label.toLowerCase()}:
                </label>
                <select
                    id={`${field}-select`}
                    value={selectedValue}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="">-- Choose a {label.toLowerCase()} --</option>
                    {options.map((val) => (
                        <option key={val} value={val}>{val}</option>
                    ))}
                </select>
            </div>
        );
    };

    return (
        <div className="page-content">
            <div className="full-data-grid">

                <div className="grid-section section-calendar">
                    <h1 className="section-title">Calendar Data Metrics</h1>

                    {renderFilter({
                        label: "Year",
                        field: "year",
                        data: calendarStatsGBIF,
                        selectedValue: selectedYear,
                        onChange: setSelectedYear
                    })}

                    <DataGrid>
                        <div><CalendarData variant="heatmap" /></div>
                        <div>
                            <DataOverview 
                                dataset="calendar" 
                                filterField="year"
                                selectedFilter={selectedYear}
                                displayFields={[
                                    { label: "Total Occurrences", field: "Total Occurrences" },
                                    { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                                    { label: "Top 3 Publishing Countries", field: "Top 3 Publishing Countries" }
                                ]}
                            />
                        </div>

                        <div><CalendarData variant="bar" selectedYear={selectedYear} /></div>
                        <div><SexLifeStageData selectedYear={selectedYear} /></div>
                    </DataGrid>
                </div>

                <div className="grid-section section-continent">
                    <h1 className="section-title">Continent Data Metrics</h1>

                    {renderFilter({
                        label: "Continent",
                        field: "continent",
                        data: continentStats,
                        selectedValue: selectedContinent,
                        onChange: setSelectedContinent
                    })}

                    <DataGrid>
                        <div>
                            <DataOverview 
                                dataset="continent" 
                                filterField="continent"
                                selectedFilter={selectedContinent}
                                displayFields={[
                                    { label: "Total Occurrences", field: "Total Occurrences" },
                                    { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                                    { label: "Top 3 Publishing Countries", field: "Top 3 Publishing Countries" }
                                ]}
                            />
                        </div>

                        <div><ContinentData variant="radial-heatmap" selectedRegion={selectedContinent} /></div>
                        <div><ContinentData variant="bar" selectedRegion={selectedContinent} /></div>
                    </DataGrid>
                </div>

                <div className="grid-section section-country">
                    <h1 className="section-title">Country Data Metrics</h1>

                    {renderFilter({
                        label: "Country",
                        field: "country",
                        data: countryStats,
                        selectedValue: selectedCountry,
                        onChange: setSelectedCountry
                    })}

                    <DataGrid>
                        <div>
                            <DataOverview 
                                dataset="country" 
                                filterField="country"
                                selectedFilter={selectedCountry}
                                displayFields={[
                                    { label: "Total Occurrences", field: "Total Occurrences" },
                                    { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                                    { label: "Top 3 Publishing Countries", field: "Top 3 Publishing Countries" }
                                ]}
                            />
                        </div>

                        <div><CountryData variant="radial-heatmap" selectedRegion={selectedCountry} /></div>
                        <div><CountryData variant="bar" selectedRegion={selectedCountry} /></div>
                    </DataGrid>
                </div>

                <div className="grid-section section-publishing">
                    <h1 className="section-title">Publishing Country Data Metrics</h1>

                    {renderFilter({
                        label: "Publishing Country",
                        field: "publishingCountry",
                        data: publishingStats,
                        selectedValue: selectedPublisher,
                        onChange: setSelectedPublisher
                    })}

                    <DataGrid>
                        <div>
                            <DataOverview 
                                dataset="publishingCountry" 
                                filterField="publishingCountry"
                                selectedFilter={selectedPublisher}
                                displayFields={[
                                    { label: "Total Occurrences", field: "Total Occurrences" },
                                    { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                                    { label: "Top 3 Countries Visited", field: "Top 3 Countries Visited" }
                                ]}
                            />
                        </div>

                        <div><PublishingCountryData variant="radial-heatmap" selectedRegion={selectedPublisher} /></div>
                        <div><PublishingCountryData variant="bar" selectedRegion={selectedPublisher} /></div>
                    </DataGrid>
                </div>

            </div>
        </div>
    );
}

export default DataVisuals;


