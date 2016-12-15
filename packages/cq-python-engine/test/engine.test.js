import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import parser from '../src/index';
import fs from 'fs';
import { join } from 'path'

const fixtureDir = join(__dirname, 'data');
const readFixture = (filepath) => fs.readFileSync(join(fixtureDir, filepath)); 

describe('Python engine', () => {
  let engine, code;

  describe('parse', () => {

    beforeEach(() => {
      engine = new parser();
    });

    it('has a `parse` function', () => {
      assert(typeof engine.parse === 'function');
    });

    it('returns a parsed object from spawn', (done) => {
      code = `
import tensorflow as tf

print("Hello {}".format("world"))`
      engine.parse(code)
        .then(res => {
          assert.equal(res.code, 0);
          assert.deepEqual(Object.keys(res.output), ['Module']);
          done();
        }).catch(done);
    });

    describe('bye.py', () => {
      let res, body;
      beforeEach((done) => {
        code = readFixture('bye.py');
        engine.parse(code)
        .then(result => res = result)
        .then(() => body = res.output.Module.body)
        .then(() => done(null))
        .catch(done);
      });

      it('successfully parses bye.py (exit code = 0)', () => {
        assert.equal(res.code, 0);
      });

      it('catches the Module', () => {
        assert.isNotNull(res.output.Module);
      });

      it('has a body with a comment, function, and an expression', () => {
        assert.equal(body.length, 3);
        assert.deepEqual(Object.keys(body[0]), ['Expr']);
        assert.deepEqual(Object.keys(body[1]), ['FunctionDef']);
        assert.deepEqual(Object.keys(body[2]), ['Expr']);
      });

      it('catches the comment', () => {
        assert.equal(body[0].Expr.value.Str.s, '\nTest program\n')
      })

      it('catches the FunctionDef', () => {
        const fn = body[1].FunctionDef.body;
        assert.equal(fn[0].Return.value.Str.s, 'bye');
      });

    });

    describe('with_imports.py', () => {
      let res, body;
      beforeEach((done) => {
        code = readFixture('with_imports.py')
        engine.parse(code)
        .then(result => res = result)
        .then(() => body = res.output.Module.body)
        .then(() => done(null))
        .catch(done);
      });

      it('successfully parses', () => {
        assert.equal(res.code, 0);
      });

      it('has 2 imports', () => {
        assert.equal(body.length, 3)
        assert(body[0].Import)
        assert(body[1].Import)
      });

      it('has 1 function with a docstring', () => {
        const doc = body[2].FunctionDef.body[0].Expr.value.Str.s;
        assert.deepEqual(doc, '\n    Fake parsing code with arguments\n    ')
      })
    })

  });

});
