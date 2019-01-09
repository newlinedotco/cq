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

const renderHtml = (text, config = {}) =>
  unified()
    .use(reParse)
    .use(plugin, config)
    .use(remark2rehype)
    .use(stringify)
    .process(text);

const renderMarkdown = (text, config = {}) =>
  unified()
    .use(reParse)
    .use(remarkStringify)
    .use(plugin, config)
    .process(text);

/*
 * Tests.
 */

test("remark-adjust-paths appends paths", async function(t) {
  t.equal(
    (await renderMarkdown(
      `
# Hello

![A cat](cat.jpg)
`,

      { root: "foo/bar" }
    )).contents,
    `# Hello

![A cat](foo/bar/cat.jpg)
`
  );
  t.end();
});

test("remark-adjust-paths appends relative paths", async function(t) {
  t.equal(
    (await renderMarkdown(
      `
# Hello

![A cat](../my/photos/cat.jpg)
`,
      { root: "foo/bar" }
    )).contents,
    `# Hello

![A cat](foo/my/photos/cat.jpg)
`
  );
  t.end();
});

test("remark-adjust-paths appends leaves absolute paths alone", async function(t) {
  t.equal(
    (await renderMarkdown(
      `
# Hello

![A cat](/my/photos/cat.jpg)
`,
      { root: "foo/bar" }
    )).contents,
    `# Hello

![A cat](/my/photos/cat.jpg)
`
  );

  t.end();
});

test("remark-adjust-paths appends paths in HTML", async function(t) {
  t.equal(
    (await renderHtml(
      `
# Hello

![A cat](cat.jpg)
`,

      { root: "foo/bar" }
    )).contents,
    `<h1>Hello</h1>\n<p><img src="foo/bar/cat.jpg" alt="A cat"></p>`
  );
  t.end();
});
