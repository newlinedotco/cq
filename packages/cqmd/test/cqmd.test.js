const chai = require("chai");
const assert = chai.assert;
const cqmd = require("../src/index");
const fs = require("fs");

describe("cqmd core", () => {
  it("should convert to gfm", async () => {
    let input = `# a document

Here's some code

{lang=javascript,crop-query=.hello}
<<[](data/basic.js)

and here's more 

{lang=javascript,crop-query=context(.bye, 1, 0)}
<<[](data/basic.js)

That's all`;

    let expected = `# a document

Here's some code

\`\`\`javascript
function hello() { return 'hi'; }
\`\`\`

and here's more 

\`\`\`javascript
// a salutation
function bye() { 
  return 'bye'; 
}
\`\`\`

That's all
`;
    let actual = await cqmd(input, { root: __dirname });
    assert.equal(actual, expected);
  });
  it("should load files it can't parse by line numbers", async () => {
    let input = `Here's some code

{lang=javascript,crop-start-line=1,crop-end-line=5}
<<[](data/VueComponent.vue)`;

    let expected = `Here's some code

\`\`\`javascript
<template>
  <div>
    <ChildComponent :numbers="numbers" />
  </div>
</template>
\`\`\`
`;
    let actual = await cqmd(input, { root: __dirname });
    assert.equal(actual, expected);
  });
  it("should load a while file if you don't specify otherwise", async () => {
    let input = `Here's some code

{lang=frobner}
<<[](data/textfile.txt)`;

    let expected = `Here's some code

\`\`\`frobner
This is a short textfile 

*_*
\`\`\`
`;
    let actual = await cqmd(input, { root: __dirname });
    assert.equal(actual, expected);
  });
});
