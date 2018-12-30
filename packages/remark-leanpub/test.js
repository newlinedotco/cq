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

test("remark-leanpub blockquotes", async function(t) {
    t.equal(
        (await renderMarkdown(
            `
> hello
> here is
> a blockquote`
        )).contents,
        `> hello
> here is
> a blockquote
`
    );

    t.equal(
        (await renderMarkdown(
            `
A> hello
A> here is
A> a blockquote`
        )).contents,
        `> hello
> here is
> a blockquote
`
    );

    t.end();
});
