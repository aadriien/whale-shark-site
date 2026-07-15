import { mediaSharks } from "../../utils/DataUtils";
import { buildRemoveConfirm, buildMoveConfirm } from "../../utils/MatchConfirmUtils";
import { groupDisplayLabel } from "../../utils/MatchUtils";
import SharkBanner from "../cards/SharkBanner";
import MatchGroupNotes from "./MatchGroupNotes";

import {
    MatchGroupCardProps,
    MatchRemoveButtonProps,
    MatchMoveSelectProps,
} from "../../types/logbooks";

function MatchRemoveButton({ sharkId, onRemove }: MatchRemoveButtonProps) {
    return (
        <button
            className="match-remove-btn"
            onClick={() => onRemove(sharkId)}
            aria-label={`Remove ${sharkId} from this matched group`}
        >
            ✕
        </button>
    );
}

// Lets user pick a different (existing) group to move this shark into.
// Button is disabled when there's nowhere else to move it
function MatchMoveSelect({ sharkId, otherGroups, onMove }: MatchMoveSelectProps) {
    return (
        <select
            className="match-move-select"
            value=""
            disabled={otherGroups.length === 0}
            onChange={(e) => {
                const targetGroupId = e.target.value;
                if (targetGroupId) onMove(sharkId, targetGroupId);
            }}
            aria-label={`Move ${sharkId} to a different matched group`}
        >
            <option value="" disabled hidden>
                →
            </option>
            {otherGroups.map((group) => (
                <option key={group.id} value={group.id}>
                    {groupDisplayLabel(group)}
                </option>
            ))}
        </select>
    );
}

function MatchGroupCard({
    group,
    otherGroups,
    onOpenGallery,
    requestConfirm,
}: MatchGroupCardProps) {
    return (
        <div className="matched-group-box">
            <div className="matched-group-layout">
                <div className="matched-group-banners">
                    {group.sharkIds.map((sharkId) => {
                        const shark = mediaSharks.find((s) => s.id === sharkId);

                        return (
                            <div key={sharkId} className="matched-banner-wrapper">
                                <div className="matched-banner-controls">
                                    <MatchRemoveButton
                                        sharkId={sharkId}
                                        onRemove={(id) =>
                                            requestConfirm(buildRemoveConfirm(id, group))
                                        }
                                    />
                                    <MatchMoveSelect
                                        sharkId={sharkId}
                                        otherGroups={otherGroups}
                                        onMove={(id, targetGroupId) => {
                                            const targetGroup = otherGroups.find(
                                                (g) => g.id === targetGroupId
                                            );
                                            if (targetGroup) {
                                                requestConfirm(
                                                    buildMoveConfirm(id, group, targetGroup)
                                                );
                                            }
                                        }}
                                    />
                                </div>
                                {shark ? (
                                    <SharkBanner
                                        shark={shark}
                                        onImageClick={() => onOpenGallery(shark)}
                                    />
                                ) : (
                                    <p className="graph-panel-missing">No data for ID {sharkId}</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <MatchGroupNotes group={group} />
            </div>
        </div>
    );
}

export default MatchGroupCard;
