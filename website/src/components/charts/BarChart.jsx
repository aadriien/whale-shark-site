import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";


const BarChart = ({ 
    data, 
    title = "Bar Chart" 
}) => {
    const svgRef = useRef(null);
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

    // Handle resizing of SVG container
    useEffect(() => {
        const handleResize = () => {
            if (svgRef.current) {
                const { width, height } = svgRef.current.getBoundingClientRect();
                setSvgDimensions({ width, height });
            }
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    
    useEffect(() => {
        if (!data || data.length === 0) return;
        if (svgDimensions.width === 0 || svgDimensions.height === 0) return;

        const { width, height } = svgDimensions;
        
        // Clear any existing visuals / renders
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 40, right: 5, bottom: 60, left: 30 };

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        const x = d3.scaleBand()
            .domain(data.map(d => d.label))
            .range([0, innerWidth])
            .padding(0.2);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value) || 0])
            .nice()
            .range([innerHeight, 0]);

        const barColorScale = d3.scaleSequential()
            .domain([0, d3.max(data, d => d.value) || 0])  
            .interpolator(d3.interpolateYlGnBu);  
        
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        g.append("g")
            .call(d3.axisLeft(y));
        
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-40)")
            .style("text-anchor", "end");

        g.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.label))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => innerHeight - y(d.value))
            .attr("fill", d => barColorScale(d.value));
        
        // Title at top of chart
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .attr("class", "chart-title") // apply CSS class
            .text(title);
    }, [data, title, svgDimensions]);
    
    return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
};

export default BarChart;

