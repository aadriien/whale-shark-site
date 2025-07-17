import DataMetricFilter from "./DataMetricFilter.jsx";

import DataOverview from "../charts/DataOverview.jsx";
import DataGrid from "../DataGrid.jsx";

import GBIFRegionOccurrences from "./RegionalData.jsx";
import GBIFRegionAverages from "./RegionalAverages.jsx";

import continentStatsGBIF from "../../assets/data/json/gbif_continent_stats.json";


const GBIFContinentOccurrences = ({ selectedRegion, onChange }) => {
    const commonProps = {
        regionData: continentStatsGBIF,
        metric: "continent",
        selectedRegion,
    };

    return (
        <>
            {DataMetricFilter({
                label: "Continent",
                field: "continent",
                data: continentStatsGBIF,
                selectedValue: selectedRegion,
                onChange: onChange
            })}

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
