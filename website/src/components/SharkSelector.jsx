import React, { useState } from 'react';

function SharkSelector({ sharks, onReset, onSelect }) {
    const [selectedSharkId, setSelectedSharkId] = useState(null);
    
    const handleReset = () => {
        setSelectedSharkId(null);
        onReset(); // Parent plots all shark data on globe
    };
    
    const handleSelect = (shark) => {
        setSelectedSharkId(shark.id);
        onSelect(shark.id); // Parent plots only selected shark 
    };
    
    return (
        <div style={{ width: 250, fontFamily: 'sans-serif' }}>
            <button onClick={handleReset} style={{ marginBottom: 10 }}>
                Show All Sharks
            </button>
        
            <div
                style={{
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    maxHeight: 200,
                    overflowY: 'auto',
                    padding: 5,
                }}
            >
                {sharks.map((shark) => (
                    <div
                        key={shark.id}
                        onClick={() => handleSelect(shark)}
                        style={{
                            padding: '8px 10px',
                            cursor: 'pointer',
                            backgroundColor: shark.id === selectedSharkId ? '#007bff' : 'white',
                            color: shark.id === selectedSharkId ? 'white' : 'black',
                            borderRadius: 3,
                            marginBottom: 4,
                            userSelect: 'none',
                        }}
                    >
                        {shark.name}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SharkSelector;
        