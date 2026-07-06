import { buildTimelineEntries } from "../../utils/DataUtils";

import FavoriteButton from "../controls/FavoriteButton";
import SharkTimeline from "../cards/SharkTimeline";
import SharkMediaGallery from "../cards/SharkMediaGallery";

import ChartPlaceholder from "../charts/ChartPlaceholder";

import { IndividualSharkOrNullProps } from "../../types/sharks";

const SharkInfoPanel = ({ shark }: IndividualSharkOrNullProps) => {
    if (!shark) {
        return (
            <div className="shark-info-panel">
                <h2>Select a whale shark to view its records</h2>
                <ChartPlaceholder type="globeViews" message="" />
            </div>
        );
    }

    return (
        <div className="shark-info-panel">
            <h2>
                ID: {shark.id}
                <FavoriteButton sharkId={shark.id} />
            </h2>

            <div className="shark-panel-details">
                <div className="shark-traits">
                    <p className="shark-details">
                        <strong>Sex:</strong>&nbsp; {shark.sex}
                    </p>
                    <p className="shark-details">
                        <strong>Life Stage:</strong>&nbsp; {shark.lifeStage}
                    </p>
                </div>

                <div className="shark-records">
                    <h3 className="shark-details">
                        <strong>Total Records:</strong>&nbsp; {shark.occurrences}
                    </h3>
                    <p className="shark-details">
                        {shark.oldest} &nbsp;...&nbsp; {shark.newest}
                    </p>
                    <p className="shark-details">
                        <strong>Satellite tracking:</strong>&nbsp;&nbsp;
                        {Math.round((shark.machine / (shark.machine + shark.human)) * 100)}%
                    </p>
                    <p className="shark-details">
                        <strong>Human sightings:</strong>&nbsp;&nbsp;
                        {Math.round((shark.human / (shark.machine + shark.human)) * 100)}%
                    </p>
                </div>

                <div className="shark-regions">
                    <h3 className="shark-details">Places Visited</h3>
                    <ul className="timeline-list">
                        <SharkTimeline entries={buildTimelineEntries(shark)} />
                    </ul>
                </div>

                <SharkMediaGallery shark={shark} />
            </div>
        </div>
    );
};

export default SharkInfoPanel;
