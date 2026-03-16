import SharkCard from "./SharkCard";

import { SharkGridProps } from "../../types/cards";


const SharkGrid = ({ 
    sharks, 
    onPlayStory, 
    isPlaying, 
    playingSharkId 
}: SharkGridProps) => {
    return (
        <div className="shark-grid">
            {sharks.map((shark) => (
                <SharkCard 
                    key={shark.id} shark={shark} 
                    onPlayStory={onPlayStory} isPlaying={isPlaying} 
                    playingSharkId={playingSharkId}
                />
            ))}
        </div>
    );
};

export default SharkGrid;

