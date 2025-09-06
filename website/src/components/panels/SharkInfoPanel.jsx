import { 
    getDate, 
    parseSpecificRegion, 
    parseRemarks, 
} from "../../utils/DataUtils.js";

import FavoriteButton from "../controls/FavoriteButton.jsx";
import SharkMediaGallery from "../cards/SharkMediaGallery.jsx";


const SharkInfoPanel = ({ shark }) => {
    if (!shark) {
        return (
            <div className="shark-info-panel">
                <h2>All Sharks Overview</h2>
                <p>Select a shark to view detailed tracking information.</p>
            </div>
        );
    }

    const countries = shark.countries.split(",").map(s => s.trim());
    const regions = shark.regions ? shark.regions.split(",").map(s => s.trim()) : [];
    const publishing = shark.publishing ? shark.publishing.split(",").map(s => s.trim()) : [];
    
    // Don't split remarks by comma (show full remarks for all locations)
    const fullRemarks = shark.remarks || "";
    
    return (
        <div className="shark-info-panel">
            <h2>
                ID: {shark.id}
                <FavoriteButton sharkId={shark.id} />
            </h2>

            <div className="shark-panel-details">
                <div className="shark-traits">
                    <p className="shark-details"><strong>Sex:</strong>&nbsp; {shark.sex}</p>
                    <p className="shark-details"><strong>Life Stage:</strong>&nbsp; {shark.lifeStage}</p>
                </div>

                <div className="shark-records">
                    <h3 className="shark-details"><strong>Total Records:</strong>&nbsp; {shark.occurrences}</h3>
                    <p className="shark-details">
                        {shark.oldest} &nbsp;...&nbsp; {shark.newest}
                    </p>
                    <p className="shark-details">
                        <strong>Satellite tracking:</strong>&nbsp;&nbsp;
                        {Math.round(
                            (shark.machine / (shark.machine + shark.human)
                        ) * 100)}%
                    </p>
                    <p className="shark-details">
                        <strong>Human sightings:</strong>&nbsp;&nbsp;
                        {Math.round(
                            (shark.human / (shark.machine + shark.human)
                        ) * 100)}%
                    </p>
                </div>

                <div className="shark-regions">
                    <h3 className="shark-details">Places Visited</h3>
                    <ul className="timeline-list">
                        {countries.map((country, index) => {
                            const regionEntry = regions[index] || "Unknown";
                            const publishingEntry = publishing[index] || "Unspecified";
                            // Show full remarks for all locations (don't split by comma)
                            const remarksEntry = fullRemarks || "None";
                      
                            const regionDate = getDate(regionEntry);
                            const fallbackDate = getDate(country);
                            const displayDate = regionDate !== "Unknown" ? regionDate : fallbackDate;

                            return (
                                <li key={index} className="timeline-item">
                                    <div className="timeline-header">
                                        <strong>{parseSpecificRegion(country)}</strong>
                                        {" "}
                                        <span className="timeline-date">({displayDate})</span>
                                    </div>
                                    <div className="timeline-region">
                                        <span className="timeline-label">Region:</span>
                                        {" "}
                                        <em>{regionEntry !== "Unknown" ? parseSpecificRegion(regionEntry) : "Unspecified"}</em>
                                    </div>
                                    <div className="timeline-meta">
                                        <span className="timeline-label">Published by:</span>
                                        {" "}
                                        <em>{publishingEntry !== "Unknown" ? publishingEntry : "Unspecified"}</em>
                                    </div>
                                    <div className="timeline-remarks">
                                        <span className="timeline-label">Sighting remarks:</span> 
                                        {" "}
                                        <em>{remarksEntry !== "Unknown" ? parseRemarks(remarksEntry) : "None"}</em>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <SharkMediaGallery shark={shark} />
            </div>

        </div>
    );
}
        
export default SharkInfoPanel;

        