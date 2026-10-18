import { ReactNode } from "react";
import ThreeGlobe from "three-globe";
import { WhaleSharkEntryNormalized, WhaleSharkDatasetNormalized } from "./sharks";
import { PlottedCoordinatePoint } from "./coordinates";
import { SheetPanelSlot } from "./sheets";

/* Globes types */

export type GetGlobeFn = () => ThreeGlobe;

export type PlayStoryFn = (
    sharkID: string,
    onPointChange?: (point: PlottedCoordinatePoint) => void
) => Promise<void>;

export type PlayStoryFromSelectionFn = PlayStoryFn;

export type HighlightSharkFn = (
    sharkID: string,
    usePoints?: boolean,
    keepControlsDisabled?: boolean
) => Promise<void>;

export type InterruptStoryFn = () => void;

export type ShowSinglePointFn = (point: PlottedCoordinatePoint, disableControls?: boolean) => void;

export type EnableDisableControlFn = () => void;

export type GlobeHandle = {
    getGlobe: GetGlobeFn;
    playStory: PlayStoryFn;
    playStoryFromSelection: PlayStoryFromSelectionFn;
    highlightShark: HighlightSharkFn;
    interruptStory: InterruptStoryFn;
    showSinglePoint: ShowSinglePointFn;
    enableControls: EnableDisableControlFn;
    disableControls: EnableDisableControlFn;
};

export type UseGlobeClickProps = {
    sharks: WhaleSharkDatasetNormalized;
    pointsData: PlottedCoordinatePoint[];
    allSharksVisible: boolean;
    onSharkSelect: (shark: WhaleSharkEntryNormalized | null) => void;
};

export type SharkClickProps = {
    lat: number;
    lng: number;
};

export type GlobeProps = {
    onSharkClick?: (sharkClickProps: SharkClickProps) => void;
    allowClicks?: boolean;
};

export type GlobePageLayoutProps = {
    containerClassName: string;
    left: SheetPanelSlot;
    right: SheetPanelSlot;
    // Optional so a page can switch tabs itself (e.g. show info once shark selected)
    activeTab?: string;
    onTabChange?: (label: string) => void;
    // Globe & any overlays on it
    children: ReactNode;
};

export type GlobeCoordinateReadoutProps = {
    point: PlottedCoordinatePoint | null;
    placeholder?: string;
};

export type GlobeSharkCountReadoutProps = {
    shown: number;
    total: number;
};

export type GlobeImageOverlayProps = {
    imageUrl?: string;
};
