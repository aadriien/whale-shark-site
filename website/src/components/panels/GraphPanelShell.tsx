import type { ReactNode } from "react";

import sharkSelectionPlaceholder from "../../assets/images/chart-placeholders/globe-views.svg";

type GraphPanelShellProps = {
    isEmpty: boolean;
    emptyAlt: string;
    children: ReactNode;
};

// Shared empty state placeholder for the graph side panels
function GraphPanelShell({ isEmpty, emptyAlt, children }: GraphPanelShellProps) {
    if (isEmpty) {
        return (
            <div className="graph-node-panel graph-node-panel--empty">
                <img src={sharkSelectionPlaceholder} alt={emptyAlt} className="graph-panel-placeholder" />
            </div>
        );
    }

    return <div className="graph-node-panel">{children}</div>;
}

export default GraphPanelShell;