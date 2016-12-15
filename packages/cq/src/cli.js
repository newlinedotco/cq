#!/usr/bin/env node
import 'babel-polyfill';
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
    .option('short', {
      alias: 's',
      type: 'boolean',
      describe: 'emit short json result (no code). requires --json'
    })
    .option('engine', {
      alias: 'e',
      describe: 'parsing engine. e.g. auto, babylon, typescript',
      default: 'auto'
    })
    .argv;

let [query, filename] = argv._;

if(!query) {
  yargs.showHelp();
  process.exit();
}

let engine;

// pick the parsing engine
switch (argv.engine) {
case 'babylon':
case 'typescript':
  engine = argv.engine;
  break;
case 'auto':
  if(filename && filename.match(/\.tsx?/)) {
    engine = 'typescript';
  } else {
    engine = 'babylon';
  }
  break;
default:
    let foundEngine = false;
    [ 
      `@fullstackio/cq-${argv.engine}-engine`,
      `cq-${argv.engine}-engine`,
      argv.engine
    ].map((potentialEngine) => {
      try {
        if(!foundEngine) {
          engine = require(potentialEngine);
          foundEngine = true
        }
      } catch (err) {
      }
    })
    if(!foundEngine) {
      throw new Error('unknown engine: ' + argv.engine);
    }
}

let inputStream = filename ? fs.createReadStream(filename) : process.stdin;

var content = '';
inputStream.resume();
inputStream.on('data', function(buf) { content += buf.toString(); });
inputStream.on('end', function() {
  cq(content, query, { engine }).then((result) => {

    if(argv.json === true) {
      delete result['nodes'];
      if(argv.short === true) {
        delete result['code'];
      }
      console.log( JSON.stringify(result, null, 2) );
    } else {
      console.log( result.code );
    }
  })
});
