/* Cards types */

import { WhaleSharkEntryNormalized, WhaleSharkDatasetNormalized } from "./sharks";

export type SharkCardBaseProps = {
    onPlayStory: (id: string) => void;
    isPlaying: boolean; 
    playingSharkId: string;
};

export type SharkCardProps = SharkCardBaseProps & {
    shark: WhaleSharkEntryNormalized;
};

export type SharkGridProps = SharkCardBaseProps & {
    sharks: WhaleSharkDatasetNormalized;
};


