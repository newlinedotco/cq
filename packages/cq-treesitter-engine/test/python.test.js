import chai from "chai";
const assert = chai.assert;
import cq, { NodeTypes } from "../../cq/src/index";
import treesitterEngine from "../src/index";
const engine = treesitterEngine();

function lines(str, startLine, endLine) {
  return str
    .split("\n")
    .slice(startLine, endLine + 1)
    .join("\n");
}

async function assertQueryLines(rawCode, query, lineRange) {
  let [startLine, endLine] = lineRange;
  let { code } = await cq(rawCode, query, { engine, language: "python" });
  const wanted = lines(rawCode, startLine, endLine);
  assert.equal(code, wanted);
}

describe("python", () => {
  describe("top level functions", () => {
    const src = `
def hello():
  return "hello";

bye = lambda: "bye"

bye() # -> bye

# never say goodbye`;

    var tests = [
      {
        desc: "should return a function definition",
        query: ".hello",
        lines: [1, 2]
      },
      {
        desc: "should return an anonymous function assigned to a variable",
        query: ".bye",
        lines: [4, 4]
      }
    ];

    tests.forEach(function (test) {
      it(test.desc, async () => {
        await assertQueryLines(src, test.query, test.lines);
      });
    });

    // it("py test", async () => {
    //   await assertQueryLines(src, ".hello", [1, 2]);
    // });
  });

  describe("classes", async () => {
    const src = `
import mycats

class Cat(object):

    def __init__(self, name):
        self.name = name

    def meow(self):
        print 'Im a talking cat'

pickles = Cat('pickles')

pickles.meow()
`;
    var tests = [
      {
        desc: "should return an import line",
        query: ".mycats",
        lines: [1, 1]
      },
      {
        desc: "should return a class",
        query: ".Cat",
        lines: [3, 9]
      },
      {
        desc: "should return a constructor",
        query: ".__init__",
        lines: [5, 6]
      },
      {
        desc: "should return a method",
        query: ".meow",
        lines: [8, 9]
      },
      {
        desc: "should return an instantiation",
        query: ".pickles",
        lines: [11, 11]
      }
    ];

    tests.forEach(function (test) {
      it(test.desc, async () => {
        await assertQueryLines(src, test.query, test.lines);
      });
    });
  });

  describe("searching for strings", async () => {
    const src = `
def main(_):
    # Create the model
    x = tf.placeholder(tf.float32, [None, 784])
    W = tf.Variable('dubya')
    y = tf.matmul(x, W) + b
    b = ['my', 'dog', 'has', 'fleas']

print 'you did it'`;

    var tests = [
      {
        desc: "should find a single string",
        query: `'dubya'`,
        lines: [4, 4]
      },
      {
        desc: "should find a string in a range",
        query: `2-'dubya'`,
        lines: [1, 4]
      },
      {
        desc: "should find a range of strings",
        query: `'dubya'-'dog'`,
        lines: [4, 6]
      }
    ];

    tests.forEach(function (test) {
      it(test.desc, async () => {
        await assertQueryLines(src, test.query, test.lines);
      });
    });
  });

  describe.skip("getting comments", async () => {
    const src = `
# returns a real alert
# a real one
def alert(message):
  print 'tricked ya!'

def sleep(message):
  """Sleep all day. Party all night"""
  print 'whomp whomp'
`;

    var tests = [
      {
        desc: "find a group of comments preceeding",
        query: `comments(.alert)`,
        lines: [1, 4]
      }
    ];

    tests.forEach(function (test) {
      it(test.desc, async () => {
        await assertQueryLines(src, test.query, test.lines);
      });
    });
  });

  describe("objects definitions", () => {
    const src = `
# single line
person = { 'name': 'nate' };
people = [ person ];

# multiline
default_port = {
    'ftp': 21,
    'telnet': 23,
    'http': 80
}
dogs = [
    (False, "Henry"),
    (True, "Zappo")
]

# bye!`;

    var tests = [
      {
        desc: "should return a single-line object",
        query: ".person",
        lines: [2, 2]
      },
      {
        desc: "should return a single-line array",
        query: ".people",
        lines: [3, 3]
      },
      {
        desc: "should return a multi-line object",
        query: ".default_port",
        lines: [6, 10]
      },
      {
        desc: "should return a multi-line array",
        query: ".dogs",
        lines: [11, 14]
      }
    ];

    tests.forEach(function (test) {
      it(test.desc, async () => {
        await assertQueryLines(src, test.query, test.lines);
      });
    });
  });
});
