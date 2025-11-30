import { useState } from "react";

import DataMetricFilter from "./DataMetricFilter";

import DataOverview from "../charts/DataOverview";
import DataGrid from "../DataGrid";

import GBIFRegionOccurrences from "./RegionalData";
import GBIFRegionAverages from "./RegionalAverages.jsx";

import continentStatsGBIF from "../../assets/data/json/gbif_continent_stats.json";


const GBIFContinentOccurrences = () => {
    const [selectedContinent, setSelectedContinent] = useState("");

    const commonProps = {
        regionData: continentStatsGBIF,
        metric: "continent",
        selectedRegion: selectedContinent,
    };

    return (
        <>
            <div className="section-header">
                <h1 className="section-title">Continent Data Metrics</h1>

                <DataMetricFilter
                    label="Continent"
                    field="continent"
                    data={continentStatsGBIF}
                    selectedValue={selectedContinent}
                    onChange={setSelectedContinent}
                    inline={true} /* toggles display of "select a continent" */
                />
            </div>

            <DataGrid>
                <div className="card-data-wrapper">
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

                <div className="card-data-wrapper">
                    <GBIFRegionOccurrences {...commonProps} />
                </div>

                <div className="card-data-wrapper">
                    <GBIFRegionAverages {...commonProps} />
                </div>
            </DataGrid>
        </>
    );
};

export default GBIFContinentOccurrences;
