#!/usr/bin/env node
import cq from './index';
import yargs from 'yargs';
import fs from 'fs';

let argv = yargs
    .usage('Usage: $0 <command> [options]')
    .example("$0 '.foo .bar'", "show foo bar")
    .help('h')
    .alias('h', 'help')
    .argv;

let [query, filename] = argv._;

let inputStream = filename ? fs.createReadStream(filename) : process.stdin;

var content = '';
inputStream.resume();
inputStream.on('data', function(buf) { content += buf.toString(); });
inputStream.on('end', function() {
  let { code } = cq(content, query);
  console.log( code );
});
