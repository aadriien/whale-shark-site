import CVHeroIntro from "../components/overviews/CVHeroIntro.tsx";
import CVPipeline from "../components/overviews/CVPipeline.tsx";
import InteractiveDemo from "../components/overviews/InteractiveDemo.jsx";
import CVApplications from "../components/overviews/CVApplications.tsx";
import SharkMatchViewer from "../components/SharkMatchViewer.jsx";


function SharkVision() {
    return (
        <div className="page-content shark-vision-wrapper">
            {/* <h1>Whale Shark Computer Vision</h1> */}
            
            <CVHeroIntro />
            <CVPipeline />
            <InteractiveDemo />
            <CVApplications />
            <SharkMatchViewer />
        
        </div>
    );
}

export default SharkVision;

