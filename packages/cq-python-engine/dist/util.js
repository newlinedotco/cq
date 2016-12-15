'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.splitNoParen = splitNoParen;
exports.spawnParseCmd = spawnParseCmd;

var _child_process = require('child_process');

// http://stackoverflow.com/questions/25058134/javascript-split-a-string-by-comma-except-inside-parentheses
function splitNoParen(s) {
  var results = [];
  var next = void 0;
  var str = '';
  var left = 0,
      right = 0;

  function keepResult() {
    results.push(str);
    str = '';
  }

  for (var i = 0; i < s.length; i++) {
    switch (s[i]) {
      case ',':
        if (left === right) {
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
} /**
   * cq utility functions
   */

function spawnParseCmd(content) {
  return new Promise(function (resolve, reject) {
    var spawnOpts = {
      shell: false,
      cwd: __dirname
    };
    var cmd = (0, _child_process.spawn)('python', ['./parser.py', content], spawnOpts);
    var output = '';
    var error = '';
    cmd.stdout.on('data', function (data) {
      return output += data.toString();
    });
    cmd.stdout.on('end', function () {});
    cmd.stderr.on('data', function (data) {
      return error += data.toString();
    });
    cmd.stderr.on('end', function () {});

    cmd.on('exit', function (code) {
      return code !== 0 ? reject({ code: code, error: error }) : resolve({ code: code, output: output });
    });
  });
}