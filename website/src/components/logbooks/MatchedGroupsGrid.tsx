import MatchGroupCard from "./MatchGroupCard";

import { MatchedGroupsGridProps } from "../../types/logbooks";

const MatchedGroupsGrid = ({ groups, onOpenGallery, requestConfirm }: MatchedGroupsGridProps) => {
    return (
        <div className="matched-groups">
            {groups.length > 0 ? (
                groups.map((group) => (
                    <MatchGroupCard
                        key={group.id}
                        group={group}
                        otherGroups={groups.filter((g) => g.id !== group.id)}
                        onOpenGallery={onOpenGallery}
                        requestConfirm={requestConfirm}
                    />
                ))
            ) : (
                <p>No matched shark pairs saved</p>
            )}
        </div>
    );
};

export default MatchedGroupsGrid;
