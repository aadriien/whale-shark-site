###############################################################################
##  `data_utils.py`                                                          ##
##                                                                           ##
##  Purpose: Handles pipelines for CSV processing                            ##
###############################################################################


import os
import csv
import pandas as pd
from typing import Optional


def csv_exists(csv_file: str) -> bool:
    # Extract folder in file path
    folder = os.path.dirname(csv_file)  
    
    if not os.path.exists(folder):
        print(f"Folder '{folder}' not found. Creating it...")
        os.makedirs(folder)

    if os.path.exists(csv_file):
        return True

    return False


def read_csv(csv_file: str, columns: Optional[list[str]] = None) -> pd.DataFrame:
    if not csv_file:
        raise ValueError("Error, must specify CSV to read")

    if not csv_exists(csv_file):
        raise ValueError("Error, CSV does not exist")

    return pd.read_csv(csv_file, usecols=columns)




