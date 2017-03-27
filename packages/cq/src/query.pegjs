 /*
 * cq Grammer
 * ==========================
 *
 * Example Queries:
 * 
 * .Switch
 * .Switch .render
 * .hello
 * .hello-.Farm
 * 10-12
 * .Switch .renderOtherStuff-.render
 * .Polygon .distance-.area
 * .Switch-(.parent .child)
 * 'My Test'
 * 'My Test' 'should work'
 * 1-'foo'
 */

{
  // ideally we would load this from the other cq code, but module importing here is a bit buggy
  const NodeTypes = {
    IDENTIFIER: 'IDENTIFIER',
    RANGE: 'RANGE',
    LINE_NUMBER: 'LINE_NUMBER',
    CALL_EXPRESSION: 'CALL_EXPRESSION',
    STRING: 'STRING'
  };

  const QueryResultTypes = {
    SELECTION_EXPRESSION: 'SELECTION_EXPRESSION'
  };

  function extractOptional(optional, index) {
    return optional ? optional[index] : null;
  }

  function optionalList(value) {
    return value !== null ? value : [];
  }

  function extractList(list, index) {
    var result = new Array(list.length), i;

    for (i = 0; i < list.length; i++) {
      result[i] = list[i][index];
    }

    return result;
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }


}

start
  = SelectionExpressions
  / openParenWs selExps:SelectionExpressions closeParenWs {
    return selExps;
  }


SelectionExpressions
  = head:SelectionExpression tail:(ws comma ws SelectionExpression)* {
    // TODO: potentially use this for identifying the discontinuous queries
    // head.queryType = QueryResultTypes.SELECTION_EXPRESSION;
    return buildList(head, tail, 3);
  }

SelectionExpression
  = head:TermWithModifiers tail:(ws TermWithModifiers)* {
    let result = head;
    let i;

    // .foo .bar .baz is a child term selection
    let parent = head;
    for(i = 0; i < tail.length; i++) {
      let thisTerm = tail[i][1];
      parent.children = [ thisTerm ];
      parent = thisTerm;
    }

    return result;
  }

TermWithModifiers 
  = Term

Term
  = Range
  / Selection 

Range
  = start:Selection dash end:Selection {
    return {
      type: NodeTypes.RANGE,
      start: start,
      end: end
    }
  }

Selection
  = Identifier
  / number:LineNumber {
    return {
      type: NodeTypes.LINE_NUMBER,
      value: number
    }
  }
  / String
  / SelectionGroup
  / CallExpression

SelectionGroup
  = openParenWs node:SelectionExpression closeParenWs {
    return node;
  }

String
  = singleQuote str:innerString singleQuote {
    return {
      type: NodeTypes.STRING,
      matcher: str.join("")
    }
  }

Identifier
  = dot chars:char+ { 
      return { 
        type: NodeTypes.IDENTIFIER, 
        matcher: chars.join("")
      };
  }

Arguments
  = "(" ws args:(ArgumentList ws)? ")" {
      return optionalList(extractOptional(args, 0));
    }

ArgumentList
  = head:FunctionArgument tail:(ws comma ws FunctionArgument)* {
      return buildList(head, tail, 3);
    }

FunctionArgument
  = SelectionExpression
  / CallExpression
  / Boolean

CallExpression
  = callee:char+ args:Arguments {
    return {
      type: "CALL_EXPRESSION",
      callee: callee.join(''),
      arguments: args
    }
  }

LineNumber
  = Integer
  / SpecialLineNumber

Integer "integer"
  = dash? [0-9]+ { return parseInt(text(), 10); }

Boolean "boolean"
  = true 
  / false

SpecialLineNumber
  = eof

ws "whitespace" = [ \t\n\r]*
dot = "."
dash = "-"
colon = ":"
comma = ","
openParen = "("
openParenWs = openParen ws
closeParen = ")"
closeParenWs = closeParen ws
eof = "EOF"
true = "true" { return true; }
false = "false" { return false; }
singleQuote = "'"
char = [A-Za-z0-9_$]
innerString = [^\n\']*
