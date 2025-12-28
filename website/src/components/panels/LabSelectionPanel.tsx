import { useMemo } from "react";

import ChartPlaceholder from "../charts/ChartPlaceholder";

import DataOverview from "../charts/DataOverview";
import Heatmap from "../charts/Heatmap";
import SexLifeStageData from "../visualizations/SexLifeStageData";

import { createSummaryDataset, createCalendarHeatmapData } from "../../utils/SelectedSharksData";

import { LabSelectionPanelProps } from "../../types/pages";


function LabSelectionPanel({ 
    selectedSharksForLab, 
    savedIds, 
    sharks,
    onSelectAllToggle 
}: LabSelectionPanelProps) {

    const selectedSharks = useMemo(() => {
        if (selectedSharksForLab.size === 0) return [];
        return sharks.filter(shark => selectedSharksForLab.has(shark.id));
    }, [selectedSharksForLab, sharks]);

    const selectedSharksDataset = useMemo(() => {
        if (selectedSharks.length === 0) return [];
        return createSummaryDataset(selectedSharks);
    }, [selectedSharks]);

    const selectedSharksHeatmapData = useMemo(() => {
        if (selectedSharksForLab.size === 0) return [];
        return createCalendarHeatmapData(selectedSharksForLab);
    }, [selectedSharksForLab]);

    return (
        <>
            <div className="multi-select-info">

                <div className="multi-select-header">
                    <h4>Selected for Lab ({selectedSharksForLab.size}):</h4>
                    <label className="select-all-container">
                        <input 
                            type="checkbox" 
                            checked={
                                selectedSharksForLab.size > 0 && 
                                Array.from(savedIds).every(id => selectedSharksForLab.has(id))
                            }
                            onChange={onSelectAllToggle}
                            className="select-all-checkbox"
                        />
                        Add all saved whale sharks
                    </label>
                </div>

                <div className="selected-sharks-list">
                    {selectedSharksForLab.size > 0 
                        ? Array.from(selectedSharksForLab).join(", ") 
                        : "None in lab"
                    }
                </div>

            </div>

            <div className="overview-container">
                <DataOverview 
                    dataset={selectedSharksDataset}
                    filterField="lab" // special key word for DataOverview
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
                        title={`Lab Sharks Record Timeline`}
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

