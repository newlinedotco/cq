/**
 * Here are some queries to try:
 *
 * ```
 * # get the `AuthService()` class
 * cq '.AuthService' examples/AuthService.ts
 *
 * # get the `login()` function plus two lines after
 * cq 'context(.login, 0, 2)' examples/AuthService.ts
 *
 * # get the `AUTH_PROVIDERS`
 * cq '.AUTH_PROVIDERS' examples/AuthService.ts
 *
 * # get the `isLoggedIn()` function through AUTH_PROVIDERS
 * cq '(.AuthService .isLoggedIn)-.AUTH_PROVIDERS' examples/AuthService.ts
 * ```
 * 
 */


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
