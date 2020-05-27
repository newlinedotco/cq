# remark-cq

[**remark**][remark] plug-in to import code in markdown using [cq](https://github.com/fullstackio/cq)

Supports exporting [remark-attr](https://github.com/arobase-che/remark-attr)-compatable metadata with code blocks.

## Installation

[npm][npm-install]:

```bash
npm install @fullstackio/remark-cq
```

## Usage

For example:

```javascript
var remark = require("remark");
var cq = require("@fullstackio/remark-cq");
const unified = require("unified");
const reParse = require("remark-parse");
const stringify = require("rehype-stringify");
const remark2rehype = require("remark-rehype");
const remarkStringify = require("remark-stringify");

const render = (text, config) =>
    unified()
        .use(reParse)
        .use(cq, config)
        .use(remark2rehype)
        .use(stringify)
        .process(text);

const markup = `
The code:

{lang=javascript,crop-query=.dogs}  
<<[](test.js)`;

const html = (await render(markup, { root: __dirname })).contents;

console.log(html);
```

Given a file `test.js` containing:

```javascript
// test.js
var a = 1;
const dogs = () => "Like snuggles";
var b = 2;
```

Yields:

```html
<p>The code:</p>
<pre><code class="language-javascript">const dogs = () => "Like snuggles";
</code></pre>
```

Similarly, you can render to markdown like this:

```javascript
const renderMarkdown = (text, config) =>
    unified()
        .use(reParse)
        .use(remarkStringify)
        .use(cq, config)
        .process(text);
```

and then above example would render into:

````md
The code:

```javascript
const dogs = () => "Like snuggles";
```
````

## API

### `remark.use(cq, options)`

## Options

-   `root`: path to look for relative files
-   `undent`: undent the code (default `true`)
-   the rest are passed to `cq`

## Use with Docusaurus

`remark-cq` can be used with [Docusaurus](https://v2.docusaurus.io/) easily. Just add the following to your `docusaurus.config.js`:


```js
  remarkPlugins: [require("@fullstackio/remark-cq")]
```

For example, if you're using `@docusaurus/preset-classic`

```js
presets: [
    "@docusaurus/preset-classic",
    {
       docs: { 
           remarkPlugins: [require("@fullstackio/remark-cq")]
       }
    }
]
```



## License

[MIT][license] © [Nate Murray][author]

<!-- Definitions -->

[npm-install]: https://docs.npmjs.com/cli/install
[license]: LICENSE
[author]: http://fullstack.io
[remark]: https://github.com/wooorm/remark
