###############################################################################
##  `embedding_utils.py`                                                     ##
##                                                                           ##
##  Purpose: Shared utilities for embedding normalization, preprocessing,    ##
##           extraction (MiewID / DINOv2), FAISS search, pairwise distance  ##
##           computation, and image loading from URL.                        ##
###############################################################################


from io import BytesIO
from typing import Optional, Tuple

import faiss
import numpy as np
import requests
import torch
import torchvision.transforms as transforms
from PIL import Image

PREPROCESSING_MEAN = [0.485, 0.456, 0.406]
PREPROCESSING_STD = [0.229, 0.224, 0.225]
PREPROCESSING_SIZE = (440, 440)

# L2 DISTANCE SCALE (for normalized values, to judge match likelihood):
#   0.0: Perfect match (identical vectors)
#   0.5 - 1.0: Very similar (vectors close together)
#   2.0: Moderate similarity (vectors somewhat different)
#   4.0: Completely different (vectors far apart)


def normalize_l2(embeddings: np.ndarray) -> np.ndarray:
    """L2-normalize embedding vectors (row-wise)."""
    return embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)


def build_miewid_preprocess() -> transforms.Compose:
    """
    Build the MiewID preprocessing pipeline.
    Prep for resizing of image to work with model (requires 440 x 440 pixels).
    """
    return transforms.Compose(
        [
            transforms.Resize(PREPROCESSING_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(mean=PREPROCESSING_MEAN, std=PREPROCESSING_STD),
        ]
    )


def compute_miewid_embedding(
    cropped_img: Image.Image,
    model: torch.nn.Module,
    preprocess: transforms.Compose,
) -> np.ndarray:
    """Extract a MiewID embedding from a cropped image."""
    # Prepare MIEWID input
    input_tensor = preprocess(cropped_img).unsqueeze(0)

    # Extract embedding via model
    # `output.shape` == `torch.Size([1, 2152])`, so just use output as embedding
    with torch.no_grad():
        output = model(input_tensor)

    return output.squeeze().cpu().numpy()


def compute_dinov2_embedding(
    cropped_img: Image.Image,
    processor,
    model: torch.nn.Module,
) -> np.ndarray:
    """Extract a DINOv2 embedding from a cropped image (mean-pooled)."""
    inputs = processor(images=cropped_img, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        # Use mean pooling on last hidden states to get embedding vector
        # (mean over sequence length dimension)
        embedding = outputs.last_hidden_state.mean(dim=1)

    return embedding.squeeze().cpu().numpy()


def perform_search(
    known_embeddings: np.ndarray, query_embeddings: np.ndarray, k: int = 1
) -> Tuple[np.ndarray, np.ndarray]:
    # Normalize embeddings to make comparison more meaningful
    known_embeddings = normalize_l2(known_embeddings)
    query_embeddings = normalize_l2(query_embeddings)

    # Add all known embeddings to index
    index = faiss.IndexFlatL2(known_embeddings.shape[1])
    index.add(known_embeddings)

    # Search for top {k} matches
    distances, indices = index.search(query_embeddings, k)
    return distances, indices


def compute_pairwise_distances(
    embeddings_a: np.ndarray,
    embeddings_b: np.ndarray,
) -> np.ndarray:
    """
    Compute full NxM squared L2 distance matrix between two sets of
    embeddings. Uses squared L2 to match FAISS IndexFlatL2, which returns
    squared distances. Expects L2-normalized vectors.
    """
    # diff[i, j] = embeddings_a[i] - embeddings_b[j]
    diff = embeddings_a[:, None, :] - embeddings_b[None, :, :]
    return np.sum(diff**2, axis=2)


def load_image_from_url(url: str) -> Optional[Image.Image]:
    """Download an image from a URL and return as PIL RGB Image."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        return Image.open(BytesIO(response.content)).convert("RGB")

    except Exception as e:
        print(f"Failed to load image from {url}: {e}")
        return None
