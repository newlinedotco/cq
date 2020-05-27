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

        # Make sure you filter out tokens we're not interested in, particularly
        # DEDENTs There are probably other types we'll come across that need
        # filtered out, so you can find the list here:
        # https://docs.python.org/2/library/token.html#token.ENDMARKER
        possible_tokens = list(filter((lambda tok: tok[LINENO] == lineno
                                       and tok[COL_OFFSET] == col_offset
                                       and tok[TYPE] not in [token.DEDENT]), tokens))

        # print possible_tokens
        if len(possible_tokens) > 0:
            tok = possible_tokens.pop(0)
            node.string = tok[STRING]
            node.start = tok[START]
            node.end = tok[END]

    # TODO - combine both of these steps into a single breadth first search.
    # what we need to change is
    # if a token t1 has a sibling t2, then the end of t1 is the beginning of t2-1

    for node in ast.walk(tree):
        if hasattr(node, 'lineno') and hasattr(node, 'col_offset'):
            match_tokens(node)

    def fix_ends(node, level=0):
        nodeEnd = node.end if hasattr(node, 'end') else None

        for field, value in ast.iter_fields(node):
             if isinstance(value, list):
                for item in value:
                    if isinstance(item, ast.AST):
                        fix_ends(item, level=level+1)
                        nodeEnd = max(nodeEnd, item.end) if hasattr(item, 'end') else nodeEnd
             elif isinstance(value, ast.AST):
                fix_ends(value, level=level+1)
             nodeEnd = max(nodeEnd, value.end) if hasattr(value, 'end') else nodeEnd

        node.end = nodeEnd

    fix_ends(tree)
    return tree

    

def tokenize_with_char_offsets(source):
    readline = io.StringIO(source).readline
    encoding = 'utf8'
    token_source = tokenize.generate_tokens(readline)
    char_lines = list(map(lambda line: line + "\n", source.split("\n")))
    line_lens = [ len(line) for line in char_lines ]

    # pprint(['char_lines', char_lines])
    # pprint(['line_lens', line_lens])

    byte_lines = None
    tokens = []

    for token in token_source:
        # pprint('\n')
        # pprint(['token', token])
        # if token[TYPE] == encoding:
            # first token
            # encoding = token[STRING]
        byte_lines = list(map(lambda line: line.encode(encoding), char_lines))

        if token[LINENO][0] == 0 or (token[LINENO][1] == 0 and token[COL_OFFSET][1] == 0):
            # q: what's even the point of these tokens?
            # a: at least DEDENT tokens. they confuse the future steps though, so filter them out downstream
            tok = Token(token[TYPE], token[STRING],
                        token[LINENO][0], token[LINENO][1],
                        token[COL_OFFSET][0], token[COL_OFFSET][1])

        else:
            assert token[LINENO][0] > 0 # lineno is > 0

            start_line = token[LINENO][0]  # closed [ e.g. includes
            start_char = token[LINENO][1]
            end_line = token[COL_OFFSET][0]
            end_char = token[COL_OFFSET][1] # open ) (e.g. minus 1 to include)

            byte_start_line = byte_lines[start_line-1]
            char_start_col = len(byte_start_line[:start_char].decode(encoding))

            byte_end_line = byte_lines[token[COL_OFFSET][0]-1]
            char_end_col = len(byte_end_line[:token[COL_OFFSET][1]].decode(encoding))

            # pprint(['start_line', start_line, range(1, start_line)])

            start_lines_offset = reduce(lambda x, y: x + line_lens[y-1], range(1, start_line), 0)
            end_lines_offset = reduce(lambda x, y: x + line_lens[y-1], range(1, end_line), 0)

            # start position = sum(prevlines) + starting_char
            # end position = sum(prevlines) +  sum(ending_char)
            
            # bug in start_lines_offset
            # pprint(['start_lines_offset', 'char_start_col', start_lines_offset, char_start_col])
            # pprint(['end_lines_offset', 'char_end_col', end_lines_offset, char_end_col])

            start_char_offset = start_lines_offset + char_start_col
            end_char_offset = end_lines_offset + char_end_col

            tok = Token(token[TYPE], token[STRING],
                        start_line, start_char,
                        start_char_offset, end_char_offset)

            # pprint(tok)

        # pprint(tok)
        tokens.append(tok)
    
    return tokens

def parse_ast(node, tokens, code=None):
    """
    Parse the ast into a reasonable JSON object
    """
    if isinstance(node, ast.Module):
        # Just starting out
        result = {
            "type": "Program",
            "start": 0,
            "end": len(code), # hmm
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
    code = unicode(code)

    tree = ast.parse(code, '<unknown>', mode)
    tokens = tokenize_with_char_offsets(code)
    tree = fix_ast(tree, code, tokens)
    return parse_ast(tree, tokens, code)


def read_from_stdin():
    """
    Read from stdin helper
    """
    while True:
        output = sys.stdin.read()
        if not output:
            print('[No more data]')
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

    print(json.dumps(tree))


if __name__ == '__main__':
    main()
