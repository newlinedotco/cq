<p align="center">
  <img src="https://cdn.rawgit.com/fullstackio/cq/master/doc/readme/code-query-image.png" alt="Code Query - extract code snippets using selectors" />
</p>

# cq: Code Query [![npm package](https://img.shields.io/npm/v/@fullstackio/cq.svg?maxAge=2592000?style=flat-square)](https://www.npmjs.com/package/@fullstackio/cq) [![Dolpins](https://cdn.rawgit.com/fullstackio/cq/master/doc/readme/dolphins-badge-ff00ff.svg)](https://www.fullstackreact.com) 

> A tool to extract code snippets using selectors (instead of line numbers)
>
> Supports JavaScript ES5, ES6, JSX, and TypeScript

## Install

```
$ npm install --global @fullstackio/cq
```

## Usage

```
$ cq <query> <file>

# or

$ cat file | cq <query>
```

## Examples

Say we have a file `examples/basics.js` with the following code:


```javascript
// examples/basics.js
const bye = function() {
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
}
```

Get the `bye()` function:

```javascript
$ cq '.bye' examples/basics.js

const bye = function() {
  return 'bye';
}
```

Get the `calcArea()` function on the `Barn` class:

```javascript
$ cq '.Barn .calcArea' examples/basics.js

  calcArea() {
    return this.height * this.width;
  }
```

Get the `bye()` function plus the line after:

```javascript
// `context(identifier, linesBefore, linesAfter)`
$ cq 'context(.bye,0,1)' examples/basics.js

const bye = function() {
  return 'bye';
}
bye(); // -> 'bye'
```

Get the _range_ of `constructor` through `calcArea`, inclusive, of the `Barn` class

```javascript
$ cq '.Barn .constructor-.calcArea' examples/basics.js

  constructor(height, width) {
    this.height = height;
    this.width = width;
  }

  calcArea() {
    return this.height * this.width;
  }
```

If you pass `--json` you'll get the results in JSON, which can be useful for further processing:

```javascript
$ cq --json 'context(.bye,0,1)' examples/basics.js

    {
      "code": "const bye = function() {\n  return 'bye';\n}\nbye(); // -> 'bye'",
      "start": 598,
      "end": 659,
      "start_line": 25,
      "end_line": 28
    }
```

`cq` works with TypeScript as well. Say we had the following TypeScript File:

```typescript
// AuthService.ts
import {Injectable, provide} from '@angular/core';

@Injectable()
export class AuthService {
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
```

Get the `AUTH_PROVIDERS` export:

```typescript
$ cq '.AUTH_PROVIDERS' examples/AuthService.ts

export var AUTH_PROVIDERS: Array<any> = [
  provide(AuthService, {useClass: AuthService})
];
```

Get the `isLoggedIn()` function through `AUTH_PROVIDERS`

```typescript
$ cq '(.AuthService .isLoggedIn)-.AUTH_PROVIDERS' examples/AuthService.ts

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }
}

export var AUTH_PROVIDERS: Array<any> = [
  provide(AuthService, {useClass: AuthService})
];
```

`cq` can search for strings as well as identifiers. Say we have the following test:

```javascript
import chai from 'chai';
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
});
```
 
We can get the first test:

```javascript
$ cq "'My First Test'" examples/mocha.test.js

describe('My First Test', () => {
  it('basic assert', () => {
    assert.equal(1, 1);
  });
});
```

Or get the `it` block in the second test:

```javascript
$ cq "'My Second Test' 'basic assert'" examples/mocha.test.js

  it('basic assert', () => {
    // this is the second one
    assert.equal(2, 2);
  });
```

> See _many_ more examples in the [`/examples`](./examples) directory

## Features

