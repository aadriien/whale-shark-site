###############################################################################
##  `handle_yolo_model.py`                                                   ##
##                                                                           ##
##  Purpose: Coordinates all logic & setup related to YOLO model             ##
###############################################################################


import os
import re
from ultralytics import YOLO


from src.utils.data_utils import (
    folder_exists,
)

from .process_annotations import (
    FULL_PATH_TO_DATASET_FOLDER, ANNOTATIONS_PATH,
)

from .coco_to_yolo import (
    create_coco_to_yolo_labels, create_data_yaml, 
)


YAML_FILE = f"{FULL_PATH_TO_DATASET_FOLDER}/data.yaml"

OUTPUT_LABELS_FOLDER = f"{FULL_PATH_TO_DATASET_FOLDER}/labels/train2020"

TRAINING_RESULTS_FOLDER = f"{FULL_PATH_TO_DATASET_FOLDER}/training-results"
PROJECT_RUNS_TRAINS_PATH = f"{TRAINING_RESULTS_FOLDER}/runs/train"


# Internal cache for ad hoc reference
_MODEL_YOLOv8 = None
_resume_flag = None
_experiment_name = None


# Identify resume point for YOLOv8n model training
def get_latest_experiment_folder(project_path: str, base_name: str = "shark_detection") -> str:
    folders = [f for f in os.listdir(project_path) if f.startswith(base_name)]
    if not folders:
        return None  

    folders_with_ids = [
        (f, int(re.search(r'\d+$', f).group()) if re.search(r'\d+$', f) else 0)
        for f in folders
    ]
    latest = max(folders_with_ids, key=lambda x: x[1])[0]

    return os.path.join(project_path, latest)



def get_yolo_model():
    global _MODEL_YOLOv8, _resume_flag, _experiment_name

    if _MODEL_YOLOv8 is not None:
        return _MODEL_YOLOv8, _resume_flag, _experiment_name

    latest_path = get_latest_experiment_folder(PROJECT_RUNS_TRAINS_PATH)

    # Resume training at latest point if it exists! Otherwise start fresh
    if latest_path is not None:
        model_path = os.path.join(latest_path, "weights", "last.pt")
        print("Resuming training from:", model_path)

        _MODEL_YOLOv8 = YOLO(model_path)
        _resume_flag = True
        _experiment_name = os.path.basename(latest_path)
    else:
        # `yolov8n.pt` is tiny, can also try `yolov8m.pt` for better accuracy
        _MODEL_YOLOv8 = YOLO("yolov8n.pt")
        _resume_flag = False
        _experiment_name = "shark_detection"

    return _MODEL_YOLOv8, _resume_flag, _experiment_name



def train_YOLO_model() -> None:
    # Translate COCO JSON data into format that YOLOv8 can understand
    # create_coco_to_yolo_labels(
    #     coco_json_path=ANNOTATIONS_PATH,
    #     output_labels_dir=OUTPUT_LABELS_FOLDER
    # )

    # create_data_yaml(
    #     base_dir=FULL_PATH_TO_DATASET_FOLDER,
    #     output_yaml_path="data.yaml"
    # )

    model, resume_flag, experiment_name = get_yolo_model()

    # Confirm folder for results of training model exists 
    _ = folder_exists(PROJECT_RUNS_TRAINS_PATH, True)

    model.train(
        data=YAML_FILE, 
        epochs=50, 
        batch=16, 
        imgsz=640,  # YOLO recommends 640x640 image size
        project=PROJECT_RUNS_TRAINS_PATH,  # Where to store training results 
        name=experiment_name,  # Some variation of `shark_detection`
        resume=resume_flag,
        device="cpu"  
    )




