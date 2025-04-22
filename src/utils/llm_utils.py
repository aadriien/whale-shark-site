import re
import ollama
import requests
import pandas as pd
from typing import Dict, Literal

from src.utils.data_utils import (
    read_csv, export_to_csv, export_to_json, move_column_after,
)

from src.analyze.gbif import (
    GBIF_STORY_SHARKS_CSV,
)


GBIF_STORY_SHARKS_NAMED_CSV = "outputs/gbif_story_sharks_named.csv"
GBIF_STORY_SHARKS_NAMED_JSON = "website/src/assets/data/gbif_story_sharks_named.json"


SHARK_FIELDS_TO_REVIEW = [
    "whaleSharkID",
    "Total Occurrences",
    "sex",
    "lifeStage (year)",
    "country (year)",
    "stateProvince - verbatimLocality (month year)",
    "occurrenceRemarks (eventDate)",
]

# Compare local Ollama instance with result from API endpoint (uses openai)
LOCAL_LLM_MODEL = "gemma:2b"
API_LLM_MODEL = "openai"

TEXT_GEN_URL_BASE = "https://text.pollinations.ai/"

PROMPT = (
    # "Given the following whale shark traits, respond with a short, fun name.\n"
    # "No explanation or formatting. ONLY the name, wrapped in **.\n\n"
    # "Suggested name: "
    "Come up with a fun, original name for this whale shark, given its traits. "
    "Wrap it in **:\n"
)

SYSTEM_PROMPT = (
    # "You are a creative marine biologist who loves naming whale sharks.\n\n"
    # "You are a creative marine biologist with a quirky sense of humor.\n"
    "You are a creative and quirky marine biologist who loves naming whale sharks.\n"
)

API_PARAMS = {
    "model": API_LLM_MODEL,
    "seed": 1,
    "private": "true",
    # "system": SYSTEM_PROMPT, # can only use system prompt in GET request
}


# Generate nickname using Pollinations.AI via API query
def prompt_API_LLM(prompt: str) -> str:
    try:
        # GET request faster, but more likely to fail
        # response = requests.get(f"{TEXT_GEN_URL_BASE}/{prompt}", params=API_PARAMS)

        # Use POST instead of GET for more reliability & security
        response = requests.post(
            TEXT_GEN_URL_BASE, 
            json={
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ], 
                **API_PARAMS
            }, 
            timeout=10
        )
        response.raise_for_status()
        return response.text.strip()

    except requests.RequestException as e:
        raise RuntimeError(f"Error, failed to reach URL: {e}")


# Generate nickname using small local Ollama model 
def prompt_local_LLM(prompt: str, method: Literal["chat", "generate"]) -> str:
    if method not in {"chat", "generate"}:
        raise ValueError(f"Error, must specify either 'chat' or 'generate' method")

    # Chat mode with user roles
    if method == "chat":
        response = ollama.chat(
            model=LOCAL_LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=False
        )
        name = response["message"]["content"].strip()

    # Generate mode for simple output (method == "generate")
    else: 
        response = ollama.generate(
            model=LOCAL_LLM_MODEL,
            prompt=prompt,
            stream=False
        )
        name = response["response"].strip()

    return name


def format_prompt(prompt: str, shark_data: Dict[str, str]) -> str:
    prompt = PROMPT

    for key, value in shark_data.items():
        prompt += f"- {key.capitalize()}: {value}\n"

    prompt += "\nName:"
    return prompt


def extract_bold_name(text: str) -> str:
    # We only want "**name**" from LLM text response
    match = re.search(r"\*\*(.+?)\*\*", text)

    if match:
        return match.group(1).strip()

    # If ** bold not found, default to full text
    return text.strip() 


def generate_shark_names(shark_data: Dict[str, str]) -> dict:
    local_prompt = format_prompt(SYSTEM_PROMPT + PROMPT, shark_data)
    API_prompt = format_prompt(SYSTEM_PROMPT + PROMPT, shark_data)

    local_LLM_raw = prompt_local_LLM(prompt=local_prompt, method="generate")
    API_LLM_raw = prompt_API_LLM(prompt=API_prompt)

    # Get just the name from within "**name**"
    local_LLM_name = extract_bold_name(local_LLM_raw)
    API_LLM_name = extract_bold_name(API_LLM_raw)

    return {"local_name": local_LLM_name, "API_name": API_LLM_name}


def name_shark_row(row: pd.Series) -> dict:
    shark_data = {metric: row.get(metric, "") for metric in SHARK_FIELDS_TO_REVIEW}

    try:
        generated_names = generate_shark_names(shark_data)
        return generated_names

    except Exception as e:
        print(f"Error, failed to name row {row.name}: {e}")
        return {"local_name": "Unnamed", "API_name": "Unnamed"}


def name_all_sharks(named_sharks: pd.DataFrame, generated_names: dict) -> pd.DataFrame:
    local_col_str = f"LLM-Gen Name ({LOCAL_LLM_MODEL} local)"
    api_col_str = f"LLM-Gen Name ({API_LLM_MODEL} API)"

    named_sharks[local_col_str] = generated_names.apply(lambda x: x["local_name"])
    named_sharks[api_col_str] = generated_names.apply(lambda x: x["API_name"])
    
    named_sharks = move_column_after(
        dataframe=named_sharks, 
        col_to_move=local_col_str, 
        after_col="whaleSharkID"
    )
    named_sharks = move_column_after(
        dataframe=named_sharks, 
        col_to_move=api_col_str, 
        after_col=local_col_str
    )

    return named_sharks


if __name__ == "__main__":
    story_sharks = read_csv(GBIF_STORY_SHARKS_CSV)

    named_sharks = story_sharks[SHARK_FIELDS_TO_REVIEW].copy()
    generated_names = named_sharks.apply(name_shark_row, axis=1)

    named_sharks_df = name_all_sharks(named_sharks, generated_names)
    named_sharks_list = named_sharks_df.to_dict(orient='records')

    export_to_csv(GBIF_STORY_SHARKS_NAMED_CSV, named_sharks_df)
    export_to_json(GBIF_STORY_SHARKS_NAMED_JSON, named_sharks_list)



