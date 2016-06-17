let babel = require("babel-core");
import traverse from 'babel-traverse';

export const NodeTypes = {
  IDENTIFIER: 'IDENTIFIER'
};

function resolveIndividualQuery(ast, root, code, query, opts) {

  switch(query.type) {
  case NodeTypes.IDENTIFIER: 
    let nextRoot;
    let start, end;

    // if the identifier exists in the scope, this is the easiest way to fetch
    // it
    if(root.scope && root.scope.getBinding(query.matcher)) {
      let binding = root.scope.getBinding(query.matcher)
      let parent = binding.path.parent;
      start = parent.start;
      end = parent.end;
      nextRoot = parent;
    } else {

      let path;
      traverse(ast, {
        Program: function (_path) {
          path = _path;
          _path.stop();
        }
      });

      console.log(path);
      
    }
    
    let codeSlice = code.substring(start, end);

    if(query.children) {
      return resolveListOfQueries(ast, nextRoot, code, query.children, opts);
    } else {
      return { code: codeSlice };
    }

    break;
  default:
    break;
  }

}

function getProgram(ast) {
  var path;

  traverse(ast, {
    Program: function (_path) {
      path = _path;
      _path.stop();
    }
  });
  return path;
}

function resolveListOfQueries(ast, root, code, query, opts) {
  return query.reduce((acc, q) => {
    let resolved = resolveIndividualQuery(ast, root, code, q, opts);
    // thought: maybe do something clever here like put in a comment ellipsis if
    // the queries aren't contiguous
    acc.code = acc.code + resolved.code;
    acc.nodes = [...acc.nodes, resolved.node];
    return acc;
  }, {
    code: '',
    nodes: []
  })
}

export default function cq(code, query, opts) {
  let result = babel.transform(code, opts.babel);
  let ast = result.ast;
  let program = getProgram(ast);

  return resolveListOfQueries(ast, program, code, query, opts);
}
