let babel = require("babel-core");
import traverse from 'babel-traverse';

export const NodeTypes = {
  IDENTIFIER: 'IDENTIFIER',
  RANGE: 'RANGE',
  LINE_NUMBER: 'LINE_NUMBER',
  EXTRA_LINES: 'EXTRA_LINES'
};

function getNodeCodeRange(node) {
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
    return { start: getNodeCodeRange(node.key).start, end: getNodeCodeRange(node.value).end };
  default:
    console.log("unknown", node);
    throw new Error('getNodeCodeRange of unknown type: ' + node.type);
    break;
  }
}

function resolveIndividualQuery(ast, root, code, query, opts) {

  switch(query.type) {
  case NodeTypes.IDENTIFIER: {
    let nextRoot;
    let range;

    // if the identifier exists in the scope, this is the easiest way to fetch
    // it
    if(root.scope && root.scope.getBinding(query.matcher)) {


      let binding = root.scope.getBinding(query.matcher)

      // console.log('got the thing via scope', binding);

      // let parent = binding.path.parent;
      let parent = binding.path.node;

      range = getNodeCodeRange(parent);
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
      range = getNodeCodeRange(parent);
      nextRoot = parent;
    }

    // we want to keep starting indentation, so search back to the previous
    // newline
    let start = range.start;
    while(start > 0 && code[start] !== '\n') {
      start--;
    }
    start++; // don't include the newline

    // we also want to read to the end of the line for the node we found
    let end = range.end;
    while(end < code.length && code[end] !== '\n') {
      end++;
    }

    if(query.modifiers) {
      // get any extra lines, if requested
      let numPreviousLines = 0;
      let numFollowingLines = 0;
      let hasPreviousLines = false;
      let hasFollowingLines = false;;

      query.modifiers.forEach((modifier) => {
        if(modifier.type == NodeTypes.EXTRA_LINES) {
          if(modifier.amount < 0) {
            numPreviousLines = (modifier.amount * -1);
            hasPreviousLines = true;
          }
          if(modifier.amount > 0) {
            numFollowingLines = modifier.amount + 1;
            hasFollowingLines = true;
          }
        }
      })

      if(hasPreviousLines) {
        while(start > 0 && numPreviousLines >= 0) {
          start--;
          if(code[start] === '\n') {
            numPreviousLines--;
          }
        }
        start++; // don't include prior newline
      }

      if(hasFollowingLines) {
        while(end < code.length && numFollowingLines > 0) {
          if(code[end] === '\n') {
            numFollowingLines--;
          }
          end++;
        }
        end--; // don't include the last newline
      }

    }

    let codeSlice = code.substring(start, end);

    if(query.children) {
      return resolveListOfQueries(ast, nextRoot, code, query.children, opts);
    } else {
      return { code: codeSlice, start, end };
    }
  }
  case NodeTypes.RANGE: {
    let rangeStart = resolveIndividualQuery(ast, root, code, query.start, opts);
    let rangeEnd = resolveIndividualQuery(ast, root, code, query.end, opts);
    let codeSlice = code.substring(rangeStart.start, rangeEnd.end);
    return { code: codeSlice, start: rangeStart.start, end: rangeEnd.end };
  }
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
