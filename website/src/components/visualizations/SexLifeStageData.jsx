import React, { useMemo } from "react";

import ChartPlaceholder from "../charts/ChartPlaceholder.jsx";
import RadialHeatmap from "../charts/RadialHeatmap.jsx";

// Define Sex & Life Stage keys
const sexOptions = ["Sex: Female", "Sex: Male", "Sex: Unknown"];
const lifeStageOptions = {
    "Life Stage: Adult": "Adl",
    "Life Stage: Immature": "Imm",
    "Life Stage: Juvenile": "Juv",
    "Life Stage: Mature": "Mat",
    "Life Stage: Subadult": "Sub",
    "Life Stage: Unknown": "Unk"
};


const reshapeSexLifeStageData = (rawData, selectedYear) => {
    const row = rawData.find(d => String(d.year) === String(selectedYear));
    if (!row) return { ringsData: [], pieData: [] };
    
    // Outer ring data: ring = "Life Stage", segments = each life stage category
    const ringsData = Object.entries(lifeStageOptions)
        .map(([fullKey, shortLabel]) => ({
            lifeStageCategory: "Life Stage",       // constant ring name
            lifeStageSegment: shortLabel,          // truncated segment label
            lifeStageCount: +row[fullKey] || 0     // value from raw data
        }))
        .filter(d => d.lifeStageCount > 0);
    
    // Inner pie data: sex counts turned into percentages
    const totalSex = sexOptions.reduce((acc, key) => acc + (+row[key] || 0), 0);
    const pieData = totalSex === 0 ? [] : sexOptions.map(key => ({
        label: key.replace("Sex: ", ""),
        value: ((+row[key] || 0) / totalSex) * 100
    }));
    
    return { ringsData, pieData };
};


const GBIFSexLifeStageOccurrences = ({ selectedYear, dataset }) => {
    const { ringsData, pieData } = useMemo(() => 
        reshapeSexLifeStageData(dataset, selectedYear),
        [selectedYear, dataset]
    );
    
    return (
        <>   
            {ringsData.length > 0 ? (
                <RadialHeatmap
                    data={ringsData}
                    segmentField="lifeStageSegment"    // life stage categories (e.g. Adult, Immature, etc)
                    ringField="lifeStageCategory"      // "Life Stage" fixed ring name
                    valueField="lifeStageCount"        // counts for each life stage segment
                    pieData={pieData}                  // sex distribution pie slices inside center
                    title={`Sharks by Life Stage & Sex — ${selectedYear}`}
                />
            ) : (
                selectedYear ? (
                    <p style={{ textAlign: "center" }}>No data available for this year.</p>
                ) : (
                    <ChartPlaceholder type="radialHeatmap" message="Select a year to see lifeStage and sex" />
                )
            )}
        </>
    );
};

export default GBIFSexLifeStageOccurrences;
