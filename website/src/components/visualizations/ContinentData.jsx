import GBIFRegionOccurrences from "./RegionalData.jsx";
import continentStatsGBIF from "../../assets/data/json/gbif_continent_stats.json";
  

const GBIFContinentOccurrences = () => {
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
            <GBIFRegionOccurrences 
                regionData={continentStatsGBIF} 
                metric={"continent"} 
            />
        </div>
    );
};

export default GBIFContinentOccurrences;

