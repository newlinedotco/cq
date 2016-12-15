import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import cqmd from '../src/index';
import fs from 'fs';
import { splitNoParen, spawnParseCmd } from '../src/util';

describe('python engine util', () => {
  describe('splitNoParen', () => {

    it('should split in the simple case', () => {
      assert.deepEqual(splitNoParen('foo,bar,baz'), ['foo', 'bar', 'baz']);
    });

    it('should split function calls', () => {
      assert.deepEqual(splitNoParen('foo,bam(0), baz'), ['foo', 'bam(0)', ' baz']);
    });

    it('should allow ranges', () => {
      assert.deepEqual(splitNoParen('foo-bar,baz'), ['foo-bar', 'baz']);
    });

    it('should functions at the start of ranges', () => {
      assert.deepEqual(splitNoParen('cats,foo(.fs)-bar,baz'), ['cats', 'foo(.fs)-bar', 'baz']);
    });

    it('should functions at the end of ranges', () => {
      assert.deepEqual(splitNoParen('cats,bar-foo(.fs),baz'), ['cats', 'bar-foo(.fs)', 'baz']);
    });

    it('should allow groupings at the start of ranges', () => {
      assert.deepEqual(splitNoParen('cats,(.fs-.foo)-.bar,baz'), ['cats', '(.fs-.foo)-.bar', 'baz']);
    });

    it('should allow groupings at the end of ranges', () => {
      assert.deepEqual(splitNoParen('cats,.bar-(.fs-.foo),baz'), ['cats', '.bar-(.fs-.foo)', 'baz']);
    });

    it('should allow function arguments', () => {
      assert.deepEqual(splitNoParen('cats,.bar(.fs, .foo),baz'), ['cats', '.bar(.fs, .foo)', 'baz']);
    });

    it('should allow nested functions', () => {
      assert.deepEqual(splitNoParen('cats,.bar(bam(.fs, .qs), .foo),baz'), ['cats', '.bar(bam(.fs, .qs), .foo)', 'baz']);
    });

    it('should parse the SO question', () => {
      assert.deepEqual(splitNoParen('"abc",ab(),c(d(),e()),f(g(),zyx),h(123)'), ['"abc"', 'ab()', 'c(d(),e())','f(g(),zyx)', 'h(123)' ]);
    });

  });

  describe('spawnParseCmd', () => {
    let code;

    it('returns a non-zero exit code with fake python code', (done) => {
      code = `not really "python"`
      spawnParseCmd(code)
      .catch(err => {
        assert.notEqual(err.code, 0)
        done();
      });
    });

    it('returns a zero edit code with real python code', (done) => {
      code = `
import numpy as np

def calculate(a, b):
    return a + b;
      `
      spawnParseCmd(code)
      .then(res => {
        assert.equal(res.code, 0);
        let json = JSON.parse(res.output);
        assert.deepEqual(Object.keys(json), ['Module']);
        done();
      })
      .catch(done);
    });

  });
});
