#!/usr/bin/env python3
"""Static contract checks for the public-safe HearthPlan edition."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / "index.html").read_text()
js = (ROOT / "app.js").read_text()
css = (ROOT / "styles.css").read_text()
readme = (ROOT / "README.md").read_text()
security = (ROOT / "SECURITY.md").read_text()

assert {"index.html", "app.js", "styles.css", "README.md", "SECURITY.md", ".htaccess"}.issubset({p.name for p in ROOT.iterdir()})
assert 'src="app.js"' in html and 'href="styles.css"' in html
assert "localStorage" in js and "textContent" in js
assert "fetch(" not in html + js and "XMLHttpRequest" not in html + js
assert "document.cookie" not in html + js and "indexedDB" not in html + js
assert "no backend" in readme.lower() and "unencrypted" in readme.lower()
assert "medical" in html.lower() and "emergency" in html.lower()
assert "Strict-Transport-Security" in (ROOT / ".htaccess").read_text()
assert not re.search(r"//cdn|google-analytics|plausible", html + js + css, re.I)
print("PASS: HearthPlan static contract, local-only boundary, and safety disclosures")
