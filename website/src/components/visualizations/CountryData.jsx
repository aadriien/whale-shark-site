import GBIFRegionOccurrences from "./RegionalData.jsx";
import GBIFRegionAverages from "./RegionalAverages.jsx";

import countryStatsGBIF from "../../assets/data/json/gbif_country_stats.json";


const GBIFCountryOccurrences = ({ variant = "radial-heatmap", selectedRegion }) => {
    const commonProps = {
        regionData: countryStatsGBIF,
        metric: "country",
        selectedRegion,
    };

    return (
        <div className="card-data-wrapper" 
            style={{ 
                width: "100%", 
                height: "100%",
                minWidth: "300px",
                minHeight: "300px",
                padding: "1rem 0.5rem",
            }}
        >
            {variant === "bar" ? (
                <GBIFRegionAverages {...commonProps} />
            ) : (
                <GBIFRegionOccurrences {...commonProps} />
            )}
        </div>
    );
};

export default GBIFCountryOccurrences;

