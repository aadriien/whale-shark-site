###############################################################################
##  `constants.py`                                                           ##
##                                                                           ##
##  Purpose: Path constants for plausibility-filtered match outputs.         ##
##           Shared constants live in the root CONSTANTS.py.                 ##
###############################################################################


from ..root_constants import JSON_OUTPUT_FOLDER, NEW_EMBEDDINGS_FOLDER

# Plausibility-filtered match outputs (candidates excluded if geo/temporal
# implied travel speed makes them IMPOSSIBLE). Powers build_graph.py, while
# the unfiltered files continue to power the SharkMatchViewer.

GBIF_PLAUSIBLE_MEDIA_MATCHES_FILE = (
    f"{NEW_EMBEDDINGS_FOLDER}/GBIF_plausible_media_matches.csv"
)
GBIF_PLAUSIBLE_MEDIA_MATCHES_JSON = (
    f"{JSON_OUTPUT_FOLDER}/GBIF_plausible_media_matches.json"
)

GBIF_PLAUSIBLE_INDIVIDUAL_MATCHES_FILE = (
    f"{NEW_EMBEDDINGS_FOLDER}/GBIF_plausible_shark_matches.csv"
)
GBIF_PLAUSIBLE_INDIVIDUAL_MATCHES_JSON = (
    f"{JSON_OUTPUT_FOLDER}/GBIF_plausible_shark_matches.json"
)

# Match graph output (website asset)
GRAPH_DATA_FILE = f"{JSON_OUTPUT_FOLDER}/graph_data.json"
