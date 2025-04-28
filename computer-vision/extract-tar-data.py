###############################################################################
##  `extract-tar-data.py`                                                    ##
##                                                                           ##
##  Purpose: Opens .tar & extracts all files / directories                   ##
###############################################################################


import tarfile

from src.utils.data_utils import (
    folder_exists,
)


# Training datasets (+ folder path)
TRAINING_DATA_FOLDER = "computer-vision/training-data"
LILA_NINGALOO_ARZOUMANIAN_COCO_TAR = "whaleshark.coco.tar"

# Target / destination paths for extracted data
EXTRACTED_DATA_FOLDER = "computer-vision/extracted-data"
LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED = "whaleshark.coco_extracted"


def extract_from_tarfile(tar_file: str, extracted_folder_destination: str) -> None:
    # Whichever .tar file needs to be opened
    if not tar_file:
        raise ValueError("Error, must specify tar_file")

    # Whatever is compressed in .tar file, organized into new folder (target destination)
    if not extracted_folder_destination:
        raise ValueError("Error, must specify extracted_folder_destination")

    source = f"{TRAINING_DATA_FOLDER}/{tar_file}"
    destination = f"{EXTRACTED_DATA_FOLDER}/{extracted_folder_destination}"

    # Confirm folders exist (create if needed)
    _ = folder_exists(source, True)
    _ = folder_exists(destination, True)

    with tarfile.open(source, "r") as tar:
        tar.extractall(path=destination)

    print(f"Extraction complete! Files are now in: {destination}")


if __name__ == "__main__":
    extract_from_tarfile(
        tar_file=LILA_NINGALOO_ARZOUMANIAN_COCO_TAR, 
        extracted_folder_destination=LILA_NINGALOO_ARZOUMANIAN_COCO_EXTRACTED
    )

