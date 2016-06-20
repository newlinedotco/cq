<p align="center">
  <img src="doc/readme/code-query-image.png" alt="Code Query - extract code snippets using selectors" />
</p>

# cq: Code Query [![Dolpins](https://cdn.rawgit.com/fullstackreact/google-maps-react/master/resources/readme/dolphins-badge-ff00ff.svg)](https://www.fullstackreact.com)

> A tool to extract code snippets using selectors (instead of line numbers)

## Install

```
$ npm install --global @eigenjoy/cq
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

Get the `bye()` function plus the invocation line after using a _modifier_:

```javascript
$ cq '.bye:+1' examples/basics.js

const bye = function() {
  return 'bye';
}
bye(); // -> 'bye'
```

Get the `calcArea` function on the `Barn` class:

```javascript
$ cq '.Barn .calcArea' examples/basics.js

  calcArea() {
    return this.height * this.width;
  }
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

## Features

- Extract chunks of code from text using robust selectors (vs. brittle line numbers)
- Locate ranges of code using identifiers
- Parses ES6 & JSX (with [babylon](https://github.com/babel/babylon))

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

### _Range_

**Examples**:

- `.constructor-.calcArea`
- `.Barn .constructor-.calcArea`

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


### _Modifiers_

**Examples**:

- `.bye:+1`
- `.bye:+1,-1`

Given:

```javascript
// here is the bye function (emitted with -1)
const bye = function() {
  return 'bye';
}
bye(); // -> 'bye' (emitted with +1)
```

After the selection expression you pass additional query modifiers. Query modifiers follow a colon and are comma separated. The two modifiers currently supported are:

* adding additional lines following an identifier (or range) 
* adding additional lines preceding an identifier (or range) 

Lines following the identifier are designated by `+n` whereas lines preceding are specified by `-n`, where `n` is the number of lines desired.

## Library Usage

```javascript
var cq = require('@eigenjoy/cq').default;
var results = cq(codeString, query);
console.log(results.code);
```

## Future

* Add queries for header information such as comments, `import`s, and `require`s
* Add the ability to extract several sections in a single query
* Add TypeScript support (but keep the same query language)
* Add `BOF` and `EOF` tokens for selecting the range from beginning and end of file 

## Limitations

* It's possible to specify invalid queries and the error messages are not helpful
* Only one selector is possible per query
* Some sections of code are not directly selectable (because the query language is not yet expressive enough)
* You can only select whole lines (e.g. comments on the same line after an expression are captured) - this is by design, but it should be configurable

## Query API Stability

The query API early is likely to change for version 1.0.0 (see [Future](#future)). Any breaking API changes (query or otherwise) will result in a major version bump.q

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
<img align="right" src="https://cdn.rawgit.com/fullstackreact/google-maps-react/master/resources/readme/fullstack-react-hero-book.png" alt="Fullstack React Book" width="155" height="250" />
</a>

This repo was written and is maintained by the [Fullstack React](https://fullstackreact.com) team. If you're looking to learn React, there's no faster way than by spending a few hours with the Fullstack React book.

<div style="clear:both"></div>

## License

[MIT](/LICENSE.md)
