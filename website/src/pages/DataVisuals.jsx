import DataOverview from "../components/charts/DataOverview.jsx";

import CalendarData from "../components/visualizations/CalendarData.jsx";
import SexLifeStageData from "../components/visualizations/SexLifeStageData.jsx";

import ContinentData from "../components/visualizations/ContinentData.jsx";
import CountryData from "../components/visualizations/CountryData.jsx";
import PublishingCountryData from "../components/visualizations/PublishingCountryData.jsx";

import DataGrid from "../components/DataGrid.jsx";

function DataVisuals() {
    return (
        <div className="page-content">
            {/* <h1>DataVisuals Page</h1> */}

            <div className="full-data-grid">

                <div className="grid-section section-calendar">
                    <h1 className="section-title">Calendar Data Metrics</h1>
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

                        <div><CalendarData variant="bar" /></div>
                        <div><CalendarData variant="heatmap" /></div>
                        
                        <div><SexLifeStageData /></div>
                    </DataGrid>
                </div>

                <div className="grid-section section-continent">
                    <h1 className="section-title">Continent Data Metrics</h1>
                    <DataGrid>
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

                        <div><ContinentData variant="radial-heatmap" /></div>
                        <div><ContinentData variant="bar" /></div>
                    </DataGrid>
                </div>


                <div className="grid-section section-country">
                    <h1 className="section-title">Country Data Metrics</h1>
                    <DataGrid>
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

                        <div><CountryData variant="radial-heatmap" /></div>
                        <div><CountryData variant="bar" /></div>
                    </DataGrid>
                </div>

                <div className="grid-section section-publishing">
                    <h1 className="section-title">Publishing Country Data Metrics</h1>
                    <DataGrid>
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

                        <div><PublishingCountryData variant="radial-heatmap" /></div>
                        <div><PublishingCountryData variant="bar" /></div>
                    </DataGrid>
                </div>

            </div>
        </div>
    );
}

export default DataVisuals;


