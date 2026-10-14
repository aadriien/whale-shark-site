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
            className={`btn btn-sm btn-pill ${active ? "btn-primary" : "btn-secondary"}`}
            data-accent="navy"
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default FilterButton;
