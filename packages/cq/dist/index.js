"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * cq Query Resolver
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * This file takes input code and a parsed query and extracts portions of the
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * code based on that query
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */


var cq = function () {
  var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(code, queries) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var engine, ast, root, results;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            engine = opts.engine || (0, _babylon2.default)();


            if (typeof queries === "string") {
              // parse into an array
              queries = _queryParser2.default.parse(queries);
            }

            if (!(typeof engine === "string")) {
              _context.next = 18;
              break;
            }

            _context.t0 = engine;
            _context.next = _context.t0 === "typescript" ? 6 : _context.t0 === "babylon" ? 8 : 10;
            break;

          case 6:
            engine = (0, _typescript2.default)();
            return _context.abrupt("break", 18);

          case 8:
            engine = (0, _babylon2.default)();
            return _context.abrupt("break", 18);

          case 10:
            _context.prev = 10;

            engine = require("cq-" + engine + "-engine");
            _context.next = 17;
            break;

          case 14:
            _context.prev = 14;
            _context.t1 = _context["catch"](10);
            throw new Error("unknown engine: " + engine);

          case 17:
            return _context.abrupt("break", 18);

          case 18:

            if (typeof engine === "function") {
              // then just use it
            }

            debug(code);
            _context.next = 22;
            return Promise.resolve(engine.parse(code, Object.assign({}, opts.parserOpts)));

          case 22:
            ast = _context.sent;

            // debug(JSON.stringify(ast, null, 2));

            root = engine.getInitialRoot(ast);
            results = resolveListOfQueries(ast, root, code, queries, engine, opts);


            if (opts.undent) {
              results.code = undent(results.code);
            }

            return _context.abrupt("return", results);

          case 27:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[10, 14]]);
  }));

  return function cq(_x2, _x3) {
    return _ref6.apply(this, arguments);
  };
}();

var _queryParser = require("./query-parser");

var _queryParser2 = _interopRequireDefault(_queryParser);

var _babylon = require("./engines/babylon");

var _babylon2 = _interopRequireDefault(_babylon);

var _typescript = require("./engines/typescript");

var _typescript2 = _interopRequireDefault(_typescript);

