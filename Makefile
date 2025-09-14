# Whale Shark Project

POETRY = poetry
VENV_DIR = .venv

.PHONY: setup refresh_all_data \
		fetch_data clean_data analyze_data \
		convert_csv_json zip_data \
		generate_shark_names_images generate_shark_names generate_shark_images \
		extract_tar process_annotations train_model \
		get_new_shark_embeddings match_shark_embeddings \
		format clean \
		setup_website run_website deploy_website clean_website

all: setup refresh_all_data zip_data

# Install Poetry dependencies & set up venv
setup:
	@which poetry > /dev/null || (echo "Poetry not found. Installing..."; curl -sSL https://install.python-poetry.org | python3 -)
	@$(POETRY) config virtualenvs.in-project true  # Ensure virtualenv is inside project folder
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "Virtual environment not found. Creating..."; \
		$(POETRY) env use python3.10; \
		$(POETRY) install --no-root --quiet; \
	fi


# Run full ETL pipeline for latest data
refresh_all_data: clean_data analyze_data convert_csv_json


# Fetch data from API (NOTE: returned data don't really "go" anywhere)
fetch_data:
	@$(POETRY) run python -m src.fetch.gbif

# Clean, format, & organize raw data from queries
clean_data:
	@$(POETRY) run python -m src.clean.gbif

# Analyze cleaned data
analyze_data:
	@$(POETRY) run python -m src.analyze.gbif


convert_csv_json:
	@$(POETRY) run python -c "from src.utils.data_utils import convert_all_csvs_to_json; convert_all_csvs_to_json()"


# Zip data folder to reduce load (if exists, & if needs to be updated)
zip_data:
	@if [ -d "data" ]; then \
		TMP_ZIP="data/data_new.zip"; \
		(cd data && zip -Xrq ../$$TMP_ZIP . --exclude data.zip); \
		if [ -f "data/data.zip" ] && cmp -s $$TMP_ZIP data/data.zip; then \
			echo "No changes detected. Keeping existing data.zip."; \
			rm $$TMP_ZIP; \
		else \
			echo "Changes detected. Updating data.zip..."; \
			mv $$TMP_ZIP data/data.zip; \
		fi; \
	else \
		echo "Error: 'data' folder does not exist."; \
		exit 1; \
	fi


# Use LLMs to generate names & images for each shark
generate_shark_names_images: generate_shark_names generate_shark_images

generate_shark_names:
	@which ollama > /dev/null || (echo "ollama not found. Installing..."; $(POETRY) add ollama)
	@$(POETRY) run python -c "from src.utils.llm_utils import handle_names; handle_names()"

generate_shark_images:
	@which ollama > /dev/null || (echo "ollama not found. Installing..."; $(POETRY) add ollama)
	@$(POETRY) run python -c "from src.utils.llm_utils import handle_images; handle_images()"



# Open up tarfile to get .coco dataset (for Hugging Face computer vision model)
extract_tar:
	@$(POETRY) run python -m computer-vision.extract_tar_data

# Build source of truth whale shark library (embeddings x IDs)
process_annotations:
	@$(POETRY) run python -m computer-vision.process_annotations

# Train YOLOv8 CV model for improved shark object detection
train_model:
	@$(POETRY) run python -m computer-vision.handle_yolo_model

# Generate embeddings (+ BBOXes) for new images of unknown sharks
get_new_shark_embeddings:
	@$(POETRY) run python -m computer-vision.get_new_image_embeddings

# Identify matches for unknown sharks based on source of truth
match_shark_embeddings:
	@$(POETRY) run python -m computer-vision.match_embeddings


# Auto-format Python code
format:
	@which black > /dev/null || (echo "black not found. Installing..."; $(POETRY) add black)
	$(POETRY) run black src/

clean:
	@echo "Removing virtual environment..."
	@rm -rf .venv


# Setup frontend env (Vite + React) inside website folder
setup_website:
	@which npm > /dev/null || (echo "npm not found. Please install Node.js and npm." && exit 1)
	@cd website && \
	if [ ! -f "package.json" ]; then \
		echo "Setting up frontend with Vite + React..."; \
		npx create-vite@latest . --template react; \
	else \
		echo "Frontend already set up."; \
	fi && \
	echo "Installing frontend dependencies..."; \
	npm install && \
	npm install three three-globe d3 p5 react-router-dom && \
	npm install @react-three/fiber @react-three/drei && \
	npm install yuka @types/yuka && \
	npm install country-list && \
	npm install gh-pages --save-dev && \
	echo "Checking npm version..." && \
	npm install -g npm@latest

# Run frontend dev server
run_website:
	@cd website && npm run dev

# Deploy live instance of newly-revised website
deploy_website:
	@cd website && rm -rf dist && npm run build && npm run deploy

# Clear away npm for web rebuild
clean_website:
	@echo "Cleaning website build, node_modules, and caches..."
	@cd website && \
	rm -rf node_modules dist .vite package-lock.json yarn.lock pnpm-lock.yaml



fetch_copernicus:
	@$(POETRY) run python -m src.clean.copernicus

test_LME:
	@$(POETRY) run python -m src.utils.geomap_utils



