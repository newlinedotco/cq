'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          * cqmd - a markdown pre-processor to convert cq queries into conventional markdown
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          */


exports.default = cqmd;

var _cq = require('@fullstackio/cq');

var _cq2 = _interopRequireDefault(_cq);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// http://stackoverflow.com/questions/25058134/javascript-split-a-string-by-comma-except-inside-parentheses
function splitNoParen(s) {
  var left = 0,
      right = 0,
      A = [],
      M = s.match(/([^()]+)|([()])/g),
      L = M.length,
      next,
      str = '';
  for (var i = 0; i < L; i++) {
    next = M[i];
    if (next === '(') ++left;else if (next === ')') ++right;
    if (left !== 0) {
      str += next;
      if (left === right) {
        A[A.length - 1] += str;
        left = right = 0;
        str = '';
      }
    } else A = A.concat(next.match(/([^,]+)/g));
  }
  return A;
}

/*
 * Format's cq results into Github-flavored markdown-style code
 */
function formatGfm(results) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var lang = opts.lang ? opts.lang : '';
  return '```' + lang + '\n' + results.code + '\n' + '```' + '\n';
}

function formatRaw(results) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  return results.code + '\n';
}

function cqmd(text) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  opts.format = opts.format || 'gfm';

  var newText = text.replace(/^{(.*?)}\s*\n<<\[(.*?)\]\((.*?)\)\s*$/mg, function (match, rawSettings, displayName, actualName, offset, s) {
    var blockOpts = splitNoParen(rawSettings).reduce(function (acc, pair) {
      var _pair$split = pair.split('=');

      var _pair$split2 = _slicedToArray(_pair$split, 2);

      var k = _pair$split2[0];
      var v = _pair$split2[1];

      acc[k] = v;
      return acc;
    }, {});

    // blocks override the global setting
    if (blockOpts['format']) {
      opts.format = blockOpts['format'];
    }

    var fullFilename = _path2.default.join(opts.path, actualName);
    var contents = _fs2.default.readFileSync(fullFilename).toString();
    var cqResults = (0, _cq2.default)(contents, blockOpts['crop-query']);
    var replacement = void 0;

    if (typeof opts.format === "function") {
      return opts.format(cqResults, blockOpts);
    }

    switch (opts.format) {
      case 'gfm':
        replacement = formatGfm(cqResults, blockOpts);
        break;
      case 'raw':
        replacement = formatRaw(cqResults, blockOpts);
        break;
      default:
        throw new Error('unknown format: ' + opts.format);
    }

    return replacement;
  });
  return newText;
}
module.exports = exports['default'];