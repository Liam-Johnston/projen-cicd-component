.PHONY: all
all:

project:
	docker compose run --rm app bun .projenrc.ts

build:
	bun run build
