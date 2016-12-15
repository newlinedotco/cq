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
import io
import tokenize
import token
import collections

Token = collections.namedtuple("Token", "type string lineno col_offset start end")

from pprint import pprint

from argparse import ArgumentParser

TYPE = 0
STRING = 1
LINENO = 2
COL_OFFSET = 3
START = 4
END = 5

def fix_ast(tree, source_lines, tokens):
    def match_tokens(node):
        """
        Match tokens with this node
        """
        lineno, col_offset = node.lineno, node.col_offset
        possible_tokens = list(filter((lambda tok: tok[LINENO] == lineno
                                       and tok[COL_OFFSET] == col_offset), tokens))

        # print possible_tokens
        if len(possible_tokens) > 0:
            tok = possible_tokens.pop(0)
            node.string = tok[STRING]
            node.start = tok[START]
            node.end = tok[END]

    for node in ast.walk(tree):
        if hasattr(node, 'lineno') and hasattr(node, 'col_offset'):
            match_tokens(node)

def tokenize_with_char_offsets(source):
    readline = io.StringIO(source).readline
    encoding = 'utf8'
    token_source = tokenize.generate_tokens(readline)
    char_lines = list(map(lambda line: line + "\n", source.split("\n")))
    line_lens = [ len(line) for line in char_lines ]
    byte_lines = None
    tokens = []

    for token in token_source:
        # if token[TYPE] == encoding:
            # first token
            # encoding = token[STRING]
        byte_lines = list(map(lambda line: line.encode(encoding), char_lines))

        if token[LINENO][0] == 0 or (token[LINENO][1] == 0 and token[COL_OFFSET][1] == 0):
            tok = Token(token[TYPE], token[STRING],
                        token[LINENO][0], token[LINENO][1],
                        token[COL_OFFSET][0], token[COL_OFFSET][1])
        else:
            assert token[LINENO][0] > 0 # lineno is > 0

            start_line = token[LINENO][0]
            start_char = token[LINENO][1]
            end_line = token[COL_OFFSET][0]
            end_char = token[COL_OFFSET][1]

            byte_start_line = byte_lines[start_line-1]
            char_start_col = len(byte_start_line[:start_char].decode(encoding))

            byte_end_line = byte_lines[token[COL_OFFSET][0]-1]
            char_end_col = len(byte_end_line[:token[COL_OFFSET][1]].decode(encoding))

            start_lines_offset = reduce(lambda x, y: x + line_lens[y], range(1, start_line), 0)
            end_lines_offset = reduce(lambda x, y: x + line_lens[y], range(1, end_line), 0)

            # start position = sum(prevlines) + starting_char
            # end position = sum(prevlines) +  sum(ending_char)
            start_char_offset = start_lines_offset + char_start_col
            end_char_offset = end_lines_offset + char_end_col

            tok = Token(token[TYPE], token[STRING],
                        start_line, start_char,
                        start_char_offset, end_char_offset)

        tokens.append(tok)
    
    return tokens

def parse_ast(node, tokens):
    """
    Parse the ast into a reasonable JSON object
    """
    if isinstance(node, ast.Module):
        # Just starting out
        result = {
            "type": "Program",
            "start": 0,
            "body": parse_ast(node.body, tokens)
        }
        return result
    # node or list?
    if isinstance(node, list):
        result = []
        for child_node in node:
            result += [parse_ast(child_node, tokens)]
        return result

    if isinstance(node, ast.AST):
        result = {"type": node.__class__.__name__}
        for k in node.__dict__:
            val = getattr(node, k)
            # if isinstance(val, ast.Str):
                # result["id"] = {"type": "Identifier", "name": node.value.s}
                # result[k] = parse_ast(val, tokens)
            # else:
            result[k] = parse_ast(val, tokens)

        return result

    return node


def make_ast(code, mode='exec'):
    """
    Make an AST tree from a string of code
    """
    tree = ast.parse(code, '<unknown>', mode)
    tokens = tokenize_with_char_offsets(unicode(code))
    fix_ast(tree, code, tokens)
    return parse_ast(tree, tokens)


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
    cli_parser = ArgumentParser(
        description="Convert python code into a JSON tree")
    cli_parser.add_argument(
        'text', nargs='?', default=None, action='store', help='Code to parse')
    args = cli_parser.parse_args()

    code = args.text if args.text is not None else read_from_stdin()
    tree = make_ast(code)

    print json.dumps(tree)


if __name__ == '__main__':
    main()
