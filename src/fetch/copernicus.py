###############################################################################
##  `copernicus.py`                                                          ##
##                                                                           ##
##  Purpose: Accesses Copernicus Marine's API endpoint to query data         ##
###############################################################################


import os
from dotenv import load_dotenv

import copernicusmarine
import xarray as xr


load_dotenv()

COPERNICUS_USER = os.getenv("COPERNICUS_USER")
COPERNICUS_PASS = os.getenv("COPERNICUS_PASS")

# Log in just ONCE (stores credentials locally)
# copernicusmarine.login(username=COPERNICUS_USER, password=COPERNICUS_PASS)


def get_copernicus_data(dataset_id: str, 
                        variables: list[str], 
                        start_date: str, 
                        end_date: str
                        ) -> xr.Dataset:
    # Load dataset after logged in
    dataset = copernicusmarine.open_dataset(
        dataset_id=dataset_id,
        variables=variables,
        start_datetime=start_date,
        end_datetime=end_date
    )
    return dataset


def get_chlorophyll_data() -> xr.Dataset:
    # Global chlorophyll indicator (GLOBAL_ANALYSISFORECAST_BGC_001_028)
    dataset_id = "cmems_mod_glo_bgc-pft_anfc_0.25deg_P1M-m"  

    variables = []
    start_date = "2023-01-01"
    end_date = "2023-12-31"

    # Load North Atlantic chlorophyll time series
    chlorophyll_ds = get_copernicus_data(dataset_id, variables, start_date, end_date)
    return chlorophyll_ds



if __name__ == "__main__":
    chlorophyll_ds = get_chlorophyll_data()
    print(chlorophyll_ds)
    





