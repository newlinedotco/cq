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

    it.skip('should return a top level identifier', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch'
      }];

      let { code } = cq(reactCreateClass, query, { babel: babelConfig });
      const wanted = lines(reactCreateClass, 3, 7);
      assert.equal(wanted, code);
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
      assert.equal(wanted, code);

      // let query = [{
      //   type: 'IDENTIFIER',
      //   matcher: 'Switch'
      // }];

      // let { code } = cq(reactCreateClass, query, { babel: babelConfig });
      // const wanted = lines(reactCreateClass, 3, 7);
      // assert.equal(wanted, code);
    });


  });
});
