###############################################################################
##  `data_utils.py`                                                          ##
##                                                                           ##
##  Purpose: Handles pipelines for CSV processing                            ##
###############################################################################


import os
import json
import pandas as pd
from typing import Optional, Union, Literal

from src.utils.api_utils import (
    find_field,
)

DATA_FOLDER_PY_CSV = "outputs"
DATA_FOLDER_WEB_JSON = "website/src/assets/data/json"


def get_folder_name(file_name: str) -> str:
    if not file_name:
        raise ValueError("Error, must specify file name")

    return os.path.dirname(file_name) 


# Check valid directory (with option to create if doesn't exist)
def folder_exists(file_name: str, create: bool = False) -> bool:
    # Extract folder in file path
    folder = get_folder_name(file_name)  

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


def read_csv(csv_file: str, 
            columns: Optional[list[str]] = None, 
            dtype: Optional[dict] = None) -> pd.DataFrame:
    if not csv_file:
        raise ValueError("Error, must specify CSV to read")

    if not csv_exists(csv_file):
        raise ValueError("Error, CSV does not exist")

    return pd.read_csv(csv_file, usecols=columns, dtype=dtype)


def export_to_csv(csv_file: str, dataframe: pd.DataFrame) -> None:
    if not csv_file:
        raise ValueError("Error, must specify CSV file path")

    if not isinstance(dataframe, pd.DataFrame):
        raise ValueError("Error, must specify a valid DataFrame to export")

    if dataframe.empty:
        raise ValueError("Error, must specify a non-empty DataFrame to export")

    # Proceed with creating folder if doesn't exist, then export CSV
    _ = folder_exists(csv_file, True)
    dataframe.to_csv(csv_file, index=False)

    print(f"Exported {len(dataframe)} entries to {csv_file}")


def export_to_json(json_file: str, output_list: list) -> None:
    if not json_file:
        raise ValueError("Error, must specify JSON file path")

    if not isinstance(output_list, list):
        raise ValueError("Error, must specify a valid list to export")

    if not output_list:
        raise ValueError("Error, must specify a non-empty list to export")

    # Proceed with creating folder if doesn't exist, then export JSON
    _ = folder_exists(json_file, True)
    with open(json_file, "w") as f:
        # Remove all spaces to keep JSON as condensed as possible
        json.dump(output_list, f, separators=(',', ':'))

    print(f"Exported {len(output_list)} entries to {json_file}")


def csv_to_json(input_csv_file: str, output_json_file: str, convert_types: Optional[bool] = False) -> None:
    df = pd.read_csv(input_csv_file)

    if convert_types:
        df = df.convert_dtypes()

    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(0)
        else:
            df[col] = df[col].fillna("")

    json_data = df.to_dict(orient="records")

    # Create folder to hold files if doesn't already exist
    _ = folder_exists(file_name=output_json_file, create=True)

    with open(output_json_file, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False)
    
    print(f"Saved {input_csv_file} to: {output_json_file}")


def convert_all_csvs_to_json(input_folder_path: str = DATA_FOLDER_PY_CSV, 
                            output_folder_path: str = DATA_FOLDER_WEB_JSON) -> None:
    # Get list of all CSV files in folder
    for filename in os.listdir(input_folder_path):
        if filename.endswith(".csv"):
            input_csv_file = os.path.join(input_folder_path, filename)

            # Create name for output JSON file (same as CSV), then convert
            output_json_file = os.path.join(
                output_folder_path, 
                f"{os.path.splitext(filename)[0]}.json"
            )
            csv_to_json(input_csv_file, output_json_file)


#####
## JSON parsing helpers
#####

def extract_relevant_fields(data: dict, fields: list) -> dict:
    if not data and isinstance(data, dict):
        raise ValueError("ERROR: must specify data (dict)")

    if not fields and isinstance(fields, list):
        raise ValueError("ERROR: must specify fields (list)")

    extracted_data = {field: find_field(data, field) for field in fields}
    return extracted_data


#####
## DataFrame manipulation helpers
#####

def validate_and_dropna(dataframe: pd.DataFrame, 
                        na_subset: Optional[list[str]] = None,
                        how: Optional[str] = "any") -> pd.DataFrame:
    if not isinstance(dataframe, pd.DataFrame):
        raise ValueError("Error, must specify a valid DataFrame")

    return dataframe.dropna(subset=na_subset, how=how)


def move_columns(dataframe: pd.DataFrame, 
                cols_to_move: list[str], 
                position: Union[Literal["front", "end"], int]) -> pd.DataFrame:
    # Allow reordering of multiple columns (grouped together)
    if not isinstance(cols_to_move, list):
        raise ValueError("Error, must specify valid cols_to_move")

    # Allow position to be either a number or a str (front/end)
    if not isinstance(position, int) and not isinstance(position, str):
        raise ValueError("Error, must specify valid position")
    if isinstance(position, str) and position not in ["front", "end"]:
        raise ValueError("Error, str position must be 'front' or 'end'")
   
    cols_to_move = [col for col in cols_to_move if col in dataframe.columns]
    remaining_cols = [col for col in dataframe.columns if col not in cols_to_move]

    if position == "front":
        new_order = cols_to_move + remaining_cols
    elif position == "end":
        new_order = remaining_cols + cols_to_move
    
    # Constrain to valid range if int provided
    elif isinstance(position, int):
        position = max(0, min(position, len(remaining_cols)))
        new_order = (
            remaining_cols[:position] + 
            cols_to_move + 
            remaining_cols[position:]
        )

    return dataframe[new_order]


