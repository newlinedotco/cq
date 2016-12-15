import ast
import sys
import json
from argparse import ArgumentParser

def classname(cls):
    """
    Returns the classname
    """
    return cls.__class__.__name__

def jsonify_ast(node, level=0):
    """
    Convert the AST node into a JSON object
    """
    fields = {}
    for k in node._fields:
        fields[k] = '...'
        var = getattr(node, k)
        if isinstance(var, ast.AST):
            if var._fields:
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
    return sys.stdin.read()

def main():
    """
    Main
    """
    parser = ArgumentParser(description="Convert python code into a JSON tree")
    parser.add_argument('text', nargs='?', default=None, action='store', help='Code to parse')
    args = parser.parse_args()

    code = args.text if args.text is not None else read_from_stdin()
    tree = make_ast(code)
    print(json.dumps(tree))


if __name__ == '__main__':
    main()
