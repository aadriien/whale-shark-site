import { useState, useMemo } from "react";

import ChartPlaceholder from "../charts/ChartPlaceholder";
import Heatmap from "../charts/Heatmap";

import { MONTHS } from "../../utils/DataUtils.js";

import calendarStatsGBIF from "../../assets/data/json/gbif_calendar_stats.json";

    
const reshapeYearData = (rawData) => {
    const byYear = {};
    rawData.forEach((row) => {
        const year = row["year"];
        
        byYear[year] = MONTHS.map((month) => ({
            label: month,
            value: +row[month] || 0,
        }));
    });
    return byYear;
};
    
const flattenToHeatmapFormat = (rawData) => {
    const heatmapData = [];
    rawData.forEach((row) => {
        const year = row["year"];

        MONTHS.forEach((month) => {
            heatmapData.push({
                year: year,
                month: month,
                value: +row[month] || 0,
            });
        });
    });
    return heatmapData;
};
    
const getDecadeTickFormatter = (yearsArray) => {
    const shown = new Set();
    const validDecades = new Set(
        yearsArray.map((y) => Math.floor(y / 10) * 10)
    );

    return (year) => {
        const decade = Math.floor(+year / 10) * 10;
        if (validDecades.has(decade) && !shown.has(decade)) {
            shown.add(decade);
            return `${decade}`;
        }
        return "";
    };
};
    
const GBIFDecadeOccurrences = () => {
    const [selectedDecade, setSelectedDecade] = useState("");

    const reshaped = useMemo(() => reshapeYearData(calendarStatsGBIF), []);
    const years = useMemo(() => Object.keys(reshaped).sort((a, b) => b - a), [reshaped]);
    
    const heatmapData = useMemo(() => flattenToHeatmapFormat(calendarStatsGBIF), []);
    
    const decadeGroups = useMemo(() => {
        const byDecade = {};

        // Organize heatmap display by decade (group years)
        years.forEach((year) => {
            const decade = Math.floor(year / 10) * 10;
            const key = `${decade}s`;

            if (!byDecade[key]) byDecade[key] = [];
            byDecade[key].push(year);
        });
        return byDecade;
    }, [years]);
    
    return (
        <>
            <label htmlFor="heatmap-decade-select" style={{ display: "block" }}>
                Select a <span style={{ fontWeight: "bold" }}>decade</span>:
            </label>

            <select
                id="heatmap-decade-select"
                value={selectedDecade}
                onChange={(e) => setSelectedDecade(e.target.value)}
            >
                <option value="">-- Choose a decade --</option>
                <option value="All">All Years</option>
                {Object.keys(decadeGroups)
                    // Ensure chronological display with most recent at top
                    .sort((a, b) => b.localeCompare(a))
                    .map((decade) => (
                        <option key={decade} value={decade}>
                            {decade}
                        </option>
                ))}
            </select>

            {(selectedDecade && (selectedDecade === "All" || decadeGroups[selectedDecade])) ? (
                <Heatmap
                    data={
                        selectedDecade === "All"
                        ? heatmapData
                        : heatmapData.filter(
                            d => decadeGroups[selectedDecade].includes(String(d.year))
                        )
                    }
                    title={
                        selectedDecade === "All"
                        ? "Monthly Records Heatmap (All Years)"
                        : `Monthly Records Heatmap — ${selectedDecade}`
                    }
                    yTickFormatter={
                        selectedDecade === "All"
                        ? getDecadeTickFormatter(heatmapData.map(d => +d.year))
                        : undefined
                    }
                />
            ) : (
                selectedDecade ? (
                    <p style={{ textAlign: "center" }}>No data available for this decade.</p>
                ) : (
                    <ChartPlaceholder type="heatmap" message="Select a decade to see heatmap" />
                )
            )}
        </>
    );
};

export default GBIFDecadeOccurrences;
