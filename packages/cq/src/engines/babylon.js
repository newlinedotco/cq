/**
 * cq Babylon Engine
 *
 * Parse files with Babylon
 *
 */
// let babylon = require("babylon");
import * as babylon from "babylon";
import { rangeExtents } from "./util";

const defaultBabylonConfig = {
  sourceType: "module",
  plugins: [
    "jsx",
    "flow",
    "asyncFunctions",
    "classConstructorCall",
    "doExpressions",
    "trailingFunctionCommas",
    "objectRestSpread",
    "decorators",
    "classProperties",
    "exportExtensions",
    "exponentiationOperator",
    "asyncGenerators",
    "functionBind",
    "functionSent"
  ]
};

/*
 * TODO
 *   * remove babel-traverse
 *   * figure out if we should unify `traverse` w/ typescript's
 */

const ignoredProperties = new Set(["constructor", "parent"]);

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
    nodeCbs[nodeName](node);
  }

  for (let prop in node) {
    if (ignoredProperties.has(prop) || prop.charAt(0) === "_") {
      continue;
    }

    let propValue = node[prop];

    if (Array.isArray(propValue)) {
      propValue
        .filter((v) => isNode(v))
        .map((v) => {
          v.parent = node;
          return v;
        })
        .map((v) => traverse(v, nodeCbs));
    } else if (isNode(propValue)) {
      propValue.parent = node;
      traverse(propValue, nodeCbs);
    }
  }
}

function nodeToRange(node) {
  if ((node.start || node.start === 0) && (node.end || node.end === 0)) {
    return { start: node.start, end: node.end };
  }
  if (
    node.body &&
    (node.body.start || node.body.start === 0) &&
    (node.body.end || node.body.end === 0)
  ) {
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
}

export default function babylonEngine(engineOpts = {}) {
  return {
    name: "babylon",
    parse(code, opts = {}) {
      let ast = babylon.parse(
        code,
        Object.assign({}, defaultBabylonConfig, opts)
      );
      return ast;
    },
    getInitialRoot(ast) {
      return ast.program;
    },
    nodeToRange,
    commentRange(node, code, getLeading, getTrailing) {
      let start = node.start;
      let end = node.end;
      if (getLeading && node.leadingComments) {
        let commentRange = rangeExtents(
          node.leadingComments.map((n) => nodeToRange(n))
        );
        start = Math.min(start, commentRange.start);
      }
      if (getTrailing && node.trailingComments) {
        let commentRange = rangeExtents(
          node.trailingComments.map((n) => nodeToRange(n))
        );
        end = Math.max(end, commentRange.end);
      }
      return { nodes: [node], start, end };
    },
    findNodesWithIdentifier(ast, root, query) {
      let paths = [];
      const nodeCb = (node) => {
        if (node.name === query.matcher) {
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
          if (node.value === query.matcher) {
            paths = [...paths, node.parent];
          }
        }
      });
      return paths;
    }
  };
}
