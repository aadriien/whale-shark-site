###############################################################################
##  `migrate_to_monthly.py`                                                  ##
##                                                                           ##
##  One-time migration: splits per-year Copernicus CSVs into per-month       ##
##  files with truncated float precision.                                    ##
##                                                                           ##
##  Before:  public/data/chlorophyll/global_2000_chlorophyll.csv             ##
##  After:   public/data/chlorophyll/2000/global_2000-01_chlorophyll.csv     ##
###############################################################################

import os
import glob

import pandas as pd

WEB_DATA_DIR = "website/public/data"

METRIC_CONFIGS = {
    "chlorophyll": {
        "subdir": "chlorophyll",
        "value_col": "mean_CHL",
        "value_precision": 3,
    },
    "temperature": {
        "subdir": "temperature",
        "value_col": "mean_analysed_sst",
        "value_precision": 2,
    },
}

COORD_PRECISION = 2


def migrate_metric(metric: str) -> None:
    config = METRIC_CONFIGS[metric]
    data_dir = os.path.join(WEB_DATA_DIR, config["subdir"])
    value_col = config["value_col"]
    value_precision = config["value_precision"]

    year_files = sorted(glob.glob(os.path.join(data_dir, f"global_*_{metric}.csv")))

    if not year_files:
        print(f"  No per-year files found for {metric} in {data_dir}")
        return

    for year_file in year_files:
        basename = os.path.basename(year_file)
        # Extract year from "global_2000_chlorophyll.csv"
        year = basename.split("_")[1]

        # Skip files that are already monthly (e.g. global_2000-01_chlorophyll.csv)
        if "-" in year:
            continue

        print(f"  Splitting {basename}...")

        df = pd.read_csv(year_file)
        df["time"] = pd.to_datetime(df["time"])

        # Truncate precision
        df["latitude"] = df["latitude"].round(COORD_PRECISION)
        df["longitude"] = df["longitude"].round(COORD_PRECISION)
        df[value_col] = df[value_col].round(value_precision)

        # Drop rows where the value is NaN (they contribute nothing to the viz)
        df = df.dropna(subset=[value_col])

        year_dir = os.path.join(data_dir, year)
        os.makedirs(year_dir, exist_ok=True)

        for month_num in range(1, 13):
            month_df = df[df["time"].dt.month == month_num]
            if month_df.empty:
                continue

            month_str = f"{month_num:02d}"
            # Reformat time back to date string for the CSV
            month_df = month_df.copy()
            month_df["time"] = month_df["time"].dt.strftime("%Y-%m-%d")

            out_path = os.path.join(
                year_dir, f"global_{year}-{month_str}_{metric}.csv"
            )
            month_df.to_csv(out_path, index=False)

        row_count = len(df)
        month_count = len(os.listdir(year_dir))
        print(f"    → {month_count} monthly files ({row_count:,} rows total)")


def migrate_all() -> None:
    for metric in METRIC_CONFIGS:
        print(f"\nMigrating {metric}...")
        migrate_metric(metric)
    print("\nMigration complete.")


if __name__ == "__main__":
    migrate_all()