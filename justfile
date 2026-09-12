style:
	cd frontend && oxfmt
	cd backend && cargo fmt

style-check:
	cd frontend && oxfmt --check
	cd backend && cargo fmt --check

lint:
	cd frontend && oxlint --deny-warnings
	cd backend && cargo clippy --all-targets -- -D warnings

test:
	cd backend && cargo test

npm-latest-args := "python -c \"import json,sys; print(' '.join(f'{d}@latest' for d in json.load(open('package.json'))[sys.argv[1]]))\""

update-dependencies:
	cd frontend && npm install $({{npm-latest-args}} dependencies)
	cd frontend && npm install --save-dev $({{npm-latest-args}} devDependencies)

frontend-run:
	#!/usr/bin/env bash
	set -euo pipefail
	cd frontend
	npm run dev

# Runs the backend and fills it with a few streamers, for developing the website.
backend-run *args:
	#!/usr/bin/env bash
	set -euo pipefail
	cd backend
	cargo build
	cargo run -q -- {{args}} &
	trap 'kill $!' EXIT
	until curl -sf localhost:8080/streamers > /dev/null; do sleep 0.2; done
	just backend-seed
	wait

# Tells the backend that a few made-up streamers went live.
backend-seed:
	#!/usr/bin/env bash
	set -euo pipefail
	went_live() {
		curl -sf -X POST localhost:8080/streamers/went-live \
			-H 'content-type: application/json' -d "{\"channels\": [$1]}"
	}
	went_live '{"platform": "twitch", "channel": "sofiacycles"}'
	went_live '{"platform": "kick", "channel": "mikeydrives"}'
	went_live '{"platform": "youtube", "channel": "BjornPaTur"}, {"platform": "twitch", "channel": "bjorn_pa_tur"}'
	went_live '{"platform": "twitch", "channel": "tokyotom"}'
	went_live '{"platform": "twitch", "channel": "kayla_walks"}, {"platform": "kick", "channel": "kaylawalksirl"}'
	went_live '{"platform": "twitch", "channel": "eerimoq"}'

backend-docker-build:
	docker build -t moblin-website-backend backend

backend-docker-run *args: backend-docker-build
	docker run --rm -it --init -p 8080:8080 moblin-website-backend {{args}}
