###############################################################################
##  `handle_yolo_model.py`                                                   ##
##                                                                           ##
##  Purpose: Coordinates all logic & setup related to YOLO model             ##
###############################################################################


import os
import re
import torch
from typing import Tuple
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



def get_yolo_model() -> Tuple[YOLO, bool, str]:
    global _MODEL_YOLOv8, _resume_flag, _experiment_name

    if _MODEL_YOLOv8 is not None:
        return _MODEL_YOLOv8, _resume_flag, _experiment_name

    latest_path = get_latest_experiment_folder(PROJECT_RUNS_TRAINS_PATH)

    # Resume training at latest point if it exists! Otherwise start fresh
    if latest_path is not None:
        model_path = os.path.join(latest_path, "weights", "last.pt")
        print("Model with fine-tuning, picking up from:", model_path)

        _MODEL_YOLOv8 = YOLO(model_path)
        _resume_flag = True
        _experiment_name = os.path.basename(latest_path)
    else:
        print("Model being used from scratch (COCO)")

        # `yolov8n.pt` is tiny, can also try `yolov8m.pt` for better accuracy
        _MODEL_YOLOv8 = YOLO("yolov8n.pt")
        _resume_flag = False
        _experiment_name = "shark_detection"

    # Override with basic / fresh model for testing
    # _MODEL_YOLOv8 = YOLO("yolov8n.pt")

    return _MODEL_YOLOv8, _resume_flag, _experiment_name



def freeze_yolo_model():
    model, _, _ = get_yolo_model()

    # Freeze all layers (backbone) except final detection head, to retain COCO
    for name, param in model.model.named_parameters():
        if "detect" not in name:
            param.requires_grad = False

    print("Note: All non-detection layers frozen (backbone COCO)")



def train_yolo_model() -> None:
    model, resume_flag, experiment_name = get_yolo_model()

    # Freeze layers of model to keep COCO base intelligence while fine-tuning
    freeze_yolo_model()

    # Confirm folder for results of training model exists 
    _ = folder_exists(PROJECT_RUNS_TRAINS_PATH, True)

    # Attempt to check if CUDA is available, handle error if on Mac (no CUDA)
    # Use Nvidia GPU where possible, otherwise just fall back to CPU 
    try:
        if torch.cuda.is_available():
            print("Success, PyTorch with CUDA available!")

            # Use all available GPUs (2 for RC greene cluster)
            num_gpus = torch.cuda.device_count()
            if num_gpus > 1:
                device = ",".join(str(i) for i in range(num_gpus))  # e.g., "0,1"
            else:
                device = "cuda"
            batch = 32
        else:
            print("PyTorch with CUDA is NOT available, defaulting to CPU")
            device = "cpu"
            batch = 16
    except Exception as e:
        print(f"Error checking CUDA: {e}")
        device = "cpu"
        batch = 16

    epochs = 50

    print(f"Model training overview: ")
    print(f"  Epochs: {epochs}")
    print(f"  Batch: {batch}")
    print(f"  Device: {device}")

    model.train(
        data=YAML_FILE, 
        epochs=epochs, 
        batch=batch, 
        imgsz=640,  # YOLO recommends 640x640 image size
        project=PROJECT_RUNS_TRAINS_PATH,  # Where to store training results 
        name=experiment_name,  # Some variation of `shark_detection`
        resume=resume_flag,
        device=device  
    )



def prep_data_for_yolo() -> None:
    # Translate COCO JSON data into format that YOLOv8 can understand
    # create_coco_to_yolo_labels(
    #     coco_json_path=ANNOTATIONS_PATH,
    #     output_labels_dir=OUTPUT_LABELS_FOLDER
    # )

    # Set working directory to script's location
    current_working_dir = os.getcwd()
    base_dir = os.path.join(current_working_dir, FULL_PATH_TO_DATASET_FOLDER)

    create_data_yaml(
        base_dir=base_dir,
        output_yaml_path="data.yaml"
    )



if __name__ == "__main__":
    prep_data_for_yolo()

    train_yolo_model()




