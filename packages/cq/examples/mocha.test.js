/**
 * Here are some queries to try:
 *
 * ```
 * # get the first test 
 * cq "'My First Test'" examples/mocha.test.js
 *
 * # get the assert in the second test
 * cq "'My Second Test' 'basic assert'" examples/mocha.test.js
 * ```
 */

import chai from 'chai';
const assert = chai.assert;

describe('My First Test', () => {
  it('basic assert', () => {
    assert.equal(1, 1);
  });
});

describe('My Second Test', () => {
  it('basic assert', () => {
    // this is the second one
    assert.equal(2, 2);
  });
});
