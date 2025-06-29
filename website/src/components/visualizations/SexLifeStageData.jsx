import React, { useState, useMemo } from "react";
import RadialHeatmap from "../charts/RadialHeatmap.jsx";
import calendarStatsGBIF from "../../assets/data/json/gbif_calendar_stats.json";

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


const GBIFSexLifeStageOccurrences = () => {
    const yearOptions = useMemo(() => {
        return [...new Set(calendarStatsGBIF.map(d => d.year))].sort((a, b) => b - a);
    }, []);
    
    const [selectedYear, setSelectedYear] = useState("");
    
    const { ringsData, pieData } = useMemo(() => 
        reshapeSexLifeStageData(calendarStatsGBIF, selectedYear),
        [selectedYear]
    );
    
    return (
        <div className="card-data-wrapper"
            style={{
                width: "100%",
                height: "100%",
                minWidth: "300px",
                minHeight: "300px",
                padding: "1rem 0.5rem",
            }}
        >
            <label htmlFor="year-select" style={{ display: "block" }}>
                Select a <span style={{ fontWeight: "bold" }}>year</span>:
            </label>
            <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
            >
                <option value="">-- Choose a year --</option>
                {yearOptions.map(year => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>
            
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
                <p style={{ textAlign: "center" }}>
                    {selectedYear ? "No data available for this year." : "Select a year to view data."}
                </p>
            )}
        </div>
    );
};

export default GBIFSexLifeStageOccurrences;
