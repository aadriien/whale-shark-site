function SharkSelector({ sharks, onReset, onSelect, selectedSharkId }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }} >
            <button 
                onClick={onReset}
                className={selectedSharkId == null ? "active" : ""}
            >
                <span className="all-sharks-button-text">Show All Sharks</span>
            </button>
        
            <div className="shark-selector-list">
                {sharks.map((shark) => (
                    <div className={`shark-selector-item ${shark.id === selectedSharkId ? 'selected' : ''}`}
                        key={shark.id}
                        onClick={() => onSelect(shark.id)}
                    >
                        {shark.id}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SharkSelector;
        