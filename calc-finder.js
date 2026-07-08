/* calc-finder — predictepilepsy.com calculator finder web component.
 * Dependency-free custom element. Two ways to reach the right calculator:
 *   (a) Guided — step-by-step buttons (situation -> setting -> calculator)
 *   (b) Browse  — by clinical group
 * Selecting a calculator navigates to its /calc-<slug>/ page.
 * Embed:  <calc-finder></calc-finder>  +  <script src=".../calc-finder.js"></script>
 */
(function () {
  if (customElements.get("calc-finder")) return;

  // ---- groups & clinical settings -------------------------------------------
  const GROUPS = [
    { id: "g1", title: "After an acute brain injury", icon: "🧠",
      sub: "Risk of epilepsy or late seizures after stroke, haemorrhage, trauma, tumour, infection or encephalitis." },
    { id: "g2", title: "After a first or unprovoked seizure", icon: "⚡",
      sub: "Risk of seizure recurrence and driving eligibility after one or two unprovoked seizures." },
    { id: "g3", title: "Stopping antiseizure medication", icon: "💊",
      sub: "Risk of seizure relapse when withdrawing antiseizure medication — including after successful epilepsy surgery." },
    { id: "g4", title: "Epilepsy surgery", icon: "🩺",
      sub: "Presurgical evaluation and prediction of seizure, cognitive and mood outcomes after epilepsy surgery." },
    { id: "g5", title: "SUDEP risk", icon: "❤️",
      sub: "Individual risk of sudden unexpected death in epilepsy (SUDEP)." },
  ];
  const SETTINGS = {
    stroke_isch: "Ischaemic stroke", ich: "Intracerebral haemorrhage", sah: "Subarachnoid haemorrhage",
    cvt: "Cerebral venous thrombosis", tbi: "Traumatic brain injury", tumour: "Brain tumour",
    infection: "CNS infection", autoimmune: "Autoimmune encephalitis", febrile: "Febrile status epilepticus",
    acute_sympt: "Acute symptomatic seizure", first_seizure: "First unprovoked seizure",
    two_seizures: "After two unprovoked seizures", withdrawal: "Withdrawing antiseizure medication",
    remission: "After a period of remission", drug_resistance: "Predicting drug resistance",
    seeg: "SEEG / will it localise the focus?", surg_outcome: "Seizure freedom after surgery", surg_neuropsych: "Cognitive / mood outcome", sudep: "SUDEP risk",
  };
  // ---- catalogue:  [slug, name, description, group, setting] -----------------
  const CALCS = [
    ["select-score", "SeLECT Score", "The flagship SeLECT score — risk of late (unprovoked) seizures after ischaemic stroke.", "g1", "stroke_isch", { ext: "https://predictapps.github.io/select/" }],
    ["calc-ischemia", "IsCHEMiA Score", "Imaging-based risk of late seizures after ischaemic stroke.", "g1", "stroke_isch"],
    ["calc-select-asys-rsys", "SeLECT (ASyS vs RSyS)", "Acute- vs remote-symptomatic seizure risk after ischaemic stroke.", "g1", "stroke_isch"],
    ["calc-cave-score", "CAVE Score", "Late seizures after intracerebral haemorrhage (ICH).", "g1", "ich"],
    ["calc-cave2-score", "CAVE² Score", "Modified CAVE score for late seizures after ICH.", "g1", "ich"],
    ["calc-lane-score", "LANE Score", "Clinical score for late seizures after ICH.", "g1", "ich"],
    ["calc-lean", "LEAN Score", "Clinical score for late seizures after intracerebral haemorrhage (ICH).", "g1", "ich"],
    ["calc-rise", "RISE Score", "Epilepsy after aneurysmal subarachnoid haemorrhage.", "g1", "sah"],
    ["calc-dias3", "DIAS3", "Remote seizure / epilepsy risk after cerebral venous thrombosis.", "g1", "cvt"],
    ["calc-early-seizure-cvt", "Early Seizures after CVT", "Early seizure risk after cerebral venous thrombosis.", "g1", "cvt"],
    ["calc-pte-nomogram-1", "PTE Nomogram (1)", "Post-traumatic epilepsy nomogram after TBI.", "g1", "tbi"],
    ["calc-pte-nomogram-2", "PTE Nomogram (2)", "Post-traumatic epilepsy nomogram after cerebral contusion.", "g1", "tbi"],
    ["calc-pte-nomogram-3", "PTE Nomogram (3)", "Prognostic model for late seizures after TBI.", "g1", "tbi"],
    ["calc-epilepsy-first-pts", "First Post-traumatic Seizure", "Epilepsy risk after a first post-traumatic seizure.", "g1", "tbi"],
    ["calc-bmers", "BMERS", "Epilepsy risk in patients with brain metastases.", "g1", "tumour"],
    ["calc-stampe2", "STAMPE² Score", "Epilepsy outcome after meningioma resection.", "g1", "tumour"],
    ["calc-glioma-epilepsy", "Glioma-Related Epilepsy", "Epilepsy in diffuse high-grade glioma.", "g1", "tumour"],
    ["calc-ncc-seizure-recurrence", "Neurocysticercosis", "Seizure recurrence in solitary calcified neurocysticercosis.", "g1", "infection"],
    ["calc-autoimmune-enceph-recurrence", "Autoimmune Encephalitis", "Seizure recurrence in NMDAR / LGI1 / CASPR2 encephalitis.", "g1", "autoimmune"],
    ["calc-hs-tle-fse", "HS / TLE after Febrile Status", "Hippocampal sclerosis & temporal-lobe epilepsy after febrile status epilepticus.", "g1", "febrile"],
    ["calc-epi-pass", "EPI-PASS", "Epilepsy after an acute symptomatic seizure.", "g1", "acute_sympt"],

    ["calc-first-seizure-driving", "First Seizure & Driving", "Recurrence risk (COSY) after a first-ever seizure by aetiology, and when driving thresholds are met.", "g2", "first_seizure"],
    ["calc-first-seizure-recurrence", "First Unprovoked Seizure — Recurrence", "Recurrence after a first unprovoked seizure by risk factor (EEG, MRI, nocturnal, prior insult).", "g2", "first_seizure"],
    ["calc-mess-part1", "MESS (Part 1)", "Recurrence risk after a first seizure — combination table.", "g2", "first_seizure"],
    ["calc-mess-part2", "MESS (Part 2)", "Prognostic index for recurrence after a single seizure / early epilepsy.", "g2", "first_seizure"],
    ["calc-first-tcs-adults", "First Tonic-Clonic Seizure", "Recurrence after a first tonic-clonic seizure in adults.", "g2", "first_seizure"],
    ["calc-egtca", "EGTCA", "Epilepsy with generalized tonic-clonic seizures alone.", "g2", "first_seizure"],
    ["calc-return-driving-first-seizure", "Return to Driving", "When is it safe to drive after a first-ever seizure?", "g2", "first_seizure"],
    ["calc-epilepsy-first-seizure-dementia", "First Seizure in Dementia", "Epilepsy risk after a first unprovoked seizure in dementia.", "g2", "first_seizure"],
    ["calc-hauser-cosy", "After Two Unprovoked Seizures", "Recurrence risk after two unprovoked seizures (Hauser).", "g2", "two_seizures"],
    ["calc-sanad-bt", "SANAD Breakthrough", "Breakthrough seizure, recurrence & re-remission after a 12-month remission on treatment (SANAD).", "g2", "remission"],
    ["calc-jme-drug-resistance", "JME Drug-Resistance", "Risk of drug-resistant epilepsy in juvenile myoclonic epilepsy (Stevelink).", "g2", "drug_resistance"],

    // g3 — withdrawing antiseizure medication (relapse risk when stopping ASMs)
    ["calc-lamberink", "ASM Withdrawal — Individualised (Lamberink)", "Individualised 2- & 5-year recurrence risk and 10-year seizure-freedom chance after ASM withdrawal (Lamberink nomograms).", "g3", "withdrawal"],
    ["calc-relapse-asm-withdrawal-focal", "ASM Withdrawal — Focal Epilepsy", "Relapse after ASM withdrawal in adult focal epilepsy.", "g3", "withdrawal"],
    ["calc-drug-withdrawal", "WAMS (after surgery)", "ASM withdrawal after epilepsy surgery — cumulative & COSY curves.", "g3", "withdrawal"],

    // g4 — epilepsy surgery: planning (SEEG) + seizure outcome + cognitive/mood outcome
    ["calc-5-sense", "5-SENSE (SEEG focality)", "Chance that stereo-EEG will find a focal seizure-onset zone, from 5 non-invasive findings.", "g4", "seeg"],
    ["calc-jehi-nomogram", "Jehi Nomogram (seizure freedom)", "Chance of complete seizure freedom at 2 and 5 years after resective epilepsy surgery, from six presurgical characteristics.", "g4", "surg_outcome"],
    ["calc-slah-score", "SLAH Seizure-Freedom Score", "Chance of seizure freedom after laser ablation (SLAH) for mesial temporal lobe epilepsy.", "g4", "surg_outcome"],
    ["calc-fle-surgery-prognostic", "Frontal Lobe Surgery — Prognostic", "Prognostic factors after frontal-lobe epilepsy surgery.", "g4", "surg_outcome"],
    ["calc-fle-surgery-outcome", "Frontal Lobe Surgery — Outcome", "Seizure outcome after frontal-lobe epilepsy surgery.", "g4", "surg_outcome"],
    ["calc-fle-surgery-longterm", "Frontal Lobe Surgery — Long-term", "Long-term seizure & psychosocial outcomes after frontal-lobe surgery.", "g4", "surg_outcome"],
    ["calc-frontal-lgg-seizure", "Frontal Low-Grade Tumour", "Seizure outcome after resection of frontal low-grade tumours.", "g4", "surg_outcome"],
    ["calc-pgrem", "PGREM", "Post-operative glioma-related epilepsy risk.", "g4", "surg_outcome"],
    ["calc-naming-decline", "Naming Decline (TLE surgery)", "Risk of naming decline after temporal-lobe epilepsy surgery (Busch nomogram).", "g4", "surg_neuropsych"],
    ["calc-memory-decline", "Verbal Memory Decline (TLR)", "Risk of verbal memory (RAVLT) decline after temporal lobe resection (Busch nomogram).", "g4", "surg_neuropsych"],
    ["calc-mood-decline", "Mood Decline (TLE surgery)", "Risk of clinically significant mood (depression) decline after temporal-lobe epilepsy surgery (Doherty nomogram).", "g4", "surg_neuropsych"],

    // g5 — SUDEP risk
    ["calc-sudep3", "SUDEP-3 Inventory", "Three-item inventory stratifying the risk of sudden unexpected death in epilepsy (SUDEP).", "g5", "sudep"],
    ["calc-jha-sudep", "SUDEP Personalised Risk (Jha)", "Individualised relative risk of sudden unexpected death in epilepsy (SUDEP) from 22 clinical factors.", "g5", "sudep"],
    ["calc-sudep-risk-markers", "SUDEP Risk Markers (Ochoa)", "Reference for individual SUDEP risk markers (living alone, frequent tonic–clonic seizures, peri-ictal apnoea) and their 5-year SUDEP risk — markers only, not a combined score.", "g5", "sudep"],
  ];
  const bySlug = Object.fromEntries(CALCS.map((c) => [c[0], c]));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // per-group accent dot on the score badge (matches the old calc-home look)
  const GROUP_DOT = { g1: "#3f7fd0", g2: "#e0691f", g3: "#7a5ea8", g4: "#0f7a54", g5: "#c0322b" };
  const BADGE_CURVE = '<svg class="ccrv" viewBox="0 0 96 34" preserveAspectRatio="none"><path d="M0 30 C22 30 30 16 48 12 66 8 74 4 96 3 V34 H0 Z" fill="#fff" opacity=".14"/><path d="M0 30 C22 30 30 16 48 12 66 8 74 4 96 3" fill="none" stroke="#fff" stroke-width="2"/></svg>';
  const abbrev = (name) => String(name).split(/[\s(]/)[0].replace(/[:,]$/, "").slice(0, 9);

  const CSS = `
    :host{--azure:#135ba8;--azure-deep:#0e4a8a;--azure-wash:#eef6fe;--azure-line:#cfe4fb;--ink:#16222f;--muted:#5c6b7a;
      display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);line-height:1.5}
    *{box-sizing:border-box}
    .wrap{max-width:1080px;margin:0 auto;padding:0 18px 48px}
    .banner{background:var(--azure);color:#fff;padding:14px 22px;border-radius:0 0 16px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .btitle{font-weight:750;font-size:19px;letter-spacing:.2px}.btitle .dot{opacity:.72;font-weight:400}
    .banner a{color:#fff;text-decoration:none;font-size:14px;background:rgba(255,255,255,.16);padding:7px 14px;border-radius:999px}
    .banner a:hover{background:rgba(255,255,255,.28)}
    .head{text-align:center;margin:30px 0 14px}
    .head h1{font-size:30px;margin:0 0 8px;letter-spacing:-.3px}
    .head p{color:var(--muted);margin:0;font-size:16px}
    .tabs{display:flex;gap:6px;justify-content:center;margin:22px auto 26px;background:#eef2f6;padding:5px;border-radius:999px;width:max-content;max-width:100%}
    .tabs button{border:0;background:transparent;padding:10px 22px;border-radius:999px;font-size:15px;font-weight:600;color:var(--muted);cursor:pointer}
    .tabs button.on{background:#fff;color:var(--azure-deep);box-shadow:0 1px 3px rgba(14,28,43,.14)}
    .crumbs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 18px;font-size:14px;color:var(--muted);min-height:24px}
    .crumbs .c{background:var(--azure-wash);color:var(--azure-deep);border:1px solid var(--azure-line);padding:4px 12px;border-radius:999px;font-weight:600}
    .crumbs .sep{opacity:.5}
    .crumbs .reset{margin-left:auto;color:var(--azure);cursor:pointer;text-decoration:underline;background:none;border:0;font-size:14px}
    .navrow{display:flex;gap:10px;align-items:center;margin:0 0 14px}
    .navbtn{border:1.5px solid var(--azure-line);background:#fff;color:var(--azure-deep);font-weight:650;font-size:14.5px;padding:10px 20px;border-radius:999px;cursor:pointer;transition:.15s}
    .navbtn:hover{background:var(--azure-wash)}
    .navbtn.reset{color:var(--muted);border-color:#e3e9ef;margin-left:auto}
    .navbtn.reset:hover{background:#f6f8fa;color:var(--ink)}
    .chiprow{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}
    .chip.norec{background:#fbeaea;color:#b02020}
    .chip.ext{background:#eef6fe;color:var(--azure-deep)}
    .card.norec{opacity:.6}.card.norec:hover{opacity:1}
    .step h2{font-size:20px;margin:0 0 16px;text-align:center}
    .opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
    .opts.large{display:flex;flex-wrap:wrap;justify-content:center;gap:22px;max-width:1160px;margin:0 auto}
    .opts.large .opt{flex:0 1 330px;max-width:360px;background:#fff;padding:32px 30px;border-radius:22px;gap:22px;border-width:2px;box-shadow:0 6px 20px rgba(19,91,168,.08)}
    .opts.large .opt:hover{box-shadow:0 14px 34px rgba(19,91,168,.18);transform:translateY(-3px)}
    .opts.large .opt .ic{font-size:48px}
    .opts.large .opt .ot{font-size:21px;margin-bottom:8px}
    .opts.large .opt .os{font-size:14.5px}
    .opt{text-align:left;border:1.5px solid #e3e9ef;background:#fff;border-radius:14px;padding:18px 18px;cursor:pointer;transition:.15s;display:flex;gap:14px;align-items:flex-start}
    .opt:hover{border-color:var(--azure);box-shadow:0 6px 18px rgba(19,91,168,.10);transform:translateY(-1px)}
    .opt .ic{font-size:26px;line-height:1}
    .opt .ot{display:block;font-weight:700;font-size:16px;margin-bottom:4px}
    .opt .os{display:block;color:var(--muted);font-size:13.5px}
    .setbtns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
    .setbtn{border:1.5px solid var(--azure-line);background:var(--azure-wash);color:var(--azure-deep);font-weight:650;font-size:15px;padding:11px 20px;border-radius:999px;cursor:pointer;transition:.15s}
    .setbtn:hover{background:var(--azure);color:#fff;border-color:var(--azure)}
    .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
    .card{border:1.5px solid #e3e9ef;background:#fff;border-radius:16px;padding:16px 16px 15px;cursor:pointer;transition:.15s;display:flex;align-items:flex-start;gap:15px;text-decoration:none;color:inherit}
    .card:hover{border-color:var(--azure);box-shadow:0 8px 22px rgba(19,91,168,.13);transform:translateY(-2px)}
    .cbadge{width:60px;height:60px;flex:0 0 auto;border-radius:16px;background:linear-gradient(150deg,#2472c8,#0e4a8a);box-shadow:0 6px 16px rgba(14,74,138,.28);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff}
    .cbadge .cab{font-weight:800;line-height:1;text-align:center;z-index:1;padding:0 3px;letter-spacing:-.3px}
    .cbadge .cdt{position:absolute;top:7px;right:7px;width:8px;height:8px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.45)}
    .cbadge .ccrv{position:absolute;left:0;right:0;bottom:0;height:22px}
    .ctxt{display:flex;flex-direction:column;min-width:0;flex:1}
    .card .cn{font-weight:700;font-size:16px;color:var(--azure-deep);margin-bottom:4px}
    .card .cd{color:var(--muted);font-size:13.5px;flex:1}
    .card .go{margin-top:10px;font-size:13px;font-weight:650;color:var(--azure)}
    .card .chip{font-size:11px;font-weight:600;color:var(--muted);background:#f1f5f9;border-radius:999px;padding:2px 9px}
    .grp{margin:0 0 30px}
    .grp .gh{display:flex;align-items:center;gap:12px;margin:0 0 6px}
    .grp .gh .gi{font-size:24px}.grp .gh h2{font-size:21px;margin:0}
    .grp .gsub{color:var(--muted);font-size:14.5px;margin:0 0 16px}
    .none{color:var(--muted);text-align:center;padding:20px}
    @media(max-width:560px){.head h1{font-size:24px}.banner{border-radius:0}}
  `;

  class CalcFinder extends HTMLElement {
    connectedCallback() {
      this._only = this.getAttribute("only") || null;        // "guided" | "browse" -> lock to one tab, hide switcher
      this._tab = this._only || this.getAttribute("default-tab") || "guided";
      this._grp = null; this._set = null;
      this.attachShadow({ mode: "open" });
      this.render();
    }
    go(slug) { window.location.href = "/" + slug + "/"; }
    card(c) {
      const o = c[5] || {};                       // optional flags: {ext:url, rec:false, ab, badge}
      const ext = o.ext, norec = o.rec === false;
      const href = ext || ("/" + c[0] + "/");
      const ab = o.ab || abbrev(c[1]);
      const fs = ab.length <= 4 ? 21 : ab.length <= 6 ? 15 : ab.length <= 7 ? 13 : 11;
      const dot = GROUP_DOT[c[3]] || "#135ba8";
      const flags =
        (norec ? `<span class="chip norec" title="${esc(o.badge || "Weak evidence — use only if nothing better is available")}">not recommended</span>` : "") +
        (ext ? `<span class="chip ext">external tool ↗</span>` : "");
      return `<a class="card${norec ? " norec" : ""}" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""} data-slug="${c[0]}">` +
        `<span class="cbadge"><span class="cdt" style="background:${dot}"></span><span class="cab" style="font-size:${fs}px">${esc(ab)}</span>${BADGE_CURVE}</span>` +
        `<span class="ctxt">${flags ? `<span class="chiprow">${flags}</span>` : ""}<span class="cn">${esc(c[1])}</span><span class="cd">${esc(c[2])}</span><span class="go">${ext ? "Open tool ↗" : "Open calculator &rarr;"}</span></span></a>`;
    }
    back() {
      if (this._set) {
        const sets = [...new Set(CALCS.filter((c) => c[3] === this._grp).map((c) => c[4]))];
        if (sets.length > 1) this._set = null;            // → back to setting choice
        else { this._grp = null; this._set = null; }      // single-setting group → back to groups
      } else if (this._grp) { this._grp = null; }
      this.render();
    }
    guided() {
      let h = "";
      const path = [];
      if (this._grp) path.push(GROUPS.find((g) => g.id === this._grp).title);
      if (this._set) path.push(SETTINGS[this._set]);
      if (path.length) {
        h += `<div class="navrow"><button class="navbtn back" id="back">&lsaquo; Back</button><button class="navbtn reset" id="reset">&#8635; Start over</button></div>`;
      }
      h += `<div class="crumbs">${path.length ? path.map((p) => `<span class="c">${esc(p)}</span>`).join('<span class="sep">›</span>') : '<span style="opacity:.7">Start by choosing the clinical situation</span>'}</div>`;
      if (!this._grp) {
        h += `<div class="step"><h2>What is the clinical situation?</h2><div class="opts${this.hasAttribute("large") ? " large" : ""}">` +
          GROUPS.map((g) => `<button class="opt" data-grp="${g.id}"><span class="ic">${g.icon}</span><span><span class="ot">${esc(g.title)}</span><span class="os">${esc(g.sub)}</span></span></button>`).join("") +
          `</div></div>`;
      } else if (!this._set) {
        const sets = [...new Set(CALCS.filter((c) => c[3] === this._grp).map((c) => c[4]))];
        // if a setting has only its own calcs and there are few, still ask; skip if single setting
        if (sets.length === 1) { this._set = sets[0]; return this.guided(); }
        h += `<div class="step"><h2>Which setting?</h2><div class="setbtns">` +
          sets.map((s) => `<button class="setbtn" data-set="${s}">${esc(SETTINGS[s])}</button>`).join("") +
          `</div></div>`;
      } else {
        const matches = CALCS.filter((c) => c[3] === this._grp && c[4] === this._set);
        h += `<div class="step"><h2>${matches.length} calculator${matches.length === 1 ? "" : "s"} for this situation</h2>` +
          (matches.length ? `<div class="cards">${matches.map((c) => this.card(c)).join("")}</div>` : `<p class="none">No calculator listed for this situation yet.</p>`) +
          `</div>`;
      }
      return h;
    }
    browse() {
      return GROUPS.map((g) => {
        const list = CALCS.filter((c) => c[3] === g.id);
        return `<div class="grp"><div class="gh"><span class="gi">${g.icon}</span><h2>${esc(g.title)}</h2></div>
          <p class="gsub">${esc(g.sub)}</p><div class="cards">${list.map((c) => this.card(c)).join("")}</div></div>`;
      }).join("");
    }
    render() {
      const body = this._tab === "guided" ? this.guided() : this.browse();
      // when placed under a page banner (attr "plain"), skip the component's own strip
      var strip = this.hasAttribute("plain") ? "" :
        `<div class="banner"><span class="btitle">predictepilepsy<span class="dot">.com</span></span><a href="/">All calculators</a></div>`;
      const head = this.hasAttribute("no-head") ? "" :
        `<div class="head"><h1>Find the right calculator</h1><p>Choose a calculator step by step, or browse them by clinical group.</p></div>`;
      const tabs = this._only ? "" :
        `<div class="tabs"><button data-tab="guided"${this._tab === "guided" ? ' class="on"' : ""}>Guided</button><button data-tab="browse"${this._tab === "browse" ? ' class="on"' : ""}>Browse by group</button></div>`;
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
        ${strip}
        <div class="wrap">
          ${head}
          ${tabs}
          <div id="body">${body}</div>
        </div>`;
      const sr = this.shadowRoot;
      sr.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => { this._tab = b.dataset.tab; if (this._tab === "guided") { this._grp = null; this._set = null; } this.render(); });
      sr.querySelectorAll("[data-grp]").forEach((b) => b.onclick = () => { this._grp = b.dataset.grp; this._set = null; this.render(); });
      sr.querySelectorAll("[data-set]").forEach((b) => b.onclick = () => { this._set = b.dataset.set; this.render(); });
      const bk = sr.querySelector("#back"); if (bk) bk.onclick = () => this.back();
      const rs = sr.querySelector("#reset"); if (rs) rs.onclick = () => { this._grp = null; this._set = null; this.render(); };
      // cards are real <a> links; nothing else to wire
    }
  }
  customElements.define("calc-finder", CalcFinder);
})();
