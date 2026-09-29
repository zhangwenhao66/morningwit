#!/usr/bin/env python3
"""Build public/data/words.txt for the word box solver.

Input : ENABLE word list (public domain, Alan Beale), one word per line.
        Optional: the CMU Pronouncing Dictionary (via nltk) only to mark which words are familiar.
Output: one word per line, 3 to 14 letters, a-z only. A leading "~" marks a word that is in ENABLE
        but not in the CMU dictionary (so likely obscure); it is only used to rank suggestions.

Words are dropped when they could never be played in a four-sided, twelve-letter box:
  - doubled letters (two equal letters in a row sit on the same side, which is not allowed)
  - more than 12 different letters
Usage: python3 tools/build-wordlist.py <enable1.txt> [public/data/words.txt]
"""
import re
import sys

src = sys.argv[1]
dst = sys.argv[2] if len(sys.argv) > 2 else 'public/data/words.txt'

familiar = None
try:
    from nltk.corpus import cmudict
    familiar = {w.lower() for w in cmudict.dict().keys()}
except Exception as e:  # noqa: BLE001
    print('cmudict not available, no familiarity marks:', e, file=sys.stderr)

kept = 0
total = 0
marked = 0
out = []
for line in open(src, encoding='utf-8'):
    w = line.strip().lower()
    if not re.fullmatch(r'[a-z]{3,14}', w):
        continue
    total += 1
    if re.search(r'(.)\1', w) or len(set(w)) > 12:
        continue
    kept += 1
    if familiar is not None and w not in familiar:
        marked += 1
        out.append('~' + w)
    else:
        out.append(w)
open(dst, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(f'candidates {total}, kept {kept}, marked obscure {marked}, wrote {dst}')
