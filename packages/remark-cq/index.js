/**
 * @author Nate Murray
 * @license MIT
 * @module remark:cq
 * @fileoverview
 *   Plug-in to import code with cq
 */

"use strict";

/*
 * Dependencies.
 */

var trim = require("trim");
var fs = require("fs");
var path = require("path");
var repeat = require("repeat-string");
var cq = require("@fullstackio/cq");
var debug = require("debug")("cq:remark-cq");
var trim = require("trim-trailing-lines");
var visit = require("unist-util-visit");
var uuid = require("uuid/v4");

var C_NEWLINE = "\n";
var C_TAB = "\t";
var C_SPACE = " ";
var C_GT = ">";
var C_LEFT_BRACE = "{";
var C_RIGHT_BRACE = "}";
var C_LEFT_PAREN = "(";
var C_RIGHT_PAREN = ")";
var C_PERCENT = "%";
var EMPTY = "";
var T_BREAK = "break";
var T_TEXT = "text";
var CODE_INDENT_LENGTH = 4;
var CODE_INDENT = repeat(C_SPACE, CODE_INDENT_LENGTH);

var Parser;
var __options = {};
var __lastBlockAttributes = {};

/**
 * Find a possible Code Imports
 *
 * @example
 *   locateCodeImport('foo \n<<[my-file.js](my-file.js)'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible mention sequence.
 */
function locateCodeImport(value, fromIndex) {
  var index = value.indexOf(C_NEWLINE, fromIndex);

  if (value.charAt(index + 1) !== "<" && value.charAt(index + 2) !== "<") {
    return;
  }

  return index;
}
codeImportBlock.locator = locateCodeImport;

