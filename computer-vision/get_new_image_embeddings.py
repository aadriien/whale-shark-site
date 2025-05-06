###############################################################################
##  `get_new_image_embeddings.py`                                            ##
##                                                                           ##
##  Purpose: Calculates bounding box & model-outputted embedding per image   ##
###############################################################################


import torch
import warnings
import requests
import numpy as np
import pandas as pd
from PIL import Image
from io import BytesIO

import torchvision.transforms as transforms
from transformers import AutoModel


from src.utils.data_utils import (
    read_csv, folder_exists,
)

from src.clean.gbif import (
    GBIF_MEDIA_CSV,
)

from .handle_yolo_model import (
    get_yolo_model, 
)


NEW_EMBEDDINGS_FOLDER = "computer-vision/new-embeddings"
GBIF_OUTPUT_NPZ_FILE = f"{NEW_EMBEDDINGS_FOLDER}/gbif_media_embeddings.npz"


_EMBEDDINGS_MODEL = None

def get_embeddings_model():
    global _EMBEDDINGS_MODEL

    # Only load model once at start, then just reuse (lazy-loading pattern)
    if _EMBEDDINGS_MODEL is None:
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore")
            MODEL_TAG_MiewIDmsv3 = "conservationxlabs/miewid-msv3"

            _EMBEDDINGS_MODEL = AutoModel.from_pretrained(
                MODEL_TAG_MiewIDmsv3, 
                trust_remote_code=True
            )

    return _EMBEDDINGS_MODEL



# Step 1: Open gbif_media.csv & read all entries (grab images)

def get_image_records() -> pd.DataFrame:
    media_df = read_csv(GBIF_MEDIA_CSV)

    # Keep only relevant columns
    RELEVANT_COLUMNS = [
        "key", # maps to key in regular GBIF occurrence dataset
        "occurrenceID", 
        "identificationID", 
        "format", 
        "references", 
        "identifier" # image URL (often in AWS S3 bucket)
    ]
    media_df = media_df[RELEVANT_COLUMNS]

    media_df_clean = media_df.dropna(subset=RELEVANT_COLUMNS)
    media_df_clean.reset_index(drop=True, inplace=True)

    return media_df_clean



# Step 2: Use YOLOv8 model to detect shark object & create bounding box

def calculate_bbox(image: Image.Image) -> list[float]:
    # Visualize bounding box result (display image with cropped rectangle)
    model, _, _ = get_yolo_model()
    results = model(image, conf=0.1, iou=0.4)
    
    # Try displaying image with BBOX 
    # try:
    #     results[0].show()
    # except Exception as e:
    #     print(f"Warning: Could not display image: {e}")

    boxes = results[0].boxes

    # If nothing detected, leave empty
    if not boxes:
        print("No objects detected.")
        return []

    # Access object detections
    for box in boxes:
        cls_id = int(box.cls[0]) # Class ID
        confidence = float(box.conf[0]) # Confidence score
        label = model.names[cls_id] # Class label (e.g. "shark")

        print(f"Detected: {label}, with confidence: {confidence}")

        # Return BBOX coordinates (xyxy format, converting tensor to list)
        return box.xyxy[0].tolist()  

    # Select box with highest confidence
    best_idx = boxes.conf.argmax().item()
    best_box = boxes.xyxy[best_idx].tolist()

    print(f"Selected best BBOX: {best_box} (Confidence: {boxes.conf[best_idx]:.4f})")
    return best_box



# Step 3: Use Hugging Face MiewID-msv3 model to generate image embedding 

