import 'babel-polyfill'
import chai from 'chai';
const assert = chai.assert;
import cq, { NodeTypes } from '../index';
import peg from 'pegjs';
import fs from 'fs';

let grammar = fs.readFileSync(__dirname + '/../query.pegjs').toString();
let parser = peg.buildParser(grammar);

// .Switch
// .Switch .render
// .hello
// .farm:-2,+2
// .hello-.Farm
// .hello-.Farm:-2,+2
// 10-12
// .Switch .renderOtherStuff-.render
// .Polygon .distance-.area


describe('queryParserTest', () => {
  describe('parsing', () => {

    it('should return a top level identifier', () => {
      let actual = parser.parse('.Switch');
      let expected = {
        type: NodeTypes.IDENTIFIER,
        matcher: 'Switch'
      };
      assert.deepEqual(actual, expected);
    });


    it('should parse children', () => {
      let actual = parser.parse('.Switch .render .cat');
      let expected = {
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
      };

      assert.deepEqual(actual, expected);
    });

    it('should parse ranges', () => {
      let actual = parser.parse('.hello-.Farm');
      let expected = {
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'hello'
        },
        end: {
          type: NodeTypes.IDENTIFIER,
          matcher: 'Farm'
        }
      };

      assert.deepEqual(actual, expected);
    });

    it('should parse children with ranges', () => {
      let actual = parser.parse('.Switch .renderOtherStuff-.render');
      let expected = {
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
      };

      assert.deepEqual(actual, expected);
    });
    
    it('should parse line numbers', () => {
      let actual = parser.parse('10-12');
      let expected = {
        type: NodeTypes.RANGE,
        start: {
          type: NodeTypes.LINE_NUMBER,
          value: 10
        },
        end: {
          type: NodeTypes.LINE_NUMBER,
          value: 12
        }
      };

      assert.deepEqual(actual, expected);
    });
 
 
   



  });
});



// TODO should actually return an array and support that
