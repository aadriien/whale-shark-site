import React, { useState, useMemo } from "react";
import BarChart from "../charts/BarChart.jsx";
import calendarStatsGBIF from "../../assets/data/json/gbif_calendar_stats.json"; 

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const reshapeYearData = (rawData) => {
    const byYear = {};
    rawData.forEach(row => {
        const year = row["year"];
        byYear[year] = months.map(month => ({
            label: month,
            value: +row[month] || 0
        }));
    });
    return byYear; // { 2025: [...], 2024: [...] }
};

const GBIFCalendarOccurrences = () => {
    const reshaped = useMemo(() => reshapeYearData(calendarStatsGBIF), []);
    const years = useMemo(() => Object.keys(reshaped).sort((a, b) => b - a), [reshaped]);
    const [selectedYear, setSelectedYear] = useState(years[0] || "");
    
    const monthlyData = useMemo(() => {
        return reshaped[selectedYear] || [];
    }, [selectedYear, reshaped]);
    
    return (
        <div className="yearly-bar-chart" 
            style={{ 
                width: "100%", 
                height: "100%", 
                minWidth: "300px",
                minHeight: "300px",
                padding: "1rem 0.5rem", 
            }}>
            <label htmlFor="year-select" style={{ display: "block" }}>
                Select a <span style={{ fontWeight: "bold" }}>year</span>:
            </label>
            <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
            >
                <option value="">-- Choose a year --</option>
                {years.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>
                
            {monthlyData.length > 0 ? (
                <BarChart
                    data={monthlyData}
                    title={`Shark Records by Month — ${selectedYear}`}
                />
            ) : (
                <p style={{ textAlign: "center" }}>
                    {selectedYear ? "No data available for this year." : "Select a year to view data."}
                </p>
            )}
        </div>
    );
};

export default GBIFCalendarOccurrences;

                