var toString = require("mdast-util-to-string");
var visit = require("unist-util-visit");
const unified = require("unified");
const remarkParse = require("remark-parse");
const stringify = require("remark-stringify");
const path = require("path");
const isUrl = require("is-url");

module.exports = function attacher(options = {}) {
  let root = options.root || "";

  return function transformer(ast, file) {
    visit(ast, "image", visitor);
    function visitor(node) {
      var data = file.data || (file.data = {});
      if (node.url) {
        const isAbsoluteOrUrl =
          path.isAbsolute(node.url) || isUrl(node.url);

        if (!isAbsoluteOrUrl) {
          if (root === "relative" && options.filename) {
            root = path.dirname(options.filename);
          }

          if (root === "absolute" && options.filename) {
            root = path.dirname(
              path.resolve(options.filename)
            );
          }

          node.url = path.join(root, node.url);
        }
      }
    }
  };
};
