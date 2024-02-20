.PHONY: all
all:

project:
	docker compose run --rm app bun .projenrc.ts

install:
	docker compose run --rm app bun i

build: install
	docker compose run --rm app bun run build

bump:
	docker compose run --rm node npm run bump

node_shell:
	docker compose run --rm node sh

publish:
	docker compose run --rm node npm publish
