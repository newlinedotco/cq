import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import cq, { NodeTypes } from '../../cq/src/index';
import pythonEngine from '../src/index';
const engine = pythonEngine();

function lines(str, startLine, endLine) {
  return str.split('\n').slice(startLine, endLine + 1).join('\n');
}

async function assertQueryLines(rawCode, query, lineRange) {
  let [ startLine, endLine ] = lineRange;
  let { code } = await cq(rawCode, query, { engine });
  const wanted = lines(rawCode, startLine, endLine);
  assert.equal(code, wanted);
}

describe.only('python', () => {

  describe('top level functions', () => {
    const src = `
def hello():
  return "hello";

bye = lambda: "bye"

bye() # -> bye

# never say goodbye`;

    var tests = [
      {
        desc: 'should return a function definition',
        query: '.hello',
        lines: [1, 2] 
      },
      {
        desc: 'should return an anonymous function assigned to a variable',
        query: '.bye',
        lines: [4, 4] 
      }
    ];

    tests.forEach(function(test) {
      it(test.desc, async () => {
        await assertQueryLines(src, test.query, test.lines);
      })
    });

  });

 describe.only('classes', async () => {
    const src = `
import mycats

class Cat(object):

    def __init__(self, name):
        self.name = name

    def meow(self):
        print 'Im a talking cat'

pickles = Cat('pickles')

pickles.meow()
`
    var tests = [
      {
        desc: 'should return an import line',
        query: '.mycats',
        lines: [1, 1] 
      },
      {
        desc: 'should return a class',
        query: '.Cat',
        lines: [3, 9] 
      },
      {
        desc: 'should return a constructor',
        query: '.__init__',
        lines: [5, 6] 
      },
      {
        desc: 'should return a method',
        query: '.meow',
        lines: [8, 9] 
      },
      {
        desc: 'should return an instantiation',
        query: '.pickles',
        lines: [11, 11] 
      }
    ];

    tests.forEach(function(test) {
      it(test.desc, async () => {
        await assertQueryLines(src, test.query, test.lines);
      })
    });
  });

  describe.skip('searching for strings', async () => {
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

    it('find a whole test', async () => {
      let { code } = await cq(src, "'My Test'", {engine: 'typescript'});
      const wanted = lines(src, 3, 7);
      assert.equal(code, wanted);
    })

    it('find a child should', async () => {
      let { code } = await cq(src, "'My Test' 'should pass'", {engine: 'typescript'});
      const wanted = lines(src, 4, 6);
      assert.equal(code, wanted);
    })

    it('find a child should with the same name', async () => {
      let { code } = await cq(src, "'Other Test' 'should pass'", {engine: 'typescript'});
      const wanted = lines(src, 10, 12);
      assert.equal(code, wanted);
    })

    it('find strings in a range', async () => {
      let { code } = await cq(src, "1-'My Test'", {engine: 'typescript'});
      const wanted = lines(src, 0, 7);
      assert.equal(code, wanted);
    })
  });

  describe.skip('getting comments', async () => {
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

    it('find a group of single-line comments preceeding', async () => {
      let { code } = await cq(src, "comments(.hello)", {engine: 'typescript'});
      const wanted = lines(src, 1, 5);
      assert.equal(code, wanted);
    })

    it('find a block comment preceeding', async () => {
      let { code } = await cq(src, "comments(.bye)");
      const wanted = lines(src, 7, 12);
      assert.equal(code, wanted);
    })

    it('shouldnt fail if you try to get comments where there are none', async () => {
      let { code } = await cq(src, "comments(.noComments)");
      const wanted = lines(src, 14, 16);
      assert.equal(code, wanted);
    })

  });

  describe.skip('ranges', async () => {
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

    it('should find ranges for identifiers only if they are beyond the start of the range', async () => {
      let { code } = await cq(src, ".routes-.bootstrap");
      const wanted = lines(src, 8, 17);
      assert.equal(code, wanted);
    })

    it('should find ranges for strings only if they are beyond the start of the range', async () => {
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
    })
  });

  describe.skip('window operator', async () => {
    const src = `
import { bootstrap, provideRouter } from 'frobular';

let config = {
  template: \`
  <h1>Search</h1>
  // hi
  <p>
    <input type="text" #newquery
      [value]="query"
      (keydown.enter)="submit(newquery.value)">
    <button (click)="submit(newquery.value)">Search</button>
  </p>

  <div *ngIf="results">
    <div *ngIf="!results.length">
      No tracks were found with the term '{{ query }}'
    </div>
  \`
  </div>
}
`;

    it('should get lines that are close below', async () => {
      {
        let { code } = await cq(src, "window(.template, 0, 0)", {engine: 'typescript'});
        const wanted = lines(src, 4, 4);
        assert.equal(code, wanted);
      }
      {
        let { code } = await cq(src, "window(.template, 0, 2)", {engine: 'typescript'});
        const wanted = lines(src, 4, 6);
        assert.equal(code, wanted);
      }
      {
        let { code } = await cq(src, "window(.template, 1, 2)", {engine: 'typescript'});
        const wanted = lines(src, 5, 6);
        assert.equal(code, wanted);
      }
      {
        let { code } = await cq(src, "window(.template, 3, 8)", {engine: 'typescript'});
        const wanted = lines(src, 7, 12);
        assert.equal(code, wanted);
      }
    })

    it('should get lines that are close around', async () => {
      let { code } = await cq(src, "window(.template, -1, 1)", {engine: 'typescript'});
      const wanted = lines(src, 3, 5);
      assert.equal(code, wanted);
    })

  });

  describe.skip('disambiguation', async () => {
    const src = `
import { bootstrap, provideRouter } from 'frobular';

bootstrap(RoutesDemoApp, [
  provideRouter(routes),
  provide(LocationStrategy, {useClass: HashLocationStrategy})
]);
`;

    it('should disambiguate children identifiers', async () => {
      let { code } = await cq(src, ".bootstrap .RoutesDemoApp", {engine: 'typescript'});
      const wanted = lines(src, 3, 6);
      assert.equal(code, wanted);
    })

    it('after() should find things properly', async () => {
      let { code } = await cq(src, "after(.bootstrap, .provideRouter)", {engine: 'typescript'});
      const wanted = lines(src, 3, 6);
      assert.equal(code, wanted);
    })

    it('choose() should pick a specific selection', async () => {
      {
        let { code } = await cq(src, "choose(.bootstrap, 0)", {engine: 'typescript'});
        const wanted = lines(src, 1, 1);
        assert.equal(code, wanted);
      }
      {
        let { code } = await cq(src, "choose(.bootstrap, 1)", {engine: 'typescript'});
        const wanted = lines(src, 3, 6);
        assert.equal(code, wanted);
      }
    })

  });

  describe.skip('Decorators', async () => {
    const src = `
/*
 * My thing is a decorated class
 */
@Component({
  foo: 'bar',
  baz: 'bam
})
class FooBar {
}
`;

    it('should get the decorator alone as a child of the class', async () => {
      let { code } = await cq(src, ".FooBar .Component", {engine: 'typescript'});
      const wanted = lines(src, 4, 7);
      assert.equal(code, wanted);
    })

    it('should get decorator alone as an identifier', async () => {
      let { code } = await cq(src, ".Component", {engine: 'typescript'});
      const wanted = lines(src, 4, 7);
      assert.equal(code, wanted);
    })

    it('should get the class alone as an identifier', async () => {
      let { code } = await cq(src, ".FooBar", {engine: 'typescript'});
      const wanted = lines(src, 8, 9);
      assert.equal(code, wanted);
    })

    it('should get the class with decorator when using decorators()', async () => {
      let { code } = await cq(src, "decorators(.FooBar)", {engine: 'typescript'});
      const wanted = lines(src, 4, 9);
      assert.equal(code, wanted);
    })

    it('should get the class with decorator and comments with operations', async () => {
      let { code } = await cq(src, "comments(decorators(.FooBar))", {engine: 'typescript'});
      const wanted = lines(src, 1, 9);
      assert.equal(code, wanted);
    })

    const src2 = `
@Foobarable()
class FooBar {
}
`;

    it('should get a single-line decorator', async () => {
      let { code } = await cq(src2, "decorators(.FooBar)", {engine: 'typescript'});
      const wanted = lines(src2, 1, 3);
      assert.equal(code, wanted);
    })

    const src3 = `
@Foobarable()
@Bambazable()
class FooBar {
}
`;

    it('should get all decorators', async () => {
      let { code } = await cq(src3, "decorators(.FooBar)", {engine: 'typescript'});
      const wanted = lines(src3, 1, 4);
      assert.equal(code, wanted);
    })

  });

  describe.skip('special identifiers', async () => {
    const src = `
/*
 * A Barn is where you keep animals
 */
class Barn {
  color: string;

  constructor() {
    color = 'red';
  }
}
`;

    it('should get a constructor', async () => {
      let { code } = await cq(src, ".Barn .constructor", {engine: 'typescript'});
      const wanted = lines(src, 7, 9);
      assert.equal(code, wanted);
    })

    it('should get a constructor as part of a child range', async () => {
      let { code } = await cq(src, ".Barn-(.Barn .constructor)", {engine: 'typescript'});
      const wanted = lines(src, 4, 9);
      assert.equal(code, wanted);
    })

  });


});
