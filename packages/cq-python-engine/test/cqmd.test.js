import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import cqmd from '../src/index';
import fs from 'fs';

describe('cqmd core', () => {

  it('should convert to gfm', () => {
    let input = `
# a document

Here's some code

{lang=javascript,crop-query=.hello}
<<[](data/basic.js)

and here's more 

{lang=javascript,crop-query=context(.bye, 1, 0)}
<<[](data/basic.js)

That's all
    `

    let expected = `
# a document

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
    `
    let actual = cqmd(input, {path: __dirname});
    assert.equal(actual, expected);
  });

})

