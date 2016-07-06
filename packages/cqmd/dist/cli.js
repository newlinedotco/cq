#!/usr/bin/env node
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

require('babel-polyfill');

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * A markdown preprocessor that parses cq directives and replaces them with code blocks
 */
var argv = _yargs2.default.usage('Usage: $0 [options] <file>').example("$0 post.md", "process post.md and emit the results on STDOUT").help('help').alias('help', 'h').option('output', {
  alias: 'o',
  type: 'string',
  describe: 'Specify the output file'
}).option('path', {
  alias: 'p',
  type: 'string',
  describe: 'The root path for the code '
}).option('format', {
  alias: 'f',
  describe: 'the format to convert codeblocks into',
  // choices: ['gfm', 'block', 'leanpub', 'raw'],
  choices: ['gfm', 'raw'],
  default: 'gfm'
}).version().argv;

var _argv$_ = _slicedToArray(argv._, 1);

var filename = _argv$_[0];


var inputStream = filename ? _fs2.default.createReadStream(filename) : process.stdin;

// no filename nor stdin, so show the help
if (!filename && process.stdin.isTTY) {
  _yargs2.default.showHelp();
  process.exit();
}

var content = '';
inputStream.resume();
inputStream.on('data', function (buf) {
  content += buf.toString();
});
inputStream.on('end', function () {
  var result = (0, _index2.default)(content, argv);
  if (argv.output) {
    _fs2.default.writeFileSync(argv.output, result);
  } else {
    process.stdout.write(result);
  }
});