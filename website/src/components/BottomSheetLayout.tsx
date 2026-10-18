import { PointerEvent, useEffect, useRef, useState } from "react";

import { BottomSheetLayoutProps, SheetPanelSlot, SheetSnap } from "../types/sheets";

const SHEET_SNAPS: SheetSnap[] = ["peek", "half", "full"];
const SWIPE_THRESHOLD_PX = 30;
const DRAG_START_PX = 10;

function BottomSheetLayout({
    className,
    mainClassName = "",
    mainRef,
    left,
    right,
    activeTab: controlledTab,
    onTabChange,
    snap: controlledSnap,
    onSnapChange,
    defaultSnap = "half",
    children,
}: BottomSheetLayoutProps) {
    const tabs = [...new Set([left.label, right.label])];

    // Page may control active tab, otherwise layout tracks it
    const [ownTab, setOwnTab] = useState<string>(tabs[0]);
    const activeTab = controlledTab ?? ownTab;
    const setActiveTab = onTabChange ?? setOwnTab;

    const [ownSnap, setOwnSnap] = useState<SheetSnap>(defaultSnap);
    const snap = controlledSnap ?? ownSnap;
    const setSnap = onSnapChange ?? setOwnSnap;

    const swipeStartY = useRef<number | null>(null);
    const sheetRef = useRef<HTMLDivElement>(null);

    // Whenever tab changes, show content from the top & not hidden by collapsed sheet
    useEffect(() => {
        sheetRef.current?.scrollTo({ top: 0 });
        if (snap === "peek") setSnap("half");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const moveSnap = (step: number) => {
        const index = SHEET_SNAPS.indexOf(snap) + step;
        setSnap(SHEET_SNAPS[Math.min(Math.max(index, 0), SHEET_SNAPS.length - 1)]);
    };

    const handleSwipeMove = (e: PointerEvent<HTMLDivElement>) => {
        if (swipeStartY.current === null) return;

        // Keep receiving pointer events once cursor leaves the bar, but only
        // while dragging, so plain taps still reach tabs & handle as clicks
        if (Math.abs(swipeStartY.current - e.clientY) >= DRAG_START_PX) {
            e.currentTarget.setPointerCapture(e.pointerId);
        }
    };

    const handleSwipeEnd = (clientY: number) => {
        if (swipeStartY.current === null) return;

        // Swipe up opens sheet further, swipe down closes it
        const deltaY = swipeStartY.current - clientY;
        swipeStartY.current = null;

        if (Math.abs(deltaY) >= SWIPE_THRESHOLD_PX) moveSnap(deltaY > 0 ? 1 : -1);
    };

    const renderPanel = (slot: SheetPanelSlot, side: "left" | "right") => (
        <div
            className={`${slot.className} sheet-panel sheet-${side} ${slot.label === activeTab ? "active" : ""}`}
        >
            {slot.content}
        </div>
    );

    return (
        <div className={`${className} sheet-layout`} data-snap={snap}>
            <div ref={mainRef} className={`${mainClassName} sheet-main`}>
                {children}
            </div>

            <div className="sheet" ref={sheetRef}>
                {/* Only shown on narrow screens */}
                <div
                    className="sheet-bar"
                    onPointerDown={(e) => (swipeStartY.current = e.clientY)}
                    onPointerMove={handleSwipeMove}
                    onPointerUp={(e) => handleSwipeEnd(e.clientY)}
                    onPointerCancel={() => (swipeStartY.current = null)}
                >
                    <button
                        type="button"
                        className="sheet-handle"
                        aria-label={snap === "peek" ? "Expand panel" : "Collapse panel"}
                        onClick={() => setSnap(snap === "peek" ? "half" : "peek")}
                    />
                    <div className="sheet-tabs">
                        {tabs.map((label) => (
                            <button
                                key={label}
                                type="button"
                                className={label === activeTab ? "active" : ""}
                                onClick={() => setActiveTab(label)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {renderPanel(left, "left")}
                {renderPanel(right, "right")}
            </div>
        </div>
    );
}

export default BottomSheetLayout;
