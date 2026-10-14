import { FilterChip, FilterChipsProps, SharkBaseCriteria } from "../../types/filters";

function buildChips(criteria: SharkBaseCriteria, defaults: SharkBaseCriteria): FilterChip[] {
    const chips: FilterChip[] = [];

    if (criteria.country !== defaults.country) {
        chips.push({ key: "country", label: criteria.country });
    }
    if (criteria.publishingCountry !== defaults.publishingCountry) {
        chips.push({
            key: "publishingCountry",
            label: `Publisher: ${criteria.publishingCountry}`,
        });
    }
    if (criteria.yearRange.join(",") !== defaults.yearRange.join(",")) {
        chips.push({
            key: "yearRange",
            label: `${criteria.yearRange[0]}-${criteria.yearRange[1]}`,
        });
    }
    if (criteria.month !== defaults.month) {
        chips.push({ key: "month", label: criteria.month });
    }
    if (criteria.sex !== defaults.sex) {
        chips.push({ key: "sex", label: criteria.sex });
    }
    if (criteria.lifeStage !== defaults.lifeStage) {
        chips.push({ key: "lifeStage", label: criteria.lifeStage });
    }
    if (criteria.observationType !== defaults.observationType) {
        chips.push({ key: "observationType", label: criteria.observationType });
    }
    if (criteria.minRecords !== defaults.minRecords) {
        chips.push({ key: "minRecords", label: `Min records: ${criteria.minRecords}` });
    }
    if (criteria.showOnlyWithMedia !== defaults.showOnlyWithMedia) {
        chips.push({ key: "showOnlyWithMedia", label: "With images" });
    }
    if (criteria.hasOccurrenceNotes !== defaults.hasOccurrenceNotes) {
        chips.push({ key: "hasOccurrenceNotes", label: "With notes" });
    }

    return chips;
}

// Removable summary of applied filters, visible even when filter panel is hidden
function FilterChips({
    criteria,
    defaults,
    onChange,
    selectedSharkId,
    onDeselect,
}: FilterChipsProps) {
    const chips = buildChips(criteria, defaults);
    const showSelectedShark = !!selectedSharkId && !!onDeselect;

    if (chips.length === 0 && !showSelectedShark) return null;

    return (
        <div className="filter-chips" aria-label="Applied filters">
            {showSelectedShark && (
                <button
                    type="button"
                    className="filter-chip selected-shark"
                    onClick={onDeselect}
                    aria-label={`Deselect shark: ${selectedSharkId}`}
                    title="Deselect shark"
                >
                    <span className="filter-chip-label">{selectedSharkId}</span>
                    <span aria-hidden="true">✕</span>
                </button>
            )}
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    type="button"
                    className="filter-chip"
                    onClick={() => onChange({ ...criteria, [chip.key]: defaults[chip.key] })}
                    aria-label={`Remove filter: ${chip.label}`}
                    title="Remove filter"
                >
                    <span className="filter-chip-label">{chip.label}</span>
                    <span aria-hidden="true">✕</span>
                </button>
            ))}
        </div>
    );
}

export default FilterChips;
