import { SharkBaseCriteria } from "../types/filters";


// Parse URL params into criteria
export function parseCriteria(
    searchParams: URLSearchParams, 
    defaults: SharkBaseCriteria
) {
    const result: SharkBaseCriteria = { ...defaults };
    const mutableResult = result as Record<string, unknown>;
    const defaultsLookup = defaults as Record<string, unknown>;

    for (const key in defaults) {
        const value = searchParams.get(key);
        if (!value) continue;

        if (Array.isArray(defaultsLookup[key])) {
            mutableResult[key] = value.split(",");
        }
        else if (typeof defaultsLookup[key] === "boolean") {
            mutableResult[key] = value === "true";
        }
        else if (typeof defaultsLookup[key] === "number") {
            mutableResult[key] = Number(value);
        }
        else {
            mutableResult[key] = value;
        }
    }

    return result;
}


// Serialize criteria into URL params
export function criteriaToParams(
    criteria: SharkBaseCriteria, 
    defaults: SharkBaseCriteria
) {
    const params = new URLSearchParams();
    const criteriaLookup = criteria as Record<string, unknown>;
    const defaultsLookup = defaults as Record<string, unknown>;

    for (const key in defaults) {
        const value = criteriaLookup[key];
        const def = defaultsLookup[key];

        if (Array.isArray(value)) {
            if (value.join(",") !== (def as unknown[]).join(",")) {
                params.set(key, value.join(","));
            }
        }
        else if (value !== def) {
            params.set(key, String(value));
        }
    }
    
    return params;
}


