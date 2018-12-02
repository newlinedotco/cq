/**
 * @author Nate Murray
 * @license MIT
 * @module remark:cq:test
 * @fileoverview Test suite for remark-cq.
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
        .use(plugin, Object.assign({ root: __dirname }, config))
        .use(remark2rehype)
        .use(stringify)
        .processSync(text);

const renderMarkdown = (text, config) =>
    unified()
        .use(reParse)
        .use(remarkStringify)
        .use(plugin, config)
        .processSync(text);

/*
 * Tests.
 */

test("remark-cq code imports crop-query works", t => {
    const dogs = () => "Like snuggles";
    const markup = `
The code:

{lang=javascript,crop-query=.dogs}  
<<[](test.js)`;
    const actual = render(markup, { root: __dirname }).contents;
    const expected = `<p>The code:</p>
<pre><code class="language-javascript">const dogs = () => "Like snuggles";
</code></pre>`;
    t.equal(actual, expected);
    t.end();
});

test("remark-cq code imports line numbers works", t => {
    const markup = `
The code:

{lang=javascript,crop-start-line=1,crop-end-line=2}
<<[](test.js)`;
    const actual = render(markup, { root: __dirname }).contents;
    const expected = `<p>The code:</p>
<pre><code class="language-javascript">/**
 * @author Nate Murray
</code></pre>`;
    t.equal(actual, expected);
    t.end();
});

test("remark-cq code doesn't break normal blocks", t => {
    const markup = `
The code:

\`\`\`javascript
var foo = 1;
\`\`\``;
    const actual = render(markup, { root: __dirname }).contents;
    const expected = `<p>The code:</p>
<pre><code class="language-javascript">var foo = 1;
</code></pre>`;
    t.equal(actual, expected);
    t.end();
});

test("remark-cq code imports compile back to markdown", t => {
    const dogs = () => "Like snuggles";
    const markup = `
The code:

{lang=javascript,crop-query=.dogs}
<<[](test.js)`;
    const actual = renderMarkdown(markup, { root: __dirname }).contents;
    const expected = `The code:

\`\`\`javascript
const dogs = () => "Like snuggles";
\`\`\`
`;
    t.equal(actual, expected);
    t.end();
});

test("remark-cq code imports compile back to markdown in th emiddle of a document", t => {
    const dogs = () => "Like snuggles";
    const markup = `
The code:

{lang=javascript,crop-query=.dogs}
<<[](test.js)

and here's the **next** one:

{lang=javascript,crop-query=.dogs}
<<[](test.js)

see?
`;
    const actual = renderMarkdown(markup, { root: __dirname }).contents;
    const expected = `The code:

\`\`\`javascript
const dogs = () => "Like snuggles";
\`\`\`

and here's the **next** one:

\`\`\`javascript
const dogs = () => "Like snuggles";
\`\`\`

see?
`;
    t.equal(actual, expected);
    t.end();
});
