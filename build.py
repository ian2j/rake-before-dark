"""Build the installable web app (index.html + sw.js) from the artifact page rake-before-dark.html."""
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SPLIT = '<canvas id="lawn">'

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#1c1530">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Rake">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>*{-webkit-tap-highlight-color:transparent}body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}</style>
"""

REGISTER = """<script>
if('serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
</script>
"""

PRECACHE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
            "icons/apple-touch-icon.png", "icons/maskable-512.png"]


def main():
    src = (ROOT / "rake-before-dark.html").read_text()
    head, body = src.split(SPLIT, 1)
    page = f"{HEAD}{head}</head>\n<body>\n{SPLIT}{body}\n{REGISTER}</body>\n</html>\n"
    (ROOT / "index.html").write_text(page)
    version = hashlib.sha256(page.encode()).hexdigest()[:10]
    sw = (ROOT / "tools" / "sw.template.js").read_text()
    sw = sw.replace("__VERSION__", version).replace("__PRECACHE__", repr(PRECACHE).replace("'", '"'))
    (ROOT / "sw.js").write_text(sw)
    print(f"built index.html and sw.js (cache {version})")


if __name__ == "__main__":
    main()
