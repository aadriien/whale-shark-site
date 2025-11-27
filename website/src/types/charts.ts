/* Chart types */

export type ChartPlaceholderProps = { 
    type: string; 
    message: string; 
};

export type ImageMap = Record<string, string>;


export type SvgDimensions = { 
    width: number; 
    height: number 
};


export type BarChartDataPoint = {
    label: string;
    value: number;
}

export type BarChartProps = {
    data: BarChartDataPoint[];
    title?: string;
}


