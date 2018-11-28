/**
 * @author Nate Murray
 * @license MIT
 * @module remark:inline-links
 * @fileoverview
 *   Plug-in to deal w/ leanpub markdown
 */

'use strict';

/*
 * Dependencies.
 */

var visit = require('unist-util-visit');
var trim = require('trim');
var fs = require('fs');
var path = require('path');
var repeat = require('repeat-string');
var cq = require('@fullstackio/cq').default;
var debug = require('debug')('remark-leanpub');

var has = Object.prototype.hasOwnProperty;

var C_NEWLINE = '\n';
var C_TAB = '\t';
var C_SPACE = ' ';
var C_GT = '>';
var C_LEFT_BRACE = '{';
var C_RIGHT_BRACE = '}';
var C_PERCENT = '%';
var EMPTY = '';
var T_BREAK = 'break';
var T_TEXT = 'text';
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

  if (value.charAt(index + 1) !== '<' &&
        value.charAt(index + 2) !== '<'
     ) {
    return;
  }

  return index;
}

/**
 * Tokenize a code import
 *
 * (For now, it just strips them, TODO is to actually import this file)
 *
 * @example
 *   tokenizeCodeImport(eat, '\n<<[my-file.js](my-file.js)');
 *
 * @property {Function} locator - Mention locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `delete` node.
 */
function codeImport(eat, value, silent) {
  var match = /^(<<.*?)\s*$/m.exec(value);
  var handle;
  var url;

  if (match) {
    var fileMatches = /<<\[(.*)\]\((.*)\)/.exec(match);
    var statedFilename = fileMatches[1];
    var actualFilename = fileMatches[2];
    
    if(__options.expandCode) {
      // todo cache this
      var codeString = fs.readFileSync(path.join(__options.root, actualFilename)).toString();
      var array = codeString.split("\n");
      var lines = '';
      var language = __lastBlockAttributes['lang'] ? __lastBlockAttributes['lang'].toLowerCase() : 'javascript';

      if(__lastBlockAttributes['crop-query']) {
        var cqOpts = {};
        if(__lastBlockAttributes['undent']) {
          cqOpts.undent = true;
        }

        var results = cq(codeString, __lastBlockAttributes['crop-query'], cqOpts);
        lines = results.code;
      } else {
        var cropStartLine = __lastBlockAttributes['crop-start-line'] ? parseInt(__lastBlockAttributes['crop-start-line']) : 1;
        var cropEndLine = __lastBlockAttributes['crop-end-line'] ? parseInt(__lastBlockAttributes['crop-end-line']) : array.length;
        lines = array.slice(cropStartLine - 1, cropEndLine).join('\n')

      }

      return eat(match[0])(Parser.prototype.renderCodeBlock(lines, language));
    } else {
      return eat(match[0])({
        'type': 'text',
        'value': ''
      })
    }
  }
}

codeImport.locator = locateCodeImport;



/**
 * Find a possible Block Inline Attribute List
 *
 * @example
 *   locateMention('foo \n{lang='js'}'); // 4
 *
 * @param {string} value - Value to search.
 * @param {number} fromIndex - Index to start searching at.
 * @return {number} - Location of possible mention sequence.
 */
function locateBlockInlineAttributeList(value, fromIndex) {
  var index = value.indexOf(C_NEWLINE, fromIndex);

  if (value.charAt(index + 1) !== '{') {
    return;
  }

  if (value.charAt(index + 2) == '%') {
    return;
  }

  return index;
}

/**
 * Tokenize a block inline attribute list.
 *
 * (For now, it just strips them)
 *
 * @example
 *   tokenizeBlockInlineAttributeList(eat, '\n{foo=bar}');
 *
 * @property {Function} locator - Mention locator.
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `delete` node.
 */
function blockInlineAttributeList(eat, value, silent) {
  var match = /^{(.*?)}\s*$/m.exec(value);
  var handle;
  var url;

  if (match) {
    return eat(match[0])({
      'type': 'text',
      'value': ''
    })
  }
}

