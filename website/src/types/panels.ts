import { WhaleSharkDatasetNormalized } from "./sharks";


/* Panel types */

export type LabSelectionPanelProps = {
    selectedSharksForLab: Set<string>; 
    savedIds: Set<string>;
    sharks: WhaleSharkDatasetNormalized;
    onSelectAllToggle: React.ChangeEventHandler<HTMLInputElement>;
};


