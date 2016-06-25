'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = typescriptEngine;

require('babel-polyfill');

var _typescript = require('typescript');

var ts = _interopRequireWildcard(_typescript);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * cq TypeScript Engine
 *
 * Parse files with TypeScript
 *
 * Thanks to astexplorer for some of this code
 * see: https://github.com/fkling/astexplorer/tree/master/src/parsers/js/typescript.js#L128
 */


var ignoredProperties = new Set(['constructor', 'parent']);

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
  };

  for (var prop in node) {
    if (ignoredProperties.has(prop) || prop.charAt(0) === '_') {
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

function typescriptEngine() {
  var engineOpts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  return {
    parse: function parse(code) {
      var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return ts.createSourceFile(opts.filename || '(no filename)', code, ts.ScriptTarget.Latest, true);
    },
    getInitialRoot: function getInitialRoot(ast) {
      return ast;
    },
    nodeToRange: function nodeToRange(node) {
      if (typeof node.getStart === 'function' && typeof node.getEnd === 'function') {
        return { start: node.getStart(), end: node.getEnd() };
      } else if (typeof node.pos !== 'undefined' && typeof node.end !== 'undefined') {
        return { start: node.pos, end: node.end };
      }
    },
    findNodeWithIdentifier: function findNodeWithIdentifier(ast, root, query) {
      var path = void 0;
      traverse(root, {
        Identifier: function Identifier(node) {
          if (node.text === query.matcher) {
            if (!path) {
              path = node;
            }
          }
        }
      });
      var parent = path.parent;
      return parent;
    },
    findNodeWithString: function findNodeWithString(ast, root, query) {
      var path = void 0;
      traverse(root, {
        StringLiteral: function StringLiteral(node) {
          if (node.text === query.matcher) {
            if (!path) {
              path = node;
            }
          }
        }
      });
      var parent = path.parent;
      return parent;
    }
  };
}
module.exports = exports['default'];