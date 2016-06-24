'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NodeTypes = undefined;
exports.default = cq;

var _babelTraverse = require('babel-traverse');

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

var _queryParser = require('./query-parser');

var _queryParser2 = _interopRequireDefault(_queryParser);

var _babylon = require('./engines/babylon');

var _babylon2 = _interopRequireDefault(_babylon);

var _typescript = require('./engines/typescript');

var _typescript2 = _interopRequireDefault(_typescript);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /**
                                                                                                                                                                                                     * cq Query Resolver
                                                                                                                                                                                                     *
                                                                                                                                                                                                     * This file takes input code and a parsed query and extracts portions of the
                                                                                                                                                                                                     * code based on that query
                                                                                                                                                                                                     *
                                                                                                                                                                                                     */


var NodeTypes = exports.NodeTypes = {
  IDENTIFIER: 'IDENTIFIER',
  RANGE: 'RANGE',
  LINE_NUMBER: 'LINE_NUMBER',
  EXTRA_LINES: 'EXTRA_LINES'
};

function adjustRangeWithModifiers(code, modifiers, _ref) {
  var start = _ref.start;
  var end = _ref.end;

  // get any extra lines, if requested
  var numPreviousLines = 0;
  var numFollowingLines = 0;
  var hasPreviousLines = false;
  var hasFollowingLines = false;;

  modifiers.forEach(function (modifier) {
    if (modifier.type == NodeTypes.EXTRA_LINES) {
      if (modifier.amount < 0) {
        numPreviousLines = modifier.amount * -1;
        hasPreviousLines = true;
      }
      if (modifier.amount > 0) {
        numFollowingLines = modifier.amount + 1;
        hasFollowingLines = true;
      }
    }
  });

  if (hasPreviousLines) {
    while (start > 0 && numPreviousLines >= 0) {
      start--;
      if (code[start] === '\n') {
        numPreviousLines--;
      }
    }
    start++; // don't include prior newline
  }

  if (hasFollowingLines) {
    while (end < code.length && numFollowingLines > 0) {
      if (code[end] === '\n') {
        numFollowingLines--;
      }
      end++;
    }
    end--; // don't include the last newline
  }

  return { start: start, end: end };
}

function resolveIndividualQuery(ast, root, code, query, engine, opts) {
  switch (query.type) {
    case NodeTypes.IDENTIFIER:
      {
        var nextRoot = engine.findNodeWithIdentifier(ast, root, query);
        var range = engine.nodeToRange(nextRoot);

        // we want to keep starting indentation, so search back to the previous
        // newline
        var start = range.start;
        while (start > 0 && code[start] !== '\n') {
          start--;
        }
        start++; // don't include the newline

        // we also want to read to the end of the line for the node we found
        var end = range.end;
        while (end < code.length && code[end] !== '\n') {
          end++;
        }

        if (query.modifiers) {
          var _adjustRangeWithModif = adjustRangeWithModifiers(code, query.modifiers, { start: start, end: end });

          start = _adjustRangeWithModif.start;
          end = _adjustRangeWithModif.end;
        }

        var codeSlice = code.substring(start, end);

        if (query.children) {
          return resolveListOfQueries(ast, nextRoot, code, query.children, engine, opts);
        } else {
          return { code: codeSlice, start: start, end: end };
        }
      }
    case NodeTypes.RANGE:
      {
        var rangeStart = resolveIndividualQuery(ast, root, code, query.start, engine, opts);
        var rangeEnd = resolveIndividualQuery(ast, root, code, query.end, engine, opts);
        var _start = rangeStart.start;
        var _end = rangeEnd.end;
        if (query.modifiers) {
          var _adjustRangeWithModif2 = adjustRangeWithModifiers(code, query.modifiers, { start: _start, end: _end });

          _start = _adjustRangeWithModif2.start;
          _end = _adjustRangeWithModif2.end;
        }
        var _codeSlice = code.substring(_start, _end);
        return { code: _codeSlice, start: _start, end: _end };
      }
    case NodeTypes.LINE_NUMBER:
      {
        var lines = code.split('\n');
        var line = lines[query.value - 1]; // one-indexed arguments to LINE_NUMBER

        // to get the starting index of this line...
        // we take the sum of all prior lines:
        var charIdx = lines.slice(0, query.value - 1).reduce(
        // + 1 b/c of the (now missing) newline
        function (sum, line) {
          return sum + line.length + 1;
        }, 0);

        var _start2 = charIdx;
        var _end2 = charIdx + line.length;
        var _codeSlice2 = code.substring(_start2, _end2);
        return { code: _codeSlice2, start: _start2, end: _end2 };
      }
    default:
      break;
  }
}

// given character index idx in code, returns the 1-indexed line number
function lineNumberOfCharacterIndex(code, idx) {
  var everythingUpUntilTheIndex = code.substring(0, idx);
  // computer science!
  return everythingUpUntilTheIndex.split('\n').length;
}

function resolveListOfQueries(ast, root, code, query, engine, opts) {
  return query.reduce(function (acc, q) {
    var resolved = resolveIndividualQuery(ast, root, code, q, engine, opts);
    // thought: maybe do something clever here like put in a comment ellipsis if
    // the queries aren't contiguous
    acc.code = acc.code + resolved.code;
    acc.nodes = [].concat(_toConsumableArray(acc.nodes), [resolved.node]);
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
  });
}

function cq(code, query) {
  var opts = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  var engine = opts.engine || (0, _babylon2.default)();

  if (typeof query === 'string') {
    query = [_queryParser2.default.parse(query)]; // parser returns single object for now, but eventually an array
  }

  if (typeof engine === 'string') {
    switch (engine) {
      case 'typescript':
        engine = (0, _typescript2.default)();
        break;
      case 'babylon':
        engine = (0, _babylon2.default)();
        break;
      default:
        throw new Error('unknown engine: ' + engine);
    }
  }

  var ast = engine.parse(code, Object.assign({}, opts.parserOpts));
  var root = engine.getInitialRoot(ast);

  return resolveListOfQueries(ast, root, code, query, engine, opts);
}