import { mediaSharks } from "../../utils/DataUtils";
import { getMatchedPairs, toggleMatchedPair, clearMatchedPairs } from "../../utils/MatchUtils";
import { useMatchedPairs } from "../../hooks/useMatchedPairs";
import SharkBanner from "../cards/SharkBanner";

function MatchedSharks() {
    // Subscribes to matched-pair changes so this re-renders when they occur
    useMatchedPairs();

    const pairs = getMatchedPairs();

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
                {pairs.length > 0 ? (
                    pairs.map(({ sharkIdA, sharkIdB }) => {
                        const sharkA = mediaSharks.find((s) => s.id === sharkIdA);
                        const sharkB = mediaSharks.find((s) => s.id === sharkIdB);

                        return (
                            <div key={`${sharkIdA}::${sharkIdB}`} className="matched-pair-box">
                                <button
                                    className="match-remove-btn"
                                    onClick={() => toggleMatchedPair(sharkIdA, sharkIdB)}
                                    aria-label={`Remove saved match between ${sharkIdA} and ${sharkIdB}`}
                                >
                                    ✕
                                </button>
                                <div className="matched-pair-banners">
                                    {sharkA ? (
                                        <SharkBanner shark={sharkA} />
                                    ) : (
                                        <p className="graph-panel-missing">No data for ID {sharkIdA}</p>
                                    )}
                                    {sharkB ? (
                                        <SharkBanner shark={sharkB} />
                                    ) : (
                                        <p className="graph-panel-missing">No data for ID {sharkIdB}</p>
                                    )}
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
