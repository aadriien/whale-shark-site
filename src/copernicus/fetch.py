###############################################################################
##  `fetch.py`                                                               ##
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


def get_copernicus_data(dataset_id: str, **kwargs) -> xr.Dataset:
    # Load dataset after logged in (allow any args supported by dataset)
    dataset = copernicusmarine.open_dataset(dataset_id=dataset_id, **kwargs)
    return dataset


if __name__ == "__main__":
    pass
    
