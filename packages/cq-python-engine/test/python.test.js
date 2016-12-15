import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import cq, { NodeTypes } from '@fullstackio/cq';
import pythonEngine from '../src/index';
const engine = pythonEngine();

function lines(str, startLine, endLine) {
  return str.split('\n').slice(startLine, endLine + 1).join('\n');
}

describe.only('python', () => {

  describe('top level functions', () => {
    const someFunctions = `
def hello():
  return "hello";

bye = lambda: "bye"

bye() # -> bye

# never say goodbye`;

    it('should return a function definition', () => {
      let { code } = cq(someFunctions, '.hello', { engine });
      const wanted = lines(someFunctions, 1, 2);
      assert.equal(code, wanted);
    })

    // it('should return an anonymous function assigned to a variable', () => {
    //   let { code } = cq(someFunctions, '.bye', {engine: 'typescript'});
    //   const wanted = lines(someFunctions, 5, 7);
    //   assert.equal(code, wanted);
    // })

    // it('should return an arrow function assigned to a variable', () => {
    //   let { code } = cq(someFunctions, '.Farm', {engine: 'typescript'});
    //   const wanted = lines(someFunctions, 9, 9);
    //   assert.equal(code, wanted);
    // })

  });

 describe.skip('Angular Code', () => {
    const src = `
import {Injectable, provide} from '@angular/core';

@Injectable()
export class AuthService {
  login(user: string, password: string): boolean {
    if (user === 'user' && password === 'password') {
      localStorage.setItem('username', user);
      return true;
    }

    return false;
  }

  logout(): any {
    localStorage.removeItem('username');
  }

  getUser(): any {
    return localStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }
}

export var AUTH_PROVIDERS: Array<any> = [
  provide(AuthService, {useClass: AuthService})
];
`
    it('should extract a class', () => {
      let { code } = cq(src, '.AuthService', {engine: 'typescript'});
      const wanted = lines(src, 4, 25);
      assert.equal(code, wanted);
    })

    it('should extract a class with decorator', () => {
      let { code } = cq(src, 'decorators(.AuthService)', {engine: 'typescript'});
      const wanted = lines(src, 3, 25);
      assert.equal(code, wanted);
    })

    it('should extract a specific method', () => {
      let { code } = cq(src, '.AuthService .login', {engine: 'typescript'});
      const wanted = lines(src, 5, 12);
      assert.equal(code, wanted);
    })

    it('should extract export vars ', () => {
      let { code } = cq(src, '.AUTH_PROVIDERS', {engine: 'typescript'});
      const wanted = lines(src, 27, 29);
      assert.equal(code, wanted);
    })

    it('should extract export vars ', () => {
      let { code } = cq(src, '1-(.AuthService .login)', {engine: 'typescript'});
      const wanted = lines(src, 0, 12);
      assert.equal(code, wanted);
    })

    it('should extract ranges from children to parent vars ', () => {
      let { code } = cq(src, '(.AuthService .isLoggedIn)-.AUTH_PROVIDERS', {engine: 'typescript'});
      const wanted = lines(src, 22, 29);
      assert.equal(code, wanted);
    })

  });

  describe.skip('searching for strings', () => {
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
      let { code } = cq(src, "'My Test'", {engine: 'typescript'});
      const wanted = lines(src, 3, 7);
      assert.equal(code, wanted);
    })

    it('find a child should', () => {
      let { code } = cq(src, "'My Test' 'should pass'", {engine: 'typescript'});
      const wanted = lines(src, 4, 6);
      assert.equal(code, wanted);
    })

    it('find a child should with the same name', () => {
      let { code } = cq(src, "'Other Test' 'should pass'", {engine: 'typescript'});
      const wanted = lines(src, 10, 12);
      assert.equal(code, wanted);
    })

    it('find strings in a range', () => {
      let { code } = cq(src, "1-'My Test'", {engine: 'typescript'});
      const wanted = lines(src, 0, 7);
      assert.equal(code, wanted);
    })
  });

  describe.skip('getting comments', () => {
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
      let { code } = cq(src, "comments(.hello)", {engine: 'typescript'});
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

  describe.skip('ranges', () => {
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

  describe.skip('window operator', () => {
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

    it('should get lines that are close below', () => {
      {
        let { code } = cq(src, "window(.template, 0, 0)", {engine: 'typescript'});
        const wanted = lines(src, 4, 4);
        assert.equal(code, wanted);
      }
      {
        let { code } = cq(src, "window(.template, 0, 2)", {engine: 'typescript'});
        const wanted = lines(src, 4, 6);
        assert.equal(code, wanted);
      }
      {
        let { code } = cq(src, "window(.template, 1, 2)", {engine: 'typescript'});
        const wanted = lines(src, 5, 6);
        assert.equal(code, wanted);
      }
      {
        let { code } = cq(src, "window(.template, 3, 8)", {engine: 'typescript'});
        const wanted = lines(src, 7, 12);
        assert.equal(code, wanted);
      }
    })

    it('should get lines that are close around', () => {
      let { code } = cq(src, "window(.template, -1, 1)", {engine: 'typescript'});
      const wanted = lines(src, 3, 5);
      assert.equal(code, wanted);
    })

  });

  describe.skip('disambiguation', () => {
    const src = `
import { bootstrap, provideRouter } from 'frobular';

bootstrap(RoutesDemoApp, [
  provideRouter(routes),
  provide(LocationStrategy, {useClass: HashLocationStrategy})
]);
`;

    it('should disambiguate children identifiers', () => {
      let { code } = cq(src, ".bootstrap .RoutesDemoApp", {engine: 'typescript'});
      const wanted = lines(src, 3, 6);
      assert.equal(code, wanted);
    })

    it('after() should find things properly', () => {
      let { code } = cq(src, "after(.bootstrap, .provideRouter)", {engine: 'typescript'});
      const wanted = lines(src, 3, 6);
      assert.equal(code, wanted);
    })

    it('choose() should pick a specific selection', () => {
      {
        let { code } = cq(src, "choose(.bootstrap, 0)", {engine: 'typescript'});
        const wanted = lines(src, 1, 1);
        assert.equal(code, wanted);
      }
      {
        let { code } = cq(src, "choose(.bootstrap, 1)", {engine: 'typescript'});
        const wanted = lines(src, 3, 6);
        assert.equal(code, wanted);
      }
    })

  });

  describe.skip('Decorators', () => {
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

    it('should get the decorator alone as a child of the class', () => {
      let { code } = cq(src, ".FooBar .Component", {engine: 'typescript'});
      const wanted = lines(src, 4, 7);
      assert.equal(code, wanted);
    })

    it('should get decorator alone as an identifier', () => {
      let { code } = cq(src, ".Component", {engine: 'typescript'});
      const wanted = lines(src, 4, 7);
      assert.equal(code, wanted);
    })

    it('should get the class alone as an identifier', () => {
      let { code } = cq(src, ".FooBar", {engine: 'typescript'});
      const wanted = lines(src, 8, 9);
      assert.equal(code, wanted);
    })

    it('should get the class with decorator when using decorators()', () => {
      let { code } = cq(src, "decorators(.FooBar)", {engine: 'typescript'});
      const wanted = lines(src, 4, 9);
      assert.equal(code, wanted);
    })

    it('should get the class with decorator and comments with operations', () => {
      let { code } = cq(src, "comments(decorators(.FooBar))", {engine: 'typescript'});
      const wanted = lines(src, 1, 9);
      assert.equal(code, wanted);
    })

    const src2 = `
@Foobarable()
class FooBar {
}
`;

    it('should get a single-line decorator', () => {
      let { code } = cq(src2, "decorators(.FooBar)", {engine: 'typescript'});
      const wanted = lines(src2, 1, 3);
      assert.equal(code, wanted);
    })

    const src3 = `
@Foobarable()
@Bambazable()
class FooBar {
}
`;

    it('should get all decorators', () => {
      let { code } = cq(src3, "decorators(.FooBar)", {engine: 'typescript'});
      const wanted = lines(src3, 1, 4);
      assert.equal(code, wanted);
    })

  });

  describe.skip('special identifiers', () => {
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

    it('should get a constructor', () => {
      let { code } = cq(src, ".Barn .constructor", {engine: 'typescript'});
      const wanted = lines(src, 7, 9);
      assert.equal(code, wanted);
    })

    it('should get a constructor as part of a child range', () => {
      let { code } = cq(src, ".Barn-(.Barn .constructor)", {engine: 'typescript'});
      const wanted = lines(src, 4, 9);
      assert.equal(code, wanted);
    })

  });


});
