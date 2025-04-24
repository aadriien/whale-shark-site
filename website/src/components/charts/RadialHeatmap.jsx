import React, { useEffect, useRef } from "react";
import * as d3 from "d3";


const RadialHeatmap = ({ 
    data,             
    segmentField,     // Field name for slice segments (e.g. "month")
    ringField,        // Field name for rings (e.g. "year")
    valueField,       // Field name for values (e.g. "total occurrences")
    title = "Radial Heatmap",
    className = "radial-heatmap",
    pieData = []      // Pie chart in center (e.g. "human/machine observation")
}) => {
    const svgRef = useRef(null);
    
    useEffect(() => {
        if (!data || data.length === 0) return;
        
        // Clear any existing visual / renders
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Get container dimensions from actual rendered <svg>
        const { width, height } = svgRef.current.getBoundingClientRect();

        const margin = { top: 40, right: 120, bottom: 40, left: 40 };
        const innerRadius = Math.min(width, height) * 0.1;
        const outerRadius = Math.min(width, height) / 2 - Math.max(...Object.values(margin));

        // Create main chart group (radial heatmap + legend)
        const chartGroup = svg
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const segments = [...new Set(data.map(d => d[segmentField]))];
        const rings = [...new Set(data.map(d => d[ringField]))].sort();

        const total = d3.sum(data, d => +d[valueField]);
        
        // Angular scale for segments (e.g. months) as percentage of total
        const angleScale = d3.scaleLinear()
            .domain([0, total])
            .range([0, 2 * Math.PI]);
        
        // Radius scale for rings (e.g. years)
        const radiusScale = d3.scaleBand()
            .domain(rings)
            .range([innerRadius, outerRadius]);
        
        // Dynamic color scale for segment values 
        const segmentColorScale = d3.scaleSequential()
            .domain([0, segments.length - 1])  
            .interpolator(d3.interpolateSpectral);  

        // Draw cells (segments in heatmap)
        let currentAngle = 0;

        data.forEach(d => {
            const segment = d[segmentField];
            const ring = d[ringField];
            const value = +d[valueField] || 0;
            
            // Calculate dimensions
            const innerRad = radiusScale(ring);
            const outerRad = innerRad + radiusScale.bandwidth();

            // Calculate angular width for segment based on total
            const angleWidth = (value / total) * 2 * Math.PI; 

            const startAngle = currentAngle;
            const endAngle = currentAngle + angleWidth;
            currentAngle = endAngle; 

            if (startAngle === undefined || innerRad === undefined) return;
            
            // Create arc
            const arc = d3.arc()
                .innerRadius(innerRad)
                .outerRadius(outerRad)
                .startAngle(startAngle)
                .endAngle(endAngle);
            
            const group = chartGroup.append("g");

            group.append("path")
                .attr("d", arc)
                .attr("fill", segmentColorScale(segments.indexOf(segment)))
                .attr("stroke", "#fff")
                .attr("stroke-width", 0.5);

            // This label only appears on hover
            group.append("title")
                .text(`${segment}: ${value}`);
        });
        
        // Title at top of chart
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(title);

        // If pieData provided, create pie chart in center
        if (pieData.length > 0) {
            const pieRadius = Math.min(width, height) * 0.2; 
            const pieGroup = svg.append("g")
                .attr("transform", `translate(${width / 2}, ${height / 2})`);

            // Define pie chart layout
            const pie = d3.pie().value(d => d.value);
            const arc = d3.arc().innerRadius(0).outerRadius(pieRadius);
            const color = d3.scaleOrdinal(d3.schemePastel2);

            // Create slices
            const slices = pie(pieData);
            pieGroup.selectAll("path")
                .data(slices)
                .enter()
                .append("path")
                .attr("d", arc)
                .attr("fill", (d, i) => color(i))
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .append("title")
                .text(d => `${d.data.label}: ${d.data.value}`);
            
            // Add labels to the pie chart
            pieGroup.selectAll("text")
                .data(slices)
                .enter()
                .append("text")
                .attr("transform", d => `translate(${arc.centroid(d)})`)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .text(d => d.data.label);
        }

        // Create external legend to map segment colors (matches segmentField values)
        const legendGroup = svg.append("g")
            .attr("transform", `translate(${width / 2 + 240}, ${height / 2 - 150})`);

        segments.forEach((segment, i) => {
            legendGroup.append("rect")
                .attr("x", 0)
                .attr("y", i * 26)
                .attr("width", 14)
                .attr("height", 14)
                .attr("fill", segmentColorScale(segments.indexOf(segment))); 

            legendGroup.append("text")
                .attr("x", 20)
                .attr("y", i * 26 + 12)
                .attr("font-size", "16px")
                .text(() => {
                    const totalForSegment = d3.sum(data.filter(
                        d => d[segmentField] === segment
                    ), d => d[valueField]);
                    return `${segment} — ${totalForSegment}`;
                });
        });
        
    }, [data, segmentField, ringField, valueField, title, pieData]);

    return (
        <svg ref={svgRef} className={className} style={{ width: "100%", height: "100%" }} />
    );
};

export default RadialHeatmap;

