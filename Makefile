# Whale Shark Project

POETRY = poetry
VENV_DIR = .venv

.PHONY: setup run format clean apis analysis

all: setup run

# Install Poetry dependencies & set up venv
setup:
	@which poetry > /dev/null || (echo "Poetry not found. Installing..."; curl -sSL https://install.python-poetry.org | python3 -)
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "Virtual environment not found. Creating..."; \
		$(POETRY) env use python3; \
	fi
	@$(POETRY) install --quiet

# Run full pipeline (for now, just fetch APIs)
run: apis

# Fetch data from APIs
apis:
	$(POETRY) run python src/fetch/nasa.py
	$(POETRY) run python src/fetch/copernicus.py
	$(POETRY) run python src/fetch/gbif.py

# Clean & analyze data
analysis:
	$(POETRY) run python src/clean.py
	$(POETRY) run python src/analyze.py

# Auto-format Python code
format:
	@which black > /dev/null || (echo "black not found. Installing..."; $(POETRY) add black)
	$(POETRY) run black src/
