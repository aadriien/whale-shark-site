# 🐋 🦈 Whale Shark Site x Computer Vision 

## Training Data Overview

This folder contains large datasets used for computer vision tasks.

Datasets from `training-data` and `extracted-data` are **NOT included** in the repository due to size limitations.


## Download Instructions

1. Download a [dataset](#linked-datasets) (`.tar`) 
2. Place `.tar` file in the `training-data` folder 
3. Set `tar_file` (name / path) in `extract_tar_data.py`
4. Run `.tar` extraction with:
    ```sh
    # Assuming at root of whale-shark-site
    make extract_tar
    ```
5. Navigate to the `extracted-data` folder for results


## Linked Datasets

### Dataset: Whale Shark ID 
- Ningaloo Marine Park in Western Australia (1995 - 2008)
- [Link to page](https://lila.science/datasets/whale-shark-id) for data download
- **Licensing & Citation** (according to [LILA BC](https://lila.science)): 
    - This dataset is released under the [Community Data License Agreement (permissive variant)](https://cdla.io/permissive-1-0/).
    - Holmberg J, Norman B, Arzoumanian Z. [Estimating population size, structure, and residency time for whale sharks Rhincodon typus through collaborative photo-identification](https://www.int-res.com/abstracts/esr/v7/n1/p39-53/). Endangered Species Research. 2009 Apr 8;7(1):39-53.


## Acknowledgements

### Computer Vision Models

I used Ultralytics' [YOLOv8](https://docs.ultralytics.com/models/yolov8) object detection model to home in on whale shark objects in a given image, for the purpose of generating BBOXes (bounding boxes) for MiewID-msv3 input.

I used Wildbook's [MiewID-msv3](https://huggingface.co/conservationxlabs/miewid-msv3) wildlife re-identification model to extract the image embeddings that help identify individual whale sharks.
```
@misc{WildMe2023,
  author = {Otarashvili, Lasha},
  title = {MiewID},
  year = {2023},
  url = {https://github.com/WildMeOrg/wbia-plugin-miew-id},
  doi = {10.5281/zenodo.13647526},
}
```



