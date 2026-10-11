import { useSearchParams } from "react-router-dom";

import FolderTabs from "../components/controls/FolderTabs";
import CVHeroIntro from "../components/overviews/CVHeroIntro";
import CVPipeline from "../components/overviews/CVPipeline";
import InteractiveDemo from "../components/overviews/InteractiveDemo";
import CVApplications from "../components/overviews/CVApplications";
import SharkMatchViewer from "../components/SharkMatchViewer";
import SharkMatchGraph from "../components/graphs/matching/SharkMatchGraph";
import SharkRankingGraph from "../components/graphs/ranking/SharkRankingGraph";

const TABS = [
    { id: "learn", label: "Learn" },
    { id: "try", label: "Try" },
    { id: "explore", label: "Explore" },
];

function SharkVision() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Active tab lives in URL, so a tab can be linked to directly
    const activeTab = TABS.find((tab) => tab.id === searchParams.get("tab"))?.id ?? "learn";

    const handleTabChange = (id: string) => {
        setSearchParams(
            (prev) => {
                const params = new URLSearchParams(prev);
                params.set("tab", id);
                return params;
            },
            { replace: true }
        );
    };

    return (
        <div className="page-content shark-vision-wrapper">
            {/* <h1>Whale Shark Computer Vision</h1> */}

            <CVHeroIntro part="hero">
                <FolderTabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
            </CVHeroIntro>

            {activeTab === "learn" && (
                <>
                    <CVHeroIntro part="intro" />
                    <CVPipeline />
                    <CVApplications />
                </>
            )}

            {activeTab === "try" && <InteractiveDemo />}

            {activeTab === "explore" && (
                <>
                    <SharkMatchViewer />
                    <SharkMatchGraph />
                    <SharkRankingGraph />
                </>
            )}
        </div>
    );
}

export default SharkVision;
