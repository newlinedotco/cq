#!/usr/bin/env node
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var argv = _yargs2.default.usage('Usage: $0 [options] <query> <file>').example("$0 '.MyClass .fooFunction'", "show code for fooFunction() in MyClass").help('help').alias('help', 'h').option('json', {
  alias: 'j',
  type: 'boolean',
  describe: 'Output results in machine-readable format'
}).argv;

var _argv$_ = _slicedToArray(argv._, 2);

var query = _argv$_[0];
var filename = _argv$_[1];


if (!query) {
  _yargs2.default.showHelp();
  process.exit();
}

var inputStream = filename ? _fs2.default.createReadStream(filename) : process.stdin;

var content = '';
inputStream.resume();
inputStream.on('data', function (buf) {
  content += buf.toString();
});
inputStream.on('end', function () {
  var result = (0, _index2.default)(content, query);

  if (argv.json === true) {
    delete result['nodes'];
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.code);
  }
});