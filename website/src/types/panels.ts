import React from "react";
import type { Core } from "cytoscape";

import { WhaleSharkDatasetNormalized, ImageMetadata } from "./sharks";
import { SharkClickProps } from "./globes";
import { SelectedMatch, SelectedSharkMatch } from "./graphs";

/* Panel types */

export type LabSelectionPanelProps = {
    selectedSharksForLab: Set<string>;
    savedIds: Set<string>;
    sharks: WhaleSharkDatasetNormalized;
    onSelectAllToggle: React.ChangeEventHandler<HTMLInputElement>;
};

export type ContinentDisplayProps = {
    sharks: WhaleSharkDatasetNormalized;
    onSelect: (id: string) => void;
    selectedSharkId: string;
};

export type SavedSharksDisplayProps = {
    sharks: WhaleSharkDatasetNormalized;
    onSelect?: (id: string) => void;
    selectedSharkId: string;
    viewMode: string;
    selectedSharksForLab: Set<string>;
    onLabSelectionChange: (value: Set<string>) => void;
};

export type SharkSelectorProps = {
    sharks: WhaleSharkDatasetNormalized;
    onSelect: (arg: SharkClickProps | string) => void;
    onReset: () => void;
    selectedSharkId: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DisplayComponent: React.ComponentType<any>;
    disabled?: boolean;
    onFilteredSharksChange: React.Dispatch<React.SetStateAction<WhaleSharkDatasetNormalized>>;
};

export type MatchSharkSelectorProps = {
    sharks: WhaleSharkDatasetNormalized;
    onSharkSelect: (id: string) => void;
    selectedSharkId: string;
};

/* ---- Match graph panels ---- */

type BaseNodePanelProps<M> = {
    match: M | null;
    showContradictionPath: boolean;
    onToggleContradictionPath: () => void;
};

export type GraphNodePanelProps = BaseNodePanelProps<SelectedMatch> & {
    onSelectImage: (imageId: number) => void;
};
export type SharkRankingNodePanelProps = BaseNodePanelProps<SelectedSharkMatch>;

type BaseDetailPanelProps<M> = {
    match: M | null;
};

export type GraphImagesPanelProps = BaseDetailPanelProps<SelectedMatch> & {
    cy: Core | null;
    onSelectImage: (imageId: number) => void;
};

export type SharkRankingStatsPanelProps = BaseDetailPanelProps<SelectedSharkMatch>;

/* ---- Match image lightbox (query vs. match, side by side) ---- */

export type LightboxPanelData = {
    sharkId: string;
    label: string;
    countries?: string;
    oldest?: string;
    newest?: string;
    images: ImageMetadata[];
    activeIndex: number;
    onSelectThumbnail: (index: number) => void;
};

export type MatchImageLightboxProps = {
    isOpen: boolean;
    onClose: () => void;
    left: LightboxPanelData | null;
    right: LightboxPanelData | null;
    querySharkId: string;
    matchSharkId: string;
    distanceLabel: string;
    distanceValue: number;
};
