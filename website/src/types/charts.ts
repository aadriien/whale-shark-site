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
};

export type BarChartProps = {
    data: BarChartDataPoint[];
    title?: string;
};


export type HeatmapDataPoint = {
    year: number;
    month: string;
    value: number;
};

export type HeatmapProps = {
    data: HeatmapDataPoint[];
    title?: string;
    yTickFormatter: (value: number) => string;
};


export type RadialHeatmapDataPoint = Record<string, string | number>;

export type PieDataPoint = {
    label: string;
    value: number;
};

export type RadialHeatmapProps = {
    data: RadialHeatmapDataPoint[];
    segmentField: string;
    ringField: string;
    valueField: string;
    title?: string;
    className?: string;
    pieData?: PieDataPoint[];
};


export type GBIFDataEntry = Record<string, string | number>;

export type GBIFDataset = GBIFDataEntry[];

export type DatasetMapping = Record<string, GBIFDataset>; 

export type DisplayField = {
    label: string;
    field: string;
    formatter?: (value: any) => React.ReactNode;
};

export type DataOverviewProps = {
    // Ensure only valid keys (i.e. "calendar", "continent", "country", "publishingCountry")
    // Caveat: special case for Geo Labs (directly pass newly-created summary dataset)
    dataset?: Extract<keyof DatasetMapping, string> | GBIFDataset;

    filterField?: string;
    displayFields?: DisplayField[];
    selectedFilter?: string;
};


export type DataMetricFilterProps = {
    label: string;
    field: string;
    data: GBIFDataset;
    selectedValue: string | number;

    // Ensure type matches that of selectedValue
    onChange: (value: DataMetricFilterProps["selectedValue"]) => void;

    inline: boolean;
};


export type MonthsMapping = {
    label: string;
    value: number;
};

export type YearMonthsMapping = Record<number, MonthsMapping[]>;


