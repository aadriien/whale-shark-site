import { useState, useEffect } from "react";


function LightDarkToggle({ theme, setTheme }) {
    const [isNight, setIsNight] = useState(theme === "dark");
    
    // Keep in sync when parent theme changes
    useEffect(() => {
        setIsNight(theme === "dark");
    }, [theme]);
    
    const toggle = () => {
        const newTheme = isNight ? "light" : "dark";
        setTheme(newTheme);
        setIsNight(!isNight);
    };
    
    return (
        <button
            onClick={toggle}
            className={`theme-switcher-grid ${isNight ? "night-theme" : ""}`}
            title="Toggle Theme"
            aria-label="Toggle Theme"
            type="button"
        >
            <div className="sun" />
            <div className="moon-overlay" />

            <div className="cloud-ball cloud-ball-left" />
            <div className="cloud-ball cloud-ball-middle" />
            <div className="cloud-ball cloud-ball-right" />
            <div className="cloud-ball cloud-ball-top" />

            <div className="star" />
            <div className="star" />
            <div className="star" />
            <div className="star" />
        </button>
    );
}

export default LightDarkToggle;

