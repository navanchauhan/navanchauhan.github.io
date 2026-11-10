# Makefile


scss:
	sass sass/c-hyde.scss Resources/assets/c-hyde.css

generate:
	uv run python generate_me.py

all: scss generate

serve:
	python3 serve.py 8000

clean:
	rm -r docs/*
