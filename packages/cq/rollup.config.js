const replace = require("rollup-plugin-replace");
export default {
  entry: "src/index.js",
  format: "cjs",
  plugins: [
    replace({
      "process.browser": process.env.BROWSER === "true"
    })
  ]
};
