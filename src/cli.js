#!/usr/bin/env node
import cq from './index';
import yargs from 'yargs';
import fs from 'fs';

let argv = yargs
    .usage('Usage: $0 [options] <query> <file>')
    .example("$0 '.MyClass .fooFunction'", "show code for fooFunction() in MyClass")
    .help('help')
    .alias('help', 'h')
    .option('json', {
      alias: 'j',
      type: 'boolean',
      describe: 'Output results in machine-readable format'
    })
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
  let result = cq(content, query);

  if(argv.json === true) {
    delete result['nodes'];
    console.log( JSON.stringify(result, null, 2) );
  } else {
    console.log( result.code );
  }
});
