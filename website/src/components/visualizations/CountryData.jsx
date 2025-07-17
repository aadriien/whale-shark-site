import DataMetricFilter from "./DataMetricFilter.jsx";

import DataOverview from "../charts/DataOverview.jsx";
import DataGrid from "../DataGrid.jsx";

import GBIFRegionOccurrences from "./RegionalData.jsx";
import GBIFRegionAverages from "./RegionalAverages.jsx";

import countryStatsGBIF from "../../assets/data/json/gbif_country_stats.json";


const GBIFCountryOccurrences = ({ selectedRegion, onChange }) => {
    const commonProps = {
        regionData: countryStatsGBIF,
        metric: "country",
        selectedRegion,
    };

    return (
        <>
            {DataMetricFilter({
                label: "Country",
                field: "country",
                data: countryStatsGBIF,
                selectedValue: selectedRegion,
                onChange: onChange
            })}

            <DataGrid>
                <div>
                    <DataOverview 
                        dataset="country" 
                        filterField="country"
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

export default GBIFCountryOccurrences;

