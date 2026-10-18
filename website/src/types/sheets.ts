import { ReactNode, Ref } from "react";

/* Bottom sheet types */

export type SheetSnap = "peek" | "half" | "full";

export type SheetPanelSlot = {
    // Tab title on narrow screens (panels sharing a label share a tab)
    label: string;
    className: string;
    content: ReactNode;
};

export type BottomSheetLayoutProps = {
    className: string;
    mainClassName?: string;
    mainRef?: Ref<HTMLDivElement>;
    left: SheetPanelSlot;
    right: SheetPanelSlot;
    // Optional so a page can switch tabs itself
    activeTab?: string;
    onTabChange?: (label: string) => void;
    // Optional so a page can open or collapse sheet itself
    snap?: SheetSnap;
    onSnapChange?: (snap: SheetSnap) => void;
    defaultSnap?: SheetSnap;
    // Main visual (globe, graph canvas, image pair)
    children: ReactNode;
};
