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
    { id: "g4", title: "Epilepsy surgery", icon: "🛠️",
      sub: "Presurgical evaluation and prediction of seizure, cognitive and mood outcomes after epilepsy surgery." },
    { id: "g5", title: "SUDEP risk", icon: "❤️",
      sub: "Individual risk of sudden unexpected death in epilepsy (SUDEP)." },
    { id: "g6", title: "Established / chronic epilepsy", icon: "🧬",
      sub: "Predicting drug resistance, and managing epilepsy in special situations such as pregnancy." },
    { id: "g7", title: "Status epilepticus", icon: "\u23f1\ufe0f",
      sub: "Estimating survival, mortality and outcome after an episode of status epilepticus." },
  ];
  const SETTINGS = {
    stroke_isch: "Ischaemic stroke", ich: "Intracerebral haemorrhage", sah: "Subarachnoid haemorrhage",
    cvt: "Cerebral venous thrombosis", tbi: "Traumatic brain injury", tumour: "Brain tumour",
    infection: "CNS infection", autoimmune: "Autoimmune encephalitis", febrile: "Febrile status epilepticus",
    acute_sympt: "Acute symptomatic seizure", critical_eeg: "Critically ill (EEG monitoring)", first_seizure: "First unprovoked seizure",
    two_seizures: "After two unprovoked seizures", withdrawal: "Withdrawing antiseizure medication",
    remission: "After a period of remission", drug_resistance: "Predicting drug resistance", pregnancy: "Seizures in pregnancy",
    se_prognosis: "Outcome / prognosis after status epilepticus", seeg: "SEEG / will it localise the focus?", surg_outcome: "Seizure freedom after surgery", surg_neuropsych: "Cognitive / mood outcome", sudep: "SUDEP risk",
  };
  // ---- catalogue:  [slug, name, description, group, setting] -----------------
  const CALCS = [
    ["select-score", "SeLECT Score", "The flagship SeLECT score — risk of late (unprovoked) seizures after ischaemic stroke.", "g1", "stroke_isch", { ext: "https://predictapps.github.io/select/" }],
    ["calc-post-stroke-recurrence", "Post-Stroke Seizure Recurrence (SeLECT-RS)", "Risk of a further seizure by WHEN the first post-stroke seizure occurred — revisiting the 7-day cutoff.", "g1", "stroke_isch"],
    ["calc-post-stroke-recurrence", "Post-Stroke Seizure Recurrence (SeLECT-RS)", "Risk of a further seizure by WHEN the first post-stroke seizure occurred — revisiting the 7-day cutoff.", "g1", "ich"],
    ["calc-post-stroke-recurrence", "Post-Stroke Seizure Recurrence (SeLECT-RS)", "Risk of a further seizure by WHEN the first post-stroke seizure occurred — revisiting the 7-day cutoff.", "g1", "sah"],
    ["calc-post-stroke-recurrence", "Post-Stroke Seizure Recurrence (SeLECT-RS)", "Risk of a further seizure by WHEN the first post-stroke seizure occurred — revisiting the 7-day cutoff.", "g1", "cvt"],
    ["calc-ischemia", "IsCHEMiA Score", "Imaging-based risk of late seizures after ischaemic stroke.", "g1", "stroke_isch"],
    ["calc-select-asys-rsys", "SeLECT (ASyS vs RSyS)", "Acute- vs remote-symptomatic seizure risk after ischaemic stroke.", "g1", "stroke_isch"],
    ["calc-pseicare", "PSEiCARe (post-stroke epilepsy)", "1-year late post-stroke epilepsy risk group from 7 clinical factors.", "g1", "stroke_isch"],
    ["calc-posers", "PoSERS (post-stroke epilepsy)", "Post-Stroke Epilepsy Risk Scale — 7-item clinical score.", "g1", "stroke_isch"],
    ["calc-cave-score", "CAVE Score", "Late seizures after intracerebral haemorrhage (ICH).", "g1", "ich"],
    ["calc-cave2-score", "CAVE² Score", "Modified CAVE score for late seizures after ICH.", "g1", "ich"],
    ["calc-lane-score", "LANE Score", "Clinical score for late seizures after ICH.", "g1", "ich"],
    ["calc-lean", "LEAN Score", "Clinical score for late seizures after intracerebral haemorrhage (ICH).", "g1", "ich"],
    ["calc-rise", "RISE Score", "Epilepsy after aneurysmal subarachnoid haemorrhage.", "g1", "sah"],
    ["calc-safari", "SAFARI (acute SAH seizures)", "Risk of a convulsive seizure during admission for aneurysmal subarachnoid haemorrhage.", "g1", "sah"],
    ["calc-dias3", "DIAS3", "Remote seizure / epilepsy risk after cerebral venous thrombosis.", "g1", "cvt"],
    ["calc-early-seizure-cvt", "Early Seizures after CVT", "Early seizure risk after cerebral venous thrombosis.", "g1", "cvt"],
    ["calc-pte-nomogram-1", "PTE after TBI", "Post-traumatic epilepsy nomogram after traumatic brain injury.", "g1", "tbi"],
    ["calc-pte-nomogram-2", "PTE after Cerebral Contusion", "Post-traumatic epilepsy nomogram after cerebral contusion.", "g1", "tbi"],
    ["calc-pte-nomogram-3", "PTE — Late Seizures", "Prognostic model for late seizures after traumatic brain injury.", "g1", "tbi"],
    ["calc-epilepsy-first-pts", "First Post-traumatic Seizure", "Epilepsy risk after a first post-traumatic seizure.", "g1", "tbi"],
    ["calc-bmers", "BMERS", "Epilepsy risk in patients with brain metastases.", "g1", "tumour"],
    ["calc-stampe2", "STAMPE² Score", "Epilepsy outcome after meningioma resection.", "g1", "tumour"],
    ["calc-glioma-epilepsy", "Glioma-Related Epilepsy", "Epilepsy in diffuse high-grade glioma.", "g1", "tumour"],
    ["calc-meningioma-seizures", "Meningioma Late Seizures", "Probability of late postoperative seizures after meningioma resection, from 5 factors.", "g1", "tumour"],
    ["calc-bm-seizures", "Brain Metastases Seizures", "Probability of a seizure in a patient with brain metastases, from 3 factors (small cohort).", "g1", "tumour"],
    ["calc-ncc-seizure-recurrence", "Neurocysticercosis (adults)", "Seizure recurrence in solitary calcified neurocysticercosis.", "g1", "infection", { pop: "adult" }],
    ["calc-nepc", "NEPC (paediatric NCC)", "6-month seizure-recurrence risk in children with neurocysticercosis.", "g1", "infection", { pop: "paed" }],
    ["calc-autoimmune-enceph-recurrence", "Autoimmune Encephalitis", "Seizure recurrence in NMDAR / LGI1 / CASPR2 encephalitis.", "g1", "autoimmune"],
    ["calc-hs-tle-fse", "HS / TLE after Febrile Status", "Hippocampal sclerosis & temporal-lobe epilepsy after febrile status epilepticus.", "g1", "febrile", { pop: "paed" }],
    ["calc-epi-pass", "EPI-PASS", "Epilepsy after an acute symptomatic seizure.", "g1", "acute_sympt"],
    ["calc-2helps2b", "2HELPS2B (cEEG seizure risk)", "Probability of an electrographic seizure on continuous EEG in critically ill patients, from 6 EEG/clinical features.", "g1", "critical_eeg"],

    ["calc-first-seizure-driving", "First Seizure & Driving", "Recurrence risk (COSY) after a first-ever seizure by aetiology, and when driving thresholds are met.", "g2", "first_seizure"],
    ["calc-fsc-childhood-epilepsy", "First Seizure in Children — Epilepsy Diagnosis", "Probability of an epilepsy diagnosis in a child after one or more paroxysmal events, from 11 clinical features + EEG.", "g2", "first_seizure", { pop: "paed" }],
    ["calc-first-seizure-recurrence", "First Unprovoked Seizure — Recurrence", "Recurrence after a first unprovoked seizure by risk factor (EEG, MRI, nocturnal, prior insult).", "g2", "first_seizure"],
    ["calc-mess-part1", "MESS (Part 1)", "Recurrence risk after a first seizure — combination table.", "g2", "first_seizure"],
    ["calc-mess-part2", "MESS (Part 2)", "Prognostic index for recurrence after a single seizure / early epilepsy.", "g2", "first_seizure"],
    ["calc-first-tcs-adults", "First Tonic-Clonic Seizure", "Recurrence after a first tonic-clonic seizure in adults.", "g2", "first_seizure", { pop: "adult" }],
    ["calc-egtca", "EGTCA", "Epilepsy with generalized tonic-clonic seizures alone.", "g2", "first_seizure"],
    ["calc-return-driving-first-seizure", "Return to Driving", "When is it safe to drive after a first-ever seizure?", "g2", "first_seizure"],
    ["calc-epilepsy-first-seizure-dementia", "First Seizure in Dementia", "Epilepsy risk after a first unprovoked seizure in dementia.", "g2", "first_seizure", { pop: "adult" }],
    ["calc-hauser-cosy", "After Two Unprovoked Seizures", "Recurrence risk after two unprovoked seizures (Hauser).", "g2", "two_seizures"],
    ["calc-sanad-bt", "SANAD Breakthrough", "Breakthrough seizure, recurrence & re-remission after a 12-month remission on treatment (SANAD).", "g2", "remission"],

    // g3 — withdrawing antiseizure medication (relapse risk when stopping ASMs)
    ["calc-jme-withdrawal", "JME — Post-Withdrawal Relapse Risk", "For someone with juvenile myoclonic epilepsy who is seizure-free: risk of recurrence 2 and 5 years after stopping medication.", "g3", "withdrawal"],
    ["calc-tts-postop-withdrawal", "Postoperative Relapse after ASM Withdrawal in Children", "Seizure recurrence (2 & 5 yr), long-term seizure freedom and cure after stopping ASM in children who had epilepsy surgery — TimeToStop nomograms.", "g3", "withdrawal", { pop: "paed" }],
    ["calc-lamberink", "ASM Withdrawal — Individualised", "Individualised 2- & 5-year recurrence risk and 10-year seizure-freedom chance after ASM withdrawal (Lamberink nomograms).", "g3", "withdrawal"],
    ["calc-relapse-asm-withdrawal-focal", "ASM Withdrawal — Focal Epilepsy", "Relapse after ASM withdrawal in adult focal epilepsy.", "g3", "withdrawal", { pop: "adult" }],
    ["calc-drug-withdrawal", "WAMS (after surgery)", "ASM withdrawal after epilepsy surgery — cumulative & COSY curves.", "g3", "withdrawal"],

    // g4 — epilepsy surgery: planning (SEEG) + seizure outcome + cognitive/mood outcome
    ["calc-5-sense", "5-SENSE (SEEG focality)", "Chance that stereo-EEG will find a focal seizure-onset zone, from 5 non-invasive findings.", "g4", "seeg"],
    ["calc-jehi-nomogram", "Jehi Nomogram (seizure freedom)", "Chance of complete seizure freedom at 2 and 5 years after resective epilepsy surgery, from six presurgical characteristics.", "g4", "surg_outcome"],
    ["calc-slah-score", "SLAH Seizure-Freedom Score", "Chance of seizure freedom after laser ablation (SLAH) for mesial temporal lobe epilepsy.", "g4", "surg_outcome"],
    ["calc-sfs", "Seizure-Freedom Score (SFS)", "Chance of seizure freedom at 10 years after resective epilepsy surgery, from 4 factors.", "g4", "surg_outcome"],
    ["calc-hops", "HOPS (paediatric hemispheric surgery)", "Chance of seizure freedom after hemispheric surgery in children, from 5 factors.", "g4", "surg_outcome", { pop: "paed" }],
    ["calc-fle-surgery-prognostic", "Frontal Lobe Surgery — Seizure Outcome", "Prognostic factors for seizure outcome after frontal-lobe epilepsy surgery.", "g4", "surg_outcome"],
    ["calc-fle-surgery-outcome", "Frontal Lobe Surgery — Seizure Outcome", "Seizure outcome after frontal-lobe epilepsy surgery.", "g4", "surg_outcome"],
    ["calc-fle-surgery-longterm", "Frontal Lobe Surgery — Long-term", "Long-term seizure & psychosocial outcomes after frontal-lobe surgery.", "g4", "surg_outcome"],
    ["calc-frontal-lgg-seizure", "Frontal Low-Grade Tumour", "Seizure outcome after resection of frontal low-grade tumours.", "g4", "surg_outcome"],
    ["calc-pgrem", "PGREM", "Post-operative glioma-related epilepsy risk.", "g4", "surg_outcome"],
    ["calc-postop-iq85", "Cognitive Outcome after Surgery — IQ > 85", "Probability of an IQ above 85 two years after paediatric epilepsy surgery, from pre-surgical IQ, resection extent and invasive diagnostics.", "g4", "surg_neuropsych", { pop: "paed" }],
    ["calc-postop-iq70", "Cognitive Outcome after Surgery — IQ > 70", "Probability of an IQ above 70 two years after paediatric epilepsy surgery, from pre-surgical IQ and resection extent.", "g4", "surg_neuropsych", { pop: "paed" }],
    ["calc-postop-dq50", "Cognitive Outcome after Surgery — DQ > 50", "For children with developmental delay: probability of a developmental quotient above 50 two years after epilepsy surgery.", "g4", "surg_neuropsych", { pop: "paed" }],
    ["calc-naming-decline", "Naming Decline (TLE surgery)", "Risk of naming decline after temporal-lobe epilepsy surgery (Busch nomogram).", "g4", "surg_neuropsych", { pop: "adult" }],
    ["calc-memory-decline", "Verbal Memory Decline (TLR)", "Risk of verbal memory (RAVLT) decline after temporal lobe resection (Busch nomogram).", "g4", "surg_neuropsych", { pop: "adult" }],
    ["calc-mood-decline", "Mood Decline (TLE surgery)", "Risk of clinically significant mood (depression) decline after temporal-lobe epilepsy surgery (Doherty nomogram).", "g4", "surg_neuropsych", { pop: "adult" }],

    // g5 — SUDEP risk
    ["calc-sudep3", "SUDEP-3 Inventory", "Three-item inventory stratifying the risk of sudden unexpected death in epilepsy (SUDEP).", "g5", "sudep"],
    ["calc-jha-sudep", "SUDEP Personalised Risk", "Individualised relative risk of sudden unexpected death in epilepsy (SUDEP) from 22 clinical factors.", "g5", "sudep"],
    ["calc-sudep-risk-markers", "SUDEP Risk Markers", "Reference for individual SUDEP risk markers (living alone, frequent tonic–clonic seizures, peri-ictal apnoea) and their 5-year SUDEP risk — markers only, not a combined score.", "g5", "sudep"],

    // g6 — established / chronic epilepsy
    ["calc-jme-drug-resistance", "JME — Drug Resistance", "Risk of drug-resistant epilepsy in juvenile myoclonic epilepsy.", "g6", "drug_resistance"],
    ["calc-pse-dre", "Post-Stroke Epilepsy — Drug Resistance", "Probability of drug-resistant epilepsy in people with post-stroke epilepsy, from 5 factors.", "g6", "drug_resistance"],
    ["calc-pte-dre", "Post-Traumatic Epilepsy — Drug Resistance", "Probability of drug-resistant epilepsy in people with post-traumatic epilepsy, from 4 factors.", "g6", "drug_resistance"],
    ["calc-empire", "EMPiRE (seizures in pregnancy)", "Probability of a seizure during pregnancy in a woman with epilepsy, from booking-visit factors.", "g6", "pregnancy"],
    ["calc-acd-se-mortality", "ACD Score \u2014 Mortality after Status Epilepticus", "Two-year mortality after non-anoxic status epilepticus from the Age\u2013Consciousness\u2013Duration (ACD) score (Roberg 2022; validated Alan\u00eds-Bernal 2026).", "g7", "se_prognosis", { pop: "adult" }],
    ["calc-se-survival-5yr", "Survival Curves after Status Epilepticus (5-year)", "Cumulative 5-year mortality after status epilepticus by ACD band and by Lattanzi aetiology — digitized Kaplan\u2013Meier curves (Alan\u00eds-Bernal 2026).", "g7", "se_prognosis", { pop: "adult" }],
    ["calc-stess", "STESS — Status Epilepticus Severity Score", "The most validated bedside score for survival after status epilepticus: 4 pre-treatment items (Rossetti 2008). Favorable 0–2 vs unfavorable 3–6.", "g7", "se_prognosis", { pop: "adult" }],
    ["calc-emse", "EMSE — 30-day mortality nomogram", "Individualised 30-day mortality after status epilepticus from aetiology, age, comorbidity and EEG — the EMSE-parameter nomogram (Brigo/Meletti 2022, AUC 0.83).", "g7", "se_prognosis", { pop: "adult" }],
    ["calc-endit", "END-IT — functional outcome after CSE", "Risk of poor functional outcome (mRS 3–6) at 3 months after convulsive status epilepticus, from 5 bedside items (Gao 2016). Cut-off ≥3.", "g7", "se_prognosis", { pop: "adult" }],
    ["calc-after", "AFTER — epilepsy after status epilepticus", "Risk of developing epilepsy in the 5 years after a de novo status epilepticus, from 4 clinical/EEG items (Rodrigo-Gisbert 2023). Cut-off ≥2.", "g7", "se_prognosis", { pop: "adult" }],
    ["calc-tiamkao", "SE Mortality Score (national database)", "Purely clinical mortality risk after status epilepticus (age, comorbidities, complications) — no EEG/imaging needed (Tiamkao 2018, n>10,000).", "g7", "se_prognosis", { pop: "adult" }],
    ["calc-stepss", "STEPSS — paediatric SE severity score", "Risk of poor outcome (POPC ≥3) in children with status epilepticus — the paediatric STESS (Sidharth 2019). Cut-off >3.", "g7", "se_prognosis", { pop: "paed" }],
  ];
  // ---- evidence badges (from 5_validate_qa/evidence_grades.csv; see QC memory Dim7) ----
  // "ec" = Editor's choice (strongest evidence for that clinical question)
  // "rec" = Recommended (clinically useful, good evidence). Unlisted = no badge (weaker evidence).
  const BADGE = {
    "calc-2helps2b": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=5427, externally validated)."],
    "calc-5-sense": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=128, externally validated)."],
    "calc-autoimmune-enceph-recurrence": ["rec", "Recommended — clinically useful with good evidence (tier B, n=981)."],
    "calc-bmers": ["rec", "Recommended — clinically useful with good evidence (tier B, n=799)."],
    "calc-cave-score": ["ec", "Editor's choice — best of CAVE / LEAN / LANE / CAVE²: tier A, n=993, externally validated."],
    "calc-dias3": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=1128, externally validated)."],
    "calc-drug-withdrawal": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=231, externally validated)."],
    "calc-empire": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=399, externally validated)."],
    "calc-epilepsy-first-pts": ["rec", "Recommended — clinically useful with good evidence (tier B, n=2286)."],
    "calc-epilepsy-first-seizure-dementia": ["rec", "Recommended — clinically useful with good evidence (tier B, n=1039)."],
    "calc-first-seizure-driving": ["rec", "Recommended — clinically useful with good evidence (tier B, n=1714)."],
    "calc-hops": ["rec", "Recommended — clinically useful with good evidence (tier B, n=1267)."],
    "calc-ischemia": ["ec", "Editor's choice — best of the post-ischaemic-stroke seizure models: tier A, n=1436, externally validated (alongside SeLECT)."],
    "calc-jehi-nomogram": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=846, externally validated)."],
    "calc-jha-sudep": ["rec", "Recommended — clinically useful with good evidence (tier B, n=1273)."],
    "calc-jme-drug-resistance": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=2518, externally validated)."],
    "calc-lamberink": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=1769, externally validated)."],
    "calc-lane-score": ["rec", "Recommended — tier A evidence (n=602, externally validated). CAVE is the editor's choice for this same question."],
    "calc-lean": ["rec", "Recommended — tier A evidence (n=781, externally validated). CAVE is the editor's choice for this same question."],
    "calc-memory-decline": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=359, externally validated)."],
    "calc-mess-part1": ["rec", "Recommended — clinically useful with good evidence (tier B, n=1443)."],
    "calc-mess-part2": ["rec", "Recommended — clinically useful with good evidence (tier B, n=1443)."],
    "calc-mood-decline": ["rec", "Recommended — clinically useful with good evidence (tier B, n=592)."],
    "calc-naming-decline": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=719, externally validated)."],
    "calc-pseicare": ["rec", "Recommended — clinically useful with good evidence (tier B, cohort n/a)."],
    "calc-pte-nomogram-1": ["ec", "Editor's choice — best of the PTE nomograms after TBI: tier A, n=1301, externally validated."],
    "calc-pte-nomogram-3": ["rec", "Recommended — tier B evidence (n=475, externally validated). PTE after TBI (Wang 2021) is the editor's choice for this same question."],
    "calc-return-driving-first-seizure": ["rec", "Recommended — clinically useful with good evidence (tier B, n=1386)."],
    "calc-rise": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=419, externally validated)."],
    "calc-safari": ["rec", "Recommended — clinically useful with good evidence (tier B, n=1500, externally validated)."],
    "calc-sanad-bt": ["rec", "Recommended — clinically useful with good evidence (tier B, cohort n/a)."],
    "calc-sfs": ["rec", "Recommended — clinically useful with good evidence (tier B, n=466)."],
    "select-score": ["ec", "Editor's choice — the most extensively externally validated model for late seizures after ischaemic stroke (alongside IsCHEMiA)."],
      "calc-fsc-childhood-epilepsy": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=451, externally validated in an independent cohort of 187; AUC 0.86). The only model for epilepsy diagnosis in children after paroxysmal events."],
    "calc-postop-iq85": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=258, externally validated in 102; accuracy 0.82, AUC 0.90)."],
    "calc-postop-iq70": ["ec", "Editor's choice — strongest available evidence for this question (tier A, n=258, externally validated in 102; accuracy 0.84, AUC 0.92)."],
    "calc-jme-withdrawal": ["ec", "Editor's choice — the only model for ASM withdrawal in JME (tier A; IPD meta-analysis of 24 studies with internal-external cross-validation, c 0.70). Note it rests on the 368 people who attempted withdrawal, not the full 2518-person cohort."],
    "calc-tts-postop-withdrawal": ["rec", "Recommended — the only tool for ASM withdrawal after epilepsy surgery in children (n=766, 15 centres, 8 countries). Tier B: internally adjusted only, not externally validated, and discrimination is modest (c 0.68-0.73). WAMS is the editor's choice for this question overall."],
    "calc-postop-dq50": ["rec", "Recommended — the only tool for developmental outcome in children with developmental delay. Tier B: small cohort (n=127), 10-fold cross-validation only, correct classification 76% — weaker than its IQ siblings from the same paper."],
    "calc-acd-se-mortality": ["rec", "Recommended — the only tool for mortality after status epilepticus. The ACD score is externally validated across Denmark, Germany and Norway (Roberg 2022) and again in Spain (Alanís-Bernal 2026). Per-score 2-year mortality is read from the published nomogram; pending human review of the extraction (would otherwise be Editor\u2019s choice as the sole tier-A tool for this question)."],
};
  const bySlug = Object.fromEntries(CALCS.map((c) => [c[0], c]));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // per-group accent dot on the score badge (matches the old calc-home look)
  const GROUP_DOT = { g1: "#3f7fd0", g2: "#e0691f", g3: "#7a5ea8", g4: "#0f7a54", g5: "#c0322b", g7: "#3f4a5a" };
  // per-clinical-group badge gradient (lighter -> deeper) — gives each score's tile the colour of its group
  const GROUP_GRAD = {
    g1: ["#4a86d6", "#1f5aa8"], g2: ["#ef8a44", "#c85713"], g3: ["#9074c0", "#5f4790"],
    g4: ["#22a578", "#0c6647"], g5: ["#d8564a", "#9e2820"], g7: ["#5a6b80", "#333c4a"],
  };
  const BADGE_CURVE = '<svg class="ccrv" viewBox="0 0 96 34" preserveAspectRatio="none"><path d="M0 31 C24 29 33 15 52 10 71 5 80 4 96 3 L96 34 L0 34 Z" fill="#fff" opacity=".12"/><path d="M0 31 C24 29 33 15 52 10 71 5 80 4 96 3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".92"/></svg>';
  const abbrev = (name) => String(name).split(/[\s(]/)[0].replace(/[:,]$/, "").slice(0, 12);
  // Clean short badge labels where the auto-abbrev (first word) would be an ugly long truncation.
  const AB = {
    "calc-ncc-seizure-recurrence": "NCC", "calc-tts-postop-withdrawal": "TTS",
    "calc-autoimmune-enceph-recurrence": "AIE", "calc-meningioma-seizures": "Mening.",
    "calc-postop-iq85": "IQ>85", "calc-postop-iq70": "IQ>70", "calc-postop-dq50": "DQ>50",
  };
  // Font size that keeps an abbreviation on ONE line inside the 58px badge (~52px usable, weight 800).
  const badgeFont = (n) => n <= 3 ? 21 : n <= 4 ? 18 : n <= 5 ? 15.5 : n <= 6 ? 13 : n <= 7 ? 11.5 : n <= 8 ? 10 : n <= 10 ? 8.5 : 7.5;
  // Badge inner HTML: single words stay on one line (font shrinks to fit); only a hyphenated
  // abbreviation wraps — cleanly at the hyphen — into two rows (e.g. Post-/Stroke, END-/IT).
  const badgeInner = (ab) => {
    ab = String(ab);
    const i = ab.indexOf("-");
    if (i > 0 && i < ab.length - 1) {
      const p1 = ab.slice(0, i + 1), p2 = ab.slice(i + 1);
      return `<span class="cab wrap" style="font-size:${badgeFont(Math.max(p1.length, p2.length))}px">${esc(p1)}<br>${esc(p2)}</span>`;
    }
    return `<span class="cab" style="font-size:${badgeFont(ab.length)}px">${esc(ab)}</span>`;
  };

  const CSS = `
    :host{--azure:#135ba8;--azure-deep:#0e4a8a;--azure-wash:#eef6fe;--azure-line:#cfe4fb;--ink:#16222f;--muted:#5c6b7a;
      display:block;max-width:100%;scroll-margin-top:78px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);line-height:1.5;color-scheme:light}
    *{box-sizing:border-box;min-width:0}
    .wrap,.opts,.cards,.card,.opt{max-width:100%;overflow-wrap:anywhere}
    svg,img{max-width:100%}
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
    .popsec{margin:0 0 18px}
    .poph{font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--azure-deep);margin:16px 0 9px;padding-bottom:5px;border-bottom:1px solid var(--azure-line)}
    .chip.paed{background:#eef4ff;color:#1c3f94;border-color:#c9d9f7}
    .chip.adult{background:#f2f4f7;color:#495667;border-color:#dde3ea}
    .chip.ec{background:#fdefd0;color:#7a4d00;border:1px solid #e0b25f;font-weight:750;letter-spacing:.01em}
    .chip.rec{background:#e7f4ec;color:#0f6b45;border:1px solid #bfe3ce;font-weight:650}
    .card.ec{border:2px solid #e0b25f;background:linear-gradient(180deg,#fffcf3 0%,#fff 60%);box-shadow:0 6px 20px rgba(190,140,40,.18)}
    .card.ec:hover{border-color:#c9932f;box-shadow:0 10px 26px rgba(190,140,40,.26);transform:translateY(-2px)}
    .card.rec{border:1.5px solid #bfe3ce;background:linear-gradient(180deg,#fbfefc 0%,#fff 60%)}
    .card.rec:hover{border-color:#5aa87f;box-shadow:0 8px 22px rgba(20,120,80,.14)}
    .card.norec{opacity:.6}.card.norec:hover{opacity:1}
    .step h2{font-size:22px;margin:2px 0 22px;text-align:center;letter-spacing:-.2px}
    .opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
    .opts.large{display:flex;flex-wrap:wrap;justify-content:center;gap:24px;max-width:1180px;margin:6px auto 0}
    .opts.large .opt{flex:0 1 330px;max-width:360px;background:linear-gradient(165deg,#ffffff,#f3f8ff);padding:30px 28px;border-radius:24px;gap:20px;border:1.5px solid #e6eef9;box-shadow:0 8px 24px rgba(19,91,168,.09);position:relative;overflow:hidden}
    .opts.large .opt::before{content:"";position:absolute;top:0;left:-75%;width:55%;height:100%;background:linear-gradient(105deg,transparent,rgba(19,91,168,.10),transparent);transform:skewX(-18deg);pointer-events:none}
    .opts.large .opt:hover{box-shadow:0 16px 40px rgba(19,91,168,.20);transform:translateY(-4px);border-color:#cfe0f7}
    .opts.large .opt:hover::before{animation:optShim .9s ease}
    @keyframes optShim{from{left:-75%}to{left:135%}}
    .opts.large .opt .ic{font-size:37px;flex:0 0 auto;width:68px;height:68px;border-radius:19px;background:linear-gradient(150deg,#eaf3ff,#d8e9fc);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.85)}
    .opts.large .opt .ot{font-size:20px;margin-bottom:7px}
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
    .cbadge{width:58px;height:58px;flex:0 0 auto;border-radius:15px;background:linear-gradient(150deg,#2472c8,#0e4a8a);box-shadow:0 5px 15px rgba(14,40,74,.24);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff}
    .cbadge::after{content:"";position:absolute;inset:0;border-radius:15px;background:linear-gradient(180deg,rgba(255,255,255,.24),rgba(255,255,255,0) 46%);pointer-events:none}
    .cbadge .cab{font-weight:800;line-height:1;text-align:center;z-index:1;padding:0 2px;letter-spacing:-.3px;text-shadow:0 1px 2px rgba(0,0,0,.13);white-space:nowrap}
    .cbadge .cab.wrap{white-space:normal;line-height:1.02}
    .cbadge .ccrv{position:absolute;left:0;right:0;bottom:0;height:20px}
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
    .searchbox{position:relative;max-width:540px;margin:20px auto 6px}
    .searchbox .si{position:absolute;left:17px;top:50%;transform:translateY(-50%);font-size:16px;opacity:.5;pointer-events:none}
    .searchbox input{width:100%;border:1.5px solid var(--azure-line);background:#fff;border-radius:999px;padding:13px 44px;font-size:15.5px;color:var(--ink);outline:none;transition:.15s;box-shadow:0 4px 14px rgba(19,91,168,.06);-webkit-appearance:none}
    .searchbox input:focus{border-color:var(--azure);box-shadow:0 0 0 4px var(--azure-wash)}
    .searchbox input::placeholder{color:#93a3b3}
    .searchbox input::-webkit-search-cancel-button{-webkit-appearance:none}
    .searchbox .sclear{position:absolute;right:12px;top:50%;transform:translateY(-50%);border:0;background:#eef2f6;color:var(--muted);width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:15px;line-height:1;display:none}
    .searchbox .sclear:hover{background:#e1e8ef;color:var(--ink)}
    .searchbox.has .sclear{display:block}
    .sres h2{font-size:18px;margin:6px 0 16px;text-align:center;color:var(--ink);font-weight:650}
    .sres h2 b{color:var(--azure-deep)}
    @media(max-width:560px){.head h1{font-size:24px}.banner{border-radius:0}.cards{grid-template-columns:1fr}.opts{grid-template-columns:1fr}.wrap{padding:0 14px 40px}.crumbs{flex-wrap:wrap}}
  `;

  // per-brand palette override (default = predictepilepsy azure; "select" = SeLECT Consortium lime-green + navy)
  const PALETTES = {
    select: ":host{--azure:#6f8c00;--azure-deep:#1c244b;--azure-wash:#f6f8e9;--azure-line:#dfe8c2}",
  };

  class CalcFinder extends HTMLElement {
    connectedCallback() {
      this._only = this.getAttribute("only") || null;        // "guided" | "browse" -> lock to one tab, hide switcher
      this._tab = this._only || this.getAttribute("default-tab") || "guided";
      this._grp = null; this._set = null; this._q = "";
      this._base = (this.getAttribute("base") || "").replace(/\/+$/, "");  // e.g. https://predictepilepsy.com for external embeds
      this._brand = (this.getAttribute("brand") || "").toLowerCase();       // "select" -> lime-green palette
      this.attachShadow({ mode: "open" });
      this.render();
    }
    go(slug) { window.location.href = this._base + "/" + slug + "/"; }
    /* Render a list of calculators. When a setting mixes paediatric and non-paediatric tools
       (e.g. cognitive outcomes after surgery: Cloppenborg in children vs Busch in adults), split
       them under age headings so the wrong-population tool isn't picked by accident. Untagged
       models are grouped as "not age-specific" rather than being asserted to be adult. */
    cardList(list) {
      const pop = (c) => (c[5] || {}).pop;
      const paed = list.filter((c) => pop(c) === "paed");
      const adult = list.filter((c) => pop(c) === "adult");
      const rest = list.filter((c) => !pop(c));
      const cards = (l) => `<div class="cards">${l.map((c) => this.card(c)).join("")}</div>`;
      if (!paed.length || paed.length === list.length) return cards(list);   // nothing to separate
      // Untagged models lead, unlabelled — heading them "not age-specific" would push a niche
      // age-tagged tool above the flagship ones. Only the age-specific sets get a heading.
      const sec = (title, l) => l.length ? `<div class="popsec"><div class="poph">${title}</div>${cards(l)}</div>` : "";
      return (rest.length ? cards(rest) : "") + sec("Adults", adult) + sec("Children", paed);
    }
    card(c) {
      const o = c[5] || {};                       // optional flags: {ext:url, rec:false, ab, badge, pop}
      const ext = o.ext, norec = o.rec === false;
      const b = BADGE[c[0]] || null;              // ["ec"|"rec", why] from the evidence table
      const ec = !!b && b[0] === "ec", recd = !!b && b[0] === "rec";
      const href = ext || (this._base + "/" + c[0] + "/");
      const ab = o.ab || AB[c[0]] || abbrev(c[1]);
      const grad = GROUP_GRAD[c[3]] || ["#2472c8", "#0e4a8a"];
      // pop chip — only set where the source paper states the population explicitly.
      const flags =
        (o.pop === "paed" ? `<span class="chip paed" title="Developed and validated in children">Children</span>` : "") +
        (o.pop === "adult" ? `<span class="chip adult" title="Developed and validated in adults">Adults</span>` : "") +
        (ec ? `<span class="chip ec" title="${esc(b[1])}">&#9733; Editor&rsquo;s choice</span>` : "") +
        (recd ? `<span class="chip rec" title="${esc(b[1])}">&#10003; Recommended</span>` : "") +
        (norec ? `<span class="chip norec" title="${esc(o.badge || "Weak evidence — use only if nothing better is available")}">not recommended</span>` : "") +
        (ext ? `<span class="chip ext">external tool ↗</span>` : "");
      return `<a class="card${norec ? " norec" : ""}${ec ? " ec" : recd ? " rec" : ""}" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""} data-slug="${c[0]}">` +
        `<span class="cbadge" style="background:linear-gradient(150deg,${grad[0]},${grad[1]})">${badgeInner(ab)}${BADGE_CURVE}</span>` +
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
          (matches.length ? this.cardList(matches) : `<p class="none">No calculator listed for this situation yet.</p>`) +
          `</div>`;
      }
      return h;
    }
    // A calc may be listed under several settings (e.g. one tool across IS/ICH/SAH/CVT) so the
    // GUIDED drill-down surfaces it per aetiology — but list each slug only ONCE in browse/search.
    _dedup(arr) { const seen = new Set(); return arr.filter((c) => seen.has(c[0]) ? false : seen.add(c[0])); }
    browse() {
      return GROUPS.map((g) => {
        const list = this._dedup(CALCS.filter((c) => c[3] === g.id));
        return `<div class="grp"><div class="gh"><span class="gi">${g.icon}</span><h2>${esc(g.title)}</h2></div>
          <p class="gsub">${esc(g.sub)}</p>${this.cardList(list)}</div>`;
      }).join("");
    }
    // --- search by calculator name / acronym ---
    _matches(q) {
      const ql = q.toLowerCase(), toks = ql.split(/\s+/).filter(Boolean);
      return this._dedup(CALCS
        .filter((c) => { const hay = (c[1] + " " + c[2] + " " + abbrev(c[1])).toLowerCase(); return toks.every((t) => hay.includes(t)); }))
        .sort((a, b) => (b[1].toLowerCase().includes(ql) ? 1 : 0) - (a[1].toLowerCase().includes(ql) ? 1 : 0));
    }
    search() {
      const q = this._q.trim(), res = this._matches(q);
      if (!res.length) return `<p class="none">No calculator matches &ldquo;${esc(q)}&rdquo;. Try another name or acronym (e.g. SeLECT, CAVE, SUDEP, Lamberink).</p>`;
      return `<div class="sres"><h2><b>${res.length}</b> calculator${res.length === 1 ? "" : "s"} matching &ldquo;${esc(q)}&rdquo;</h2>${this.cardList(res)}</div>`;
    }
    _bodyHTML() { return this._q.trim() ? this.search() : (this._tab === "guided" ? this.guided() : this.browse()); }
    // after a guided step, bring the finder back into view (esp. on mobile, where the
    // tapped option is far down the page and the new step would otherwise stay off-screen)
    _scrollUp() {
      try {
        // ALWAYS bring the calculator box back to the top on a guided selection.
        // double-rAF so layout has settled after the re-render, then explicit window scroll
        // (measured target — more reliable across browsers than smooth scrollIntoView).
        const host = this;
        const jump = () => {
          try {
            let hdr = 0;
            const h = document.querySelector("#site-header, header.site-header, .site-header, header");
            if (h) { const cs = getComputedStyle(h); if (cs.position === "fixed" || cs.position === "sticky") hdr = h.offsetHeight || 0; }
            // target the calculator BOX (the panel that wraps the finder) so its top edge lands just below the header
            const box = (host.closest && host.closest("#pe-calc-panel, .rc-wrap, .pnews")) || host;
            const y = box.getBoundingClientRect().top + (window.pageYOffset || window.scrollY || 0) - hdr - 12;
            window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
          } catch (e) { try { host.scrollIntoView(true); } catch (e2) {} }
        };
        requestAnimationFrame(() => requestAnimationFrame(jump));
      } catch (e) {}
    }
    _wireBody() {
      const sr = this.shadowRoot;
      sr.querySelectorAll("[data-grp]").forEach((b) => b.onclick = () => { this._grp = b.dataset.grp; this._set = null; this.render(); this._scrollUp(); });
      sr.querySelectorAll("[data-set]").forEach((b) => b.onclick = () => { this._set = b.dataset.set; this.render(); this._scrollUp(); });
      const bk = sr.querySelector("#back"); if (bk) bk.onclick = () => { this.back(); this._scrollUp(); };
      const rs = sr.querySelector("#reset"); if (rs) rs.onclick = () => { this._grp = null; this._set = null; this.render(); this._scrollUp(); };
    }
    render() {
      const body = this._bodyHTML();
      // when placed under a page banner (attr "plain"), skip the component's own strip
      var strip = this.hasAttribute("plain") ? "" :
        `<div class="banner"><span class="btitle">predictepilepsy<span class="dot">.com</span></span><a href="${this._base}/">All calculators</a></div>`;
      const head = this.hasAttribute("no-head") ? "" :
        `<div class="head"><h1>Find the right calculator</h1><p>Choose a calculator step by step, or browse them by clinical group.</p></div>`;
      const searchbox = `<div class="searchbox${this._q.trim() ? " has" : ""}"><span class="si">&#128269;</span><input id="calcsearch" type="search" autocomplete="off" placeholder="Search calculators by name or acronym…" value="${esc(this._q)}"><button class="sclear" id="sclear" aria-label="Clear search" title="Clear search">&times;</button></div>`;
      const tabs = (this._only || this._q.trim()) ? "" :
        `<div class="tabs"><button data-tab="guided"${this._tab === "guided" ? ' class="on"' : ""}>Guided</button><button data-tab="browse"${this._tab === "browse" ? ' class="on"' : ""}>Browse by group</button></div>`;
      this.shadowRoot.innerHTML = `<style>${CSS}${PALETTES[this._brand] || ""}</style>
        ${strip}
        <div class="wrap">
          ${head}
          ${searchbox}
          ${tabs}
          <div id="body">${body}</div>
        </div>`;
      const sr = this.shadowRoot;
      sr.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => { this._q = ""; this._tab = b.dataset.tab; if (this._tab === "guided") { this._grp = null; this._set = null; } this.render(); });
      this._wireBody();
      // search input — update only the body + tabs on keystroke so the field keeps focus
      const inp = sr.querySelector("#calcsearch"), clr = sr.querySelector("#sclear"), box = sr.querySelector(".searchbox");
      const refresh = () => {
        box.classList.toggle("has", !!this._q.trim());
        sr.querySelector("#body").innerHTML = this._bodyHTML();
        this._wireBody();
        const t = sr.querySelector(".tabs"); if (t) t.style.display = this._q.trim() ? "none" : "";
      };
      if (inp) {
        inp.oninput = () => { this._q = inp.value; refresh(); };
        inp.onkeydown = (e) => { if (e.key === "Enter") { const r = this._matches(this._q.trim()); if (this._q.trim() && r.length === 1) this.go(r[0][0]); } };
      }
      if (clr) clr.onclick = () => { this._q = ""; if (inp) { inp.value = ""; inp.focus(); } refresh(); };
    }
  }
  customElements.define("calc-finder", CalcFinder);
})();
