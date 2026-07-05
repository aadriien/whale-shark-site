import React from "react";
import type { Core } from "cytoscape";

import { WhaleSharkDatasetNormalized } from "./sharks";
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
