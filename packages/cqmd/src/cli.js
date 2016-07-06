#!/usr/bin/env node
import 'babel-polyfill';
import yargs from 'yargs';
import fs from 'fs';
import cqmd from './index';

/*
 * A markdown preprocessor that parses cq directives and replaces them with code blocks
 */
let argv = yargs
    .usage('Usage: $0 [options] <file>')
    .example("$0 post.md", "process post.md and emit the results on STDOUT")
    .help('help')
    .alias('help', 'h')
    .option('output', {
      alias: 'o',
      type: 'string',
      describe: 'Specify the output file'
    })
    .option('path', {
      alias: 'p',
      type: 'string',
      describe: 'The root path for the code '
    })
    .option('format', {
      alias: 'f',
      describe: 'the format to convert codeblocks into',
      // choices: ['gfm', 'block', 'leanpub', 'raw'],
      choices: ['gfm', 'raw'],
      default: 'gfm'
    })
    .version()
    .argv;

let [filename] = argv._;

let inputStream = filename ? fs.createReadStream(filename) : process.stdin;

// no filename nor stdin, so show the help
if(!filename && process.stdin.isTTY) {
  yargs.showHelp();
  process.exit();
}

var content = '';
inputStream.resume();
inputStream.on('data', function(buf) { content += buf.toString(); });
inputStream.on('end', function() {
  let result = cqmd(content, argv);
  if(argv.output) {
    fs.writeFileSync(argv.output, result);
  } else {
    process.stdout.write(result);
  }
});


