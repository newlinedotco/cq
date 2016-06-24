/**
 * cq Query Resolver
 *
 * This file takes input code and a parsed query and extracts portions of the
 * code based on that query
 *
 */
import traverse from 'babel-traverse';
import parser from './query-parser';

import babylonEngine from './engines/babylon';
import typescriptEngine from './engines/typescript';

export const NodeTypes = {
  IDENTIFIER: 'IDENTIFIER',
  RANGE: 'RANGE',
  LINE_NUMBER: 'LINE_NUMBER',
  EXTRA_LINES: 'EXTRA_LINES',
  STRING: 'STRING'
};

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

function resolveIndividualQuery(ast, root, code, query, engine, opts) {
  switch(query.type) {
  case NodeTypes.IDENTIFIER:
  case NodeTypes.STRING: {
    let nextRoot;

    switch(query.type) {
    case NodeTypes.IDENTIFIER:
      nextRoot = engine.findNodeWithIdentifier(ast, root, query);
      break;
    case NodeTypes.STRING:
      nextRoot = engine.findNodeWithString(ast, root, query);
      break;
    }

    let range = engine.nodeToRange(nextRoot);

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
      return resolveListOfQueries(ast, nextRoot, code, query.children, engine, opts);
    } else {
      return { code: codeSlice, start, end };
    }
  }
  case NodeTypes.RANGE: {
    let rangeStart = resolveIndividualQuery(ast, root, code, query.start, engine, opts);
    let rangeEnd = resolveIndividualQuery(ast, root, code, query.end, engine, opts);
    let start = rangeStart.start;
    let end = rangeEnd.end;
    if(query.modifiers) {
      ({start, end} = adjustRangeWithModifiers(code, query.modifiers, {start, end}));
    }
    let codeSlice = code.substring(start, end);
    return { code: codeSlice, start, end };
  }
  case NodeTypes.LINE_NUMBER: {

    // Parse special line numbers like EOF
    if(typeof query.value === 'string') {
      switch(query.value) {
      case 'EOF': 
        return { code: '', start: code.length, end: code.length };
        break;
      default:
        throw new Error(`Unknown LINE_NUMBER: ${query.value}`);
      }
    } else {
      // find the acutal line number
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

  }
  default:
    break;
  }

}

// given character index idx in code, returns the 1-indexed line number 
function lineNumberOfCharacterIndex(code, idx) {
  const everythingUpUntilTheIndex = code.substring(0, idx);
  // computer science!
  return everythingUpUntilTheIndex.split('\n').length;
}

function resolveListOfQueries(ast, root, code, query, engine, opts) {
  return query.reduce((acc, q) => {
    let resolved = resolveIndividualQuery(ast, root, code, q, engine, opts);
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

export default function cq(code, query, opts={}) {
  let engine = opts.engine || babylonEngine();

  if(typeof query === 'string') {
    query = [ parser.parse(query) ]; // parser returns single object for now, but eventually an array
  }

  if(typeof engine === 'string') {
    switch(engine) {
    case 'typescript':
      engine = typescriptEngine();
      break;
    case 'babylon':
      engine = babylonEngine();
      break;
    default:
      throw new Error('unknown engine: ' + engine);
    }
  }

  let ast = engine.parse(code, Object.assign({}, opts.parserOpts));
  let root = engine.getInitialRoot(ast);

  return resolveListOfQueries(ast, root, code, query, engine, opts);
}
