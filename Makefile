# Makefile


scss:
	sass sass/c-hyde.scss Resources/assets/c-hyde.css

generate:
	python3 generate_me.py

all: scss generate

clean:
	rm -r docs/*
