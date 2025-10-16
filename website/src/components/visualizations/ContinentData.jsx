import DataMetricFilter from "./DataMetricFilter.jsx";

import DataOverview from "../charts/DataOverview.jsx";
import DataGrid from "../DataGrid.jsx";

import GBIFRegionOccurrences from "./RegionalData.jsx";
import GBIFRegionAverages from "./RegionalAverages.jsx";

import continentStatsGBIF from "../../assets/data/json/gbif_continent_stats.json";
import { useState } from "react";


const GBIFContinentOccurrences = () => {
    const [selectedRegion, setSelectedRegion] = useState("")

    const commonProps = {
        regionData: continentStatsGBIF,
        metric: "continent",
        selectedRegion,
    };

    return (
        <>
            <div className="section-header">
                <h1 className="section-title">Continent Data Metrics</h1>

                <DataMetricFilter
                    label="Continent"
                    field="continent"
                    data={continentStatsGBIF}
                    selectedValue={selectedRegion}
                    onChange={setSelectedRegion}
                    inline={true} /* toggles display of "select a continent" */
                />
            </div>

            <DataGrid>
                <div className="card-data-wrapper">
                    <DataOverview 
                        dataset="continent" 
                        filterField="continent"
                        selectedFilter={selectedRegion}
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
