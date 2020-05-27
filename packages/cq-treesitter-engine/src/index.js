const Parser = require("tree-sitter");
function getNodeName(node) {
  return node.constructor.name;
}
function isNode(node) {
  return node && node.type ? true : false;
}

function traverse(node, nodeCbs) {
  let nodeName = getNodeName(node);
  // console.log(" trav nodeName: ", nodeName, node.text); // KEY
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

  const nodeIterates = [
    ...(node.children ? node.children : []),
    ...(node.fields ? node.fields : [])
  ].filter((v) => v && isNode(v));

  for (let prop of nodeIterates) {
    if (Array.isArray(prop)) {
      prop.filter((v) => isNode(v)).map((v) => traverse(v, nodeCbs));
    } else if (isNode(prop)) {
      traverse(prop, nodeCbs);
    }
  }
}

function nodeToRange(node) {
  if (
    (node.startIndex || node.startIndex === 0) &&
    (node.endIndex || node.endIndex === 0)
  ) {
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
  let commentNodes = [];
  return {
    name: "treesitter",
    parse(code, opts = {}) {
      commentNodes = [];
      const parser = new Parser();

      let langModule;
      switch (opts.language) {
        case "javascript":
          const JavaScript = require("tree-sitter-javascript");
          langModule = JavaScript;
          break;
        case "typescript":
          const TypeScript = require("tree-sitter-typescript/typescript");
          langModule = TypeScript;
          break;
        case "tsx":
          const TSX = require("tree-sitter-typescript/tsx");
          langModule = TSX;
          break;
        case "python":
          const Python = require("tree-sitter-python");
          langModule = Python;
          break;
        case "rust":
          const Rust = require("tree-sitter-rust");
          langModule = Rust;
          break;
        case "go":
          const Go = require("tree-sitter-go");
          langModule = Go;
          break;

        default:
          langModule = JavaScript;
          break;
      }
      parser.setLanguage(langModule);

      const tree = parser.parse(code);
      if (engineOpts.debug) {
      }
      return tree;
    },
    getInitialRoot(ast) {
      return ast.rootNode;
    },
    findNodesWithIdentifier(ast, root, query) {
      let paths = [];
      traverse(root, {
        IdentifierNode: function (node) {
          if (node.text === query.matcher) {
            paths = [...paths, node.parent];
          }
        },
        TypeIdentifierNode: function (node) {
          if (node.text === query.matcher) {
            paths = [...paths, node.parent];
          }
        },
        PropertyIdentifierNode: function (node) {
          if (node.text === query.matcher) {
            paths = [...paths, node.parent];
          }
        },
        // python
        ExpressionListNode: function (node) {
          if (node.text === query.matcher) {
            paths = [...paths, node.parent];
          }
        },
        SyntaxNode: function (node) {
          if (
            // node.type === "property_identifier" &&
            node.text === query.matcher
          ) {
            paths = [...paths, node.parent];
          }
        },
        CommentNode: function (node) {
          commentNodes = [...commentNodes, node];
        }
      });
      return paths;
    },
    findNodesWithString(ast, root, query) {
      let paths = [];
      traverse(root, {
        StringNode: function (node) {
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
    commentRange(node, code, getLeading, getTrailing) {
      let { start, end } = nodeToRange(node);
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
        let commentsBefore = commentNodes.filter((commentNode) => {
          return commentNode.startIndex < end;
        });

        const sortedComments = commentsBefore
          .sort((a, b) => a.endIndex - b.endIndex)
          .reverse();
        // sortedComments is now in reverse order, closest back up the top of the document
        let commentBlock = [sortedComments[0]];
        let lastStart = sortedComments[0].startIndex;

        for (let i = 1; i < sortedComments.length; i++) {
          const nextComment = sortedComments[i];
          if (nextComment.endIndex === lastStart - 1) {
            commentBlock = [nextComment, ...commentBlock];
            lastStart = nextComment.startIndex;
          }
        }

        // sortedComments.map(comment => {
        //   console.log(comment.startIndex, comment.endIndex);
        // });

        // console.log("sortedComments: ", sortedComments);
        if (commentBlock.length > 0) {
          const firstComment = commentBlock[0];
          const lastComment = commentBlock[commentBlock.length - 1];
          start = Math.min(start, firstComment.startIndex);
          end = Math.max(end, lastComment.endIndex);
        }
      }

      // TODO trailing
      return { nodes: [node], start, end };
    },
    nodeToRange
  };
}

// ClassBodyNode
// MethodDefinitionNode
// PropertyIdentifierNode
