/**
 * cq TypeScript Engine
 *
 * Parse files with TypeScript
 *
 * Thanks to astexplorer for some of this code
 * see: https://github.com/fkling/astexplorer/tree/master/src/parsers/js/typescript.js#L128
 */
// import * as ts from "typescript";
import {
  SyntaxKind,
  createSourceFile,
  ScriptTarget,
  getLeadingCommentRanges
} from "typescript";
import { rangeExtents } from "./util";

const ts = {
  SyntaxKind,
  createSourceFile,
  ScriptTarget,
  getLeadingCommentRanges
};
const ignoredProperties = new Set(["constructor", "parent"]);

function getNodeName(node) {
  if (node.kind) {
    return ts.SyntaxKind[node.kind];
  }
}

function isNode(node) {
  return node && node.kind ? true : false;
}

function traverse(node, nodeCbs) {
  let nodeName = getNodeName(node);
  if (nodeCbs.hasOwnProperty(nodeName)) {
    nodeCbs[nodeName](node);
  }

  for (let prop in node) {
    if (ignoredProperties.has(prop) || prop.charAt(0) === "_") {
      continue;
    }

    let propValue = node[prop];

    if (Array.isArray(propValue)) {
      propValue.filter((v) => isNode(v)).map((v) => traverse(v, nodeCbs));
    } else if (isNode(propValue)) {
      traverse(propValue, nodeCbs);
    }
  }
}

function nodeToRange(node) {
  // decorators are a bit odd in that they're children of the class they're
  // attached to by default we don't want to include the decorators in the range
  // of a node. We'll handle this manually if the decorators() operation is
  // specified
  let range;

  if (
    typeof node.getStart === "function" &&
    typeof node.getEnd === "function"
  ) {
    range = { start: node.getStart(), end: node.getEnd() };
  } else if (
    typeof node.pos !== "undefined" &&
    typeof node.end !== "undefined"
  ) {
    range = { start: node.pos, end: node.end };
  }

  if (node.decorators) {
    let decoratorsRange = rangeExtents(
      node.decorators.map((d) => nodeToRange(d))
    );
    range.start = decoratorsRange.end + 1;
  }

  return range;
}

export default function typescriptEngine(engineOpts = {}) {
  return {
    name: "typescript",
    parse(code, opts = {}) {
      return ts.createSourceFile(
        opts.filename || "(no filename)",
        code,
        ts.ScriptTarget.Latest,
        true
      );
    },
    getInitialRoot(ast) {
      return ast;
    },
    nodeToRange,
    commentRange(node, code, getLeading, getTrailing) {
      let { start, end } = nodeToRange(node);

      if (getLeading) {
        let nodePos = node.pos;
        let parentPos = node.parent.pos;
        let comments = ts.getLeadingCommentRanges(code, nodePos);
        let commentRanges = comments.map((c) => ({ start: c.pos, end: c.end }));
        let commentRange = rangeExtents(commentRanges);
        start = Math.min(start, commentRange.start);
      }
      // TODO trailing
      // getTrailingCommentRanges is a function now
      return { nodes: [node], start, end };
    },
    findNodesWithIdentifier(ast, root, query) {
      let paths = [];
      traverse(root, {
        Identifier: function (node) {
          if (node.text === query.matcher) {
            paths = [...paths, node.parent];
          }
        },
        Constructor: function (node) {
          // `constructor` is a special node in TypeScript (vs. babylon where
          // it's an Identifier) If the query is looking for a constructor by
          // identifier, then we will accept this Constructor node
          if ("constructor" === query.matcher && "IDENTIFIER" === query.type) {
            paths = [...paths, node];
          }
        }
      });
      return paths;
    },
    findNodesWithString(ast, root, query) {
      let paths = [];
      traverse(root, {
        StringLiteral: function (node) {
          if (node.text === query.matcher) {
            paths = [...paths, node.parent];
          }
        }
      });
      return paths;
    }
  };
}
