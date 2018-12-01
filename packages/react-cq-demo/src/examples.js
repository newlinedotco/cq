const basics = `const bye = function() {
  return 'bye';
}
bye(); // -> 'bye'

let Farm = () => 'cow';

class Barn {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  
  calcArea() {
    return this.height * this.width;
  }
}`;

const basicExamples = [
  { name: "Basics: Select a variable", code: basics, query: ".Farm" },
  { name: "Basics: Select a class", code: basics, query: ".Barn" },
  {
    name: "Basics: Select a method on a class",
    code: basics,
    query: ".Barn .calcArea"
  },
  {
    name: "Basics: Get a function plus the line after",
    code: basics,
    query: "context(.bye, 0, 1)"
  }
];

const mochaCode = `import chai from 'chai';
const assert = chai.assert;

describe('My First Test', () => {
  it('basic assert', () => {
    assert.equal(1, 1);
  });
});

describe('My Second Test', () => {
  it('basic assert', () => {
    // this is the second one
    assert.equal(2, 2);
  });
});`;

const mochaExamples = [
  { name: "Get test by string", code: mochaCode, query: "'My First Test'" },
  {
    name: "Get inner test by qualified strings",
    code: mochaCode,
    query: "'My Second Test' 'basic assert'"
  }
];

const angularTypescript = `import {Injectable, provide} from '@angular/core';

@Injectable()
export class AuthService {
  login(user: string, password: string): boolean {
    if (
      user === 'user' && 
      password === 'password'
      ) {
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

const angularExamples = [
  {
    name: "Typescript: Get class",
    code: angularTypescript,
    query: ".AuthService"
  },
  {
    name: "Typescript: Get function plus lines after",
    code: angularTypescript,
    query: "context(.login, 0, 2)"
  },
  {
    name: "Typescript: Get constant",
    code: angularTypescript,
    query: ".AUTH_PROVIDERS"
  },
  {
    name: "Range: Get function through constant",
    code: angularTypescript,
    query: "(.AuthService .isLoggedIn)-.AUTH_PROVIDERS"
  }
];

const jsxCode = `import React from 'react';

const Simple = React.createClass({
  renderName() {
    return <div>Nate</div>
  },

  // here's the render function
  render() {
    return (
      <div>
        {this.renderName()}
      </div>
    )
  }
});`;

const jsxExamples = [
  {
    name: "JSX: Get render function on a class",
    code: jsxCode,
    query: ".Simple .render"
  },
  {
    name: "JSX: Get the range between renderName and render, inclusive ",
    code: jsxCode,
    query: ".Simple .renderName-.render"
  },
  {
    name: "JSX: Get the range between renderName and render, plus context ",
    code: jsxCode,
    query: "context(.Simple .renderName-.render, 1, 1)"
  },
  {
    name: "JSX: Get the range upto render",
    code: jsxCode,
    query: ".Simple-upto(.Simple .render)"
  }
];

const examples = [
  ...basicExamples,
  ...mochaExamples,
  ...angularExamples,
  ...jsxExamples
];
export default examples;
