/* risk-calculator.js — self-built, dependency-free Web Component (predictepilepsy design system).
 *
 * Reads a canonical score JSON (schema/score_schema.json) and renders a full calculator in the
 * house style: brand-azure, editorial, full-width. One file renders EVERY calculator by swapping
 * the src JSON — swap the data, get a new calculator. No Chart.js, no plugin, no build step.
 *
 *   <script src="risk-calculator.js"></script>
 *   <risk-calculator src="cave.curve.json"></risk-calculator>
 *   <risk-calculator nav src="rise.score.json"></risk-calculator>
 *   <risk-calculator><script type="application/json">{…canonical…}</script></risk-calculator>
 *
 * Handles both kinds:
 *   kind="curve"  predictor inputs (or a stratum selector) -> cumulative + COSY curves, a hover
 *                 read-out, and the driving-orientation seizure-free interval (first month COSY
 *                 falls below the 20% / 2% orientation cut-offs).
 *   kind="score"  predictor inputs (or a score selector) -> score, risk at the model horizon,
 *                 and a risk-by-group bar chart.
 *
 * Attributes: `nav` shows the back + New/Classic top strip; `back-href` sets the back link.
 * Renders in a shadow root so page CSS can't leak in. Fixed axes (cumulative 0-100%, COSY
 * 0-COSY_AXIS%) keep every score visually comparable.
 */
