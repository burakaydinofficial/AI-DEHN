.PHONY: help install test lint format run dev clean

help:
	@echo "📋 Available commands:"
	@echo "  install    - Install dependencies"
	@echo "  test       - Run tests"
	@echo "  lint       - Run linting"
	@echo "  format     - Format code"
	@echo "  run        - Run production server"
	@echo "  dev        - Run development server"
	@echo "  clean      - Clean cache files"

install:
	pip install -r requirements.txt
	pip install -r requirements-dev.txt

test:
	pytest

lint:
	flake8 .
	mypy .

format:
	black .

run:
	python main.py

dev:
	python run-dev.py

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf .mypy_cache
	rm -rf .coverage