def move_column_after(dataframe: pd.DataFrame, col_to_move: str, after_col: str) -> pd.DataFrame:
    if not isinstance(col_to_move, str):
        raise ValueError("Error, must specify valid col_to_move")
    if not isinstance(after_col, str):
        raise ValueError("Error, must specify valid after_col")

    cols = dataframe.columns.tolist()

    if col_to_move not in cols or after_col not in cols:
        raise ValueError(f"Columns must exist in DataFrame: {col_to_move}, {after_col}")

    cols.remove(col_to_move)
    insert_at = cols.index(after_col) + 1
    cols.insert(insert_at, col_to_move)

    return dataframe[cols]


def standardize_column_vals(dataframe: pd.DataFrame, 
                            col_name: str, 
                            valid_vals: list, 
                            fill_val) -> pd.DataFrame:
    if not isinstance(col_name, str):
        raise ValueError("Error, must specify valid col_name")
    if not isinstance(valid_vals, list):
        raise ValueError("Error, must specify valid_vals list")
    if not all(isinstance(val, type(valid_vals[0])) for val in valid_vals):
        raise ValueError(f"Error, fill_val type must match valid_vals type")

    # Standardize values for column (fill with default if not in list)
    dataframe.loc[:, col_name] = dataframe[col_name].apply(
        lambda x: x if x in valid_vals else fill_val
    )
    return dataframe


#####
## Specific DataFrame metrics to arrange / introduce
#####

def add_totals_column(source_df: pd.DataFrame, target_df: pd.DataFrame, groupby: list[str]) -> pd.DataFrame:
    if not isinstance(groupby, list):
        raise ValueError("Error, must specify groupby")

    target_df["Total Occurrences"] = target_df.index.map(source_df.groupby(groupby).size())
    target_df = move_columns(target_df, cols_to_move=["Total Occurrences"], position="front")
    
    return target_df


def get_str_with_year_range(full_str: str,
                            after_year: Optional[int] = None, 
                            before_year: Optional[int] = None) -> str:
    if not isinstance(full_str, str):
        raise ValueError("Error, must specify full_str")

    if after_year and before_year:
        full_str += f" ({after_year} - {before_year})"

    elif after_year:
        full_str += f" (after {after_year})"

    elif before_year:
        full_str += f" (before {before_year})"

    else: full_str += " (all)"                        
    
    return full_str


def add_avg_per_year(source_df: pd.DataFrame, 
                    target_df: pd.DataFrame, 
                    groupby: list[str],
                    after_year: Optional[int] = None,
                    before_year: Optional[int] = None) -> pd.DataFrame:
    if not isinstance(groupby, list):
        raise ValueError("Error, must specify groupby")

    source_df = validate_and_dropna(source_df, na_subset=["year"])

    column_name_base = "Avg Per Year"
    column_name = get_str_with_year_range(
        column_name_base, 
        after_year=after_year, 
        before_year=before_year
    )

    if after_year and before_year:
        source_df = source_df[source_df["year"].between(after_year, before_year)]
    elif after_year:
        source_df = source_df[source_df["year"] > after_year]
    elif before_year:
        source_df = source_df[source_df["year"] < before_year]

    # Get total occurrences per [{metric}, year] grouping, then average
    yearly_counts = source_df.groupby(groupby + ["year"]).size()
    avg_per_year = yearly_counts.groupby(groupby).mean().round(2)

    target_df[column_name] = target_df.index.map(avg_per_year)
    target_df = move_columns(target_df, cols_to_move=[column_name], position="front")
    
    return target_df


def add_top_x_metric(occurrences_df: pd.DataFrame, 
                    target_df: pd.DataFrame,
                    groupby: list[str],
                    top_x: int,
                    metric: str,
                    column_name: str) -> pd.DataFrame:
    if not isinstance(groupby, list):
        raise ValueError("Error, must specify groupby")
    if not isinstance(top_x, int):
        raise ValueError("Error, must specify top_x")
    if not isinstance(metric, str):
        raise ValueError("Error, must specify metric")
    if not isinstance(column_name, str):
        raise ValueError("Error, must specify column_name")

    top_metric = (
        occurrences_df.groupby(groupby + [metric])
        .size()
        .reset_index(name="count")
        .sort_values(groupby + ["count"], ascending=[True] * len(groupby) + [False])
    )

    # Keep only top {x} {metric} per {category}
    # e.g. top 3 countries / regions visited by publishingCountry
    top_metric["rank"] = (
        top_metric.groupby(groupby)["count"]
        .rank(method="first", ascending=False)
    )
    top_metric = top_metric[top_metric["rank"] <= top_x].drop(columns=["rank", "count"])

    # Convert to single column format (countries separated by commas)
    top_metric = (
        top_metric.groupby(groupby)[metric]
        .apply(lambda x: " > ".join(x.tolist()))
    )
    target_df[column_name] = target_df.index.get_level_values(groupby[0]).map(top_metric)

    target_df = move_column_after(
        target_df, 
        col_to_move=column_name, 
        after_col="Total Occurrences"
    )

    return target_df





