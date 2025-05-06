###############################################################################
##  `coco_to_yolo.py`                                                        ##
##                                                                           ##
##  Purpose: Converts relevant COCO data to format that YOLOv8 can use       ##
###############################################################################


import os
import json
import yaml


def create_coco_to_yolo_labels(coco_json_path: str, output_labels_dir: str) -> None:
    # Create folder to hold labels 
    os.makedirs(output_labels_dir, exist_ok=True)

    with open(coco_json_path, "r") as f:
        coco = json.load(f)

    images = {img["id"]: img for img in coco["images"]}
    annotations = coco["annotations"][:160]

    # Group all labels for each image
    labels_by_image = {}

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
        image_basename = os.path.splitext(file_name)[0]

        # Normalize BBOX to YOLO format: x_center, y_center, w, h (all 0–1)
        x, y, w, h = bbox
        x_center = (x + w / 2) / img_width
        y_center = (y + h / 2) / img_height
        w /= img_width
        h /= img_height

        yolo_label = f"{category_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}"

        # Append to list of labels for this image
        if image_basename not in labels_by_image:
            labels_by_image[image_basename] = []
        labels_by_image[image_basename].append(yolo_label)

    # Write all labels for each image at once
    for image_basename, labels in labels_by_image.items():
        label_file_path = os.path.join(output_labels_dir, f"{image_basename}.txt")

        # Overwrite file, NO appending (otherwise duplicates mess up model training)
        with open(label_file_path, "w") as label_file:  
            label_file.write("\n".join(labels) + "\n")

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



def create_data_yaml(base_dir: str, output_yaml_path: str) -> None:
    base_dir = os.path.abspath(base_dir)

    data = {
        "path": base_dir,
        "train": f"{base_dir}/images/train2020",
        "val": f"{base_dir}/images/train2020",
        "names": {
            0: "whale_shark"
        },
    }

    with open(f"{base_dir}/{output_yaml_path}", "w") as f:
        yaml.dump(data, f)

    print(f"data.yaml written to: {base_dir}/{output_yaml_path}")


###############################################################################
#
# ——> EXAMPLE USE CASE:
#
# create_data_yaml("whaleshark.coco", "data.yaml")
#
###############################################################################




