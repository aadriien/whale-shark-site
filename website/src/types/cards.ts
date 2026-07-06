/* Cards types */

import type { ReactNode } from "react";

import {
    WhaleSharkEntryNormalized,
    WhaleSharkDatasetNormalized,
    ImageMetadata,
    ImagesWithMetadata,
    SharkTimelineEntry,
} from "./sharks";

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

export type SharkMediaLightboxProps = {
    images: ImageMetadata[];
    activeIndex: number;
    onNavigate: (index: number) => void;
    onClose: () => void;
};

export type SharkTimelineProps = {
    entries: SharkTimelineEntry[];
    sourceLabel?: string;
};

export type SharkImageGridProps = {
    images: ImagesWithMetadata;
    onImageClick: (localIndex: number) => void;
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

/* ---- Matched shark pair lightbox (query vs. match, side by side) ---- */

export type MatchedPairBaseData = {
    sharkId: string;
    label: string;
    countries?: string;
    oldest?: string;
    newest?: string;
    images: ImageMetadata[];
    activeIndex: number;
    onSelectThumbnail: (index: number) => void;
};

export type MatchedPairLightboxProps = {
    isOpen: boolean;
    onClose: () => void;
    left: MatchedPairBaseData | null;
    right: MatchedPairBaseData | null;
    querySharkId: string;
    matchSharkId: string;
    distanceLabel: string;
    distanceValue: number;
};
