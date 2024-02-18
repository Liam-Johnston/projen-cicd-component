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

commit_release:
	docker compose run --rm node make _commit_release

_commit_release:
	git config --global user.name 'Github Actions'
	git config --global user.email 'github@actions.com'
	git commit -am 'chore(release)'
	git tag $(cat ./lib/releasetag.txt)
	git push --follow-tags

publish:
	docker compose run --rm node npm publish
