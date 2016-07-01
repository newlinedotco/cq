#!/usr/bin/env node

import 'babel-polyfill';
import cq from 'cq';
import yargs from 'yargs';
import fs from 'fs';

/*

 Thoughts:

 The idea: a markdown preprocessor that parses cq directives and replaces them with code blocks

 The options
 - root dir - the patch by which the paths are relative to
 - the flavor of code blocks, for now gfm
 
 */

let argv = yargs.usage('Usage: $0 [options] <file>').example("$0 post.md", "process post.md and emit the results on STDOUT").help('help').alias('help', 'h').option('output', {
  alias: 'o',
  type: 'string',
  describe: 'Specify the output file'
}).option('path', {
  alias: 'p',
  type: 'string',
  describe: 'The root path for the code '
}).option('format', {
  alias: 'f',
  describe: 'the format to convert codeblocks into',
  choices: ['gfm', 'block', 'leanpub'],
  default: 'gfm'
}).argv;

let [filename] = argv._;

let inputStream = filename ? fs.createReadStream(filename) : process.stdin;

var content = '';
inputStream.resume();
inputStream.on('data', function (buf) {
  content += buf.toString();
});
inputStream.on('end', function () {
  let result = cq(content, query, { engine });

  if (argv.json === true) {
    delete result['nodes'];
    if (argv.short === true) {
      delete result['code'];
    }
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.code);
  }

  // no filename nor stdin, so show the help
  if (!filename && content.length === 0) {
    yargs.showHelp();
    process.exit();
  }
});