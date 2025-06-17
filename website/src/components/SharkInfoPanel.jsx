import { parseImageField } from "../utils/DataUtils.js";

const SharkInfoPanel = ({ shark }) => {
    if (!shark) {
        return (
            <div className="shark-info-panel">
                <h2>All Sharks Overview</h2>
                <p>Select a shark to view detailed tracking information.</p>
            </div>
        );
    }
    
    return (
        <div className="shark-info-panel">
            <h2>ID: {shark.id}</h2>

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
                        {shark.countries.split(",").map((country, index) => (
                            <li key={index} className="timeline-item">{country}</li>
                        ))}
                    </ul>
                </div>

                <div className="shark-images-container">
                    <h3>Media Gallery</h3>
                    {parseImageField(shark.image).map((img, idx) => (
                        <div key={idx} className="shark-image-card">
                            <img src={img.url} alt={`Shark image ${idx}`} />
                            <p className="shark-image-meta">
                                <small>📸 {img.creator} | {img.license}</small>
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
        
export default SharkInfoPanel;
        