// http://stackoverflow.com/questions/25058134/javascript-split-a-string-by-comma-except-inside-parentheses
function splitNoParen(s){
  let results = [];
  let next;
  let str = '';
  let left = 0, right = 0;

  function keepResult() {
    results.push(str);
    str = '';
  }

  for(var i = 0; i<s.length; i++) {
    switch(s[i]) {
    case ',': 
      if((left === right)) {
        keepResult();
        left = right = 0;
      } else {
        str += s[i];
      }
      break;
    case '(':
      left++;
      str += s[i];
      break;
    case ')':
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
  var destringifiedValue = (innerStringMatch && innerStringMatch[1]) ? innerStringMatch[1] : str;
  return destringifiedValue;
}

// blockInlineAttributeList.locator = locateBlockInlineAttributeList;

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
    // console.log('tokenizeBlockInlineAttributeList');
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

      // console.log(character);

        if (character !== C_RIGHT_BRACE) {

            // no newlines allowed in the attribute blocks
            if(character === C_NEWLINE) {
              return;
            }

            markerCount++;
            subvalue += queue + character;
            queue = EMPTY;
        } else if (
            // markerCount >= THEMATIC_BREAK_MARKER_COUNT &&
            (character === C_RIGHT_BRACE)
        ) {

           subvalue += queue + C_RIGHT_BRACE;

            function parseBlockAttributes(attrString) {
              // e.g. {lang='JavaScript',starting-line=4,crop-start-line=4,crop-end-line=26}
              var matches = /{(.*?)}/.exec(attrString);
              var blockAttrs = {};

              if(!matches || !matches[1]) { 
                console.log("WARNING: remark-leanpub unknown attrString", attrString);
                // hmm...
                return  blockAttrs; 
              }

              // var pairs = matches[1].split(/,\s*/);
              var pairs = splitNoParen(matches[1]);

              pairs.forEach(function(pair) {
                var kv = pair.split(/=\s*/);

                // var innerStringMatch = /^'(.*?)'$/.exec(kv[1]);
                // var destringifiedValue = (innerStringMatch && innerStringMatch[1]) ? innerStringMatch[1] : kv[1];
                // blockAttrs[kv[0]] = destringifiedValue;

                blockAttrs[kv[0]] = kv[1];
              });
              return blockAttrs;
            }

            __lastBlockAttributes = parseBlockAttributes(subvalue);
            // console.log('__lastBlockAttributes', __lastBlockAttributes);


          if(__options.preserveEmptyLines) {
            return eat(subvalue)(self.renderVoid(T_BREAK));
          } else {
            return eat(subvalue)(self.renderRaw(T_TEXT, EMPTY));
          }
        } else {
         // console.log("see ya", subvalue);
            return;
        }
    }
}

/**
 * Tokenise a blockquote.
 *
 * copied from: https://github.com/wooorm/remark/blob/master/lib/parse.js#L1460
 *
 * @example
 *   tokenizeBlockquote(eat, '> Foo');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `blockquote` node.
 */
