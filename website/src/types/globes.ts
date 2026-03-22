import ThreeGlobe from "three-globe";
import { WhaleSharkEntryNormalized, WhaleSharkDatasetNormalized } from "./sharks";
import { PlottedCoordinatePoint } from "./coordinates";

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

export type ShowSinglePointFn = (
    point: PlottedCoordinatePoint, 
    disableControls?: boolean
) => void;

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


export type UseGlobeClickParams = {
    sharks: WhaleSharkDatasetNormalized;
    pointsData: PlottedCoordinatePoint[];
    allSharksVisible: boolean;
    onSharkSelect: (shark: WhaleSharkEntryNormalized) => void;
};


export type SharkClickParams = { 
    lat: number, 
    lng: number
};

export type GlobeProps = {
    onSharkClick: (sharkClickParams: SharkClickParams) => void;
    allowClicks: boolean;
};


