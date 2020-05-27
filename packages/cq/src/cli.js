#!/usr/bin/env node
import "babel-core/register";
import "babel-polyfill";
import "regenerator-runtime";
import cq from "./index";
import yargs from "yargs";
import fs from "fs";

let argv = yargs
  .usage("Usage: $0 [options] <query> <file>")
  .example(
    "$0 '.MyClass .fooFunction'",
    "show code for fooFunction() in MyClass"
  )
  .help("help")
  .alias("help", "h")
  .option("json", {
    alias: "j",
    type: "boolean",
    describe: "Output results in machine-readable format"
  })
  .option("short", {
    alias: "s",
    type: "boolean",
    describe: "emit short json result (no code). requires --json"
  })
  .option("gapFiller", {
    alias: "g",
    type: "string",
    describe: "gap-filler for discontiguous queries. Pass 'false' to disable",
    default: "\n  // ...\n"
  })
  .option("engine", {
    alias: "e",
    describe: "parsing engine. e.g. auto, babylon, typescript, treeSitter",
    default: "auto"
  })
  .option("language", {
    alias: "l",
    describe: "language - req'd for treeSitter engine",
    default: "javascript"
  }).argv;

let [query, filename] = argv._;

if (!query) {
  yargs.showHelp();
  process.exit();
}

let engine;

if (argv.gapFiller) {
  argv.gapFiller = argv.gapFiller.replace(/\\n/g, "\n");
}

// pick the parsing engine
switch (argv.engine) {
  case "babylon":
  case "typescript":
  case "treeSitter":
    engine = argv.engine;
    break;
  case "auto":
    if (filename && filename.match(/\.tsx?/)) {
      engine = "typescript";
    } else {
      engine = "babylon";
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
        if (!foundEngine) {
          engine = require(potentialEngine)();
          foundEngine = true;
        }
      } catch (err) {}
    });
    if (!foundEngine) {
      throw new Error("unknown engine: " + argv.engine);
    }
}

let inputStream = filename ? fs.createReadStream(filename) : process.stdin;

var content = "";
inputStream.resume();
inputStream.on("data", function (buf) {
  content += buf.toString();
});
inputStream.on("end", function () {
  let gapFiller = argv.gapFiller === "false" ? false : argv.gapFiller;

  cq(content, query, { engine, gapFiller, language: argv.language }).then(
    (result) => {
      if (argv.json === true) {
        delete result["nodes"];
        if (argv.short === true) {
          delete result["code"];
        }
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result.code);
      }
    }
  );
});
