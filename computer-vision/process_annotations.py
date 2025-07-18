###############################################################################
##  `process_annotations.py`                                                 ##
##                                                                           ##
##  Purpose: Loads dataset JSON & processes training data                    ##
###############################################################################


import json
import torch
import warnings
import numpy as np
from PIL import Image

import torchvision.transforms as transforms
from transformers import AutoModel # For MiewID & DINOv2
from transformers import AutoImageProcessor # For DINOv2


from src.utils.data_utils import (
    folder_exists, prettify_json,
)

from .extract_tar_data import (
    EXTRACTED_DATA_FOLDER, LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED,
)


###############################################################################
# ——> DATASET FIELDS FOR LILA NINGALOO:
#
# bbox == bounding coordinates x, y, w, h (x_min, y_min, width, height)
# theta == bounding box rotation in radians (often 0.0 if unused)
# viewpoint == which side of animal visible, e.g. left or right
# segmentation == detailed outline of animal via polygon points
# segmentation_bbox == bounding box to fully contain segmentation polygon
# area == pixel area covered by polygon (width x height)
# iscrowd == 0 if single individual, or 1 if multiple animals in image
# id == ID of this annotation (bounding box instance) in current dataset 
# image_id == ID of image that this annotation belongs to
# category_id == category label for object class (0 since only whale sharks)
# uuid == globally unique ID for this annotation (bbox)
# individual_ids == list of related annotation IDs, i.e. matched to same individual
# isinterest == 1 if annotation considered interesting/important for identification tasks
# name == final identity (UUID format) of individual shark associated with this annotation
# review_ids == list of IDs for manual human review (usually empty)
#
###############################################################################
# ——> KEY SUMMARY / KEY FIELDS FOR IDENTIFICATION:
#
# iscrowd == sanity check that we're looking at 1 shark (vs several)
# id == which annotation we're reviewing now, i.e. computer vision makeup
# image_id == which image corresponds to this annotation
# individual_ids == what OTHER annotations (ID'ed images) exist for THIS shark
# isinterest == best to pay attention to good data
# name == the actual shark!! Globally unique identity!
#
###############################################################################
# ——> REAL EXAMPLE WITH FIELDS:
#
# {
#     "bbox": [ 18.0, 582.0, 2412.0, 1248.0 ],
#     "theta": 0.0,
#     "viewpoint": "right",
#     "segmentation": [
#         [ 18, 582, 2430, 582, 2430, 1830, 18, 1830, 18, 582 ]
#     ],
#     "segmentation_bbox": [ 18, 582, 2412, 1248 ],
#     "area": 3010176,
#     "iscrowd": 0,
#     "id": 1,
#     "image_id": 1,
#     "category_id": 0,
#     "uuid": "0e7fd0d4-9c69-4b08-ad14-ed912112171c",
#     "individual_ids": [
#         1,
#         3922
#     ],
#     "isinterest": 1,
#     "name": "10563a2a-4c62-e8c9-e5a5-8582bf2eb059",
#     "review_ids": []
# }
#
###############################################################################


SPECIFIC_DATASET_FOLDER = "whaleshark.coco"
FULL_PATH_TO_DATASET_FOLDER = f"{EXTRACTED_DATA_FOLDER}/{LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED}/{SPECIFIC_DATASET_FOLDER}"

ANNOTATIONS_PATH = f"{FULL_PATH_TO_DATASET_FOLDER}/annotations/instances_train2020.json"
IMAGES_PATH = f"{FULL_PATH_TO_DATASET_FOLDER}/images/train2020"

EMBEDDINGS_DATABASE_FOLDER = "computer-vision/embeddings-database"
OUTPUT_NPZ_FILE = f"{EMBEDDINGS_DATABASE_FOLDER}/whaleshark_ningaloo_embeddings.npz"


def print_annotations() -> None:
    # Pretty print JSON to console
    clean_annotations = prettify_json(ANNOTATIONS_PATH, fields=["annotations"], limit=3)
    print(clean_annotations)