(function () {
  "use strict";

  const COSY_AXIS = 40;   // fixed COSY y-axis %, override per model with model.cosy_axis_max
  const H = 12;           // COSY horizon months, override with model.horizon_months
  const COSY_INFO = "COSY is the chance of occurrence of a seizure in the next year — the probability of a seizure within the next 12 months, given the patient has been seizure-free this long. The month shown is when COSY first falls below the marked value. The 20% and 2% marks are cut-offs used in some jurisdictions as orientation for whether a person who has had a seizure may drive; they are not universally established — local laws and guidelines apply. At long seizure-free intervals COSY rests on few remaining patients and is often unstable — weigh it against the absolute numbers and the cumulative-incidence curve.";

  const CSS = `
    :host{
      --azure:#1f83e6;--azure-deep:#135ba8;--azure-wash:#eef6fe;--azure-line:#cfe4fb;
      --ink:#0e1c2b;--muted:#5c6b7a;--faint:#8a97a4;--line:#e6ecf2;--line-soft:#eef2f6;
      --page:#f6f9fc;--paper:#fff;--amber:#e0912b;--amber-deep:#b26a06;--red:#b02020;--green:#0f9d6b;
      --serif:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
      --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
      display:block;width:100%;color:var(--ink);font-family:var(--sans);line-height:1.5;-webkit-font-smoothing:antialiased}
    *{box-sizing:border-box}
    .sheet{background:var(--paper);min-height:100%;display:flex;flex-direction:column}
    .topstrip{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:11px 34px;border-bottom:1px solid var(--line);background:#fbfcfe}
    .backbtn{border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:550;cursor:pointer;font-family:inherit}
    .backbtn:hover{color:var(--azure-deep)}
    .viewtabs{display:flex;background:#eef2f6;border:1px solid var(--line);border-radius:9px;padding:3px;gap:2px}
    .viewtabs button{border:0;background:transparent;color:var(--muted);font-family:inherit;font-size:12px;font-weight:600;padding:5px 12px;border-radius:7px;cursor:pointer}
    .viewtabs button.on{background:#fff;color:var(--azure-deep);box-shadow:0 1px 2px rgba(14,28,43,.12)}
    .top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:22px 34px 20px;border-bottom:1px solid var(--line)}
    .brandrow{display:flex;gap:14px;align-items:flex-start}
    .mark{width:42px;height:42px;border-radius:12px;background:var(--azure);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .eyebrow{font-size:11px;font-weight:600;letter-spacing:.11em;text-transform:uppercase;color:var(--azure-deep);margin:0 0 3px}
    h1{font-family:var(--serif);font-size:26px;font-weight:600;letter-spacing:-.01em;margin:0;line-height:1.06;text-wrap:balance}
    .sub{margin:4px 0 0;color:var(--muted);font-size:13.5px}
    .cite{margin:8px 0 0;color:var(--muted);font-size:12px;line-height:1.5}
    .cite a,.foot a,.mbody a{color:var(--azure-deep);text-decoration:none;border-bottom:1px solid var(--azure-line)}
    .cite a:hover,.foot a:hover,.mbody a:hover{border-color:var(--azure)}
    .actions{display:flex;gap:8px;flex-shrink:0}
    .iconbtn{width:40px;height:40px;border-radius:11px;border:1px solid var(--line);background:#fff;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none}
    .iconbtn:hover{color:var(--azure-deep);border-color:var(--azure);background:var(--azure-wash)}
    .iconbtn svg{width:19px;height:19px}
    .grid{display:grid;grid-template-columns:344px 1fr;gap:0;flex:1}
    @media(max-width:820px){.grid{grid-template-columns:1fr}.rail{border-right:0;border-bottom:1px solid var(--line)}}
    .rail{padding:26px 30px;border-right:1px solid var(--line)}
    .panel{padding:24px 34px 26px;min-width:0}
    .field{margin-bottom:18px}
    .flabel{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--ink);margin-bottom:8px}
    .flabel .code{display:inline-flex;width:19px;height:19px;border-radius:6px;background:var(--azure-wash);color:var(--azure-deep);font-size:11px;font-weight:700;align-items:center;justify-content:center;font-family:var(--serif)}
    .info-dot{width:16px;height:16px;border-radius:50%;border:1px solid var(--line);color:var(--faint);font-size:10px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;background:#fff;font-family:var(--serif);font-style:italic;padding:0;text-transform:none}
    .info-dot:hover,.info-dot:focus-visible{color:var(--azure-deep);border-color:var(--azure);background:var(--azure-wash);outline:none}
    .seg{display:flex;background:#f3f6fa;border:1px solid var(--line);border-radius:11px;padding:3px;gap:3px}
    .seg button{flex:1;min-width:0;border:0;background:transparent;color:var(--muted);font-family:var(--sans);font-size:12.5px;font-weight:550;padding:8px 6px;border-radius:8px;cursor:pointer;white-space:nowrap}
    .seg[data-pi] button{white-space:normal;overflow-wrap:break-word;line-height:1.25;hyphens:auto;font-size:11.5px;padding:8px 4px}
    .cffinfo{font-size:13px;line-height:1.6;color:#33424f;overflow-x:auto}
    .cffinfo *{max-width:100%}
    .cffinfo h1,.cffinfo h2,.cffinfo h3,.cffinfo h4{font-size:14px;font-weight:600;color:var(--ink);margin:14px 0 6px;font-family:var(--sans)}
    .cffinfo table{border-collapse:collapse;width:100%;margin:8px 0;font-size:12.5px}
    .cffinfo th,.cffinfo td{border:1px solid var(--line);padding:5px 8px;text-align:left}
    .cffinfo a{color:var(--azure-deep);text-decoration:none;border-bottom:1px solid var(--azure-line)}
    .cffinfo img{height:auto}
    .seg.modeseg{max-width:none;width:auto;flex:0 0 auto}
    .seg.modeseg button{flex:0 0 auto;white-space:nowrap;padding:8px 15px}
    .belowinfo{border-top:1px solid var(--line);padding:0 34px}
    .belowinfo details{padding:16px 0}
    .belowinfo summary{font-family:var(--serif);font-size:15px;color:var(--ink);cursor:pointer;list-style:none;display:flex;align-items:center;gap:9px;font-weight:600}
    .belowinfo summary::-webkit-details-marker{display:none}
    .belowinfo summary::before{content:"▸";color:var(--muted);font-size:12px}
    .belowinfo details[open] summary::before{content:"▾"}
    .belowinfo .cffinfo{margin-top:14px}
    .reccard{border:1.5px solid var(--line);border-radius:14px;padding:18px 20px;font-size:17px;font-weight:600;font-family:var(--serif);line-height:1.3;background:#fff}
    .recrules{margin-top:16px;display:flex;flex-direction:column;gap:2px}
    .recrule{display:flex;gap:14px;padding:10px 12px;border-radius:9px;font-size:13px;color:var(--muted)}
    .recrule.on{background:var(--azure-wash);color:var(--ink)}
    .recrule .rk{flex:0 0 96px;font-weight:600;font-variant-numeric:tabular-nums}
    .lookbig{display:flex;align-items:baseline;gap:14px;margin:8px 0 2px}
    .lookbig .lkpct{font-family:var(--serif);font-size:56px;line-height:1;color:var(--amber-deep);font-variant-numeric:tabular-nums}
    .lookbig .lkci{font-size:14px;color:var(--muted);font-variant-numeric:tabular-nums}
    .lksub{font-size:13.5px;line-height:1.6;color:var(--muted);max-width:520px;margin:8px 0 0}
    .seg button:hover{color:var(--ink)}
    .seg button.on{background:#fff;color:var(--azure-deep);box-shadow:0 1px 3px rgba(14,28,43,.12);font-weight:650}
    select{width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:10px;font-size:13.5px;background:#fff;color:var(--ink);font-family:inherit}
    input[type=number]{width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:10px;font-size:13.5px;background:#fff;color:var(--ink);font-family:inherit}
    input[type=number]:focus{outline:none;border-color:var(--azure);box-shadow:0 0 0 3px var(--azure-wash)}
    .pill{font-variant-numeric:tabular-nums;color:var(--azure-deep);background:var(--azure-wash);padding:2px 9px;border-radius:7px;font-weight:650;font-size:12px}
    input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:3px;background:linear-gradient(90deg,var(--azure) var(--fill,20%),var(--line) var(--fill,20%));cursor:pointer;margin:9px 0 2px}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid var(--azure);box-shadow:0 1px 4px rgba(14,28,43,.2)}
    input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid var(--azure)}
    .scorewrap{display:flex;gap:22px;align-items:flex-end;margin:22px 0 20px;padding-top:20px;border-top:1px solid var(--line)}
    .metric .k{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
    .metric .v{font-family:var(--serif);font-size:38px;line-height:.92;font-variant-numeric:tabular-nums;color:var(--ink)}
    .metric.sm .v{font-size:26px;font-weight:600}
    .band{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;margin-top:7px}
    .band .d{width:8px;height:8px;border-radius:50%}
    .verdict{display:flex;flex-direction:column}
    .vhead{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:6px}
    .vrow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line-soft)}
    .vrow:last-child{border-bottom:0}
    .vrow .lab{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--ink)}
    .vrow .lab i{width:9px;height:9px;border-radius:2px;display:inline-block;flex-shrink:0}
    .vrow .lab .lt{display:flex;flex-direction:column;gap:1px}
    .vrow .lab .lt b{font-weight:600}
    .vrow .lab .t{color:var(--muted);font-size:10.5px;line-height:1.2}
    .vrow .val{font-size:14px;font-weight:650;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
    .vnote{margin-top:10px;font-size:10.5px;line-height:1.5;color:var(--faint)}
    .panelhead{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px;flex-wrap:wrap}
    .legend{display:flex;gap:15px;font-size:11.5px;color:var(--muted)}
    .legend span{display:inline-flex;align-items:center;gap:6px}
    .legend .ln{width:16px;height:0;border-top:2.5px solid var(--azure)}
    .legend .ln.amb{border-top-color:var(--amber)}
    .plotwrap{position:relative;width:100%}
    svg.plot{width:100%;height:auto;display:block}
    .tip{position:absolute;pointer-events:none;background:var(--ink);color:#fff;border-radius:11px;padding:9px 12px;font-size:12px;line-height:1.5;box-shadow:0 8px 24px rgba(14,28,43,.28);min-width:132px;transform:translate(-50%,-116%);opacity:0;transition:opacity .1s;z-index:6;white-space:nowrap}
    .tip.show{opacity:1}
    .tip .d{font-weight:650;font-size:12px;margin-bottom:4px;color:var(--azure-line)}
    .tip .r{display:flex;justify-content:space-between;gap:14px;font-variant-numeric:tabular-nums}
    .tip .z{margin-top:5px;font-size:10.5px;font-weight:600;display:inline-block;padding:2px 7px;border-radius:6px}
    .hint{color:var(--faint);font-size:11.5px;margin:10px 2px 0;text-align:center}
    .foot{padding:16px 34px 22px;border-top:1px solid var(--line);color:var(--muted);font-size:11.5px;line-height:1.6}
    .foot .disclaimer{margin-top:14px;padding-top:14px;border-top:1px solid var(--line-soft)}
    .foot .disclaimer b{color:var(--ink);display:block;margin-bottom:5px;font-size:12px;letter-spacing:.02em}
    .foot .disclaimer p{margin:0 0 7px;max-width:none}
    .foot .disclaimer .copyr{color:var(--faint)}
    .foot .disclaimer a{color:var(--azure-deep);text-decoration:none}
    .classicview{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;padding:70px 30px;color:var(--muted)}
    .classicview .h{font-family:var(--serif);font-size:19px;color:var(--ink);margin-bottom:8px}
    .pop{position:fixed;z-index:60;max-width:272px;background:var(--ink);color:#fff;font-size:12px;line-height:1.5;padding:10px 13px;border-radius:11px;box-shadow:0 12px 30px rgba(14,28,43,.32);opacity:0;pointer-events:none;transform:translateY(-100%);transition:opacity .1s}
    .pop.show{opacity:1}
    .pop::after{content:"";position:absolute;left:var(--arrow,50%);bottom:-5px;transform:translateX(-50%);border:5px solid transparent;border-top-color:var(--ink);border-bottom:0}
    .modal{position:fixed;inset:0;background:rgba(14,28,43,.44);display:none;align-items:center;justify-content:center;padding:22px;z-index:40}
    .modal.open{display:flex}
    .mcard{background:#fff;border-radius:18px;max-width:540px;width:100%;max-height:88vh;overflow:auto;padding:28px 30px;box-shadow:0 24px 70px rgba(14,28,43,.34);position:relative}
    .mcard h2{font-family:var(--serif);font-size:21px;font-weight:600;margin:0 0 4px}
    .mcard .msub{color:var(--muted);font-size:13px;margin:0 0 18px}
    .mclose{position:absolute;top:14px;right:16px;border:0;background:transparent;font-size:24px;line-height:1;color:var(--muted);cursor:pointer}
    .mbody h3{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--azure-deep);margin:16px 0 6px}
    .mbody p{margin:0 0 9px;font-size:13.5px;line-height:1.6;color:#33424f}
    .disc{background:var(--azure-wash);border-radius:12px;padding:12px 14px;font-size:12px;color:#3a4b59;margin-top:16px}
    .warn{background:#fef3c7;color:#8a5a06;border:1px solid #fde9b0;border-radius:10px;padding:9px 12px;font-size:12px;margin:12px 0}
    .review{background:#fdecec;color:#9a1c1c;border-color:#f6cccc}
    @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  `;

  const GEO = { W: 1000, H: 320, pL: 66, pR: 24, pT: 16, pB: 38 };

  class RiskCalculator extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: "open" });
      this._mode = "cum"; this._month = 12;
      this._load().then((d) => { this.data = d; this._build(); })
        .catch((e) => { this.shadowRoot.innerHTML = `<pre style="color:#b91c1c">risk-calculator: ${e}</pre>`; });
    }

    async _load() {
      const inline = this.querySelector('script[type="application/json"]');
      if (inline) return JSON.parse(inline.textContent);
      const src = this.getAttribute("src");
      if (!src) throw new Error("no src attribute and no inline JSON");
      const r = await fetch(src);
      if (!r.ok) throw new Error("fetch " + src + " -> " + r.status);
      return r.json();
    }

    _build() {
      const d = this.data, m = d.meta || {};
      const hasNav = this.hasAttribute("nav");
      const back = this.getAttribute("back-href") || "";
      const root = document.createElement("div");
      root.innerHTML = `<style>${CSS}</style>
        <div class="sheet">
          ${hasNav ? `<div class="topstrip">
            <button class="backbtn" id="back">&#8249;&nbsp;All calculators</button>
            <div class="viewtabs" id="viewtabs"><button class="on" data-view="new">New design</button><button data-view="classic">Classic (CFF)</button></div>
          </div>` : ``}
          <header class="top">
            <div class="brandrow">
              <div class="mark" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24"><g stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M4 6h9"/><path d="M4 12h13"/><path d="M4 18h7"/><path d="M16 3.5l4 2.5-4 2.5M19.5 9.5l4 2.5-4 2.5M14.5 15.5l4 2.5-4 2.5" stroke-linejoin="round"/></g></svg></div>
              <div>
                <h1>${esc(m.title || d.id)}</h1>
                ${m.outcome ? `<p class="sub">${esc(m.outcome)}</p>` : ``}
                <p class="cite">${citation(m)}</p>
              </div>
            </div>
            <div class="actions">
              <button class="iconbtn" id="btn-info" title="Background &amp; source" aria-label="Information"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v5" stroke-linecap="round"/><circle cx="12" cy="7.6" r="1.1" fill="currentColor" stroke="none"/></svg></button>
              ${m.doi ? `<a class="iconbtn" href="https://doi.org/${esc(m.doi)}" target="_blank" rel="noopener" title="Open the source paper" aria-label="Source paper"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg></a>` : ``}
            </div>
          </header>
          <div class="grid" id="grid"><aside class="rail" id="rail"></aside><section class="panel" id="panel"></section></div>
          <div class="classicview" id="classicview" style="display:none"><div><div class="h">Classic view (Calculated Fields Form)</div><p style="font-size:13px;max-width:440px">In production this tab embeds the existing CFF calculator so users can compare designs. Wired up per page during migration.</p></div></div>
          <section class="belowinfo" id="belowinfo"></section>
          <footer class="foot" id="foot"></footer>
        </div>
        <div class="pop" id="pop" role="tooltip"></div>
        <div class="modal" id="modal"><div class="mcard"><button class="mclose" id="mclose" aria-label="Close">&times;</button><div id="mcontent"></div></div></div>`;
      this.shadowRoot.innerHTML = "";
      this.shadowRoot.appendChild(root);
      this._rail = root.querySelector("#rail");
      this._panel = root.querySelector("#panel");
      root.querySelector("#foot").innerHTML = this._footHTML();
      const bi = root.querySelector("#belowinfo");
      bi.innerHTML = this._belowHTML();
      if (bi.innerHTML) bi.dataset.has = "1"; else bi.style.display = "none";
      this._bindChrome(root, back);
      const dispatch = () => { d.kind === "curve" ? this._renderCurve() : d.kind === "formula" ? this._renderFormula() : d.kind === "lookup" ? this._renderLookup() : this._renderScore(); };
      dispatch();
      this.render = dispatch;
    }

    /* ---------------- CURVE ---------------- */
    _renderCurve() {
      const d = this.data, m = d.model, th = d.thresholds || { group1: 20, group2: 2 };
      const preds = d.predictors || [];
      const strata = m.strata || {};
      // resolve the active stratum key
      let key;
      if (preds.length) {
        this._score = this._score != null ? this._score : preds.reduce((a, p) => a + Number((p.options || [{}])[0].points || 0), 0);
        key = resolveStratum(strata, this._score) || Object.keys(strata)[0];
      } else {
        key = this._stratKey || Object.keys(strata)[0]; this._stratKey = key;
      }
      const s = strata[key] || {};
      if (s.no_cosy) this._mode = "cum";           // this subgroup has cumulative risk only
      if (s.no_cum) this._mode = "cosy";           // this subgroup reports COSY only (no cumulative curve)
      const ax = { cum: m.month_max_cum || 72, cosy: m.month_max_cosy || 60 };
      const cosyMax = m.cosy_axis_max || COSY_AXIS;
      this._cur = { s, th, ax, cosyMax };

      // rail
      let rail = "";
      if (preds.length) {
        preds.forEach((p, i) => { rail += this._predField(p, i); });
      } else if (Object.keys(strata).length > 1) {
        const opts = Object.keys(strata).map((k) => `<option value="${esc(k)}"${k === key ? " selected" : ""}>${esc(strata[k].display || k)}</option>`).join("");
        rail += `<div class="field"><div class="flabel">${esc(m.selector || "Risk group")}${m.selector_info ? ` <button class="info-dot" data-info="${attr(m.selector_info)}" aria-label="About the risk groups">i</button>` : ""}</div><select id="strat">${opts}</select></div>`;
      }
      const lbl = this._mode === "cosy" ? "Seizure-free interval" : "Months since event";
      const xmax = ax[this._mode];
      const mo = Math.min(this._month, xmax);
      rail += `<div class="field"><div class="flabel" style="justify-content:space-between"><span>${lbl}</span><span class="pill" id="hzpill">${mo} mo</span></div>
        <input type="range" id="hz" min="0" max="${xmax}" step="1" value="${mo}"></div>`;
      // metrics
      const cumArr = seriesArr(s.cum, ax.cum);
      rail += `<div class="scorewrap">
        ${preds.length && !m.hide_score ? `<div class="metric"><div class="k">Total score</div><div class="v" id="scoreN">${this._score}</div></div>` : `<div class="metric"><div class="k">${esc(m.selector || "Risk group")}</div><div class="v" style="font-size:${m.hide_score ? "16px;line-height:1.25" : "22px"}">${esc(s.display || key)}</div><div class="v" id="scoreN" hidden>${this._score}</div>${s.info ? `<div class="stratinfo" style="font-size:12px;color:var(--muted);margin-top:8px;line-height:1.5;font-family:var(--sans)">${esc(s.info)}</div>` : ""}</div>`}
        ${s.no_cum ? `<div class="metric sm"><div class="k">COSY at <span id="atmo">${mo}</span> mo seizure-free</div><div class="v" id="cumAt">${fmtPct(seriesArr(s.cosy, ax.cosy)[mo])}</div></div>` : `<div class="metric sm"><div class="k">Cumulative risk at <span id="atmo">${mo}</span> mo</div><div class="v" id="cumAt">${fmtPct(cumArr[mo])}</div></div>`}</div>`;
      // verdict
      const noCosy = !!s.no_cosy;
      const cosyArr = seriesArr(s.cosy, ax.cosy);
      const g1 = noCosy ? null : firstBelow(cosyArr, th.group1), g2 = noCosy ? null : firstBelow(cosyArr, th.group2);
      rail += `<div class="verdict">
        <div class="vhead">Driving orientation &middot; seizure-free interval <button class="info-dot" data-info="${attr(COSY_INFO)}" aria-label="About COSY and the orientation cut-offs">i</button></div>
        <div class="vrow"><span class="lab"><i style="background:var(--amber-deep)"></i><span class="lt"><b>Group 1</b><span class="t">private &middot; COSY &lt; ${th.group1}%</span></span></span><span class="val" style="color:var(--amber-deep)">${noCosy ? "—" : fmtMo(g1)}</span></div>
        <div class="vrow"><span class="lab"><i style="background:var(--red)"></i><span class="lt"><b>Group 2</b><span class="t">commercial &middot; COSY &lt; ${th.group2}%</span></span></span><span class="val" style="color:var(--red)">${noCosy ? "—" : fmtMo(g2)}</span></div>
        <div class="vnote">${noCosy ? "COSY is not available for this subgroup — cumulative risk only." : `${th.group1}% and ${th.group2}% are orientation cut-offs used in some jurisdictions — not established limits. Local laws and guidelines apply.`}</div></div>`;
      this._rail.innerHTML = rail;

      // panel
      this._panel.innerHTML = `<div class="panelhead"><div class="seg modeseg" id="mode"></div><div class="legend" id="legend"></div></div>
        <div class="plotwrap" id="plotwrap"><svg class="plot" id="plot" viewBox="0 0 ${GEO.W} ${GEO.H}" role="img" aria-label="Risk curve by month"></svg><div class="tip" id="tip"></div></div>
        <p class="hint">Move the cursor across the curve to read the risk at any month.</p>`;

      // wire
      this._rail.querySelectorAll(".seg[data-pi]").forEach((seg) => seg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        const pi = +seg.dataset.pi; this._predSel[pi] = +b.dataset.oi;
        this._score = this._scoreFromSel(); this._renderCurve();
      }));
      const strat = this._rail.querySelector("#strat");
      if (strat) strat.addEventListener("change", (e) => { this._stratKey = e.target.value; this._renderCurve(); });
      const hz = this._rail.querySelector("#hz");
      hz.style.setProperty("--fill", (mo / xmax * 100) + "%");
      hz.addEventListener("input", (e) => {
        this._month = +e.target.value; const mm = Math.min(this._month, xmax);
        e.target.style.setProperty("--fill", (mm / xmax * 100) + "%");
        this._rail.querySelector("#hzpill").textContent = mm + " mo";
        this._rail.querySelector("#atmo").textContent = mm;
        this._rail.querySelector("#cumAt").textContent = fmtPct(s.no_cum ? seriesArr(s.cosy, ax.cosy)[mm] : cumArr[mm]);
        this._drawCurve();
      });
      seg2(this._panel.querySelector("#mode"), s.no_cum ? [{ l: "COSY", v: "cosy" }] : (s.no_cosy ? [{ l: "Cumulative risk", v: "cum" }] : [{ l: "Cumulative risk", v: "cum" }, { l: "COSY", v: "cosy" }]), this._mode, (v) => { this._mode = v; this._renderCurve(); });
      this._drawCurve();
      this._bindHover(cumArr, cosyArr, ax, th, cosyMax);
    }

    _drawCurve() {
      const { s, th, ax, cosyMax } = this._cur;
      const mode = this._mode, cosy = mode === "cosy";
      const arr = seriesArr(cosy ? s.cosy : s.cum, ax[mode]);
      const xmax = ax[mode], ymax = cosy ? cosyMax : 100;
      const { W, H, pL, pR, pT, pB } = GEO;
      const X = (mo) => pL + (mo / xmax) * (W - pL - pR);
      const Y = (v) => pT + (1 - Math.min(v, ymax) / ymax) * (H - pT - pB);
      let g = "";
      const ystep = ymax <= 40 ? 10 : 20;
      for (let y = 0; y <= ymax + .01; y += ystep) { const yy = Y(y); g += `<line x1="${pL}" y1="${yy}" x2="${W - pR}" y2="${yy}" stroke="#eef2f6"/><text x="${pL - 8}" y="${yy + 3.5}" text-anchor="end" font-size="11" fill="#8a97a4">${y}%</text>`; }
      const xstep = xmax <= 24 ? 6 : 12;
      for (let x = 0; x <= xmax; x += xstep) g += `<text x="${X(x)}" y="${H - pB + 18}" text-anchor="middle" font-size="11" fill="#8a97a4">${x}</text>`;
      g += `<text x="${(pL + W - pR) / 2}" y="${H - 4}" text-anchor="middle" font-size="11" fill="#5c6b7a">${cosy ? "months seizure-free" : "months since event"}</text>`;
      const yMid = pT + (H - pT - pB) / 2;
      g += `<text x="15" y="${yMid}" transform="rotate(-90 15 ${yMid})" text-anchor="middle" font-size="11" font-weight="600" fill="#5c6b7a">${cosy ? "chance of seizure in next year (%)" : "cumulative seizure risk (%)"}</text>`;
      let pa = `M ${X(0)} ${Y(0)}`; arr.forEach((v, mo) => { pa += ` L ${X(mo)} ${Y(v)}`; }); pa += ` L ${X(arr.length - 1)} ${Y(0)} Z`;
      g += `<path d="${pa}" fill="${cosy ? "rgba(224,145,43,.10)" : "rgba(31,131,230,.10)"}"/>`;
      if (cosy) [[th.group1, "#b26a06"], [th.group2, "#b02020"]].forEach(([t, c]) => { if (t > ymax) return; const yy = Y(t); g += `<line x1="${pL}" y1="${yy}" x2="${W - pR}" y2="${yy}" stroke="${c}" stroke-width="1" stroke-dasharray="4 4"/><text x="${W - pR}" y="${yy - 5}" text-anchor="end" font-size="10.5" fill="${c}">${t}%</text>`; });
      let pc = ""; arr.forEach((v, mo) => { pc += (mo ? " L" : "M") + ` ${X(mo)} ${Y(v)}`; });
      g += `<path d="${pc}" fill="none" stroke="${cosy ? "#e0912b" : "#1f83e6"}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
      const mm = Math.min(this._month, xmax);
      g += `<line x1="${X(mm)}" y1="${pT}" x2="${X(mm)}" y2="${H - pB}" stroke="#c7d3de" stroke-width="1" stroke-dasharray="2 3"/><circle cx="${X(mm)}" cy="${Y(arr[mm])}" r="5" fill="${cosy ? "#e0912b" : "#1f83e6"}" stroke="#fff" stroke-width="2"/>`;
      this._panel.querySelector("#plot").innerHTML = g;
      const lg = this._panel.querySelector("#legend");
      lg.innerHTML = cosy ? `<span><span class="ln amb"></span>COSY</span><span><span class="ln" style="border-color:#b26a06;border-top-style:dashed"></span>orientation cut-offs</span>` : `<span><span class="ln"></span>cumulative risk</span>`;
    }

    _bindHover(cumArr, cosyArr, ax, th) {
      const wrap = this._panel.querySelector("#plotwrap"), svg = this._panel.querySelector("#plot"), tip = this._panel.querySelector("#tip");
      const move = (ev) => {
        const r = svg.getBoundingClientRect(); const scale = r.width / GEO.W;
        const px = (ev.clientX - r.left) / scale; const xmax = ax[this._mode];
        const mo = Math.round((px - GEO.pL) / (GEO.W - GEO.pL - GEO.pR) * xmax);
        if (mo < 0 || mo > xmax) { tip.classList.remove("show"); return; }
        const cumV = cumArr[Math.min(mo, cumArr.length - 1)], cosyV = cosyArr[Math.min(mo, cosyArr.length - 1)];
        const [zn, zs] = zoneFor(cosyV, th);
        tip.innerHTML = `<div class="d">Month ${mo}</div><div class="r"><span>Cumulative</span><b>${fmtPct(cumV)}</b></div><div class="r"><span>COSY</span><b>${fmtPct(cosyV)}</b></div><div class="z" style="${zs}">${zn}</div>`;
        const ymax = this._mode === "cosy" ? this._cur.cosyMax : 100; const useV = this._mode === "cosy" ? cosyV : cumV;
        tip.style.left = ((GEO.pL + (mo / xmax) * (GEO.W - GEO.pL - GEO.pR)) * scale) + "px";
        tip.style.top = ((GEO.pT + (1 - Math.min(useV, ymax) / ymax) * (GEO.H - GEO.pT - GEO.pB)) * scale) + "px";
        tip.classList.add("show");
      };
      wrap.addEventListener("mousemove", move);
      wrap.addEventListener("mouseleave", () => tip.classList.remove("show"));
    }

    /* ---------------- SCORE ---------------- */
    _renderScore() {
      const d = this.data, m = d.model, preds = d.predictors || [], rows = m.rows || [];
      const isRange = m.score_type === "range";
      const rowFor = (sc) => isRange
        ? rows.find((r) => sc >= (r.lo != null ? r.lo : -1e9) && sc <= (r.hi != null ? r.hi : 1e9)) || null
        : rows.reduce((best, r) => (Number(r.score) === sc ? r : best), null);
      if (this._score == null) this._score = preds.length ? preds.reduce((a, p) => a + Number((p.options || [{}])[0].points || 0), 0) : Number((rows[0] || {}).score || 0);

      let rail = "";
      if (preds.length) { preds.forEach((p, i) => { rail += this._predField(p, i); }); }
      else { rail += `<div class="field"><div class="flabel">Select score</div><select id="scoreSel">${rows.map((r) => `<option value="${r.score}">${esc(r.label)}</option>`).join("")}</select></div>`; }
      const row = rowFor(this._score), band = riskBand(row);
      const recs = m.recommendation || null;
      const rec = recs ? (recs.find((r) => this._score >= (r.lo != null ? r.lo : -1e9) && this._score <= (r.hi != null ? r.hi : 1e9)) || null) : null;
      const recColor = (t) => t === "high" ? "var(--red)" : t === "med" ? "var(--amber-deep)" : "var(--green)";
      rail += `<div class="scorewrap"><div class="metric"><div class="k">${esc(preds.length ? "Total score" : "Score")}</div><div class="v" id="scoreN">${this._score}</div>${band ? `<div class="band"><span class="d" style="background:${band.c}"></span><span style="color:${band.c}">${band.n}</span></div>` : ``}</div>
        ${recs ? `<div class="metric sm"><div class="k">Recommendation</div><div class="v" style="font-size:14px;line-height:1.25;color:${rec ? recColor(rec.tone) : "var(--muted)"}">${rec ? esc(rec.text) : "—"}</div></div>` : `<div class="metric sm"><div class="k">Risk at ${esc(m.horizon || "horizon")}</div><div class="v" id="riskN">${row && row.pct != null ? fmtPct(row.pct) : "—"}</div></div>`}</div>`;
      if (m.note) rail += `<div class="warn">${esc(m.note)}</div>`;
      this._rail.innerHTML = rail;

      if (recs) {
        this._panel.innerHTML = `<div class="panelhead"><div class="flabel" style="margin:0">Author recommendation</div></div>
          <div class="reccard" style="border-color:${rec ? recColor(rec.tone) : "var(--line)"};color:${rec ? recColor(rec.tone) : "var(--ink)"}">${rec ? esc(rec.text) : "Enter values to see the recommendation."}</div>
          <div class="recrules">${recs.map((r) => `<div class="recrule${r === rec ? " on" : ""}"><span class="rk">Score ${r.lo}${r.hi >= 9999 ? "+" : "&ndash;" + r.hi}</span><span class="rt">${esc(r.text)}</span></div>`).join("")}</div>`;
      } else {
        this._panel.innerHTML = `<div class="panelhead"><div class="flabel" style="margin:0">Risk by group${m.horizon ? " &middot; at " + esc(m.horizon) : ""}</div></div>
          <div class="plotwrap"><svg class="plot" id="plot" viewBox="0 0 ${GEO.W} ${20 + rows.length * 44}" role="img" aria-label="Risk by group"></svg></div>`;
        this._drawBars(rows, row);
      }

      this._rail.querySelectorAll(".seg[data-pi]").forEach((seg) => seg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return; const pi = +seg.dataset.pi; this._predSel[pi] = +b.dataset.oi;
        this._score = this._scoreFromSel(); this._renderScore();
      }));
      const sel = this._rail.querySelector("#scoreSel");
      if (sel) sel.addEventListener("change", (e) => { this._score = +e.target.value; this._renderScore(); });
    }

    /* ---------------- FORMULA (regression: dropdown + slider inputs) ---------------- */
    _renderFormula() {
      const d = this.data, m = d.model, preds = d.predictors || [];
      if (!this._predSel) this._predSel = preds.map(() => 0);
      if (!this._slider) this._slider = preds.map((p) => (p.type === "slider" || p.type === "number") ? (p.default != null ? p.default : (p.min || 0)) : 0);
      let rail = "";
      preds.forEach((p, i) => {
        if (p.type === "slider") {
          const v = this._slider[i], mn = p.min || 0, mx = p.max != null ? p.max : 10;
          rail += `<div class="field"><div class="flabel" style="justify-content:space-between"><span>${esc(p.name)}${(p.assess || p.info) ? ` <button class="info-dot" data-info="${attr(p.assess || p.info)}" aria-label="About ${esc(p.name)}">i</button>` : ""}</span><span class="pill" id="sl${i}v">${v}${p.unit ? " " + esc(p.unit) : ""}</span></div>
            <input type="range" class="slpred" data-si="${i}" min="${mn}" max="${mx}" step="${p.step || 1}" value="${v}" style="--fill:${(v - mn) / (mx - mn) * 100}%"></div>`;
        } else if (p.type === "number") {
          rail += `<div class="field"><div class="flabel"><span>${esc(p.name)}${(p.assess || p.info) ? ` <button class="info-dot" data-info="${attr(p.assess || p.info)}" aria-label="About ${esc(p.name)}">i</button>` : ""}</span></div>
            <input type="number" class="numpred" data-ni="${i}" value="${this._slider[i]}" step="${p.step || "any"}"${p.min != null ? ` min="${p.min}"` : ""} inputmode="decimal"></div>`;
        } else rail += this._predField(p, i);
      });
      rail += `<div class="scorewrap" id="fmetrics"></div>`;
      if (m.note) rail += `<div class="warn">${esc(m.note)}</div>`;
      this._rail.innerHTML = rail;
      const vizInfo = m.viz_info || "Each risk factor you select adds a coloured contribution. The waterfall (left) starts from the baseline risk and steps up with each active factor, so you can see which factors drive this patient's risk and by how much. The donut (right) shows the same factors as wedges summing to the total predicted risk in the centre.";
      this._panel.innerHTML = `<div class="panelhead"><div class="flabel" style="margin:0">${esc(m.panel_title || "Predicted risk")} <button class="info-dot" data-info="${attr(vizInfo)}" aria-label="How to read this chart">i</button></div></div>
        <div class="fviz" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
          <div style="flex:1 1 320px;min-width:300px"><svg id="fwater" role="img" aria-label="Contribution waterfall"></svg></div>
          <div style="flex:0 0 210px;text-align:center"><svg id="fdonut" viewBox="0 0 210 224" role="img" aria-label="Risk donut"></svg></div>
        </div>`;
      this._formulaUpdate();
      this._rail.querySelectorAll(".seg[data-pi]").forEach((seg) => seg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return; this._predSel[+seg.dataset.pi] = +b.dataset.oi; this._renderFormula();
      }));
      this._rail.querySelectorAll(".slpred").forEach((sl) => sl.addEventListener("input", (e) => {
        const i = +e.target.dataset.si, mn = +e.target.min, mx = +e.target.max; this._slider[i] = +e.target.value;
        e.target.style.setProperty("--fill", (this._slider[i] - mn) / (mx - mn) * 100 + "%");
        const p = preds[i]; this._rail.querySelector("#sl" + i + "v").textContent = this._slider[i] + (p.unit ? " " + p.unit : "");
        this._formulaUpdate();
      }));
      this._rail.querySelectorAll(".numpred").forEach((nu) => nu.addEventListener("input", (e) => {
        const i = +e.target.dataset.ni, v = parseFloat(e.target.value); this._slider[i] = isFinite(v) ? v : 0; this._formulaUpdate();
      }));
    }

    _formulaCompute() {
      const m = this.data.model, preds = this.data.predictors || [];
      const lp = preds.reduce((a, p, i) => {
        const v = (p.type === "slider" || p.type === "number") ? this._slider[i] : Number(((p.options || [])[this._predSel[i]] || {}).points || 0);
        const term = p.transform === "exp" ? Math.exp(v) : v;
        return a + (Number(p.coef) || 0) * term;
      }, Number(m.intercept) || 0);
      let outs;
      if (m.type === "lookup") {
        const bands = m.bands || [];
        const b = bands.find((x) => lp < x.lt);
        const pct = b ? b.pct : (bands.length ? bands[bands.length - 1].pct : 0);
        outs = [{ label: (m.outputs && m.outputs[0] && m.outputs[0].label) || "Risk", pct, approx: true }];
      } else {
        outs = (m.outputs || []).map((o) => {
          let pct;
          if (m.type === "cloglog") pct = (1 - Math.pow(1 - o.F0, Math.exp(lp - (m.center || 0)))) * 100;
          else if (m.type === "logistic") pct = 100 / (1 + Math.exp(-(lp + (o.intercept || 0))));
          else pct = lp;
          return { label: o.label, pct: Math.max(0, Math.min(100, pct)) };
        });
      }
      return { lp, outs };
    }

    // Map a linear predictor to a risk %, using the primary output and the model link.
    _linkRisk(lp) {
      const m = this.data.model, o = (m.outputs || [{}])[0] || {};
      if (m.type === "cloglog") return Math.max(0, Math.min(100, (1 - Math.pow(1 - (o.F0 || 0), Math.exp(lp - (m.center || 0)))) * 100));
      if (m.type === "logistic") return Math.max(0, Math.min(100, 100 / (1 + Math.exp(-(lp + (o.intercept || 0))))));
      if (m.type === "lookup") { const b = (m.bands || []).find((x) => lp < x.lt); return b ? b.pct : ((m.bands || []).length ? m.bands[m.bands.length - 1].pct : 0); }
      return Math.max(0, Math.min(100, lp));
    }
    // Per-predictor additive contribution to the linear predictor at the current selection.
    _formulaContribs() {
      const m = this.data.model, preds = this.data.predictors || [];
      const base = Number(m.intercept) || 0;
      const items = preds.map((p, i) => {
        const raw = (p.type === "slider" || p.type === "number") ? this._slider[i] : Number(((p.options || [])[this._predSel[i]] || {}).points || 0);
        const term = p.transform === "exp" ? Math.exp(raw) : raw;
        const contrib = (Number(p.coef) || 0) * term;
        const optLabel = (p.type === "slider" || p.type === "number") ? (raw + (p.unit ? " " + p.unit : "")) : (((p.options || [])[this._predSel[i]] || {}).label || "");
        return { name: p.name, label: optLabel, contrib, on: Math.abs(contrib) > 1e-9 };
      });
      return { base, items };
    }

    _formulaUpdate() {
      const { lp, outs } = this._formulaCompute();
      const m = this.data.model;
      const mroot = this._rail.querySelector("#fmetrics");
      if (mroot) {
        let cells = "";
        if (m.show_lp) cells += `<div class="metric"><div class="k">${esc(m.lp_label || "Combined value")}</div><div class="v">${lp.toFixed(1)}</div></div>`;
        cells += outs.map((o, i) => `<div class="metric${(i || m.show_lp) ? " sm" : ""}"><div class="k">${esc(o.label)}</div><div class="v">${o.approx ? "~" : ""}${fmtPct(o.pct)}</div></div>`).join("");
        mroot.innerHTML = cells;
      }
      this._drawWaterfall();
      this._drawDonut();
    }

    _drawWaterfall() {
      const svg = this._panel.querySelector("#fwater"); if (!svg) return;
      const { base, items } = this._formulaContribs();
      const active = items.filter((c) => c.on);
      const W = 460, rowH = 26, x0 = 168, plotW = 250, n = active.length + 2, H = 18 + n * rowH + 16;
      const sx = (v) => x0 + (Math.max(0, Math.min(100, v)) / 100) * plotW;
      let g = `<line x1="${x0}" y1="12" x2="${x0}" y2="${H - 20}" stroke="var(--azure-line)"/>`;
      [0, 25, 50, 75, 100].forEach((v) => { g += `<line x1="${sx(v)}" y1="12" x2="${sx(v)}" y2="${H - 26}" stroke="#f0f3f7"/><text x="${sx(v)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="#98a6b5" font-family="var(--sans)">${v}%</text>`; });
      const baseRisk = this._linkRisk(base);
      let y = 16, cur = base;
      // baseline row
      g += `<rect x="${x0}" y="${y}" width="${Math.max(1, (baseRisk / 100) * plotW)}" height="15" rx="2" fill="#9fb4c7"/>`;
      g += `<text x="${x0 - 8}" y="${y + 12}" text-anchor="end" font-size="10.5" fill="#5b6b7b" font-family="var(--sans)">Baseline risk</text>`;
      g += `<text x="${sx(baseRisk) + 5}" y="${y + 12}" font-size="10" fill="#5b6b7b" font-family="var(--sans)">${fmtPct(baseRisk)}</text>`;
      y += rowH;
      active.forEach((c, k) => {
        const before = this._linkRisk(cur), after = this._linkRisk(cur + c.contrib); cur += c.contrib;
        const up = after >= before, x1 = sx(Math.min(before, after)), w = Math.max(1.5, Math.abs(after - before) / 100 * plotW);
        g += `<rect x="${x1}" y="${y}" width="${w}" height="15" rx="2" fill="${up ? PAL[k % PAL.length] : "#b02020"}"/>`;
        g += `<text x="${x0 - 8}" y="${y + 12}" text-anchor="end" font-size="10.5" fill="#1a2430" font-family="var(--sans)">${esc(shorten(c.name, 22))}</text>`;
        g += `<text x="${sx(Math.max(before, after)) + 5}" y="${y + 12}" font-size="10" fill="${up ? "#135ba8" : "#b02020"}" font-family="var(--sans)">${up ? "+" : ""}${(after - before).toFixed(1)}</text>`;
        y += rowH;
      });
      const total = this._linkRisk(cur);
      g += `<rect x="${x0}" y="${y}" width="${Math.max(1, (total / 100) * plotW)}" height="15" rx="2" fill="#0f7a54"/>`;
      g += `<text x="${x0 - 8}" y="${y + 12}" text-anchor="end" font-size="12" fill="#1a2430" font-weight="700" font-family="var(--serif)">Total</text>`;
      g += `<text x="${sx(total) + 5}" y="${y + 12}" font-size="12" fill="#0f7a54" font-weight="700" font-family="var(--serif)">${fmtPct(total)}</text>`;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.style.maxHeight = "300px"; svg.innerHTML = g;
    }

    _drawDonut() {
      const svg = this._panel.querySelector("#fdonut"); if (!svg) return;
      const { base, items } = this._formulaContribs();
      const active = items.filter((c) => c.on);
      const cx = 105, cy = 104, rad = 66, w = 22;
      const total = this._linkRisk(base + active.reduce((a, c) => a + c.contrib, 0));
      const totContrib = active.reduce((a, c) => a + Math.abs(c.contrib), 0) || 1;
      const fillFrac = total / 100;
      let ang = -Math.PI / 2, segs = "";
      active.forEach((c, k) => {
        const frac = (Math.abs(c.contrib) / totContrib) * fillFrac, a2 = ang + frac * 2 * Math.PI;
        segs += arcPath(cx, cy, rad, ang, a2, PAL[k % PAL.length], w); ang = a2;
      });
      const track = `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="#eef2f6" stroke-width="${w}"/>`;
      svg.innerHTML = `${track}${segs}
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-family="var(--serif)" font-size="30" fill="#1a2430">${fmtPct(total)}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-family="var(--sans)" font-size="10" fill="#5b6b7b">predicted risk</text>
        ${active.length ? "" : `<text x="${cx}" y="${cy + 40}" text-anchor="middle" font-family="var(--sans)" font-size="10" fill="#98a6b5">baseline patient</text>`}`;
    }

    /* ---------------- LOOKUP (combination table -> point estimates) ---------------- */
    _renderLookup() {
      const d = this.data, m = d.model, preds = d.predictors || [], th = d.thresholds || { group1: 20, group2: 2};
      if (!this._predSel) this._predSel = preds.map(() => 0);
      const key = preds.map((p, i) => ((p.options || [])[this._predSel[i]] || {}).value).join("|");
      const row = (m.table || {})[key];
      const cosyRaw = (row && row.cosy) || "", driveRaw = (row && row.drive) || "";
      const cm = cosyRaw.match(/([\d.]+)%\s*\(([^)]*)\)/);
      const cosyPct = cm ? cm[1] : (cosyRaw.match(/([\d.]+)%/) || [])[1];
      const cosyCI = cm ? cm[2].replace(/%/g, "").replace(/\s*-\s*/, "–") : "";
      const driveOk = driveRaw && driveRaw.toLowerCase() !== "nan";
      const monthsLabel = ((preds[0].options || [])[this._predSel[0]] || {}).label || "";
      let rail = "";
      preds.forEach((p, i) => { rail += this._predField(p, i); });
      rail += `<div class="scorewrap"><div class="metric"><div class="k">COSY</div><div class="v" style="color:var(--amber-deep)">${cosyPct != null ? cosyPct + "%" : "—"}</div></div>
        <div class="metric sm"><div class="k">Fit to drive (Group 1)</div><div class="v" style="font-size:19px">${driveOk ? "~" + driveRaw + " mo" : "—"}</div></div></div>`;
      this._rail.innerHTML = rail;
      this._panel.innerHTML = `<div class="panelhead"><div class="flabel" style="margin:0">${esc(m.panel_title || "Result")} <button class="info-dot" data-info="${attr(COSY_INFO)}" aria-label="About COSY">i</button></div></div>
        ${row ? `<div class="lookbig"><span class="lkpct">${cosyPct}%</span>${cosyCI ? `<span class="lkci">95% CI ${esc(cosyCI)}%</span>` : ""}</div>
        <p class="lksub">Estimated chance of a further seizure within 12 months, given the patient has been seizure-free for <b>${esc(monthsLabel)}</b> after a first seizure.</p>
        <div class="verdict" style="margin-top:22px">
          <div class="vhead">Driving orientation &middot; seizure-free interval <button class="info-dot" data-info="${attr(COSY_INFO)}" aria-label="About COSY and the orientation cut-offs">i</button></div>
          <div class="vrow"><span class="lab"><i style="background:var(--amber-deep)"></i><span class="lt"><b>Group 1</b><span class="t">private &middot; annual risk &lt; ${th.group1}%</span></span></span><span class="val" style="color:var(--amber-deep)">${driveOk ? "after ~" + esc(driveRaw) + " mo" : "not reached"}</span></div>
          <div class="vnote">${th.group1}% is an orientation cut-off used in some jurisdictions — not an established limit. COSY at long seizure-free intervals rests on few patients and can be unstable; weigh it against the absolute numbers. Local laws and guidelines apply.</div>
        </div>` : `<p class="lksub">Data are not available for this exact combination of factors.</p>`}`;
      this._rail.querySelectorAll(".seg[data-pi]").forEach((seg) => seg.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return; this._predSel[+seg.dataset.pi] = +b.dataset.oi; this._renderLookup();
      }));
    }

    _drawBars(rows, active) {
      const { W, pL, pR } = GEO; const rowH = 44, top = 14; let g = "";
      const bw = W - pL - pR;
      rows.forEach((r, i) => {
        const y = top + i * rowH; const on = r === active; const pct = r.pct != null ? r.pct : 0;
        g += `<text x="${pL - 8}" y="${y + 16}" text-anchor="end" font-size="12.5" fill="${on ? "#0e1c2b" : "#5c6b7a"}" font-weight="${on ? 600 : 400}">${esc(r.label)}</text>`;
        g += `<rect x="${pL}" y="${y + 5}" width="${bw}" height="16" rx="4" fill="#f1f5f9"/>`;
        g += `<rect x="${pL}" y="${y + 5}" width="${Math.max(2, bw * Math.min(pct, 100) / 100)}" height="16" rx="4" fill="${on ? "#1f83e6" : "#cfe4fb"}"/>`;
        g += `<text x="${pL + bw}" y="${y + 17}" text-anchor="end" font-size="12" fill="${on ? "#135ba8" : "#8a97a4"}" font-weight="600" font-variant-numeric="tabular-nums">${r.pct != null ? fmtPct(r.pct) : "—"}</text>`;
      });
      this._panel.querySelector("#plot").innerHTML = g;
    }

    /* ---------------- shared ---------------- */
    _scoreFromSel() {
      return (this.data.predictors || []).reduce((a, p, i) => a + Number(((p.options || [])[this._predSel[i]] || {}).points || 0), 0);
    }
    _predField(p, i) {
      if (!this._predSel) this._predSel = (this.data.predictors || []).map(() => 0);
      const info = p.assess || p.info || "";
      const opts = (p.options || []).map((o, oi) => `<button data-oi="${oi}" class="${oi === this._predSel[i] ? "on" : ""}">${esc(o.label)}</button>`).join("");
      return `<div class="field"><div class="flabel">${p.abbrev ? `<span class="code">${esc(p.abbrev)}</span>` : ""}${esc(p.name)}${info ? `<button class="info-dot" data-info="${attr(info)}" aria-label="About ${esc(p.name)}">i</button>` : ""}</div><div class="seg" data-pi="${i}">${opts}</div></div>`;
    }

    _footHTML() {
      const p = this.data.provenance || {}, m = this.data.meta || {};
      const method = p.extraction_method || p.method || "";
      let banner = "";
      if (method === "figure_digitized" && (p.review_status || "unreviewed") !== "human_reviewed")
        banner = `<div class="warn review">Figure-digitized data, review status: <b>${esc(p.review_status || "unreviewed")}</b>. Not cleared for clinical deployment until human-reviewed.</div>`;
      const note = `${banner}Fixed axes across the library so scores stay comparable. ${method === "figure_digitized" ? "Curves digitised from the source figure and monthly-resampled. " : ""}${citation(m, true)} Demonstration only — not for clinical or driving decisions.`;
      const disclaimer = `<div class="disclaimer"><b>Disclaimer</b><p>Most of the models featured on this website were not developed by us. For detailed information about each model or calculator, please refer to the links to the original publications. This website provides an overview of selected prognostic models for epilepsy for demonstration purposes only. If you believe a model should be removed, please contact us, and we will address your request promptly. We do not guarantee the accuracy, reliability, or scientific integrity of these calculators. The implementations may contain errors and could produce unreliable results. These prognostic tools are based on scientific research and are intended for demonstration purposes only. The clinical usefulness and robustness of most of these models have not been adequately tested, and they should not be used to guide medical decisions. All liability is excluded.</p><p class="copyr">&copy; 2025, SeLECT consortium &middot; <a href="mailto:select@usz.ch">select@usz.ch</a></p></div>`;
      return note + disclaimer;
    }

    _bindChrome(root, back) {
      const pop = root.querySelector("#pop");
      const showPop = (el) => {
        const t = el.getAttribute("data-info"); if (!t) return;
        pop.textContent = t; pop.classList.add("show");
        const r = el.getBoundingClientRect(), pw = pop.offsetWidth || 260, dotC = r.left + r.width / 2;
        const left = Math.max(8, Math.min(dotC - pw / 2, window.innerWidth - pw - 8));
        pop.style.left = left + "px"; pop.style.top = (r.top - 9) + "px";
        pop.style.setProperty("--arrow", Math.max(12, Math.min(dotC - left, pw - 12)) + "px");
      };
      const hidePop = () => pop.classList.remove("show");
      root.addEventListener("mouseover", (e) => { const dd = e.target.closest && e.target.closest(".info-dot"); if (dd) showPop(dd); });
      root.addEventListener("mouseout", (e) => { if (e.target.closest && e.target.closest(".info-dot")) hidePop(); });
      root.addEventListener("click", (e) => { const dd = e.target.closest && e.target.closest(".info-dot"); if (dd) { e.preventDefault(); (pop.classList.contains("show") && pop.textContent === dd.getAttribute("data-info")) ? hidePop() : showPop(dd); } });
      const modal = root.querySelector("#modal");
      root.querySelector("#btn-info").onclick = () => { root.querySelector("#mcontent").innerHTML = this._modalHTML(); modal.classList.add("open"); };
      root.querySelector("#mclose").onclick = () => modal.classList.remove("open");
      modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });
      const tabs = root.querySelector("#viewtabs");
      const ext = this.hasAttribute("external-classic");   // page supplies the real CFF form; hide the internal placeholder
      if (tabs) tabs.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; tabs.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); const cl = b.dataset.view === "classic"; root.querySelector("#grid").style.display = cl ? "none" : "grid"; root.querySelector("#classicview").style.display = (cl && !ext) ? "flex" : "none"; const bi2 = root.querySelector("#belowinfo"); if (bi2 && bi2.dataset.has) bi2.style.display = cl ? "none" : "block"; this.dispatchEvent(new CustomEvent("riskcalc:view", { bubbles: true, detail: { view: cl ? "classic" : "new" } })); });
      const bb = root.querySelector("#back");
      if (bb) bb.onclick = () => { if (back) location.href = back; else history.back(); };
    }

    _belowHTML() {
      const m = this.data.meta || {};
      const body = m.cff_info
        ? `<div class="cffinfo">${m.cff_info.replace(/<script[\s\S]*?<\/script>/gi, "")}</div>`
        : (m.clinical_utility ? `<div class="cffinfo"><p>${esc(m.clinical_utility)}</p></div>` : "");
      if (!body) return "";
      return `<details><summary>About this score &amp; how it's calculated</summary>${body}</details>`;
    }

    _modalHTML() {
      const m = this.data.meta || {}, th = this.data.thresholds || {};
      const isCurve = this.data.kind === "curve";
      return `<h2>${esc(m.title || this.data.id)}</h2><p class="msub">${citation(m)}</p><div class="mbody">
        ${m.cff_info ? `<div class="cffinfo">${m.cff_info.replace(/<script[\s\S]*?<\/script>/gi, "")}</div>` : (m.clinical_utility ? `<h3>What it predicts</h3><p>${esc(m.clinical_utility)}</p>` : (m.outcome ? `<h3>Outcome</h3><p>${esc(m.outcome)}</p>` : ""))}
        ${isCurve ? `<h3>COSY &amp; driving orientation</h3><p>COSY(t) = 100·(1 − S(t+${this.data.model.horizon_months || H})/S(t)) is the chance of occurrence of a seizure in the next year, given t months seizure-free. The ${th.group1 || 20}% (Group 1, private) and ${th.group2 || 2}% (Group 2, commercial) marks are cut-offs used in some jurisdictions (e.g. EU 2009/113/EC) as orientation for driving after a seizure — not universally established. Local laws and guidelines apply.</p>` : ""}
        ${m.doi || m.pmid ? `<h3>Source</h3><p>${m.doi ? `<a href="https://doi.org/${esc(m.doi)}" target="_blank" rel="noopener">doi:${esc(m.doi)}</a>` : ""}${m.doi && m.pmid ? " &middot; " : ""}${m.pmid ? `<a href="https://pubmed.ncbi.nlm.nih.gov/${esc(m.pmid)}/" target="_blank" rel="noopener">PMID ${esc(m.pmid)}</a>` : ""}</p>` : ""}
        <div class="disc">For demonstration and research only. These implementations may contain errors and must not guide clinical or driving decisions.</div></div>`;
    }
  }

  /* helpers */
  const PAL = ["#1f83e6", "#e0912b", "#0f7a54", "#b02020", "#7b52c9", "#2aa7b8", "#c94f8e", "#5b7b3a", "#d06a1f", "#3a6ea5"];
  function shorten(s, n) { s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function arcPath(cx, cy, rad, a1, a2, col, w) {
    const x1 = cx + rad * Math.cos(a1), y1 = cy + rad * Math.sin(a1), x2 = cx + rad * Math.cos(a2), y2 = cy + rad * Math.sin(a2);
    const large = (a2 - a1) > Math.PI ? 1 : 0;
    return `<path d="M ${x1} ${y1} A ${rad} ${rad} 0 ${large} 1 ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="butt"/>`;
  }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function attr(x) { return esc(x).replace(/'/g, "&#39;"); }
  function fmtPct(v) { return (v == null ? 0 : Math.round(v)) + "%"; }
  function fmtMo(v) { return v == null ? "not reached" : v <= 0 ? "immediately" : v + " mo"; }
  function firstBelow(arr, thr) { for (let i = 0; i < arr.length; i++) if (arr[i] < thr) return i; return null; }
  function seriesArr(dict, maxMonth) { const out = []; for (let m = 0; m <= maxMonth; m++) { const v = dict ? (dict[m] != null ? dict[m] : dict[String(m)]) : undefined; out.push(v != null ? Number(v) : (out.length ? out[out.length - 1] : 0)); } return out; }
  function resolveStratum(strata, score) {
    const keys = Object.keys(strata);
    for (const k of keys) { const s = strata[k]; if (s.lo != null && s.hi != null && score >= s.lo && score <= s.hi) return k; }
    for (const k of keys) { const r = String(strata[k].display || k).match(/(\d+)\s*[–-]\s*(\d+)/); if (r && score >= +r[1] && score <= +r[2]) return k; }
    for (const k of keys) { const r = k.match(/(-?\d+)\s*$/); if (r && +r[1] === score) return k; }
    for (const k of keys) { const r = String(strata[k].display || k).match(/(-?\d+)/); if (r && +r[1] === score) return k; }
    return null;
  }
  function zoneFor(cosyV, th) {
    if (cosyV < th.group2) return ["Below both cut-offs", "background:#e6f6ef;color:#0f7a54"];
    if (cosyV < th.group1) return ["Below Group 1 cut-off", "background:#fbf0dd;color:#b26a06"];
    return ["Above both cut-offs", "background:#fbe9e9;color:#b02020"];
  }
  function riskBand(row) {
    if (!row || row.pct == null) return null;
    const p = row.pct; return p < 5 ? { n: "Low risk", c: "var(--green)" } : p < 20 ? { n: "Moderate risk", c: "var(--amber-deep)" } : { n: "High risk", c: "var(--red)" };
  }
  function citation(m, plain) {
    if (!m) return "";
    let who = m.authors ? (m.authors.split(",")[0].trim() + (m.authors.indexOf(",") >= 0 ? ", et al." : "")) : (m.citation || "");
    const jy = [m.journal, m.year].filter(Boolean).join(" ");
    const doi = m.doi ? `doi:${esc(m.doi)}` : "";
    const doiHtml = m.doi ? (plain ? `doi:${esc(m.doi)}` : `<a href="https://doi.org/${esc(m.doi)}" target="_blank" rel="noopener">doi:${esc(m.doi)}</a>`) : "";
    return [esc(who), esc(jy) + (m.year ? "" : ""), doiHtml].filter(Boolean).join(" &middot; ");
  }

  function seg2(host, items, cur, cb) {
    host.innerHTML = ""; items.forEach((it) => { const b = document.createElement("button"); b.textContent = it.l; b.className = it.v === cur ? "on" : ""; b.onclick = () => cb(it.v); host.appendChild(b); });
  }

  customElements.define("risk-calculator", RiskCalculator);
})();
