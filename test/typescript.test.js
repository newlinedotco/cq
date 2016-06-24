import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import cq, { NodeTypes } from '../src/index';

function lines(str, startLine, endLine) {
  return str.split('\n').slice(startLine, endLine + 1).join('\n');
}

describe('typescript', () => {

  describe('top level functions', () => {
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

    it('should return a function definition', () => {
      let { code } = cq(someFunctions, '.hello', {engine: 'typescript'});
      const wanted = lines(someFunctions, 1, 3);
      assert.equal(code, wanted);
    })

    it('should return an anonymous function assigned to a variable', () => {
      let { code } = cq(someFunctions, '.bye', {engine: 'typescript'});
      const wanted = lines(someFunctions, 5, 7);
      assert.equal(code, wanted);
    })

    it('should return an arrow function assigned to a variable', () => {
      let { code } = cq(someFunctions, '.Farm', {engine: 'typescript'});
      const wanted = lines(someFunctions, 9, 9);
      assert.equal(code, wanted);
    })
  });

  describe('Angular Code', () => {
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

  isLogged(): boolean {
    return this.getUser() !== null;
  }
}

export var AUTH_PROVIDERS: Array<any> = [
  provide(AuthService, {useClass: AuthService})
];
`
    it('should extract a whole class', () => {
      let { code } = cq(src, '.AuthService', {engine: 'typescript'});
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


  })

});
