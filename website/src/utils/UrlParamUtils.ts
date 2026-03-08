import { SharkBaseCriteria } from "../types/filters";


// Parse URL params into criteria
export function parseCriteria(
    searchParams: URLSearchParams, 
    defaults: SharkBaseCriteria
) {
    const result = { ...defaults };
    
    for (const key in defaults) {
        const value = searchParams.get(key);
        if (!value) continue;
        
        if (Array.isArray(defaults[key])) {
            result[key] = value.split(",");
        } 
        else if (typeof defaults[key] === "boolean") {
            result[key] = value === "true";
        } 
        else if (typeof defaults[key] === "number") {
            result[key] = Number(value);
        } 
        else {
            result[key] = value;
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
    
    for (const key in defaults) {
        const value = criteria[key];
        const def = defaults[key];
        
        if (Array.isArray(value)) {
            if (value.join(",") !== def.join(",")) {
                params.set(key, value.join(","));
            }
        } 
        else if (value !== def) {
            params.set(key, String(value));
        }
    }
    
    return params;
}


