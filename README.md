# HearthPlan public-safe edition

A static, browser-local household readiness planner for RandomVibez.ai. This edition is intentionally separate from the original prototype at `/home/tomf/model-comparison/run-2/app`.

## Public-safe architecture

- Static `index.html`, `styles.css`, and `app.js`; no backend, database, API, `fetch`, cookies, analytics, or external assets.
- State is stored only in this browser's `localStorage` under a versioned key.
- Client-side validation bounds imported and entered JSON, rejects unknown/oversized structures, clips text at field limits, and limits list sizes.
- Export is a plain JSON download; import is explicit and validated before replacing local state.
- Print uses the browser print dialog and a local wallet-card view generated in the current page.

## Use and safety

Data stays in this browser. Clearing site data, private browsing, browser cleanup, or another device will remove or omit it. Exports are unencrypted JSON. Do not enter SSNs, diagnoses, prescription names, insurance numbers, passwords, or other sensitive secrets.

HearthPlan is not 911, an alert service, a monitoring service, medical advice, legal advice, or a substitute for official emergency guidance. In an emergency, contact local emergency services.

## Local verification

Serve this directory with any static server, then open `index.html` in a browser. A file URL also works in modern browsers, but storage behavior can vary by browser. The included source checks can be run with:

```sh
node --check app.js
python3 - <<'PY'
from pathlib import Path
p = Path('index.html').read_text()
assert 'app.js' in p and 'styles.css' in p
assert 'fetch(' not in p
print('static assertions: ok')
PY
```

No deployment or subdomain selection is part of this edition.
