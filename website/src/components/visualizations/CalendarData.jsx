import React, { useState, useMemo } from "react";

import ChartPlaceholder from "../charts/ChartPlaceholder.jsx";
import BarChart from "../charts/BarChart.jsx";
import Heatmap from "../charts/Heatmap.jsx";

import calendarStatsGBIF from "../../assets/data/json/gbif_calendar_stats.json";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
const reshapeYearData = (rawData) => {
    const byYear = {};
    rawData.forEach((row) => {
        const year = row["year"];
        
        byYear[year] = months.map((month) => ({
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

        months.forEach((month) => {
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
    
const GBIFCalendarOccurrences = ({ variant = "bar", selectedYear }) => {
    const reshaped = useMemo(() => reshapeYearData(calendarStatsGBIF), []);
    const years = useMemo(() => Object.keys(reshaped).sort((a, b) => b - a), [reshaped]);
    
    const heatmapData = useMemo(() => flattenToHeatmapFormat(calendarStatsGBIF), []);
    
    const monthlyData = useMemo(() => {
        return reshaped[selectedYear] || [];
    }, [selectedYear, reshaped]);
        
    if (variant === "heatmap") {
        const [selectedDecade, setSelectedDecade] = useState("");
        
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
        
        const filteredHeatmapData = useMemo(() => {
            if (selectedDecade === "All") return heatmapData;

            const decadeYears = decadeGroups[selectedDecade] || [];
            return heatmapData.filter((d) => decadeYears.includes(String(d.year)));
        }, [selectedDecade, heatmapData, decadeGroups]);
        
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
            </div>
        );
    }
            
    // Default bar chart mode
    return (
        <div
            className="card-data-wrapper"
            style={{
                width: "100%",
                height: "100%",
                minWidth: "300px",
                minHeight: "300px",
                padding: "1rem 0.5rem",
            }}
        >
            {monthlyData.length > 0 ? (
                <BarChart
                    data={monthlyData}
                    title={`Shark Records by Month — ${selectedYear}`}
                />
            ) : (
                selectedYear ? (
                    <p style={{ textAlign: "center" }}>No data available for this year.</p>
                ) : (
                    <ChartPlaceholder type="bar" message="Select a year to see monthly records" />
                )
            )}
        </div>
    );
};

export default GBIFCalendarOccurrences;
