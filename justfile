python_dirs := "tests scripts"

config_dir := ".config"

[private]
default:
	@just --list

[group('dev')]
[doc("Runs the backend and the frontend, at http://localhost:5174.")]
dev:
	#!/usr/bin/env bash
	set -euo pipefail
	trap 'trap "" INT TERM; kill $(jobs -p) 2> /dev/null' EXIT
	just dev-backend &
	until curl -sf localhost:8070/streamers > /dev/null; do sleep 0.2; done
	just dev-frontend &
	wait

# The tip pages are looked up in Moblin Cloud's dev-backend on port 8080, when it runs.
[group('dev')]
[doc("Runs the backend and fills it with a few made-up streamers.")]
dev-backend *args:
	#!/usr/bin/env bash
	set -euo pipefail
	trap 'trap "" INT TERM; kill $(jobs -p) 2> /dev/null' EXIT
	cd backend
	cargo build
	DATABASE="${DATABASE:-./database.sqlite}" cargo run -q -- --listen 0.0.0.0:8070 --allow-unattested --frontend-url http://localhost:5174 --cloud-url http://localhost:8080 {{args}} &
	until curl -sf localhost:8070/streamers > /dev/null; do sleep 0.2; done
	python3 ../scripts/seed_backend.py
	wait

[group('dev')]
[doc("Runs the frontend's dev server at http://localhost:5174, talking to dev-backend.")]
dev-frontend:
	cd frontend && npm run dev

[group('check')]
style:
	cd frontend && oxfmt
	cd backend && cargo fmt
	isort --settings-path {{config_dir}}/isort.cfg {{python_dirs}}
	ruff format --config {{config_dir}}/ruff.toml {{python_dirs}}

[group('check')]
style-check:
	cd frontend && oxfmt --check
	cd backend && cargo fmt --check
	isort --settings-path {{config_dir}}/isort.cfg {{python_dirs}} --check
	ruff format --config {{config_dir}}/ruff.toml {{python_dirs}} --check

[group('check')]
lint:
	cd frontend && oxlint --deny-warnings
	cd backend && cargo clippy --all-targets -- -D warnings
	pylint --rcfile {{config_dir}}/pylintrc {{python_dirs}}
	ruff check --config {{config_dir}}/ruff.toml {{python_dirs}}
	mypy --config-file {{config_dir}}/mypy.ini {{python_dirs}}

[group('check')]
spell-check:
	codespell

[group('check')]
test:
	cd backend && cargo test

[group('check')]
[doc("Runs the backend system tests, see tests/README.md.")]
system-test *args:
	python3 -m tests.test {{args}}

npm-latest-args := "python -c \"import json,sys; print(' '.join(f'{d}@latest' for d in json.load(open('package.json'))[sys.argv[1]]))\""

[group('maintenance')]
[doc("Updates the frontend's npm dependencies to their latest versions.")]
update-dependencies:
	cd frontend && npm install $({{npm-latest-args}} dependencies)
	cd frontend && npm install --save-dev $({{npm-latest-args}} devDependencies)

[group('maintenance')]
[doc("Translates new strings of the website to all languages with Claude.")]
machine-translate:
	python3 scripts/translate.py
	cd frontend && oxfmt src/locales

[group('maintenance')]
[doc("Regenerates the settings reference on the docs page from a Moblin checkout.")]
docs-generate moblin="../moblin":
	python3 scripts/generate_docs.py {{moblin}} frontend/src/data/docs/settings.json
	cd frontend && oxfmt src/data/docs/settings.json

[group('maintenance')]
[doc("Renders a 108 card deck of the trading cards as 300 dpi PNGs with bleed, for makeplayingcards.com.")]
cards-print out="cards-print":
	cd frontend && npm run build
	cd frontend && node scripts/print-cards.ts {{absolute_path(out)}}
