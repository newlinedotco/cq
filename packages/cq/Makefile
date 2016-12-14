.PHONY: test

parser:
	npm run generate-parser

test:
	npm run watchtest

example1:
	./node_modules/.bin/babel-node src/cli.js '.bye' examples/basics.js
