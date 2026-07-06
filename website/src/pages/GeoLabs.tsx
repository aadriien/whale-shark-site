import { useEffect, useRef, useState, useMemo, useCallback } from "react";

import Globe from "../components/Globe";
import PlayStoryButton from "../components/controls/PlayStoryButton";
import StoryStepSlider from "../components/controls/StoryStepSlider";
import TimelineControls from "../components/controls/TimelineControls";

import SharkInfoPanel from "../components/panels/SharkInfoPanel";
import SharkSelector from "../components/panels/SharkSelector";
import SavedDisplay from "../components/panels/SavedSharksDisplay";
import LabSelectionPanel from "../components/panels/LabSelectionPanel";

import { addPointsData, clearAllData } from "../utils/GlobeUtils";
import { useGlobeClick } from "../utils/GlobeClick";
import { useSavedSharkIds } from "../hooks/useSavedSharkIds";
import { useMatchedGroups } from "../hooks/useMatchedGroups";

import { getGroupCoordinates, getSharkCoordinates } from "../utils/CoordinateUtils";
import { mediaSharks } from "../utils/DataUtils";
import { buildConsolidatedShark } from "../utils/ConsolidatedSharkUtils";

import { WhaleSharkEntryNormalized, WhaleSharkDatasetNormalized } from "../types/sharks";
import { SavedSharksDisplayProps } from "../types/panels";
import { PlottedCoordinatePoint } from "../types/coordinates";
import { GlobeHandle } from "../types/globes";

type ViewMode = "individual" | "multiple";

