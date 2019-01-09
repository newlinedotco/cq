# cqmd: A markdown preprocessor for cq code blocks [![npm package](https://img.shields.io/npm/v/@fullstackio/cqmd.svg?maxAge=2592000?style=flat-square)](https://www.npmjs.com/package/@fullstackio/cqmd)

> cqmd is a CLI tool markdown preprocessor that parses [cq](https://github.com/fullstackio/cq) query blocks and replaces them with "regular" markdown code blocks.

## Advanced Users Note

If you want fine-grained control over how the markdown is parsed, you may want to use [remark-cq](../remark-cq) instead

## Install

```
$ npm install --global @fullstackio/cqmd
```

## Usage

```
$ cqmd --path <path/to/code/basepath> <input-markdown-file>

# or

$ cat file | cqmd --path <path>
```

## Examples

```
# process a single file to stdout
cqmd --path code manuscript/chapters/forms.md

# process a single file to an output file
cqmd --path code --output forms-out.md manuscript/chapters/forms.md

# process a single file, adjusting paths, to the preview directory
cqmd --path manuscript --imgPath ../manuscript/ --output preview/ manuscript/chapters/forms.md

# watch a glob of files
cqmd --path manuscript --adjustPath ../manuscript/ --output preview/ --watchGlob 'manuscript/chapters/*.md'
```

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

## Using Remark Extensions

To `use` a remark extension, pass the `remarkExtensions` option like this:

```
./src/cli.js --remarkExtensions="remark-frontmatter,remark-yaml-config"  examples/frontmatter.md
```

## Library Usage

```javascript
var cqmd = require("@fullstackio/cqmd").default;
cqmd(input, { path: __dirname }).then(function(results) {
  console.log(results);
});
```

But, this library is just a thin wrapper to provide a CLI tool. If you're using this as a library you may want to use [remark-cq](../remark-cq) instead

If you'd like to create a custom formatting function, use the `format` key in the options.

## Contributing

Please feel free to submit pull requests.

## Authors

Originally written by [Nate Murray](https://twitter.com/eigenjoy).

<div style="clear:both"></div>

## License

[MIT](/LICENSE.md)
