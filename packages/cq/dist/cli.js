#!/usr/bin/env node
"use strict";

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

require("babel-core/register");

require("babel-polyfill");

require("regenerator-runtime");

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _yargs = require("yargs");

var _yargs2 = _interopRequireDefault(_yargs);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var argv = _yargs2.default.usage("Usage: $0 [options] <query> <file>").example("$0 '.MyClass .fooFunction'", "show code for fooFunction() in MyClass").help("help").alias("help", "h").option("json", {
  alias: "j",
  type: "boolean",
  describe: "Output results in machine-readable format"
}).option("short", {
  alias: "s",
  type: "boolean",
  describe: "emit short json result (no code). requires --json"
}).option("gapFiller", {
  alias: "g",
  type: "string",
  describe: "gap-filler for discontiguous queries. Pass 'false' to disable",
  default: "\n  // ...\n"
}).option("engine", {
  alias: "e",
  describe: "parsing engine. e.g. auto, babylon, typescript, treeSitter",
  default: "auto"
}).option("language", {
  alias: "l",
  describe: "language - req'd for treeSitter engine",
  default: "javascript"
}).argv;

var _argv$_ = (0, _slicedToArray3.default)(argv._, 2),
    query = _argv$_[0],
    filename = _argv$_[1];

if (!query) {
  _yargs2.default.showHelp();
  process.exit();
}

var engine = void 0;

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
    var foundEngine = false;
    ["@fullstackio/cq-" + argv.engine + "-engine", "cq-" + argv.engine + "-engine", argv.engine].map(function (potentialEngine) {
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

var inputStream = filename ? _fs2.default.createReadStream(filename) : process.stdin;

var content = "";
inputStream.resume();
inputStream.on("data", function (buf) {
  content += buf.toString();
});
inputStream.on("end", function () {
  var gapFiller = argv.gapFiller === "false" ? false : argv.gapFiller;

  (0, _index2.default)(content, query, { engine: engine, gapFiller: gapFiller, language: argv.language }).then(function (result) {
    if (argv.json === true) {
      delete result["nodes"];
      if (argv.short === true) {
        delete result["code"];
      }
      console.log((0, _stringify2.default)(result, null, 2));
    } else {
      console.log(result.code);
    }
  });
});