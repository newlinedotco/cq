/**
 * @author Nate Murray
 * @license MIT
 * @module remark:leanpub:test
 * @fileoverview Test suite for remark-leanpub.
 */

"use strict";

/* eslint-env node */

/*
 * Dependencies.
 */

const test = require("tape");
const remark = require("remark");
const plugin = require("./index.js");

const unified = require("unified");
const reParse = require("remark-parse");
const stringify = require("rehype-stringify");
const remark2rehype = require("remark-rehype");
const remarkStringify = require("remark-stringify");

const render = (text, config) =>
    unified()
        .use(reParse)
        .use(plugin, config)
        .use(remark2rehype)
        .use(stringify)
        .processSync(text);

const renderMarkdown = (text, config) =>
    unified()
        .use(reParse)
        .use(remarkStringify)
        .use(plugin, config)
        .processSync(text);

// console.log(render(`hi mom`, {}));

// {lang=javascript,crop-start-line=1,crop-end-line=10}

const markup = `
Here's some code:

<<[](small.js)`;

console.log(render(markup, { root: __dirname }).contents);

const markup2 = `
Here's some code:

\`\`\`javascript
var foo = 1;
\`\`\`
`;

console.log(render(markup2, { root: __dirname }).contents);

/*
 * Tests.
 */

/*
test("remark-cq code imports", function(t) {
    const markup = `
Here's some code:

{lang=javascript,crop-start-line=1,crop-end-line=10}
<<[](index.js)
`;

    t.equal(render(markup, { root: __dirname }), "\n\n");

    //   t.equal(
    //     remark().use(leanpub).process([
    //       '',
    //       '<<[my-file.js](my-file.js)',
    //       '',
    //       '    <<EOF',
    //       '    okay'
    //       ].join('\n')),
    //     ['',
    //      '',
    //      '',
    //      '    <<EOF',
    //      '    okay',
    //      ''
    //     ].join('\n'))

    t.end();
});
*/

/*
test("remark-leanpub blockquotes", function(t) {
    t.equal(
        remark()
            .use(leanpub)
            .process(
                ["", "> hello", "> here is", "> a blockquote", ""].join("\n")
            ).contents,
        ["> hello", "> here is", "> a blockquote", ""].join("\n")
    );

    t.equal(
        remark()
            .use(leanpub)
            .process(
                ["", "A> hello", "A> here is", "A> a blockquote", ""].join("\n")
            ).contents,
        ["> hello", "> here is", "> a blockquote", ""].join("\n")
    );

    t.end();
});

test("remark-leanpub block attribute lists", function(t) {
    t.equal(
        remark()
            .use(leanpub)
            .process("\n{foo=bar}").contents,
        "  \n\n"
    );

    t.equal(
        remark()
            .use(leanpub)
            .process("\n{foo: 1,\nbar: 2}").contents,
        "{foo: 1,\nbar: 2}\n"
    );

    t.equal(
        remark()
            .use(leanpub)
            .process(
                [
                    "",
                    "{baz=bam}",
                    "    var foo = 1;",
                    "    var bar = {cat: dog};"
                ].join("\n")
            ).contents,
        [
            "  ",
            "",
            "",
            "    var foo = 1;",
            "    var bar = {cat: dog};",
            ""
        ].join("\n")
    );

    t.equal(
        remark()
            .use(leanpub, { preserveEmptyLines: false })
            .process(
                [
                    "",
                    "{baz=bam}",
                    "    var foo = 1;",
                    "    var bar = {cat: dog};"
                ].join("\n")
            ).contents,
        ["", "", "    var foo = 1;", "    var bar = {cat: dog};", ""].join("\n")
    );

    t.equal(
        remark()
            .use(leanpub)
            .process(
                [
                    "",
                    "{lang=javascript}",
                    "    var foo = 1;",
                    "    var bar = {cat: dog};"
                ].join("\n")
            ).contents,
        [
            "  ",
            "",
            "",
            "```javascript",
            "var foo = 1;",
            "var bar = {cat: dog};",
            "```",
            ""
        ].join("\n")
    );

    t.equal(
        remark()
            .use(leanpub, { preserveEmptyLines: false })
            .process(
                [
                    "",
                    "{lang=javascript}",
                    "    var foo = 1;",
                    "    var bar = {cat: dog};"
                ].join("\n")
            ).contents,
        [
            "",
            "",
            "```javascript",
            "var foo = 1;",
            "var bar = {cat: dog};",
            "```",
            ""
        ].join("\n")
    );

    t.end();
});
*/

/*
test('remark-leanpub code imports', function(t) { 
  t.equal(
    remark().use(leanpub).process("\n<<[my-file.js](my-file.js)"),
    '\n\n')

  t.equal(
    remark().use(leanpub).process([
      '',
      '<<[my-file.js](my-file.js)',
      '',
      '    <<EOF',
      '    okay'
      ].join('\n')),
    ['',
     '',
     '',
     '    <<EOF',
     '    okay',
     ''
    ].join('\n'))

  t.end();
})
 */
