import "babel-polyfill";
import chai from "chai";
const assert = chai.assert;
import { splitNoParen } from "../src/util";

describe("cqmd util", () => {
  describe("splitNoParen", () => {
    it("should split in the simple case", () => {
      assert.deepEqual(splitNoParen("foo,bar,baz"), ["foo", "bar", "baz"]);
    });

    it("should split function calls", () => {
      assert.deepEqual(splitNoParen("foo,bam(0), baz"), [
        "foo",
        "bam(0)",
        " baz"
      ]);
    });

    it("should allow ranges", () => {
      assert.deepEqual(splitNoParen("foo-bar,baz"), ["foo-bar", "baz"]);
    });

    it("should functions at the start of ranges", () => {
      assert.deepEqual(splitNoParen("cats,foo(.fs)-bar,baz"), [
        "cats",
        "foo(.fs)-bar",
        "baz"
      ]);
    });

    it("should functions at the end of ranges", () => {
      assert.deepEqual(splitNoParen("cats,bar-foo(.fs),baz"), [
        "cats",
        "bar-foo(.fs)",
        "baz"
      ]);
    });

    it("should allow groupings at the start of ranges", () => {
      assert.deepEqual(splitNoParen("cats,(.fs-.foo)-.bar,baz"), [
        "cats",
        "(.fs-.foo)-.bar",
        "baz"
      ]);
    });

    it("should allow groupings at the end of ranges", () => {
      assert.deepEqual(splitNoParen("cats,.bar-(.fs-.foo),baz"), [
        "cats",
        ".bar-(.fs-.foo)",
        "baz"
      ]);
    });

    it("should allow function arguments", () => {
      assert.deepEqual(splitNoParen("cats,.bar(.fs, .foo),baz"), [
        "cats",
        ".bar(.fs, .foo)",
        "baz"
      ]);
    });

    it("should allow nested functions", () => {
      assert.deepEqual(splitNoParen("cats,.bar(bam(.fs, .qs), .foo),baz"), [
        "cats",
        ".bar(bam(.fs, .qs), .foo)",
        "baz"
      ]);
    });

    it("should parse the SO question", () => {
      assert.deepEqual(
        splitNoParen('"abc",ab(),c(d(),e()),f(g(),zyx),h(123)'),
        ['"abc"', "ab()", "c(d(),e())", "f(g(),zyx)", "h(123)"]
      );
    });
  });
});
