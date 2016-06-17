import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import cq, { NodeTypes } from '../index';

function lines(str, startLine, endLine) {
  return str.split('\n').slice(startLine, endLine + 1).join('\n');
}

describe('cq', () => {
  const babelConfig = { "presets": ["es2015", "react", "stage-0"] };

  describe('createClass', () => {
    const reactCreateClass = `
import React, { PropTypes } from 'react';

const Switch = React.createClass({
  render() {
    return <div>Hi</div>;
  }
});

module.exports = Switch;
    `;

    it('should return a top level identifier', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch'
      }];

      let { code } = cq(reactCreateClass, query, { babel: babelConfig });
      const wanted = lines(reactCreateClass, 3, 7);
      assert.equal(code, wanted);
    });

    it('should return an inner function', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch',
        children: [{
          type: NodeTypes.IDENTIFIER,
          matcher: 'render'
        }]
      }];

      let { code } = cq(reactCreateClass, query, { babel: babelConfig });
      const wanted = lines(reactCreateClass, 4, 6);
      assert.equal(code, wanted);
    });
  });

  describe('top level functions', () => {
    const someFunctions = `
function hello() {
  return 'hello';
}

const bye = function() {
  return 'bye';
} // -> 'bye'

let Farm = () => 'cow';
bye(); // -> 'bye'
// never say goodbye
    `;

    it('should return a function definition', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'hello'
      }];

      let { code } = cq(someFunctions, query, { babel: babelConfig });
      const wanted = lines(someFunctions, 1, 3);
      assert.equal(code, wanted);
    })

    it('should return an anonymous function assigned to a variable', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'bye'
      }];

      let { code } = cq(someFunctions, query, { babel: babelConfig });
      const wanted = lines(someFunctions, 5, 7);
      assert.equal(code, wanted);
    })

    it('should return an arrow function assigned to a variable', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Farm'
      }];

      let { code } = cq(someFunctions, query, { babel: babelConfig });
      const wanted = lines(someFunctions, 9, 9);
      assert.equal(code, wanted);
    })

    it('should include extra lines given a modifier', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Farm',
        modifiers: [{
          type: NodeTypes.EXTRA_LINES,
          amount: -2
        }, {
          type: NodeTypes.EXTRA_LINES,
          amount: 2
        }]
      }];

      let { code } = cq(someFunctions, query, { babel: babelConfig });
      const wanted = lines(someFunctions, 7, 11);
      assert.equal(code, wanted);
    })


    // modifier to plus lines on the end
    // ranges 
    // ranges and modifiers

  })

});
