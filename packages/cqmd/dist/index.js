'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _cq = require('@fullstackio/cq');

var _cq2 = _interopRequireDefault(_cq);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('./util');

var _stringReplaceAsync = require('string-replace-async');

var _stringReplaceAsync2 = _interopRequireDefault(_stringReplaceAsync);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * cqmd - a markdown pre-processor to convert cq queries into conventional markdown
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            */


/*
 * Format's cq results into Github-flavored markdown-style code
 */
function formatGfm(results) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var lang = opts.lang ? opts.lang : '';
  return '```' + lang + '\n' + results.code + '\n' + '```';
}

function formatRaw(results) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return results.code;
}

exports.default = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(text) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var replacer, newText;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            opts.format = opts.format || 'gfm';

            replacer = function () {
              var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(match, rawSettings, displayName, actualName, ws, offset, s) {
                var blockOpts, format, fullFilename, contents, cqResults, replacement;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        blockOpts = (0, _util.splitNoParen)(rawSettings).reduce(function (acc, pair) {
                          var _pair$split = pair.split('='),
                              _pair$split2 = _slicedToArray(_pair$split, 2),
                              k = _pair$split2[0],
                              v = _pair$split2[1];

                          acc[k] = v;
                          return acc;
                        }, {});

                        // blocks override the global setting

                        format = blockOpts['format'] ? blockOpts['format'] : opts.format;
                        fullFilename = _path2.default.join(opts.path, actualName);
                        contents = _fs2.default.readFileSync(fullFilename).toString();
                        _context.next = 6;
                        return (0, _cq2.default)(contents, blockOpts['crop-query']);

                      case 6:
                        cqResults = _context.sent;
                        // TODO
                        replacement = void 0;

                        if (!(typeof format === "function")) {
                          _context.next = 10;
                          break;
                        }

                        return _context.abrupt('return', format(cqResults, blockOpts));

                      case 10:
                        _context.t0 = format;
                        _context.next = _context.t0 === 'gfm' ? 13 : _context.t0 === 'raw' ? 15 : 17;
                        break;

                      case 13:
                        replacement = formatGfm(cqResults, blockOpts);
                        return _context.abrupt('break', 18);

                      case 15:
                        replacement = formatRaw(cqResults, blockOpts);
                        return _context.abrupt('break', 18);

                      case 17:
                        throw new Error('unknown format: ' + format);

                      case 18:
                        return _context.abrupt('return', replacement + ws);

                      case 19:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function replacer(_x5, _x6, _x7, _x8, _x9, _x10, _x11) {
                return _ref2.apply(this, arguments);
              };
            }();

            _context2.next = 4;
            return (0, _stringReplaceAsync2.default)(text, /^{(.*?)}\s*\n<<\[(.*?)\]\((.*?)\)(\s*$)/mg, replacer);

          case 4:
            newText = _context2.sent;
            return _context2.abrupt('return', newText);

          case 6:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  function cqmd(_x3) {
    return _ref.apply(this, arguments);
  }

  return cqmd;
}();

module.exports = exports['default'];