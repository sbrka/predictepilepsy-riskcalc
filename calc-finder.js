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
    { id: "g3", title: "After epilepsy surgery or drug withdrawal", icon: "💊",
      sub: "Risk of relapse when withdrawing antiseizure medication or after epilepsy surgery." },
  ];
  const SETTINGS = {
    stroke_isch: "Ischaemic stroke", ich: "Intracerebral haemorrhage", sah: "Subarachnoid haemorrhage",
    cvt: "Cerebral venous thrombosis", tbi: "Traumatic brain injury", tumour: "Brain tumour",
    infection: "CNS infection", autoimmune: "Autoimmune encephalitis", febrile: "Febrile status epilepticus",
    acute_sympt: "Acute symptomatic seizure", first_seizure: "First unprovoked seizure",
    two_seizures: "After two unprovoked seizures", withdrawal: "Stopping antiseizure medication",
    surgery: "After epilepsy surgery",
  };
  // ---- catalogue:  [slug, name, description, group, setting] -----------------
  const CALCS = [
    ["calc-ischemia", "IsCHEMiA Score", "Imaging-based risk of late seizures after ischaemic stroke.", "g1", "stroke_isch"],
    ["calc-select-asys-rsys", "SeLECT (ASyS vs RSyS)", "Acute- vs remote-symptomatic seizure risk after ischaemic stroke.", "g1", "stroke_isch"],
    ["calc-lean", "LEAN Score", "Clinical score for late seizures after ischaemic stroke.", "g1", "stroke_isch"],
    ["calc-cave-score", "CAVE Score", "Late seizures after intracerebral haemorrhage (ICH).", "g1", "ich"],
    ["calc-cave2-score", "CAVE² Score", "Modified CAVE score for late seizures after ICH.", "g1", "ich"],
    ["calc-lane-score", "LANE Score", "Clinical score for late seizures after ICH.", "g1", "ich"],
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

    ["calc-mess-part1", "MESS (Part 1)", "Recurrence risk after a first seizure — combination table.", "g2", "first_seizure"],
    ["calc-mess-part2", "MESS (Part 2)", "Prognostic index for recurrence after a single seizure / early epilepsy.", "g2", "first_seizure"],
    ["calc-first-tcs-adults", "First Tonic-Clonic Seizure", "Recurrence after a first tonic-clonic seizure in adults.", "g2", "first_seizure"],
    ["calc-egtca", "EGTCA", "Epilepsy with generalized tonic-clonic seizures alone.", "g2", "first_seizure"],
    ["calc-return-driving-first-seizure", "Return to Driving", "When is it safe to drive after a first-ever seizure?", "g2", "first_seizure"],
    ["calc-epilepsy-first-seizure-dementia", "First Seizure in Dementia", "Epilepsy risk after a first unprovoked seizure in dementia.", "g2", "first_seizure"],
    ["calc-hauser-cosy", "After Two Unprovoked Seizures", "Recurrence risk after two unprovoked seizures (Hauser).", "g2", "two_seizures"],

    ["calc-asm-withdrawal-cosy", "ASM Withdrawal (+ EEG)", "Seizure recurrence after ASM withdrawal, incl. EEG findings.", "g3", "withdrawal"],
    ["calc-relapse-asm-withdrawal-focal", "ASM Withdrawal — Focal Epilepsy", "Relapse after ASM withdrawal in adult focal epilepsy.", "g3", "withdrawal"],
    ["calc-drug-withdrawal", "WAMS (after surgery)", "ASM withdrawal after epilepsy surgery — cumulative & COSY curves.", "g3", "withdrawal"],
    ["calc-fle-surgery-prognostic", "Frontal Lobe Surgery — Prognostic", "Prognostic factors after frontal-lobe epilepsy surgery.", "g3", "surgery"],
    ["calc-fle-surgery-outcome", "Frontal Lobe Surgery — Outcome", "Seizure outcome after frontal-lobe epilepsy surgery.", "g3", "surgery"],
    ["calc-fle-surgery-longterm", "Frontal Lobe Surgery — Long-term", "Long-term seizure & psychosocial outcomes after frontal-lobe surgery.", "g3", "surgery"],
    ["calc-frontal-lgg-seizure", "Frontal Low-Grade Tumour", "Seizure outcome after resection of frontal low-grade tumours.", "g3", "surgery"],
    ["calc-pgrem", "PGREM", "Post-operative glioma-related epilepsy risk.", "g3", "surgery"],
  ];
  const bySlug = Object.fromEntries(CALCS.map((c) => [c[0], c]));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

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
    .step h2{font-size:20px;margin:0 0 16px;text-align:center}
    .opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
    .opt{text-align:left;border:1.5px solid #e3e9ef;background:#fff;border-radius:14px;padding:18px 18px;cursor:pointer;transition:.15s;display:flex;gap:14px;align-items:flex-start}
    .opt:hover{border-color:var(--azure);box-shadow:0 6px 18px rgba(19,91,168,.10);transform:translateY(-1px)}
    .opt .ic{font-size:26px;line-height:1}
    .opt .ot{display:block;font-weight:700;font-size:16px;margin-bottom:4px}
    .opt .os{display:block;color:var(--muted);font-size:13.5px}
    .setbtns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
    .setbtn{border:1.5px solid var(--azure-line);background:var(--azure-wash);color:var(--azure-deep);font-weight:650;font-size:15px;padding:11px 20px;border-radius:999px;cursor:pointer;transition:.15s}
    .setbtn:hover{background:var(--azure);color:#fff;border-color:var(--azure)}
    .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
    .card{border:1.5px solid #e3e9ef;background:#fff;border-radius:14px;padding:16px 16px 15px;cursor:pointer;transition:.15s;display:flex;flex-direction:column;text-decoration:none;color:inherit}
    .card:hover{border-color:var(--azure);box-shadow:0 6px 18px rgba(19,91,168,.10);transform:translateY(-1px)}
    .card .cn{font-weight:700;font-size:16px;color:var(--azure-deep);margin-bottom:5px}
    .card .cd{color:var(--muted);font-size:13.5px;flex:1}
    .card .go{margin-top:11px;font-size:13px;font-weight:650;color:var(--azure)}
    .card .chip{align-self:flex-start;font-size:11.5px;font-weight:600;color:var(--muted);background:#f1f5f9;border-radius:999px;padding:2px 9px;margin-bottom:9px}
    .grp{margin:0 0 30px}
    .grp .gh{display:flex;align-items:center;gap:12px;margin:0 0 6px}
    .grp .gh .gi{font-size:24px}.grp .gh h2{font-size:21px;margin:0}
    .grp .gsub{color:var(--muted);font-size:14.5px;margin:0 0 16px}
    .none{color:var(--muted);text-align:center;padding:20px}
    @media(max-width:560px){.head h1{font-size:24px}.banner{border-radius:0}}
  `;

  class CalcFinder extends HTMLElement {
    connectedCallback() {
      this._tab = "guided"; this._grp = null; this._set = null;
      this.attachShadow({ mode: "open" });
      this.render();
    }
    go(slug) { window.location.href = "/" + slug + "/"; }
    card(c) {
      return `<a class="card" href="/${c[0]}/" data-slug="${c[0]}"><span class="chip">${esc(SETTINGS[c[4]])}</span>
        <div class="cn">${esc(c[1])}</div><div class="cd">${esc(c[2])}</div><div class="go">Open calculator &rarr;</div></a>`;
    }
    guided() {
      let h = "";
      const path = [];
      if (this._grp) path.push(GROUPS.find((g) => g.id === this._grp).title);
      if (this._set) path.push(SETTINGS[this._set]);
      h += `<div class="crumbs">${path.length ? path.map((p) => `<span class="c">${esc(p)}</span>`).join('<span class="sep">›</span>') : '<span style="opacity:.7">Start by choosing the clinical situation</span>'}${path.length ? '<button class="reset" id="reset">start over</button>' : ""}</div>`;
      if (!this._grp) {
        h += `<div class="step"><h2>What is the clinical situation?</h2><div class="opts">` +
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
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
        <div class="banner"><span class="btitle">predictepilepsy<span class="dot">.com</span></span><a href="/">All calculators</a></div>
        <div class="wrap">
          <div class="head"><h1>Find the right calculator</h1><p>Choose a calculator step by step, or browse them by clinical group.</p></div>
          <div class="tabs"><button data-tab="guided"${this._tab === "guided" ? ' class="on"' : ""}>Guided</button><button data-tab="browse"${this._tab === "browse" ? ' class="on"' : ""}>Browse by group</button></div>
          <div id="body">${body}</div>
        </div>`;
      const sr = this.shadowRoot;
      sr.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => { this._tab = b.dataset.tab; if (this._tab === "guided") { this._grp = null; this._set = null; } this.render(); });
      sr.querySelectorAll("[data-grp]").forEach((b) => b.onclick = () => { this._grp = b.dataset.grp; this._set = null; this.render(); });
      sr.querySelectorAll("[data-set]").forEach((b) => b.onclick = () => { this._set = b.dataset.set; this.render(); });
      const rs = sr.querySelector("#reset"); if (rs) rs.onclick = () => { this._grp = null; this._set = null; this.render(); };
      // cards are real <a> links; nothing else to wire
    }
  }
  customElements.define("calc-finder", CalcFinder);
})();
