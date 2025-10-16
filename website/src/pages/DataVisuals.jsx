import CalendarData from "../components/visualizations/CalendarData.jsx";
import ContinentData from "../components/visualizations/ContinentData.jsx";
import CountryData from "../components/visualizations/CountryData.jsx";
import PublishingCountryData from "../components/visualizations/PublishingCountryData.jsx";


function DataVisuals() {
    return (
        <div className="page-content">
            <div className="full-data-grid">

                <div className="grid-section section-calendar">
                    <CalendarData />
                </div>

                <div className="grid-section section-continent">
                    <ContinentData />
                </div>

                <div className="grid-section section-country">
                    <CountryData />
                </div>

                <div className="grid-section section-publishing">
                    <PublishingCountryData />
                </div>

            </div>
        </div>
    );
}

export default DataVisuals;


