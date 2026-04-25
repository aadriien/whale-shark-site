###############################################################################
##  `export_global_chlorophyll.py`                                           ##
##                                                                           ##
##  Purpose: Exports global Copernicus chlorophyll CSVs for the OceanViewer  ##
##  Output:  website/public/data/chlorophyll/global_{YYYY}_chlorophyll.csv   ##
###############################################################################

import os
import pandas as pd

from src.copernicus.fetch import get_chlorophyll_data
from src.copernicus.clean import convert_xarray_to_df
from src.utils.data_utils import export_to_csv


WEB_CHL_DIR = "website/public/data/chlorophyll"
LAT_RANGE   = (-40, 40)   # covers full whale shark habitat range
LON_RANGE   = (-180, 180) # global
STRIDE      = 25          # 25 × 0.04° ≈ 1° resolution, reduces ~40M → ~29K cells/month


def export_global_chlorophyll(start_year: int = 2015, end_year: int = 2026) -> None:
    print(f"Exporting global chlorophyll {start_year}-{end_year} to {WEB_CHL_DIR}/\n")

    for year in range(start_year, end_year + 1):
        output_path = os.path.join(WEB_CHL_DIR, f"global_{year}_chlorophyll.csv")

        if os.path.exists(output_path):
            print(f"  {year}: already exists, skipping")
            continue

        print(f"  {year}: fetching from Copernicus Marine...")
        try:
            ds = get_chlorophyll_data(
                variables=["CHL"],
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

            df = convert_xarray_to_df(ds_sub, variable_names=["CHL"])
            df = df[["time", "latitude", "longitude", "CHL"]].dropna(subset=["CHL"])
            df["time"] = pd.to_datetime(df["time"], errors="coerce").dt.strftime("%Y-%m-%d")
            df = df.rename(columns={"CHL": "mean_CHL"})

            export_to_csv(output_path, df)
            print(f"  {year}: exported {len(df):,} rows")

        except Exception as e:
            print(f"  {year}: failed — {e}")

    print("\nDone.")


if __name__ == "__main__":
    export_global_chlorophyll(start_year=2015, end_year=2026)
