#!/usr/bin/env node
const yargs = require("yargs");
const fs = require("fs-extra");
const cqmd = require("./index");
const path = require("path");
const chokidar = require("chokidar");
const relative = require("relative");

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
  .example(
    "$0 post.md",
    "process post.md and emit the results on STDOUT"
  )
  .help("help")
  .alias("help", "h")
  .option("output", {
    alias: "o",
    type: "string",
    describe: "Specify the output file",
  })
  .option("path", {
    alias: "p",
    type: "string",
    describe:
      "The root path for the code (defaults to the dir of the *input* file)",
  })
  .option("adjustPath", {
    type: "string",
    describe:
      "The path to use to adjust relative paths in the *output* files (advanced)",
  })
  .option("gapFiller", {
    alias: "g",
    type: "string",
    describe:
      "gap-filler for discontiguous queries. Pass 'false' to disable",
    default: "\n  // ...\n",
  })
  .option("watch", {
    alias: "w",
    type: "boolean",
    describe: "watch for changes",
  })
  .option("watchGlob", {
    type: "string",
    describe: "glob for what to watch. Implies --watch",
  })
  .option("remarkExtensions", {
    type: "string",
    describe:
      "comma-separated string of remark extensions to use",
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
argv.absoluteFilePath = filename
  ? path.resolve(filename)
  : null;
argv.path = argv.path
  ? argv.path
  : argv.absoluteFilePath
  ? path.dirname(argv.absoluteFilePath)
  : null;
argv.output = argv.output
  ? path.resolve(argv.output)
  : null;

const outputIsDir =
  argv.output && fs.lstatSync(argv.output).isDirectory();

// const outputDir =
//   argv.output && fs.existsSync(argv.output)
//     ? fs.lstatSync(argv.output).isDirectory()
//       ? argv.output
//       : path.dirname(argv.output)
//     : null;

// const outputToInputPath = outputDir
//   ? relative(argv.output, path.dirname(filename))
//   : null;
// console.log("outputToInputPath: ", outputToInputPath);

// no filename nor stdin, so show the help
if (!filename && !argv.watchGlob && process.stdin.isTTY) {
  yargs.showHelp();
  process.exit();
}

argv.gapFiller =
  argv.gapFiller === "false" ? false : argv.gapFiller;
const cqOptions = {
  gapFiller: argv.gapFiller,
  root: argv.path,
  adjustPath: argv.adjustPath,
};

if (argv.remarkExtensions) {
  cqOptions.extensions = argv.remarkExtensions.split(",");
}

if (argv.watch || argv.watchGlob) {
  const watchGlob = argv.watchGlob || [
    argv.absoluteFilePath,
    argv.path + "/**/*",
  ];

  var watcher = chokidar.watch(watchGlob, {
    ignored: [/(^|[\/\\])\../, argv.output],
    followSymlinks: false,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
    },
  });

  async function processCqFile(filename, cqOptions) {
    const content = fs.readFileSync(filename);
    const result = await cqmd(content, {
      ...cqOptions,
      filename,
    });
    if (argv.output) {
      const outputPath = outputIsDir
        ? path.join(argv.output, path.basename(filename))
        : argv.output;

      fs.writeFileSync(outputPath, result);
      console.log(`Wrote ${outputPath}`);
    } else {
      process.stdout.write(result);
    }
  }

  watcher.on("change", async (changedPath) => {
    console.log(`File ${changedPath} changed`);
    try {
      await processCqFile(changedPath, cqOptions);
    } catch (err) {
      console.log("ERROR:", changedPath, err);
    }
  });

  watcher.on("add", async (changedPath) => {
    console.log(`File ${changedPath} detected`);
    try {
      await processCqFile(changedPath, cqOptions);
    } catch (err) {
      console.log("ERROR:", changedPath, err);
    }
  });

  if (filename) {
    processCqFile(filename, cqOptions);
  }
  console.log(`Watching ${watchGlob}`);
} else {
  let inputStream = filename
    ? fs.createReadStream(filename)
    : process.stdin;

  var content = "";
  inputStream.resume();
  inputStream.on("data", function (buf) {
    content += buf.toString();
  });
  inputStream.on("end", function () {
    cqmd(content, { ...cqOptions, filename }).then(
      (result) => {
        if (argv.output) {
          const outputPath = outputIsDir
            ? path.join(
                argv.output,
                path.basename(filename)
              )
            : argv.output;
          fs.writeFileSync(outputPath, result);
          console.log(`Wrote ${outputPath}`);
        } else {
          process.stdout.write(result);
        }
      }
    );
  });
}
