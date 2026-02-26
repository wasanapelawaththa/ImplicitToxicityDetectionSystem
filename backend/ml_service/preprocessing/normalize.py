import re
import contextlib
import io
from preprocessing.sinhalese_tokenizer import tokenize
from preprocessing.sinhalese_vowel_letter_fixer import SinhaleseVowelLetterFixer

SYMBOL_MAP = {"#":"","*":"","_":"","/":"","\\":"","|":""}

def normalize_si_text(text: str) -> str:
    if not isinstance(text, str):
        text = str(text)

    t = text.strip().strip('"').strip("'")

    # silence noisy prints from vowel fixer
    with contextlib.redirect_stdout(io.StringIO()):
        t = SinhaleseVowelLetterFixer.get_fixed_text(t)

    for k, v in SYMBOL_MAP.items():
        t = t.replace(k, v)

    tokens = tokenize(t)
    return " ".join(tokens)