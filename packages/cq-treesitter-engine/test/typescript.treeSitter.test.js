import chai from "chai";
require("babel-core");
require("babylon");
const assert = chai.assert;
import cq, { NodeTypes } from "../../cq/src/index";
import treesitterEngine from "../src/index";
const engine = treesitterEngine();

function lines(str, startLine, endLine) {
  return str
    .split("\n")
    .slice(startLine, endLine + 1)
    .join("\n");
}

describe("typescript treeSitter", () => {
  describe("top level functions", () => {
    const someFunctions = `
function hello(): string {
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
      let { code } = await cq(someFunctions, ".hello", {
        engine,
        language: "typescript"
      });
      const wanted = lines(someFunctions, 1, 3);
      assert.equal(code, wanted);
    });

    it("should return an anonymous function assigned to a variable", async () => {
      let { code } = await cq(someFunctions, ".bye", {
        engine,
        language: "typescript"
      });
      const wanted = lines(someFunctions, 5, 7);
      assert.equal(code, wanted);
    });

    it("should return an arrow function assigned to a variable", async () => {
      let { code } = await cq(someFunctions, ".Farm", {
        engine,
        language: "typescript"
      });
      const wanted = lines(someFunctions, 9, 9);
      assert.equal(code, wanted);
    });
  });

  describe("Angular Code", async () => {
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
`;
    it("should extract a class", async () => {
      let { code } = await cq(src, ".AuthService", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 4, 25);
      assert.equal(code, wanted);
    });

    it.skip("should extract a class with decorator", async () => {
      let { code } = await cq(src, "decorators(.AuthService)", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 3, 25);
      assert.equal(code, wanted);
    });

    it("should extract a specific, unscoped method", async () => {
      let { code } = await cq(src, ".login", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 5, 12);
      assert.equal(code, wanted);
    });

    it("should extract a specific, scoped method", async () => {
      let { code } = await cq(src, ".AuthService .login", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 5, 12);
      assert.equal(code, wanted);
    });

    it("should extract export vars ", async () => {
      let { code } = await cq(src, ".AUTH_PROVIDERS", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 27, 29);
      assert.equal(code, wanted);
    });

    it("should extract export vars ", async () => {
      let { code } = await cq(src, "1-(.AuthService .login)", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 0, 12);
      assert.equal(code, wanted);
    });

    it("should extract ranges from children to parent vars ", async () => {
      let { code } = await cq(
        src,
        "(.AuthService .isLoggedIn)-.AUTH_PROVIDERS",
        { engine, language: "typescript" }
      );
      const wanted = lines(src, 22, 29);
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
      let { code } = await cq(src, "'My Test'", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 3, 7);
      assert.equal(code, wanted);
    });

    it("find a child should", async () => {
      let { code } = await cq(src, "'My Test' 'should pass'", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 4, 6);
      assert.equal(code, wanted);
    });

    it("find a child should with the same name", async () => {
      let { code } = await cq(src, "'Other Test' 'should pass'", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 10, 12);
      assert.equal(code, wanted);
    });

    it("find strings in a range", async () => {
      let { code } = await cq(src, "1-'My Test'", {
        engine,
        language: "typescript"
      });
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

    it.skip("find a group of single-line comments preceeding", async () => {
      let { code } = await cq(src, "comments(.hello)", {
        engine,
        language: "typescript"
      });
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
  });

  describe("window operator", async () => {
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

    it("should get lines that are close below", async () => {
      {
        let { code } = await cq(src, "window(.template, 0, 0)", {
          engine,
          language: "typescript"
        });
        const wanted = lines(src, 4, 4);
        assert.equal(code, wanted);
      }
      {
        let { code } = await cq(src, "window(.template, 0, 2)", {
          engine,
          language: "typescript"
        });
        const wanted = lines(src, 4, 6);
        assert.equal(code, wanted);
      }
      {
        let { code } = await cq(src, "window(.template, 1, 2)", {
          engine,
          language: "typescript"
        });
        const wanted = lines(src, 5, 6);
        assert.equal(code, wanted);
      }
      {
        let { code } = await cq(src, "window(.template, 3, 8)", {
          engine,
          language: "typescript"
        });
        const wanted = lines(src, 7, 12);
        assert.equal(code, wanted);
      }
    });

    it("should get lines that are close around", async () => {
      let { code } = await cq(src, "window(.template, -1, 1)", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 3, 5);
      assert.equal(code, wanted);
    });
  });

  describe("disambiguation", async () => {
    const src = `
import { bootstrap, provideRouter } from 'frobular';

bootstrap(RoutesDemoApp, [
  provideRouter(routes),
  provide(LocationStrategy, {useClass: HashLocationStrategy})
]);
`;

    it("should disambiguate children identifiers", async () => {
      let { code } = await cq(src, ".bootstrap .RoutesDemoApp", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 3, 6);
      assert.equal(code, wanted);
    });

    it("after() should find things properly", async () => {
      let { code } = await cq(src, "after(.bootstrap, .provideRouter)", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 3, 6);
      assert.equal(code, wanted);
    });

    it("choose() should pick a specific selection", async () => {
      {
        let { code } = await cq(src, "choose(.bootstrap, 1)", {
          engine,
          language: "typescript"
        });
        const wanted = lines(src, 1, 1);
        assert.equal(code, wanted);
      }
      {
        let { code } = await cq(src, "choose(.bootstrap, 2)", {
          engine,
          language: "typescript"
        });
        const wanted = lines(src, 3, 6);
        assert.equal(code, wanted);
      }
    });
  });

  describe("Decorators", async () => {
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

    it("should get the decorator alone as a child of the class", async () => {
      let { code } = await cq(src, ".FooBar .Component", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 4, 7);
      assert.equal(code, wanted);
    });

    it("should get decorator alone as an identifier", async () => {
      let { code } = await cq(src, ".Component", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 4, 7);
      assert.equal(code, wanted);
    });

    it.skip("should get the class alone as an identifier", async () => {
      let { code } = await cq(src, ".FooBar", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 8, 9);
      assert.equal(code, wanted);
    });

    it("should get the class with decorator when using decorators()", async () => {
      let { code } = await cq(src, "decorators(.FooBar)", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 4, 9);
      assert.equal(code, wanted);
    });

    it.skip("should get the class with decorator and comments with operations", async () => {
      let { code } = await cq(src, "comments(decorators(.FooBar))", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 1, 9);
      assert.equal(code, wanted);
    });

    const src2 = `
@Foobarable()
class FooBar {
}
`;

    it("should get a single-line decorator", async () => {
      let { code } = await cq(src2, "decorators(.FooBar)", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src2, 1, 3);
      assert.equal(code, wanted);
    });

    const src3 = `
@Foobarable()
@Bambazable()
class FooBar {
}
`;

    it("should get all decorators", async () => {
      let { code } = await cq(src3, "decorators(.FooBar)", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src3, 1, 4);
      assert.equal(code, wanted);
    });
  });

  describe("special identifiers", async () => {
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

    it("should get a constructor", async () => {
      let { code } = await cq(src, ".Barn .constructor", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 7, 9);
      assert.equal(code, wanted);
    });

    it("should get a constructor as part of a child range", async () => {
      let { code } = await cq(src, ".Barn-(.Barn .constructor)", {
        engine,
        language: "typescript"
      });
      const wanted = lines(src, 4, 9);
      assert.equal(code, wanted);
    });
  });
});
