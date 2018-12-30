/**
 * @author Nate Murray
 * @license MIT
 * @module remark:inline-links
 * @fileoverview
 *   Plug-in to deal w/ leanpub markdown
 */

"use strict";

const trim = require("trim");
const interrupt = require("remark-parse/lib/util/interrupt");
const visit = require("unist-util-visit");

module.exports = attacher;

var lineFeed = "\n";
var tab = "\t";
var space = " ";
var greaterThan = ">";

// see: https://github.com/remarkjs/remark/blob/ce62e7ae443d4fcf43d4655f65bc2f3c6c8e8f02/packages/remark-parse/lib/tokenize/blockquote.js
function tokenizeAnnotatedBlockquote(eat, value, silent) {
    var self = this;
    var offsets = self.offset;
    var tokenizers = self.blockTokenizers;
    var interruptors = self.interruptBlockquote;
    var now = eat.now();
    var currentLine = now.line;
    var length = value.length;
    var values = [];
    var contents = [];
    var indents = [];
    var add;
    var index = 0;
    var character;
    var rest;
    var nextIndex;
    var content;
    var line;
    var startIndex;
    var prefixed;
    var exit;
    var blockType;

    while (index < length) {
        character = value.charAt(index);

        if (
            character !== space &&
            character !== tab &&
            !character.match(/[A-Z]/)
        ) {
            break;
        }

        // store the block type
        if (character.match(/[A-Z]/)) {
            switch (character) {
                case "A":
                    blockType = "aside";
                    break;
                case "W":
                    blockType = "warning";
                    break;
                case "T":
                    blockType = "tip";
                    break;
                case "E":
                    blockType = "error";
                    break;
                case "I":
                    blockType = "information";
                    break;
                case "Q":
                    blockType = "questions";
                    break;
                case "D":
                    blockType = "discussions";
                    break;
                case "X":
                    blockType = "exercises";
                    break;
                default:
                    blockType = "generic";
            }
        }

        index++;
    }

    if (value.charAt(index) !== greaterThan) {
        return;
    }

    if (silent) {
        return true;
    }

    index = 0;

    while (index < length) {
        nextIndex = value.indexOf(lineFeed, index);
        startIndex = index;
        prefixed = false;

        if (nextIndex === -1) {
            nextIndex = length;
        }

        while (index < length) {
            character = value.charAt(index);

            if (
                character !== space &&
                character !== tab &&
                !character.match(/[A-Z]/)
            ) {
                break;
            }

            index++;
        }

        if (value.charAt(index) === greaterThan) {
            index++;
            prefixed = true;

            if (value.charAt(index) === space) {
                index++;
            }
        } else {
            index = startIndex;
        }

        content = value.slice(index, nextIndex);

        if (!prefixed && !trim(content)) {
            index = startIndex;
            break;
        }

        if (!prefixed) {
            rest = value.slice(index);

            // Check if the following code contains a possible block.
            if (interrupt(interruptors, tokenizers, self, [eat, rest, true])) {
                break;
            }
        }

        line =
            startIndex === index ? content : value.slice(startIndex, nextIndex);

        indents.push(index - startIndex);
        values.push(line);
        contents.push(content);

        index = nextIndex + 1;
    }

    index = -1;
    length = indents.length;
    add = eat(values.join(lineFeed));

    while (++index < length) {
        offsets[currentLine] = (offsets[currentLine] || 0) + indents[index];
        currentLine++;
    }

    exit = self.enterBlock();
    contents = self.tokenizeBlock(contents.join(lineFeed), now);
    exit();

    return add({
        type: "blockquote",
        blockType: blockType,
        children: contents
    });
}

function visitor(node, index, parent) {
    var data = node.data || (node.data = {});
    var props = data.hProperties || (data.hProperties = {});

    if (node.blockType) {
        data.blockType = node.blockType;
        data.hProperties.blockType = node.blockType;
    }
}

function transformer(ast, vFile, next) {
    visit(ast, "blockquote", visitor);

    if (typeof next === "function") {
        return next(null, ast, vFile);
    }
    return ast;
}

/**
 * Attacher.
 *
 * @param {Remark} remark - Processor.
 *
 * @return {function(node)} - Transformer.
 */
function attacher(options) {
    var Parser = this.Parser;
    var proto = Parser.prototype;

    /*
     * Add a tokenizer to the `Parser`.
     */
    proto.blockTokenizers.blockquote = tokenizeAnnotatedBlockquote;

    return transformer;
}

/*
 * Expose.
 */

module.exports = attacher;
