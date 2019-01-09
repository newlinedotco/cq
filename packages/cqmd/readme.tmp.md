# cqmd: A markdown preprocessor for cq code blocks [![npm package](https://img.shields.io/npm/v/@fullstackio/cqmd.svg?maxAge=2592000?style=flat-square)](https://www.npmjs.com/package/@fullstackio/cqmd) [![Dolpins](https://cdn.rawgit.com/fullstackio/cq/master/doc/readme/dolphins-badge-ff00ff.svg)](https://www.fullstackreact.com)

> cqmd is a CLI tool markdown preprocessor that parses [cq](https://github.com/fullstackio/cq) query blocks and replaces them with "regular" markdown code blocks.

## Advanced Users Note

If you want fine-grained control over how the markdown is parsed, you may want to use [remark-cq](../remark-cq) instead

## Install

    $ npm install --global @fullstackio/cqmd

## Usage

    $ cqmd --path <path/to/code/basepath> <input-markdown-file>

    # or

    $ cat file | cqmd --path <path>

## Markdown Format

To use `cqmd` you write a normal markdown file but instead of using indented code blocks you use the following syntax:

```md
{lang=myLang,crop-query=myQuery,format=myFormat}
<<[](path/to/file.js)
```

For example, say we have a file `examples/basics.js` with the following code:

```javascript
// examples/basics.js
const bye = function() {
  return "bye";
};
bye(); // -> 'bye'

let Farm = () => "cow";
```

In our markdown file we could include the code block by using the following markdown:

    // document.md

    And here is how we say goodbye:

    {lang=javascript,crop-query=.bye,format=gfm}
    <<[](examples/basics.js)

    Isn't that neat?

> Notice that none of the values are quoted. You do **not** quote your crop-query. If you use quotes then you are searching for a string.

Now we can process `document.md` like so:

```shell
$ cqmd --path . document.md
```

Which emits:

    // document.md

    And here is how we say goodbye:

    ```javascript
    const bye = function() {
      return 'bye';
    }
    ```

    Isn't that neat?

You can see the full list of possible queries in [the cq manual](https://github.com/fullstackio/cq).

## Library Usage

```javascript
var cqmd = require("@fullstackio/cqmd").default;
cqmd(input, { path: __dirname }).then(function(results) {
  console.log(results);
});
```

But, this library is just a thin wrapper to provide a CLI tool. If you're using this as a library you may want to use [remark-cq](../remark-cq) instead

If you'd like to create a custom formatting function, use the `format` key in the options.

## Future

-   Support plain markdown code blocks
-   Support [leanpub-style `crop-start-line`](https://leanpub.com/help/manual#leanpub-auto-displaying-only-part-of-a-code-file) blocks

## Contributing

Please feel free to submit pull requests.

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