function GeoLabs() {
    const [selectedShark, setSelectedShark] = useState<WhaleSharkEntryNormalized | null>(null);
    const [allSharksVisible, setAllSharksVisible] = useState<boolean>(true);
    const [filteredSharks, setFilteredSharks] = useState<WhaleSharkDatasetNormalized>(mediaSharks);

    const savedIds = useSavedSharkIds();
    const [viewMode, setViewMode] = useState<ViewMode>("multiple"); // "individual" or "multiple"

    // Combine-matched-sharks toggle: lets the user opt into viewing a
    // selected shark's confirmed match group as 1 consolidated record
    const groups = useMatchedGroups();
    const [combineMatches, setCombineMatches] = useState<boolean>(false);

    const [selectedSharksForLab, setSelectedSharksForLab] = useState<Set<string>>(new Set()); // for multi-select mode
    const selectedSharksForLabRef = useRef(selectedSharksForLab);
    selectedSharksForLabRef.current = selectedSharksForLab;

    // IDs to show highlighted in SharkSelector list, as if auto-clicked,
    // because they share a match group with the current selection(s)
    const highlightedIdsRef = useRef<Set<string>>(new Set());

    // Step-through story functionality
    const [isStepMode, setIsStepMode] = useState<boolean>(false);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [currentPoint, setCurrentPoint] = useState<PlottedCoordinatePoint | null>(null);
    const globeHandleRef = useRef<GlobeHandle>(null);

    // Timeline mode functionality
    const [isTimelineMode, setIsTimelineMode] = useState<boolean>(false);

    const sharks = mediaSharks;

    // The selected shark's match group, if any (individual view only)
    const currentGroup = useMemo(
        () =>
            selectedShark ? groups.find((g) => g.sharkIds.includes(selectedShark.id)) : undefined,
        [selectedShark, groups]
    );

    // Whether the combine toggle would have any effect for the current selection
    const hasApplicableGroup = useMemo(() => {
        if (viewMode === "individual") return Boolean(currentGroup);
        return Array.from(selectedSharksForLab).some((id) =>
            groups.some((g) => g.sharkIds.includes(id))
        );
    }, [viewMode, currentGroup, selectedSharksForLab, groups]);

    // Shark object actually handed to SharkInfoPanel: the raw selection, or
    // (when combining) a consolidated pseudo-record built from its match group
    const panelShark = useMemo(() => {
        if (!combineMatches || !currentGroup || !selectedShark) return selectedShark;

        const sharkMap = new Map(sharks.map((s) => [s.id, s]));
        const members = currentGroup.sharkIds
            .map((id) => sharkMap.get(id))
            .filter((s): s is WhaleSharkEntryNormalized => Boolean(s));

        return members.length > 1 ? buildConsolidatedShark(currentGroup, members) : selectedShark;
    }, [combineMatches, currentGroup, selectedShark, sharks]);

    // Get coordinates for saved sharks only (with any filters in place)
    const pointsData = useMemo(() => {
        const savedSharkIds = [...savedIds];
        const filteredSharkIds = filteredSharks.map((shark) => shark.id);

        // Remove duplicates from both arrays
        const uniqueSavedSharkIds = [...new Set(savedSharkIds)];
        const uniqueFilteredSharkIds = [...new Set(filteredSharkIds)];

        console.log("Unique sharks from saved IDs:", uniqueSavedSharkIds);
        console.log("Unique sharks from filtered IDs:", uniqueFilteredSharkIds);

        // Find intersection (common IDs) between both arrays
        const intersectionSavedFiltered = uniqueSavedSharkIds.filter((id) =>
            uniqueFilteredSharkIds.includes(id)
        );

        console.log("Plotting sharks on globe:", intersectionSavedFiltered);
        return getGroupCoordinates(intersectionSavedFiltered);
    }, [savedIds, filteredSharks]);

    // Lab selection actually used for display / computation: 
    // Consists of the raw clicked IDs, or (when combining) expanded to 
    // include each one's match-group siblings too, since they're 
    // hypothesized to be "the same shark".
    // Note that the raw selectedSharksForLab state itself stays untouched 
    // so click-toggling in SavedSharksDisplay keeps working normally
    const effectiveLabSharkIds = useMemo(() => {
        if (!combineMatches) return selectedSharksForLab;

        const expanded = new Set<string>();
        selectedSharksForLab.forEach((id) => {
            const group = groups.find((g) => g.sharkIds.includes(id));
            (group ? group.sharkIds : [id]).forEach((sid) => expanded.add(sid));
        });
        return expanded;
    }, [combineMatches, selectedSharksForLab, groups]);

    // Sharks to highlight in the selector list (as if auto-clicked): 
    // Individual mode == selected shark's whole match group
    // Multi mode == everything effectiveLabSharkIds already expanded to
    const highlightedIds = useMemo(() => {
        if (!combineMatches) return new Set<string>();
        if (viewMode === "individual") {
            if (!selectedShark) return new Set<string>();
            return new Set(currentGroup ? currentGroup.sharkIds : [selectedShark.id]);
        }
        return effectiveLabSharkIds;
    }, [combineMatches, viewMode, selectedShark, currentGroup, effectiveLabSharkIds]);
    highlightedIdsRef.current = highlightedIds;

    // Get coordinates for selected lab sharks (multi-select mode)
    // Timeline filtering is handled in TimelineControls, not through this memo
    const selectedLabPointsData = useMemo(() => {
        if (effectiveLabSharkIds.size === 0) return [];
        const labSharkIds = Array.from(effectiveLabSharkIds);

        console.log("Plotting selected lab sharks on globe:", labSharkIds);
        return getGroupCoordinates(labSharkIds);
    }, [effectiveLabSharkIds]);

    useEffect(() => {
        if (!globeHandleRef.current) return;

        const globeInstance = globeHandleRef.current.getGlobe();

        // Nothing plotted during step mode
        if (isStepMode) {
            clearAllData(globeInstance);
            setAllSharksVisible(false);
            return;
        }

        // TimelineSelector manages globe state (clears + plots on its own effect)
        if (isTimelineMode) {
            setAllSharksVisible(false);
            return;
        }

        clearAllData(globeInstance);

        if (viewMode === "individual") {
            if (selectedShark) {
                // Individual mode with shark selected - show only that shark's points
                globeHandleRef.current.highlightShark(selectedShark.id, true, false);
                setAllSharksVisible(false);
            } else {
                // Individual mode with no shark selected - show all saved sharks
                addPointsData(globeInstance, pointsData);
                setAllSharksVisible(true);
            }
        } else {
            if (selectedLabPointsData.length > 0) {
                // Show only selected lab sharks
                addPointsData(globeInstance, selectedLabPointsData);
                setAllSharksVisible(true);
            } else {
                // No lab sharks selected, show all saved sharks (default state)
                addPointsData(globeInstance, pointsData);
                setAllSharksVisible(true);
            }
        }
    }, [viewMode, selectedShark, pointsData, selectedLabPointsData, isStepMode, isTimelineMode]);

    // Leverage reusable globe click handler
    const handleSelectShark = useGlobeClick({
        sharks,
        pointsData,
        allSharksVisible,
        onSharkSelect: setSelectedShark,
    });

    const handleReset = () => {
        setSelectedShark(null);
        setAllSharksVisible(true);
        setCombineMatches(false);
    };

    const handleToggleStepMode = () => {
        if (isStepMode) {
            // Exit step mode, i.e. clear data & re-enable controls (no reorientation needed)
            setIsStepMode(false);
            setCurrentStepIndex(0);
            setCurrentPoint(null);

            if (globeHandleRef.current) {
                const globeInstance = globeHandleRef.current.getGlobe();
                clearAllData(globeInstance);

                globeHandleRef.current.enableControls();

                // Show static points for selected shark without reorienting
                if (selectedShark) {
                    const coordinates = getSharkCoordinates(selectedShark.id);
                    addPointsData(globeInstance, coordinates);
                }
            }
        } else {
            // Enter step mode
            setIsStepMode(true);
            setCurrentStepIndex(0);

            if (globeHandleRef.current && selectedShark) {
                // Disable controls, clear points, & prepare for step mode
                globeHandleRef.current.disableControls();
                globeHandleRef.current.highlightShark(selectedShark.id, true, true);

                const globeInstance = globeHandleRef.current.getGlobe();
                clearAllData(globeInstance);
            }
        }
    };

    const handleStepChange = useCallback((stepIndex: number, point: PlottedCoordinatePoint) => {
        setCurrentStepIndex(stepIndex);
        setCurrentPoint(point);

        if (globeHandleRef.current && point) {
            globeHandleRef.current.showSinglePoint(point);
        }
    }, []); // No dependencies since using refs & state setters

    // Stable component reference for display of sharks in SharkSelector panel
    // Can't be inline, otherwise SavedDisplay gets remounted on each GeoLabs re-render
    const SavedDisplayComponent = useCallback(
        (props: SavedSharksDisplayProps) => (
            <SavedDisplay
                {...props}
                viewMode={viewMode}
                selectedSharksForLab={selectedSharksForLabRef.current}
                onLabSelectionChange={setSelectedSharksForLab}
                highlightedIds={highlightedIdsRef.current}
                // Disable onSelect in multiple mode
                onSelect={viewMode === "multiple" ? undefined : props.onSelect}
            />
        ),
        [viewMode]
    ); // selectedSharksForLab read via ref to avoid remount on selection change

    const handleSelectAllToggle = () => {
        if (
            selectedSharksForLab.size > 0 &&
            Array.from(savedIds).every((id) => selectedSharksForLab.has(id))
        ) {
            // All saved sharks are selected, so clear selection
            setSelectedSharksForLab(new Set());
        } else {
            // Not all saved sharks are selected, so select all
            setSelectedSharksForLab(new Set(savedIds));
        }
    };

    const handleToggleViewMode = () => {
        // Complete reset when switching view modes
        setSelectedShark(null);
        setSelectedSharksForLab(new Set());
        setAllSharksVisible(true);
        setCombineMatches(false);

        // Exit step mode if active
        if (isStepMode) {
            setIsStepMode(false);
            setCurrentStepIndex(0);
            setCurrentPoint(null);

            if (globeHandleRef.current) {
                globeHandleRef.current.enableControls();
            }
        }

        // Exit timeline mode if active
        if (isTimelineMode) {
            setIsTimelineMode(false);
        }

        // Clear globe & reset to default state
        if (globeHandleRef.current) {
            const globeInstance = globeHandleRef.current.getGlobe();
            clearAllData(globeInstance);
            // Points will be replotted by main useEffect
        }

        // Switch mode
        setViewMode((prev) => (prev === "individual" ? "multiple" : "individual"));
    };

    const handleToggleTimelineMode = () => {
        if (isTimelineMode) {
            // Exit timeline mode
            setIsTimelineMode(false);
        } else {
            // Enter timeline mode
            setIsTimelineMode(true);
        }
    };

    return (
        <div className="page-content globeviews-wrapper">
            {/* <h1>GeoLabs Page</h1> */}

            <div className="globe-views-container">
                {/* Shark info panel on left */}
                <div className="info-sidebar">
                    {/* View Mode Toggle Button */}
                    <button
                        className={`view-mode-toggle ${viewMode}`}
                        onClick={handleToggleViewMode}
                    >
                        {viewMode === "individual"
                            ? "Switch to Multi Shark View"
                            : "Switch to Single Shark View"}
                    </button>

                    {/* Combine Matched Sharks Toggle */}
                    <button
                        className={`match-consolidate-toggle ${combineMatches ? "active" : ""}`}
                        onClick={() => setCombineMatches((prev) => !prev)}
                        disabled={!hasApplicableGroup}
                    >
                        {combineMatches ? "Ignore Shark Match Groups" : "Combine Matched Sharks"}
                    </button>

                    {/* Step Through Story Controls */}
                    {selectedShark && (
                        <div className="story-controls-container">
                            <PlayStoryButton
                                shark={selectedShark}
                                onToggleStepMode={handleToggleStepMode}
                                isStepMode={isStepMode}
                                showPauseForGeoLabs={true}
                            />

                            {/* Story step slider positioned below button */}
                            <StoryStepSlider
                                shark={selectedShark}
                                onStepChange={handleStepChange}
                                currentStepIndex={currentStepIndex}
                                isVisible={isStepMode}
                                sharkIds={combineMatches ? currentGroup?.sharkIds : undefined}
                            />
                        </div>
                    )}

                    {/* Timeline Mode Controls shown in multiple view */}
                    {viewMode === "multiple" && (
                        <TimelineControls
                            globeRef={globeHandleRef}
                            selectedSharksForLab={effectiveLabSharkIds}
                            savedSharkIds={savedIds}
                            onToggleTimelineMode={handleToggleTimelineMode}
                            isTimelineMode={isTimelineMode}
                        />
                    )}

                    {viewMode === "multiple" ? (
                        <div className="shark-info-panel">
                            <LabSelectionPanel
                                selectedSharksForLab={effectiveLabSharkIds}
                                savedIds={savedIds}
                                sharks={sharks}
                                onSelectAllToggle={handleSelectAllToggle}
                            />
                        </div>
                    ) : (
                        <SharkInfoPanel shark={panelShark} />
                    )}
                </div>

                {/* Globe component */}
                <div className="globe-container">
                    <Globe
                        ref={globeHandleRef}
                        onSharkClick={handleSelectShark}
                        allowClicks={viewMode === "individual" && !selectedShark}
                    />
                    {/* Coordinate display to match SharkTracker positioning */}
                    {isStepMode && currentPoint && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: 10,
                                width: "100%",
                                textAlign: "center",
                                color: "white",
                                fontSize: "0.85rem",
                                fontFamily: "sans-serif",
                                padding: "2px 0",
                                backgroundColor: "rgba(0, 0, 0, 0)",
                                textShadow: "0 0 8px rgba(0, 255, 255, 0.9)",
                                pointerEvents: "none",
                                userSelect: "none",
                            }}
                        >
                            Lat:{" "}
                            <span style={{ fontWeight: "bold" }}>
                                {currentPoint.lat.toFixed(3)}
                            </span>
                            , Lng:{" "}
                            <span style={{ fontWeight: "bold" }}>
                                {currentPoint.lng.toFixed(3)}
                            </span>{" "}
                            — Date:{" "}
                            <span style={{ fontWeight: "bold" }}>{currentPoint.date || "N/A"}</span>
                        </div>
                    )}
                </div>

                {/* Shark selector dropdown on right */}
                <div className="shark-selector">
                    <SharkSelector
                        sharks={sharks}
                        onSelect={handleSelectShark}
                        onReset={handleReset}
                        selectedSharkId={selectedShark ? selectedShark.id : null}
                        DisplayComponent={SavedDisplayComponent}
                        // Disable selector while in step or timeline mode
                        disabled={isStepMode || isTimelineMode}
                        onFilteredSharksChange={setFilteredSharks}
                    />
                </div>
            </div>
        </div>
    );
}

export default GeoLabs;
