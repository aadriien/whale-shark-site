import React, { useEffect, useRef } from "react";
import * as d3 from "d3";


const RadialHeatmap = ({ 
    data,             
    segmentField,     // Field name for slice segments (e.g. "month")
    ringField,        // Field name for rings (e.g. "year")
    valueField,       // Field name for values (e.g. "sightings")
    colorRange = ["#f7fbff", "#08306b"], 
    title = "Radial Heatmap",
    className = "radial-heatmap"
}) => {
    const svgRef = useRef(null);
    
    useEffect(() => {
        if (!data || data.length === 0) return;
        
        // Get container dimensions from actual DOM element 
        const container = d3.select(svgRef.current);
        const containerWidth = container.node().getBoundingClientRect().width;
        const containerHeight = container.node().getBoundingClientRect().height;
        
        // Clear any existing visual, then extract unique segment + ring values
        container.selectAll("*").remove();
        
        const segments = [...new Set(data.map(d => d[segmentField]))];
        const rings = [...new Set(data.map(d => d[ringField]))];
        rings.sort(); 
        
        // Set up dimensions based on container
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };
        const innerRadius = Math.min(containerWidth, containerHeight) * 0.1;
        const outerRadius = Math.min(containerWidth, containerHeight) / 2 - margin.top;
        
        // Create SVG
        const svg = container
            .append("g")
            .attr("transform", `translate(${containerWidth / 2},${containerHeight / 2})`);
        
        // Angular scale for segments (e.g. months)
        const angleScale = d3.scaleBand()
            .domain(segments)
            .range([0, 2 * Math.PI]);
        
        // Radius scale for rings (e.g. years)
        const radiusScale = d3.scaleBand()
            .domain(rings)
            .range([innerRadius, outerRadius]);
        
        // Color scale for values
        const colorScale = d3.scaleSequential()
            .domain([0, d3.max(data, d => d[valueField])])
            .interpolator(d3.interpolateRgb(colorRange[0], colorRange[1]));
        
        // Draw cells
        data.forEach(d => {
            const segment = d[segmentField];
            const ring = d[ringField];
            const value = d[valueField];
            
            // Calculate dimensions
            const innerRad = radiusScale(ring);
            const outerRad = innerRad + radiusScale.bandwidth();
            const startAngle = angleScale(segment);
            const endAngle = startAngle + angleScale.bandwidth();
            
            // Create arc
            const arc = d3.arc()
                .innerRadius(innerRad)
                .outerRadius(outerRad)
                .startAngle(startAngle)
                .endAngle(endAngle);
            
            // Draw cell
            svg.append("path")
                .attr("d", arc)
                .attr("fill", colorScale(value))
                .attr("stroke", "#fff")
                .attr("stroke-width", 0.5)
                .append("title")
                .text(`${segment} ${ring}: ${value}`);
        });
        
        // Add segment labels (e.g. months)
        segments.forEach(segment => {
            const angle = angleScale(segment) + angleScale.bandwidth() / 2;
            const x = (outerRadius + 20) * Math.sin(angle);
            const y = -(outerRadius + 20) * Math.cos(angle);
            
            svg.append("text")
                .attr("x", x)
                .attr("y", y)
                .attr("text-anchor", "middle")
                .text(segment);
        });
        
        // Add title
        svg.append("text")
            .attr("x", 0)
            .attr("y", -outerRadius - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .text(title);
        
    }, [data, segmentField, ringField, valueField, colorRange, title]);
    
    return (
        <svg ref={svgRef} className={className} />
    );
};

export default RadialHeatmap;
    
// Example usage:
// <div style={{ width: "600px", height: "600px" }}>
//   <RadialHeatmap 
//     data={data}
//     segmentField="month"
//     ringField="year"
//     valueField="sightings"
//     title="Shark Sightings"
//     className="my-heatmap"
//   />
// </div>


