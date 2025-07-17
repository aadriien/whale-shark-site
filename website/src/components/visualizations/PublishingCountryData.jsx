import DataMetricFilter from "./DataMetricFilter.jsx";

import DataOverview from "../charts/DataOverview.jsx";
import DataGrid from "../DataGrid.jsx";

import GBIFRegionOccurrences from "./RegionalData.jsx";
import GBIFRegionAverages from "./RegionalAverages.jsx";

import publishingCountryStatsGBIF from "../../assets/data/json/gbif_publishingCountry_stats.json";
  

const GBIFPublishingCountryOccurrences = ({ selectedRegion, onChange }) => {
    const commonProps = {
        regionData: publishingCountryStatsGBIF,
        metric: "publishingCountry",
        selectedRegion,
    };
    return (
        <>
            {DataMetricFilter({
                label: "Publishing Country",
                field: "publishingCountry",
                data: publishingCountryStatsGBIF,
                selectedValue: selectedRegion,
                onChange: onChange
            })}

            <DataGrid>
                <div>
                    <DataOverview 
                        dataset="publishingCountry" 
                        filterField="publishingCountry"
                        selectedFilter={selectedRegion}
                        displayFields={[
                            { label: "Total Occurrences", field: "Total Occurrences" },
                            { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                            { label: "Top 3 Countries Visited", field: "Top 3 Countries Visited" }
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

export default GBIFPublishingCountryOccurrences;

