import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";

const SHARK_VIDEO_960_540 = "./videos/whaleshark_960_540_30fps.mp4";
const SHARK_VIDEO_1280_720 = "./videos/whaleshark_1280_720_60fps.mp4";
const SHARK_VIDEO_1920_1080 = "./videos/whaleshark_1920_1080_30fps.mp4";

const GLOBE_VIEWS_IMG = "./globe-views.png";
const DATA_VISUALS_IMG = "./data-visuals.png";
const BUILD_A_SHARK_IMG = "./build-a-shark.png";
const SHARK_TRACKER_IMG = "./shark-tracker.png";


function BackgroundVideo() {
    const videoRef = useRef();
    const location = useLocation();

    const [showCards, setShowCards] = useState(false); 
    const [isPaused, setIsPaused] = useState(false); 

    const [videoOpacity, setVideoOpacity] = useState(1); 
    const [cardsOpacity, setCardsOpacity] = useState(1); 

    useEffect(() => {
        const isHome = location.pathname === "/home";

        if (videoRef.current) {
            if (isHome) {
                if (!isPaused) {
                    videoRef.current.play().catch(() => {});
                }
            } 
            else {
                videoRef.current.pause();
            }
        }
    }, [location, isPaused]); // Re-run effect if `isPaused` changes

    const handleVideoEnd = () => {
        // Pause video after 1st loop, show cards of pages, then repeat
        if (!isPaused) {
            setIsPaused(true);
            videoRef.current.pause(); 
            setVideoOpacity(0.4); 

            setShowCards(true); 
            setCardsOpacity(1); 

            setTimeout(() => {
                // After 10 seconds, fade cards out & fade video back in 
                setCardsOpacity(0); 
                setTimeout(() => {
                    videoRef.current.play().catch(() => {}); 
                    setVideoOpacity(1); 
                    setIsPaused(false); 
                }, 500); // Delay video fade-in after cards fade-out
            }, 10000); 
        }
    };

    return (
        <div style={{ position: "relative", height: "100vh" }}>
            {/* Video element */}
            <video
                ref={videoRef}
                src={SHARK_VIDEO_960_540}
                autoPlay
                muted
                loop={false}  
                playsInline
                preload="none"
                onEnded={handleVideoEnd}  
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    zIndex: -1,
                    opacity: videoOpacity,
                    transition: "opacity 1s ease-in-out", 
                }}
            />

            {/* Cards for navigation */}
            {showCards && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex",
                        flexDirection: "row",
                        gap: "40px", 
                        zIndex: 1, // Ensure cards appear above video
                        opacity: cardsOpacity, // Set opacity based on cards state
                        transition: "opacity 1s ease-in-out", 
                    }}
                >
                    <Card link="/globeviews" title="Globe Views" imageSrc={GLOBE_VIEWS_IMG} />
                    <Card link="/datavisuals" title="Data Visuals" imageSrc={DATA_VISUALS_IMG} />
                    <Card link="/buildashark" title="Build-A-Shark" imageSrc={BUILD_A_SHARK_IMG} />
                    <Card link="/sharktracker" title="Shark Tracker" imageSrc={SHARK_TRACKER_IMG} />
                </div>
            )}
        </div>
    );
}

// Card component for each page link
function Card({ link, title, imageSrc }) {
    return (
        <Link
            to={link}
            style={{
                display: "block",
                width: "200px", 
                height: "250px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "white",
                textAlign: "center",
                borderRadius: "15px", 
                textDecoration: "none",
                fontSize: "22px", 
                transition: "transform 0.3s, background-color 0.3s, box-shadow 0.3s",
                position: "relative", // Position text below image
            }}
            onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.1)"; 
                e.target.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
                e.target.style.boxShadow = "0 6px 15px rgba(0, 0, 0, 0.7)";
            }}
            onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)"; 
                e.target.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
                e.target.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.5)";
            }}
        >
            {/* Image container */}
            <div
                style={{
                    width: "100%",
                    height: "150px", 
                    overflow: "hidden", 
                    borderRadius: "15px 15px 0 0", 
                }}
            >
                <img
                    src={imageSrc}
                    alt={title}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover", 
                    }}
                />
            </div>

            {/* Text below image */}
            <div
                style={{
                    position: "absolute",
                    bottom: "10px", 
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "18px", 
                    fontWeight: "bold",
                    color: "white",
                    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.6)", 
                }}
            >
                {title}
            </div>
        </Link>
    );
}


export default BackgroundVideo;

