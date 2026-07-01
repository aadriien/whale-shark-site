export type ResolvedFilters<K extends string> = {
    active: Set<K>;
    locked: Set<K>;
};

// Propagates a constraint table to a fixed point, starting from the filters
// the user has directly turned on. Forced-on targets join `active`;
// forced-off targets are dropped from (+ kept out of) `active`. Any target
// forced by a filter OTHER than itself is `locked`, i.e. its button can't be
// toggled, since the constraint would just reassert itself.
//
// Exception: a key the user directly turned on is never locked, even if some
// OTHER active key's constraints force it back to the same value. Otherwise
// the user's own selection would become un-toggleable, with no way to undo it.
export function resolveFilters<K extends string>(
    userActive: Set<K>,
    constraints: Record<K, Partial<Record<K, boolean>>>
): ResolvedFilters<K> {
    const active = new Set(userActive);
    const forcedOff = new Set<K>();
    const locked = new Set<K>();

    let changed = true;
    while (changed) {
        changed = false;
        for (const key of [...active]) {
            if (!active.has(key)) continue;

            for (const [target, value] of Object.entries(constraints[key]) as [K, boolean | undefined][]) {
                const targetKey = target;
                if (value) {
                    if (!active.has(targetKey)) {
                        active.add(targetKey);
                        changed = true;
                    }
                    // Mutual reinforcement (target forced to the same "on" state
                    // the user already chose) doesn't lock it, so it stays
                    // toggleable. A forced-off target always conflicts with the
                    // user's choice, so it's locked regardless.
                    if (targetKey !== key && !userActive.has(targetKey)) locked.add(targetKey);
                } else {
                    if (!forcedOff.has(targetKey)) {
                        forcedOff.add(targetKey);
                        changed = true;
                    }
                    if (active.delete(targetKey)) changed = true;
                    if (targetKey !== key) locked.add(targetKey);
                }
            }
        }
    }

    return { active, locked };
}
