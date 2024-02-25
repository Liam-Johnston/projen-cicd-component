.PHONY: all
all:

project:
	docker compose run --rm app bun .projenrc.ts

install:
	docker compose run --rm app bun i

build:
	docker compose run --rm app bun run build

publish:
	docker compose run --rm app npm publish

bump:
	docker compose run --rm app bun run bump
