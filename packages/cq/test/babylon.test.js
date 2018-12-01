import "babel-polyfill";
import chai from "chai";
let babel = require("babel-core");
let babylon = require("babylon");
const assert = chai.assert;
import cq, { NodeTypes } from "../src/index";

function lines(str, startLine, endLine) {
  return str
    .split("\n")
    .slice(startLine, endLine + 1)
    .join("\n");
}

describe("babylon", async () => {
  describe("createClass", async () => {
    const src = `
import React, { PropTypes } from 'react';

const Switch = React.createClass({
  render() {
    return <div>Hi</div>;
  }
});

module.exports = Switch;
    `;

    it("should return a top level identifier", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "Switch"
        }
      ];

      let { code } = await cq(src, query);
      const wanted = lines(src, 3, 7);
      assert.equal(code, wanted);
    });

    it("should return an inner function", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "Switch",
          children: [
            {
              type: NodeTypes.IDENTIFIER,
              matcher: "render"
            }
          ]
        }
      ];

      let { code } = await cq(src, query);
      const wanted = lines(src, 4, 6);
      assert.equal(code, wanted);
    });

    it("should parse string queries", async () => {
      let query = ".Switch .render";
      let { code } = await cq(src, query);
      const wanted = lines(src, 4, 6);
      assert.equal(code, wanted);
    });

    it("should parse to the EOF", async () => {
      let query = ".Switch-EOF";
      let { code } = await cq(src, query);
      const wanted = lines(src, 3, 10);
      assert.equal(code, wanted);
    });
  });

  describe("top level functions", async () => {
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

    it("should return a function definition", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "hello"
        }
      ];

      let { code } = await cq(someFunctions, query);
      const wanted = lines(someFunctions, 1, 3);
      assert.equal(code, wanted);
    });

    it("should return an anonymous function assigned to a variable", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "bye"
        }
      ];

      let { code } = await cq(someFunctions, query);
      const wanted = lines(someFunctions, 5, 7);
      assert.equal(code, wanted);
    });

    it("should return an arrow function assigned to a variable", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "Farm"
        }
      ];

      let { code } = await cq(someFunctions, query);
      const wanted = lines(someFunctions, 9, 9);
      assert.equal(code, wanted);
    });

    it("should include extra lines after given a modifier", async () => {
      let { code } = await cq(someFunctions, "context(.Farm, 0, 1)");
      const wanted = lines(someFunctions, 9, 10);
      assert.equal(code, wanted);
    });

    it("should include extra lines given a modifier", async () => {
      let { code } = await cq(someFunctions, "context(.Farm, 2, 2)");
      const wanted = lines(someFunctions, 7, 11);
      assert.equal(code, wanted);
    });

    it("should include upto something", async () => {
      let { code } = await cq(someFunctions, "1-upto(.Farm)");
      const wanted = lines(someFunctions, 0, 7);
      assert.equal(code, wanted);
    });

    it("should get a range", async () => {
      let query = [
        {
          type: NodeTypes.RANGE,
          start: {
            type: NodeTypes.IDENTIFIER,
            matcher: "hello"
          },
          end: {
            type: NodeTypes.IDENTIFIER,
            matcher: "Farm"
          }
        }
      ];

      let { code } = await cq(someFunctions, query);
      const wanted = lines(someFunctions, 1, 9);
      assert.equal(code, wanted);
    });

    it("should get a range with line numbers", async () => {
      let query = [
        {
          type: NodeTypes.RANGE,
          start: {
            type: NodeTypes.LINE_NUMBER,
            value: 10
          },
          end: {
            type: NodeTypes.LINE_NUMBER,
            value: 12
          }
        }
      ];

      let { code } = await cq(someFunctions, query);
      const wanted = lines(someFunctions, 9, 11);
      assert.equal(code, wanted);
    });

    it("should allow two modifiers", async () => {
      let { code } = await cq(someFunctions, "context(1-upto(.Farm), 2, 4)");
      const wanted = lines(someFunctions, 0, 11);
      assert.equal(code, wanted);
    });

    it("should not fail to undent top-level code", async () => {
      let { code } = await cq(someFunctions, ".hello", { undent: true });
      const wanted = lines(someFunctions, 1, 3);
      assert.equal(code, wanted);
    });
  });

  describe("createClass Plus", async () => {
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

    it("should return an inner range function", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "Switch",
          children: [
            {
              type: NodeTypes.RANGE,
              start: {
                type: NodeTypes.IDENTIFIER,
                matcher: "renderOtherStuff"
              },
              end: {
                type: NodeTypes.IDENTIFIER,
                matcher: "render"
              }
            }
          ]
        }
      ];

      let { code } = await cq(reactCreateClass, query);
      const wanted = lines(reactCreateClass, 8, 14);
      // console.log('actual', code, 'wanted', wanted);

      assert.equal(code, wanted);
    });

    it("should extract code with gaps", async () => {
      let { code } = await cq(
        reactCreateClass,
        "window(.Switch, 0, 0), .renderOtherStuff, window(.Switch, 0, 0, true)",
        { gapFiller: "\n  // ...\n" }
      );

      console.log("code", code);
      const wanted = `const Switch = React.createClass({
  // ...
  renderOtherStuff() {
    return <div>Other Stuff</div>;
  },
  // ...
});`;

      assert.equal(code, wanted);
    });

    it("should extract code with gaps and contiguous", async () => {
      let { code } = await cq(
        reactCreateClass,
        "window(.Switch, 0, 0), .render, window(.Switch, 0, 0, true)",
        { gapFiller: "\n  // ...\n" }
      );

      console.log("code", code);
      const wanted = `const Switch = React.createClass({
  // ...
  render() {
    return <div>{this.renderOtherStuff()}</div>;
  }
});`;

      assert.equal(code, wanted);
    });

    describe("reverseWindow", async () => {
      it("should extract code from the end", async () => {
        let { code } = await cq(
          reactCreateClass,
          "window(.Switch, -2, 0, true)"
        );

        const wanted = `    return <div>{this.renderOtherStuff()}</div>;
  }
});`;

        assert.equal(code, wanted);
      });

      it("should extract code from the end", async () => {
        let { code } = await cq(
          reactCreateClass,
          "window(.Switch, 0, 0, true)"
        );
        const wanted = `});`;
        assert.equal(code, wanted);
      });
    });
  });

  describe("ES6 Classes", async () => {
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

    it("return an ES6 class", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "Polygon"
        }
      ];

      let { code } = await cq(es6Class, query);
      const wanted = lines(es6Class, 1, 20);

      assert.equal(code, wanted);
    });

    it("return functions from within a class", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "Polygon",
          children: [
            {
              type: NodeTypes.RANGE,
              start: {
                type: NodeTypes.IDENTIFIER,
                matcher: "distance"
              },
              end: {
                type: NodeTypes.IDENTIFIER,
                matcher: "area"
              }
            }
          ]
        }
      ];

      let { code } = await cq(es6Class, query);
      const wanted = lines(es6Class, 2, 15);

      assert.equal(code, wanted);
    });

    it("should allow negative context first", async () => {
      let { code } = await cq(es6Class, "context(.distance, -1, -1)");
      const wanted = lines(es6Class, 3, 5);
      assert.equal(code, wanted);
    });

    it("should allow negative context", async () => {
      let { code } = await cq(es6Class, "context(.Polygon, -4, -4)");
      const wanted = lines(es6Class, 5, 16);
      assert.equal(code, wanted);
    });

    it("should get a constructor", async () => {
      let { code } = await cq(es6Class, ".constructor");
      const wanted = lines(es6Class, 8, 11);
      assert.equal(code, wanted);
    });

    it("should get a constructor as a child of the class", async () => {
      let { code } = await cq(es6Class, ".Polygon .constructor");
      const wanted = lines(es6Class, 8, 11);
      assert.equal(code, wanted);
    });

    it("should get a constructor as a child of the class in a range", async () => {
      let { code } = await cq(es6Class, ".Polygon-(.Polygon .constructor)");
      const wanted = lines(es6Class, 1, 11);
      assert.equal(code, wanted);
    });

    it("should undent indented code", async () => {
      let { code } = await cq(es6Class, ".area", { undent: true });
      const wanted = `get area() {
  return this.calcArea();
}`;
      assert.equal(code, wanted);
    });
  });

  describe("JSX", async () => {
    const funcWithJSX = `
function submitButton (props) {
  const submitText = props.isCreate ? 'Create' : 'Update';
  return (
    <div className='content'>
      <div className='field'>
        <label>Add Name</label>
        <input
          type='text'
          ref='name'
        />
      </div>
      <SubmitButton
        text={submitText}
        onSubmit={props.onSubmit}
      />
    </div>
  );
}
    `;

    it("returns a multi-line JSX element", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "SubmitButton"
        }
      ];

      let { code } = await cq(funcWithJSX, query);
      const wanted = lines(funcWithJSX, 12, 15);

      assert.equal(code, wanted);
    });

    it("returns a single-line JSX element", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "label"
        }
      ];

      let { code } = await cq(funcWithJSX, query);
      const wanted = lines(funcWithJSX, 6, 6);

      assert.equal(code, wanted);
    });

    it("returns an in-line code expression", async () => {
      let query = "choose(.submitText, 1)";

      let { code } = await cq(funcWithJSX, query);
      const wanted = lines(funcWithJSX, 13, 13);

      assert.equal(code, wanted);
    });

    it("returns an attribute on a JSX element", async () => {
      let query = ".SubmitButton.onSubmit";

      let { code } = await cq(funcWithJSX, query);
      const wanted = lines(funcWithJSX, 14, 14);

      assert.equal(code, wanted);
    });

    it("returns a range of attributes on a JSX element", async () => {
      let query = ".SubmitButton .submitText-.onSubmit";

      let { code } = await cq(funcWithJSX, query);
      const wanted = lines(funcWithJSX, 13, 14);

      assert.equal(code, wanted);
    });
  });

  describe("more ES6 Classes", async () => {
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

    it("return disambiguate based on parent", async () => {
      let { code } = await cq(src, ".Circle .area");
      const wanted = lines(src, 8, 10);
      assert.equal(code, wanted);
    });
  });

  describe("searching for strings", async () => {
    const src = `
import foo from 'bar';
// here is a nice test
describe('My Test', async () => {
  it('should pass', async () => {
    expect(1).toEqual(1);
  })
});

describe('Other Test', async () => {
  it('should pass', async () => {
    expect(2).toEqual(2);
  })
});
    `;

    it("find a whole test", async () => {
      let { code } = await cq(src, "'My Test'");
      const wanted = lines(src, 3, 7);
      assert.equal(code, wanted);
    });

    it("find a child should", async () => {
      let { code } = await cq(src, "'My Test' 'should pass'");
      const wanted = lines(src, 4, 6);
      assert.equal(code, wanted);
    });

    it("find a child should with the same name", async () => {
      let { code } = await cq(src, "'Other Test' 'should pass'");
      const wanted = lines(src, 10, 12);
      assert.equal(code, wanted);
    });

    it("find strings in a range", async () => {
      let { code } = await cq(src, "1-'My Test'");
      const wanted = lines(src, 0, 7);
      assert.equal(code, wanted);
    });
  });

  describe("getting comments", async () => {
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

    it("find a group of single-line comments preceeding", async () => {
      let { code } = await cq(src, "comments(.hello)");
      const wanted = lines(src, 1, 5);
      assert.equal(code, wanted);
    });

    it("find a block comment preceeding", async () => {
      let { code } = await cq(src, "comments(.bye)");
      const wanted = lines(src, 7, 12);
      assert.equal(code, wanted);
    });

    it("shouldnt fail if you try to get comments where there are none", async () => {
      let { code } = await cq(src, "comments(.noComments)");
      const wanted = lines(src, 14, 16);
      assert.equal(code, wanted);
    });
  });

  describe("ranges", async () => {
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

    it("should find ranges for identifiers only if they are beyond the start of the range", async () => {
      let { code } = await cq(src, ".routes-.bootstrap");
      const wanted = lines(src, 8, 17);
      assert.equal(code, wanted);
    });

    it("should find ranges for strings only if they are beyond the start of the range", async () => {
      {
        let { code } = await cq(src, "'hi'");
        const wanted = lines(src, 6, 6);
        assert.equal(code, wanted);
      }

      {
        let { code } = await cq(src, ".routes-'hi'");
        const wanted = lines(src, 8, 13);
        assert.equal(code, wanted);
      }
    });

    it("should have comment separators for discontiguous queries", async () => {
      {
        let { code } = await cq(src, ".bootstrap, .routes", {
          gapFiller: "\n// ...\n"
        });

        const wanted = `import { bootstrap } from 'frobular';
// ...
const routes = [ 
  { path: '', component: DemoApp },
  { path: '/home' }
];`;

        assert.equal(code, wanted);
        // test - normal sep case
        // test - contig case
        // test - getting class, then render w/ gap
      }
    });
  });

  describe("disambiguation", async () => {
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

    it("choose should pick the right element", async () => {
      let { code } = await cq(src, "choose(.search, 1)");
      const wanted = lines(src, 9, 11);
      assert.equal(code, wanted);
    });

    it("choose should pick the right child selection", async () => {
      let { code } = await cq(src, "choose(.PhotosComponent .search, 1)");
      const wanted = lines(src, 9, 11);
      assert.equal(code, wanted);
    });
  });

  describe("More JSX", async () => {
    const src = `
    const EditableTimerList = React.createClass({
      render: function () {
        // Inside EditableTimerList.render()
        const timers = this.props.timers.map((timer) => (
          <EditableTimer
            key={timer.id}
            id={timer.id}
          />
        ));
        return (
          <div id='timers'>
            {timers}
          </div>
        );
      },
    });

    const EditableTimer = React.createClass({
      getInitialState: function () {
        return {
          editFormOpen: false,
        };
      },
      render: function () {
        return (
            <Timer
              id={this.props.id}
              title={this.props.title}
            />
        );
      },
    });
    `;

    it("Find a JSXIdentifier as an identifier", async () => {
      let { code } = await cq(src, ".Timer");
      const wanted = lines(src, 26, 29);
      assert.equal(code, wanted);
    });

    it("Find a JSXIdentifier child identifier", async () => {
      let { code } = await cq(src, ".EditableTimer .Timer");
      const wanted = lines(src, 26, 29);
      assert.equal(code, wanted);
    });
  });

  describe("more components", async () => {
    const src = `
import React, { PropTypes } from 'react';

class ThreadList extends React.Component {
  static contextTypes = {
    users: PropTypes.array,
  };

  render() {
    return (
      <div className={styles.threadList}>
      </div>
    );
  }
}

class ChatWindow extends React.Component {
  static propTypes = {
    messages: PropTypes.object,
  };

  static contextTypes = {
    userMap: PropTypes.object,
  };

  render() {
    return (
      <div className={styles.chat}>
      </div>
    );
  }
}

`;

    it("should grab firstLineOf", async () => {
      let { code } = await cq(
        src,
        "firstLineOf(.ThreadList),.ThreadList .contextTypes,lastLineOf(.ThreadList)",
        {
          gapFiller: "\n  // ...\n"
        }
      );
      const wanted = `class ThreadList extends React.Component {
  static contextTypes = {
    users: PropTypes.array,
  };
  // ...
}`;
      assert.equal(code, wanted);
    });

    it("should properly add continuous newlines", async () => {
      let { code } = await cq(
        src,
        "window(.ThreadList,0,0),.contextTypes,window(.ThreadList,0,0,true)",
        {
          gapFiller: "\n  // ...\n"
        }
      );
      const wanted = `class ThreadList extends React.Component {
  static contextTypes = {
    users: PropTypes.array,
  };
  // ...
}`;
      assert.equal(code, wanted);
    });

    it("should properly add continuous newlines again", async () => {
      let { code } = await cq(
        src,
        "window(.ThreadList,0,0),.contextTypes,window(.ThreadList,0,0,true),window(.ChatWindow,0,0),.ChatWindow .contextTypes,window(.ChatWindow,0,0,true)",
        {
          gapFiller: "\n  // ...\n"
        }
      );
      //       let { code } = await cq(src, "firstLineOf(.ThreadList),.contextTypes,lastLineOf(.ThreadList),firstLineOf(.ChatWindow),.ChatWindow .contextTypes,lastLineOf(.ChatWindow)", {
      const wanted = `class ThreadList extends React.Component {
  static contextTypes = {
    users: PropTypes.array,
  };
  // ...
}
  // ...
class ChatWindow extends React.Component {
  // ...
  static contextTypes = {
    userMap: PropTypes.object,
  };
  // ...
}`;
      assert.equal(code, wanted);
    });
  });

  describe("even more components", async () => {
    const src = `
import React from 'react';

class Clock extends React.Component {

  constructor(props) {
    super(props);
    this.state = this.getTime();
  }

  getTime() {
    const currentTime = new Date();
    return {
      hours: currentTime.getHours(),
      minutes: currentTime.getMinutes(),
      seconds: currentTime.getSeconds(),
      ampm: currentTime.getHours() >= 12 ? 'pm' : 'am'
    }
  }

  render() {
    const {hours, minutes, seconds, ampm} = this.state;
    return (
      <div className="clock">
        {ampm}
      </div>
    )
  }
}

export default Clock`;

    it("should grab render with ellipsis", async () => {
      let { code } = await cq(
        src,
        "(firstLineOf(.Clock),.render,lastLineOf(.Clock),choose(.Clock,1))",
        {
          gapFiller: "\n  // ...\n"
        }
      );
      const wanted = `class Clock extends React.Component {
  // ...
  render() {
    const {hours, minutes, seconds, ampm} = this.state;
    return (
      <div className="clock">
        {ampm}
      </div>
    )
  }
}
  // ...
export default Clock`;
      assert.equal(code, wanted);
    });
  });

  describe("more JavaScript", async () => {
    const jsCode = `var a = 1;
function hello() {
  return 'hello';
}`;

    it("should return the very first character in a string", async () => {
      let query = [
        {
          type: NodeTypes.IDENTIFIER,
          matcher: "a"
        }
      ];

      let { code } = await cq(jsCode, query);
      const wanted = "var a = 1;";
      assert.equal(code, wanted);
    });
  });
});
