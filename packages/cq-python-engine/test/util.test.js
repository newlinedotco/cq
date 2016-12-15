import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import cqmd from '../src/index';
import fs from 'fs';
import { splitNoParen, spawnParseCmd } from '../src/util';

describe('python engine util', () => {
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

    it.skip('returns a zero edit code with real python code', (done) => {
      code = `
import numpy as np

def calculate(a, b):
    return a + b;`
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
