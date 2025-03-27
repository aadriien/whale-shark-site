# Whale Shark Project

POETRY = poetry
VENV_DIR = .venv

.PHONY: setup run format clean apis analysis

all: setup run

# Check if virtual environment exists, if not, create it
setup:
	@which poetry > /dev/null || (echo "Poetry not found. Installing..."; curl -sSL https://install.python-poetry.org | python3 -)
	@$(POETRY) config virtualenvs.in-project true  # Ensure virtualenv is inside project folder
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "Virtual environment not found. Creating..."; \
		$(POETRY) env use python3; \
		$(POETRY) install --no-root; \
	fi

# Run full pipeline (for now, just fetch APIs)
run: apis

# Fetch data from APIs
apis:
	$(POETRY) run python -m src.fetch.nasa
	$(POETRY) run python -m src.fetch.copernicus
	$(POETRY) run python -m src.fetch.gbif

# Clean & analyze data
analysis:
	$(POETRY) run python src/clean.py
	$(POETRY) run python src/analyze.py

# Auto-format Python code
format:
	@which black > /dev/null || (echo "black not found. Installing..."; $(POETRY) add black)
	$(POETRY) run black src/
