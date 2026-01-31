import { WhaleSharkEntryNormalized } from "./sharks";


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


