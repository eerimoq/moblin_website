style:
	oxfmt

style-check:
	oxfmt --check

lint:
	oxlint --deny-warnings

npm-latest-args := "python -c \"import json,sys; print(' '.join(f'{d}@latest' for d in json.load(open('package.json'))[sys.argv[1]]))\""

update-dependencies:
	npm install $({{npm-latest-args}} dependencies)
	npm install --save-dev $({{npm-latest-args}} devDependencies)
