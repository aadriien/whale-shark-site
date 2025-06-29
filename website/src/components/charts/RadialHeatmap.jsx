import React, { useEffect, useRef, useState } from "react";
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
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

    // Handle resizing of SVG container
    const handleResize = () => {
        if (svgRef.current) {
            const { width, height } = svgRef.current.getBoundingClientRect();
            setSvgDimensions({ width, height });
        }
    };

    useEffect(() => {
        // Resize chart on window resize
        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (!data || data.length === 0) return;
        if (svgDimensions.width === 0 || svgDimensions.height === 0) return;

        const { width, height } = svgDimensions;
        
        // Clear any existing visuals / renders
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const innerRadius = Math.min(width, height) * 0.1;
        const outerRadius = 0.7 * Math.min(width, height) / 2;

        // Create main chart group (radial heatmap + legend)
        const chartGroup = svg
            .append("g")
            .attr("transform", `translate(${outerRadius}, ${height / 2})`);
            // .attr("transform", `translate(${width / 2}, ${height / 2})`);

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

        // Draw each ring segment independently by portion of total
        rings.forEach((ring) => {
            const ringData = data.filter(d => d[ringField] === ring);
            const innerRad = radiusScale(ring);
            const outerRad = innerRad + radiusScale.bandwidth();

            const ringTotal = d3.sum(ringData, d => d[valueField]);
            let currentAngle = 0;

            ringData.forEach((d) => {
                const value = +d[valueField] || 0;
                if (value <= 0) return;

                const angleWidth = (value / ringTotal) * 2 * Math.PI;

                // Allocate proportional space for each ring segment
                const startAngle = currentAngle;
                const endAngle = currentAngle + angleWidth;

                currentAngle = endAngle;

                const arc = d3.arc()
                    .innerRadius(innerRad)
                    .outerRadius(outerRad)
                    .startAngle(startAngle)
                    .endAngle(endAngle);

                const segment = d[segmentField];

                const group = chartGroup.append("g");
                group.append("path")
                    .attr("d", arc)
                    .attr("fill", segmentColorScale(segments.indexOf(segment)))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 0.5);

                group.append("title")
                    .text(`${ring} • ${segment}: ${value.toFixed(2)}`);
            });
        });
        
        // Title at top of chart
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text(title);

        // If pieData provided, create pie chart in center
        if (pieData.length > 0) {
            const pieRadius = Math.min(width, height) * 0.2; 
            const pieGroup = svg.append("g")
                .attr("transform", `translate(${outerRadius}, ${height / 2})`);
                // .attr("transform", `translate(${width / 2}, ${height / 2})`);

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
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .text(d => d.data.label);
        }

        // Have legend height roughly mirror available chart height
        const chartHeight = Math.min(width, height);
        const legendHeight = chartHeight * 0.7;

        // Create external legend to map segment colors (matches segmentField values)
        const legendGroup = svg.append("g")
            .attr("transform", `translate(${2 * outerRadius + 15}, ${height / 2 - legendHeight / 2})`);
            // .attr("transform", `translate(${width / 2 + (outerRadius + 20)}, ${height / 2 - legendHeight / 2})`);

        segments.forEach((segment, i) => {
            legendGroup.append("rect")
                .attr("x", 0)
                .attr("y", i * 18)
                .attr("width", 14)
                .attr("height", 12)
                .attr("fill", segmentColorScale(segments.indexOf(segment))); 

            legendGroup.append("text")
                .attr("x", 20)
                .attr("y", i * 18 + 12)
                .attr("font-size", "12px")
                .text(() => {
                    const totalForSegment = d3.sum(data.filter(
                        d => d[segmentField] === segment
                    ), d => d[valueField]);
                    return `${segment} — ${totalForSegment}`;
                });
        });
        
    }, [data, segmentField, ringField, valueField, title, pieData, svgDimensions]);

    return (
        <svg ref={svgRef} className={className} style={{ width: "100%", height: "100%" }} />
    );
};

export default RadialHeatmap;

