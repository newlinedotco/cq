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
 * 
 */

{
  let cq = require(__dirname + "/../../../index");
  let NodeTypes = cq.NodeTypes;
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
  / number:Integer {
    return {
      type: NodeTypes.LINE_NUMBER,
      value: number
    }
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
  = operator:ModifierOperator number:Integer {
    return {
      type: NodeTypes.EXTRA_LINES,
      amount: operator == '-' ? (number * -1) : number
    }
  }

ModifierOperator
  = plus
  / minus

Integer "integer"
  = [0-9]+ { return parseInt(text(), 10); }

dot = "."
dash = "-"
plus = "+"
minus = "-"
colon = ":"
comma = ","
ws "whitespace" = [ \t\n\r]*
char = [A-Za-z0-9_$]
