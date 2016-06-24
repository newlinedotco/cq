import 'babel-polyfill'
import chai from 'chai';
let babel = require("babel-core");
let babylon = require("babylon");
const assert = chai.assert;
import cq, { NodeTypes } from '../src/index';

function lines(str, startLine, endLine) {
  return str.split('\n').slice(startLine, endLine + 1).join('\n');
}

describe('cq', () => {
  describe('createClass', () => {
    const src = `
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

      let { code } = cq(src, query);
      const wanted = lines(src, 3, 7);
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

      let { code } = cq(src, query);
      const wanted = lines(src, 4, 6);
      assert.equal(code, wanted);
    });

    it('should parse string queries', () => {
      let query = '.Switch .render';
      let { code } = cq(src, query);
      const wanted = lines(src, 4, 6);
      assert.equal(code, wanted);
    });

    it('should parse to the EOF', () => {
      let query = '.Switch-EOF';
      let { code } = cq(src, query);
      const wanted = lines(src, 3, 10);
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

      let { code } = cq(someFunctions, query);
      const wanted = lines(someFunctions, 1, 3);
      assert.equal(code, wanted);
    })

    it('should return an anonymous function assigned to a variable', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'bye'
      }];

      let { code } = cq(someFunctions, query);
      const wanted = lines(someFunctions, 5, 7);
      assert.equal(code, wanted);
    })

    it('should return an arrow function assigned to a variable', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Farm'
      }];

      let { code } = cq(someFunctions, query);
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

      let { code } = cq(someFunctions, query);
      const wanted = lines(someFunctions, 7, 11);
      assert.equal(code, wanted);
    })

    it('should get a range', () => {
      let query = [{
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'hello'
        },
        end: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'Farm'
        }
      }];

      let { code } = cq(someFunctions, query);
      const wanted = lines(someFunctions, 1, 9);
      assert.equal(code, wanted);
    })

    it('should get a range with modifiers', () => {
      let query = [{
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'bye'
        },
        end: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'Farm'
        },
        modifiers: [{
          type: NodeTypes.EXTRA_LINES,
          amount: -2
        }, {
          type: NodeTypes.EXTRA_LINES,
          amount: 2
        }]
      }];

      let { code } = cq(someFunctions, query);
      const wanted = lines(someFunctions, 3, 11);
      assert.equal(code, wanted);
    })

    it('should get a range with line numbers', () => {
      let query = [{
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.LINE_NUMBER,
          value: 10
        },
        end: {
          type: NodeTypes.LINE_NUMBER,
          value: 12
        }
      }];

      let { code } = cq(someFunctions, query);
      const wanted = lines(someFunctions, 9, 11);
      assert.equal(code, wanted);
    })
  })


  describe('createClass Plus', () => {
    const reactCreateClass = `
import React, { PropTypes } from 'react';

const Switch = React.createClass({
  cats() {
    return 'cats'
  },

  renderOtherStuff() {
    return <div>Other Stuff</div>;
  },

  render() {
    return <div>{this.renderOtherStuff()}</div>;
  }
});

module.exports = Switch;
    `;

    it('should return an inner range function', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch',
        children: [{
          type: NodeTypes.RANGE,
          start: {
            type: NodeTypes.IDENTIFIER,
            matcher: 'renderOtherStuff'
          }, 
          end: {
            type: NodeTypes.IDENTIFIER,
            matcher: 'render'
          }
        }]
      }];

      let { code } = cq(reactCreateClass, query);
      const wanted = lines(reactCreateClass, 8, 14);
      // console.log('actual', code, 'wanted', wanted);

      assert.equal(code, wanted);
    });
  });

  describe('ES6 Classes', () => {
    const es6Class = `
class Polygon {
  static distance(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx*dx + dy*dy);
  }

  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  
  get area() {
    return this.calcArea();
  }

  calcArea() {
    return this.height * this.width;
  }
}

const square = new Polygon(10, 10);

console.log(square.area);
    `;

    it('return an ES6 class', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Polygon',
       }];

      let { code } = cq(es6Class, query);
      const wanted = lines(es6Class, 1, 20);

      assert.equal(code, wanted);
    });

    it('return functions from within a class', () => {
      let query = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Polygon',
        children: [{
          type: NodeTypes.RANGE,
          start: {
            type: NodeTypes.IDENTIFIER,
            matcher: 'distance'
          },
          end: {
            type: NodeTypes.IDENTIFIER,
            matcher: 'area'
          }
        }]
       }];

      let { code } = cq(es6Class, query);
      const wanted = lines(es6Class, 2, 15);

      assert.equal(code, wanted);
    });
  });

  describe('searching for strings', () => {
    const src = `
import foo from 'bar';
// here is a nice test
describe('My Test', () => {
  it('should pass', () => {
    expect(1).toEqual(1);
  })
});

describe('Other Test', () => {
  it('should pass', () => {
    expect(2).toEqual(2);
  })
});
    `;

    it('find a whole test', () => {
      let { code } = cq(src, "'My Test'");
      const wanted = lines(src, 3, 7);
      assert.equal(code, wanted);
    })

    it('find a child should', () => {
      let { code } = cq(src, "'My Test' 'should pass'");
      const wanted = lines(src, 4, 6);
      assert.equal(code, wanted);
    })

    it.skip('find a child should with the same name', () => {
      let { code } = cq(src, "'Other Test' 'should pass'");
      const wanted = lines(src, 10, 12);
      assert.equal(code, wanted);
    })

    it('find strings in a range', () => {
      let { code } = cq(src, "1-'My Test'");
      const wanted = lines(src, 0, 7);
      assert.equal(code, wanted);
    })
  });

});
