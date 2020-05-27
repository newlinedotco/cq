import numpy as np
import parser

def parse(code, **kwargs):
    """
    Fake parsing code with arguments
    """
    return ast.parse(code, **kwargs)