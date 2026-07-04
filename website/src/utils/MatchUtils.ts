import { MatchedPair } from "../types/logbooks";

const STORAGE_KEY = "matchedSharkPairs";

// A shark from the image graph can match different sharks across its own
// images, i.e. potentially multiple saved matches per shark. That said,
// "A matches B" is the same as "B matches A", so sort by the 2 IDs first
const PAIR_DELIMITER = "::";

function makePairKey(querySharkId: string, matchedSharkId: string): string {
    return [querySharkId, matchedSharkId].sort().join(PAIR_DELIMITER);
}

function parsePairKey(key: string): MatchedPair {
    const [sharkIdA, sharkIdB] = key.split(PAIR_DELIMITER);
    return { sharkIdA, sharkIdB };
}

export function getMatchedPairKeys(): Set<string> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
}

export function toggleMatchedPair(querySharkId: string, matchedSharkId: string) {
    const pairs = getMatchedPairKeys();
    const key = makePairKey(querySharkId, matchedSharkId);

    // If this query / match pairing is already saved then undo
    if (pairs.has(key)) {
        pairs.delete(key);
    } else {
        pairs.add(key);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...pairs]));

    // Dispatch event to notify components that matched pairs changed
    window.dispatchEvent(new CustomEvent("matchedPairsChanged"));

    return pairs;
}

export function isMatchedPair(querySharkId: string, matchedSharkId: string) {
    return getMatchedPairKeys().has(makePairKey(querySharkId, matchedSharkId));
}

export function getMatchedPairs(): MatchedPair[] {
    return [...getMatchedPairKeys()].map(parsePairKey);
}

export function clearMatchedPairs() {
    localStorage.removeItem(STORAGE_KEY);

    // Dispatch event to notify components that matched pairs changed
    window.dispatchEvent(new CustomEvent("matchedPairsChanged"));
}