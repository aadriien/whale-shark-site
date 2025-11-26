import CVHeroIntro from "../components/overviews/CVHeroIntro";
import CVPipeline from "../components/overviews/CVPipeline";
import InteractiveDemo from "../components/overviews/InteractiveDemo";
import CVApplications from "../components/overviews/CVApplications";
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

