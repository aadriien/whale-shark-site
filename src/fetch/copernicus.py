###############################################################################
##  `copernicus.py`                                                          ##
##                                                                           ##
##  Purpose: Accesses Copernicus Marine's API endpoint to query data         ##
###############################################################################


import os
from dotenv import load_dotenv

import copernicusmarine
import xarray as xr
from typing import Optional


load_dotenv()

COPERNICUS_USER = os.getenv("COPERNICUS_USER")
COPERNICUS_PASS = os.getenv("COPERNICUS_PASS")

# Log in just ONCE (stores credentials locally)
# copernicusmarine.login(username=COPERNICUS_USER, password=COPERNICUS_PASS)


def get_copernicus_data(dataset_id: str, **kwargs) -> xr.Dataset:
    # Load dataset after logged in (allow any args supported by dataset)
    dataset = copernicusmarine.open_dataset(dataset_id=dataset_id, **kwargs)
    return dataset


def get_chlorophyll_data(variables: list[str] = ["CHL"],
                         start_date: str = "2024-01-01",
                         end_date: str = "2024-12-31",
                         lat_range: Optional[tuple[float, float]] = None,
                         lon_range: Optional[tuple[float, float]] = None,
                        ) -> xr.Dataset:
    # Global chlorophyll indicator (OCEANCOLOUR_GLO_BGC_L4_MY_009_104)
    # Full name: 
    #   Global Ocean Colour (Copernicus-GlobColour), Bio-Geo-Chemical, 
    #   L4 (monthly and interpolated) from Satellite Observations (1997-ongoing)
    # Variables of interest:
    #   - Chlorophyll-a (CHL)
    #   - Phytoplankton Functional types and sizes (PFT)
    # Documentation: https://documentation.marine.copernicus.eu/PUM/CMEMS-OC-PUM.pdf
    dataset_id = "cmems_obs-oc_glo_bgc-plankton_my_l4-multi-4km_P1M"  

    # Build dynamic params for data fetch
    fetch_params = {
        "variables": variables,
        "start_datetime": start_date,
        "end_datetime": end_date,
    }

    if lat_range:
        fetch_params.update({
            "minimum_latitude": lat_range[0],
            "maximum_latitude": lat_range[1],
        })
    if lon_range:
        fetch_params.update({
            "minimum_longitude": lon_range[0],
            "maximum_longitude": lon_range[1],
        })

    # Load full Xarray dataset & return
    chlorophyll_ds = get_copernicus_data(dataset_id, **fetch_params)
    return chlorophyll_ds



if __name__ == "__main__":
    chlorophyll_ds = get_chlorophyll_data() 



