'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.spawnParseCmd = spawnParseCmd;

var _child_process = require('child_process');

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
} /**
   * cq-python-engine utility functions
   */