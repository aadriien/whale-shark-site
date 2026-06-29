# Whale Shark Project

POETRY = poetry
VENV_DIR = .venv
PYTHON_VERSION = python3.10
ACTIVATE_VENV = source $(VENV_DIR)/bin/activate &&

.PHONY: setup refresh_all_gbif \
		fetch_gbif clean_gbif analyze_gbif \
		convert_csv_json zip_data \
		generate_shark_names_images generate_shark_names generate_shark_images \
		extract_tar process_annotations train_model \
		get_new_shark_embeddings match_shark_embeddings validate_shark_embeddings \
		match_plausible_shark_embeddings \
		run_vision_pipeline generate_vision_examples \
		build_shark_graph \
		rank_shark_matches build_shark_ranking_graph run_shark_ranking_pipeline \
		format format_vision format_website format_all clean \
		setup_website run_website deploy_website clean_website

all: setup refresh_all_gbif zip_data


# Install Poetry dependencies & set up venv
setup:
	@which poetry > /dev/null || (echo "Poetry not found. Installing..."; curl -sSL https://install.python-poetry.org | $(PYTHON_VERSION) -)
	@$(POETRY) config virtualenvs.in-project true  # Ensure virtualenv is inside project folder
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "Virtual environment not found. Creating..."; \
		$(POETRY) env use $(PYTHON_VERSION); \
		$(POETRY) install --no-root --quiet; \
	fi


# Run full ETL pipeline for latest data
refresh_all_gbif: clean_gbif analyze_gbif convert_csv_json run_vision_pipeline


# Fetch data from API (NOTE: returned data don't really "go" anywhere)
fetch_gbif:
	@$(ACTIVATE_VENV) $(POETRY) run python -m src.gbif.fetch

# Clean, format, & organize raw data from queries
clean_gbif:
	@$(ACTIVATE_VENV) $(POETRY) run python -m src.gbif.clean

# Analyze cleaned data
analyze_gbif:
	@$(ACTIVATE_VENV) $(POETRY) run python -m src.gbif.analyze


convert_csv_json:
	@$(ACTIVATE_VENV) $(POETRY) run python -c "from src.utils.data_utils import convert_all_csvs_to_json; convert_all_csvs_to_json()"


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
	@$(ACTIVATE_VENV) $(POETRY) run python -c "from src.utils.llm_utils import handle_names; handle_names()"

generate_shark_images:
	@which ollama > /dev/null || (echo "ollama not found. Installing..."; $(POETRY) add ollama)
	@$(ACTIVATE_VENV) $(POETRY) run python -c "from src.utils.llm_utils import handle_images; handle_images()"



# Open up tarfile to get .coco dataset (for Hugging Face computer vision model)
extract_tar:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.raw_training.extract_tar_data

# Build source of truth whale shark library (embeddings x IDs)
process_annotations:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.raw_training.process_annotations

# Train YOLOv8 CV model for improved shark object detection
train_model:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.raw_training.handle_yolo_model


# Generate embeddings (+ BBOXes) for new images of unknown sharks
get_new_shark_embeddings:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.one_offs.get_new_image_embeddings

# Identify matches for unknown sharks based on source of truth
match_shark_embeddings:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.unfiltered_matching.match_embeddings

# Leverage proof by contradiction to check match results
validate_shark_embeddings:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.unfiltered_matching.validate_embeddings

# Identify plausible-only matches (excludes geo/temporal IMPOSSIBLE candidates);
# powers the match graph in build_graph.py
match_plausible_shark_embeddings:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.plausible_matching.match_plausible_embeddings

# Run full CV matching pipeline sequentially (embeddings -> matches -> validation)
run_vision_pipeline: get_new_shark_embeddings match_shark_embeddings validate_shark_embeddings match_plausible_shark_embeddings build_shark_graph


# Build match graph: UMAP projection + networkx graph construction
build_shark_graph:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.plausible_matching.build_graph


# Rank sharks by aggregate MiewID distance across all image pairs (GBIF only)
rank_shark_matches:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.shark_ranking.rank_shark_matches

# Build shark-level graph: UMAP on centroids + networkx graph construction
build_shark_ranking_graph:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.shark_ranking.build_shark_graph

# Run full shark ranking pipeline sequentially (ranking -> graph)
run_shark_ranking_pipeline: rank_shark_matches build_shark_ranking_graph


# Generate CV examples with YOLO bounding boxes & segmentation masks
generate_vision_examples:
	@$(ACTIVATE_VENV) $(POETRY) run python -m computer_vision.one_offs.generate_vision_examples



# Auto-format Python code (ETL for wildlife data)
format:
	@$(ACTIVATE_VENV) $(POETRY) run black src/
	@$(ACTIVATE_VENV) $(POETRY) run ruff check --fix src/

# Auto-format Python code (computer vision files)
format_vision:
	@$(ACTIVATE_VENV) $(POETRY) run black computer_vision/
	@$(ACTIVATE_VENV) $(POETRY) run ruff check --fix computer_vision/

# Auto-format & lint-fix website TypeScript/React code
format_website:
	@cd website && npx prettier --write "src/**/*.{ts,tsx,js,jsx}" && npx eslint --fix "src/**/*.{ts,tsx}"

# Format everything
format_all: format format_vision format_website

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
	npm install --save-dev @types/three @types/d3 @types/p5 @types/react-router-dom && \
	npm install cytoscape react-cytoscapejs @types/cytoscape && \
	npm install country-list && \
	npm install lucide-react && \
	npm install maplibre-gl pmtiles protomaps-themes-base && \
	npm install hyparquet && \
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
	@$(ACTIVATE_VENV) $(POETRY) run python -m src.copernicus.clean

fetch_global_copernicus:
	@$(ACTIVATE_VENV) $(POETRY) run python -m src.copernicus.export_global_data

test_LME:
	@$(ACTIVATE_VENV) $(POETRY) run python -m src.utils.geomap_utils