var _util = require("./engines/util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var debug = void 0;
if (process.browser) {
  debug = function debug() {
    var _console;

    return (_console = console).log.apply(_console, arguments);
  };
} else {
  var debugLib = require("debug");
  debug = debugLib("cq");
}

var NodeTypes = {
  IDENTIFIER: "IDENTIFIER",
  RANGE: "RANGE",
  LINE_NUMBER: "LINE_NUMBER",
  STRING: "STRING",
  CALL_EXPRESSION: "CALL_EXPRESSION"
};
cq.NodeTypes = NodeTypes;

var QueryResultTypes = {
  SELECTION_EXPRESSION: "SELECTION_EXPRESSION"
};

var whitespace = new Set([" ", "\n", "\t", "\r"]);

function nextNewlinePos(code, start) {
  var pos = start;
  while (pos < code.length && code[pos] !== "\n") {
    pos++;
  }
  return pos;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function movePositionByLines(code, numLines, position) {
  var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  if (numLines < 0) {
    var numPreviousLines = numLines * -1;
    position--;
    while (position > 0 && numPreviousLines > 0) {
      position--;
      if (code[position] === "\n") {
        numPreviousLines--;
      }
    }
    if (opts.trimNewline) position++; // don't include prior newline
  } else if (numLines > 0) {
    var numFollowingLines = numLines;
    position++;
    while (position < code.length && numFollowingLines > 0) {
      if (code[position] === "\n") {
        numFollowingLines--;
      }
      position++;
    }
    if (opts.trimNewline) position--; // don't include the last newline
  }

  return position;
}

function adjustRangeWithContext(code, linesBefore, linesAfter, _ref) {
  var start = _ref.start,
      end = _ref.end;

  if (linesBefore && linesBefore !== 0) {
    var trimNewline = linesBefore > 0 ? true : false;
    start = movePositionByLines(code, -1 * linesBefore, start, {
      trimNewline: trimNewline
    });
  }

  if (linesAfter && linesAfter !== 0) {
    var _trimNewline = linesAfter > 0 ? true : false;
    end = movePositionByLines(code, linesAfter, end, { trimNewline: _trimNewline });
  }

  return { start: start, end: end };
}

function adjustRangeWithWindow(code, startingLine, endingLine, _ref2) {
  var start = _ref2.start,
      end = _ref2.end,
      reverse = _ref2.reverse;

  if (reverse) {
    start = end;
    start = movePositionByLines(code, -1, start, { trimNewline: true });
  }

  var forward = !reverse;

  // start, end are the range for the whole node
  var originalStart = start;

  if (isNumeric(startingLine)) {
    var trimNewline = startingLine > 0 ? false : true;
    start = movePositionByLines(code, startingLine, start, { trimNewline: trimNewline });
  }

  if (forward && endingLine === 0) {
    end = nextNewlinePos(code, start);
    return { start: start, end: end };
  }

  if (isNumeric(endingLine)) {
    var _trimNewline2 = endingLine > 0 ? true : false;
    var eol = nextNewlinePos(code, originalStart);
    end = movePositionByLines(code, endingLine, eol /* <- notice */, {
      trimNewline: _trimNewline2
    });
  }

  return { start: start, end: end };
}

function adjustRangeForComments(ast, code, leading, trailing, engine, _ref3) {
  var start = _ref3.start,
      end = _ref3.end,
      nodes = _ref3.nodes;

  // this is going to be part of the engine

  nodes.map(function (node) {
    var commentRange = engine.commentRange(node, code, leading, trailing);
    start = commentRange.start ? Math.min(commentRange.start, start) : start;
    end = commentRange.end ? Math.max(commentRange.end, end) : end;
  });

  return { start: start, end: end, nodes: nodes };
}

function adjustRangeForDecorators(ast, code, leading, trailing, engine, _ref4) {
  var start = _ref4.start,
      end = _ref4.end,
      nodes = _ref4.nodes;

  nodes.map(function (node) {
    var decoratorsRange = (0, _util.rangeExtents)(node.decorators.map(function (d) {
      return engine.nodeToRange(d);
    }));
    start = decoratorsRange.start ? Math.min(decoratorsRange.start, start) : start;
    end = decoratorsRange.end ? Math.max(decoratorsRange.end, end) : end;
  });

  return { start: start, end: end, nodes: nodes };
}

function modifyAnswerWithCall(ast, code, callee, args, engine, _ref5) {
  var start = _ref5.start,
      end = _ref5.end,
      nodes = _ref5.nodes;

  switch (callee) {
    case "upto":
      start--;
      // trim all of the whitespace before. TODO could be to make this optional
      while (start > 0 && whitespace.has(code[start])) {
        start--;
      }
      start++;
      return { start: start, end: start };
      break;
    case "context":
      var _args = _slicedToArray(args, 2),
          linesBefore = _args[0],
          linesAfter = _args[1];

      return adjustRangeWithContext(code, linesBefore.value, linesAfter.value, {
        start: start,
        end: end
      });
      break;
    case "window":
      var _args2 = _slicedToArray(args, 3),
          startingLine = _args2[0],
          endingLine = _args2[1],
          reverse = _args2[2];

      return adjustRangeWithWindow(code, startingLine.value, endingLine.value, {
        start: start,
        end: end,
        reverse: reverse
      });
      break;
    case "firstLineOf":
      return adjustRangeWithWindow(code, 0, 0, {
        start: start,
        end: end,
        reverse: false
      });
      break;
    case "lastLineOf":
      return adjustRangeWithWindow(code, 0, 0, {
        start: start,
        end: end,
        reverse: true
      });
      break;
    case "comments":
      var leading = true,
          trailing = false;
      return adjustRangeForComments(ast, code, leading, trailing, engine, {
        start: start,
        end: end,
        nodes: nodes
      });
      break;
    case "decorators":
      return adjustRangeForDecorators(ast, code, leading, trailing, engine, {
        start: start,
        end: end,
        nodes: nodes
      });
    default:
      throw new Error("Unknown function call: " + callee);
  }
}

/*
 * Gets the range from a node and extends it to the preceeding and following
 * newlines
 */
function nodeToRangeLines(node, code, engine) {
  var range = engine.nodeToRange(node);

  // we want to keep starting indentation, so search back to the previous
  // newline
  var start = range.start;
  while (start > 0 && code[start] !== "\n") {
    start--;
  }
  if (code[start] === "\n") {
    start++; // don't include the newline
  }

  // we also want to read to the end of the line for the node we found
  var end = range.end;
  while (end < code.length && code[end] !== "\n") {
    end++;
  }

  return { start: start, end: end };
}

function resolveSearchedQueryWithNodes(ast, root, code, query, engine, nodes, opts) {
  var nextRoot = void 0;

  // nodeIdx doesn't apply until there are no children e.g. if the parent is
  // specifying a nodeIdx, the idea is to apply to the childmost node, so pick
  // zero in the case where we have a child and pass on the opt
  var nodeIdx = isNumeric(opts.nodeIdx) && !query.children ? opts.nodeIdx : 0;

  if (opts.after) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var nodeRange = engine.nodeToRange(node);
      if (nodeRange.start >= opts.after) {
        nextRoot = node;
        break;
      }
    }
  } else {
    nextRoot = nodes[nodeIdx];
  }

  if (!nextRoot) {
    var unknownQueryError = new Error("Cannot find node for query: " + query.matcher + " (match " + nodeIdx + ")");
    unknownQueryError.query = query;
    throw unknownQueryError;
  }

  if (query.children) {
    var resolvedChildren = void 0;
    var lastError = void 0;

    // search through all possible nodes for children that would result in a valid query
    for (var _i = 0; _i < nodes.length; _i++) {
      try {
        nextRoot = nodes[_i];
        resolvedChildren = resolveListOfQueries(ast, nextRoot, code, query.children, engine, opts);
        return resolvedChildren;
      } catch (e) {
        if (e.query) {
          // keep this error but try the next node, if we have one
          lastError = e;
        } else {
          // we don't recognize this error, throw it
          throw e;
        }
      }
    }
    throw lastError; // really couldn't find one
  } else {
    var _nodeToRangeLines = nodeToRangeLines(nextRoot, code, engine),
        start = _nodeToRangeLines.start,
        end = _nodeToRangeLines.end;

    var codeSlice = code.substring(start, end);
    return { code: codeSlice, nodes: [nextRoot], start: start, end: end };
  }
}

