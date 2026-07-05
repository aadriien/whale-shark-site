import { mediaSharks } from "../../utils/DataUtils";
import { getMatchGroups, removeSharkFromMatches, clearMatchedPairs } from "../../utils/MatchUtils";
import { useMatchedPairs } from "../../hooks/useMatchedPairs";
import SharkBanner from "../cards/SharkBanner";
import MatchGroupNotes from "./MatchGroupNotes";

function MatchedSharks() {
    // Subscribes to matched-pair changes so this re-renders when they occur
    useMatchedPairs();

    const groups = getMatchGroups();

    // Allow user to reset saved match pairs
    const clearMatches = () => {
        const isConfirmed = confirm(`
            STOP! WAIT!\n\n
            Are you sure you want to erase all of your saved match pairs?
            This cannot be undone.
        `);

        if (isConfirmed) {
            const isConfirmedAgain = confirm(`Seriously, last chance!`);

            if (isConfirmedAgain) {
                clearMatchedPairs();
            }
        }
    };

    return (
        <div className="logbook-section matched-sharks">
            <div className="visited-saved-header">
                <h3>Matched Sharks</h3>
                <button onClick={clearMatches} className="clear-button">
                    Clear All
                </button>
            </div>

            <div className="matched-groups">
                {groups.length > 0 ? (
                    groups.map((sharkIds) => {
                        const groupKey = [...sharkIds].sort().join("::");

                        return (
                            <div key={groupKey} className="matched-group-box">
                                <div className="matched-group-layout">
                                    <div className="matched-group-banners">
                                        {sharkIds.map((sharkId) => {
                                            const shark = mediaSharks.find((s) => s.id === sharkId);

                                            return (
                                                <div key={sharkId} className="matched-banner-wrapper">
                                                    <button
                                                        className="match-remove-btn"
                                                        onClick={() => removeSharkFromMatches(sharkId)}
                                                        aria-label={`Remove ${sharkId} from this matched group`}
                                                    >
                                                        ✕
                                                    </button>
                                                    {shark ? (
                                                        <SharkBanner shark={shark} />
                                                    ) : (
                                                        <p className="graph-panel-missing">No data for ID {sharkId}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <MatchGroupNotes sharkIds={sharkIds} />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>No matched shark pairs saved</p>
                )}
            </div>
        </div>
    );
}

export default MatchedSharks;
