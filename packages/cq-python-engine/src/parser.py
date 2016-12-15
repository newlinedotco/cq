"""
Python parser for parsing code into a JSON object
Accepts input from the command-line either as STDIN
or a raw string.

Example usage:

  python src/parser.py "$(cat test/data/bye.py)"
  cat test/data/bye.py | python src/parser.py

Most credit goes to https://github.com/exana/python-ast-explorer
for parsing ideas
"""

import sys
import json
import ast
from argparse import ArgumentParser

def classname(cls):
    """
    Returns the classname
    """
    return cls.__class__.__name__

def jsonify_ast(node):
    """
    Convert the AST node into a JSON object
    """
    fields = {}
    for k in node._fields:
        fields[k] = '...'
        var = getattr(node, k)
        if isinstance(var, ast.AST):
            if var._fields:
                # if isinstance(var, ast.Str) and len(var._fields) == 1:
                #     fields[k] = var.s
                # else:
                fields[k] = jsonify_ast(var)
            else:
                fields[k] = classname(var)

        elif isinstance(var, list):
            fields[k] = []
            for ele in var:
                fields[k].append(jsonify_ast(ele))

        elif isinstance(var, str):
            fields[k] = var

        elif isinstance(var, int) or isinstance(var, float):
            fields[k] = var

        elif var is None:
            fields[k] = None

        else:
            fields[k] = 'unrecognized'

    ret = {classname(node): fields}
    return ret


def make_ast(code):
    """
    Make an AST tree from a string of code
    """
    tree = ast.parse(code)
    return jsonify_ast(tree)

def read_from_stdin():
    """
    Read from stdin helper
    """
    while True:
        output = sys.stdin.read()
        if not output:
            print '[No more data]'
            break
        return output

def main():
    """
    Main
    """
    parser = ArgumentParser(description="Convert python code into a JSON tree")
    parser.add_argument('text', nargs='?', default=None, action='store', help='Code to parse')
    args = parser.parse_args()

    code = args.text if args.text is not None else read_from_stdin()
    tree = make_ast(code)
    print json.dumps(tree)


if __name__ == '__main__':
    main()
