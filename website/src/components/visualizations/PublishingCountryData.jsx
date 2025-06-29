import GBIFRegionOccurrences from "./RegionalData.jsx";
import publishingCountryStatsGBIF from "../../assets/data/json/gbif_publishingCountry_stats.json";
  

const GBIFPublishingCountryOccurrences = () => {
    return (
        <div className="publishing-country-occurrence-card" 
            style={{ 
                width: "100%", 
                height: "100%",
                minWidth: "300px",
                minHeight: "300px",
                padding: "1rem 0.5rem",
            }}
        >
            <GBIFRegionOccurrences 
                regionData={publishingCountryStatsGBIF} 
                metric={"publishingCountry"} 
            />
        </div>
    );
};

export default GBIFPublishingCountryOccurrences;

