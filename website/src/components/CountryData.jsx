import RadialHeatmap from "./charts/RadialHeatmap.jsx";

import countryStatsGBIF from "../assets/data/json/gbif_country_stats.json";


const reshapeCountryData = (rawData) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    const reshaped = [];
  
    rawData.forEach(row => {
        months.forEach(month => {
            // Get value for current month & confirm valid
            const totalOccurrences = row[month];
            
            if (totalOccurrences !== null && totalOccurrences !== undefined && !Number.isNaN(totalOccurrences)) {
                reshaped.push({
                    country: row["country"],
                    month: month,
                    "Avg Per Year (all)": row["Avg Per Year (all)"],
                    "Total Occurrences": totalOccurrences
                });
            }
        });
    });
  
    return reshaped;
};

  

const GBIFCountryOccurrences = () => {
    const reshapedData = reshapeCountryData(countryStatsGBIF);
  
    return (
        <div
            className="relative"
            style={{
                width: "80%",
                height: "80vh", 
                margin: "0 auto",
            }}
        >
            <RadialHeatmap
                data={reshapedData}
                segmentField="month"
                ringField="Avg Per Year (all)"
                valueField="Total Occurrences"
                title="Monthly Shark Occurrences"
            />
        </div>
    );
};  

export default GBIFCountryOccurrences;

    