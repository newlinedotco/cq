import 'babel-polyfill';
import yargs from 'yargs';
import fs from 'fs';
import {Readable} from 'stream';

import { spawnParseCmd } from './util';
import parser from './index';    

/*
 * A python preprocessor that parses python code into JSON 
 */
let argv = yargs
    .usage('Usage: $0 -file somefile.py -f json')
    .example("$0 -input 'source code'", "process input source and emit the results on STDOUT as JSON")
    .help('help')
    .alias('help', 'h')
    .option('input', {
      alias: 'i',
      describe: 'Input code',
      coerce: (arg) => {
        let s = new Readable();
        s._read = () => {}
        s.push(arg);
        s.push(null);
        return s;
      }
    })
    .option('source', {
      alias: 's',
      describe: 'Input source file',
      coerce: (arg) => require('fs').createReadStream(arg)
    })
    .option('format', {
      alias: 'f',
      describe: 'the format to convert codeblocks into (json)',
      // choices: ['gfm', 'block', 'leanpub', 'raw'],
      choices: ['json'],
      default: 'json'
    })
    .version()
    .argv;

let inputStream = argv.source || argv.input || process.stdin;

// no filename nor stdin, so show the help
if(!inputStream) {
  yargs.showHelp();
  process.exit();
}

var content = '';
inputStream.resume();
inputStream.on('data', function(buf) { content += buf.toString(); });
inputStream.on('end', function() {
  spawnParseCmd(content)
  .then(({code, output}) => {
    const engine = new parser();
    let tree = JSON.parse(output);
    let res = engine.getInitialRoot(tree);
    console.log(res);
  })
  .catch(err => {
    console.log('err ->', err);
  })
});


