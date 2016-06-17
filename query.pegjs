 /*
 * Simple Arithmetics Grammar
 * ==========================
 *
 * Accepts expressions like "2 * (3 + 4)" and computes their value.
 */

{
  let cq = require(__dirname + "/../../../index");
  let NodeTypes = cq.NodeTypes;
}

start
  = SelectionExpression
// modifiers

SelectionExpression
  = head:Term tail:(ws Term)* {
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

Integer "integer"
  = [0-9]+ { return parseInt(text(), 10); }

dot = "."
dash = "-"
colon = ":"
_ "whitespace" = [ \t\n\r]*
ws "whitespace" = [ \t\n\r]*
char = [A-Za-z0-9_$]
