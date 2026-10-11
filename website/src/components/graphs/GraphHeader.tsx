import { GraphHeaderProps } from "../../types/graphs";

// Each side holds one graph's title & blurb, so clicking switches to that graph
function GraphHeader({ options, activeId, onChange }: GraphHeaderProps) {
    return (
        <div className="graph-header" role="tablist">
            {options.map(({ id, title, description }) => (
                <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={id === activeId}
                    className={`graph-header-option ${id === activeId ? "active" : ""}`}
                    onClick={() => onChange(id)}
                >
                    <span className="graph-header-title">{title}</span>
                    <span className="graph-header-blurb">{description}</span>
                </button>
            ))}
        </div>
    );
}

export default GraphHeader;
