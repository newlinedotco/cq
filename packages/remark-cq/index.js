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
var debug = require("debug")("remark-cq");
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
    var handle;
    var url;
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
    var language = __lastBlockAttributes["lang"]
        ? __lastBlockAttributes["lang"].toLowerCase()
        : "javascript";

    var cqOpts = {
        ...__options
    };
    if (__lastBlockAttributes["undent"]) {
        cqOpts.undent = true;
    }
    if (__lastBlockAttributes["root"]) {
        cqOpts.root = __lastBlockAttributes["root"];
    }

    // todo cache this
    var codeString = fs
        .readFileSync(path.join(__options.root, actualFilename))
        .toString();
    var array = codeString.split("\n");
    var lines = "";

    var query;

    if (__lastBlockAttributes["crop-query"]) {
        // console.log(
        //     "crop query?",
        //     codeString,
        //     __lastBlockAttributes["crop-query"]
        // );
        query = __lastBlockAttributes["crop-query"];

        // TODO - this is going to be a problem when we start importing from engines that are async...
        // Also, if cq sucks in remote files, then this has to be async
        // var results = cq(codeString, query, cqOpts);
        // lines = results.code;
    } else {
        // TODO - if cq has richer information about how to fetch the file, then we'll want to convert this to a cq query instead of just slicing lines... (right?)
        var cropStartLine = __lastBlockAttributes["crop-start-line"]
            ? parseInt(__lastBlockAttributes["crop-start-line"])
            : 1;
        var cropEndLine = __lastBlockAttributes["crop-end-line"]
            ? parseInt(__lastBlockAttributes["crop-end-line"])
            : array.length;
        // lines = array.slice(cropStartLine - 1, cropEndLine).join("\n");
        query = `${cropStartLine}-${cropEndLine}`;
    }

    // meta: `{ info=string filename="foo/bar/baz.js" githubUrl="https://github.com/foo/bar"}`
    // return eat(subvalue)({
    //     type: "code",
    //     lang: language || null,
    //     meta: null,
    //     value: trim(lines),
    //     cq: { actualFilename }
    // });

    return eat(subvalue)({
        type: "cq",
        lang: language || null,
        statedFilename,
        actualFilename,
        query,
        options: cqOpts
    });
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
                    console.log(
                        "WARNING: remark-cq unknown attrString",
                        attrString
                    );
                    // hmm...
                    return blockAttrs;
                }

                var pairs = splitNoParen(matches[1]);

                pairs.forEach(function(pair) {
                    var kv = pair.split(/=\s*/);
                    blockAttrs[kv[0]] = kv[1];
                });
                return blockAttrs;
            }

            __lastBlockAttributes = parseBlockAttributes(subvalue);

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
    visit(ast, "cq", node => {
        node.uuid = uuid();
        nodes.push(node);
        return node;
    });

    if (!nodes.length) {
        return Promise.resolve(ast);
    }

    const codeNodes = {};
    await Promise.all(
        nodes.map(async node => {
            // For each cq node, produce a code node and save, by uuid, in codeNodes
            // We can replace them in a sync visit below
            const root = node.options.root;
            const actualFilename = node.actualFilename;
            const codeString = fs
                .readFileSync(path.join(root, actualFilename))
                .toString();
            const query = node.query;
            const cqOpts = node.options;

            const results = await cq(codeString, query, cqOpts);
            const lines = results.code;
            const language = node.lang;

            const createMeta = (metaTypes, node) => {
                const metas = {};

                // filenames
                metas.statedFilename = node.statedFilename;
                metas.actualFilename = node.actualFilename;

                // location
                metas.startLine = results.start_line;
                metas.endLine = results.end_line;
                metas.startChar = results.start;
                metas.endChar = results.end;

                return (
                    "{ " +
                    Object.keys(metas)
                        .map(key => `${key}=${metas[key]}`)
                        .join(" ") +
                    " }"
                );
            };

            const codeNode = {
                uuid: node.uuid,
                type: "code",
                lang: language || null,
                fence: "`",
                // meta: createMeta("", node),
                meta: null,
                value: trim(lines)
                // cq: { actualFilename }
            };
            codeNodes[node.uuid] = codeNode;
        })
    );

    visit(ast, "cq", node => {
        // const { title } = node;
        console.log("visitCq", node);

        // if (!title || title.indexOf('gitlab-artifact|') === -1) {
        //   return node;
        // }
        // const language = "javascript";
        // const lines = `hi mom`;

        // const codeNode = {
        //     type: "code",
        //     lang: language || null,
        //     meta: null,
        //     value: trim(lines)
        //     // cq: { actualFilename }
        // };

        // swap nodes by overwriting *this* node object
        Object.assign(node, codeNodes[node.uuid]);
        console.log("node: ", node);
        return node;
    });

    return Promise.resolve(ast);

    /*
  if (!nodes.length) {
    return Promise.resolve(ast);
  }
  */

    /*
  return Promise.all(nodes.map(async (node) => {
    const { title, position } = node;
    const [, projectId, jobName] = title.split('|');

    try {
      const artifact = await getArtifact(apiBase, token, projectId, jobName);
      const destinationDir = getDestinationDir(vFile);
      await extractArtifact(destinationDir, artifact);

      // eslint-disable-next-line no-param-reassign
      node.title = '';

      vFile.info(`artifacts fetched from ${projectId} ${jobName}`, position, PLUGIN_NAME);
    } catch (error) {
      vFile.message(error, position, PLUGIN_NAME);
    }

    return node;
  }));
  */
}

/**
 * Attacher.
 *
 * Export the attacher which accepts options and returns the transformer to
 * act on the MDAST tree, given a VFile.
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
    __options.preserveEmptyLines = __options.hasOwnProperty(
        "preserveEmptyLines"
    )
        ? __options.preserveEmptyLines
        : false;
    __options.undent = __options.hasOwnProperty("undent")
        ? __options.undent
        : true;

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
        //     //return visitors.code.bind(this)(node.children[0]);
        //     const value = visitors.code.bind(this)(node.children[0]);
        //     console.log("compile code: ", value);
        //     return value;
        // }
        // visitors.cq = compileCqNode;

        const oldCode = visitors.code;
        function compileCodeNode(node) {
            console.log(node);
            const value = oldCode.bind(this)(node);
            console.log("compile code: ", value);

            return value;
        }
        visitors.code = compileCodeNode;
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
            console.log("cq err", err);
            // no-op, vFile will have the error message.
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
