/**
 * cq Query Resolver
 *
 * This file takes input code and a parsed query and extracts portions of the
 * code based on that query
 *
 */
import parser from "./query-parser";

import "babel-polyfill";
import "regenerator-runtime";
import babylonEngine from "./engines/babylon";
import typescriptEngine from "./engines/typescript";
import { rangeExtents } from "./engines/util";

let debug;
if (process.browser) {
  debug = (...args) => console.log(...args);
} else {
  const debugLib = require("debug");
  debug = debugLib("cq");
}

const NodeTypes = {
  IDENTIFIER: "IDENTIFIER",
  RANGE: "RANGE",
  LINE_NUMBER: "LINE_NUMBER",
  STRING: "STRING",
  CALL_EXPRESSION: "CALL_EXPRESSION"
};
cq.NodeTypes = NodeTypes;

const QueryResultTypes = {
  SELECTION_EXPRESSION: "SELECTION_EXPRESSION"
};

const whitespace = new Set([" ", "\n", "\t", "\r"]);

function nextNewlinePos(code, start) {
  let pos = start;
  while (pos < code.length && code[pos] !== "\n") {
    pos++;
  }
  return pos;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function movePositionByLines(code, numLines, position, opts = {}) {
  if (numLines < 0) {
    let numPreviousLines = numLines * -1;
    position--;
    while (position > 0 && numPreviousLines > 0) {
      position--;
      if (code[position] === "\n") {
        numPreviousLines--;
      }
    }
    if (opts.trimNewline) position++; // don't include prior newline
  } else if (numLines > 0) {
    let numFollowingLines = numLines;
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

function adjustRangeWithContext(code, linesBefore, linesAfter, { start, end }) {
  if (linesBefore && linesBefore !== 0) {
    let trimNewline = linesBefore > 0 ? true : false;
    start = movePositionByLines(code, -1 * linesBefore, start, {
      trimNewline
    });
  }

  if (linesAfter && linesAfter !== 0) {
    let trimNewline = linesAfter > 0 ? true : false;
    end = movePositionByLines(code, linesAfter, end, { trimNewline });
  }

  return { start, end };
}

function adjustRangeWithWindow(
  code,
  startingLine,
  endingLine,
  { start, end, reverse }
) {
  if (reverse) {
    start = end;
    start = movePositionByLines(code, -1, start, { trimNewline: true });
  }

  const forward = !reverse;

  // start, end are the range for the whole node
  let originalStart = start;

  if (isNumeric(startingLine)) {
    let trimNewline = startingLine > 0 ? false : true;
    start = movePositionByLines(code, startingLine, start, { trimNewline });
  }

  if (forward && endingLine === 0) {
    end = nextNewlinePos(code, start);
    return { start, end };
  }

  if (isNumeric(endingLine)) {
    let trimNewline = endingLine > 0 ? true : false;
    let eol = nextNewlinePos(code, originalStart);
    end = movePositionByLines(code, endingLine, eol /* <- notice */, {
      trimNewline
    });
  }

  return { start, end };
}

function adjustRangeForComments(
  ast,
  code,
  leading,
  trailing,
  engine,
  { start, end, nodes }
) {
  // this is going to be part of the engine

  nodes.map((node) => {
    let commentRange = engine.commentRange(node, code, leading, trailing);
    start = commentRange.start ? Math.min(commentRange.start, start) : start;
    end = commentRange.end ? Math.max(commentRange.end, end) : end;
  });

  return { start, end, nodes };
}

function adjustRangeForDecorators(
  ast,
  code,
  leading,
  trailing,
  engine,
  { start, end, nodes }
) {
  nodes.map((node) => {
    let decoratorsRange = rangeExtents(
      (node.decorators || []).map((d) => engine.nodeToRange(d))
    );
    start = decoratorsRange.start
      ? Math.min(decoratorsRange.start, start)
      : start;
    end = decoratorsRange.end ? Math.max(decoratorsRange.end, end) : end;
  });

  return { start, end, nodes };
}

function modifyAnswerWithCall(
  ast,
  code,
  callee,
  args,
  engine,
  { start, end, nodes }
) {
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
      let [linesBefore, linesAfter] = args;
      return adjustRangeWithContext(code, linesBefore.value, linesAfter.value, {
        start,
        end
      });
      break;
    case "window":
      let [startingLine, endingLine, reverse] = args;
      return adjustRangeWithWindow(code, startingLine.value, endingLine.value, {
        start,
        end,
        reverse
      });
      break;
    case "firstLineOf":
      return adjustRangeWithWindow(code, 0, 0, {
        start,
        end,
        reverse: false
      });
      break;
    case "lastLineOf":
      return adjustRangeWithWindow(code, 0, 0, {
        start,
        end,
        reverse: true
      });
      break;
    case "comments":
      let leading = true,
        trailing = false;
      return adjustRangeForComments(ast, code, leading, trailing, engine, {
        start,
        end,
        nodes
      });
      break;
    case "decorators":
      return adjustRangeForDecorators(ast, code, leading, trailing, engine, {
        start,
        end,
        nodes
      });
    default:
      throw new Error(`Unknown function call: ${callee}`);
  }
}

/*
 * Gets the range from a node and extends it to the preceeding and following
 * newlines
 */
function nodeToRangeLines(node, code, engine) {
  let range = engine.nodeToRange(node);

  // we want to keep starting indentation, so search back to the previous
  // newline
  let start = range.start;
  while (start > 0 && code[start] !== "\n") {
    start--;
  }
  if (code[start] === "\n") {
    start++; // don't include the newline
  }

  // we also want to read to the end of the line for the node we found
  let end = range.end;
  while (end < code.length && code[end] !== "\n") {
    end++;
  }

  return { start, end };
}

function resolveSearchedQueryWithNodes(
  ast,
  root,
  code,
  query,
  engine,
  nodes,
  opts
) {
  let nextRoot;

  // nodeIdx doesn't apply until there are no children e.g. if the parent is
  // specifying a nodeIdx, the idea is to apply to the childmost node, so pick
  // zero in the case where we have a child and pass on the opt
  let nodeIdx = isNumeric(opts.nodeIdx) && !query.children ? opts.nodeIdx : 0;

  if (opts.after) {
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      let nodeRange = engine.nodeToRange(node);
      if (nodeRange.start >= opts.after) {
        nextRoot = node;
        break;
      }
    }
  } else {
    nextRoot = nodes[nodeIdx];
  }

  if (!nextRoot) {
    let unknownQueryError = new Error(
      `Cannot find node for query: ${query.matcher} (match ${nodeIdx})`
    );
    unknownQueryError.query = query;
    throw unknownQueryError;
  }

  if (query.children) {
    let resolvedChildren;
    let lastError;

    // search through all possible nodes for children that would result in a valid query
    for (let i = 0; i < nodes.length; i++) {
      try {
        nextRoot = nodes[i];
        resolvedChildren = resolveListOfQueries(
          ast,
          nextRoot,
          code,
          query.children,
          engine,
          opts
        );
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
    let { start, end } = nodeToRangeLines(nextRoot, code, engine);
    let codeSlice = code.substring(start, end);
    return { code: codeSlice, nodes: [nextRoot], start, end };
  }
}

function resolveIndividualQuery(ast, root, code, query, engine, originalOpts) {
  const opts = { ...originalOpts };
  switch (query.type) {
    case NodeTypes.CALL_EXPRESSION: {
      let callee = query.callee;
      // for now, the first argument is always the inner selection
      let [childQuery, ...args] = query.arguments;

      let handled = false;
      // some operators modify before the target query
      // e.g. after() actually has two queries
      // TODO clean this up to unify design with `modifyAnswerWithCall`. `handled` is icky
      switch (callee) {
        case "after":
          handled = true;
          let [goalpostQuery] = args;
          let goalpostNode = resolveIndividualQuery(
            ast,
            root,
            code,
            goalpostQuery,
            engine,
            opts
          );
          opts.after = goalpostNode.end;
          break;
        case "choose":
          handled = true;
          let [nodeIdx] = args;
          opts.nodeIdx = nodeIdx.value;
          break;
      }

      let answer = resolveIndividualQuery(
        ast,
        root,
        code,
        childQuery,
        engine,
        opts
      );

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
    case NodeTypes.STRING: {
      let matchingNodes;

      switch (query.type) {
        case NodeTypes.IDENTIFIER:
          matchingNodes = engine.findNodesWithIdentifier(ast, root, query);
          // console.log("matchingNodes: ", matchingNodes); // KEY
          break;
        case NodeTypes.STRING:
          matchingNodes = engine.findNodesWithString(ast, root, query);
          break;
      }

      return resolveSearchedQueryWithNodes(
        ast,
        root,
        code,
        query,
        engine,
        matchingNodes,
        opts
      );
    }
    case NodeTypes.RANGE: {
      let rangeStart = resolveIndividualQuery(
        ast,
        root,
        code,
        query.start,
        engine,
        opts
      );
      let start = rangeStart.start;
      let rangeEnd = resolveIndividualQuery(
        ast,
        root,
        code,
        query.end,
        engine,
        Object.assign({}, opts, { after: rangeStart.start })
      );
      let end = rangeEnd.end;
      let codeSlice = code.substring(start, end);
      let nodes = [...(rangeStart.nodes || []), ...(rangeEnd.nodes || [])];
      return { code: codeSlice, nodes, start, end };
    }
    case NodeTypes.LINE_NUMBER: {
      // Parse special line numbers like EOF
      if (typeof query.value === "string") {
        switch (query.value) {
          case "EOF":
            return { code: "", start: code.length, end: code.length };
            break;
          default:
            throw new Error(`Unknown LINE_NUMBER: ${query.value}`);
        }
      } else {
        if (query.value === 0) {
          throw new Error(`Line numbers start at 1, not 0`);
        }

        // find the acutal line number
        let lines = code.split("\n");
        let line = lines[query.value - 1]; // one-indexed arguments to LINE_NUMBER

        // to get the starting index of this line...
        // we take the sum of all prior lines:
        let charIdx = lines.slice(0, query.value - 1).reduce(
          // + 1 b/c of the (now missing) newline
          (sum, line) => sum + line.length + 1,
          0
        );

        let start = charIdx;
        let end = charIdx + line.length;
        let codeSlice = code.substring(start, end);
        let nodes = []; // TODO - find the node that applies to this line number
        return { code: codeSlice, nodes, start, end };
      }
    }
    default:
      break;
  }
}

// given code, removes the smallest indent from each line (e.g. nested code becomes less-indented to the least indented line)
function undent(code) {
  let lines = code.split("\n");
  let minIndent = Number.MAX_VALUE;

  // find min indent
  lines.forEach((line) => {
    let startingSpaceMatch = line.match(/^\s*/);
    let indentLength = startingSpaceMatch[0].length;
    if (indentLength < minIndent) {
      minIndent = indentLength;
    }
  });

  // remove the indentation from each line
  return lines
    .map((line) => {
      return line.substring(minIndent);
    })
    .join("\n");
}

// given character index idx in code, returns the 1-indexed line number
function lineNumberOfCharacterIndex(code, idx) {
  const everythingUpUntilTheIndex = code.substring(0, idx);
  // computer science!
  return everythingUpUntilTheIndex.split("\n").length;
}

function resolveListOfQueries(ast, root, code, query, engine, opts) {
  return query.reduce(
    (acc, q) => {
      let resolved = resolveIndividualQuery(ast, root, code, q, engine, opts);

      let resolvedStartLine = lineNumberOfCharacterIndex(code, resolved.start);
      let resolvedEndLine = lineNumberOfCharacterIndex(code, resolved.end);

      let oldStartLine = acc.start_line;
      let newStartLine = Math.min(acc.start_line, resolvedStartLine);

      let oldEndLine = acc.end_line;
      let newEndLine = Math.max(acc.end_line, resolvedEndLine);

      if (
        opts.gapFiller &&
        acc.code.length > 0 &&
        oldEndLine + 1 < resolvedStartLine // there's a gap
      ) {
        // TODO - something clever about the indentation of the gapFiller?
        acc.code = acc.code + opts.gapFiller + resolved.code;
        acc.disjoint = true;
      } else if (
        opts.gapFiller &&
        acc.code.length > 0 &&
        oldEndLine + 1 === resolvedStartLine // they're contiguous
      ) {
        acc.code = acc.code + "\n" + resolved.code;
      } else {
        acc.code = acc.code + resolved.code;
      }

      acc.nodes = [...acc.nodes, ...(resolved.nodes || [])];
      acc.start = Math.min(acc.start, resolved.start);
      acc.end = Math.max(acc.end, resolved.end);
      acc.start_line = newStartLine;
      acc.end_line = newEndLine;

      return acc;
    },
    {
      code: "",
      nodes: [],
      start: Number.MAX_VALUE,
      end: Number.MIN_VALUE,
      start_line: Number.MAX_VALUE,
      end_line: Number.MIN_VALUE,
      disjoint: false
    }
  );
}

function cq(code, queries, opts = {}) {
  let engine = opts.engine || babylonEngine();
  let engineOpts = opts.engineOpts || {};
  let language = opts.language || undefined;

  if (typeof queries === "string") {
    // parse into an array
    queries = parser.parse(queries);
  }

  // TODO -- if no engine given, but you do have a language that we know about, then use that engine, e.g. treesitter

  if (typeof engine === "string") {
    switch (engine) {
      case "typescript":
        engine = typescriptEngine(engineOpts);
        break;
      case "babylon":
        engine = babylonEngine(engineOpts);
        break;
      case "treesitter":
        engine = require(`cq-treesitter-engine`)(engineOpts);
        break;
      default:
        try {
          engine = require(`cq-${engine}-engine`)(engineOpts);
        } catch (err) {
          console.log(err, err.stack);
          throw new Error("unknown engine: " + engine);
        }
        break;
    }
  }

  if (typeof engine === "function") {
    // then just use it
  }

  debug(code);

  const processAst = function (ast) {
    let root = engine.getInitialRoot(ast);
    let results = resolveListOfQueries(ast, root, code, queries, engine, opts);

    if (opts.undent) {
      results.code = undent(results.code);
    }

    return results;
  };

  return Promise.resolve(
    engine.parse(code, Object.assign({}, { language }, opts.parserOpts))
  ).then(function (ast) {
    return processAst(ast);
  });
}

export default cq;
