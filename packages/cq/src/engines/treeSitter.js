const Parser = require("tree-sitter");
const JavaScript = require("tree-sitter-javascript");

const ignoredProperties = new Set(["constructor", "parent"]);

function getNodeName(node) {
  return node.constructor.name;
  //   console.log("node: ", node);
  //   if (node.kind) {
  //     return ts.SyntaxKind[node.kind];
  //   }
}
function isNode(node) {
  //   console.log("node: ", node);
  return node && node.type ? true : false;
}

function traverse(node, nodeCbs) {
  let nodeName = getNodeName(node);
  //   console.log("nodeName: ", nodeName);
  if (nodeCbs.hasOwnProperty(nodeName)) {
    nodeCbs[nodeName](node);
  }

  //   console.log(
  //     "node: ",
  //     nodeName,
  //     node.text ? `"${node.text}"` : "",
  //     node,
  //     node.children ? node.children.length : null,
  //     node.fields
  //   );

  /*
  for (let idx in node.children) {
    const child = node.children[idx];
    // console.log("child: ", child);
    if (isNode(child)) {
      traverse(child, nodeCbs);
    }
  }
  */
  const nodeIterates = [
    ...(node.children ? node.children : []),
    ...(node.fields ? node.fields : [])
  ].filter(v => v && isNode(v));
  //   console.log("nodeIterates: ", nodeIterates);

  for (let prop of nodeIterates) {
    // const prop = node.children[idx];

    // console.log("prop: ", prop);
    // if (ignoredProperties.has(prop) || prop.charAt(0) === "_") {
    //   continue;
    // }

    if (Array.isArray(prop)) {
      prop.filter(v => isNode(v)).map(v => traverse(v, nodeCbs));
    } else if (isNode(prop)) {
      traverse(prop, nodeCbs);
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

export default function treeSitterEngine(engineOpts = {}) {
  return {
    parse(code, opts = {}) {
      const parser = new Parser();
      parser.setLanguage(JavaScript);

      const tree = parser.parse(code);
      //   console.log("tree: ", JSON.stringify(tree.rootNode, null, 2));
      return tree;
    },
    getInitialRoot(ast) {
      return ast.rootNode;
    },
    findNodesWithIdentifier(ast, root, query) {
      let paths = [];
      traverse(root, {
        IdentifierNode: function(node) {
          if (node.text === query.matcher) {
            paths = [...paths, node.parent];
          }
        },
        SyntaxNode: function(node) {
          if (
            node.type === "property_identifier" &&
            node.text === query.matcher
          ) {
            paths = [...paths, node.parent];
          }
        }
      });
      return paths;
    },
    findNodesWithString(ast, root, query) {
      let paths = [];
      traverse(root, {
        StringNode: function(node) {
          if (
            node.text === query.matcher ||
            node.text === `'${query.matcher}'` // hack? quote the matcher
          ) {
            paths = [...paths, node.parent];
          }
        }
      });
      return paths;
    },
    nodeToRange
  };
}
