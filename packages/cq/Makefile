.PHONY: test

parser:
	npm run generate-parser

test:
	npm run watchtest

example1:
	./node_modules/.bin/babel-node src/cli.js '.bye' examples/basics.js

build:
	npm run compile

onetest:
	./node_modules/.bin/mocha --compilers js:babel-core/register --watch --watchextension js test/python.test.js


examplepy:
	./node_modules/.bin/babel-node src/cli.js --engine treeSitter '.foo' --language python examples/basic.py

publish-canary:
	lerna publish --canary --preid treesitter --dist-tag treesitter --git-remote github --force-publish