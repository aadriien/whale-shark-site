###############################################################################
##  `generate_vision_examples.py`                                            ##
##                                                                           ##
##  Purpose: Generate visualization examples with YOLO bounding boxes        ##
##           & segmentation masks overlaid on whale shark images             ##
###############################################################################


import cv2
import warnings
import requests
import numpy as np
import pandas as pd

from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from typing import Optional, Tuple, List


from src.utils.data_utils import (
    read_csv, folder_exists,
)

from src.clean.gbif import (
    GBIF_MEDIA_CSV,
)

from .handle_yolo_model import (
    get_yolo_model, 
)


# Output directory for generated vision examples
VISION_IMAGES_FOLDER = "computer-vision/vision-images"
BBOX_FOLDER = f"{VISION_IMAGES_FOLDER}/bbox"
SEGMENTATION_FOLDER = f"{VISION_IMAGES_FOLDER}/segmentation"


def setup_output_directories() -> None:
    # Ensure directories exist for storing generated images
    _ = folder_exists(BBOX_FOLDER, True)
    _ = folder_exists(SEGMENTATION_FOLDER, True)

    print(f"Output directories created: {BBOX_FOLDER}, {SEGMENTATION_FOLDER}")


def load_image_from_url(url: str) -> Optional[Image.Image]:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status() 
        return Image.open(BytesIO(response.content)).convert("RGB")
    
    except Exception as e:
        print(f"Failed to load image from {url}: {e}")
        return None


def get_sample_image_records(num_samples: int = 20) -> pd.DataFrame:
    # Get subset of image records from GBIF media CSV for processing 
    media_df = read_csv(GBIF_MEDIA_CSV)
    
    # Keep only relevant columns
    RELEVANT_COLUMNS = [
        "key",
        "occurrenceID", 
        "identificationID", 
        "format", 
        "references", 
        "identifier" # image URL
    ]
    media_df = media_df[RELEVANT_COLUMNS]
    
    # Clean & sample
    media_df_clean = media_df.dropna(subset=RELEVANT_COLUMNS)
    media_df_clean.reset_index(drop=True, inplace=True)
    
    # Return random sample
    sample_size = min(num_samples, len(media_df_clean))
    return media_df_clean.sample(n=sample_size, random_state=42).reset_index(drop=True)


def run_yolo_inference(image: Image.Image) -> Tuple[List, List]:
    # Get bounding boxes & segmentation masks via YOLO model
    model, _, _ = get_yolo_model()
    
    results = model(image, conf=0.25, iou=0.4)
    
    bbox_results = []
    segmentation_results = []
    
    for result in results:
        # Bounding boxes
        if result.boxes is not None:
            boxes = result.boxes

            for box in boxes:
                cls_id = int(box.cls[0])
                confidence = float(box.conf[0])
                label = model.names[cls_id]
                xyxy = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                
                bbox_results.append({
                    'class': label,
                    'confidence': confidence,
                    'bbox': xyxy
                })
        
        # Segmentation masks
        if hasattr(result, 'masks') and result.masks is not None:
            masks = result.masks

            for i, mask in enumerate(masks):
                cls_id = int(result.boxes.cls[i])
                confidence = float(result.boxes.conf[i])
                label = model.names[cls_id]
                
                # Get mask data
                mask_data = mask.data[0].cpu().numpy() # Convert to numpy
                
                segmentation_results.append({
                    'class': label,
                    'confidence': confidence,
                    'mask': mask_data
                })
    
    return bbox_results, segmentation_results


