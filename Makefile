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

# Run full pipeline (for now, just fetch APIs)
run: apis

# Fetch data from APIs
apis:
	@$(POETRY) run python -m src.clean.nasa
	@$(POETRY) run python -m src.clean.copernicus
	@$(POETRY) run python -m src.clean.gbif

# Clean & analyze data
analysis:
	@$(POETRY) run python src/clean.py
	@$(POETRY) run python src/analyze.py

# Zip data folder to reduce load (if exists)
zip_data:
	@if [ -d "data" ]; then \
		echo "Zipping the data folder..."; \
		zip -r data/data.zip data/ > /dev/null 2>&1; \
	else \
        echo "Error: 'data' folder does not exist."; \
        exit 1; \
    fi

# Auto-format Python code
format:
	@which black > /dev/null || (echo "black not found. Installing..."; $(POETRY) add black)
	$(POETRY) run black src/

