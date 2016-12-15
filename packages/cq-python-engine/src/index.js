/**
 * cq Python Engine
 *
 * Parse files with Python
 *
 */
let babylon = require("babylon");
import { rangeExtents } from './util';

// const defaultBabylonConfig = {
//   sourceType: "module",
//   plugins: [
//     // ...
//   ]
// };

const ignoredProperties = new Set([
  'constructor',
  'parent'
]);

function getNodeName(node) {
  if (node.type) {
    return node.type;
  }
}

function isNode(node) {
  return node && node.type ? true : false;
}

function traverse(node, nodeCbs) {
  let nodeName = getNodeName(node);

  if (nodeCbs.hasOwnProperty(nodeName)) {
    (nodeCbs[nodeName])(node);
  };

  for (let prop in node) {
    if (ignoredProperties.has(prop) || prop.charAt(0) === '_') {
      continue;
    }

    let propValue = node[prop];

    if (Array.isArray(propValue)) {
      propValue.filter(v => isNode(v))
        .map(v => { v.parent = node; return v; })
        .map(v => traverse(v, nodeCbs))
    } else if (isNode(propValue)) {
      propValue.parent = node;
      traverse(propValue, nodeCbs);
    }
  }
}

function nodeToRange(node) {
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
}

export default function pythonEngine(engineOpts={}) {
  return {
    parse(code, opts={}) {
      // let AST =
      // shell out to: 
      //     /python-to-ast.py —input somefile.py —json
      //     then parse string of python code
      //      into node AST
      // 
      // let ast = babylon.parse(code, Object.assign({}, defaultBabylonConfig, opts));
      // return ast;
    },
    getInitialRoot(ast) {
      return ast.program
    },
    nodeToRange,
    commentRange(node, code, getLeading, getTrailing) {
      let start = node.start;
      let end = node.end;
      if (getLeading && node.leadingComments) {
        let commentRange = rangeExtents(node.leadingComments.map(n => nodeToRange(n)));
        start = Math.min(start, commentRange.start);
      } 
      if (getTrailing && node.trailingComments) {
        let commentRange = rangeExtents(node.trailingComments.map(n => nodeToRange(n)));
        end = Math.max(end, commentRange.end);
      } 
      return {nodes: [node], start, end};
    },
    findNodesWithIdentifier(ast, root, query) {
      let paths = [];
      const nodeCb = (node) => {
        if(node.name === query.matcher) {
          paths = [...paths, node.parent];
        }
      };
      traverse(root, {
        Identifier: nodeCb,
        JSXIdentifier: nodeCb
      });
      return paths;
    },
    findNodesWithString(ast, root, query) {
      let paths = [];
      traverse(root, {
        StringLiteral: function (node) {
          if(node.value === query.matcher) {
            paths = [...paths, node.parent];
          }
        }
      });
      return paths;
    }
  }
}