function resolveIndividualQuery(ast, root, code, query, engine, opts) {
  switch (query.type) {
    case NodeTypes.CALL_EXPRESSION:
      {
        var callee = query.callee;
        // for now, the first argument is always the inner selection

        var _query$arguments = _toArray(query.arguments),
            childQuery = _query$arguments[0],
            args = _query$arguments.slice(1);

        var handled = false;
        // some operators modify before the target query
        // e.g. after() actually has two queries
        // TODO clean this up to unify design with `modifyAnswerWithCall`. `handled` is icky
        switch (callee) {
          case "after":
            handled = true;

            var _args3 = _slicedToArray(args, 1),
                goalpostQuery = _args3[0];

            var goalpostNode = resolveIndividualQuery(ast, root, code, goalpostQuery, engine, opts);
            opts.after = goalpostNode.end;
            break;
          case "choose":
            handled = true;

            var _args4 = _slicedToArray(args, 1),
                nodeIdx = _args4[0];

            opts.nodeIdx = nodeIdx.value;
            break;
        }

        var answer = resolveIndividualQuery(ast, root, code, childQuery, engine, opts);

        // whatever the child answer is, now we modify it given our callee
        // TODO - modifying the asnwer needs to be given not only the answer start and end range, but the child node which returned that start and end
        if (!handled) {
          answer = modifyAnswerWithCall(ast, code, callee, args, engine, answer);
        }

        // hmm, maybe do this later in the pipeline?
        answer.code = code.substring(answer.start, answer.end);

        // get the rest of the parameters
        return answer;
      }
    case NodeTypes.IDENTIFIER:
    case NodeTypes.STRING:
      {
        var matchingNodes = void 0;

        switch (query.type) {
          case NodeTypes.IDENTIFIER:
            matchingNodes = engine.findNodesWithIdentifier(ast, root, query);
            break;
          case NodeTypes.STRING:
            matchingNodes = engine.findNodesWithString(ast, root, query);
            break;
        }

        return resolveSearchedQueryWithNodes(ast, root, code, query, engine, matchingNodes, opts);
      }
    case NodeTypes.RANGE:
      {
        var rangeStart = resolveIndividualQuery(ast, root, code, query.start, engine, opts);
        var start = rangeStart.start;
        var rangeEnd = resolveIndividualQuery(ast, root, code, query.end, engine, Object.assign({}, opts, { after: rangeStart.start }));
        var end = rangeEnd.end;
        var codeSlice = code.substring(start, end);
        var nodes = [].concat(_toConsumableArray(rangeStart.nodes || []), _toConsumableArray(rangeEnd.nodes || []));
        return { code: codeSlice, nodes: nodes, start: start, end: end };
      }
    case NodeTypes.LINE_NUMBER:
      {
        // Parse special line numbers like EOF
        if (typeof query.value === "string") {
          switch (query.value) {
            case "EOF":
              return { code: "", start: code.length, end: code.length };
              break;
            default:
              throw new Error("Unknown LINE_NUMBER: " + query.value);
          }
        } else {
          if (query.value === 0) {
            throw new Error("Line numbers start at 1, not 0");
          }

          // find the acutal line number
          var lines = code.split("\n");
          var line = lines[query.value - 1]; // one-indexed arguments to LINE_NUMBER

          // to get the starting index of this line...
          // we take the sum of all prior lines:
          var charIdx = lines.slice(0, query.value - 1).reduce(
          // + 1 b/c of the (now missing) newline
          function (sum, line) {
            return sum + line.length + 1;
          }, 0);

          var _start = charIdx;
          var _end = charIdx + line.length;
          var _codeSlice = code.substring(_start, _end);
          var _nodes = []; // TODO - find the node that applies to this line number
          return { code: _codeSlice, nodes: _nodes, start: _start, end: _end };
        }
      }
    default:
      break;
  }
}

