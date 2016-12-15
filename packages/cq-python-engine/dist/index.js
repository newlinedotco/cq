'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pythonEngine;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _util3 = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * cq Python Engine
 *
 * Parse files with Python
 *
 */
var babylon = require("babylon");


var ignoredProperties = new Set(['constructor', 'parent']);

function getNodeName(node) {
  if (node.type) {
    return node.type;
  }
}

function isNode(node) {
  return node && node.type ? true : false;
}

function traverse(node, nodeCbs) {
  // console.log();
  // console.log('node', node.type, util.inspect(node));

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
        v.parent = node;return v;
      }).map(function (v) {
        return traverse(v, nodeCbs);
      });
    } else if (isNode(propValue)) {
      propValue.parent = node;
      traverse(propValue, nodeCbs);
    }
  }
}

function nodeToRange(node) {
  if (_lodash2.default.isNumber(node.start) && _lodash2.default.isNumber(node.end)) {
    return { start: node.start, end: node.end };
  }

  if (node.body && _lodash2.default.isNumber(node.body.start) && _lodash2.default.isNumber(node.body.end)) {
    return { start: node.body.start, end: node.body.end };
  }

  switch (node.type) {
    // case 'ObjectProperty':
    //   return { 
    //     start: nodeToRange(node.key).start, 
    //     end: nodeToRange(node.value).end 
    //   };
    default:
      console.log("unknown", node);
      throw new Error('nodeToRange of unknown type: ' + node.type);
      break;
  }
}

function pythonEngine() {
  var engineOpts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return {
    parse: function parse(code) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return (0, _util3.spawnParseCmd)(code, opts).then(function (_ref) {
        var code = _ref.code,
            output = _ref.output;
        return { code: code, output: JSON.parse(output) };
      });
    },
    getInitialRoot: function getInitialRoot(ast) {
      return ast.output;
    },

    nodeToRange: nodeToRange,
    commentRange: function commentRange(node, code, getLeading, getTrailing) {
      var start = node.start;
      var end = node.end;
      if (getLeading && node.leadingComments) {
        var commentRange = (0, _util3.rangeExtents)(node.leadingComments.map(function (n) {
          return nodeToRange(n);
        }));
        start = Math.min(start, commentRange.start);
      }
      if (getTrailing && node.trailingComments) {
        var _commentRange = (0, _util3.rangeExtents)(node.trailingComments.map(function (n) {
          return nodeToRange(n);
        }));
        end = Math.max(end, _commentRange.end);
      }
      return { nodes: [node], start: start, end: end };
    },
    findNodesWithIdentifier: function findNodesWithIdentifier(ast, root, query) {
      var paths = [];

      var nodeCb = function nodeCb(node) {
        if (node.name === query.matcher) {
          paths = [].concat(_toConsumableArray(paths), [node]);
        }
      };

      var parentCb = function parentCb(node) {
        if (node.name === query.matcher || node.id === query.matcher) {
          paths = [].concat(_toConsumableArray(paths), [node.parent]);
        }
      };

      var traverseCbs = {
        // types which match the node themselves
        'FunctionDef': nodeCb,
        'ClassDef': nodeCb,

        // types which should return the parent
        'Name': parentCb,
        'alias': parentCb
      };

      traverse(root, traverseCbs);
      return paths;
    },
    findNodesWithString: function findNodesWithString(ast, root, query) {
      var paths = [];

      var parentCb = function parentCb(node) {
        if (node.s === query.matcher) {
          paths = [].concat(_toConsumableArray(paths), [node.parent]);
        }
      };

      var traverseCbs = {
        'Str': parentCb
      };

      traverse(root, traverseCbs);
      return paths;
    }
  };
}
module.exports = exports['default'];