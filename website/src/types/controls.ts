import { WhaleSharkEntryNormalized } from "./sharks";
import { PlottedCoordinatePoint } from "./coordinates";
import { GlobeHandle } from "./globes";


/* Controls types */

export type PlayStoryButtonProps = {
    shark: WhaleSharkEntryNormalized; 
    onPlayStory: (id: string) => void;
    isPlaying: boolean; 
    playingSharkId: string; 
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
    plottedCoordinates: PlottedCoordinatePoint[]
};


export type TimelineControlsProps = {
    globeRef: React.RefObject<GlobeHandle>;
    selectedSharksForLab: Set<string>;
    onToggleTimelineMode: () => void; 
    isTimelineMode: boolean;
};


export type StoryStepSliderProps = {
    shark: WhaleSharkEntryNormalized;
    onStepChange: (stepIndex: number, point: PlottedCoordinatePoint) => void;
    currentStepIndex: number;
    isVisible: boolean;
};


