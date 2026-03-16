/* Cards types */

import { WhaleSharkEntryNormalized } from "./sharks";

export type SharkCardProps = {
    shark: WhaleSharkEntryNormalized;
    onPlayStory: (id: string) => void;
    isPlaying: boolean; 
    playingSharkId: string;
};


