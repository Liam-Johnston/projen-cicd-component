.PHONY: all
all:

project:
	docker compose run --rm app bun .projenrc.ts

run:
	docker compose run --rm app bun start