function dequote(value) {
  return value ? value.replace(/['"]/g, "") : "";
}

/**
 * Tokenize a code import
 *
 * @example
 *   codeImportBlock(eat, '\n<<[my-file.js](my-file.js)');
 *
 * @property {Function} locator - Mention locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `delete` node.
 */
function codeImportBlock(eat, value, silent) {
  var index = -1;
  var length = value.length + 1;
  var subvalue = EMPTY;
  var character;
  var marker;
  var markerCount;
  var queue;

  // eat initial spacing
  while (++index < length) {
    character = value.charAt(index);

    if (character !== C_TAB && character !== C_SPACE) {
      break;
    }

    subvalue += character;
  }

  if (value.charAt(index) !== "<") {
    return;
  }

  // require <<
  if (value.charAt(index + 1) !== "<") {
    return;
  }

  marker = character;
  subvalue += character;
  markerCount = 1;
  queue = EMPTY;

  while (++index < length) {
    character = value.charAt(index);

    if (character !== C_RIGHT_PAREN) {
      markerCount++;
      subvalue += queue + character;
      queue = EMPTY;
    } else if (character === C_RIGHT_PAREN) {
      subvalue += queue + C_RIGHT_PAREN;
      break;
    }
  }

  var match = /^(<<.*?)\s*$/m.exec(subvalue);
  if (!match) return;

  var fileMatches = /<<\[(.*)\]\((.*)\)/.exec(match[0]);
  var statedFilename = fileMatches[1];
  var actualFilename = fileMatches[2];
  debug(actualFilename);

  var cqOpts = {
    ...__options,
  };
  if (__lastBlockAttributes["undent"]) {
    cqOpts.undent = true;
  }
  if (__lastBlockAttributes["root"]) {
    cqOpts.root = dequote(__lastBlockAttributes["root"]);
  }
  if (__lastBlockAttributes["meta"]) {
    cqOpts.meta = __lastBlockAttributes["meta"];
  }
  if (__lastBlockAttributes["engine"]) {
    cqOpts.engine = dequote(__lastBlockAttributes["engine"]);
  }
  if (__lastBlockAttributes["language"]) {
    cqOpts.language = dequote(__lastBlockAttributes["language"]);
  }
  if (__lastBlockAttributes["lang"]) {
    cqOpts.language = dequote(__lastBlockAttributes["lang"]);
  }
  if (__lastBlockAttributes["gap-filler"]) {
    cqOpts.gapFiller =
      "\n " + dequote(__lastBlockAttributes["gap-filler"]) + "\n";
  }

  let newNode = {
    type: "cq",
    lang: null,
    statedFilename,
    actualFilename,
    query: null,
    cropStartLine: null,
    cropEndLine: null,
    options: cqOpts,
  };

  if (__lastBlockAttributes["lang"]) {
    newNode.lang = dequote(__lastBlockAttributes["lang"]).toLowerCase();
  }

  if (__lastBlockAttributes["crop-query"]) {
    newNode.query = __lastBlockAttributes["crop-query"];
  }

  if (__lastBlockAttributes["crop-start-line"]) {
    newNode.cropStartLine = parseInt(__lastBlockAttributes["crop-start-line"]);
  }

  if (__lastBlockAttributes["crop-end-line"]) {
    newNode.cropEndLine = parseInt(__lastBlockAttributes["crop-end-line"]);
  }

  // if there's no actualFilename, don't eat.
  if (!newNode.actualFilename) return;

  // meta: `{ info=string filename="foo/bar/baz.js" githubUrl="https://github.com/foo/bar"}`
  return eat(subvalue)(newNode);
}

// http://stackoverflow.com/questions/25058134/javascript-split-a-string-by-comma-except-inside-parentheses
function splitNoParen(s) {
  let results = [];
  let next;
  let str = "";
  let left = 0,
    right = 0;

  function keepResult() {
    results.push(str);
    str = "";
  }

  for (var i = 0; i < s.length; i++) {
    switch (s[i]) {
      case ",":
        if (left === right) {
          keepResult();
          left = right = 0;
        } else {
          str += s[i];
        }
        break;
      case "(":
        left++;
        str += s[i];
        break;
      case ")":
        right++;
        str += s[i];
        break;
      default:
        str += s[i];
    }
  }
  keepResult();
  return results;
}

function dequotifyString(str) {
  var innerStringMatch = /^['"](.*?)['"]$/.exec(str);
  var destringifiedValue =
    innerStringMatch && innerStringMatch[1] ? innerStringMatch[1] : str;
  return destringifiedValue;
}

/**
 * Tokenise a block inline attribute list
 *
 * @example
 *   tokenizeBlockInlineAttributeList(eat, '{lang=javascript}');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `thematicBreak` node.
 */
function tokenizeBlockInlineAttributeList(eat, value, silent) {
  var self = this;
  var index = -1;
  var length = value.length + 1;
  var subvalue = EMPTY;
  var character;
  var marker;
  var markerCount;
  var queue;

  // eat initial spacing
  while (++index < length) {
    character = value.charAt(index);

    if (character !== C_TAB && character !== C_SPACE) {
      break;
    }

    subvalue += character;
  }

  if (value.charAt(index) !== C_LEFT_BRACE) {
    return;
  }

  // ignore {{ thing }}
  if (value.charAt(index + 1) === C_LEFT_BRACE) {
    return;
  }

  // ignore {% thing %}
  if (value.charAt(index + 1) === C_PERCENT) {
    return;
  }

  marker = character;
  subvalue += character;
  markerCount = 1;
  queue = EMPTY;

  while (++index < length) {
    character = value.charAt(index);

    if (character !== C_RIGHT_BRACE) {
      // no newlines allowed in the attribute blocks
      if (character === C_NEWLINE) {
        return;
      }

      markerCount++;
      subvalue += queue + character;
      queue = EMPTY;
    } else if (character === C_RIGHT_BRACE) {
      subvalue += queue + C_RIGHT_BRACE;

      // eat trailing spacing because we don't even want this block to leave a linebreak in the output
      while (++index < length) {
        character = value.charAt(index);

        if (
          character !== C_TAB &&
          character !== C_SPACE &&
          character !== C_NEWLINE
        ) {
          break;
        }

        subvalue += character;
      }

      function parseBlockAttributes(attrString) {
        // e.g. {lang='JavaScript',starting-line=4,crop-start-line=4,crop-end-line=26}
        var matches = /{(.*?)}/.exec(attrString);
        var blockAttrs = {};

        if (!matches || !matches[1]) {
          console.log("WARNING: remark-cq unknown attrString", attrString);
          // hmm...
          return blockAttrs;
        }

        var pairs = splitNoParen(matches[1]);

        pairs.forEach(function (pair) {
          var kv = pair.split(/=\s*/);
          blockAttrs[kv[0]] = kv[1];
        });
        return blockAttrs;
      }

      __lastBlockAttributes = parseBlockAttributes(subvalue);
      // if (!__lastBlockAttributes.lang) return; // ?

      if (__options.preserveEmptyLines) {
        return eat(subvalue)({ type: T_BREAK });
      } else {
        return eat(subvalue);
      }
    } else {
      return;
    }
  }
}

/**
 * If links have a title attribute `gitlab-artifact:<project_id>:<job_name>`,
 * then download the build artifact to sit alongside this markdown (`vFile`).
 *
 * @param {object} ast
 * @param {object} vFile
 * @param {object} options
 * @return {Promise}
 */
async function visitCq(ast, vFile, options) {
  const nodes = [];

  // Gather all cq nodes
  // visit is sync, so we have to make two passes :\
  visit(ast, "cq", (node) => {
    node.uuid = uuid();
    nodes.push(node);
    return node;
  });

  if (!nodes.length) {
    return Promise.resolve(ast);
  }

  const codeNodes = {};
  await Promise.all(
    nodes.map(async (node) => {
      // For each cq node, produce a code node and save, by uuid, in codeNodes
      // We can replace them in a sync visit below
      let root = node.options.root;
      let actualFilename = node.actualFilename;

      const primaryFilename = path.join(root, actualFilename);
      const secondaryFilename = node.options.filename
        ? path.join(path.dirname(node.options.filename), actualFilename)
        : null;

      const thirdFilename =
        vFile.history && vFile.history[0]
          ? path.join(path.dirname(vFile.history[0]), actualFilename)
          : null;

      if (fs.existsSync(primaryFilename)) {
        // do nothing
      } else {
        if (fs.existsSync(secondaryFilename)) {
          root = path.dirname(node.options.filename);
        } else if (thirdFilename && fs.existsSync(thirdFilename)) {
          root = path.dirname(vFile.history[0]);
        }
      }

      try {
        let codeString = "";
        try {
          codeString = fs
            .readFileSync(path.join(root, actualFilename))
            .toString();
        } catch (err) {
          console.warn(
            `WARNING: cq couldn't find ${actualFilename} at ${node.position.start.line}:${node.position.start.column}`
          );
          vFile.message(err, node.position, "remark-cq");

          if (options.warnErrors) {
            const codeNode = {
              uuid: node.uuid,
              type: "blockquote",
              lang: null,
              children: [
                {
                  type: "text",
                  value: `WARNING: cq couldn't find file ${actualFilename}`,
                },
              ],
            };
            codeNodes[node.uuid] = codeNode;
            return;
          } else {
            throw err;
          }
        }
        const query = node.query;

        let engine = "babylon";
        if (actualFilename && actualFilename.match(/\.tsx?/)) {
          engine = "typescript";
        }
        if (actualFilename && actualFilename.match(/\.py/)) {
          engine = "treesitter";
        }

        let cqOpts = { ...node.options };
        if (!cqOpts.engine) {
          cqOpts.engine = engine;
        }
        if (!cqOpts.gapFiller) {
          cqOpts.gapFiller = "\n  // ...\n";
        }
        debug(`${actualFilename} ` + JSON.stringify(cqOpts, null, 2));

        let results;

        if (query) {
          results = await cq(codeString, query, cqOpts);
        } else if (node.cropStartLine) {
          const lines = codeString.split("\n");
          const endSlice = node.cropEndLine || lines.length;
          results = {
            code: lines.slice(node.cropStartLine - 1, endSlice).join("\n"),
            start_line: node.cropStartLine,
            end_line: endSlice,
            start: null, // TODO
            end: null, // TODO
          };
        } else {
          // the whole file
          const lines = codeString.split("\n");
          results = {
            code: codeString,
            start_line: 1,
            end_line: lines.length,
            start: 0,
            end: codeString.length,
          };
        }
        // vFile.info(`artifacts fetched from ${projectId} ${jobName}`, position, PLUGIN_NAME);
        // vFile.message(error, position, PLUGIN_NAME);

        const lines = results.code;
        const language = node.lang;

        const createMeta = (metaTypes, node) => {
          const allMetas = {};

          // filenames
          allMetas.statedFilename = node.statedFilename;
          allMetas.actualFilename = node.actualFilename;

          // location
          allMetas.startLine = results.start_line;
          allMetas.endLine = results.end_line;
          allMetas.startChar = results.start;
          allMetas.endChar = results.end;

          // attach a URL
          if (cqOpts.defaultMetaRootUrl && !allMetas.url) {
            const importedPath = allMetas.actualFilename.replace(/\.\//, ""); // e.g. ./foo.js
            const anchor =
              allMetas.startLine && parseInt(allMetas.startLine, 10) > 1
                ? `#L${allMetas.startLine}`
                : "";

            allMetas.url = `${cqOpts.defaultMetaRootUrl}/${importedPath}${anchor}`;
          }

          if (metaTypes) {
            return (
              "{ " +
              Object.keys(allMetas)
                .sort()
                .map((key) => {
                  const value = allMetas[key];
                  return value === null || value === ""
                    ? null
                    : `${key}=${value}`;
                })
                .filter(Boolean)
                .join(" ") +
              " }"
            );
          } else {
            return null;
          }
        };

        const codeNode = {
          uuid: node.uuid,
          type: "code",
          lang: language || null,
          fence: "`",
          meta: createMeta(cqOpts.meta || false, node),
          value: trim(lines),
        };
        codeNodes[node.uuid] = codeNode;
      } catch (err) {
        console.log(
          `Error processing: ${actualFilename}, imported at ${node.position.start.line}:${node.position.start.column}`
        );
        throw err;
      }
    })
  );

  visit(ast, "cq", (node) => {
    // swap nodes by overwriting *this* node object
    Object.assign(node, codeNodes[node.uuid]);
    return node;
  });

  return Promise.resolve(ast);
}

/**
 * Attacher.
 *
 * Export the attacher which accepts options and returns the transformer to
 * act on the MDAST tree, given a VFile.
 *
 * Here's the big idea:
 * In markdown files we want to be able to import code like this:
 *
 *     {lang=javascript,crop-query=.dogs}
 *     <<[](test.js)
 *
 * This plugin works by:
 *   1. tokenizing the two elements above into a "cq" element into the MDAST
 *   2. tranforming the "cq" element with `cq` into an expanded, standard `code` element
 *
 * @link  * https://github.com/unifiedjs/unified#description
 *
 * @param {Remark} remark - Processor.
 * @return {function(node)} - Transformer.
 */
function attacher(options) {
  Parser = this.Parser;

  var proto = Parser.prototype;
  var methods = proto.inlineMethods;

  __options = options || {};
  __options.root = __options["root"] || process.cwd();
  __options.preserveEmptyLines = __options.hasOwnProperty("preserveEmptyLines")
    ? __options.preserveEmptyLines
    : false;
  __options.undent = __options.hasOwnProperty("undent")
    ? __options.undent
    : true;
  __options.engine = __options.hasOwnProperty("engine")
    ? __options.engine
    : null;

  /*
   * Add a tokenizer to the `Parser`.
   */

  // We need to tokenize blockInlineAttributeLists, because they loads state for any blocks that follow
  // e.g. {lang=javascript,crop-query=.dogs}
  proto.blockTokenizers.blockInlineAttributeList = tokenizeBlockInlineAttributeList;
  proto.blockMethods.splice(
    proto.blockMethods.indexOf("newline"),
    0,
    "blockInlineAttributeList"
  );

  // Tokenizing code import blocks
  // e.g. <<[](test.js)
  proto.blockTokenizers.codeImport = codeImportBlock;
  proto.blockMethods.splice(
    proto.blockMethods.indexOf("newline"),
    0,
    "codeImport"
  );

  const Compiler = this.Compiler;
  if (Compiler) {
    const visitors = Compiler.prototype.visitors;
    if (!visitors) return;

    // When we compile back to markdown, the `cq` nodes simply compile to a
    // regular code block
    // function compileCqNode(node) {
    //     const value = visitors.code.bind(this)(node.children[0]);
    //     console.log("compile code: ", value);
    //     return value;
    // }
    // visitors.cq = compileCqNode;

    /*
        const oldCode = visitors.code;
        function compileCodeNode(node) {
            const value = oldCode.bind(this)(node);
            return value;
        }
        visitors.code = compileCodeNode;
        */
  }

  /**
   * @link https://github.com/unifiedjs/unified#function-transformernode-file-next
   * @link https://github.com/syntax-tree/mdast
   * @link https://github.com/vfile/vfile
   * @param {object} ast MDAST
   * @param {object} vFile
   * @param {function} next
   * @return {object}
   */
  return async function transformer(ast, vFile, next) {
    try {
      await visitCq(ast, vFile, options);
    } catch (err) {
      console.log("WARNING: remark-cq error", err);
      // also, vFile will have the error message.
    }

    if (typeof next === "function") {
      return next(null, ast, vFile);
    }

    return ast;
  };
}

/*
 * Expose.
 */

module.exports = attacher;