- Extract chunks of code from text using robust selectors (vs. brittle line numbers)
- Locate ranges of code using identifiers
- Parses ES6 & JSX (with [babylon](https://github.com/babel/babylon))
- Parses TypeScript

## Motivation

When writing blog posts, tutorials, and books about programming there's a tension between code that gets copied and pasted into the text and runnable code on disk.

If you copy and paste your code into the copy, then you're prone to typos, missing steps. When things change, you have to update all of the copypasta and eyeball it to make sure you didn't miss anything. Mistakes are really easy to make because you can't really test code that's in your manuscript without it's context.

A better solution is to keep your code (or steps of your code) as runnable examples on disk. You can then load the code into your manuscript with some pre-processing.

The problem with the code-on-disk approach is how to designate the ranges of code you wish to import. Line numbers are the most obvious approach, but if you add or remove a line of code, then you have to adjust all line numbers accordingly.

`cq` is a tool that lets you specify selectors to extract portions of code. Rather than using brittle line numbers, instead `cq` lets you query your code. It uses `babylon` to understand the semantics of your code and will extract the appropriate lines.

## Query Grammar

### _.Identifier_

**Examples**:

- `.Simple`
- `.render`

A dot `.` preceding JavaScript identifier characters represents an identifier.

In this code:

```jsx
const Simple = React.createClass({
  render() {
    return (
      <div>
        {this.renderName()}
      </div>
    )
  }
});
```

The query `.Simple` would find the whole `const Simple = ...` variable declaration.

Searches for identifiers traverse the whole tree, relative to the parent, and return the first match. This means that you do _not_ have to start at the root. In this case you could query for `.render` and would receive the `render()` function. That said, creating more specific queries can help in the case where you want to disambiguate.

### _[space]_

**Examples**:

- `.Simple .render`
- `.foo .bar .baz`

The space in a query selection expression designates a parent for the next identifier. For instance, the query `.Simple .render` will first look for the identifier `Simple` and then find the `render` function that is a child of `Simple`.

The space indicates to search for the next identifier anywhere within the parent. That is, it does **not** require that the child identifier be a _direct child_ the parent. 

> In this way the space is analogous to the space in a CSS selector. E.g. search for any child that matches.
> `cq` does not yet support the `>` notation (which would require the identifier to be a direct child), but we may in the future.

You can write child selection in parenthesis `()` if there is ambiguity. E.g.: `(.foo .bar)` .

### _Range_

**Examples**:

- `.constructor-.calcArea`
- `.Barn .constructor-.calcArea`
- `1-(.AuthService .login)`
- `.foo-EOF`

Given:

```javascript
class Barn {
  constructor(height, width) {
    this.height = height;
    this.width = width;
  }
  
  calcArea() {
    return this.height * this.width;
  }
}
```

A pair of selections (e.g. identifiers) joined by a dash `-` form a _range_. A range will emit the code from the beginning of the match of the first identifier to the end of the match of the last. 

You can use a parent identifier to limit the scope of the search of the range as in the query: `.Barn .constructor-.calcArea`

If you'd like to specify a line number, you can use a number (instead of an identifier) in a range. For example the query: `30-35` will give lines 30 through 35, inclusive.

If you want to specify a child selector at the end of a range, use parenthesis as in this query: `1-(.AuthService .login)`. The previous query will return the lines from line 1 to the end of the `login()` function on `AuthService`.

You can use the special line number `EOF` to select until the end-of-file.

### _Operators_

**Examples**:

- `context(.bye,1,1)`
- `upto(.bye)`

Given:

```javascript
// here is the bye function (emitted with -1)
const bye = function() {
  return 'bye';
}
bye(); // -> 'bye' (emitted with +1)
```

Operators allow you to change the result of the inner selection. 

### `context`

The `context()` operation allows you to take line numbers before and after the selection. The signature is `context(selection, numLinesBefore, numLinesAfter)`.

### `upto`

The `upto()` operation will return the code up-to, but not including, the selection. A convenient (but potentially confusing) default is that **the `upto()` operation trims whitespace**. This is normally what you want, but you have to be careful when using `upto()` and `context()` together (because `upto()` may trim lines). 

## Library Usage

```javascript
var cq = require('@fullstackio/cq').default;
var results = cq(codeString, query);
console.log(results.code);
```

## Future

* Add queries for header information such as comments, `import`s, and `require`s
* Add the ability to extract several sections in a single query
* Create a [remark](https://github.com/wooorm/remark) plugin to pull code into Markdown using queries
* Get trailing and leading comments - [see here in ASTExplorer](https://github.com/fkling/astexplorer/tree/master/src/parsers/js/typescript.js#L68)

## Limitations

* It's possible to specify invalid queries and the error messages are not helpful
* Only one selector is possible per query
* Some sections of code are not directly selectable (because the query language is not yet expressive enough)
* You can only select whole lines (e.g. comments on the same line after an expression are captured) - this is by design, but it should be configurable

## Query API Stability

The query API may change (see [Future](#future)). Any breaking API changes (query or otherwise) will result in a major version bump.

## Contributing

Please feel free to submit pull requests!

## Authors

Originally written by [Nate Murray](https://twitter.com/eigenjoy).

## Related

 - [GraspJS](http://www.graspjs.com/) - another tool to search JavaScript code based on structure
 - [Pygments](http://pygments.org/) - a handy tool to colorize code snippets on the command line
 - [ASTExplorer](https://astexplorer.net/) - an online tool to explore the AST of your code

## Fullstack React Book

<a href="https://fullstackreact.com">
<img align="right" src="https://cdn.rawgit.com/fullstackio/cq/master/doc/readme/fullstack-react-hero-book.png" alt="Fullstack React Book" width="155" height="250" />
</a>

This repo was written and is maintained by the [Fullstack React](https://fullstackreact.com) team. If you're looking to learn React, there's no faster way than by spending a few hours with the Fullstack React book.

<div style="clear:both"></div>

## License

[MIT](/LICENSE.md)
