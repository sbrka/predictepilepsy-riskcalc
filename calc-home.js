/* calc-home — predictepilepsy.com home page. Dependency-free custom element.
 * 15 main hosted scores as large cards, grouped by etiology. Etiology headers use
 * BioRender-style brain PNGs (CDN); each score card carries a blue abbreviation badge
 * with a rising-risk-curve motif. Selecting a card navigates to its /calc-<slug>/ page.
 * Embed:  <calc-home></calc-home>  +  <script src=".../calc-home.js"></script>
 */
(function () {
  if (customElements.get("calc-home")) return;
  var ICONS = "https://cdn.jsdelivr.net/gh/sbrka/predictepilepsy-riskcalc@0f90a5df2c3364cd56c1e218dc5d05acc21b60ae/icons/";

  var GROUPS = [
    { key: "poststroke", name: "Post-stroke seizure — will it recur?", icon: "ischaemic.png", dot: "#0071e3", scores: [
      { ab: "SeLECT-RS", fs: 12, slug: "calc-post-stroke-recurrence", name: "Recurrence by Timing (SeLECT-RS)", desc: "Risk of a further seizure by WHEN the first post-stroke seizure occurred, across stroke types — revisiting the 7-day cutoff" } ] },
    { key: "ischaemic", name: "Ischaemic stroke", icon: "ischaemic.png", dot: "#3f7fd0", scores: [
      { ab: "SeLECT", fs: 18, ext: "https://predictapps.github.io/select/", name: "SeLECT Score", desc: "Late seizures after ischaemic stroke" },
      { ab: "IsCHEMiA", fs: 15, slug: "calc-ischemia", name: "IsCHEMiA Score", desc: "Late seizures after ischaemic stroke" } ] },
    { key: "ich", name: "Intracerebral haemorrhage", icon: "ich.png", dot: "#e0413a", scores: [
      { ab: "CAVE", fs: 25, slug: "calc-cave-score", name: "CAVE Score", desc: "Late seizures after ICH" },
      { ab: "CAVE&sup2;", fs: 22, slug: "calc-cave2-score", name: "CAVE² Score", desc: "Modified CAVE for late seizures after ICH" },
      { ab: "LANE", fs: 25, slug: "calc-lane-score", name: "LANE Score", desc: "Late seizures after ICH" },
      { ab: "LEAN", fs: 26, slug: "calc-lean", name: "LEAN Score", desc: "Late seizures after ICH" } ] },
    { key: "sah", name: "Subarachnoid haemorrhage", icon: "sah.png", dot: "#c0322b", scores: [
      { ab: "RISE", fs: 26, slug: "calc-rise", name: "RISE Score", desc: "Epilepsy after aneurysmal SAH" } ] },
    { key: "cvt", name: "Cerebral venous thrombosis", icon: "cvt.png", dot: "#5b6fb0", scores: [
      { ab: "DIAS<span style='font-size:.62em'>3</span>", fs: 23, slug: "calc-dias3", name: "DIAS3", desc: "Remote seizure risk after CVT" } ] },
    { key: "tbi", name: "Traumatic brain injury", icon: "tbi.png", dot: "#f5a623", scores: [
      { ab: "PTE<sup>1</sup>", fs: 22, slug: "calc-pte-nomogram-1", name: "PTE Nomogram 1", desc: "Post-traumatic epilepsy nomogram" },
      { ab: "PTE<sup>2</sup>", fs: 22, slug: "calc-pte-nomogram-2", name: "PTE Nomogram 2", desc: "Post-traumatic epilepsy nomogram" },
      { ab: "PTE<sup>3</sup>", fs: 22, slug: "calc-pte-nomogram-3", name: "PTE Nomogram 3", desc: "Late seizures after TBI" } ] },
    { key: "tumour", name: "Brain tumour", icon: "tumour.png", dot: "#8a54c9", scores: [
      { ab: "BMERS", fs: 18, slug: "calc-bmers", name: "Brain-Mets Score", desc: "Epilepsy in brain metastases" },
      { ab: "STAMPE&sup2;", fs: 15, slug: "calc-stampe2", name: "STAMPE2 Score", desc: "Epilepsy after meningioma resection" },
      { ab: "Glioma", fs: 17, slug: "calc-glioma-epilepsy", name: "Glioma-Related Epilepsy", desc: "Epilepsy in high-grade glioma" },
      { ab: "PGREM", fs: 18, slug: "calc-pgrem", name: "PGREM", desc: "Post-operative glioma-related epilepsy" } ] },
    { key: "acute", name: "Acute symptomatic seizure", icon: "acute-symptomatic.png", dot: "#e0691f", scores: [
      { ab: "Epi-PASS", fs: 15, slug: "calc-epi-pass", name: "Epi-PASS", desc: "Epilepsy after an acute symptomatic seizure" } ] },
  ];

  // per-brand palette (default predictepilepsy azure; "select" = SeLECT lime-green)
  var PALETTES = {
    default: ":host{--az:#135ba8;--azd:#0e4a8a;--wash:#eef6fe;--badge:linear-gradient(150deg,#2472c8,#0e4a8a);--bsh:rgba(14,74,138,.3);--ghln:#eaf1f8;--hovsh:rgba(19,91,168,.12)}",
    select:  ":host{--az:#6f8c00;--azd:#1c244b;--wash:#f6f8e9;--badge:linear-gradient(150deg,#accc0c,#7f9600);--bsh:rgba(110,140,0,.32);--ghln:#e8efce;--hovsh:rgba(140,170,0,.2)}"
  };

  var RESOURCES = [
    { name: "seizureprognosis.info", url: "https://seizureprognosis.info", desc: "Cumulative seizure-risk and COSY curves from published prognostic studies, by clinical scenario.", ic: "\u{1F4C8}" },
    { name: "epilepsypredictiontools.info", url: "https://epilepsypredictiontools.info", desc: "Nomograms for epilepsy onset, AED withdrawal, surgery outcome and JME.", ic: "\u{1F9EE}" },
    { name: "predictepilepsy.github.io", url: "https://predictepilepsy.github.io", desc: "WAMS — individualised risk of ASM withdrawal after epilepsy surgery.", ic: "\u{1F489}" },
    { name: "wesleykerr.shinyapps.io", url: "https://wesleykerr.shinyapps.io/Combined/", desc: "Combined score for the likelihood of dissociative (functional / PNES) vs epileptic seizures.", ic: "\u{1F52C}" },
    { name: "More information", url: "https://predictepilepsy.com/information/", desc: "Model background, variables and the COSY concept.", ic: "\u{2139}\u{FE0F}" },
  ];
  var CURVE = '<svg class="crv" viewBox="0 0 96 34" preserveAspectRatio="none"><path d="M0 30 C22 30 30 16 48 12 66 8 74 4 96 3 V34 H0 Z" fill="#fff" opacity=".14"/><path d="M0 30 C22 30 30 16 48 12 66 8 74 4 96 3" fill="none" stroke="#fff" stroke-width="2"/></svg>';

  var CSS = "\
  :host{--ink:#16222f;--muted:#5c6b7a;display:block;\
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:var(--ink)}\
  *{box-sizing:border-box} .wrap{max-width:1120px;margin:0 auto;padding:0 20px 56px}\
  .banner{background:var(--az);color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-radius:0 0 18px 18px}\
  .bt{font-weight:750;font-size:20px;letter-spacing:.2px}.bt .d{opacity:.72;font-weight:400}\
  .banner a{color:#fff;text-decoration:none;font-size:14px;background:rgba(255,255,255,.16);padding:8px 15px;border-radius:999px}\
  .banner a:hover{background:rgba(255,255,255,.28)}\
  .hero{text-align:center;margin:34px 0 6px}.hero h1{font-size:33px;margin:0 0 8px;letter-spacing:-.4px}\
  .hero p{color:var(--muted);font-size:17px;margin:0}\
  .feat{display:flex;align-items:center;gap:18px;background:linear-gradient(140deg,#1b66bd,#0e4a8a);color:#fff;border-radius:22px;padding:20px 24px;margin:26px 0 8px;box-shadow:0 12px 34px rgba(14,74,138,.28)}\
  .feat .fi{font-size:34px;flex:0 0 auto}.feat .ft{flex:1}.feat .ft b{font-size:20px}.feat .ft span{display:block;opacity:.85;font-size:14px;margin-top:3px}\
  .feat a{background:#fff;color:var(--azd);font-weight:700;font-size:14.5px;padding:11px 20px;border-radius:999px;text-decoration:none;white-space:nowrap}\
  .grp{margin:34px 0 0}\
  .gh{display:flex;align-items:center;gap:16px;margin:0 0 16px;padding-bottom:12px;border-bottom:2px solid var(--ghln)}\
  .gh img{width:64px;height:52px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(19,60,110,.16))}\
  .gh h2{font-size:22px;margin:0;color:var(--azd);letter-spacing:-.2px}\
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}\
  .card{display:flex;align-items:center;gap:16px;border:1.5px solid #e6edf4;background:#fff;border-radius:18px;padding:16px 18px;text-decoration:none;color:inherit;transition:.16s}\
  .card:hover{border-color:var(--az);box-shadow:0 10px 26px var(--hovsh);transform:translateY(-2px)}\
  .badge{width:62px;height:62px;flex:0 0 auto;border-radius:16px;background:var(--badge);\
    box-shadow:0 6px 16px var(--bsh);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff}\
  .badge .ab{font-weight:800;line-height:1;text-align:center;z-index:1;padding:0 3px}\
  .badge .ab sup{font-size:.55em;vertical-align:super}\
  .badge .crv{position:absolute;left:0;right:0;bottom:0;height:22px}\
  .badge .dt{position:absolute;top:7px;right:7px;width:8px;height:8px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.4)}\
  .card .txt{min-width:0}\
  .card .nm,.card .ds,.card .go{display:block}\
  .card .nm{font-weight:750;font-size:17px;color:var(--ink)}\
  .card .ds{font-size:13px;color:var(--muted);margin-top:3px;line-height:1.4}\
  .card .go{font-size:12.5px;font-weight:650;color:var(--az);margin-top:8px}\
  .gh2 .rih{font-size:26px}\
  .rcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}\
  .rcard{display:flex;align-items:center;gap:13px;border:1.5px solid #e6edf4;border-radius:16px;padding:14px 16px;text-decoration:none;color:inherit;background:#fbfdff;transition:.16s}\
  .rcard:hover{border-color:var(--az);box-shadow:0 8px 20px var(--hovsh);transform:translateY(-1px)}\
  .rcard .ric{font-size:24px;flex:0 0 auto}\
  .rcard .rtx{min-width:0}.rcard .rn,.rcard .rd{display:block}\
  .rcard .rn{font-weight:700;font-size:15.5px}.rcard .rd{font-size:12.5px;color:var(--muted);margin-top:2px;line-height:1.4}\
  .rcard .rar{margin-left:auto;color:var(--az);font-weight:700;font-size:16px}\
  .more{text-align:center;margin-top:36px}\
  .more a{color:var(--az);font-weight:650;text-decoration:none;font-size:15px}\
  .more a:hover{text-decoration:underline}\
  .grp:first-child{margin-top:8px}\
  @media(max-width:560px){.hero h1{font-size:26px}.gh img{width:52px;height:44px}}\
  ";

  function esc(s){return String(s).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}

  var THEME = "\
  /* modern azure buttons (task 3) */\
  .elementor-button{background:linear-gradient(150deg,#2472c8,#0e4a8a)!important;color:#fff!important;border:0!important;\
    border-radius:999px!important;padding:12px 26px!important;font-weight:650!important;letter-spacing:.2px;\
    box-shadow:0 6px 16px rgba(14,74,138,.24)!important;transition:transform .16s,box-shadow .16s!important}\
  .elementor-button:hover{transform:translateY(-2px)!important;box-shadow:0 11px 24px rgba(14,74,138,.32)!important;color:#fff!important}\
  .elementor-button .elementor-button-text{color:#fff!important}\
  /* kill the odd white card behind adapted buttons in the info box */\
  .elementor-widget-button .elementor-widget-container,.elementor-widget-button .elementor-button-wrapper{background:transparent!important;box-shadow:none!important;border:0!important}\
  /* disclaimer as a soft card (task 2) */\
  .elementor-element-578dbb8{background:#f3f8fd!important;border:1px solid #d9e7f6!important;border-radius:20px!important;\
    max-width:1120px;margin:34px auto 40px!important;padding:24px 28px!important;box-shadow:0 6px 20px rgba(19,91,168,.06)!important}\
  .elementor-element-578dbb8 .elementor-heading-title{color:#0e4a8a!important;font-size:20px!important;font-weight:750!important;margin-bottom:8px!important}\
  .elementor-element-578dbb8 .elementor-icon-list-text,.elementor-element-578dbb8 p,.elementor-element-578dbb8 li{color:#5c6b7a!important;font-size:13px!important;line-height:1.6!important}\
  .elementor-element-578dbb8 .elementor-icon-list-icon svg,.elementor-element-578dbb8 .elementor-icon-list-icon i{color:#9db6d4!important}\
  /* intro + news polish (task 5) — content unchanged */\
  .elementor-element-259b348 .elementor-heading-title{color:#0e4a8a!important;letter-spacing:-.2px}\
  .elementor-element-e8254ca .elementor-heading-title{font-size:26px!important;font-weight:800!important}\
  .elementor-element-adca1b8{background:#f7fbff;border:1px solid #e6eff8;border-radius:22px;padding:26px 28px!important;box-shadow:0 8px 26px rgba(19,91,168,.06)}\
  .elementor-element-adca1b8 .elementor-widget-text-editor{color:#3c4a5a;font-size:16px;line-height:1.6}\
  ";
  function injectTheme() {
    if (document.getElementById("pep-theme")) return;
    var st = document.createElement("style"); st.id = "pep-theme"; st.textContent = THEME;
    document.head.appendChild(st);
  }

  class CalcHome extends HTMLElement {
    connectedCallback() {
      var brand = (this.getAttribute("brand") || "default").toLowerCase();
      var base = (this.getAttribute("base") || "").replace(/\/+$/, "");
      var only = this.getAttribute("groups");
      var pick = only ? only.split(",").map(function (s) { return s.trim(); }) : null;
      var palette = PALETTES[brand] || PALETTES.default;
      // only style the host page's Elementor chrome on the native predictepilepsy home
      if (brand === "default" && !this.hasAttribute("no-theme")) injectTheme();
      // optionally hide the theme's duplicate page title (banner already carries a heading)
      if (this.hasAttribute("hide-page-title") && !document.getElementById("ch-hidetitle")) {
        var ht = document.createElement("style"); ht.id = "ch-hidetitle";
        ht.textContent = ".entry-title,.page-title,.page-header .entry-title{display:none!important}";
        document.head.appendChild(ht);
      }
      var sr = this.attachShadow({ mode: "open" });
      // optionally drop individual scores by abbreviation or slug (comma-separated)
      var excl = (this.getAttribute("exclude-scores") || "").toLowerCase().split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      var list = (pick ? GROUPS.filter(function (g) { return pick.indexOf(g.key) > -1; }) : GROUPS).map(function (g) {
        if (!excl.length) return g;
        var kept = g.scores.filter(function (s) {
          var ab = (s.ab || "").replace(/<[^>]+>/g, "").toLowerCase();
          return excl.indexOf(ab) === -1 && excl.indexOf((s.slug || "").toLowerCase()) === -1;
        });
        var ng = {}; for (var k in g) ng[k] = g[k]; ng.scores = kept; return ng;
      }).filter(function (g) { return g.scores.length > 0; });
      var groups = list.map(function (g) {
        var cards = g.scores.map(function (s) {
          var href = s.ext ? s.ext : base + "/" + s.slug + "/";
          var tgt = s.ext ? ' target="_blank" rel="noopener"' : "";
          return '<a class="card" href="' + href + '"' + tgt + '>' +
            '<span class="badge"><span class="dt" style="background:' + g.dot + '"></span>' +
            '<span class="ab" style="font-size:' + s.fs + 'px">' + s.ab + '</span>' + CURVE + '</span>' +
            '<span class="txt"><span class="nm">' + esc(s.name) + '</span><span class="ds">' + esc(s.desc) + '</span>' +
            '<span class="go">' + (s.ext ? "Open tool &rarr;" : "Open calculator &rarr;") + '</span></span></a>';
        }).join("");
        return '<section class="grp"><div class="gh"><img src="' + ICONS + g.icon + '" alt="" loading="lazy">' +
          '<h2>' + esc(g.name) + '</h2></div><div class="cards">' + cards + '</div></section>';
      }).join("");

      var resCards = RESOURCES.map(function (r) {
        var ext = /^https?:/.test(r.url);
        var href = ext ? r.url : base + r.url;
        return '<a class="rcard" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + '>' +
          '<span class="ric">' + r.ic + '</span><span class="rtx"><span class="rn">' + esc(r.name) + '</span>' +
          '<span class="rd">' + esc(r.desc) + '</span></span><span class="rar">' + (ext ? "↗" : "→") + '</span></a>';
      }).join("");
      var resources = '<section class="grp"><div class="gh gh2"><span class="rih">\u{1F517}</span>' +
        '<h2>Related tools &amp; resources</h2></div><div class="rcards">' + resCards + '</div></section>';

      sr.innerHTML = "<style>" + CSS + palette + "</style>" +
        '<div class="wrap">' + groups + resources +
        '<div class="more"><a href="' + base + '/variables-and-cosy/">Browse all models &amp; the calculator finder &rarr;</a></div></div>';
    }
  }
  customElements.define("calc-home", CalcHome);
})();
