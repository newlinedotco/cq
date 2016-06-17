let babel = require("babel-core");
import traverse from 'babel-traverse';

export const NodeTypes = {
  IDENTIFIER: 'IDENTIFIER'
};

function getRange(node) {
  if(node.start && node.end) {
    return { start: node.start, end: node.end };
  }
  if(node.body && node.body.start && node.body.end) {
    return { start: node.body.start, end: node.body.end };
  }

  switch(node.type) {
  // case 'VariableDeclaration':
  // case 'Identifier':
  //   return { start: node.start, end: node.end };
  // case 'FunctionExpression':
  //   return { start: node.body.start, end: node.body.end };
  case 'ObjectProperty':
    return { start: getRange(node.key).start, end: getRange(node.value).end };
  default:
    console.log("unknown", node);
    throw new Error('getRange of unknown type: ' + node.type);
    break;
  }
}

function resolveIndividualQuery(ast, root, code, query, opts) {

  switch(query.type) {
  case NodeTypes.IDENTIFIER: 
    let nextRoot;
    let range;

    // if the identifier exists in the scope, this is the easiest way to fetch
    // it
    if(root.scope && root.scope.getBinding(query.matcher)) {


      let binding = root.scope.getBinding(query.matcher)

      // console.log('got the thing via scope', binding);

      // let parent = binding.path.parent;
      let parent = binding.path.node;

      range = getRange(parent);
      nextRoot = parent;
    } else {
      let path;
      traverse(ast, {
        Identifier: function (_path) {
          if(_path.node.name === query.matcher) {
            path = _path;
            _path.stop();
          }
        }
      });

      let parent = path.parent;
      range = getRange(parent);
      nextRoot = parent;
    }

    // we want to keep starting indentation, so search back to the previous
    // newline
    let start = range.start;
    while(start > 0 && code[start] !== '\n') {
      start--;
    }
    start++; // don't include the newline

    let end = range.end;
    // this is completely a hack b/c a node won't always incl the semicolon, 
    // todo revisit - this might be better by parsing a CST vs. AST
    if(code[end] === ';') end++;
   
    let codeSlice = code.substring(start, end);

    if(query.children) {
      return resolveListOfQueries(ast, nextRoot, code, query.children, opts);
    } else {
      return { code: codeSlice };
    }

    break;
  default:
    break;
  }

}

function getProgram(ast) {
  var path;

  traverse(ast, {
    Program: function (_path) {
      path = _path;
      _path.stop();
    }
  });
  return path;
}

function resolveListOfQueries(ast, root, code, query, opts) {
  return query.reduce((acc, q) => {
    let resolved = resolveIndividualQuery(ast, root, code, q, opts);
    // thought: maybe do something clever here like put in a comment ellipsis if
    // the queries aren't contiguous
    acc.code = acc.code + resolved.code;
    acc.nodes = [...acc.nodes, resolved.node];
    return acc;
  }, {
    code: '',
    nodes: []
  })
}

export default function cq(code, query, opts) {
  let result = babel.transform(code, opts.babel);
  let ast = result.ast;
  let program = getProgram(ast);

  return resolveListOfQueries(ast, program, code, query, opts);
}
