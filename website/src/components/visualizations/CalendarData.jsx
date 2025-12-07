import { useMemo, useState } from "react";

import DataMetricFilter from "./DataMetricFilter";

import DataOverview from "../charts/DataOverview";
import DataGrid from "../DataGrid";

import DecadeData from "./DecadeData";
import SexLifeStageData from "./SexLifeStageData.jsx";

import ChartPlaceholder from "../charts/ChartPlaceholder";
import BarChart from "../charts/BarChart";

import { MONTHS } from "../../utils/DataUtils";

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
    
const GBIFCalendarOccurrences = () => {
    const [selectedYear, setSelectedYear] = useState(""); 

    const reshaped = useMemo(() => reshapeYearData(calendarStatsGBIF), []);    
    const monthlyData = useMemo(() => reshaped[selectedYear] || [], [selectedYear, reshaped]);
        
    return (
        <>
            <div className="section-header">
                <h1 className="section-title">Calendar Data Metrics</h1>

                <DataMetricFilter
                    label="Year"
                    field="year"
                    data={calendarStatsGBIF}
                    selectedValue={selectedYear}
                    onChange={setSelectedYear}
                    inline={true} /* toggles display of "select a year" */
                />
            </div>

            <DataGrid>
                <div className="card-data-wrapper">
                    <DecadeData />
                </div>
                
                <div className="card-data-wrapper">
                    <DataOverview 
                        dataset="calendar" 
                        filterField="year"
                        selectedFilter={selectedYear}
                        displayFields={[
                            { label: "Total Occurrences", field: "Total Occurrences" },
                            { label: "Unique Sharks (with ID)", field: "Unique Sharks (with ID)" },
                            { label: "Top 3 Publishing Countries", field: "Top 3 Publishing Countries" }
                        ]}
                    />
                </div>

                <div className="card-data-wrapper">
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

                <div className="card-data-wrapper">
                    <SexLifeStageData selectedYear={selectedYear} dataset={calendarStatsGBIF} />
                </div>
            </DataGrid>
        </>
    );
};

export default GBIFCalendarOccurrences;
