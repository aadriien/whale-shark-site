import { WhaleSharkDatasetNormalized } from "./sharks";


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


