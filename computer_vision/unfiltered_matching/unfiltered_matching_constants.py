###############################################################################
##  `constants.py`                                                           ##
##                                                                           ##
##  Purpose: Path constants for unfiltered embedding match outputs.          ##
##           Shared constants live in the root CONSTANTS.py.                 ##
###############################################################################


from ..root_constants import JSON_OUTPUT_MATCHING_FOLDER, NEW_EMBEDDINGS_FOLDER

# Scoped under shared matching JSON output folder to mirror this subdir's name
JSON_OUTPUT_FOLDER = f"{JSON_OUTPUT_MATCHING_FOLDER}/unfiltered"

# Unfiltered match outputs (CSV)
GBIF_MEDIA_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_media_matches.csv"
GBIF_INDIVIDUAL_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_matches.csv"

VALIDATED_MEDIA_MATCHES_FILE = (
    f"{NEW_EMBEDDINGS_FOLDER}/GBIF_media_matches_validated.csv"
)
VALIDATED_SHARK_MATCHES_FILE = (
    f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_matches_validated.csv"
)
VALIDATED_OCCURRENCES_FILE = (
    f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_image_occurrences_validated.csv"
)

# Unfiltered match outputs (JSON, website assets)
GBIF_MEDIA_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_media_matches.json"
GBIF_INDIVIDUAL_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_shark_matches.json"

VALIDATED_MEDIA_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_media_matches_validated.json"
VALIDATED_SHARK_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_shark_matches_validated.json"
VALIDATED_OCCURRENCES_JSON = (
    f"{JSON_OUTPUT_FOLDER}/GBIF_shark_image_occurrences_validated.json"
)
