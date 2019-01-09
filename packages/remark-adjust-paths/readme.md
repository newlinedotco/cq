# remark-leanpub

[**remark**][remark] plug-in to process leanpub markdown

**NOTE**: for now it is a hack that mostly strips things rather than handling them accurately

## Installation

[npm][npm-install]:

```bash
npm install remark-leanpub
```

## Usage

Dependencies:

```javascript
var remark = require('remark');
var leanpub = require('remark-leanpub');
```

Process:

```javascript
var doc = remark().use(leanpub).process([
  ''
].join('\n'));
```

Yields:

```md
```

## API

### `remark.use(leanpub)`


## License

[MIT][license] © [Nate Murray][author]

<!-- Definitions -->

[npm-install]: https://docs.npmjs.com/cli/install

[license]: LICENSE

[author]: http://fullstack.io

[remark]: https://github.com/wooorm/remark
