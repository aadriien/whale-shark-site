import { WhaleSharkEntryNormalized } from "./sharks";
import { PlottedCoordinatePoint } from "./coordinates";


/* Controls types */

export type PlayStoryButtonProps = {
    shark: WhaleSharkEntryNormalized; 
    onPlayStory: (id: string) => void;
    isPlaying: boolean; 
    playingSharkId: string; 
    showPauseForGeoLabs: boolean; 
    onToggleStepMode: () => void;
    isStepMode: boolean;
};


export type TimelineButtonProps = {
    onToggleTimelineMode: () => void;
    isTimelineMode: boolean;
};


export type StoryStepSliderProps = {
    shark: WhaleSharkEntryNormalized;
    onStepChange: (stepIndex: number, point: PlottedCoordinatePoint) => void;
    currentStepIndex: number;
    isVisible: boolean;
};


