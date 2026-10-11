import { FolderTabsProps } from "../../types/controls";

function FolderTabs({ tabs, activeTab, onTabChange }: FolderTabsProps) {
    return (
        <div className="folder-tabs" role="tablist">
            {tabs.map(({ id, label }) => (
                <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={id === activeTab}
                    className={`folder-tab ${id === activeTab ? "active" : ""}`}
                    onClick={() => onTabChange(id)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

export default FolderTabs;
