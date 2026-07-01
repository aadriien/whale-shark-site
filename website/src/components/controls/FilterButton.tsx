import type { ReactNode } from "react";

type FilterButtonProps = {
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
};

function FilterButton({ active, disabled, onClick, children }: FilterButtonProps) {
    return (
        <button
            className={`graph-filter-btn${active ? " active" : ""}`}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default FilterButton;
