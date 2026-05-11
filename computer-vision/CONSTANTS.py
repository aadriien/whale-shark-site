###############################################################################
##  `CONSTANTS.py`                                                           ##
##                                                                           ##
##  Purpose: Shared path constants across the computer-vision pipeline       ##
###############################################################################


# Training data (raw .tar) & extraction destination
TRAINING_DATA_FOLDER = "computer-vision/training-data"
LILA_NINGALOO_ARZOUMANIAN_COCO_TAR = "whaleshark.coco.tar"

EXTRACTED_DATA_FOLDER = "computer-vision/extracted-data"
LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED = "whaleshark.coco_extracted"

# COCO dataset paths (annotations, images, YOLO config)
SPECIFIC_DATASET_FOLDER = "whaleshark.coco"
FULL_PATH_TO_DATASET_FOLDER = f"{EXTRACTED_DATA_FOLDER}/{LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED}/{SPECIFIC_DATASET_FOLDER}"

ANNOTATIONS_PATH = f"{FULL_PATH_TO_DATASET_FOLDER}/annotations/instances_train2020.json"
IMAGES_PATH = f"{FULL_PATH_TO_DATASET_FOLDER}/images/train2020"

YAML_FILE = f"{FULL_PATH_TO_DATASET_FOLDER}/data.yaml"
OUTPUT_LABELS_FOLDER = f"{FULL_PATH_TO_DATASET_FOLDER}/labels/train2020"
TRAINING_RESULTS_FOLDER = f"{FULL_PATH_TO_DATASET_FOLDER}/training-results"
PROJECT_RUNS_TRAINS_PATH = f"{TRAINING_RESULTS_FOLDER}/runs/train"

# Ningaloo source-of-truth embeddings database
EMBEDDINGS_DATABASE_FOLDER = "computer-vision/embeddings-database"
OUTPUT_NPZ_FILE = f"{EMBEDDINGS_DATABASE_FOLDER}/whaleshark_ningaloo_embeddings.npz"

# GBIF new embeddings + match outputs
NEW_EMBEDDINGS_FOLDER = "computer-vision/new-embeddings"
GBIF_OUTPUT_NPZ_FILE = f"{NEW_EMBEDDINGS_FOLDER}/gbif_media_embeddings.npz"
GBIF_MEDIA_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_media_matches.csv"
GBIF_INDIVIDUAL_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_matches.csv"

VALIDATED_MEDIA_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_media_matches_validated.csv"
VALIDATED_SHARK_MATCHES_FILE = f"{NEW_EMBEDDINGS_FOLDER}/GBIF_shark_matches_validated.csv"

# JSON outputs (website assets)
JSON_OUTPUT_FOLDER = "./website/src/assets/data/json"
GBIF_MEDIA_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_media_matches.json"
GBIF_INDIVIDUAL_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_shark_matches.json"
VALIDATED_MEDIA_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_media_matches_validated.json"
VALIDATED_SHARK_MATCHES_JSON = f"{JSON_OUTPUT_FOLDER}/GBIF_shark_matches_validated.json"

# Vision examples output
VISION_IMAGES_FOLDER = "computer-vision/vision-images"
ORIGINAL_FOLDER = f"{VISION_IMAGES_FOLDER}/original"
BBOX_FOLDER = f"{VISION_IMAGES_FOLDER}/bbox"
SEGMENTATION_FOLDER = f"{VISION_IMAGES_FOLDER}/segmentation"
BBOX_SEGMENTATION_FOLDER = f"{VISION_IMAGES_FOLDER}/bbox-segmentation"

# Match graph output (website asset)
GRAPH_DATA_FILE = f"{JSON_OUTPUT_FOLDER}/graph_data.json"

