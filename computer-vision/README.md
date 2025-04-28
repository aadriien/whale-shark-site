# Whale Shark Site x Computer Vision Integration

## Training Data Overview

This folder contains large datasets used for computer vision tasks.

Datasets from `training-data` and `extracted-data` are **NOT included** in the repository due to size limitations.


## Download Instructions

1. Download a [dataset](#linked-datasets) (`.tar`) 
2. Place `.tar` file in the `training-data` folder 
3. Set `tar_file` (name / path) in `extract-tar-data.py`
4. Run `.tar` extraction with:
    ```sh
    # Assuming at repo root (whale-shark-site)
    make extract_tar
    ```
5. Navigate to the `extracted-data` folder for results


## Linked Datasets

### Dataset: Whale Shark ID 
- Ningaloo Marine Park in Western Australia (1995 - 2008)
- [Link to page](https://lila.science/datasets/whale-shark-id)
- **Licensing & Citation** (according to [LILA BC](https://lila.science)): 
    - This dataset is released under the [Community Data License Agreement (permissive variant)](https://cdla.io/permissive-1-0/).
    - Holmberg J, Norman B, Arzoumanian Z. [Estimating population size, structure, and residency time for whale sharks Rhincodon typus through collaborative photo-identification](https://www.int-res.com/abstracts/esr/v7/n1/p39-53/). Endangered Species Research. 2009 Apr 8;7(1):39-53.



