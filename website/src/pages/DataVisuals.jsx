import DataOverview from "../components/charts/DataOverview.jsx";

import CalendarData from "../components/visualizations/CalendarData.jsx";
import SexLifeStageData from "../components/visualizations/SexLifeStageData.jsx";

import ContinentData from "../components/visualizations/ContinentData.jsx";
import CountryData from "../components/visualizations/CountryData.jsx";
import PublishingCountryData from "../components/visualizations/PublishingCountryData.jsx";

import DataGrid from "../components/DataGrid.jsx";

function DataVisuals() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            overflowY: "auto", 
            textAlign: "center",
            paddingTop: "60px"
        }}>
            <h1>DataVisuals Page</h1>

            <DataGrid>
                <div>
                    <DataOverview 
                        dataset="calendar" 
                        filterField="year" 
                        displayFields={[
                            { label: "Total Occurrences", field: "Total Occurrences" },
                            { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                            { label: "Top 3 Publishing Countries", field: "Top 3 Publishing Countries" }
                        ]}
                    />
                </div>

                <div>
                    <DataOverview 
                        dataset="continent" 
                        filterField="continent" 
                        displayFields={[
                            { label: "Total Occurrences", field: "Total Occurrences" },
                            { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                            { label: "Top 3 Publishing Countries", field: "Top 3 Publishing Countries" }
                        ]}
                    />
                </div>

                <div>
                    <DataOverview 
                        dataset="country" 
                        filterField="country" 
                        displayFields={[
                            { label: "Total Occurrences", field: "Total Occurrences" },
                            { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                            { label: "Top 3 Publishing Countries", field: "Top 3 Publishing Countries" }
                        ]}
                    />
                </div>

                <div>
                    <DataOverview 
                        dataset="publishingCountry" 
                        filterField="publishingCountry" 
                        displayFields={[
                            { label: "Total Occurrences", field: "Total Occurrences" },
                            { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                            { label: "Top 3 Countries Visited", field: "Top 3 Countries Visited" }
                        ]}
                    />
                </div>

                <div><CalendarData variant="bar" /></div>
                <div><CalendarData variant="heatmap" /></div>
                
                <div><SexLifeStageData /></div>

                <div><CountryData variant="region" /></div>
                <div><CountryData variant="bar" /></div>

                <div><PublishingCountryData /></div>
                <div><ContinentData /></div>
            </DataGrid>
            
        </div>
    );
}

export default DataVisuals;


