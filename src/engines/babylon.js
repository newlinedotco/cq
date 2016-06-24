/**
 * cq Babylon Engine
 *
 * Parse files with Babylon
 *
 */
let babylon = require("babylon");
import traverse from 'babel-traverse';

const defaultBabylonConfig = {
  sourceType: "module",
  plugins: [
    'jsx',
    'flow',
    'asyncFunctions',
    'classConstructorCall',
    'doExpressions',
    'trailingFunctionCommas',
    'objectRestSpread',
    'decorators',
    'classProperties',
    'exportExtensions',
    'exponentiationOperator',
    'asyncGenerators',
    'functionBind',
    'functionSent'
  ]
};

export default function babylonEngine(engineOpts={}) {
  return {
    parse(code, opts={}) {
      let ast = babylon.parse(code, Object.assign({}, defaultBabylonConfig, opts));
      return ast;
    },
    getInitialRoot(ast) {
      var path;
      traverse(ast, {
        Program: function (_path) {
          path = _path;
          _path.stop();
        }
      });
      return path;
    },
    nodeToRange(node) {
      if(node.start && node.end) {
        return { start: node.start, end: node.end };
      }
      if(node.body && node.body.start && node.body.end) {
        return { start: node.body.start, end: node.body.end };
      }

      switch(node.type) {
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
    },
    findNodeWithIdentifier(ast, root, query) {
      let nextRoot;
      // if the identifier exists in the scope, this is the easiest way to fetch it
      if(root.scope && root.scope.getBinding(query.matcher)) {
        let binding = root.scope.getBinding(query.matcher)
        let parent = binding.path.node; // binding.path.parent ?
        nextRoot = parent;
      } else {
        let path;
        traverse(ast, { // <--- bug? should be root?
          Identifier: function (_path) {
            if(_path.node.name === query.matcher) {
              if(!path) {
                path = _path;
              }
              _path.stop();
            }
          }
        });

        let parent = path.parent;
        nextRoot = parent;
      }
      return nextRoot;
    },
    findNodeWithString(ast, root, query) {
      let path;
      traverse(ast, { // <--- bug? should be root?
        Literal: function (_path) {
          if(_path.node.value === query.matcher) {
            if(!path) {
              path = _path;
            }
            _path.stop();
          }
        }
      });

      let parent = path.parent;
      return parent;
    }
  }
}
