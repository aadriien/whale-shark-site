import re
import torch
import ollama
import random
import requests
import pandas as pd
from typing import Dict, Literal
from diffusers import StableDiffusionPipeline


from src.utils.data_utils import (
    folder_exists, read_csv, export_to_csv, export_to_json, move_column_after,
)

from src.gbif.analyze import (
    GBIF_STORY_SHARKS_CSV,
)


GBIF_STORY_SHARKS_NAMED_CSV = "outputs/gbif_story_sharks_named.csv"
GBIF_STORY_SHARKS_NAMED_JSON = "website/src/assets/data/gbif_story_sharks_named.json"

GBIF_STORY_SHARK_IMAGES_CSV = "outputs/gbif_story_shark_images.csv"
GBIF_STORY_SHARK_IMAGES_JSON = "website/src/assets/data/gbif_story_shark_images.json"

JPG_FILE_BASE_PATH = "website/src/assets/images/generated-shark-imgs/"


SHARK_FIELDS_TO_REVIEW = [
    "whaleSharkID",
    "sex",
    "lifeStage (year)",
    "country (year)",
    "stateProvince - verbatimLocality (month year)",
]

SELECTED_SHARK_IDS = [
    "101376a",
    "101373a",
    "Ranger",
    "101371a",
    "57828",
    "57821",
]


# Compare local Ollama instance with result from API endpoint (uses openai)
LOCAL_LLM_MODEL = "gemma:2b"
API_LLM_MODEL = "openai"
HUGGING_FACE_MODEL = "lavaman131/cartoonify"

LOCAL_COL_STR = f"LLM-Gen Name ({LOCAL_LLM_MODEL} local)"
API_COL_STR = f"LLM-Gen Name ({API_LLM_MODEL} API)"
IMAGE_COL_STR = f"LLM-Gen Image (API)"

TEXT_GEN_URL_BASE = "https://text.pollinations.ai/"
IMAGE_GEN_URL_BASE = "https://image.pollinations.ai/prompt"

SYSTEM_PROMPT = (
    "You are a creative and quirky marine biologist who loves naming whale sharks.\n"
)
TEXT_PROMPT = (
    "Come up with a fun, original name for this whale shark, given its traits. "
    "Wrap it in **:\n"
)

API_TEXT_PARAMS = {
    "model": API_LLM_MODEL,
    "seed": 1,
    "private": "true",
    # "system": SYSTEM_PROMPT, # can only use system prompt in GET request
}

API_IMAGE_PARAMS = {
    "width": 900,
    "height": 400,
    "private": "true",
    "nologo": "true",
    "safe": "true"
}


#####
## Text generation (prompting API + local)
#####

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
                **API_TEXT_PARAMS
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


#####
## Prompt creation & response helpers
#####

def format_prompt(prompt: str, shark_data: Dict[str, str]) -> str:
    for key, value in shark_data.items():
        prompt += f"- {key.capitalize()}: {value}\n"

    return prompt


def extract_bold_name(text: str) -> str:
    # We only want "**name**" from LLM text response
    match = re.search(r"\*\*(.+?)\*\*", text)

    if match:
        return match.group(1).strip()

    # If ** bold not found, default to full text
    return text.strip() 


#####
## LLM naming pipeline
#####

def generate_shark_names(shark_data: Dict[str, str]) -> dict:
    local_prompt = format_prompt(SYSTEM_PROMPT + TEXT_PROMPT, shark_data)
    API_prompt = format_prompt(SYSTEM_PROMPT + TEXT_PROMPT, shark_data)

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
    named_sharks[LOCAL_COL_STR] = generated_names.apply(lambda x: x["local_name"])
    named_sharks[API_COL_STR] = generated_names.apply(lambda x: x["API_name"])
    
    named_sharks = move_column_after(
        dataframe=named_sharks, 
        col_to_move=LOCAL_COL_STR, 
        after_col="whaleSharkID"
    )
    named_sharks = move_column_after(
        dataframe=named_sharks, 
        col_to_move=API_COL_STR, 
        after_col=LOCAL_COL_STR
    )

    return named_sharks


#####
## Image generation (prompting local via Hugging Face) - currently unused
#####


def generate_image_huggingface(prompt: str, shark_ID: str) -> None:
    if not shark_ID:
        raise ValueError("Error, must specify whale shark ID")

    jpg_file = JPG_FILE_BASE_PATH + f"{shark_ID}.jpg"

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    torch_dtype = torch.float32

    pipeline = StableDiffusionPipeline.from_pretrained(
        HUGGING_FACE_MODEL, 
        torch_dtype=torch_dtype
    ).to(device)

    image = pipeline(prompt).images[0]
    image.save(jpg_file)