def compute_embedding(cropped_img: Image.Image) -> torch.Tensor:
    # Load preprocessing pipeline
    preprocess = transforms.Compose([
        transforms.Resize((440, 440)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    # Extract embedding via model
    input_tensor = preprocess(cropped_img).unsqueeze(0)
    with torch.no_grad():
        model = get_embeddings_model()
        output = model(input_tensor)

    return output.squeeze().cpu().numpy()



# Intermediate steps: Handle media records iteration, temp image download, etc

def load_image_from_url(url: str) -> Image.Image:
    response = requests.get(url, timeout=10)
    response.raise_for_status() 

    return Image.open(BytesIO(response.content)).convert("RGB")



def process_single_image(row) -> dict:
    try:
        # Download image temporarily (using PIL), then pass to YOLOv8
        image = load_image_from_url(row["identifier"])
        bbox = calculate_bbox(image)
        if not bbox:
            return {}

        # YOLO-style BBOX + cropping [x1, y1, x2, y2]
        width, height = image.size
        x1, y1, x2, y2 = [
            max(0, min(coord, dim)) 
            for coord, dim 
            in zip(bbox, [width, height, width, height])
        ]

        cropped = image.crop((x1, y1, x2, y2))
        embedding = compute_embedding(cropped)

        return {
            "embedding": embedding,
            "bbox": bbox,
            "image_id (GBIF key)": row["key"],
            "occurrenceID (GBIF)": row["occurrenceID"],
            "identificationID (GBIF)": row["identificationID"],
            "image_url (GBIF identifier)": row["identifier"],
        }

    except Exception as e:
        print(f"Error processing image {row.get('key', 'unknown')}: {e}")
        return {}



def process_all_images(media_df: pd.DataFrame) -> None:
    results = []

    # Calculate BBOX + embedding for each image in media records
    for _, row in media_df.iterrows():
        result = process_single_image(row)
        if result:
            results.append(result)

    # Extract fields & assemble for full export
    embeddings = np.array([r["embedding"] for r in results])
    bboxes = np.array([r["bbox"] for r in results])
    image_id_keys = np.array([r["image_id (GBIF key)"] for r in results])
    occurrenceIDs = np.array([r["occurrenceID (GBIF)"] for r in results])
    identificationIDs = np.array([r["identificationID (GBIF)"] for r in results])
    image_url_identifiers = np.array([r["image_url (GBIF identifier)"] for r in results])

    # Confirm folder to hold embeddings exists, then save to .npz file
    _ = folder_exists(GBIF_OUTPUT_NPZ_FILE, True)
    np.savez(
        GBIF_OUTPUT_NPZ_FILE,
        embeddings=embeddings,
        bboxes=bboxes,
        image_id_keys=image_id_keys,
        occurrenceIDs=occurrenceIDs,
        identificationIDs=identificationIDs,
        image_url_identifiers=image_url_identifiers
    )

    print(f"Saved {len(embeddings)} embeddings to: {GBIF_OUTPUT_NPZ_FILE}")



def view_npz_file() -> None:
    data = np.load(GBIF_OUTPUT_NPZ_FILE)

    # Print keys to see what's inside
    print("Keys in the .npz file:", data.keys())

    # Access arrays from .npz file
    embeddings = data["embeddings"]
    bboxes = data["bboxes"]
    image_id_keys = data["image_id_keys"]
    occurrenceIDs = data["occurrenceIDs"]
    identificationIDs = data["identificationIDs"]
    image_url_identifiers = data["image_url_identifiers"]

    # Check shape of embeddings (how many)
    print("Embeddings shape:", embeddings.shape)

    # Print first few values to inspect
    print("First 3 embeddings (+ their associated metadata):")
    for i in range(min(3, len(embeddings))):  
        print(f"Embedding {i+1}:")
        print(f"  Embedding: {embeddings[i]}")
        print(f"  BBOX: {bboxes[i]}")
        print(f"  Image ID (GBIF key): {image_id_keys[i]}")
        print(f"  Occurrence ID (GBIF): {occurrenceIDs[i]}")
        print(f"  Identification ID (GBIF): {identificationIDs[i]}")
        print(f"  Image URL (GBIF identifier): {image_url_identifiers[i]}")
        print("-" * 50)  # Separator for readability



if __name__ == "__main__":
    gbif_media_df = get_image_records()
    # print(f"Size of media file: {gbif_media_df.shape[0]}")

    test_df = gbif_media_df.head(1000)

    process_all_images(test_df)

    view_npz_file()




