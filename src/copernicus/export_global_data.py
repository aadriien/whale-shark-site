###############################################################################
##  `export_global_data.py`                                                  ##
##                                                                           ##
##  Purpose: Exports global Copernicus data as Parquet for the OceanViewer   ##
##  —> website/public/data/{metric}/{YYYY}/global_{YYYY-MM}_{metric}.parquet ##
###############################################################################

import os

import pandas as pd

from src.copernicus.clean import convert_xarray_to_df
from src.copernicus.fetch_chlorophyll import get_chlorophyll_data
from src.copernicus.fetch_temperature import get_sea_surface_temperature_data

WEB_DATA_DIR = "website/public/data"

LAT_RANGE = (-60, 60)  # covers full whale shark habitat range
LON_RANGE = (-180, 180)  # global

TARGET_RESOLUTION_DEG = 1.0  # target output resolution for all metrics

METRIC_CONFIGS = {
    "chlorophyll": {
        "fetch_fn": get_chlorophyll_data,
        "variables": ["CHL"],
        "subdir": "chlorophyll",
        "rename": {"CHL": "mean_CHL"},
        "value_col": "mean_CHL",
        "value_precision": 3,
    },
    "temperature": {
        "fetch_fn": get_sea_surface_temperature_data,
        "variables": ["analysed_sst"],
        "subdir": "temperature",
        "rename": {"analysed_sst": "mean_analysed_sst"},
        "value_col": "mean_analysed_sst",
        "value_precision": 2,
    },
}

COORD_PRECISION = 2


def export_global_data(
    metrics: list[str] = list(METRIC_CONFIGS.keys()),
    start_year: int = 2000,
    end_year: int = 2025,
) -> None:
    for metric in metrics:
        config = METRIC_CONFIGS[metric]
        output_dir = os.path.join(WEB_DATA_DIR, config["subdir"])
        variables = config["variables"]
        value_col = config["value_col"]
        value_precision = config["value_precision"]

        print(f"Exporting global {metric} {start_year}-{end_year} to {output_dir}/\n")

        for year in range(start_year, end_year + 1):
            year_dir = os.path.join(output_dir, str(year))

            # Check if this year is already fully exported (12 monthly files)
            if os.path.isdir(year_dir) and len(os.listdir(year_dir)) == 12:
                print(f"  {year}: already exists (12 months), skipping")
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

                # Compute stride from native grid spacing so it adapts automatically
                # if dataset resolution ever changes (avoids hardcoding per metric)

                # This ensures 2D map renders as expected without weird cell gaps,
                # since we're getting the float difference between 2 coordinates
                lat_stride = max(
                    1,
                    round(
                        TARGET_RESOLUTION_DEG
                        / abs(
                            float(
                                ds.coords["latitude"].values[1]
                                - ds.coords["latitude"].values[0]
                            )
                        )
                    ),
                )
                lon_stride = max(
                    1,
                    round(
                        TARGET_RESOLUTION_DEG
                        / abs(
                            float(
                                ds.coords["longitude"].values[1]
                                - ds.coords["longitude"].values[0]
                            )
                        )
                    ),
                )

                ds_sub = ds.isel(
                    latitude=slice(None, None, lat_stride),
                    longitude=slice(None, None, lon_stride),
                )

                df = convert_xarray_to_df(ds_sub, variable_names=variables)
                df = df[["time", "latitude", "longitude"] + variables].dropna(
                    subset=variables
                )
                df["time"] = pd.to_datetime(df["time"], errors="coerce")
                df = df.rename(columns=config["rename"])

                # Truncate float precision
                df["latitude"] = df["latitude"].round(COORD_PRECISION)
                df["longitude"] = df["longitude"].round(COORD_PRECISION)
                df[value_col] = df[value_col].round(value_precision)
                df = df.dropna(subset=[value_col])

                os.makedirs(year_dir, exist_ok=True)
                total_rows = 0

                for month_num in range(1, 13):
                    month_df = df[df["time"].dt.month == month_num]
                    if month_df.empty:
                        continue

                    month_df = month_df[["latitude", "longitude", value_col]].copy()
                    month_df = month_df.astype("float32")

                    month_str = f"{month_num:02d}"
                    out_path = os.path.join(
                        year_dir, f"global_{year}-{month_str}_{metric}.parquet"
                    )
                    month_df.to_parquet(out_path, index=False, engine="pyarrow")
                    total_rows += len(month_df)
                    print(f"    {year}-{month_str}: {len(month_df):,} rows → {os.path.getsize(out_path) // 1024} KB")

                print(f"  {year}: exported {total_rows:,} rows across 12 months")

            except Exception as e:
                print(f"  {year}: failed — {e}")

        print("\nDone.")


if __name__ == "__main__":
    export_global_data()
