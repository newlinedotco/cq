/**
 * cq TypeScript Engine
 *
 * Parse files with TypeScript
 *
 * Thanks to astexplorer for some of this code
 * see: https://github.com/fkling/astexplorer/tree/master/src/parsers/js/typescript.js#L128
 */
import 'babel-polyfill'
import * as ts from "typescript";
import { rangeExtents } from './util';

const ignoredProperties = new Set([
  'constructor',
  'parent'
]);

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
    (nodeCbs[nodeName])(node);
  };

  for (let prop in node) {
    if (ignoredProperties.has(prop) || prop.charAt(0) === '_') {
      continue;
    }

    let propValue = node[prop];

    if (Array.isArray(propValue)) {
      propValue.filter(v => isNode(v))
        .map(v => traverse(v, nodeCbs))
    } else if (isNode(propValue)) {
      traverse(propValue, nodeCbs);
    }
  }
}

function nodeToRange(node) {
  if (typeof node.getStart === 'function' &&
      typeof node.getEnd === 'function') {
    return {start: node.getStart(), end: node.getEnd()};
  } else if (typeof node.pos !== 'undefined' &&
             typeof node.end !== 'undefined') {
    return {start: node.pos, end: node.end};
  }
}

export default function typescriptEngine(engineOpts={}) {
  return {
    parse(code, opts={}) {
      return ts.createSourceFile(opts.filename || '(no filename)', code, ts.ScriptTarget.Latest, true);
    },
    getInitialRoot(ast) {
      return ast;
    },
    nodeToRange,
    commentRange(node, code, getLeading, getTrailing) {
      let {start,end} = nodeToRange(node);

      if(getLeading) {
        let nodePos = node.pos;
        let parentPos = node.parent.pos;
        let comments = ts.getLeadingCommentRanges(code, nodePos);
        let commentRanges = comments.map(c => ({start: c.pos, end: c.end}))
        let commentRange = rangeExtents(commentRanges);
        start = Math.min(start, commentRange.start);
      }
      // TODO trailing

      return {nodes: [node], start, end};
    },
    findNodeWithIdentifier(ast, root, query) {
      let path;
      traverse(root, {
        Identifier: function (node) {
          if(node.text === query.matcher) {
            if(!path) {
              path = node;
            }
          }
        }
      });
      let parent = path.parent;
      return parent;
    },
    findNodeWithString(ast, root, query) {
      let path;
      traverse(root, {
        StringLiteral: function (node) {
          if(node.text === query.matcher) {
            if(!path) {
              path = node;
            }
          }
        }
      });
      let parent = path.parent;
      return parent;
    }
  }
}
