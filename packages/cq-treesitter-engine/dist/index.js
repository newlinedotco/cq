"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

exports.default = treeSitterEngine;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Parser = require("tree-sitter");
var JavaScript = require("tree-sitter-javascript");
var Python = require("tree-sitter-python");
var TypeScript = require("tree-sitter-typescript/typescript");
var TSX = require("tree-sitter-typescript/tsx");
var Rust = require("tree-sitter-rust");
var Go = require("tree-sitter-go");

function getNodeName(node) {
  return node.constructor.name;
}
function isNode(node) {
  return node && node.type ? true : false;
}

function traverse(node, nodeCbs) {
  var nodeName = getNodeName(node);
  if (nodeCbs.hasOwnProperty(nodeName)) {
    nodeCbs[nodeName](node);
  }

  // console.log(
  //   "node: ",
  //   nodeName,
  //   node.text ? `"${node.text}"` : "",
  //   node,
  //   node.children ? node.children.length : null,
  //   node.fields
  // );

  var nodeIterates = [].concat((0, _toConsumableArray3.default)(node.children ? node.children : []), (0, _toConsumableArray3.default)(node.fields ? node.fields : [])).filter(function (v) {
    return v && isNode(v);
  });

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(nodeIterates), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var prop = _step.value;

      if (Array.isArray(prop)) {
        prop.filter(function (v) {
          return isNode(v);
        }).map(function (v) {
          return traverse(v, nodeCbs);
        });
      } else if (isNode(prop)) {
        traverse(prop, nodeCbs);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

function nodeToRange(node) {
  if (node.startIndex && node.endIndex) {
    return { start: node.startIndex, end: node.endIndex };
  }
  /*
  if (node.body && node.body.start && node.body.end) {
    return { start: node.body.start, end: node.body.end };
  }
   switch (node.type) {
    case "ObjectProperty":
      return {
        start: nodeToRange(node.key).start,
        end: nodeToRange(node.value).end
      };
    default:
      console.log("unknown", node);
      throw new Error("nodeToRange of unknown type: " + node.type);
      break;
  }
  */
}

function treeSitterEngine() {
  var engineOpts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var commentNodes = [];
  return {
    parse: function parse(code) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      commentNodes = [];
      var parser = new Parser();

      var langModule = void 0;
      switch (engineOpts.language) {
        case "javascript":
          langModule = JavaScript;
          break;
        case "typescript":
          langModule = TypeScript;
          break;
        case "tsx":
          langModule = TSX;
          break;
        case "python":
          langModule = Python;
          break;
        case "rust":
          langModule = Rust;
          break;
        case "go":
          langModule = Go;
          break;

        default:
          langModule = JavaScript;
          break;
      }
      parser.setLanguage(langModule);

      var tree = parser.parse(code);
      if (engineOpts.debug) {}
      return tree;
    },
    getInitialRoot: function getInitialRoot(ast) {
      return ast.rootNode;
    },
    findNodesWithIdentifier: function findNodesWithIdentifier(ast, root, query) {
      var paths = [];
      traverse(root, {
        IdentifierNode: function IdentifierNode(node) {
          if (node.text === query.matcher) {
            paths = [].concat((0, _toConsumableArray3.default)(paths), [node.parent]);
          }
        },
        // python
        ExpressionListNode: function ExpressionListNode(node) {
          if (node.text === query.matcher) {
            paths = [].concat((0, _toConsumableArray3.default)(paths), [node.parent]);
          }
        },
        SyntaxNode: function SyntaxNode(node) {
          if (
          // node.type === "property_identifier" &&
          node.text === query.matcher) {
            paths = [].concat((0, _toConsumableArray3.default)(paths), [node.parent]);
          }
        },
        CommentNode: function CommentNode(node) {
          commentNodes = [].concat((0, _toConsumableArray3.default)(commentNodes), [node]);
        }
      });
      return paths;
    },
    findNodesWithString: function findNodesWithString(ast, root, query) {
      var paths = [];
      traverse(root, {
        StringNode: function StringNode(node) {
          if (node.text === query.matcher || node.text === "'" + query.matcher + "'" // hack? quote the matcher
          ) {
              paths = [].concat((0, _toConsumableArray3.default)(paths), [node.parent]);
            }
        }
      });
      return paths;
    },
    commentRange: function commentRange(node, code, getLeading, getTrailing) {
      var _nodeToRange = nodeToRange(node),
          start = _nodeToRange.start,
          end = _nodeToRange.end;
      // console.log("node: ", node);

      // console.log(
      //   "lastCommentNode: ",
      //   lastCommentNode.startIndex,
      //   lastCommentNode.endIndex,
      //   node.startIndex,
      //   node.endIndex
      // );
      // if (lastCommentNode) {
      //   console.log("WE HAVE A COMMENT NODE", lastCommentNode);
      // }

      if (getLeading) {
        // let nodePos = node.pos;
        // let parentPos = node.parent.pos;
        // let comments = ts.getLeadingCommentRanges(code, nodePos);
        // let commentRanges = comments.map(c => ({ start: c.pos, end: c.end }));
        // let commentRange = rangeExtents(commentRanges);
        // start = Math.min(start, commentRange.start);
        var commentsBefore = commentNodes.filter(function (commentNode) {
          return commentNode.startIndex < end;
        });

        var sortedComments = commentsBefore.sort(function (a, b) {
          return a.endIndex - b.endIndex;
        }).reverse();
        // sortedComments is now in reverse order, closest back up the top of the document
        var commentBlock = [sortedComments[0]];
        var lastStart = sortedComments[0].startIndex;

        for (var i = 1; i < sortedComments.length; i++) {
          var nextComment = sortedComments[i];
          if (nextComment.endIndex === lastStart - 1) {
            commentBlock = [nextComment].concat((0, _toConsumableArray3.default)(commentBlock));
            lastStart = nextComment.startIndex;
          }
        }

        // sortedComments.map(comment => {
        //   console.log(comment.startIndex, comment.endIndex);
        // });

        // console.log("sortedComments: ", sortedComments);
        if (commentBlock.length > 0) {
          var firstComment = commentBlock[0];
          var lastComment = commentBlock[commentBlock.length - 1];
          start = Math.min(start, firstComment.startIndex);
          end = Math.max(end, lastComment.endIndex);
        }
      }

      // TODO trailing
      return { nodes: [node], start: start, end: end };
    },

    nodeToRange: nodeToRange
  };
}
module.exports = exports["default"];