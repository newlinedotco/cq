/**
 * cq Query Resolver
 *
 * This file takes input code and a parsed query and extracts portions of the
 * code based on that query
 *
 */
let babylon = require("babylon");
import traverse from 'babel-traverse';
import parser from './query-parser';

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
  case 'ObjectProperty':
    return { start: getNodeCodeRange(node.key).start, end: getNodeCodeRange(node.value).end };
  default:
    console.log("unknown", node);
    throw new Error('getNodeCodeRange of unknown type: ' + node.type);
    break;
  }
}

function adjustRangeWithModifiers(code, modifiers, {start, end}) {
  // get any extra lines, if requested
  let numPreviousLines = 0;
  let numFollowingLines = 0;
  let hasPreviousLines = false;
  let hasFollowingLines = false;;

  modifiers.forEach((modifier) => {
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

  return {start, end};
}

function resolveIndividualQuery(ast, root, code, query, opts) {

  switch(query.type) {
  case NodeTypes.IDENTIFIER: {
    let nextRoot;
    let range;

    // if the identifier exists in the scope, this is the easiest way to fetch it
    if(root.scope && root.scope.getBinding(query.matcher)) {
      let binding = root.scope.getBinding(query.matcher)
      let parent = binding.path.node; // binding.path.parent ?

      range = getNodeCodeRange(parent);
      nextRoot = parent;
    } else {
      let path;
      traverse(ast, {
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
      ({start, end} = adjustRangeWithModifiers(code, query.modifiers, {start, end}));
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
    let start = rangeStart.start;
    let end = rangeEnd.end;
    if(query.modifiers) {
      ({start, end} = adjustRangeWithModifiers(code, query.modifiers, {start, end}));
    }
    let codeSlice = code.substring(start, end);
    return { code: codeSlice, start, end };
  }
  case NodeTypes.LINE_NUMBER: {
    let lines = code.split('\n');
    let line = lines[query.value - 1]; // one-indexed arguments to LINE_NUMBER 

    // to get the starting index of this line...
    // we take the sum of all prior lines:
    let charIdx = lines.slice(0, query.value - 1).reduce(
      // + 1 b/c of the (now missing) newline
      (sum, line) => (sum + line.length + 1), 0);

    let start = charIdx;
    let end = charIdx + line.length;
    let codeSlice = code.substring(start, end);
    return { code: codeSlice, start, end };
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

// given character index idx in code, returns the 1-indexed line number 
function lineNumberOfCharacterIndex(code, idx) {
  const everythingUpUntilTheIndex = code.substring(0, idx);
  // computer science!
  return everythingUpUntilTheIndex.split('\n').length;
}

function resolveListOfQueries(ast, root, code, query, opts) {
  return query.reduce((acc, q) => {
    let resolved = resolveIndividualQuery(ast, root, code, q, opts);
    // thought: maybe do something clever here like put in a comment ellipsis if
    // the queries aren't contiguous
    acc.code = acc.code + resolved.code;
    acc.nodes = [...acc.nodes, resolved.node];
    acc.start = Math.min(acc.start, resolved.start);
    acc.end = Math.max(acc.end, resolved.end);
    acc.start_line = Math.min(acc.start_line, lineNumberOfCharacterIndex(code, resolved.start));
    acc.end_line = Math.max(acc.end_line, lineNumberOfCharacterIndex(code, resolved.end));
    return acc;
  }, {
    code: '',
    nodes: [],
    start: Number.MAX_VALUE,
    end: Number.MIN_VALUE,
    start_line: Number.MAX_VALUE,
    end_line: Number.MIN_VALUE
  })
}

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

export default function cq(code, query, opts={}) {
  let ast = babylon.parse(code, Object.assign({}, defaultBabylonConfig, opts.parserOpts));
  let program = getProgram(ast);
  if(typeof query === 'string') {
    query = [ parser.parse(query) ]; // parser returns single object for now, but eventually an array
  }
  return resolveListOfQueries(ast, program, code, query, opts);
}
