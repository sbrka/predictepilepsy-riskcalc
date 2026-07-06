/* pub-shelf — predictepilepsy.com publications carousel + tabbed detail modal (azure).
   Usage: <pub-shelf src="https://cdn.../pubdata.json"></pub-shelf> (or src="inline" reading #pubdata JSON). */
(function(){
const DISCLAIMER="The information and calculators on this website are provided for general educational and informational purposes only and do not constitute medical advice. They are intended to support — not replace — the clinical judgement of qualified healthcare professionals. No warranty is given as to the accuracy or completeness of the information, and the authors accept no liability for any decisions made on its basis. Always consult a qualified healthcare provider regarding any medical condition.";
const esc=(s)=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

class PubShelf extends HTMLElement{
  connectedCallback(){ if(this._done)return; this._done=true; this.attachShadow({mode:"open"}); this._load(); }
  async _load(){
    let data; const src=this.getAttribute("src");
    if(src && src!=="inline"){ try{data=await (await fetch(src)).json();}catch(e){data=[];} }
    else { try{data=JSON.parse(document.getElementById("pubdata").textContent);}catch(e){data=[];} }
    this.data=data||[]; this.render();
  }
  render(){ this.shadowRoot.innerHTML=`<style>${this.css()}</style>${this.html(this.data)}`; this.bind(this.data); }
  css(){return `
  :host{--ink:#12263a;--muted:#5b7189;--azure:#135ba8;--azure2:#2b7de0;--wash:#eef6fe;--line:#d7e6f7;
    display:block;color:var(--ink);font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.55;font-size:15px}
  *{box-sizing:border-box}
  .wrap{max-width:1140px;margin:0 auto;padding:6px 20px 46px}
  .kicker{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--azure);margin:0 0 6px}
  .kicker .k-dot{width:7px;height:7px;border-radius:50%;background:var(--azure2)}
  .lede{color:var(--muted);max-width:660px;margin:0 0 4px;font-size:16px}
  .toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:22px 0 12px;flex-wrap:wrap}
  .count{font-size:13px;color:var(--muted);font-weight:600}
  .arrows{display:flex;gap:8px}
  .arrows button{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--azure);
    font-size:18px;cursor:pointer;display:grid;place-items:center;transition:.15s;box-shadow:0 1px 3px rgba(16,50,90,.06)}
  .arrows button:hover:not(:disabled){background:var(--azure);color:#fff;border-color:var(--azure);transform:translateY(-1px)}
  .arrows button:disabled{opacity:.35;cursor:default}
  .viewport{overflow:hidden;margin:0 -6px}
  .track{display:flex;gap:20px;padding:8px 6px 20px;transition:transform .45s cubic-bezier(.22,.61,.36,1);will-change:transform}
  .card{flex:0 0 300px;width:300px;min-height:404px;border-radius:16px;background:#fff;cursor:pointer;position:relative;overflow:hidden;
    border:1px solid var(--line);box-shadow:0 6px 20px rgba(16,50,90,.09);transition:transform .22s,box-shadow .22s;display:flex;flex-direction:column}
  .card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:9px;background:var(--ac);box-shadow:inset -1px 0 0 rgba(0,0,0,.12);z-index:1}
  .card:hover{transform:translateY(-6px);box-shadow:0 16px 34px rgba(16,50,90,.18)}
  .card:focus-visible{outline:3px solid var(--azure2);outline-offset:2px}
  .c-band{background:var(--ac);color:#fff;padding:16px 18px 14px 24px}
  .c-jrnl{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.96;line-height:1.25}
  .c-meta{font-size:11.5px;opacity:.85;margin-top:3px}
  .c-body{padding:16px 18px 14px 24px;flex:1;display:flex;flex-direction:column}
  .c-type{align-self:flex-start;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ac);
    background:color-mix(in srgb,var(--ac) 12%,#fff);border:1px solid color-mix(in srgb,var(--ac) 28%,#fff);padding:3px 9px;border-radius:99px;margin-bottom:10px}
  .c-title{font-family:Georgia,"Times New Roman",serif;font-size:18.5px;line-height:1.26;font-weight:700;color:#13233a;margin:0 0 10px;
    display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
  .c-auth{font-size:12.5px;color:var(--muted);margin-top:auto;line-height:1.4;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .c-foot{display:flex;align-items:center;gap:8px;padding:12px 18px 14px 24px;border-top:1px solid #eef3f8}
  .c-year{font-size:22px;font-weight:800;color:#13233a;line-height:1;letter-spacing:-.01em}
  .c-badges{margin-left:auto;display:flex;gap:6px;align-items:center}
  .badge{font-size:10.5px;font-weight:800;letter-spacing:.03em;padding:4px 8px;border-radius:6px;text-transform:uppercase}
  .badge.oa{background:#e6f6ec;color:#1c7a43;border:1px solid #b7e6c7}
  .badge.pdf{background:#eef3f8;color:#43566b;border:1px solid #dbe6f1}
  .badge.vid{background:#e9f1fc;color:#1b5fb0;border:1px solid #c7ddf6}
  .c-open{display:flex;align-items:center;gap:6px;padding:12px 18px 16px 24px;color:var(--ac);font-size:13px;font-weight:800}
  .dots{display:flex;gap:7px;justify-content:center;margin-top:2px}
  .dots button{width:8px;height:8px;border-radius:99px;border:0;background:var(--line);cursor:pointer;padding:0;transition:.2s}
  .dots button.on{background:var(--azure);width:22px}
  .cta{color:var(--muted);font-size:13px;text-align:center;margin-top:14px}
  /* modal */
  .ov{position:fixed;inset:0;background:rgba(15,35,58,.55);backdrop-filter:blur(3px);display:none;align-items:flex-start;justify-content:center;
    z-index:99999;padding:34px 16px;overflow:auto}
  .ov.on{display:flex;animation:fade .2s ease}
  @keyframes fade{from{opacity:0}to{opacity:1}}
  .modal{background:#fff;border-radius:18px;max-width:840px;width:100%;box-shadow:0 30px 80px rgba(10,25,50,.4);overflow:hidden;
    animation:pop .28s cubic-bezier(.2,.7,.3,1)}
  @keyframes pop{from{transform:translateY(18px) scale(.97);opacity:0}to{transform:none;opacity:1}}
  .m-band{background:linear-gradient(135deg,var(--ac),color-mix(in srgb,var(--ac) 68%,#0a2f5c));color:#fff;padding:26px 30px 22px;position:relative}
  .m-jrnl{font-size:12.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;opacity:.95}
  .m-cite{font-size:12.5px;opacity:.85;margin-top:4px}
  .m-title{font-family:Georgia,serif;font-size:24px;line-height:1.22;font-weight:700;margin:12px 0 0;max-width:96%}
  .m-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.16);
    color:#fff;font-size:20px;cursor:pointer;display:grid;place-items:center;transition:.15s}
  .m-close:hover{background:rgba(255,255,255,.3);transform:rotate(90deg)}
  .m-body{padding:0 30px 30px}
  .m-tags{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0}
  .tag{font-size:11.5px;font-weight:700;padding:5px 11px;border-radius:99px;background:var(--wash);color:var(--azure);border:1px solid var(--line)}
  .tag.oa{background:#e6f6ec;color:#1c7a43;border-color:#b7e6c7}
  /* tabs */
  .tabs{display:flex;gap:4px;border-bottom:2px solid var(--line);margin:20px 0 0}
  .tabs button{appearance:none;border:0;background:none;font:inherit;font-size:14px;font-weight:700;color:var(--muted);
    padding:11px 15px;cursor:pointer;position:relative;border-radius:8px 8px 0 0;transition:.15s;white-space:nowrap}
  .tabs button:hover{color:var(--azure);background:var(--wash)}
  .tabs button.on{color:var(--azure)}
  .tabs button.on:after{content:"";position:absolute;left:10px;right:10px;bottom:-2px;height:3px;border-radius:3px 3px 0 0;background:var(--azure)}
  .panel{display:none;padding-top:18px;animation:fade .2s ease}
  .panel.on{display:block}
  .abstract{font-size:15.5px;line-height:1.68;color:#26384c}
  .kp{list-style:none;margin:0;padding:0;display:grid;gap:12px}
  .kp li{position:relative;padding-left:30px;font-size:15px;line-height:1.55;color:#26384c}
  .kp li:before{content:"";position:absolute;left:4px;top:7px;width:11px;height:11px;border-radius:50%;
    background:var(--azure);box-shadow:0 0 0 4px var(--wash)}
  .sec-h{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:20px 0 9px}
  .sec-h:first-child{margin-top:2px}
  .authors{display:grid;gap:9px}
  .au{font-size:14px}
  .au b{color:#13233a}
  .au span{color:var(--muted);font-size:12.5px;display:block}
  .kw{display:flex;flex-wrap:wrap;gap:7px}
  .kw span{font-size:12px;background:#f2f7fc;border:1px solid var(--line);color:#3f566e;padding:4px 10px;border-radius:7px}
  video{width:100%;border-radius:12px;margin-top:4px;background:#000;display:block}
  .vcred{font-size:12px;color:var(--muted);margin-top:7px;font-style:italic}
  .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px;padding-top:20px;border-top:1px solid #eef3f8}
  .btn{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:700;padding:11px 18px;border-radius:11px;
    text-decoration:none;cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--azure);transition:.15s}
  .btn:hover{border-color:var(--azure);background:var(--wash)}
  .btn.primary{background:var(--azure);color:#fff;border-color:var(--azure)}
  .btn.primary:hover{background:#0f4e90}
  .btn.solid2{background:#1c7a43;color:#fff;border-color:#1c7a43}
  .btn.solid2:hover{background:#166137}
  .ids{font-size:12.5px;color:var(--muted);margin-top:14px;display:flex;flex-wrap:wrap;gap:14px}
  .ids a{color:var(--azure);text-decoration:none;font-weight:600}
  .ids a:hover{text-decoration:underline}
  .disc{margin-top:38px;background:var(--wash);border:1px solid var(--line);border-radius:14px;padding:16px 20px}
  .disc b{color:var(--azure);font-size:13px;letter-spacing:.02em}
  .disc p{margin:6px 0 0;font-size:12.5px;color:#4a5f74;line-height:1.6}
  .copyr{color:#8194a6;font-size:11.5px;margin-top:8px}
  @media(max-width:560px){.card{flex-basis:82vw;width:82vw}.m-band,.m-body{padding-left:20px;padding-right:20px}.m-title{font-size:21px}}
  `;}
  html(d){
    return `<div class="wrap">
      <p class="kicker"><span class="k-dot"></span>predictepilepsy.com · Peer-reviewed research</p>
      <p class="lede">The science behind the calculators. Swipe through our peer-reviewed papers on predicting seizures and epilepsy — tap any cover for the abstract, key points and full text.</p>
      <div class="toolbar">
        <span class="count">${d.length} publications</span>
        <div class="arrows"><button id="prev" aria-label="Previous">‹</button><button id="next" aria-label="Next">›</button></div>
      </div>
      <div class="viewport"><div class="track" id="track">${d.map((p,i)=>this.card(p,i)).join("")}</div></div>
      <div class="dots" id="dots">${d.map((_,i)=>`<button data-i="${i}" aria-label="Go to ${i+1}"></button>`).join("")}</div>
      <p class="cta">Tap a cover to read the abstract, key points and details →</p>
      <div class="disc"><b>Disclaimer</b><p>${DISCLAIMER}</p><p class="copyr">© 2025 predictepilepsy.com · <a href="mailto:select@usz.ch" style="color:#8194a6">select@usz.ch</a></p></div>
    </div>
    <div class="ov" id="ov"><div class="modal" id="modal" role="dialog" aria-modal="true"></div></div>`;
  }
  card(p,i){
    const badges=[p.oa?`<span class="badge oa">Open</span>`:"",
      p.video?`<span class="badge vid">▶ Video</span>`:(p.links&&p.links.pdf?`<span class="badge pdf">PDF</span>`:"")].join("");
    return `<article class="card" tabindex="0" data-i="${i}" style="--ac:${esc(p.accent)}">
      <div class="c-band"><div class="c-jrnl">${esc(p.journal)}</div><div class="c-meta">${p.year} · Vol ${esc(p.vol)}${p.issue?"("+esc(p.issue)+")":""} · pp ${esc(p.pages)}</div></div>
      <div class="c-body"><span class="c-type">${esc(p.type)}</span>
        <h3 class="c-title">${esc(p.title)}</h3>
        <div class="c-auth">${esc(p.authorsShort)}</div>
      </div>
      <div class="c-foot"><span class="c-year">${p.year}</span><div class="c-badges">${badges}</div></div>
      <div class="c-open">Read more →</div>
    </article>`;
  }
  modalHTML(p){
    const cite=`${esc(p.journalShort)} ${p.year};${esc(p.vol)}${p.issue?"("+esc(p.issue)+")":""}:${esc(p.pages)}`;
    const abst=p.abstract?esc(p.abstract):(p.summary?esc(p.summary):"Abstract not available.");
    const kp=(p.keyPoints||[]);
    const kpPanel=kp.length?`<ul class="kp">${kp.map(k=>`<li>${esc(k)}</li>`).join("")}</ul>`:`<p class="abstract">Key points not available for this publication.</p>`;
    const vid=p.video?`<div class="sec-h">Explainer video</div><video controls preload="metadata" src="${esc(p.video)}"></video><div class="vcred">${esc(p.videoCredit||"")}</div>`:"";
    const au=`<div class="sec-h">Authors</div><div class="authors">${(p.authors||[]).map(a=>`<div class="au"><b>${esc(a.n)}</b><span>${esc(a.a)}</span></div>`).join("")}</div>`;
    const kw=(p.keywords||[]).length?`<div class="sec-h">Topics</div><div class="kw">${p.keywords.map(k=>`<span>${esc(k)}</span>`).join("")}</div>`:"";
    const L=p.links||{};
    const acts=[
      L.journal?`<a class="btn primary" target="_blank" rel="noopener" href="${esc(L.journal)}">Read at ${esc(p.journalShort)} ↗</a>`:"",
      L.pdf?`<a class="btn solid2" target="_blank" rel="noopener" href="${esc(L.pdf)}">↓ Free PDF</a>`:"",
      L.pmc?`<a class="btn" target="_blank" rel="noopener" href="${esc(L.pmc)}">PubMed Central ↗</a>`:"",
      `<button class="btn" id="cite">⧉ Copy citation</button>`
    ].filter(Boolean).join("");
    const ids=[
      `DOI <a target="_blank" rel="noopener" href="https://doi.org/${esc(p.doi)}">${esc(p.doi)}</a>`,
      p.pmid?`PMID <a target="_blank" rel="noopener" href="https://pubmed.ncbi.nlm.nih.gov/${esc(p.pmid)}/">${esc(p.pmid)}</a>`:"",
      p.pmcid?`PMCID ${esc(p.pmcid)}`:"", p.erratum?esc(p.erratum):""
    ].filter(Boolean).join(" &nbsp;·&nbsp; ");
    const tags=[`<span class="tag">${esc(p.type)}</span>`,p.oa?`<span class="tag oa">Open Access</span>`:"",`<span class="tag">${p.year}</span>`].join("");
    return `<div class="m-band" style="--ac:${esc(p.accent)}">
        <button class="m-close" id="mclose" aria-label="Close">×</button>
        <div class="m-jrnl">${esc(p.journal)}</div><div class="m-cite">${cite}</div>
        <div class="m-title">${esc(p.title)}</div>
      </div>
      <div class="m-body">
        <div class="m-tags">${tags}</div>
        <div class="tabs" role="tablist">
          <button class="on" data-t="0" role="tab">${p.abstract?"Abstract":"Summary"}</button>
          <button data-t="1" role="tab">Key points</button>
          <button data-t="2" role="tab">Details</button>
        </div>
        <div class="panel on" data-p="0"><div class="abstract">${abst}</div></div>
        <div class="panel" data-p="1">${kpPanel}</div>
        <div class="panel" data-p="2">${au}${kw}${vid}</div>
        <div class="actions">${acts}</div>
        <div class="ids">${ids}</div>
      </div>`;
  }
  bind(d){
    const r=this.shadowRoot, track=r.getElementById("track"), vp=track.parentElement;
    const cards=[...r.querySelectorAll(".card")], dots=[...r.querySelectorAll("#dots button")];
    let idx=0;
    const step=()=>{const c=cards[0];return c?c.offsetWidth+20:320;};
    const perView=()=>Math.max(1,Math.floor(vp.clientWidth/step()));
    const maxIdx=()=>Math.max(0,d.length-perView());
    const go=(i)=>{idx=Math.min(Math.max(0,i),maxIdx());track.style.transform=`translateX(${-idx*step()}px)`;
      r.getElementById("prev").disabled=idx<=0;r.getElementById("next").disabled=idx>=maxIdx();
      dots.forEach((b,j)=>b.classList.toggle("on",j>=idx&&j<idx+perView()));};
    r.getElementById("prev").onclick=()=>go(idx-1);
    r.getElementById("next").onclick=()=>go(idx+1);
    dots.forEach(b=>b.onclick=()=>go(+b.dataset.i));
    window.addEventListener("resize",()=>go(idx));
    go(0);
    const ov=r.getElementById("ov"), modal=r.getElementById("modal");
    const open=(i)=>{const p=d[i];modal.innerHTML=this.modalHTML(p);ov.classList.add("on");document.body.style.overflow="hidden";
      modal.querySelector("#mclose").onclick=close;
      const tabs=[...modal.querySelectorAll(".tabs button")], panels=[...modal.querySelectorAll(".panel")];
      tabs.forEach(t=>t.onclick=()=>{tabs.forEach(x=>x.classList.remove("on"));panels.forEach(x=>x.classList.remove("on"));
        t.classList.add("on");panels[+t.dataset.t].classList.add("on");
        const v=modal.querySelector("video");if(v&&+t.dataset.t!==2)v.pause();});
      const cb=modal.querySelector("#cite");if(cb)cb.onclick=()=>{const t=`${p.authorsShort}. ${p.title}. ${p.journalShort}. ${p.year};${p.vol}${p.issue?"("+p.issue+")":""}:${p.pages}. doi:${p.doi}`;
        navigator.clipboard&&navigator.clipboard.writeText(t);cb.textContent="✓ Copied";setTimeout(()=>cb.textContent="⧉ Copy citation",1600);};};
    const close=()=>{ov.classList.remove("on");document.body.style.overflow="";const v=modal.querySelector("video");if(v)v.pause();};
    cards.forEach(c=>{c.onclick=()=>open(+c.dataset.i);c.onkeydown=(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open(+c.dataset.i);}};});
    ov.onclick=(e)=>{if(e.target===ov)close();};
    document.addEventListener("keydown",(e)=>{if(e.key==="Escape"&&ov.classList.contains("on"))close();});
  }
}
customElements.define("pub-shelf",PubShelf);
})();
