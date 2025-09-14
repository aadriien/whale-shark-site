import { useMemo } from 'react';

import ChartPlaceholder from '../charts/ChartPlaceholder.jsx';

import DataOverview from '../charts/DataOverview.jsx';
import Heatmap from '../charts/Heatmap.jsx';
import SexLifeStageData from '../visualizations/SexLifeStageData.jsx';

import { createSummaryDataset, createCalendarHeatmapData } from '../../utils/SelectedSharksData.js';


function LabSelectionPanel({ 
    selectedSharksForLab, 
    savedIds, 
    sharks,
    onSelectAllToggle 
}) {
    const selectedSharksDataset = useMemo(() => {
        if (selectedSharksForLab.size === 0) return [];

        const selectedIds = Array.from(selectedSharksForLab);
        const selectedSharks = sharks.filter(shark => selectedIds.includes(shark.id));

        return createSummaryDataset(selectedSharks);
    }, [selectedSharksForLab, sharks]);
    
    const selectedSharksHeatmapData = useMemo(() => {
        if (selectedSharksForLab.size === 0) return [];
        return createCalendarHeatmapData(selectedSharksForLab);
    }, [selectedSharksForLab]);
    
    const selectedSharks = useMemo(() => {
        if (selectedSharksForLab.size === 0) return [];
        const selectedIds = Array.from(selectedSharksForLab);
        return sharks.filter(shark => selectedIds.includes(shark.id));
    }, [selectedSharksForLab, sharks]);

    return (
        <>
            <div className="multi-select-info">

                <div className="multi-select-header">
                    <h4>Selected for Lab ({selectedSharksForLab.size}):</h4>
                    <label className="select-all-container">
                        <input 
                            type="checkbox" 
                            checked={selectedSharksForLab.size > 0 && Array.from(savedIds).every(id => selectedSharksForLab.has(id))}
                            onChange={onSelectAllToggle}
                            className="select-all-checkbox"
                        />
                        Add all saved whale sharks
                    </label>
                </div>

                <div className="selected-sharks-list">
                    {selectedSharksForLab.size > 0 
                        ? Array.from(selectedSharksForLab).join(', ') 
                        : 'None in lab'
                    }
                </div>

            </div>

            <div className="overview-container">
                <DataOverview 
                    dataset={selectedSharksDataset}
                    filterField="geolabs" // special key word for DataOverview.jsx
                    selectedFilter={
                        selectedSharksForLab.size > 0 
                        ? `${selectedSharksForLab.size} Selected Sharks` 
                        : ""
                    }
                    displayFields={[
                        { 
                            label: "Total Occurrences", 
                            field: "Total Occurrences" 
                        },
                        { 
                            label: "Top 3 Publishing Countries", 
                            field: "Top 3 Publishing Countries" 
                        }
                    ]}
                />
            </div>
            
            <div className="heatmap-container">
                {selectedSharksForLab.size > 0 && selectedSharksHeatmapData.length > 0 ? (
                    <Heatmap 
                        data={selectedSharksHeatmapData}
                        title={`Lab Sharks Occurrence Timeline`}
                    />
                ) : (
                    <ChartPlaceholder 
                        type="heatmap" 
                        message="Add sharks to lab for heatmap" 
                    />
                )}
            </div>
            
            <div className="radial-heatmap-container">
                <SexLifeStageData 
                    sharks={selectedSharks}
                />
            </div>
        </>
    );
}

export default LabSelectionPanel;

