"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

exports.default = typescriptEngine;

var _typescript = require("typescript");

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * cq TypeScript Engine
 *
 * Parse files with TypeScript
 *
 * Thanks to astexplorer for some of this code
 * see: https://github.com/fkling/astexplorer/tree/master/src/parsers/js/typescript.js#L128
 */
// import * as ts from "typescript";
var ts = {
  SyntaxKind: _typescript.SyntaxKind,
  createSourceFile: _typescript.createSourceFile,
  ScriptTarget: _typescript.ScriptTarget,
  getLeadingCommentRanges: _typescript.getLeadingCommentRanges
};
var ignoredProperties = new _set2.default(["constructor", "parent"]);

function getNodeName(node) {
  if (node.kind) {
    return ts.SyntaxKind[node.kind];
  }
}

function isNode(node) {
  return node && node.kind ? true : false;
}

function traverse(node, nodeCbs) {
  var nodeName = getNodeName(node);
  if (nodeCbs.hasOwnProperty(nodeName)) {
    nodeCbs[nodeName](node);
  }

  for (var prop in node) {
    if (ignoredProperties.has(prop) || prop.charAt(0) === "_") {
      continue;
    }

    var propValue = node[prop];

    if (Array.isArray(propValue)) {
      propValue.filter(function (v) {
        return isNode(v);
      }).map(function (v) {
        return traverse(v, nodeCbs);
      });
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
  var range = void 0;

  if (typeof node.getStart === "function" && typeof node.getEnd === "function") {
    range = { start: node.getStart(), end: node.getEnd() };
  } else if (typeof node.pos !== "undefined" && typeof node.end !== "undefined") {
    range = { start: node.pos, end: node.end };
  }

  if (node.decorators) {
    var decoratorsRange = (0, _util.rangeExtents)(node.decorators.map(function (d) {
      return nodeToRange(d);
    }));
    range.start = decoratorsRange.end + 1;
  }

  return range;
}

function typescriptEngine() {
  var engineOpts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return {
    name: "typescript",
    parse: function parse(code) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return ts.createSourceFile(opts.filename || "(no filename)", code, ts.ScriptTarget.Latest, true);
    },
    getInitialRoot: function getInitialRoot(ast) {
      return ast;
    },

    nodeToRange: nodeToRange,
    commentRange: function commentRange(node, code, getLeading, getTrailing) {
      var _nodeToRange = nodeToRange(node),
          start = _nodeToRange.start,
          end = _nodeToRange.end;

      if (getLeading) {
        var nodePos = node.pos;
        var parentPos = node.parent.pos;
        var comments = ts.getLeadingCommentRanges(code, nodePos);
        var commentRanges = comments.map(function (c) {
          return { start: c.pos, end: c.end };
        });
        var commentRange = (0, _util.rangeExtents)(commentRanges);
        start = Math.min(start, commentRange.start);
      }
      // TODO trailing
      // getTrailingCommentRanges is a function now
      return { nodes: [node], start: start, end: end };
    },
    findNodesWithIdentifier: function findNodesWithIdentifier(ast, root, query) {
      var paths = [];
      traverse(root, {
        Identifier: function Identifier(node) {
          if (node.text === query.matcher) {
            paths = [].concat((0, _toConsumableArray3.default)(paths), [node.parent]);
          }
        },
        Constructor: function Constructor(node) {
          // `constructor` is a special node in TypeScript (vs. babylon where
          // it's an Identifier) If the query is looking for a constructor by
          // identifier, then we will accept this Constructor node
          if ("constructor" === query.matcher && "IDENTIFIER" === query.type) {
            paths = [].concat((0, _toConsumableArray3.default)(paths), [node]);
          }
        }
      });
      return paths;
    },
    findNodesWithString: function findNodesWithString(ast, root, query) {
      var paths = [];
      traverse(root, {
        StringLiteral: function StringLiteral(node) {
          if (node.text === query.matcher) {
            paths = [].concat((0, _toConsumableArray3.default)(paths), [node.parent]);
          }
        }
      });
      return paths;
    }
  };
}
module.exports = exports["default"];