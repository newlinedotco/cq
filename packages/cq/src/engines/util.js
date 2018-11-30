/**
 * cq Engine Util
 *
 * Utility functions
 *
 */

export function rangeExtents(ranges) {
  let start = Number.MAX_VALUE;
  let end = Number.MIN_VALUE;
  ranges.map(({ start: rs, end: re }) => {
    start = Math.min(start, rs);
    end = Math.max(end, re);
  });
  return { start, end };
}

export default {
  rangeExtents
};
