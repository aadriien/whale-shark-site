###############################################################################
##  `root_constants.py`                                                      ##
##                                                                           ##
##  Purpose: Shared path constants used across multiple subdirs.             ##
##           Subdir-specific constants live in each subdir's constants.py.   ##
###############################################################################


# Ningaloo source-of-truth embeddings database
EMBEDDINGS_DATABASE_FOLDER = "computer_vision/data/outputs/embeddings_database"
OUTPUT_NPZ_FILE = f"{EMBEDDINGS_DATABASE_FOLDER}/whaleshark_ningaloo_embeddings.npz"

# GBIF new embeddings + match outputs (base path for subdir constants)
NEW_EMBEDDINGS_FOLDER = "computer_vision/data/outputs/new_embeddings"
GBIF_OUTPUT_NPZ_FILE = f"{NEW_EMBEDDINGS_FOLDER}/gbif_media_embeddings.npz"

# JSON outputs (website assets, base path for subdir constants)
JSON_OUTPUT_ROOT_FOLDER = "./website/src/assets/data/json"
JSON_OUTPUT_MATCHING_FOLDER = f"{JSON_OUTPUT_ROOT_FOLDER}/matching"
