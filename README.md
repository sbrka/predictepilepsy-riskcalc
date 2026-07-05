# predictepilepsy-riskcalc

Dependency-free Web Component (`<risk-calculator>`) that renders the
predictepilepsy.com risk calculators from canonical JSON.

- **No data here** — this is the rendering engine only. Calculator data
  (predictors, curves, metadata) is supplied per page via inline JSON.
- Served as a CDN asset via jsDelivr:
  `https://cdn.jsdelivr.net/gh/<owner>/predictepilepsy-riskcalc/risk-calculator.js`

Usage:
```html
<risk-calculator nav><script type="application/json">{ …canonical JSON… }</script></risk-calculator>
<script src="https://cdn.jsdelivr.net/gh/<owner>/predictepilepsy-riskcalc/risk-calculator.js"></script>
```
