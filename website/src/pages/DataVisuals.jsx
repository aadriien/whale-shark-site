import { useState } from "react";

import CalendarData from "../components/visualizations/CalendarData.jsx";
import ContinentData from "../components/visualizations/ContinentData.jsx";
import CountryData from "../components/visualizations/CountryData.jsx";
import PublishingCountryData from "../components/visualizations/PublishingCountryData.jsx";


function DataVisuals() {
    const [selectedContinent, setSelectedContinent] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedPublishingCountry, setSelectedPublishingCountry] = useState("");
    const [selectedYear, setSelectedYear] = useState(""); 

    return (
        <div className="page-content">
            <div className="full-data-grid">

                <div className="grid-section section-calendar">
                    <CalendarData
                        selectedYear={selectedYear}
                        onChange={setSelectedYear}
                    />
                </div>

                <div className="grid-section section-continent">
                    <ContinentData
                        selectedRegion={selectedContinent}
                        onChange={setSelectedContinent}
                    />
                </div>

                <div className="grid-section section-country">
                    <CountryData
                        selectedRegion={selectedCountry}
                        onChange={setSelectedCountry}
                    />
                </div>

                <div className="grid-section section-publishing">
                    <PublishingCountryData
                        selectedRegion={selectedPublishingCountry}
                        onChange={setSelectedPublishingCountry}
                    />
                </div>

            </div>
        </div>
    );
}

export default DataVisuals;


