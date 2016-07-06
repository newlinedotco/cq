import 'babel-polyfill';
import chai from 'chai';
let babel = require("babel-core");
let babylon = require("babylon");
const assert = chai.assert;
import cq, { NodeTypes } from '../src/index';

function lines(str, startLine, endLine) {
  return str.split('\n').slice(startLine, endLine + 1).join('\n');
}

describe('babylon', () => {
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

    it('should include extra lines after given a modifier', () => {
      let { code } = cq(someFunctions, 'context(.Farm, 0, 1)');
      const wanted = lines(someFunctions, 9, 10);
      assert.equal(code, wanted);
    })

    it('should include extra lines given a modifier', () => {
      let { code } = cq(someFunctions, 'context(.Farm, 2, 2)');
      const wanted = lines(someFunctions, 7, 11);
      assert.equal(code, wanted);
    })

    it('should include upto something', () => {
      let { code } = cq(someFunctions, '1-upto(.Farm)');
      const wanted = lines(someFunctions, 0, 7);
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

    it('should allow two modifiers', () => {
      let { code } = cq(someFunctions, 'context(1-upto(.Farm), 2, 4)');
      const wanted = lines(someFunctions, 0, 11);
      assert.equal(code, wanted);
    })

    it('should not fail to undent top-level code', () => {
      let { code } = cq(someFunctions, '.hello', {undent: true});
      const wanted = lines(someFunctions, 1, 3);
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

    it('should allow negative context first', () => {
      let { code } = cq(es6Class, 'context(.distance, -1, -1)');
      const wanted = lines(es6Class, 3, 5);
      assert.equal(code, wanted);
    });

    it('should allow negative context', () => {
      let { code } = cq(es6Class, 'context(.Polygon, -4, -4)');
      const wanted = lines(es6Class, 5, 16);
      assert.equal(code, wanted);
    });

    it('should get a constructor', () => {
      let { code } = cq(es6Class, '.constructor');
      const wanted = lines(es6Class, 8, 11);
      assert.equal(code, wanted);
    });

    it('should get a constructor as a child of the class', () => {
      let { code } = cq(es6Class, '.Polygon .constructor');
      const wanted = lines(es6Class, 8, 11);
      assert.equal(code, wanted);
    });

    it('should get a constructor as a child of the class in a range', () => {
      let { code } = cq(es6Class, '.Polygon-(.Polygon .constructor)');
      const wanted = lines(es6Class, 1, 11);
      assert.equal(code, wanted);
    });

    it('should undent indented code', () => {
      let { code } = cq(es6Class, '.area', {undent: true});
      const wanted = `get area() {
  return this.calcArea();
}`
      assert.equal(code, wanted);
    })

  });

  describe('more ES6 Classes', () => {
    const src = `
class Square {
  area() {
    return this.height * this.width;
  }
}

class Circle {
  area() {
    return PI * this.radius ** 2;
  }
}
    `;

    it('return disambiguate based on parent', () => {
      let { code } = cq(src, '.Circle .area');
      const wanted = lines(src, 8, 10);
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

    it('find a child should with the same name', () => {
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

  describe('getting comments', () => {
    const src = `
// hello says hello
// it's the best
function hello() {
  return 'hi';
}

/*
 * @function bye
 */
function bye() {
  return 'see ya';
}

function noComments() {
  return 'nothing to see here';
}
`;

    it('find a group of single-line comments preceeding', () => {
      let { code } = cq(src, "comments(.hello)");
      const wanted = lines(src, 1, 5);
      assert.equal(code, wanted);
    })

    it('find a block comment preceeding', () => {
      let { code } = cq(src, "comments(.bye)");
      const wanted = lines(src, 7, 12);
      assert.equal(code, wanted);
    })

    it('shouldnt fail if you try to get comments where there are none', () => {
      let { code } = cq(src, "comments(.noComments)");
      const wanted = lines(src, 14, 16);
      assert.equal(code, wanted);
    })


  });

  describe('ranges', () => {
    const src = `
import { bootstrap } from 'frobular';

class DemoApp {
}   

let greeting = 'hi';

const routes = [ 
  { path: '', component: DemoApp },
  { path: '/home' }
];

say('hi');

bootstrap(DemoApp, [
  provideRoutes(routes)
]);
`;

    it('should find ranges for identifiers only if they are beyond the start of the range', () => {
      let { code } = cq(src, ".routes-.bootstrap");
      const wanted = lines(src, 8, 17);
      assert.equal(code, wanted);
    })

    it('should find ranges for strings only if they are beyond the start of the range', () => {
      {
        let { code } = cq(src, "'hi'");
        const wanted = lines(src, 6, 6);
        assert.equal(code, wanted);
      }

      {
        let { code } = cq(src, ".routes-'hi'");
        const wanted = lines(src, 8, 13);
        assert.equal(code, wanted);
      }
    })
  });

  describe('disambiguation', () => {
    const src = `
/*
 * Shows the photos
 */
export class PhotosComponent {
  refresh() {
    this.search();
  }

  search() {
    // performs search
  }
}
`;

    it('choose should pick the right element', () => {
      let { code } = cq(src, "choose(.search, 1)");
      const wanted = lines(src, 9, 11);
      assert.equal(code, wanted);
    })

    it('choose should pick the right child selection', () => {
      let { code } = cq(src, "choose(.PhotosComponent .search, 1)");
      const wanted = lines(src, 9, 11);
      assert.equal(code, wanted);
    })
  })


});
