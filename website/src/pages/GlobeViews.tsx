import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import Globe from "../components/Globe";
import GlobePageLayout from "../components/GlobePageLayout";
import SharkInfoPanel from "../components/panels/SharkInfoPanel";
import SharkSelector from "../components/panels/SharkSelector";
import ContinentDisplay from "../components/panels/ContinentSharksDisplay";
import GlobeSharkCountReadout from "../components/controls/GlobeSharkCountReadout";

import { addPointsData, clearAllData } from "../utils/GlobeUtils";
import { getGroupCoordinates } from "../utils/CoordinateUtils";
import { useGlobeClick } from "../utils/GlobeClick";
import { mediaSharks } from "../utils/DataUtils";

import { WhaleSharkEntryNormalized, WhaleSharkDatasetNormalized } from "../types/sharks";
import { GlobeHandle } from "../types/globes";

function GlobeViews() {
    const [searchParams, setSearchParams] = useSearchParams();
    // Initialize selected shark from URL
    const [selectedShark, setSelectedShark] = useState<WhaleSharkEntryNormalized | null>(() => {
        const sharkId = searchParams.get("selectedSharkId");
        if (sharkId) {
            return mediaSharks.find((s) => s.id === sharkId) || null;
        }
        return null;
    });
    const [allSharksVisible, setAllSharksVisible] = useState<boolean>(true);
    const [filteredSharks, setFilteredSharks] = useState<WhaleSharkDatasetNormalized>(mediaSharks); // track filtered sharks

    const globeHandleRef = useRef<GlobeHandle>(null);

    // Narrow screens only: panel tab showing, with shark list & filters as default
    const [activeTab, setActiveTab] = useState<string>("Sharks");

    // Get coordinates for filtered sharks only
    const filteredPointsData = useMemo(() => {
        // Always use getGroupCoordinates to ensure consistency between sharks and coordinates
        const filteredSharkIds = filteredSharks.map((shark) => shark.id);
        return getGroupCoordinates(filteredSharkIds);
    }, [filteredSharks]);

    const sharks = mediaSharks;

    useEffect(() => {
        // Show filtered sharks if nothing selected
        if (!selectedShark) {
            if (globeHandleRef.current) {
                const globeInstance = globeHandleRef.current.getGlobe();
                clearAllData(globeInstance);
                addPointsData(globeInstance, filteredPointsData);
            }
            setAllSharksVisible(true);
        } else {
            // When shark selected, clear points & show rings for individual
            if (globeHandleRef.current) {
                const globeInstance = globeHandleRef.current.getGlobe();
                clearAllData(globeInstance); // Clear both points & rings
                globeHandleRef.current.highlightShark(selectedShark.id);
            }
            setAllSharksVisible(false);
        }
    }, [selectedShark, filteredPointsData]);

    // However a shark gets selected (globe or list), show its info on narrow screens
    useEffect(() => {
        if (selectedShark) setActiveTab("Info");
    }, [selectedShark]);

    // Initial setup to show sharks on mount
    useEffect(() => {
        if (globeHandleRef.current) {
            const globeInstance = globeHandleRef.current.getGlobe();
            clearAllData(globeInstance);
            addPointsData(globeInstance, filteredPointsData);
        }
    }, [filteredPointsData]);

    // Update query param in URL if shark selected
    useEffect(() => {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (selectedShark) {
                params.set("selectedSharkId", selectedShark.id);
            } else {
                params.delete("selectedSharkId");
            }
            return params;
        });
    }, [selectedShark, setSearchParams]);

    // Direct call to useGlobeClick (with filtered sharks)
    const handleSelectShark = useGlobeClick({
        sharks: filteredSharks,
        pointsData: filteredPointsData,
        allSharksVisible: allSharksVisible,
        onSharkSelect: setSelectedShark,
    });

    const handleReset = () => {
        setSelectedShark(null);
        setAllSharksVisible(true);
    };

    return (
        <div className="page-content globeviews-wrapper">
            {/* <h1>GlobeViews Page</h1> */}

            <GlobePageLayout
                containerClassName="globe-views-container"
                activeTab={activeTab}
                onTabChange={setActiveTab}
                // Shark info panel on left
                left={{
                    label: "Info",
                    className: "info-sidebar",
                    content: <SharkInfoPanel shark={selectedShark} />,
                }}
                // Shark selector dropdown on right
                right={{
                    label: "Sharks",
                    className: "shark-selector",
                    content: (
                        <SharkSelector
                            sharks={sharks}
                            onSelect={handleSelectShark}
                            onReset={handleReset}
                            onDeselect={handleReset}
                            selectedSharkId={selectedShark ? selectedShark.id : null}
                            DisplayComponent={ContinentDisplay}
                            onFilteredSharksChange={setFilteredSharks}
                        />
                    ),
                }}
            >
                {/* Globe component */}
                <Globe
                    ref={globeHandleRef}
                    onSharkClick={handleSelectShark}
                    allowClicks={!selectedShark}
                />
                {/* Only meaningful while globe shows filtered set, not a single shark */}
                {!selectedShark && (
                    <GlobeSharkCountReadout shown={filteredSharks.length} total={sharks.length} />
                )}
            </GlobePageLayout>
        </div>
    );
}

export default GlobeViews;
