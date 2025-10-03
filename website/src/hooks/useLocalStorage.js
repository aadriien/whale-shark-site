import { useEffect, useState, useCallback } from "react";

export function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            console.log(`Loading ${key} from localStorage: ${saved}`);
            if (saved !== null) {
                return JSON.parse(saved);
            }
            return defaultValue;
        } catch (e) {
            console.error(e);
            return defaultValue;
        }
    });

    useEffect(() => {
        if (value === null) {
            return;
        }
        const rawValue = JSON.stringify(value);
        localStorage.setItem(key, rawValue);
    }, [key, value]);

    const deleteValue = useCallback(() => {
        console.log(`Deleting ${key} from localStorage`);
        localStorage.removeItem(key);
        setValue(defaultValue);
    }, [key, defaultValue]);

    return [value, setValue, deleteValue];
}
