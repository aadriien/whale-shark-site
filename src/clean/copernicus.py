###############################################################################
##  `copernicus.py`                                                          ##
##                                                                           ##
##  Purpose: Extracts relevant Copernicus data & exports to CSVs             ##
###############################################################################


import pandas as pd
import xarray as xr
from typing import Optional, Union 

from src.utils.data_utils import (
    export_to_csv, 
)

from src.fetch.copernicus import (
    get_chlorophyll_data,
)


COPERNICUS_CHLOROPHYLL_CSV = "data/copernicus_chlorophyll.csv"


def export_xarray_to_csv(dataset: xr.Dataset,
                         variable_names: Union[str, list[str]],
                         output_csv: str
                        ) -> pd.DataFrame:
    # Confirm dataset & CSV output path both exist 
    if not dataset or not isinstance(dataset, xr.Dataset):
        raise ValueError("Error, must specify dataset (Xarray)")
    
    if not output_csv or not isinstance(output_csv, str):
        raise ValueError("Error, must specify CSV file path (str)")
    
    # Ensure variable_names is a list, & check that all exist in dataset
    if isinstance(variable_names, str):
        variable_names = [variable_names]

    missing_vars = [var for var in variable_names if var not in dataset.data_vars]
    if missing_vars:
        raise ValueError(f"Variables not found in dataset: {missing_vars}. Available: {list(dataset.data_vars)}")

    # Select variables of interest & flatten to DataFrame
    new_df = dataset[variable_names].to_dataframe().reset_index()

    export_to_csv(output_csv, new_df)
    return new_df 


def export_copernicus_analyses() -> pd.DataFrame:
    # Chlorophyll data (monthly, 1997 - ongoing)
    chlorophyll_df = export_xarray_to_csv(
        dataset=get_chlorophyll_data(lat_range=(-10, 10),lon_range=(110, 130)),
        variable_names=["CHL"],
        output_csv=COPERNICUS_CHLOROPHYLL_CSV
    )

    return chlorophyll_df



if __name__ == "__main__":
    chlorophyll_df = export_copernicus_analyses()


