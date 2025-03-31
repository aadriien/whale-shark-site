# Whale Shark Project

POETRY = poetry
VENV_DIR = .venv

.PHONY: setup run format clean apis analysis

all: setup run zip_data

# Install Poetry dependencies & set up venv
setup:
	@which poetry > /dev/null || (echo "Poetry not found. Installing..."; curl -sSL https://install.python-poetry.org | python3 -)
	@$(POETRY) config virtualenvs.in-project true  # Ensure virtualenv is inside project folder
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "Virtual environment not found. Creating..."; \
		$(POETRY) env use python3; \
		$(POETRY) install --no-root --quiet; \
	fi

# Run full pipeline (for now, just fetch & clean data)
run: analyze_data

# Fetch data from APIs (NOTE: returned data don't really "go" anywhere)
fetch_data:
	@$(POETRY) run python -m src.fetch.nasa
	@$(POETRY) run python -m src.fetch.copernicus
	@$(POETRY) run python -m src.fetch.gbif

# Clean, format, & organize raw data from queries
clean_data:
	@$(POETRY) run python -m src.clean.nasa
	@$(POETRY) run python -m src.clean.copernicus
	@$(POETRY) run python -m src.clean.gbif

# Analyze cleaned data
analyze_data:
	@$(POETRY) run python -m src.analyze.nasa
	@$(POETRY) run python -m src.analyze.copernicus
	@$(POETRY) run python -m src.analyze.gbif

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


# Auto-format Python code
format:
	@which black > /dev/null || (echo "black not found. Installing..."; $(POETRY) add black)
	$(POETRY) run black src/

