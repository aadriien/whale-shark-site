###############################################################################
##  `fetch_temperature.py`                                                   ##
##                                                                           ##
##  Purpose: Fetches Copernicus Marine sea surface temperature data          ##
###############################################################################


import xarray as xr
from typing import Optional

from src.copernicus.fetch import get_copernicus_data


def convert_kelvin_to_celsius(dataset: xr.Dataset, variables: list[str]) -> xr.Dataset:
    # Subtract 273.15 from Kelvin to derive temperature in Celsius
    KELVIN_CELSIUS_OFFSET = 273.15

    for var in variables:
        dataset[var] = dataset[var] - KELVIN_CELSIUS_OFFSET
    return dataset


def aggregate_daily_to_monthly(dataset: xr.Dataset) -> xr.Dataset:
    # Resample daily data to monthly means, labeling each bin at month start
    # (consistent with chlorophyll datetime convention: 1st of each month)
    return dataset.resample(time="MS").mean()


def get_sea_surface_temperature_data(variables: list[str] = ["analysed_sst"],
                                     start_date: str = "2024-01-01",
                                     end_date: str = "2024-12-31",
                                     lat_range: Optional[tuple[float, float]] = None,
                                     lon_range: Optional[tuple[float, float]] = None,
                                    ) -> xr.Dataset:
    # Global sea surface temperature reprocessed (SST_GLO_SST_L4_REP_OBSERVATIONS_010_011)
    # Full name:
    #   Global Ocean OSTIA Sea Surface Temperature and Sea Ice Reprocessed
    #   L4 (daily, satellite-derived observations) (1981-ongoing)
    # Variables of interest:
    #   - Sea surface temperature (analysed_sst)  [Kelvin]
    # Documentation: https://data.marine.copernicus.eu/product/SST_GLO_SST_L4_REP_OBSERVATIONS_010_011/description
    dataset_id = "METOFFICE-GLO-SST-L4-REP-OBS-SST"

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

    daily_ds = get_copernicus_data(dataset_id, **fetch_params)
    return aggregate_daily_to_monthly(daily_ds)


if __name__ == "__main__":
    temperature_ds = get_sea_surface_temperature_data()

    