###############################################################################
##  `coco_to_yolo.py`                                                        ##
##                                                                           ##
##  Purpose: Converts relevant COCO data to format that YOLOv8 can use       ##
###############################################################################


import os
import json


def create_coco_to_yolo_labels(coco_json_path: str, output_labels_dir: str) -> None:
    # Create folder to hold labels 
    os.makedirs(output_labels_dir, exist_ok=True)

    with open(coco_json_path, "r") as f:
        coco = json.load(f)

    images = {img["id"]: img for img in coco["images"]}
    annotations = coco["annotations"][:5]

    for annotation in annotations:
        bbox = annotation["bbox"]  # [x_min, y_min, width, height]
        image_id = annotation["image_id"]
        category_id = annotation["category_id"]

        # Get image metadata for YOLOv8 training calculations
        image_info = images.get(image_id)
        if not image_info:
            continue

        img_width = image_info["width"]
        img_height = image_info["height"]
        file_name = image_info["file_name"]

        # Normalize BBOX to YOLO format: x_center, y_center, w, h (all 0–1)
        x, y, w, h = bbox
        x_center = (x + w / 2) / img_width
        y_center = (y + h / 2) / img_height
        w /= img_width
        h /= img_height

        yolo_label = f"{category_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}"

        # Write to corresponding .txt file
        image_basename = os.path.splitext(file_name)[0]
        label_file_path = os.path.join(output_labels_dir, f"{image_basename}.txt")

        with open(label_file_path, "a") as label_file:
            label_file.write(yolo_label + "\n")

    print(f"YOLOv8 labels written to: {output_labels_dir}")



###############################################################################
#
# ——> EXAMPLE USE CASE:
#
# coco_to_yolo_labels(
#     coco_json_path="whaleshark.coco/annotations/instances_train2020.json",
#     output_labels_dir="whaleshark.coco/labels/train2020"
# )
#
###############################################################################




