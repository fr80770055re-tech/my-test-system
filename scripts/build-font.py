# 把 4 MB 的像素字型 tearsfont-1.2.otf 切成三個 WOFF2 小檔，並產生對應的 src/fonts.css。
#   core：英數標點、注音、介面用到的字、前 1000 常用字 → 一進網站就載入
#   mid ：第 1001–2500 字、rest：第 2501 字以後 → 瀏覽器只有在畫面真的出現這些字時才下載（unicode-range）
# 用法：python3 scripts/build-font.py   （需要 fonttools 與 brotli：pip3 install fonttools brotli）
import glob
import os
import re

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC_FONT = os.path.join(ROOT, 'src/assets/tearsfont-1.2.otf')
OUT_DIR = os.path.join(ROOT, 'src/assets/fonts')
OUT_CSS = os.path.join(ROOT, 'src/fonts.css')
FAMILY = 'tearsfont-1.2'

cmap = TTFont(SRC_FONT).getBestCmap()
vocab = []
for c in re.findall(r"'(.)'", open(os.path.join(ROOT, 'src/data/vocabdata.js'), encoding='utf-8').read()):
    if c not in vocab:
        vocab.append(c)

ui_chars = set()
for path in glob.glob(os.path.join(ROOT, 'src/**/*.js*'), recursive=True):
    if '/data/' not in path:
        ui_chars |= set(open(path, encoding='utf-8').read())


def is_cjk(cp):
    return 0x3400 <= cp <= 0x9FFF or 0xF900 <= cp <= 0xFAFF or cp >= 0x20000


def available(chars):
    return {ord(c) for c in chars if ord(c) in cmap}


core = {cp for cp in cmap if not is_cjk(cp)} | available(ui_chars) | available(vocab[:1000])
mid = available(vocab[1000:2500]) - core
rest = available(vocab[2500:]) - core - mid


def unicode_range(cps):
    cps = sorted(cps)
    parts, start, prev = [], cps[0], cps[0]
    for cp in cps[1:] + [None]:
        if cp is not None and cp == prev + 1:
            prev = cp
            continue
        parts.append(f'U+{start:X}' if start == prev else f'U+{start:X}-{prev:X}')
        if cp is not None:
            start = prev = cp
    return ', '.join(parts)


os.makedirs(OUT_DIR, exist_ok=True)
css = ['/* 由 scripts/build-font.py 自動產生，請勿手動修改 */']
for name, cps in [('core', core), ('mid', mid), ('rest', rest)]:
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.notdef_outline = True
    font = TTFont(SRC_FONT)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=cps)
    subsetter.subset(font)
    font.flavor = 'woff2'
    out = os.path.join(OUT_DIR, f'tears-{name}.woff2')
    font.save(out)
    print(f'{name}: {len(cps)} 字元，{os.path.getsize(out) // 1024} KB')
    css.append(
        '@font-face {\n'
        f"  font-family: '{FAMILY}';\n"
        f"  src: url('./assets/fonts/tears-{name}.woff2') format('woff2');\n"
        '  font-weight: normal;\n'
        '  font-style: normal;\n'
        '  font-display: swap;\n'
        f'  unicode-range: {unicode_range(cps)};\n'
        '}'
    )

with open(OUT_CSS, 'w', encoding='utf-8') as f:
    f.write('\n'.join(css) + '\n')
print(f'已產生 {OUT_CSS}（{os.path.getsize(OUT_CSS) // 1024} KB）')
