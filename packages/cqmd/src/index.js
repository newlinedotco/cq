const unified = require("unified");
const reParse = require("remark-parse");
const remark2rehype = require("remark-rehype");
const rehypeStringify = require("rehype-stringify");
const remarkStringify = require("remark-stringify");
const remarkCq = require("@fullstackio/remark-cq");

async function cqmd(text, opts = {}) {
  const renderMarkdown = (text, config) =>
    unified()
      .use(reParse)
      .use(remarkStringify)
      .use(remarkCq, config)
      .process(text);

  const renderHtml = (text, config) =>
    unified()
      .use(reParse)
      .use(remarkCq, config)
      .use(remark2rehype)
      .use(rehypeStringify)
      .process(text);

  const results = (await renderMarkdown(text, opts)).contents;
  return results;
}

module.exports = cqmd;
