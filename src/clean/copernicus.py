###############################################################################
##  `copernicus.py`                                                          ##
##                                                                           ##
##  Purpose: Extracts relevant Copernicus data & exports to CSVs             ##
###############################################################################


import pandas as pd
import xarray as xr
from typing import Union 

from src.utils.data_utils import (
    export_to_csv, 
)

from src.fetch.copernicus import (
    get_chlorophyll_data,
)


COPERNICUS_CHLOROPHYLL_CSV = "data/copernicus_chlorophyll.csv"

# LME == Large Marine Ecosystem (total == 66 for global oceans)
# Focusing here on regional bounding boxes (BBOXes) relevant to whale sharks
# LMEs usually precise polygons, but here using BBOX rectangles to encapsulate
LME_BOUNDS = {
    "Gulf of Mexico": {
        "lat_range": (18, 30),
        "lon_range": (-98, -80),
        "notes": "Western Atlantic hotspot"
    },
    "Caribbean Sea": {
        "lat_range": (10, 20),
        "lon_range": (-90, -75),
        "notes": "Central American tropical waters"
    },
    "Canary Current": {
        "lat_range": (20, 35),
        "lon_range": (-25, -10),
        "notes": "Eastern Atlantic subtropics"
    },
    "Guinea Current": {
        "lat_range": (0, 15),
        "lon_range": (-20, 10),
        "notes": "Tropical West African coast"
    },
    "Agulhas Current": {
        "lat_range": (-40, -25),
        "lon_range": (15, 35),
        "notes": "Southwest Indian Ocean"
    },
    "Somali Coastal Current": {
        "lat_range": (-5, 15),
        "lon_range": (45, 60),
        "notes": "NW Indian Ocean"
    },
    "Red Sea": {
        "lat_range": (12, 30),
        "lon_range": (32, 45),
        "notes": "Key corridor, nursery habitat"
    },
    "Arabian Sea": {
        "lat_range": (10, 25),
        "lon_range": (50, 75),
        "notes": "Major plankton blooms"
    },
    "Bay of Bengal": {
        "lat_range": (5, 20),
        "lon_range": (80, 95),
        "notes": "NE Indian Ocean"
    },
    "South China Sea": {
        "lat_range": (5, 25),
        "lon_range": (105, 120),
        "notes": "High biodiversity hotspot"
    },
    "East China Sea": {
        "lat_range": (20, 35),
        "lon_range": (120, 130),
        "notes": "Subtropical Pacific adjacent area"
    },
    "Coral Triangle": {
        "lat_range": (-10, 10),
        "lon_range": (115, 155),
        "notes": "Indonesia, Philippines, Papua New Guinea"
    }
}


# Helper function for spatial aggregation (binning approach) to reduce 
# granularity in lat/lon coordinates for higher-level (condensed) data
# For Copernicus: going from ~4km grid resolution to ~111km (1 degree lat)..
# meaning each data entry will reflect a 1 degree latitude increment  
# (instead of decimal portions of a degree), with means for each condensed bin
# Coarser aggregate means some detail lost, but fine for whale shark use case
def aggregate_data_coords(dataframe: pd.DataFrame, variables: list[str]) -> pd.DataFrame:
    df_copy = dataframe.copy()

    # Round lat/lon to whole degrees (int)
    df_copy["latitude"] = df_copy["latitude"].round().astype(int)
    df_copy["longitude"] = df_copy["longitude"].round().astype(int)

    # Group by time & rounded lat/lon
    grouped = df_copy.groupby(["time", "latitude", "longitude"])

    # Compute mean & count of non-NaN values for each variable (how many averaged per bin)
    mean_df = grouped[variables].mean().rename(columns={var: f"mean_{var}" for var in variables})
    count_df = grouped[variables].count().rename(columns={var: f"count_entries_{var}" for var in variables})

    aggregated_df = pd.concat([mean_df, count_df], axis=1).reset_index()
    return aggregated_df


def convert_xarray_to_df(dataset: xr.Dataset,
                         variable_names: Union[str, list[str]],
                        ) -> pd.DataFrame:
    # Confirm dataset & CSV output path both exist 
    if not dataset or not isinstance(dataset, xr.Dataset):
        raise ValueError("Error, must specify dataset (Xarray)")
    
    # Ensure variable_names is a list, & check that all exist in dataset
    if isinstance(variable_names, str):
        variable_names = [variable_names]

    missing_vars = [var for var in variable_names if var not in dataset.data_vars]
    if missing_vars:
        raise ValueError(f"Variables not found in dataset: {missing_vars}. Available: {list(dataset.data_vars)}")

    # Select variables of interest & flatten to DataFrame
    new_df = dataset[variable_names].to_dataframe().reset_index()
    return new_df 


def export_copernicus_analyses() -> pd.DataFrame:
    # Chlorophyll data (monthly, 1997 - ongoing)
    # Since monthly, datetime will reflect 1st of each month
    # Unit for CLH (chlorophyll-a concentration) is mg/m^3 (milligrams per cubic meter)
    chlorophyll_xarray = get_chlorophyll_data(lat_range=(-10, 10),lon_range=(110, 130))
    chlorophyll_vars = ["CHL"]

    chlorophyll_df = convert_xarray_to_df(chlorophyll_xarray, chlorophyll_vars)
    aggregated_chlorophyll_df = aggregate_data_coords(chlorophyll_df, chlorophyll_vars)

    export_to_csv(COPERNICUS_CHLOROPHYLL_CSV, aggregated_chlorophyll_df)

    return chlorophyll_df



if __name__ == "__main__":
    chlorophyll_df = export_copernicus_analyses()


