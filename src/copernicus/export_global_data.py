###############################################################################
##  `export_global_data.py`                                                  ##
##                                                                           ##
##  Purpose: Exports global Copernicus data CSVs for the OceanViewer         ##
##  Output:  website/public/data/{metric}/global_{YYYY}_{metric}.csv         ##
###############################################################################

import os
import pandas as pd

from src.copernicus.fetch_chlorophyll import get_chlorophyll_data
from src.copernicus.fetch_temperature import get_sea_surface_temperature_data
from src.copernicus.clean import convert_xarray_to_df
from src.utils.data_utils import export_to_csv


WEB_DATA_DIR = "website/public/data"
LAT_RANGE    = (-40, 40)   # covers full whale shark habitat range
LON_RANGE    = (-180, 180) # global
STRIDE       = 25          # 25 × 0.04° ≈ 1° resolution, reduces ~40M → ~29K cells/month

METRIC_CONFIGS = {
    "chlorophyll": {
        "fetch_fn": get_chlorophyll_data,
        "variables": ["CHL"],
        "subdir":    "chlorophyll",
        "rename":    {"CHL": "mean_CHL"},
    },
    "temperature": {
        "fetch_fn": get_sea_surface_temperature_data,
        "variables": ["analysed_sst"],
        "subdir":    "temperature",
        "rename":    {"analysed_sst": "mean_analysed_sst"},
    },
}


def export_global_data(metrics: list[str] = list(METRIC_CONFIGS.keys()),
                       start_year: int = 2000,
                       end_year: int = 2025) -> None:
    for metric in metrics:
        config = METRIC_CONFIGS[metric]
        output_dir = os.path.join(WEB_DATA_DIR, config["subdir"])
        variables = config["variables"]

        print(f"Exporting global {metric} {start_year}-{end_year} to {output_dir}/\n")

        for year in range(start_year, end_year + 1):
            output_path = os.path.join(output_dir, f"global_{year}_{metric}.csv")

            if os.path.exists(output_path):
                print(f"  {year}: already exists, skipping")
                continue

            print(f"  {year}: fetching from Copernicus Marine...")
            try:
                ds = config["fetch_fn"](
                    variables=variables,
                    start_date=f"{year}-01-01",
                    end_date=f"{year}-12-31",
                    lat_range=LAT_RANGE,
                    lon_range=LON_RANGE,
                )

                # Subsample to ~1° resolution before pulling into memory.
                # isel with stride avoids downloading the full ~4km global grid.
                ds_sub = ds.isel(
                    latitude=slice(None, None, STRIDE),
                    longitude=slice(None, None, STRIDE),
                )

                df = convert_xarray_to_df(ds_sub, variable_names=variables)
                df = df[["time", "latitude", "longitude"] + variables].dropna(subset=variables)
                df["time"] = pd.to_datetime(df["time"], errors="coerce").dt.strftime("%Y-%m-%d")
                df = df.rename(columns=config["rename"])

                export_to_csv(output_path, df)
                print(f"  {year}: exported {len(df):,} rows")

            except Exception as e:
                print(f"  {year}: failed — {e}")

        print("\nDone.")


if __name__ == "__main__":
    export_global_data()
    