def populate_embeddings_database() -> None:
    # Load model (+ ignore harmless warning about model's state_dict
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore")

        MODEL_TAG_MIEWID = "conservationxlabs/miewid-msv3"
        MODEL_TAG_DINOV2 = "facebook/dinov2-base"

        miewid_model = AutoModel.from_pretrained(MODEL_TAG_MIEWID, trust_remote_code=True)
        dinov2_model = AutoModel.from_pretrained(MODEL_TAG_DINOV2)
        dinov2_processor = AutoImageProcessor.from_pretrained(MODEL_TAG_DINOV2)

    # Prep for resizing of image to work with model (requires 440 x 440 pixels)
    preprocess = transforms.Compose([
        transforms.Resize((440, 440)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    # Prepare lists to store embeddings, IDs, etc (building reference library)
    miewid_embeddings = []
    dinov2_embeddings = []
    image_ids = []
    annotation_ids = []
    whale_shark_names = []

    # Load annotations JSON, then loop through & process each image
    with open(ANNOTATIONS_PATH, "r") as f:
        annotations = json.load(f)

    for annotation in annotations["annotations"]:
        bbox = annotation["bbox"] 
        image_id = annotation["image_id"]
        annotation_id = annotation["id"]
        whale_shark_name = annotation["name"]

        # Load current image path (assuming leading zeroes, e.g. 000000000027.jpg)
        image_filename = f"{IMAGES_PATH}/{str(image_id).zfill(12)}.jpg"
        
        try:
            img = Image.open(image_filename).convert("RGB")
        except FileNotFoundError:
            print(f"Image {image_filename} not found, skipping...")
            continue

        # Crop image using bounding box, then preprocess (as prepped above)
        x, y, w, h = bbox
        crop = img.crop((x, y, x + w, y + h)) # COCO-style BBOX + cropping

        # Prepare MIEWID input
        input_tensor = preprocess(crop).unsqueeze(0)

        with torch.no_grad():
            # MIEWID embedding extraction 
            miewid_output = miewid_model(input_tensor)
            # `output.shape` == `torch.Size([1, 2152])`, so just use output as embedding
            miewid_embedding = miewid_output.squeeze().cpu().numpy()

            # DINOv2 embedding extraction 
            dino_inputs = dinov2_processor(images=crop, return_tensors="pt")
            dino_output = dinov2_model(**dino_inputs)
            # Average pooling over last hidden states (mean over sequence length dimension)
            dinov2_embedding = dino_output.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()

        # Append embeddings for both MIEWID & DINOv2 
        miewid_embeddings.append(miewid_embedding)
        dinov2_embeddings.append(dinov2_embedding)

        image_ids.append(image_id)
        annotation_ids.append(annotation_id)
        whale_shark_names.append(whale_shark_name)

        # Print status update every 1000 images
        if image_id % 1000 == 0:
            print(f"Checkpoint: Processed image_id: {image_id}")

    print(f"Processed {len(image_ids)} image_ids, with MIEWID embedding shape: {miewid_embedding.shape}")

    # Convert lists to numpy arrays for .npz file
    miewid_embeddings = np.array(miewid_embeddings)
    dinov2_embeddings = np.array(dinov2_embeddings)

    image_ids = np.array(image_ids)
    annotation_ids = np.array(annotation_ids)
    whale_shark_names = np.array(whale_shark_names)

    # Confirm folder to hold embeddings exists, then save to .npz file
    _ = folder_exists(OUTPUT_NPZ_FILE, True)
    np.savez(
        OUTPUT_NPZ_FILE, 
        miewid_embeddings=miewid_embeddings,
        dinov2_embeddings=dinov2_embeddings,
        image_ids=image_ids, 
        annotation_ids=annotation_ids, 
        whale_shark_names=whale_shark_names
    )

    print(f"Embeddings saved to: '{OUTPUT_NPZ_FILE}'")



def view_npz_file() -> None:
    data = np.load(OUTPUT_NPZ_FILE)

    # Print keys to see what's inside
    print("Keys in the .npz file:", data.keys())

    # Access arrays from .npz file
    miewid_embeddings = data["miewid_embeddings"]
    dinov2_embeddings = data["dinov2_embeddings"]

    image_ids = data["image_ids"]
    annotation_ids = data["annotation_ids"]
    whale_shark_names = data["whale_shark_names"]

    # Check shape of embeddings (how many)
    print("MIEWID Embeddings shape:", miewid_embeddings.shape)
    print("DINOv2 Embeddings shape:", dinov2_embeddings.shape)

    # Print first few values to inspect
    print("First 3 embeddings (+ their associated metadata):")
    for i in range(min(3, len(miewid_embeddings))):  
        print(f"Embedding {i+1}:")
        print(f"  MIEWID embedding: {miewid_embeddings[i]}")
        print(f"  DINOv2 embedding: {dinov2_embeddings[i]}")
        print(f"  Image ID: {image_ids[i]}")
        print(f"  Annotation ID: {annotation_ids[i]}")
        print(f"  Whale Shark Name: {whale_shark_names[i]}")
        print("-" * 50)  # Separator for readability



if __name__ == "__main__":
    # print_annotations()

    # populate_embeddings_database()
    view_npz_file()


