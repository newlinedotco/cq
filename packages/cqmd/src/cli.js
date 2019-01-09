#!/usr/bin/env node
const yargs = require("yargs");
const fs = require("fs");
const cqmd = require("./index");
const path = require("path");
const chokidar = require("chokidar");

// TODO:
// - specify outputDir
// - retainPaths option -- use a remark plugin to set the root of relative paths to be relative to the original file
// - write remark-adjust-paths library
//

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
    describe:
      "The root path for the code (defaults to the dir of the input file)"
  })
  .option("gapFiller", {
    alias: "g",
    type: "string",
    describe: "gap-filler for discontiguous queries. Pass 'false' to disable",
    default: "\n  // ...\n"
  })
  .option("watch", {
    alias: "w",
    type: "boolean",
    describe: "watch for changes"
  })
  .option("watchGlob", {
    type: "string",
    describe: "glob for what to watch"
  })
  .option("remarkExtensions", {
    type: "string",
    describe: "comma-separated string of remark extensions to use"
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
argv.output = argv.output ? path.resolve(argv.output) : null;

// no filename nor stdin, so show the help
if (!filename && process.stdin.isTTY) {
  yargs.showHelp();
  process.exit();
}

argv.gapFiller = argv.gapFiller === "false" ? false : argv.gapFiller;
const cqOptions = {
  gapFiller: argv.gapFiller,
  root: argv.path
};

if (argv.remarkExtensions) {
  cqOptions.extensions = argv.remarkExtensions.split(",");
}

if (argv.watch) {
  const watchGlob = argv.watchGlob || [
    argv.absoluteFilePath,
    argv.path + "/**/*"
  ];

  var watcher = chokidar.watch(watchGlob, {
    ignored: [/(^|[\/\\])\../, argv.output],
    followSymlinks: false,
    persistent: true
  });

  async function processCqFile(filename, cqOptions) {
    const content = fs.readFileSync(filename);
    const result = await cqmd(content, cqOptions);
    if (argv.output) {
      fs.writeFileSync(argv.output, result);
      console.log(`Wrote ${argv.output}`);
    } else {
      process.stdout.write(result);
    }
  }

  watcher.on("change", async path => {
    console.log(`File ${path} changed`);
    await processCqFile(filename);
  });

  processCqFile(filename);
} else {
  let inputStream = filename ? fs.createReadStream(filename) : process.stdin;

  var content = "";
  inputStream.resume();
  inputStream.on("data", function(buf) {
    content += buf.toString();
  });
  inputStream.on("end", function() {
    cqmd(content, cqOptions).then(result => {
      if (argv.output) {
        fs.writeFileSync(argv.output, result);
      } else {
        process.stdout.write(result);
      }
    });
  });
}
