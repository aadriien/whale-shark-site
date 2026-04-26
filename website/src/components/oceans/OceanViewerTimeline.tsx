import OceanViewerLegend from "./OceanViewerLegend";

import { ALL_MONTHS, formatMonthKey } from "../../utils/OceanViewerUtils";

import { OceanViewerTimelineProps } from "../../types/controls";


const OceanViewerTimeline = ({
    sliderIndex,
    onSliderChange,
    currentMonth,
    isLoadingDataset,
    datasetKey,
}: OceanViewerTimelineProps) => {
    return (
        <div className="ocean-viewer-controls">
            <div className="ocean-viewer-month-header">
                <span className="ocean-viewer-month-label">
                    {formatMonthKey(currentMonth)}
                </span>
                {isLoadingDataset && (
                    <span className="ocean-viewer-loading">
                        loading data…
                    </span>
                )}
            </div>

            <input
                type="range"
                min={0}
                max={ALL_MONTHS.length - 1}
                value={sliderIndex}
                onChange={(e) => onSliderChange(+e.target.value)}
                className="ocean-viewer-slider"
            />
            <div className="ocean-viewer-slider-bounds">
                <span>{ALL_MONTHS[0]}</span>
                <span>{ALL_MONTHS[ALL_MONTHS.length - 1]}</span>
            </div>

            <OceanViewerLegend datasetKey={datasetKey} />
        </div>
    );
};

export default OceanViewerTimeline;

