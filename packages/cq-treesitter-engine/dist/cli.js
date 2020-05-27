'use strict';

require('babel-polyfill');

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _stream = require('stream');

var _util = require('./util');

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * A python preprocessor that parses python code into JSON 
 */
var argv = _yargs2.default.usage('Usage: $0 -file somefile.py -f json').example("$0 -input 'source code'", "process input source and emit the results on STDOUT as JSON").help('help').alias('help', 'h').option('input', {
  alias: 'i',
  describe: 'Input code',
  coerce: function coerce(arg) {
    var s = new _stream.Readable();
    s._read = function () {};
    s.push(arg);
    s.push(null);
    return s;
  }
}).option('source', {
  alias: 's',
  describe: 'Input source file',
  coerce: function coerce(arg) {
    return require('fs').createReadStream(arg);
  }
}).option('format', {
  alias: 'f',
  describe: 'the format to convert codeblocks into (json)',
  // choices: ['gfm', 'block', 'leanpub', 'raw'],
  choices: ['json'],
  default: 'json'
}).version().argv;

var inputStream = argv.source || argv.input || process.stdin;

// no filename nor stdin, so show the help
if (!inputStream) {
  _yargs2.default.showHelp();
  process.exit();
}

var content = '';
inputStream.resume();
inputStream.on('data', function (buf) {
  content += buf.toString();
});
inputStream.on('end', function () {
  (0, _util.spawnParseCmd)(content).then(function (_ref) {
    var code = _ref.code,
        output = _ref.output;

    var engine = new _index2.default();
    var tree = JSON.parse(output);
    var res = engine.getInitialRoot(tree);
    console.log(res);
  }).catch(function (err) {
    console.log('err ->', err);
  });
});