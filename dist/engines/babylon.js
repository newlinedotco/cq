"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = babylonEngine;

var _babelTraverse = require("babel-traverse");

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * cq Babylon Engine
 *
 * Parse files with Babylon
 *
 */
var babylon = require("babylon");


var defaultBabylonConfig = {
  sourceType: "module",
  plugins: ['jsx', 'flow', 'asyncFunctions', 'classConstructorCall', 'doExpressions', 'trailingFunctionCommas', 'objectRestSpread', 'decorators', 'classProperties', 'exportExtensions', 'exponentiationOperator', 'asyncGenerators', 'functionBind', 'functionSent']
};

function babylonEngine() {
  var engineOpts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  return {
    parse: function parse(code) {
      var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var ast = babylon.parse(code, Object.assign({}, defaultBabylonConfig, opts));
      return ast;
    },
    getInitialRoot: function getInitialRoot(ast) {
      var path;
      (0, _babelTraverse2.default)(ast, {
        Program: function Program(_path) {
          path = _path;
          _path.stop();
        }
      });
      return path;
    },
    nodeToRange: function (_nodeToRange) {
      function nodeToRange(_x3) {
        return _nodeToRange.apply(this, arguments);
      }

      nodeToRange.toString = function () {
        return _nodeToRange.toString();
      };

      return nodeToRange;
    }(function (node) {
      if (node.start && node.end) {
        return { start: node.start, end: node.end };
      }
      if (node.body && node.body.start && node.body.end) {
        return { start: node.body.start, end: node.body.end };
      }

      switch (node.type) {
        case 'ObjectProperty':
          return {
            start: nodeToRange(node.key).start,
            end: nodeToRange(node.value).end
          };
        default:
          console.log("unknown", node);
          throw new Error('nodeToRange of unknown type: ' + node.type);
          break;
      }
    }),
    findNodeWithIdentifier: function findNodeWithIdentifier(ast, root, query) {
      var nextRoot = void 0;
      // if the identifier exists in the scope, this is the easiest way to fetch it
      if (root.scope && root.scope.getBinding(query.matcher)) {
        var binding = root.scope.getBinding(query.matcher);
        var parent = binding.path.node; // binding.path.parent ?
        nextRoot = parent;
      } else {
        (function () {
          var path = void 0;
          (0, _babelTraverse2.default)(root, { // <--- bug? should be root?
            Identifier: function Identifier(_path) {
              if (_path.node.name === query.matcher) {
                if (!path) {
                  path = _path;
                }
                _path.stop();
              }
            },
            noScope: true
          });

          var parent = path.parent;
          nextRoot = parent;
        })();
      }
      return nextRoot;
    },
    findNodeWithString: function findNodeWithString(ast, root, query) {
      var path = void 0;
      var scope = void 0;

      var traverseOpts = {
        Literal: function Literal(_path) {
          if (_path.node.value === query.matcher) {
            if (!path) {
              path = _path;
            }
            _path.stop();
          }
        }
      };

      if (!root.scope) {
        traverseOpts.noScope = true;
      }

      // todo, figure out this .node business
      (0, _babelTraverse2.default)(root.node, traverseOpts);
      if (!path) {
        (0, _babelTraverse2.default)(root, traverseOpts);
      }

      var parent = path.parent;
      return parent;
    }
  };
}
module.exports = exports["default"];