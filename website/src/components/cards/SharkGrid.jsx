import SharkCard from "./SharkCard.jsx";


const SharkGrid = ({ sharks, onPlayStory, isPlaying, playingSharkId }) => {
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
