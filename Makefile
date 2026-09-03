npm-latest-args = \
	python -c "import json; print(' '.join(f'{d}@latest' for d in json.load(open('package.json'))['$(1)']))"

update-dependencies:
	npm install $$($(call npm-latest-args,dependencies))
	npm install --save-dev $$($(call npm-latest-args,devDependencies))
