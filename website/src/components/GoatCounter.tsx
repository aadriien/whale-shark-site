import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// TypeScript for global window object
declare global {
    interface Window {
        goatcounter?: {
            count: (vars?: {
                path?: string;
                title?: string;
                referrer?: string;
                event?: boolean;
            }) => void;
        };
    }
}

interface GoatCounterProps {
    code: string; // GoatCounter site code (`whaleshark`)
}

export default function GoatCounter({ code }: GoatCounterProps) {
    const location = useLocation();

    useEffect(() => {
        // Prevent script from loading multiple times
        if (document.querySelector(`script[src*="goatcounter"]`)) return;

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://gc.zgo.at/count.js";
        script.setAttribute("data-goatcounter", `https://${code}.goatcounter.com/count`);

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [code]);

    useEffect(() => {
        window.goatcounter?.count({ path: location.pathname });
    }, [location]);

    return null;
}
