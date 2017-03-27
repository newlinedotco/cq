import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import cq, { NodeTypes } from '../src/index';
import peg from 'pegjs';
import fs from 'fs';

let grammar = fs.readFileSync(__dirname + '/../src/query.pegjs').toString();
let parser = peg.buildParser(grammar);

describe('queryParserTest', () => {
  describe('parsing', () => {

    it('should return a top level identifier', () => {
      let actual = parser.parse('.Switch');
      let expected = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch'
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse children', () => {
      let actual = parser.parse('.Switch .render .cat');
      let expected = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch',
        children: [{
          type: NodeTypes.IDENTIFIER,
          matcher: 'render',
          children: [{
            type: NodeTypes.IDENTIFIER,
            matcher: 'cat',
          }]
        }]
      }];

      assert.deepEqual(actual, expected);
    });

    it('should parse ranges', () => {
      let actual = parser.parse('.hello-.Farm');
      let expected = [{
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'hello'
        },
        end: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'Farm'
        }
      }];

      assert.deepEqual(actual, expected);
    });

    it('should parse children with ranges', () => {
      let actual = parser.parse('.Switch .renderOtherStuff-.render');
      let expected = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch',
        children: [{
          type: NodeTypes.RANGE,
          start: {
            type: NodeTypes.IDENTIFIER,
            matcher: 'renderOtherStuff'
          }, 
          end: {
            type: NodeTypes.IDENTIFIER,
            matcher: 'render'
          }
        }]
      }];

      assert.deepEqual(actual, expected);
    });

    it('should parse ranges with children on the right', () => {
      let actual = parser.parse('.Switch-(.parent .child)');
      let expected = [{
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'Switch'
        },
        end: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'parent',
          children: [{
            type: NodeTypes.IDENTIFIER,
            matcher: 'child'
          }]
        }
      }];

      assert.deepEqual(actual, expected);
    });

    it('should parse EOF in a range', () => {
      let actual = parser.parse('1-EOF');
      let expected = [{
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.LINE_NUMBER,
          value: 1
        },
        end: {
          type: NodeTypes.LINE_NUMBER,
          value: 'EOF'
        }
      }];

      assert.deepEqual(actual, expected);
    });

    it('should parse a string', () => {
      let actual = parser.parse("'hi mom'");
      let expected = [{
        type: NodeTypes.STRING,
        matcher: 'hi mom'
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse a string with children', () => {
      let actual = parser.parse("'My Test' 'should work'");
      let expected = [{
        type: NodeTypes.STRING,
        matcher: 'My Test',
        children: [{
          type: NodeTypes.STRING,
          matcher: 'should work'
        }]
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse a string in a range', () => {
      let actual = parser.parse("1-'foo'");
      let expected = [{
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.LINE_NUMBER,
          value: 1
        },
        end: {
          type: NodeTypes.STRING,
          matcher: 'foo'
        }
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse function modifiers', () => {
      let actual = parser.parse('upto(.foo)');
      let expected = [{
        type: NodeTypes.CALL_EXPRESSION,
        callee: 'upto',
        arguments: [{
          type: NodeTypes.IDENTIFIER,
          matcher: 'foo'
        }]
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse functions with arguments', () => {
      let actual = parser.parse('context(.foo, 2, 2)');
      let expected = [{
        type: NodeTypes.CALL_EXPRESSION,
        callee: 'context',
        arguments: [{
          type: NodeTypes.IDENTIFIER,
          matcher: 'foo'
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: 2
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: 2
        }]
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse functions with ranges as arguments', () => {
      let actual = parser.parse('context(.foo-.bar, 2, 2)');
      let expected = [{
        type: NodeTypes.CALL_EXPRESSION,
        callee: 'context',
        arguments: [{
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'foo'
        },
        end: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'bar'
        }
      }, {
          type: NodeTypes.LINE_NUMBER,
          value: 2
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: 2
        }]
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse nested functions', () => {
      let actual = parser.parse('cats(upto(.foo))');
      let expected = [{
        type: NodeTypes.CALL_EXPRESSION,
        callee: 'cats',
        arguments: [{
          type: NodeTypes.CALL_EXPRESSION,
          callee: 'upto',
          arguments: [{
            type: NodeTypes.IDENTIFIER,
            matcher: 'foo'
          }]
        }]
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse functions with child selections in arguments', () => {
      let actual = parser.parse('context(.foo .bar, 2, 2)');
      let expected = [{
        type: NodeTypes.CALL_EXPRESSION,
        callee: 'context',
        arguments: [{
          matcher: 'foo',
          type: NodeTypes.IDENTIFIER,
          children:[{
            type: NodeTypes.IDENTIFIER,
            matcher: 'bar'
          }]
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: 2
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: 2
        }]
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse functions with negative numbers as arguments', () => {
      let actual = parser.parse('context(.foo, -2, -3)');
      let expected = [{
        type: NodeTypes.CALL_EXPRESSION,
        callee: 'context',
        arguments: [{
          matcher: 'foo',
          type: NodeTypes.IDENTIFIER,
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: -2 
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: -3 
        }]
      }];
      assert.deepEqual(actual, expected);
    });

    it('should parse functions in ranges', () => {
      let actual = parser.parse('upto(.foo)-30');
      let expected =  [{
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.CALL_EXPRESSION,
          callee: 'upto',
          arguments: [{
            type: NodeTypes.IDENTIFIER,
            matcher: 'foo'
          }]
        },
        end: {
          type: NodeTypes.LINE_NUMBER,
          value: 30
        }
      }];
      assert.deepEqual(actual, expected);
    });

    it('should return two top level identifiers', () => {
      let actual = parser.parse('.Switch, .Cow');
      let expected = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch'
      },
      {
        type: NodeTypes.IDENTIFIER,
        matcher: 'Cow'
      }];
      assert.deepEqual(actual, expected);
    });

    it('should return two top level identifiers with parens', () => {
      let actual = parser.parse('(.Switch, .Cow)');
      let expected = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch'
      },
      {
        type: NodeTypes.IDENTIFIER,
        matcher: 'Cow'
      }];
      assert.deepEqual(actual, expected);
    });


    it('should return two top level identifiers, even with functions', () => {
      let actual = parser.parse('.Switch, context(.foo, -2, -3)');
      let expected = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch'
      },
      {
        type: NodeTypes.CALL_EXPRESSION,
        callee: 'context',
        arguments: [{
          matcher: 'foo',
          type: NodeTypes.IDENTIFIER,
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: -2 
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: -3 
        }]
      }];
      assert.deepEqual(actual, expected);
    });


    it('should return two top level identifiers, even with functions with parens', () => {
      let actual = parser.parse('(.Switch, context(.foo, -2, -3))');
      let expected = [{
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch'
      },
      {
        type: NodeTypes.CALL_EXPRESSION,
        callee: 'context',
        arguments: [{
          matcher: 'foo',
          type: NodeTypes.IDENTIFIER,
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: -2 
        }, {
          type: NodeTypes.LINE_NUMBER,
          value: -3 
        }]
      }];
      assert.deepEqual(actual, expected);
    });



  });
});
