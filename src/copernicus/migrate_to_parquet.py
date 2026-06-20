###############################################################################
##  `migrate_to_parquet.py`                                                  ##
##                                                                           ##
##  One-time migration: converts monthly CSVs to Parquet files.              ##
##  Drops the `time` column (redundant — encoded in the filename).           ##
##                                                                           ##
##  Before:  public/data/chlorophyll/2000/global_2000-01_chlorophyll.csv     ##
##  After:   public/data/chlorophyll/2000/global_2000-01_chlorophyll.parquet ##
###############################################################################

import os
import glob

import pandas as pd

WEB_DATA_DIR = "website/public/data"

METRIC_CONFIGS = {
    "chlorophyll": {
        "subdir": "chlorophyll",
        "value_col": "mean_CHL",
        "keep_cols": ["latitude", "longitude", "mean_CHL"],
        "dtypes": {"latitude": "float32", "longitude": "float32", "mean_CHL": "float32"},
    },
    "temperature": {
        "subdir": "temperature",
        "value_col": "mean_analysed_sst",
        "keep_cols": ["latitude", "longitude", "mean_analysed_sst"],
        "dtypes": {"latitude": "float32", "longitude": "float32", "mean_analysed_sst": "float32"},
    },
}


def migrate_metric(metric: str) -> None:
    config = METRIC_CONFIGS[metric]
    data_dir = os.path.join(WEB_DATA_DIR, config["subdir"])

    csv_files = sorted(
        glob.glob(os.path.join(data_dir, "*/global_*_*.csv"))
    )

    if not csv_files:
        print(f"  No monthly CSV files found for {metric}")
        return

    total_csv_bytes = 0
    total_pq_bytes = 0

    for csv_path in csv_files:
        parquet_path = csv_path.replace(".csv", ".parquet")

        if os.path.exists(parquet_path):
            continue

        df = pd.read_csv(csv_path, usecols=config["keep_cols"])
        df = df.dropna(subset=[config["value_col"]])
        df = df.astype(config["dtypes"])

        df.to_parquet(parquet_path, index=False, engine="pyarrow")

        csv_size = os.path.getsize(csv_path)
        pq_size = os.path.getsize(parquet_path)
        total_csv_bytes += csv_size
        total_pq_bytes += pq_size

        print(f"  {os.path.basename(csv_path):50s} {csv_size // 1024:>6d} KB → {pq_size // 1024:>6d} KB")

    if total_csv_bytes > 0:
        ratio = total_pq_bytes / total_csv_bytes * 100
        print(f"\n  Total: {total_csv_bytes // 1024 // 1024} MB → {total_pq_bytes // 1024 // 1024} MB ({ratio:.0f}%)")


def migrate_all() -> None:
    for metric in METRIC_CONFIGS:
        print(f"\nConverting {metric} to Parquet...")
        migrate_metric(metric)
    print("\nMigration complete.")


if __name__ == "__main__":
    migrate_all()