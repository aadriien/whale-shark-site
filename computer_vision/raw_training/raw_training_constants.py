###############################################################################
##  `constants.py`                                                           ##
##                                                                           ##
##  Purpose: Path constants specific to raw training data & model setup.     ##
##           Shared constants live in the root CONSTANTS.py.                 ##
###############################################################################


# Training data (raw .tar) & extraction destination
TRAINING_DATA_FOLDER = "computer_vision/data/inputs/training_data"
LILA_NINGALOO_ARZOUMANIAN_COCO_TAR = "whaleshark.coco.tar"

EXTRACTED_DATA_FOLDER = "computer_vision/data/inputs/extracted_data"
LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED = "whaleshark.coco_extracted"

# COCO dataset paths (annotations, images, YOLO config)
SPECIFIC_DATASET_FOLDER = "whaleshark.coco"
FULL_PATH_TO_DATASET_FOLDER = (
    f"{EXTRACTED_DATA_FOLDER}/{LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED}"
    f"/{SPECIFIC_DATASET_FOLDER}"
)

ANNOTATIONS_PATH = f"{FULL_PATH_TO_DATASET_FOLDER}/annotations/instances_train2020.json"
IMAGES_PATH = f"{FULL_PATH_TO_DATASET_FOLDER}/images/train2020"

YAML_FILE = f"{FULL_PATH_TO_DATASET_FOLDER}/data.yaml"
OUTPUT_LABELS_FOLDER = f"{FULL_PATH_TO_DATASET_FOLDER}/labels/train2020"
TRAINING_RESULTS_FOLDER = f"{FULL_PATH_TO_DATASET_FOLDER}/training-results"
PROJECT_RUNS_TRAINS_PATH = f"{TRAINING_RESULTS_FOLDER}/runs/train"
