 /*
 * cq Grammer
 * ==========================
 *
 * Example Queries:
 * 
 * .Switch
 * .Switch .render
 * .hello
 * .farm:-2,+2
 * .hello-.Farm
 * .hello-.Farm:-2,+2
 * 10-12
 * .Switch .renderOtherStuff-.render
 * .Polygon .distance-.area
 * .Switch-(.parent .child)
 * 
 */

{
  // ideally we would load this from the other cq code, but this is less hassle for now
  const NodeTypes = {
    IDENTIFIER: 'IDENTIFIER',
    RANGE: 'RANGE',
    LINE_NUMBER: 'LINE_NUMBER',
    EXTRA_LINES: 'EXTRA_LINES'
  };
}

start
  = SelectionExpression

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
  = term:Term colon? modifiers:Modifiers? {
    if(modifiers) {
      term.modifiers = modifiers;
    }
    return term;
  }

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
  / SelectionGroup

SelectionGroup
  = openParen node:SelectionExpression closeParen {
    return node;
  }

Identifier
  = dot chars:char+ { 
      return { 
        type: NodeTypes.IDENTIFIER, 
        matcher: chars.join("")
      };
  }

Modifiers
  = head:Modifier tail:(comma Modifier)* {
    return [head, ...tail.map((t) => t[1])];
  }

Modifier
  = operator:ModifierOperator number:LineNumber {
    return {
      type: NodeTypes.EXTRA_LINES,
      amount: operator == '-' ? (number * -1) : number
    }
  }

ModifierOperator
  = plus
  / minus

LineNumber
  = Integer
  / SpecialLineNumber

Integer "integer"
  = [0-9]+ { return parseInt(text(), 10); }

SpecialLineNumber
  = eof

dot = "."
dash = "-"
plus = "+"
minus = "-"
colon = ":"
comma = ","
openParen = "("
closeParen = ")"
eof = "EOF"
ws "whitespace" = [ \t\n\r]*
char = [A-Za-z0-9_$]
