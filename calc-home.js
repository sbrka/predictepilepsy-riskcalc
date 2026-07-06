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
    { name: "Ischaemic stroke", icon: "ischaemic.png", dot: "#3f7fd0", scores: [
      { ab: "IsCHEMiA", fs: 15, slug: "calc-ischemia", name: "IsCHEMiA Score", desc: "Late seizures after ischaemic stroke" },
      { ab: "LEAN", fs: 26, slug: "calc-lean", name: "LEAN Score", desc: "Late seizures after ischaemic stroke" } ] },
    { name: "Intracerebral haemorrhage", icon: "ich.png", dot: "#e0413a", scores: [
      { ab: "CAVE", fs: 25, slug: "calc-cave-score", name: "CAVE Score", desc: "Late seizures after ICH" },
      { ab: "CAVE&sup2;", fs: 22, slug: "calc-cave2-score", name: "CAVE² Score", desc: "Modified CAVE for late seizures after ICH" },
      { ab: "LANE", fs: 25, slug: "calc-lane-score", name: "LANE Score", desc: "Late seizures after ICH" } ] },
    { name: "Subarachnoid haemorrhage", icon: "sah.png", dot: "#c0322b", scores: [
      { ab: "RISE", fs: 26, slug: "calc-rise", name: "RISE Score", desc: "Epilepsy after aneurysmal SAH" } ] },
    { name: "Cerebral venous thrombosis", icon: "cvt.png", dot: "#5b6fb0", scores: [
      { ab: "DIAS<span style='font-size:.62em'>3</span>", fs: 23, slug: "calc-dias3", name: "DIAS3", desc: "Remote seizure risk after CVT" } ] },
    { name: "Traumatic brain injury", icon: "tbi.png", dot: "#f5a623", scores: [
      { ab: "PTE<sup>1</sup>", fs: 22, slug: "calc-pte-nomogram-1", name: "PTE Nomogram 1", desc: "Post-traumatic epilepsy nomogram" },
      { ab: "PTE<sup>2</sup>", fs: 22, slug: "calc-pte-nomogram-2", name: "PTE Nomogram 2", desc: "Post-traumatic epilepsy nomogram" },
      { ab: "PTE<sup>3</sup>", fs: 22, slug: "calc-pte-nomogram-3", name: "PTE Nomogram 3", desc: "Late seizures after TBI" } ] },
    { name: "Brain tumour", icon: "tumour.png", dot: "#8a54c9", scores: [
      { ab: "BMERS", fs: 18, slug: "calc-bmers", name: "Brain-Mets Score", desc: "Epilepsy in brain metastases" },
      { ab: "STAMPE&sup2;", fs: 15, slug: "calc-stampe2", name: "STAMPE2 Score", desc: "Epilepsy after meningioma resection" },
      { ab: "Glioma", fs: 17, slug: "calc-glioma-epilepsy", name: "Glioma-Related Epilepsy", desc: "Epilepsy in high-grade glioma" },
      { ab: "PGREM", fs: 18, slug: "calc-pgrem", name: "PGREM", desc: "Post-operative glioma-related epilepsy" } ] },
    { name: "Acute symptomatic seizure", icon: "acute-symptomatic.png", dot: "#e0691f", scores: [
      { ab: "Epi-PASS", fs: 15, slug: "calc-epi-pass", name: "Epi-PASS", desc: "Epilepsy after an acute symptomatic seizure" } ] },
  ];

  var CURVE = '<svg class="crv" viewBox="0 0 96 34" preserveAspectRatio="none"><path d="M0 30 C22 30 30 16 48 12 66 8 74 4 96 3 V34 H0 Z" fill="#fff" opacity=".14"/><path d="M0 30 C22 30 30 16 48 12 66 8 74 4 96 3" fill="none" stroke="#fff" stroke-width="2"/></svg>';

  var CSS = "\
  :host{--az:#135ba8;--azd:#0e4a8a;--wash:#eef6fe;--ink:#16222f;--muted:#5c6b7a;display:block;\
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
  .gh{display:flex;align-items:center;gap:16px;margin:0 0 16px;padding-bottom:12px;border-bottom:2px solid #eaf1f8}\
  .gh img{width:64px;height:52px;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(19,60,110,.16))}\
  .gh h2{font-size:22px;margin:0;color:var(--azd);letter-spacing:-.2px}\
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}\
  .card{display:flex;align-items:center;gap:16px;border:1.5px solid #e6edf4;background:#fff;border-radius:18px;padding:16px 18px;text-decoration:none;color:inherit;transition:.16s}\
  .card:hover{border-color:var(--az);box-shadow:0 10px 26px rgba(19,91,168,.12);transform:translateY(-2px)}\
  .badge{width:62px;height:62px;flex:0 0 auto;border-radius:16px;background:linear-gradient(150deg,#2472c8,#0e4a8a);\
    box-shadow:0 6px 16px rgba(14,74,138,.3);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff}\
  .badge .ab{font-weight:800;line-height:1;text-align:center;z-index:1;padding:0 3px}\
  .badge .ab sup{font-size:.55em;vertical-align:super}\
  .badge .crv{position:absolute;left:0;right:0;bottom:0;height:22px}\
  .badge .dt{position:absolute;top:7px;right:7px;width:8px;height:8px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.4)}\
  .card .txt{min-width:0}\
  .card .nm,.card .ds,.card .go{display:block}\
  .card .nm{font-weight:750;font-size:17px;color:var(--ink)}\
  .card .ds{font-size:13px;color:var(--muted);margin-top:3px;line-height:1.4}\
  .card .go{font-size:12.5px;font-weight:650;color:var(--az);margin-top:8px}\
  @media(max-width:560px){.banner{border-radius:0}.hero h1{font-size:26px}.gh img{width:52px;height:44px}}\
  ";

  function esc(s){return String(s).replace(/[&<>\"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}

  class CalcHome extends HTMLElement {
    connectedCallback() {
      var sr = this.attachShadow({ mode: "open" });
      var groups = GROUPS.map(function (g) {
        var cards = g.scores.map(function (s) {
          return '<a class="card" href="/' + s.slug + '/">' +
            '<span class="badge"><span class="dt" style="background:' + g.dot + '"></span>' +
            '<span class="ab" style="font-size:' + s.fs + 'px">' + s.ab + '</span>' + CURVE + '</span>' +
            '<span class="txt"><span class="nm">' + esc(s.name) + '</span><span class="ds">' + esc(s.desc) + '</span>' +
            '<span class="go">Open calculator &rarr;</span></span></a>';
        }).join("");
        return '<section class="grp"><div class="gh"><img src="' + ICONS + g.icon + '" alt="" loading="lazy">' +
          '<h2>' + esc(g.name) + '</h2></div><div class="cards">' + cards + '</div></section>';
      }).join("");

      sr.innerHTML = "<style>" + CSS + "</style>" +
        '<div class="banner"><span class="bt">predictepilepsy<span class="d">.com</span></span>' +
        '<a href="/variables-and-cosy/">More models &amp; finder &rarr;</a></div>' +
        '<div class="wrap"><div class="hero"><h1>Epilepsy prognostic calculators</h1>' +
        '<p>Individualised seizure-risk tools, grouped by cause.</p></div>' +
        '<div class="feat"><span class="fi">\u{1F9E0}</span><div class="ft"><b>SeLECT &middot; late seizures after ischaemic stroke</b>' +
        '<span>The flagship SeLECT prognostic tool</span></div><a href="https://predictapps.github.io/select/" target="_blank" rel="noopener">Open SeLECT &rarr;</a></div>' +
        groups + "</div>";
    }
  }
  customElements.define("calc-home", CalcHome);
})();
