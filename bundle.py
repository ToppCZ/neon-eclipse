"""Concatenates src/*.js (ES modules) into one plain script, in dependency
order, stripping import/export syntax. Lets the game run via file:// with no
server and no bundler toolchain — needed for the desktop (WebView2) build,
since ES modules refuse to load over the file: protocol.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

# Dependency order: each file may only reference names defined in files
# earlier in this list.
ORDER = [
    "utils.js",
    "audio.js",
    "particles.js",
    "player.js",
    "enemyData.js",
    "enemies.js",
    "weapons.js",
    "upgrades.js",
    "pickups.js",
    "meta.js",
    "ui.js",
    "game.js",
    "main.js",
]

IMPORT_RE = re.compile(r'^\s*import\s.*?;\s*$', re.MULTILINE)
EXPORT_PREFIX_RE = re.compile(r'^export\s+', re.MULTILINE)


def bundle():
    parts = []
    for name in ORDER:
        text = (SRC / name).read_text(encoding="utf-8")
        text = IMPORT_RE.sub("", text)
        text = EXPORT_PREFIX_RE.sub("", text)
        parts.append(f"// ---- {name} ----\n{text.strip()}\n")
    return "\n".join(parts)


def write(out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    bundle_js = bundle()
    (out_dir / "bundle.js").write_text(bundle_js, encoding="utf-8")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    html = html.replace(
        '<script type="module" src="src/main.js"></script>',
        '<script src="bundle.js"></script>',
    )
    (out_dir / "index.html").write_text(html, encoding="utf-8")

    css = (ROOT / "style.css").read_text(encoding="utf-8")
    (out_dir / "style.css").write_text(css, encoding="utf-8")

    print(f"Bundled {len(ORDER)} files -> {out_dir / 'bundle.js'}")
    print(f"Wrote {out_dir / 'index.html'} and {out_dir / 'style.css'}")


if __name__ == "__main__":
    import sys
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist"
    write(target)
