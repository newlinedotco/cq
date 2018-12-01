import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import replace from "rollup-plugin-replace";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/cq.browser.js",
      name: "cq",
      format: "umd",
      sourcemap: false,
      exports: "default",
      intro: `
window.noop = function() {};
window.global = {}
    `,
      globals: {
        /*
      fs: "noop",
      path: "noop",
      os: "noop",
      crypto: "noop",
      buffer: "noop",
      module: "noop"
    */
      }
      // sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    replace({
      "process.browser": process.env.BROWSER === "true"
    }),

    commonjs({
      include: [
        "node_modules/**",
        "node_modules/typescript/**",
        "node_modules/babylon/**",
        "./src/query-parser.js"
      ], // Default: undefined
      namedExports: {
        // left-hand side can be an absolute path, a path
        // relative to the current directory, or the name
        // of a module in node_modules
        "./src/query-parser.js": ["SyntaxError", "parse"],
        "./node_modules/typescript/lib/typescript.js": [
          "SyntaxKind",
          "createSourceFile",
          "ScriptTarget",
          "getLeadingCommentRanges"
        ]
        // "./node_modules/babylon/lib/index.js": ["parse"]
      }
    }),
    // globals(),
    builtins()
  ]
};
