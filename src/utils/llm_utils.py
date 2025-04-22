import ollama
import pandas as pd
from typing import Dict

from src.utils.data_utils import (
    read_csv, export_to_csv, move_column_after,
)

from src.analyze.gbif import (
    GBIF_INDIVIDUAL_SHARKS_STATS_FILE,
)


LLM_MODEL = "gemma:2b"

GBIF_INDIVIDUAL_SHARKS_NAMED_FILE = "outputs/gbif_individual_sharks_named.csv"

SHARK_FIELDS_TO_REVIEW = [
    "whaleSharkID",
    "Total Occurrences",
    "sex",
    "lifeStage (year)",
    "country (year)",
    "stateProvince - verbatimLocality (month year)",
    "occurrenceRemarks (eventDate)",
]


def format_prompt(shark_data: Dict[str, str]) -> str:
    prompt = "You are a creative marine biologist who loves naming whale sharks.\n"
    prompt += "Given the following whale shark traits, respond ONLY with a short, fun name.\n" 
    prompt += "No explanation. No formatting. No quotes.\n\n"

    for key, value in shark_data.items():
        prompt += f"- {key.capitalize()}: {value}\n"

    prompt += "\nName:"
    return prompt


def generate_shark_name(shark_data: Dict[str, str], model=LLM_MODEL) -> str:
    prompt = format_prompt(shark_data)

    response = ollama.chat(model=model, messages=[
        {"role": "user", "content": prompt}
    ])

    name = response["message"]["content"].strip()
    return name


def name_shark_row(row: pd.Series) -> str:
    shark_data = {metric: row.get(metric, "") for metric in SHARK_FIELDS_TO_REVIEW}

    try:
        generated_name = generate_shark_name(shark_data)
        print(f"whaleSharkID:{row.get('whaleSharkID')} has been named {generated_name}")
        return generated_name

    except Exception as e:
        print(f"Error: Failed to name row {row.name}: {e}")
        return "Unnamed"


if __name__ == "__main__":
    individual_sharks = read_csv(GBIF_INDIVIDUAL_SHARKS_STATS_FILE)

    named_sharks = individual_sharks[SHARK_FIELDS_TO_REVIEW]
    named_sharks["LLM-Generated Name"] = individual_sharks.apply(name_shark_row, axis=1)
    
    named_sharks = move_column_after(
        dataframe=named_sharks, 
        col_to_move="LLM-Generated Name", 
        after_col="whaleSharkID"
    )

    export_to_csv(GBIF_INDIVIDUAL_SHARKS_NAMED_FILE, named_sharks)



