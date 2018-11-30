"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rangeExtents = rangeExtents;
/**
 * cq Engine Util
 *
 * Utility functions
 *
 */

function rangeExtents(ranges) {
  var start = Number.MAX_VALUE;
  var end = Number.MIN_VALUE;
  ranges.map(function (_ref) {
    var rs = _ref.start,
        re = _ref.end;

    start = Math.min(start, rs);
    end = Math.max(end, re);
  });
  return { start: start, end: end };
}

exports.default = {
  rangeExtents: rangeExtents
};