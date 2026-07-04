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

// Saved pairs are direct edges (A-B, B-C, etc), but matches are transitive:
// if A matches B and B matches C, then A / B / C all belong together.
// So group by connected component over the edge set
export function getMatchGroups(): string[][] {
    const adjacency = new Map<string, Set<string>>();

    for (const key of getMatchedPairKeys()) {
        const { sharkIdA, sharkIdB } = parsePairKey(key);

        if (!adjacency.has(sharkIdA)) adjacency.set(sharkIdA, new Set());
        if (!adjacency.has(sharkIdB)) adjacency.set(sharkIdB, new Set());
        adjacency.get(sharkIdA)!.add(sharkIdB);
        adjacency.get(sharkIdB)!.add(sharkIdA);
    }

    const visited = new Set<string>();
    const groups: string[][] = [];

    for (const sharkId of adjacency.keys()) {
        if (visited.has(sharkId)) continue;

        const group: string[] = [];
        const queue = [sharkId];
        visited.add(sharkId);

        while (queue.length > 0) {
            const current = queue.shift()!;
            group.push(current);

            for (const neighbor of adjacency.get(current) ?? []) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        groups.push(group);
    }

    return groups;
}

// Removes every saved edge touching this shark. Any other shark left with
// no remaining edges naturally drops out of getMatchGroups() too, since
// groups are derived from edges rather than stored directly
export function removeSharkFromMatches(sharkId: string) {
    const pairs = getMatchedPairKeys();

    for (const key of pairs) {
        const { sharkIdA, sharkIdB } = parsePairKey(key);
        if (sharkIdA === sharkId || sharkIdB === sharkId) {
            pairs.delete(key);
        }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...pairs]));

    // Dispatch event to notify components that matched pairs changed
    window.dispatchEvent(new CustomEvent("matchedPairsChanged"));
}

export function clearMatchedPairs() {
    localStorage.removeItem(STORAGE_KEY);

    // Dispatch event to notify components that matched pairs changed
    window.dispatchEvent(new CustomEvent("matchedPairsChanged"));
}