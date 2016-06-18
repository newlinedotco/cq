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

```
$ cq '.bye' examples/basics.js

const bye = function() {
  return 'bye';
}
```

Get the `bye()` function plus the invocation line after using a _modifier_:

```
$ cq '.bye:+1' examples/basics.js

const bye = function() {
  return 'bye';
}
bye(); // -> 'bye'
```

Get the `calcArea` function on the `Barn` class:

```
$ cq '.Barn .calcArea' examples/basics.js

  calcArea() {
    return this.height * this.width;
  }
```

Get the _range_ of `constructor` through `calcArea`, inclusive, of the `Barn` class

```
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

- Parses ES6 & JSX using [babylon](https://github.com/babel/babylon)
- Extract ranges

## Motivation

When writing blog posts, tutorials, and books about programming there's a tension between code that gets copied and pasted into the text and runnable code on disk.

If you copy and paste your code into the copy, then you're prone to typos, missing steps. When things change, you have to update all of the copypasta and eyeball it to make sure you didn't miss anything. Mistakes are really easy to make because you can't really test code that's in your manuscript without it's context.

A better solution is to keep your code (or steps of your code) as runnable examples on disk. You can then load the code into your manuscript with some pre-processing.

The problem with the code-on-disk approach is how to designate the ranges of code you wish to import. Line numbers are the most obvious approach, but if you add or remove a line of code, then you have to adjust all line numbers accordingly.

`cq` is a tool that lets you specify selectors to extract portions of code. Rather than using brittle line numbers, instead `cq` lets you query your code. It uses `babylon` to understand the semantics of your code and will extract the appropriate lines.

## Related

 - [GraspJS](http://www.graspjs.com/)
 - [Pygments](http://pygments.org/)

## Fullstack React Book

<a href="https://fullstackreact.com">
<img align="right" src="doc/readme/fullstack-react-hero-book.png" alt="Fullstack React Book" width="155" height="250" />
</a>

This repo was written and is maintained by the [Fullstack React](https://fullstackreact.com) team. If you're looking to learn React, there's no faster way than by spending a few hours with the Fullstack React book.

<div style="clear:both"></div>

## License

[MIT](/LICENSE.md)