def draw_bounding_boxes(image: Image.Image, bbox_results: List) -> Image.Image:
    # Draw bounding boxes with labels on image 
    img_with_boxes = image.copy()
    draw = ImageDraw.Draw(img_with_boxes)
    
    try:
        font = ImageFont.truetype("Arial.ttf", 24)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
        except:
            font = ImageFont.load_default()
    
    # Color palette for different classes
    colors = [
        (255, 0, 0),    # Red
        (0, 255, 0),    # Green
        (0, 0, 255),    # Blue
        (255, 255, 0),  # Yellow
        (255, 0, 255),  # Magenta
        (0, 255, 255),  # Cyan
    ]
    
    for i, detection in enumerate(bbox_results):
        x1, y1, x2, y2 = detection['bbox']
        label = detection['class']
        confidence = detection['confidence']
        
        # Select color, draw BBOX, & prep text label
        color = colors[i % len(colors)]
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
        label_text = f"{label}: {confidence:.2f}"
        
        # Get text BBOX for background
        bbox = draw.textbbox((0, 0), label_text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Draw label background & text
        draw.rectangle([x1, y1-text_height-6, x1+text_width+6, y1], fill=color)        
        draw.text((x1+3, y1-text_height-3), label_text, fill=(255, 255, 255), font=font)
    
    return img_with_boxes


def draw_segmentation_masks(image: Image.Image, segmentation_results: List) -> Image.Image:
    # Draw segmentation masks on image
    img_array = np.array(image)
    
    # Color palette for different classes (with alpha)
    colors = [
        (255, 0, 0, 128),    # Semi-transparent Red
        (0, 255, 0, 128),    # Semi-transparent Green
        (0, 0, 255, 128),    # Semi-transparent Blue
        (255, 255, 0, 128),  # Semi-transparent Yellow
        (255, 0, 255, 128),  # Semi-transparent Magenta
        (0, 255, 255, 128),  # Semi-transparent Cyan
    ]
    
    # Create overlay image with alpha channel
    overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    for i, detection in enumerate(segmentation_results):
        mask = detection['mask']
        label = detection['class']
        confidence = detection['confidence']
        
        # Resize mask to match image dimensions if needed
        # PIL size is (width, height), numpy is (height, width)
        if mask.shape != image.size[::-1]:  
            mask = cv2.resize(mask.astype(np.uint8), image.size, interpolation=cv2.INTER_NEAREST)
        
        mask_bool = mask > 0.5        
        color = colors[i % len(colors)]
        
        # Create mask image
        mask_img = Image.new('RGBA', image.size, (0, 0, 0, 0))
        mask_pixels = mask_img.load()
        
        # Apply color to mask pixels
        height, width = mask_bool.shape
        for y in range(height):
            for x in range(width):
                if mask_bool[y, x]:
                    mask_pixels[x, y] = color
        
        # Composite mask onto overlay
        overlay = Image.alpha_composite(overlay, mask_img)
    
    # Composite overlay onto original image
    if overlay.mode == 'RGBA':
        # Convert original to RGBA for compositing
        img_rgba = image.convert('RGBA')
        result = Image.alpha_composite(img_rgba, overlay)

        return result.convert('RGB')
    
    return image


def process_image_for_vision_examples(row: pd.Series) -> bool:
    # Process single image to generate BBOX & segmentation examples
    try:
        image_url = row["identifier"]
        image = load_image_from_url(image_url)
        
        if image is None:
            return False
        
        print(f"Processing image: {row['key']} ({image.size})")
        
        # Run YOLO inference
        bbox_results, segmentation_results = run_yolo_inference(image)
        
        if not bbox_results and not segmentation_results:
            print(f"  No detections found in image {row['key']}")
            return False
        
        print(f"  Found {len(bbox_results)} bboxes, {len(segmentation_results)} segmentation masks")
        
        # Generate filename
        image_key = row["key"]
        base_filename = f"shark_{image_key}"
        
        # Generate & save BBOX version
        if bbox_results:
            bbox_image = draw_bounding_boxes(image, bbox_results)
            bbox_path = f"{BBOX_FOLDER}/{base_filename}_bbox.jpg"
            bbox_image.save(bbox_path, "JPEG", quality=95)
            print(f"  Saved bbox image: {bbox_path}")
        
        # Generate & save segmentation version
        if segmentation_results:
            seg_image = draw_segmentation_masks(image, segmentation_results)
            seg_path = f"{SEGMENTATION_FOLDER}/{base_filename}_segmentation.jpg"
            seg_image.save(seg_path, "JPEG", quality=95)
            print(f"  Saved segmentation image: {seg_path}")
        
        return True
        
    except Exception as e:
        print(f"Error processing image {row.get('key', 'unknown')}: {e}")
        return False


def generate_vision_examples(num_samples: int = 10) -> None:
    print(f"Generating vision examples for {num_samples} sample images...")
    
    # Setup output directories & get sample images
    setup_output_directories()
    
    sample_df = get_sample_image_records(num_samples)
    print(f"Selected {len(sample_df)} images for processing")
    
    # Process each image
    successful_count = 0
    for _, row in sample_df.iterrows():
        if process_image_for_vision_examples(row):
            successful_count += 1
    
    print(f"\nCompleted! Successfully processed {successful_count}/{len(sample_df)} images")
    print(f"Results saved to:")
    print(f"  - Bounding boxes: {BBOX_FOLDER}")
    print(f"  - Segmentation masks: {SEGMENTATION_FOLDER}")


if __name__ == "__main__":
    # Suppress warnings for cleaner output
    warnings.filterwarnings("ignore")
    
    generate_vision_examples(num_samples=10)


