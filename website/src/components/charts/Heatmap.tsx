import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

import { MONTHS } from "../../utils/DataUtils.js";

import { SvgDimensions, HeatmapProps } from "../../types/charts"


const Heatmap = ({ data, title = "Heatmap", yTickFormatter }: HeatmapProps) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [svgDimensions, setSvgDimensions] = useState<SvgDimensions>({ width: 0, height: 0 });
            
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

        const margin = { top: 40, right: 60, bottom: 60, left: 40 };

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        // Sort years ascending then reverse to get descending (recent at top)
        const allYears = Array.from(new Set(data.map(d => d.year)))
            .sort((a, b) => a - b)
            .reverse()
            .map(String);
        
        const maxValue = Math.ceil(d3.max(data, d => d.value) || 1);

        const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
            .domain([0, maxValue]);
        
        const x = d3.scaleBand().domain(MONTHS).range([0, innerWidth]).padding(0.05);
        const y = d3.scaleBand().domain(allYears).range([0, innerHeight]).padding(0.05);
        
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Draw heatmap cells
        g.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.month))
            .attr("y", d => y(String(d.year)))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("fill", d => colorScale(d.value))
            .append("title")
            .text(d => `${d.month} ${d.year}: ${d.value}`);
        
        // Y axis (years)
        const yAxis = d3.axisLeft(y);
        if (typeof yTickFormatter === "function") {
            yAxis.tickFormat(d => yTickFormatter(Number(d)));
        }
        g.append("g").call(yAxis);
        
        // X axis (months)
        g.append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(x));
        
        // Legend group (to right of heatmap chart display)
        const legendWidth = 15;
        const legendHeight = innerHeight;

        const legendGroup = svg.append("g")
            .attr("transform", `translate(${margin.left + innerWidth + 20},${margin.top})`);

        // Gradient definition (color palette mappings)
        const defs = svg.append("defs");
        const gradientId = "legend-gradient";

        const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%").attr("y1", "100%")
            .attr("x2", "0%").attr("y2", "0%");

        // Create multiple stops so gradient matches color scale precisely
        const numStops = 10;
        const step = maxValue / (numStops - 1);

        for (let i = 0; i < numStops; i++) {
            const value = step * i;
            gradient.append("stop")
                .attr("offset", `${(i / (numStops - 1)) * 100}%`)
                .attr("stop-color", colorScale(value));
        }

        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", `url(#${gradientId})`);

        const legendScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .tickFormat(d3.format("d"));

        // Ensure we only show multiple legend values if they exist
        if (maxValue <= 2) {
            legendAxis.tickValues([0, maxValue]);
        } 
        else {
            legendAxis.ticks(5);
        }

        legendGroup.append("g")
            .attr("transform", `translate(${legendWidth},0)`)
            .call(legendAxis);

        // Title at top of chart
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .attr("class", "chart-title") // apply CSS class
            .text(title);
        
    }, [data, title, svgDimensions, yTickFormatter]);
        
    return <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />;
};

export default Heatmap;
