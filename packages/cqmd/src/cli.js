#!/usr/bin/env node
const yargs = require("yargs");
const fs = require("fs");
const cqmd = require("./index");
const path = require("path");

/*
 * A markdown preprocessor that parses cq directives and replaces them with code blocks
 */
let argv = yargs
  .usage("Usage: $0 [options] <file>")
  .example("$0 post.md", "process post.md and emit the results on STDOUT")
  .help("help")
  .alias("help", "h")
  .option("output", {
    alias: "o",
    type: "string",
    describe: "Specify the output file"
  })
  .option("path", {
    alias: "p",
    type: "string",
    describe: "The root path for the code"
  })
  .option("gapFiller", {
    alias: "g",
    type: "string",
    describe: "gap-filler for discontiguous queries. Pass 'false' to disable",
    default: "\n  // ...\n"
  })
  // .option("format", {
  //   alias: "f",
  //   describe: "the format to convert codeblocks into",
  //   // choices: ['gfm', 'block', 'leanpub', 'raw'],
  //   choices: ["gfm", "raw"],
  //   default: "gfm"
  // })
  .version().argv;

let [filename] = argv._;
argv.absoluteFilePath = path.resolve(filename);
argv.path = argv.path || path.dirname(argv.absoluteFilePath);

let inputStream = filename ? fs.createReadStream(filename) : process.stdin;

// no filename nor stdin, so show the help
if (!filename && process.stdin.isTTY) {
  yargs.showHelp();
  process.exit();
}

var content = "";
inputStream.resume();
inputStream.on("data", function(buf) {
  content += buf.toString();
});
inputStream.on("end", function() {
  argv.gapFiller = argv.gapFiller === "false" ? false : argv.gapFiller;

  const cqOptions = {
    gapFiller: argv.gapFiller,
    root: argv.path
  };

  cqmd(content, cqOptions).then(result => {
    if (argv.output) {
      fs.writeFileSync(argv.output, result);
    } else {
      process.stdout.write(result);
    }
  });
});
