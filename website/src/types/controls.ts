import React from "react";

import { WhaleSharkEntryNormalized } from "./sharks";
import { PlottedCoordinatePoint } from "./coordinates";
import { GlobeHandle } from "./globes";

/* Controls types */

export type PlayStoryButtonProps = {
    shark: WhaleSharkEntryNormalized;
    onPlayStory?: (id: string) => void;
    isPlaying?: boolean;
    playingSharkId?: string;
    showPauseForGeoLabs?: boolean;
    onToggleStepMode?: () => void;
    isStepMode?: boolean;
};

export type TimelineButtonProps = {
    onToggleTimelineMode: () => void;
    isTimelineMode: boolean;
};

export type TimelineSelectorProps = {
    onTimelineChange: (month: number, year: number) => void;
    currentMonth: number;
    currentYear: number;
    isVisible: boolean;
    availableSharks: string[];
    plottedCoordinates: PlottedCoordinatePoint[];
};

export type TimelineControlsProps = {
    globeRef: React.RefObject<GlobeHandle | null>;
    selectedSharksForLab: Set<string>;
    savedSharkIds: Set<string>;
    onToggleTimelineMode: () => void;
    isTimelineMode: boolean;
};

export type StoryStepSliderProps = {
    shark: WhaleSharkEntryNormalized;
    onStepChange: (stepIndex: number, point: PlottedCoordinatePoint) => void;
    currentStepIndex: number;
    isVisible: boolean;
};

export type OceanViewerTimelineProps = {
    sliderIndex: number;
    onSliderChange: (index: number) => void;
    currentMonth: string;
    isLoadingDataset: boolean;
    datasetKey: string;
};

export type GraphDistanceRangeProps = {
    label: string;
    step: number;
    value: [number, number];
    onChange: (range: [number, number]) => void;
};

export type ConfirmModalAction = {
    label: string;
    onClick: () => void;
    variant?: "primary" | "danger" | "neutral";
};

export type ConfirmModalProps = {
    title?: string;
    message: string;
    actions: ConfirmModalAction[];
    onClose: () => void;
};

// What a caller hands to useConfirmModal()'s requestConfirm. Has everything
// ConfirmModalProps needs except onClose, which the hook supplies itself
export type ConfirmRequest = Omit<ConfirmModalProps, "onClose">;
