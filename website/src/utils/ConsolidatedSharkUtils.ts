import { buildTimelineEntries, parseImageField } from "./DataUtils";

import { MatchGroup } from "../types/logbooks";
import {
    WhaleSharkEntryNormalized,
    WhaleSharkDatasetNormalized,
    ConsolidatedShark,
} from "../types/sharks";

function mergeUniqueField(members: WhaleSharkDatasetNormalized, field: "sex" | "lifeStage"): string {
    const values = members
        .map((m) => m[field])
        .filter((v): v is string => Boolean(v && v.toLowerCase() !== "unknown"));

    return [...new Set(values)].join(", ") || "Unknown";
}

function earliestOrLatest(members: WhaleSharkDatasetNormalized, field: "oldest" | "newest"): string {
    const dated = members
        .map((m) => ({ raw: m[field], time: new Date(m[field]).getTime() }))
        .filter((d) => d.raw);

    if (dated.length === 0) return "";

    const withValidDates = dated.filter((d) => !isNaN(d.time));
    // Fall back to plain string comparison when dates don't parse cleanly
    const pool = withValidDates.length > 0 ? withValidDates : dated;
    const comparator =
        withValidDates.length > 0
            ? (a: (typeof pool)[number], b: (typeof pool)[number]) => a.time - b.time
            : (a: (typeof pool)[number], b: (typeof pool)[number]) => a.raw.localeCompare(b.raw);

    const sorted = [...pool].sort(comparator);
    return field === "oldest" ? sorted[0].raw : sorted[sorted.length - 1].raw;
}

// Assembles 1 pseudo shark record from every member of a match group, so
// gaps in 1 record can be filled by another (e.g. missing sex / lifeStage),
// while still keeping each member's own timeline / media traceable by ID
export function buildConsolidatedShark(
    group: MatchGroup,
    members: WhaleSharkDatasetNormalized
): ConsolidatedShark {
    const first = members[0];

    return {
        ...first,
        groupName: group.name,
        memberIds: members.map((m) => m.id),
        occurrences: members.reduce((sum, m) => sum + m.occurrences, 0),
        human: members.reduce((sum, m) => sum + m.human, 0),
        machine: members.reduce((sum, m) => sum + m.machine, 0),
        oldest: earliestOrLatest(members, "oldest"),
        newest: earliestOrLatest(members, "newest"),
        sex: mergeUniqueField(members, "sex"),
        lifeStage: mergeUniqueField(members, "lifeStage"),
        timelineBySource: members.map((m) => ({
            sharkId: m.id,
            entries: buildTimelineEntries(m),
        })),
        mediaBySource: members.map((m) => ({
            sharkId: m.id,
            images: m.image && m.image !== "Unknown" ? parseImageField(m.image) : [],
        })),
    };
}

export function isConsolidatedShark(
    shark: WhaleSharkEntryNormalized | ConsolidatedShark
): shark is ConsolidatedShark {
    return "memberIds" in shark;
}