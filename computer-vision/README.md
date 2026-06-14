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


## Matches Graph

Graph representation of whale shark image match connections, built from MiewID embedding similarity. Each node is a single image; nodes cluster by individual shark identity. Edges connect each GBIF query image to its nearest-neighbor match, weighted by `miewid_distance`.

Serves as a visual reinforcer of the matching pipeline: making transitive identity chains visible (A matches B, B matches C → A and C may be the same individual), and surfacing cross-database links between GBIF observations and Ningaloo source-of-truth images.

### Graph Structure

**Nodes** — two populations, one node per image:
- **GBIF** — clustered by `whaleSharkID`
- **Ningaloo** — clustered by Wildbook UUID (`whale_shark_names`)

Node positions are 2D UMAP coordinates projected from the full MiewID embedding vectors across both populations combined. Proximity in the layout reflects actual embedding similarity.

**Edges** — directed, GBIF image → closest non-self match from the combined FAISS index:
- **GBIF → Ningaloo** — cross-database identity claim; the only link between the two datasets
- **GBIF → GBIF** — within-GBIF population match

Edge weight = `miewid_distance` (L2 on normalized vectors; lower = stronger match). Edges are flagged as **mutual** (A→B and B→A both exist) or **one-sided**.

### Clusters & Contradictions

GBIF nodes are additionally grouped into `cluster_id`s via transitive chains of `gbif_to_gbif` edges (weakly connected components, e.g. A→B→C joins A, B, and C into one cluster even with no direct A↔C edge). `gbif_to_ningaloo` edges are excluded from clustering; they're unfiltered (k=1, different ID namespace), and a handful of "least-bad" Ningaloo hub matches would otherwise collapse most of the graph into one mega-cluster. Ningaloo nodes have `cluster_id: null`.

A cluster is flagged `contradiction: true` if it contains two `whaleSharkID`s that `assess_shark_match_plausibility.py`'s exclusion map says CANNOT be the same shark (geo/temporally IMPOSSIBLE). 

Direct matches already skip excluded pairs, so a contradiction means a *chain* of individually-plausible matches (A~B, B~C) transitively implies an impossible link (A~C). The top-level `contradictions` array lists each such cluster with its conflicting `whaleSharkID` pairs.

### Running

```sh
make build_shark_graph
```

Output written to `website/src/assets/data/json/graph_data.json`.


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



