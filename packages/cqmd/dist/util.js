'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.splitNoParen = splitNoParen;
/**
 * cqmd utility functions
 */

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
}