import type { ReactNode } from "react";

import sharkSelectionPlaceholder from "../../assets/images/chart-placeholders/globe-views.svg";

type GraphPanelShellProps = {
    isEmpty: boolean;
    emptyAlt: string;
    onClose: () => void;
    children: ReactNode;
};

// Shared empty state placeholder + close button for the graph side panels
function GraphPanelShell({ isEmpty, emptyAlt, onClose, children }: GraphPanelShellProps) {
    if (isEmpty) {
        return (
            <div className="graph-node-panel graph-node-panel--empty">
                <img src={sharkSelectionPlaceholder} alt={emptyAlt} className="graph-panel-placeholder" />
            </div>
        );
    }

    return (
        <div className="graph-node-panel">
            <button className="graph-panel-close" onClick={onClose} aria-label="Close panel">
                ✕
            </button>
            {children}
        </div>
    );
}

export default GraphPanelShell;