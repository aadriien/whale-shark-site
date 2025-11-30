import { useState } from "react";

import DataMetricFilter from "./DataMetricFilter";

import DataOverview from "../charts/DataOverview";
import DataGrid from "../DataGrid";

import GBIFRegionOccurrences from "./RegionalData";
import GBIFRegionAverages from "./RegionalAverages";

import countryStatsGBIF from "../../assets/data/json/gbif_country_stats.json";


const GBIFCountryOccurrences = () => {
    const [selectedCountry, setSelectedCountry] = useState("");

    const commonProps = {
        regionData: countryStatsGBIF,
        metric: "country",
        selectedRegion: selectedCountry,
    };

    return (
        <>
            <div className="section-header">
                <h1 className="section-title">Country Data Metrics</h1>

                <DataMetricFilter
                    label="Country"
                    field="country"
                    data={countryStatsGBIF}
                    selectedValue={selectedCountry}
                    onChange={setSelectedCountry}
                    inline={true} /* toggles display of "select a country" */
                />
            </div>

            <DataGrid>
                <div className="card-data-wrapper">
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

