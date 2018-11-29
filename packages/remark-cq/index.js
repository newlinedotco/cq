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
var cq = require("@fullstackio/cq").default;
var debug = require("debug")("remark-cq");
var trim = require("trim-trailing-lines");

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

        // console.log(character);

        if (character !== C_RIGHT_PAREN) {
            // no newlines allowed in the import blocks
            if (character === C_NEWLINE) {
                return;
            }

            markerCount++;
            subvalue += queue + character;
            queue = EMPTY;
        } else if (character === C_RIGHT_PAREN) {
            subvalue += queue + C_RIGHT_PAREN;
        }
    }

    var match = /^(<<.*?)\s*$/m.exec(subvalue);
    if (!match) return;

    var fileMatches = /<<\[(.*)\]\((.*)\)/.exec(match);
    var statedFilename = fileMatches[1];
    var actualFilename = fileMatches[2];

    // todo cache this
    var codeString = fs
        .readFileSync(path.join(__options.root, actualFilename))
        .toString();
    var array = codeString.split("\n");
    var lines = "";
    var language = __lastBlockAttributes["lang"]
        ? __lastBlockAttributes["lang"].toLowerCase()
        : "javascript";

    if (__lastBlockAttributes["crop-query"]) {
        var cqOpts = {
            ...__options
        };
        if (__lastBlockAttributes["undent"]) {
            cqOpts.undent = true;
        }

        var results = cq(
            codeString,
            __lastBlockAttributes["crop-query"],
            cqOpts
        );
        lines = results.code;
    } else {
        var cropStartLine = __lastBlockAttributes["crop-start-line"]
            ? parseInt(__lastBlockAttributes["crop-start-line"])
            : 1;
        var cropEndLine = __lastBlockAttributes["crop-end-line"]
            ? parseInt(__lastBlockAttributes["crop-end-line"])
            : array.length;
        lines = array.slice(cropStartLine - 1, cropEndLine).join("\n");
    }

    // TODO -- if we invent a new type
    // we may get some benefits when we convert to React

    return eat(subvalue)({
        type: "code",
        lang: language || null,
        meta: null,
        value: trim(lines)
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
 * Attacher.
 *
 * @param {Remark} remark - Processor.
 *
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
}

/*
 * Expose.
 */

module.exports = attacher;
