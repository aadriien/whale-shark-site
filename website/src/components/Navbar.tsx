import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

import LightDarkToggle from "./controls/LightDarkMode";

import { NavbarProps } from "../types/pages";

function Navbar({ isLogbookOpen, setIsLogbookOpen, theme, setTheme }: NavbarProps) {
    // Get current route (page), so user knows where they are
    const location = useLocation();

    const isResearchReef = location.pathname.startsWith("/research");
    const isCreativeCurrent = location.pathname.startsWith("/creative");

    // Page links fold into a dropdown on narrow screens
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handlePointerDown = (e: PointerEvent) => {
            if (!navRef.current?.contains(e.target as Node)) setIsMenuOpen(false);
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsMenuOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMenuOpen]);

    const handleLogbookClick = () => {
        setIsLogbookOpen((prev) => !prev);
    };

    return (
        <nav ref={navRef}>
            <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="nav-menu-button"
                title="Toggle Menu"
                aria-label="Toggle Menu"
                aria-expanded={isMenuOpen}
                type="button"
            >
                {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>

            <LightDarkToggle theme={theme} setTheme={setTheme} />

            <button
                onClick={handleLogbookClick}
                className={`logbook-button ${isLogbookOpen ? "active" : ""}`}
                title="Open Logbook"
                aria-label="Open Logbook" // for accessibility, e.g. screen readers
                type="button"
            >
                <img src="/whale-shark-icon.jpg" alt="Logbook icon" />
            </button>

            <div className="version-toggle">
                <Link to="/research" className={isResearchReef ? "active-version reef" : "reef"}>
                    Research<span className="nav-pill-suffix"> Reef</span>
                </Link>
                <Link
                    to="/creative"
                    className={isCreativeCurrent ? "active-version current" : "current"}
                >
                    Creative<span className="nav-pill-suffix"> Current</span>
                </Link>
            </div>

            <div
                className={`nav-links ${isMenuOpen ? "open" : ""}`}
                onClick={() => setIsMenuOpen(false)}
            >
                {/* Always visible */}
                <Link to="/home" className={location.pathname === "/home" ? "active" : ""}>
                    Home
                </Link>
                <Link to="/about" className={location.pathname === "/about" ? "active" : ""}>
                    About
                </Link>

                {/* Research Reef only */}
                {isResearchReef && (
                    <>
                        <Link
                            to="/research/globeviews"
                            className={location.pathname === "/research/globeviews" ? "active" : ""}
                        >
                            Globe Views
                        </Link>
                        <Link
                            to="/research/sharktracker"
                            className={
                                location.pathname === "/research/sharktracker" ? "active" : ""
                            }
                        >
                            Shark Tracker
                        </Link>
                        <Link
                            to="/research/geolabs"
                            className={location.pathname === "/research/geolabs" ? "active" : ""}
                        >
                            Geo Labs
                        </Link>
                        <Link
                            to="/research/datavisuals"
                            className={
                                location.pathname === "/research/datavisuals" ? "active" : ""
                            }
                        >
                            Data Visuals
                        </Link>
                        <Link
                            to="/research/environment"
                            className={
                                location.pathname === "/research/environment" ? "active" : ""
                            }
                        >
                            Environment
                        </Link>
                        <Link
                            to="/research/sharkvision"
                            className={
                                location.pathname === "/research/sharkvision" ? "active" : ""
                            }
                        >
                            Shark Vision
                        </Link>
                    </>
                )}

                {/* Creative Current only */}
                {isCreativeCurrent && (
                    <>
                        <Link
                            to="/creative/buildashark"
                            className={
                                location.pathname === "/creative/buildashark" ? "active" : ""
                            }
                        >
                            Build-A-Shark
                        </Link>
                        <Link
                            to="/creative/animation"
                            className={location.pathname === "/creative/animation" ? "active" : ""}
                        >
                            Animation
                        </Link>
                        <Link
                            to="/creative/aquarium"
                            className={location.pathname === "/creative/aquarium" ? "active" : ""}
                        >
                            Aquarium
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
