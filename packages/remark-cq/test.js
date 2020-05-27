/**
 * @author Nate Murray
 * @license MIT
 * @module remark:cq:test
 * @fileoverview Test suite for remark-cq.
 */

"use strict";

/* eslint-env node */
const dogs = () => "Like snuggles";

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
    .process(text);

const renderMarkdown = (text, config) =>
  unified().use(reParse).use(remarkStringify).use(plugin, config).process(text);

/*
 * Tests.
 */

test("remark-cq code imports crop-query works", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-query=.dogs}  
<<[](test.js)`;
  const actual = (await render(markup, { root: __dirname })).contents;
  const expected = `<p>The code:</p>
<pre><code class="language-javascript">const dogs = () => "Like snuggles";
</code></pre>`;
  t.equal(actual, expected);
  t.end();
});

test("remark-cq code imports line numbers works", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-start-line=1,crop-end-line=2}
<<[](test.js)`;
  const actual = (await render(markup, { root: __dirname })).contents;
  const expected = `<p>The code:</p>
<pre><code class="language-javascript">/**
 * @author Nate Murray
</code></pre>`;
  t.equal(actual, expected);
  t.end();
});

test("remark-cq code doesn't break normal blocks", async (t) => {
  const markup = `
The code:

\`\`\`javascript
var foo = 1;
\`\`\``;
  const actual = (await render(markup, { root: __dirname })).contents;
  const expected = `<p>The code:</p>
<pre><code class="language-javascript">var foo = 1;
</code></pre>`;
  t.equal(actual, expected);
  t.end();
});

test("remark-cq code imports compile back to markdown", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-query=.dogs}
<<[](test.js)`;
  const actual = (await renderMarkdown(markup, { root: __dirname })).contents;
  const expected = `The code:

\`\`\`javascript
const dogs = () => "Like snuggles";
\`\`\`
`;
  t.equal(actual, expected);
  t.end();
});

test("remark-cq code imports compile back to markdown in the middle of a document", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-query=.dogs}
<<[](test.js)

and here's the **next** one:

{lang=javascript,crop-query=.dogs}
<<[](test.js)

see?
`;
  const actual = (await renderMarkdown(markup, { root: __dirname })).contents;
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

test("remark-cq meta doesn't affect html", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-query=.dogs,meta=true}  
<<[](test.js)`;
  const actual = (await render(markup, { root: __dirname })).contents;
  const expected = `<p>The code:</p>
<pre><code class="language-javascript">const dogs = () => "Like snuggles";
</code></pre>`;
  t.equal(actual, expected);
  t.end();
});

test("remark-cq code meta compiles back to markdown", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-query=.dogs,meta=all}
<<[](test.js)`;
  const actual = (await renderMarkdown(markup, { root: __dirname })).contents;
  const expected = `The code:

\`\`\`javascript { actualFilename=test.js endChar=189 endLine=11 startChar=154 startLine=11 }
const dogs = () => "Like snuggles";
\`\`\`
`;
  t.equal(actual, expected);
  t.end();
});

test("remark-cq code meta as top-level config should work", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-query=.dogs}
<<[](test.js)`;
  const actual = (await renderMarkdown(markup, { root: __dirname, meta: true }))
    .contents;
  const expected = `The code:

\`\`\`javascript { actualFilename=test.js endChar=189 endLine=11 startChar=154 startLine=11 }
const dogs = () => "Like snuggles";
\`\`\`
`;
  t.equal(actual, expected);
  t.end();
});

test("remark-cq code meta should allow specifying a source root URL", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-query=.dogs}
<<[](test.js)`;
  const actual = (
    await renderMarkdown(markup, {
      root: __dirname,
      meta: true,
      defaultMetaRootUrl:
        "https://github.com/fullstackio/cq/blob/master/packages/remark-cq",
    })
  ).contents;
  const expected = `The code:

\`\`\`javascript { actualFilename=test.js endChar=189 endLine=11 startChar=154 startLine=11 url=https&#x3A;//github.com/fullstackio/cq/blob/master/packages/remark-cq/test.js#L11 }
const dogs = () => "Like snuggles";
\`\`\`
`;
  t.equal(actual, expected);
  t.end();
});

test("remark-cq code imports TypeScript crop-query works", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-query=.constructor}  
<<[](test/typescript.ts)`;
  const actual = (await render(markup, { root: __dirname })).contents;
  const expected = `<p>The code:</p>
<pre><code class="language-javascript">constructor() {
  this.onProductSelected = new EventEmitter();
}
</code></pre>`;
  t.equal(actual, expected);
  t.end();
});

test("remark-cq code imports relative paths", async (t) => {
  const markup = `
The code:

{lang=javascript,crop-query=.constructor}  
<<[](../remark-cq/test/typescript.ts)`;
  const actual = (await render(markup, { root: __dirname })).contents;
  const expected = `<p>The code:</p>
<pre><code class="language-javascript">constructor() {
  this.onProductSelected = new EventEmitter();
}
</code></pre>`;
  t.equal(actual, expected);
  t.end();
});

// TODO -- when `cq-fetch` is working, ensure that metaRootUrl doesn't override a file that comes from another repo