#####
## Image generation (prompting API)
#####

def generate_image_API(prompt: str, shark_ID: str) -> str:
    if not shark_ID:
        raise ValueError("Error, must specify whale shark ID")

    jpg_file = JPG_FILE_BASE_PATH + f"{shark_ID}.jpg"

    # Harness random each time to give images personality / uniqueness
    seed = random.randint(0, 99999) 

    try:
        response = requests.get(
            f"{IMAGE_GEN_URL_BASE}/{prompt}?seed={seed}", 
            params=API_IMAGE_PARAMS
        )
        response.raise_for_status()

        # Create folder to hold images if doesn't already exist
        _ = folder_exists(file_name=jpg_file, create=True)
        print(f"Exporting generated image to: {jpg_file}")

        with open(jpg_file, "wb") as file:
            file.write(response.content)

        return response.url

    except requests.RequestException as e:
        raise RuntimeError(f"Error, failed to reach URL: {e}")


#####
## LLM image pipeline
#####

def get_shark_row_image_url(row: pd.Series) -> str:
    IMAGE_FIELDS_TO_REVIEW = SHARK_FIELDS_TO_REVIEW + [LOCAL_COL_STR, API_COL_STR]

    shark_data = {metric: row.get(metric, "") for metric in IMAGE_FIELDS_TO_REVIEW}
    shark_ID = shark_data["whaleSharkID"]

    # Highlight key traits to infuse more personality
    image_prompt = (
        f"Whimsical cartoon of {shark_data[API_COL_STR]}, a filter-feeding whale shark. "
        f"This is *not* a scary shark (absolutely *no* pointy teeth)! "
        f"It's a gentle giant with a huge flat mouth and soft, speckled skin with white dots. "
        f"{shark_data[API_COL_STR]} is a playful, curious {shark_data['sex']} "
        f"{shark_data['lifeStage (year)']} from {shark_data['country (year)']}. "
        f"Make the whimsical cartoon highly unique, expressive, and full of charm. "
        f"Do not include any text or letters in the image.\n"
    )

    try:
        API_image_url = generate_image_API(prompt=image_prompt, shark_ID=shark_ID)
        return API_image_url

    except Exception as e:
        print(f"Error, failed to generate image for row {row.name}: {e}")
        return ""


def get_all_shark_images(selected_sharks: pd.DataFrame, generated_images: list) -> pd.DataFrame:
    selected_sharks[IMAGE_COL_STR] = generated_images.apply(lambda x: x)
    
    selected_sharks = move_column_after(
        dataframe=selected_sharks, 
        col_to_move=IMAGE_COL_STR, 
        after_col="whaleSharkID"
    )

    return selected_sharks


#####
## Outline process of text / image generation
#####

def handle_names() -> None:
    story_sharks = read_csv(GBIF_STORY_SHARKS_CSV)

    # Generate LLM names for each row
    relevant_fields_df = story_sharks[SHARK_FIELDS_TO_REVIEW]
    generated_names = relevant_fields_df.apply(name_shark_row, axis=1)

    # Apply those names to DataFrame (+ prep for JSON)
    named_sharks_df = name_all_sharks(story_sharks.copy(), generated_names)
    named_sharks_list = named_sharks_df.to_dict(orient='records')

    export_to_csv(GBIF_STORY_SHARKS_NAMED_CSV, named_sharks_df)
    export_to_json(GBIF_STORY_SHARKS_NAMED_JSON, named_sharks_list)


def handle_images() -> None:
    story_sharks = read_csv(GBIF_STORY_SHARKS_NAMED_CSV)

    # Focus only on the sharks featured in storytelling
    selected_sharks = story_sharks.loc[story_sharks["whaleSharkID"].isin(SELECTED_SHARK_IDS)]

    # Generate LLM images for each row
    relevant_fields_df = selected_sharks[SHARK_FIELDS_TO_REVIEW + [LOCAL_COL_STR, API_COL_STR]]
    generated_images = relevant_fields_df.apply(get_shark_row_image_url, axis=1)
    
    # Apply those images to DataFrame (+ prep for JSON)
    shark_images_df = get_all_shark_images(selected_sharks.copy(), generated_images)
    shark_images_list = shark_images_df.to_dict(orient='records')

    export_to_csv(GBIF_STORY_SHARK_IMAGES_CSV, shark_images_df)
    export_to_json(GBIF_STORY_SHARK_IMAGES_JSON, shark_images_list)



if __name__ == "__main__":
    # handle_names()
    handle_images()

    # generate_image_huggingface()

 
