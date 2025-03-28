###############################################################################
##  `data_utils.py`                                                          ##
##                                                                           ##
##  Purpose: Handles pipelines for CSV processing                            ##
###############################################################################


import os
import csv
import pandas as pd
from typing import Optional


def get_folder_name(csv_file: str) -> str:
    if not csv_file:
        raise ValueError("Error, must specify CSV")

    return os.path.dirname(csv_file) 


# Check valid directory (with option to create if doesn't exist)
def folder_exists(csv_file: str, create: bool = False) -> bool:
    # Extract folder in file path
    folder = get_folder_name(csv_file)  

    if create and not os.path.exists(folder):
        print(f"Folder '{folder}' not found. Creating it...")
        os.makedirs(folder)

    return os.path.exists(folder)


def csv_exists(csv_file: str) -> bool:
    if not csv_file:
        raise ValueError("Error, must specify CSV")

    if folder_exists(csv_file):
        return os.path.exists(csv_file)

    return False


def read_csv(csv_file: str, columns: Optional[list[str]] = None) -> pd.DataFrame:
    if not csv_file:
        raise ValueError("Error, must specify CSV to read")

    if not csv_exists(csv_file):
        raise ValueError("Error, CSV does not exist")

    return pd.read_csv(csv_file, usecols=columns)


def export_to_csv(csv_file: str, dataframe: pd.DataFrame) -> None:
    if not csv_file:
        raise ValueError("Error, must specify CSV file path")

    if dataframe is None or not isinstance(dataframe, pd.DataFrame):
        raise ValueError("Error, must specify a valid DataFrame to export")

    if dataframe.empty:
        raise ValueError("Error, must specify a non-empty DataFrame to export")

    # Proceed with creating folder if doesn't exist, then export CSV
    _ = folder_exists(csv_file, True)
    dataframe.to_csv(csv_file, index=False)

    print(f"Exported {len(dataframe)} entries to {csv_file}")



