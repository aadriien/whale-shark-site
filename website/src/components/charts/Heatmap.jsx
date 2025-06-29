import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const Heatmap = ({ 
    data, 
    title = "Heatmap", 
    yTickFormatter 
}) => {
    const svgRef = useRef(null);
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
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

        const margin = { top: 40, right: 30, bottom: 60, left: 60 };

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        // Sort years ascending then reverse to get descending (recent at top)
        const allYears = Array.from(new Set(data.map(d => d.year)))
        .sort((a, b) => a - b)
        .reverse();
        
        const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
            .domain([0, d3.max(data, d => d.value)]);
        
        const x = d3.scaleBand().domain(months).range([0, innerWidth]).padding(0.05);
        const y = d3.scaleBand().domain(allYears).range([0, innerHeight]).padding(0.05);
        
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Draw heatmap cells
        g.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.month))
            .attr("y", d => y(d.year))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("fill", d => colorScale(d.value))
            .append("title")
            .text(d => `${d.month} ${d.year}: ${d.value}`);
        
        // Y axis (years)
        const yAxis = d3.axisLeft(y);
        if (typeof yTickFormatter === "function") {
            yAxis.tickFormat(yTickFormatter);
        }
        g.append("g").call(yAxis);
        
        // X axis (months)
        g.append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(x));
        
        // Title at top of chart
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .attr("font-weight", "bold")
            .text(title);
        
    }, [data, title, svgDimensions, yTickFormatter]);
        
    return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
};

export default Heatmap;
