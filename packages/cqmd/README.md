# cqmd: A markdown preprocessor for cq code blocks [![Dolpins](https://cdn.rawgit.com/fullstackio/cq/master/doc/readme/dolphins-badge-ff00ff.svg)](https://www.fullstackreact.com) 

> cqmd is a markdown preprocessor that parses [cq](https://github.com/fullstackio/cq) query blocks and replaces them with "regular" markdown code blocks.

## Install

```
$ npm install --global @fullstackio/cqmd
```

## Usage

```
$ cq --path <path/to/code/basepath> <input-markdown-file>

# or

$ cat file | cqmd --path <path>
```

## Library Usage

```javascript
var cqmd = require('@fullstackio/cqmd').default;
let results = cqmd(input, {path: __dirname});
console.log(results);
```

If you'd like to create a custom formatting function, use the `format` key in the options.

## Future

- Support plain markdown code blocks
- Support [leanpub-style `crop-start-line`](https://leanpub.com/help/manual#leanpub-auto-displaying-only-part-of-a-code-file) blocks

## Contributing

Please feel free to submit pull requests!

## Authors

Originally written by [Nate Murray](https://twitter.com/eigenjoy).

## Fullstack React Book

<a href="https://fullstackreact.com">
<img align="right" src="https://cdn.rawgit.com/fullstackio/cq/master/doc/readme/fullstack-react-hero-book.png" alt="Fullstack React Book" width="155" height="250" />
</a>

This repo was written and is maintained by the [Fullstack React](https://fullstackreact.com) team. If you're looking to learn React, there's no faster way than by spending a few hours with the Fullstack React book.

<div style="clear:both"></div>

## License

[MIT](/LICENSE.md)
