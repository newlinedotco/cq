#!/usr/bin/env node
import cq from './index';
import yargs from 'yargs';
import fs from 'fs';

let argv = yargs
    .usage('Usage: $0 <query> <file>')
    .example("$0 '.MyClass .fooFunction'", "show code for fooFunction() in MyClass")
    .help('h')
    .alias('h', 'help')
    .argv;

let [query, filename] = argv._;

if(!query) {
  yargs.showHelp();
  process.exit();
}

let inputStream = filename ? fs.createReadStream(filename) : process.stdin;

var content = '';
inputStream.resume();
inputStream.on('data', function(buf) { content += buf.toString(); });
inputStream.on('end', function() {
  let { code } = cq(content, query);
  console.log( code );
});
