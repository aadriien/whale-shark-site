import ThreeGlobe from "three-globe";
import { PlottedCoordinatePoint } from "./coordinates";

/* Globes types */

export type GlobeHandle = {
    getGlobe: () => ThreeGlobe;
    playStory: (
        sharkID: string, 
        onPointChange?: (point: PlottedCoordinatePoint) => void
    ) => Promise<void>;
    playStoryFromSelection: (
        sharkID: string, 
        onPointChange?: (point: PlottedCoordinatePoint) => void
    ) => Promise<void>;
    highlightShark: (
        sharkID: string, 
        usePoints?: boolean, 
        keepControlsDisabled?: boolean
    ) => Promise<void>;
    interruptStory: () => void;
    showSinglePoint: (
        point: PlottedCoordinatePoint, 
        disableControls?: boolean
    ) => void;
    enableControls: () => void;
    disableControls: () => void;
};


