import GBIFRegionOccurrences from "./RegionalData.jsx";
import countryStatsGBIF from "../../assets/data/json/gbif_country_stats.json";
  

const GBIFCountryOccurrences = () => {
    return (
        <div className="country-occurrence-card" 
            style={{ 
                width: "100%", 
                height: "100%",
                minWidth: "300px",
                minHeight: "300px",
                padding: "1rem 0.5rem",
            }}
        >
            <GBIFRegionOccurrences 
                regionData={countryStatsGBIF} 
                metric={"country"} 
            />
        </div>
    );
};

export default GBIFCountryOccurrences;

