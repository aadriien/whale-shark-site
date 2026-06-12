###############################################################################
##  `calculate_coordinate_distance.py`                                       ##
##                                                                           ##
##  Purpose: Distance calculations between geographic coordinates:           ##
##           a great-circle (haversine) baseline, plus an ocean-routed       ##
##           alternative via searoute's marine network graph                 ##
###############################################################################


from functools import lru_cache
from math import asin, cos, radians, sin, sqrt

import networkx as nx
import numpy as np
import searoute as sr


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance (in km) between two points on Earth.
    """
    R = 6371.0  # Earth's radius in kilometers

    # Convert degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Differences
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    # Haversine formula
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    distance = R * c
    return distance


def haversine_distance_matrix(lat: np.ndarray, lon: np.ndarray) -> np.ndarray:
    """
    Vectorized haversine distance (km) between every pair of points.
    lat/lon are in degrees.
    """
    lat = np.radians(lat)
    lon = np.radians(lon)

    # Vectorized haversine distance (km) between every pair of sharks
    dlat = lat[:, None] - lat[None, :]
    dlon = lon[:, None] - lon[None, :]
    a = (
        np.sin(dlat / 2) ** 2
        + np.cos(lat[:, None]) * np.cos(lat[None, :]) * np.sin(dlon / 2) ** 2
    )
    return 6371.0 * 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1)))


@lru_cache(maxsize=None)
def _distances_from_node(node: tuple) -> dict:
    # Single-source Dijkstra over searoute's marine network graph, cached per
    # origin node so repeated lookups from the same node are O(1)
    return nx.single_source_dijkstra_path_length(sr.setup_M(), node, weight="weight")


def searoute_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Shortest water-only route distance (km) between two points, via
    searoute's marine network graph. Falls back to haversine if no route
    exists between the snapped points.
    """
    M = sr.setup_M()
    node1 = M.kdtree.query((lon1, lat1))
    node2 = M.kdtree.query((lon2, lat2))

    distance = _distances_from_node(node1).get(node2)
    if distance is None:
        return haversine_distance(lat1, lon1, lat2, lon2)
    return distance


def searoute_distance_matrix(lat: np.ndarray, lon: np.ndarray) -> np.ndarray:
    """
    Ocean-routed distance (km) between every pair of points. Each point is
    snapped to its nearest marine-network node, and pairwise distances
    between the (far fewer) unique nodes are computed via Dijkstra and
    broadcast back out to the full NxN matrix. lat/lon are in degrees.
    """
    M = sr.setup_M()
    nodes = [M.kdtree.query((lon_i, lat_i)) for lat_i, lon_i in zip(lat, lon)]

    distance = np.full((len(nodes), len(nodes)), np.nan)
    for i, node1 in enumerate(nodes):
        lengths = _distances_from_node(node1)
        for j, node2 in enumerate(nodes):
            distance[i, j] = lengths.get(node2, np.nan)

    # Fall back to haversine for any unreachable pairs (shouldn't occur
    # in practice, since the marine network graph is fully connected)
    if np.isnan(distance).any():
        haversine = haversine_distance_matrix(lat, lon)
        distance = np.where(np.isnan(distance), haversine, distance)

    return distance


def calculate_distance(
    lat1: float, lon1: float, lat2: float, lon2: float, use_searoute: bool = False
) -> float:
    """
    Distance (km) between two points: ocean-routed via searoute if
    use_searoute is True, otherwise great-circle (haversine).
    """
    if use_searoute:
        return searoute_distance(lat1, lon1, lat2, lon2)
    return haversine_distance(lat1, lon1, lat2, lon2)


def calculate_distance_matrix(
    lat: np.ndarray, lon: np.ndarray, use_searoute: bool = False
) -> np.ndarray:
    """
    Pairwise distance matrix (km) between every point: ocean-routed via
    searoute if use_searoute is True, otherwise great-circle (haversine).
    lat/lon are in degrees.
    """
    if use_searoute:
        return searoute_distance_matrix(lat, lon)
    return haversine_distance_matrix(lat, lon)