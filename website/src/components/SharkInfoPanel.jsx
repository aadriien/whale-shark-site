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
            <div className="shark-panel-details">
                <h2>{shark.id}</h2>
                <p><strong>TBD:</strong> {shark.TBD}</p>
                <p><strong>TBD:</strong> {shark.TBD}</p>
                <p><strong>TBD:</strong> {shark.TBD}</p>
            </div>
        </div>
    );
}
        
export default SharkInfoPanel;
        