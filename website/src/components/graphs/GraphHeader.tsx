import { GraphHeaderProps } from "../../types/graphs";

function GraphHeader({ title, description }: GraphHeaderProps) {
    return (
        <div className="graph-header">
            <h2>{title}</h2>
            <p>{description}</p>
        </div>
    );
}

export default GraphHeader;
