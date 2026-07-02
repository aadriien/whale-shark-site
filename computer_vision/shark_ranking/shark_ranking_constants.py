###############################################################################
##  `constants.py`                                                           ##
##                                                                           ##
##  Purpose: Output path constants for the shark-level ranking pipeline.     ##
##           Scoped to this feature; existing CONSTANTS.py is unchanged.     ##
###############################################################################


# Re-export shared input paths from the parent pipeline
from ..root_constants import (
    GBIF_OUTPUT_NPZ_FILE,  # noqa: F401
    JSON_OUTPUT_MATCHING_FOLDER,
)

SHARK_RANKING_FOLDER = "computer_vision/data/outputs/new_embeddings/shark_ranking"
# Scoped under shared matching JSON output folder to mirror this subdir's name
JSON_OUTPUT_FOLDER = f"{JSON_OUTPUT_MATCHING_FOLDER}/ranking"

# One row per shark: best match + aggregate distance stats
SHARK_RANKING_CSV = f"{SHARK_RANKING_FOLDER}/GBIF_shark_rankings.csv"
SHARK_RANKING_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_shark_rankings.json"

# One row per image-image pair for winning shark matches
SHARK_PAIRWISE_CSV = f"{SHARK_RANKING_FOLDER}/GBIF_shark_pairwise_distances.csv"
SHARK_PAIRWISE_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_shark_pairwise_distances.json"

# Graph data for the shark-level Cytoscape visualization
SHARK_GRAPH_DATA_FILE = f"{JSON_OUTPUT_FOLDER}/shark_graph_data.json"
