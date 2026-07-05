/* Cards types */

import type { ReactNode } from "react";

import { WhaleSharkEntryNormalized, WhaleSharkDatasetNormalized, ImageMetadata } from "./sharks";

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

export type SharkImagesLightboxProps = {
    images: ImageMetadata[];
    activeIndex: number;
    onNavigate: (index: number) => void;
    onClose: () => void;
};

export type MatchSharkBoxProps = {
    label: string;
    sharkId: string;
    countries?: string;
    oldest?: string;
    newest?: string;
    images: ImageMetadata[];
    activeIndex: number;
    onSelectThumbnail: (index: number) => void;
    imagesLabel?: string;
    noImagesMessage?: string;
    footer?: ReactNode;
};
