import React, { useMemo } from "react";

import ChartPlaceholder from "../charts/ChartPlaceholder.jsx";
import RadialHeatmap from "../charts/RadialHeatmap.jsx";
import { cleanLifestage } from "../../utils/DataUtils.js";


// Define Sex & Life Stage keys for calendar stats
const sexOptions = ["Sex: Female", "Sex: Male", "Sex: Unknown"];
const lifeStageOptions = {
    "Life Stage: Adult": "Adl",
    "Life Stage: Immature": "Imm",
    "Life Stage: Juvenile": "Juv",
    "Life Stage: Mature": "Mat",
    "Life Stage: Subadult": "Sub",
    "Life Stage: Unknown": "Unk"
};


// Process calendar stats data (year-based)
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


// Process shark arrays (flexible mode)
const createSexLifeStageFromSharks = (sharks) => {
    if (!sharks || sharks.length === 0) {
        return { ringsData: [], pieData: [] };
    }

    const lifeStageCount = {};
    const sexCount = { Male: 0, Female: 0, Unknown: 0 };

    sharks.forEach(shark => {
        const sex = shark.sex || 'Unknown';
        if (sexCount.hasOwnProperty(sex)) {
            sexCount[sex]++;
        } 
        else {
            sexCount.Unknown++;
        }

        // Process life stage with cleanLifestage helper for latest non-unknown
        const lifeStage = cleanLifestage(shark);
        
        // Map to abbreviated string form 
        const lifeStageKey = `Life Stage: ${lifeStage}`;
        const abbreviatedStage = lifeStageOptions[lifeStageKey] || 'Unk';
        
        if (lifeStageCount[abbreviatedStage]) {
            lifeStageCount[abbreviatedStage]++;
        } 
        else {
            lifeStageCount[abbreviatedStage] = 1;
        }
    });

    // Create rings data for life stages
    const ringsData = Object.entries(lifeStageCount)
        .filter(([stage, count]) => count > 0)
        .map(([stage, count]) => ({
            lifeStageCategory: 'Life Stage',
            lifeStageSegment: stage,
            lifeStageCount: count
        }));

    // Create pie data for sex distribution (as percentages)
    const totalSex = Object.values(sexCount).reduce((acc, count) => acc + count, 0);
    const pieData = totalSex === 0 ? [] : ['Male', 'Female', 'Unknown']
        .filter(sex => sexCount[sex] > 0)
        .map(sex => ({
            label: sex,
            value: ((sexCount[sex] / totalSex) * 100)
        }));

    return { ringsData, pieData };
};


const SexLifeStageData = ({ 
    selectedYear, 
    dataset, 
    sharks,
    title
}) => {
    const { ringsData, pieData } = useMemo(() => {
        // If sharks array provided, use flexible mode (GeoLabs)
        if (sharks) {
            return createSexLifeStageFromSharks(sharks);
        }
        // Otherwise use dataset with selectedYear (DataVisuals)
        return reshapeSexLifeStageData(dataset, selectedYear);
    }, [sharks, dataset, selectedYear]);
    
    // Determine appropriate title
    const chartTitle = title ||
        (sharks 
            ? `Lab Sharks Life Stage & Sex`
            : `Sharks by Life Stage & Sex — ${selectedYear}`);
    
    return (
        <>   
            {ringsData.length > 0 ? (
                <RadialHeatmap
                    data={ringsData}
                    segmentField="lifeStageSegment"    // life stage categories (e.g. Adult, Immature, etc)
                    ringField="lifeStageCategory"      // "Life Stage" fixed ring name
                    valueField="lifeStageCount"        // counts for each life stage segment
                    pieData={pieData}                  // sex distribution pie slices inside center
                    title={chartTitle}
                />
            ) : (
                // Handle empty states appropriately
                sharks ? (
                    sharks.length === 0 ? (
                        <ChartPlaceholder 
                            type="radialHeatmap" 
                            message="Add sharks for lifeStage and sex" 
                        />
                    ) : (
                        <p style={{ textAlign: "center" }}>
                            No data available for selected sharks.
                        </p>
                    )
                ) : (
                    selectedYear ? (
                        <p style={{ textAlign: "center" }}>
                            No data available for this year.
                        </p>
                    ) : (
                        <ChartPlaceholder 
                            type="radialHeatmap" 
                            message="Select a year to see lifeStage and sex" 
                        />
                    )
                )
            )}
        </>
    );
};

export default SexLifeStageData;