// given code, removes the smallest indent from each line (e.g. nested code becomes less-indented to the least indented line)
function undent(code) {
  var lines = code.split("\n");
  var minIndent = Number.MAX_VALUE;

  // find min indent
  lines.forEach(function (line) {
    var startingSpaceMatch = line.match(/^\s*/);
    var indentLength = startingSpaceMatch[0].length;
    if (indentLength < minIndent) {
      minIndent = indentLength;
    }
  });

  // remove the indentation from each line
  return lines.map(function (line) {
    return line.substring(minIndent);
  }).join("\n");
}

// given character index idx in code, returns the 1-indexed line number
function lineNumberOfCharacterIndex(code, idx) {
  var everythingUpUntilTheIndex = code.substring(0, idx);
  // computer science!
  return everythingUpUntilTheIndex.split("\n").length;
}

function resolveListOfQueries(ast, root, code, query, engine, opts) {
  return query.reduce(function (acc, q) {
    var resolved = resolveIndividualQuery(ast, root, code, q, engine, opts);

    var resolvedStartLine = lineNumberOfCharacterIndex(code, resolved.start);
    var resolvedEndLine = lineNumberOfCharacterIndex(code, resolved.end);

    var oldStartLine = acc.start_line;
    var newStartLine = Math.min(acc.start_line, resolvedStartLine);

    var oldEndLine = acc.end_line;
    var newEndLine = Math.max(acc.end_line, resolvedEndLine);

    if (opts.gapFiller && acc.code.length > 0 && oldEndLine + 1 < resolvedStartLine // there's a gap
    ) {
        // TODO - something clever about the indentation of the gapFiller?
        acc.code = acc.code + opts.gapFiller + resolved.code;
        acc.disjoint = true;
      } else if (opts.gapFiller && acc.code.length > 0 && oldEndLine + 1 === resolvedStartLine // they're contiguous
    ) {
        acc.code = acc.code + "\n" + resolved.code;
      } else {
      acc.code = acc.code + resolved.code;
    }

    acc.nodes = [].concat(_toConsumableArray(acc.nodes), _toConsumableArray(resolved.nodes || []));
    acc.start = Math.min(acc.start, resolved.start);
    acc.end = Math.max(acc.end, resolved.end);
    acc.start_line = newStartLine;
    acc.end_line = newEndLine;

    return acc;
  }, {
    code: "",
    nodes: [],
    start: Number.MAX_VALUE,
    end: Number.MIN_VALUE,
    start_line: Number.MAX_VALUE,
    end_line: Number.MIN_VALUE,
    disjoint: false
  });
}

exports.default = cq;
module.exports = exports["default"];