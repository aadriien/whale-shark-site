###############################################################################
##  `process_annotations.py`                                                 ##
##                                                                           ##
##  Purpose: Loads dataset JSON & processes training data                    ##
###############################################################################


import json

from src.utils.data_utils import (
    prettify_json,
)

from .extract_tar_data import (
    EXTRACTED_DATA_FOLDER, LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED,
)


LILA_NINGALOO_ANNOTATIONS = "whaleshark.coco/annotations/instances_train2020.json"


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



def print_annotations() -> None:
    json_file = f"{EXTRACTED_DATA_FOLDER}/{LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED}/{LILA_NINGALOO_ANNOTATIONS}"

    # Pretty print JSON to console
    clean_annotations = prettify_json(json_file, fields=["annotations"], limit=3)
    print(clean_annotations)


if __name__ == "__main__":
    print_annotations()