function tokenizeAnnotatedBlockquote(eat, value, silent) {
    var self = this;
    var commonmark = self.options.commonmark;
    var now = eat.now();
    var indent = self.indent(now.line);
    var length = value.length;
    var values = [];
    var contents = [];
    var indents = [];
    var add;
    var tokenizers;
    var index = 0;
    var character;
    var rest;
    var nextIndex;
    var content;
    var line;
    var startIndex;
    var prefixed;

    while (index < length) {
        character = value.charAt(index);

        if (character !== C_SPACE && character !== C_TAB && !character.match(/[A-Z]/)) {
            break;
        }

        index++;
    }

    if (value.charAt(index) !== C_GT) {
        return;
    }

    if (silent) {
        return true;
    }

    tokenizers = self.blockTokenizers;
    index = 0;

    while (index < length) {
        nextIndex = value.indexOf(C_NEWLINE, index);
        startIndex = index;
        prefixed = false;

        if (nextIndex === -1) {
            nextIndex = length;
        }

        while (index < length) {
            character = value.charAt(index);

            if (character !== C_SPACE && character !== C_TAB && !character.match(/[A-Z]/)) {
                break;
            }

            index++;
        }

        if (value.charAt(index) === C_GT) {
            index++;
            prefixed = true;

            if (value.charAt(index) === C_SPACE) {
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

            if (
                commonmark &&
                (
                    tokenizers.code.call(self, eat, rest, true) ||
                    tokenizers.fences.call(self, eat, rest, true) ||
                    tokenizers.heading.call(self, eat, rest, true) ||
                    tokenizers.lineHeading.call(self, eat, rest, true) ||
                    tokenizers.thematicBreak.call(self, eat, rest, true) ||
                    tokenizers.html.call(self, eat, rest, true) ||
                    tokenizers.list.call(self, eat, rest, true)
                )
            ) {
                break;
            }

            if (
                !commonmark &&
                (
                    tokenizers.definition.call(self, eat, rest, true) ||
                    tokenizers.footnote.call(self, eat, rest, true)
                )
            ) {
                break;
            }
        }

        line = startIndex === index ?
            content :
            value.slice(startIndex, nextIndex);

        indents.push(index - startIndex);
        values.push(line);
        contents.push(content);

        index = nextIndex + 1;
    }

    index = -1;
    length = indents.length;
    add = eat(values.join(C_NEWLINE));

    while (++index < length) {
        indent(indents[index]);
    }

    return add(self.renderBlockquote(contents.join(C_NEWLINE), now));
}

/**
 * Tokenise an indented code block.
 *
 * @example
 *   tokenizeCode(eat, '\tfoo');
 *
 * @param {function(string)} eat - Eater.
 * @param {string} value - Rest of content.
 * @param {boolean?} [silent] - Whether this is a dry run.
 * @return {Node?|boolean} - `code` node.
 */
function tokenizeCodeWithOpts(eat, value, silent) {
    // console.log('tokenizeCodeWithOpts')
    var self = this;
    var index = -1;
    var length = value.length;
    var character;
    var subvalue = EMPTY;
    var content = EMPTY;
    var subvalueQueue = EMPTY;
    var contentQueue = EMPTY;
    var blankQueue;
    var indent;

    while (++index < length) {
        character = value.charAt(index);

        if (indent) {
            indent = false;

            subvalue += subvalueQueue;
            content += contentQueue;
            subvalueQueue = contentQueue = EMPTY;

            if (character === C_NEWLINE) {
                subvalueQueue = contentQueue = character;
            } else {
                subvalue += character;
                content += character;

                while (++index < length) {
                    character = value.charAt(index);

                    if (!character || character === C_NEWLINE) {
                        contentQueue = subvalueQueue = character;
                        break;
                    }

                    subvalue += character;
                    content += character;
                }
            }
        } else if (
            character === C_SPACE &&
            value.charAt(index + 1) === C_SPACE &&
            value.charAt(index + 2) === C_SPACE &&
            value.charAt(index + 3) === C_SPACE
        ) {
            subvalueQueue += CODE_INDENT;
            index += 3;
            indent = true;
        } else if (character === C_TAB) {
            subvalueQueue += character;
            indent = true;
        } else {
            blankQueue = EMPTY;

            while (character === C_TAB || character === C_SPACE) {
                blankQueue += character;
                character = value.charAt(++index);
            }

            if (character !== C_NEWLINE) {
                break;
            }

            subvalueQueue += blankQueue + character;
            contentQueue += character;
        }
    }

    if (content) {
        if (silent) {
            return true;
        }
        var language = __lastBlockAttributes['lang'] ? dequotifyString(__lastBlockAttributes['lang']).toLowerCase() : null;
        return eat(subvalue)(self.renderCodeBlock(content, language));
    }
}



/**
 * Attacher.
 *
 * @param {Remark} remark - Processor.
 *
 * @return {function(node)} - Transformer.
 */
function attacher(remark, options) {
    Parser = remark.Parser;
    var proto = remark.Parser.prototype;
    var methods = proto.inlineMethods;

    __options = options || {};
    __options.root = __options['root'] || process.cwd();
    __options.preserveEmptyLines = __options.hasOwnProperty('preserveEmptyLines') ? __options.preserveEmptyLines : true;

    /*
     * Add a tokenizer to the `Parser`.
     */
    proto.inlineTokenizers.codeImport = codeImport;

    proto.blockTokenizers.blockInlineAttributeList = tokenizeBlockInlineAttributeList;
    proto.blockTokenizers.blockquote = tokenizeAnnotatedBlockquote;

    // tokenizeCodeWithOpts.locator = proto.blockTokenizers.code.locator;
    // proto.blockTokenizers.code = tokenizeCodeWithOpts;
    proto.blockTokenizers.indentedCode = tokenizeCodeWithOpts;


    methods.splice(methods.indexOf('inlineText'), 0, 'codeImport');
    proto.blockMethods.splice(proto.blockMethods.indexOf('newline'), 0, 'blockInlineAttributeList');

    // function transformer(node, file) {
    //   currentFilePath = file.filePath();
    //   console.log(currentFilePath);
    // }
    // return transformer;


}

/*
 * Expose.
 */

module.exports = attacher;

