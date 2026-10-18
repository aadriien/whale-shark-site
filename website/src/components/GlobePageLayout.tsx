import BottomSheetLayout from "./BottomSheetLayout";

import { GlobePageLayoutProps } from "../types/globes";

// Globe pages: side panel | globe | side panel, or globe over tabbed bottom sheet
function GlobePageLayout({ containerClassName, children, ...layoutProps }: GlobePageLayoutProps) {
    return (
        <BottomSheetLayout
            className={`${containerClassName} globe-layout`}
            mainClassName="globe-container"
            {...layoutProps}
        >
            {children}
        </BottomSheetLayout>
    );
}

export default GlobePageLayout;
