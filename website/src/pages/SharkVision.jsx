import CVHeroIntro from "../components/overviews/CVHeroIntro.jsx";
import CVPipeline from "../components/overviews/CVPipeline.jsx";
import InteractiveDemo from "../components/overviews/InteractiveDemo.jsx";
import CVApplications from "../components/overviews/CVApplications.jsx";
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

