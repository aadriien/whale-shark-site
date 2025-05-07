import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const SHARK_VIDEO_960_540 = "./videos/whaleshark_960_540_30fps.mp4";
const SHARK_VIDEO_1280_720 = "./videos/whaleshark_1280_720_60fps.mp4";
const SHARK_VIDEO_1920_1080 = "./videos/whaleshark_1920_1080_30fps.mp4";

function BackgroundVideo() {
    const videoRef = useRef();
    const location = useLocation();

    useEffect(() => {
        const isHome = location.pathname === "/home";

        if (videoRef.current) {
            if (isHome) {
                videoRef.current.play().catch(() => {});
            } else {
                videoRef.current.pause();
            }
        }
    }, [location]);
    
    return (
        <video
            ref={videoRef}
            src={SHARK_VIDEO_960_540}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: -1,
            }}
        />
    );
}
    
export default BackgroundVideo;

    