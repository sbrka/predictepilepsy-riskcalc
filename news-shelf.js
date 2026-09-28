/* news-shelf — predictepilepsy.com "What's new" carousel + right-hand detail drawer.
   Usage: <news-shelf src="https://cdn.jsdelivr.net/gh/sbrka/predictepilepsy-riskcalc@<SHA>/news.json"
                      [limit="12"] [all-href="/news/"]></news-shelf>
   Data: component/news.json, built by 7_integrate_wp/build_news.py from news_items.json (only
   publish:true items). Each item links to live calculator pages; #news-<id> opens its drawer. */
(function () {
  if (customElements.get("news-shelf")) return;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // finder group colours (calc-finder.js GROUP_GRAD) so a card matches its calculator's tile
  const GRAD = { g1: ["#4a86d6", "#1f5aa8"], g2: ["#ef8a44", "#c85713"], g3: ["#9074c0", "#5f4790"],
    g4: ["#22a578", "#0c6647"], g5: ["#d8564a", "#9e2820"], g6: ["#2472c8", "#0e4a8a"], g7: ["#5a6b80", "#333c4a"] };
  const TYPE = { new: "New calculator", update: "Evidence update", correction: "Correction", section: "New section" };
  const CURVE = '<svg class="crv" viewBox="0 0 96 34" preserveAspectRatio="none" aria-hidden="true"><path d="M0 31 C24 29 33 15 52 10 71 5 80 4 96 3 L96 34 L0 34 Z" fill="#fff" opacity=".12"/><path d="M0 31 C24 29 33 15 52 10 71 5 80 4 96 3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".92"/></svg>';
  const fmtDate = (iso) => { try { return new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return iso; } };
  const tileFont = (n) => n <= 3 ? 22 : n <= 4 ? 19 : n <= 5 ? 16 : n <= 6 ? 14 : n <= 7 ? 12.5 : 11;
  const tileInner = (ab) => {
    ab = String(ab); const i = ab.indexOf("-");
    if (i > 0 && i < ab.length - 1) { const a = ab.slice(0, i + 1), b = ab.slice(i + 1); return `<span class="ab wrap" style="font-size:${tileFont(Math.max(a.length, b.length))}px">${esc(a)}<br>${esc(b)}</span>`; }
    return `<span class="ab" style="font-size:${tileFont(ab.length)}px">${esc(ab)}</span>`;
  };
  const grad = (g) => { const c = GRAD[g] || GRAD.g6; return `linear-gradient(150deg,${c[0]},${c[1]})`; };
  const recChip = (c) => c.rec === "ec" ? `<span class="chip ec" title="${esc(c.rec_why)}">&#9733; Editor&rsquo;s choice</span>`
    : c.rec === "rec" ? `<span class="chip rec" title="${esc(c.rec_why)}">&#10003; Recommended</span>` : "";
  const tierChip = (c) => c.tier ? `<span class="chip tier" title="Evidence tier on predictepilepsy.com (A strongest, C weakest)">Evidence ${esc(c.tier)}</span>` : "";

  // what the badges mean — same rules as the finder badges (build-calculator skill, 7c/7d)
  const LEGEND = `<div class="legend" role="note" aria-label="What the badges mean">
    <div><span class="chip ec">&#9733; Editor&rsquo;s choice</span>The strongest evidence for its clinical question: externally validated in an independent cohort, where it held up (evidence A).</div>
    <div><span class="chip rec">&#10003; Recommended</span>Clinically useful with good evidence, but not externally validated or only modestly so (evidence B), or a stronger tool exists for the same question.</div>
    <div><span class="chip tier">Evidence A&nbsp;&middot;&nbsp;B&nbsp;&middot;&nbsp;C</span>Our grade of the validation behind each model: A externally validated and held up, B internal validation only or modest in external validation, C weak or none. Calculators without a badge have weaker evidence; use them with caution.</div>
  </div>`;
  const CSS = `
  :host{--azure:#135ba8;--azure-deep:#0e4a8a;--azure2:#2b7de0;--wash:#eef6fe;--line:#d7e6f7;--ink:#13233a;--muted:#5b7189;
    display:block;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.55;font-size:15px}
  *{box-sizing:border-box}
  .wrap{max-width:1140px;margin:0 auto;padding:8px 20px 36px}
  .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:0 0 14px}
  .kicker{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--azure);margin:0 0 6px}
  .kicker i{width:7px;height:7px;border-radius:50%;background:var(--azure2)}
  h2.t{font-family:Georgia,"Times New Roman",serif;font-size:30px;line-height:1.15;margin:0;letter-spacing:-.01em;color:#13233a}
  .lede{color:var(--muted);margin:6px 0 0;font-size:15.5px}
  .ctl{display:flex;align-items:center;gap:8px}
  .ctl button{width:42px;height:42px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--azure);font-size:19px;cursor:pointer;
    display:grid;place-items:center;transition:.15s;box-shadow:0 1px 3px rgba(16,50,90,.06)}
  .ctl button:hover:not(:disabled){background:var(--azure);color:#fff;border-color:var(--azure)}
  .ctl button:disabled{opacity:.35;cursor:default}
  .all{margin-left:6px;font-size:14px;font-weight:700;color:var(--azure);text-decoration:none;border:1px solid var(--line);background:#fff;border-radius:11px;padding:10px 16px}
  .all:hover{border-color:var(--azure);background:var(--wash)}
  .track{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding:0 4px;scroll-behavior:smooth;padding:8px 4px 22px;margin:0 -4px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .track::-webkit-scrollbar{display:none}
  .card{flex:0 0 322px;scroll-snap-align:start;border-radius:18px;background:#fff;border:1px solid var(--line);box-shadow:0 6px 20px rgba(16,50,90,.08);
    overflow:hidden;display:flex;flex-direction:column;cursor:pointer;transition:transform .2s,box-shadow .2s;text-align:left;outline:none}
  .card:hover{transform:translateY(-5px);box-shadow:0 16px 34px rgba(16,50,90,.16)}
  .card:focus-visible{outline:3px solid var(--azure2);outline-offset:2px}
  .top{position:relative;height:118px;color:#fff;overflow:hidden}
  .top .wave{position:absolute;left:0;right:0;bottom:0;width:100%;height:70px;opacity:.55}
  .type{position:absolute;top:14px;left:14px;display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
    background:rgba(255,255,255,.95);color:#13233a;border-radius:99px;padding:5px 11px 5px 9px;box-shadow:0 2px 8px rgba(0,0,0,.12)}
  .type i{width:7px;height:7px;border-radius:50%}
  .type.new i{background:#0f9d6b}.type.update i{background:#2b7de0}.type.correction i{background:#e0912b}.type.section i{background:#8a63c9}
  .tile{position:absolute;right:16px;bottom:14px;width:62px;height:62px;border-radius:16px;background:rgba(255,255,255,.17);border:1px solid rgba(255,255,255,.35);
    display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,.14)}
  .tile .ab{font-weight:800;line-height:1;text-align:center;z-index:1;padding:0 3px;letter-spacing:-.3px;text-shadow:0 1px 2px rgba(0,0,0,.15);white-space:nowrap}
  .tile .ab.wrap{white-space:normal;line-height:1.02}
  .tile .crv{position:absolute;left:0;right:0;bottom:0;height:22px;width:100%}
  .body{padding:16px 20px 18px;display:flex;flex-direction:column;flex:1}
  .date{font-size:12px;font-weight:600;letter-spacing:.04em;color:var(--muted);font-variant-numeric:tabular-nums}
  .ct{font-family:Georgia,"Times New Roman",serif;font-size:19px;line-height:1.24;font-weight:700;color:#13233a;margin:6px 0 8px;
    display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .cs{font-size:14px;color:#3d5268;margin:0;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
  .foot{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:14px}
  .more{margin-left:auto;font-size:13px;font-weight:800;color:var(--azure);white-space:nowrap}
  .chip{font-size:11px;font-weight:700;border-radius:99px;padding:3px 9px;white-space:nowrap}
  .chip.ec{background:#fff4d6;color:#8a5a00;border:1px solid #f1d58a}
  .chip.rec{background:#e6f6ec;color:#1c7a43;border:1px solid #b7e6c7}
  .chip.tier,.chip.n{background:#f1f5f9;color:#43566b;border:1px solid #e1e8ef}
  .bar{height:4px;border-radius:4px;background:#e7eef6;overflow:hidden;max-width:220px;margin:2px auto 0}
  .bar i{display:block;height:100%;width:30%;border-radius:4px;background:var(--azure);transition:margin-left .2s,width .2s}
  /* drawer */
  .ov{position:fixed;inset:0;background:rgba(15,35,58,.45);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .25s;z-index:99998}
  .ov.on{opacity:1;pointer-events:auto}
  .dr{position:fixed;top:0;right:0;height:100%;width:min(580px,100%);background:#fff;z-index:99999;box-shadow:-24px 0 60px rgba(10,25,50,.28);
    transform:translateX(102%);transition:transform .32s cubic-bezier(.22,.61,.36,1);overflow-y:auto;overscroll-behavior:contain;visibility:hidden}
  .dr.on{transform:none;visibility:visible}
  .dtop{position:relative;height:150px;color:#fff;overflow:hidden}
  .dtop .wave{position:absolute;left:0;right:0;bottom:0;width:100%;height:90px;opacity:.55}
  .dtop .type{top:20px;left:28px}
  .dtop .tile{right:auto;left:28px;bottom:18px}
  .x{position:absolute;top:14px;right:14px;z-index:3;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.2);color:#fff;font-size:22px;
    cursor:pointer;display:grid;place-items:center;transition:.15s}
  .x:hover{background:rgba(255,255,255,.34);transform:rotate(90deg)}
  .x:focus-visible{outline:3px solid #fff;outline-offset:1px}
  .dbody{padding:20px 28px 34px}
  .dbody h2{font-family:Georgia,"Times New Roman",serif;font-size:25px;line-height:1.2;margin:6px 0 10px;color:#13233a}
  .dsum{font-size:15.5px;color:#26384c;margin:0}
  .sh{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:24px 0 10px}
  .kp{list-style:none;margin:0;padding:0;display:grid;gap:10px}
  .kp li{position:relative;padding-left:26px;font-size:14.5px;line-height:1.55;color:#26384c}
  .kp li:before{content:"";position:absolute;left:3px;top:7px;width:10px;height:10px;border-radius:50%;background:var(--azure);box-shadow:0 0 0 4px var(--wash)}
  .calc{border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:0 0 12px;background:#fbfdff}
  .calc .nm{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-weight:700;font-size:15.5px;color:var(--azure-deep)}
  .calc .dot{width:10px;height:10px;border-radius:3px;flex:0 0 auto}
  .calc p{margin:6px 0 0;font-size:13.5px;color:#3d5268}
  .calc .ev{color:#43566b}
  .calc .src{font-size:12.5px;color:var(--muted)}
  .calc .src a,.srcs a{color:var(--azure);font-weight:600;text-decoration:none}
  .calc .src a:hover,.srcs a:hover{text-decoration:underline}
  .calc .go{display:inline-flex;margin-top:10px;font-size:13.5px;font-weight:700;padding:9px 14px;border-radius:10px;background:var(--azure);color:#fff;text-decoration:none}
  .calc .go:hover{background:#0f4e90}
  .row{display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px solid #eef3f8}
  .row:last-child{border-bottom:0}
  .row a.rn{font-weight:650;color:var(--azure-deep);text-decoration:none;font-size:14.5px;flex:1;min-width:0}
  .row a.rn:hover{text-decoration:underline}
  .srcs{margin:0;padding:0;list-style:none;display:grid;gap:8px;font-size:13.5px;color:#26384c}
  .legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px 24px;margin:18px 0 0;padding:14px 18px;border:1px solid var(--line);border-radius:14px;background:#f8fbff}
  .legend div{font-size:12.5px;color:#43566b;line-height:1.5}
  .legend .chip{display:inline-block;margin:0 7px 3px 0}
  .dbody .legend{grid-template-columns:1fr;margin-top:24px}
  .disc{margin-top:26px;font-size:12px;color:#6b7f93;line-height:1.55;border-top:1px solid #eef3f8;padding-top:14px}
  @media(max-width:560px){h2.t{font-size:25px}.card{flex-basis:84vw}.dbody{padding:18px 20px 30px}.dtop .type{left:20px}.dtop .tile{left:20px}.dbody h2{font-size:22px}}
  @media(prefers-reduced-motion:reduce){.track{scroll-behavior:auto}.card,.dr,.ov{transition:none}}
  `;

  class NewsShelf extends HTMLElement {
    connectedCallback() { if (this._done) return; this._done = true; this.attachShadow({ mode: "open" }); this._load(); }
    async _load() {
      let data = null;
      try { data = await (await fetch(this.getAttribute("src"))).json(); } catch (e) { data = null; }
      const lim = +this.getAttribute("limit") || 12;
      this.items = ((data && data.items) || []).slice(0, lim);
      if (!this.items.length) { this.style.display = "none"; return; }   // nothing published: render nothing
      this.render();
      this.bind();
      this._fromHash();
    }
    wave() {   // the site's rising-curve motif, drawn large across the band
      return `<svg class="wave" viewBox="0 0 320 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 64 C70 60 96 30 150 20 204 10 250 8 320 5 L320 70 L0 70 Z" fill="#fff" opacity=".10"/><path d="M0 64 C70 60 96 30 150 20 204 10 250 8 320 5" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/></svg>`;
    }
    card(it, i) {
      const one = it.calcs.length === 1 ? it.calcs[0] : null;
      const chips = one ? recChip(one) + tierChip(one) : `<span class="chip n">${it.calcs.length} calculators</span>`;
      return `<article class="card" tabindex="0" role="button" data-i="${i}" aria-label="${esc(TYPE[it.type] || "")}: ${esc(it.title)} — read more">
        <div class="top" style="background:${grad(it.badge.group)}">${this.wave(it.badge.group)}
          <span class="type ${esc(it.type)}"><i></i>${esc(TYPE[it.type] || it.type)}</span>
          <span class="tile">${tileInner(it.badge.text)}${CURVE}</span></div>
        <div class="body"><div class="date">${esc(fmtDate(it.date))}</div>
          <h3 class="ct">${esc(it.title)}</h3><p class="cs">${esc(it.summary)}</p>
          <div class="foot">${chips}<span class="more">Read more &rarr;</span></div></div>
      </article>`;
    }
    cite(c) {
      const a = c.cite || {}, bits = [];
      const au = String(a.authors || "").split(",").slice(0, 1).join("").trim();
      if (au) bits.push(esc(au) + (String(a.authors).split(",").length > 1 ? " et&nbsp;al." : ""));
      if (a.journal) bits.push(`<i>${esc(a.journal)}</i>${a.year ? " " + esc(a.year) : ""}`);
      if (a.doi) bits.push(`<a href="https://doi.org/${esc(a.doi)}" target="_blank" rel="noopener">DOI</a>`);
      if (a.pmid) bits.push(`<a href="https://pubmed.ncbi.nlm.nih.gov/${esc(a.pmid)}/" target="_blank" rel="noopener">PubMed</a>`);
      return bits.join(" &middot; ");
    }
    drawer(it) {
      const full = it.calcs.length <= 2;           // 1-2 calculators: full evidence block each; more: compact list
      const calcs = full
        ? it.calcs.map((c) => `<div class="calc"><div class="nm"><span class="dot" style="background:${grad(c.group)}"></span>${esc(c.name)}${recChip(c)}${tierChip(c)}</div>
            <p>${esc(c.desc)}</p>
            ${c.rationale ? `<p class="ev"><b>Evidence${c.tier ? " tier " + esc(c.tier) : ""}.</b> ${esc(c.rationale)}</p>` : ""}
            ${this.cite(c) ? `<p class="src">${this.cite(c)}</p>` : ""}
            <a class="go" href="${esc(c.url)}">Open calculator &rarr;</a></div>`).join("")
        : `<div class="calc">${it.calcs.map((c) => `<div class="row"><span class="dot" style="background:${grad(c.group)};width:10px;height:10px;border-radius:3px;flex:0 0 auto"></span><a class="rn" href="${esc(c.url)}">${esc(c.name)}</a>${recChip(c)}</div>`).join("")}</div>`;
      const srcs = (it.sources || []).length ? `<div class="sh">Source${it.sources.length > 1 ? "s" : ""}</div><ul class="srcs">${it.sources.map((s) =>
          `<li>${esc(s.cite)}${s.doi ? ` &middot; <a href="https://doi.org/${esc(s.doi)}" target="_blank" rel="noopener">DOI</a>` : ""}${s.pmid ? ` &middot; <a href="https://pubmed.ncbi.nlm.nih.gov/${esc(s.pmid)}/" target="_blank" rel="noopener">PubMed</a>` : ""}</li>`).join("")}</ul>` : "";
      return `<div class="dtop" style="background:${grad(it.badge.group)}">${this.wave(it.badge.group)}
          <button class="x" id="x" aria-label="Close">&times;</button>
          <span class="type ${esc(it.type)}"><i></i>${esc(TYPE[it.type] || it.type)}</span>
          <span class="tile">${tileInner(it.badge.text)}${CURVE}</span></div>
        <div class="dbody"><div class="date">${esc(fmtDate(it.date))}</div>
          <h2 id="drt">${esc(it.title)}</h2><p class="dsum">${esc(it.summary)}</p>
          ${(it.details || []).length ? `<div class="sh">What&rsquo;s new</div><ul class="kp">${it.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
          <div class="sh">${it.calcs.length > 1 ? "Calculators" : "Calculator"}</div>${calcs}
          ${srcs}
          ${LEGEND}
          <p class="disc">Population-level estimates from published studies, provided for information. They support, and do not replace, clinical judgement.</p>
        </div>`;
    }
    render() {
      const all = this.getAttribute("all-href");
      this.shadowRoot.innerHTML = `<style>${CSS}</style><section class="wrap" aria-label="What's new">
        <div class="head"><div><p class="kicker"><i></i>What&rsquo;s new</p><h2 class="t">Recently added &amp; updated</h2>
          <p class="lede">New calculators and news about existing ones, newest first.</p></div>
          <div class="ctl"><button id="prev" aria-label="Previous">&lsaquo;</button><button id="next" aria-label="Next">&rsaquo;</button>${all ? `<a class="all" href="${esc(all)}">All news</a>` : ""}</div></div>
        <div class="track" id="track">${this.items.map((it, i) => this.card(it, i)).join("")}</div>
        <div class="bar" aria-hidden="true"><i id="bar"></i></div>${LEGEND}</section>
        <div class="ov" id="ov"></div><aside class="dr" id="dr" role="dialog" aria-modal="true" aria-labelledby="drt"></aside>`;
    }
    bind() {
      const r = this.shadowRoot, track = r.getElementById("track"), bar = r.getElementById("bar");
      const prev = r.getElementById("prev"), next = r.getElementById("next");
      const step = () => { const c = track.querySelector(".card"); return c ? c.offsetWidth + 20 : 340; };
      const sync = () => {
        const max = track.scrollWidth - track.clientWidth;
        prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft >= max - 2;
        const w = Math.max(12, Math.min(100, (track.clientWidth / track.scrollWidth) * 100));
        bar.style.width = w + "%"; bar.style.marginLeft = (max > 0 ? (track.scrollLeft / max) * (100 - w) : 0) + "%";
      };
      // smooth scroll, with an instant fallback where smooth scrolling does not run (background tabs, some embeds)
      const go = (dx) => {
        const s0 = track.scrollLeft;
        track.scrollBy({ left: dx, behavior: "smooth" });
        setTimeout(() => { if (Math.abs(track.scrollLeft - s0) < 2) { track.style.scrollBehavior = "auto"; track.scrollLeft = s0 + dx; track.style.scrollBehavior = ""; sync(); } }, 450);
      };
      prev.onclick = () => go(-step());
      next.onclick = () => go(step());
      track.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
      window.addEventListener("resize", sync);
      sync();
      track.querySelectorAll(".card").forEach((c) => {
        c.onclick = () => this.open(+c.dataset.i, c);
        c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.open(+c.dataset.i, c); } };
      });
      r.getElementById("ov").onclick = () => this.close();
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && r.getElementById("dr").classList.contains("on")) this.close(); });
      window.addEventListener("hashchange", () => this._fromHash());   // same-page links to #news-<id>
    }
    open(i, from) {
      const r = this.shadowRoot, dr = r.getElementById("dr"), it = this.items[i];
      if (!it) return;
      this._from = from || null;
      dr.innerHTML = this.drawer(it); dr.scrollTop = 0;
      r.getElementById("x").onclick = () => this.close();
      dr.classList.add("on"); r.getElementById("ov").classList.add("on");
      this._overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
      try { history.replaceState(null, "", "#news-" + it.id); } catch (e) {}
      setTimeout(() => { const x = r.getElementById("x"); if (x) x.focus({ preventScroll: true }); }, 60);
    }
    close() {
      const r = this.shadowRoot;
      r.getElementById("dr").classList.remove("on"); r.getElementById("ov").classList.remove("on");
      document.body.style.overflow = this._overflow || "";
      if (/^#news-/.test(location.hash)) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
      if (this._from) this._from.focus({ preventScroll: true });
    }
    _fromHash() {
      const m = /^#news-(.+)$/.exec(location.hash || ""); if (!m) return;
      const i = this.items.findIndex((it) => it.id === decodeURIComponent(m[1]));
      if (i < 0 || this.shadowRoot.getElementById("dr").classList.contains("on")) return;
      this.scrollIntoView({ block: "start" });
      const card = this.shadowRoot.querySelector(`.card[data-i="${i}"]`);
      if (card) card.scrollIntoView({ inline: "start", block: "nearest" });
      this.open(i, card);
    }
  }
  customElements.define("news-shelf", NewsShelf);
})();
