/* SELECT-A2HS v1 — mobile "Add to Home Screen / Install app" prompt for select-consortium.com.
 * Standalone: loaded with a single <script src> in the site-wide header (the consortium site does
 * not use the calculator components). Same behaviour as pep-a2hs.js but with SeLECT branding
 * (lime #accc0c, the consortium's own "Se" mark) and its own web manifest.
 * No service worker (host WAF), so: iOS gets a real standalone home-screen app; Android uses the
 * manifest + beforeinstallprompt when offered, else a manual "Add to Home screen" hint. */
(function () {
  if (window.__selectA2HS) return;
  window.__selectA2HS = 1;
  var W = window, D = document, LS = "selectA2HSdismiss";

  function cdnBase() {
    var m = null;
    (D.scripts ? [].slice.call(D.scripts) : []).some(function (s) {
      if (s.src && /predictepilepsy-riskcalc@[0-9a-f]{7,40}/.test(s.src)) {
        m = s.src.replace(/\/(select-a2hs|pep-a2hs|risk-calculator|calc-finder|calc-home)\.js.*$/, ""); return true;
      }
      return false;
    });
    return m || "https://cdn.jsdelivr.net/gh/sbrka/predictepilepsy-riskcalc@main";
  }
  var BASE = cdnBase(), ICON = BASE + "/icons/select-app-icon-192.png", GREEN = "#accc0c";

  function head(tag, attrs) { var el = D.createElement(tag); for (var a in attrs) el.setAttribute(a, attrs[a]); D.head.appendChild(el); }
  function ensureMeta() {
    if (!D.querySelector('link[rel="manifest"]'))
      head("link", { rel: "manifest", href: BASE + "/select-manifest.webmanifest", crossorigin: "anonymous" });
    if (!D.querySelector('meta[name="theme-color"]')) head("meta", { name: "theme-color", content: GREEN });
    head("link", { rel: "apple-touch-icon", href: BASE + "/icons/select-app-icon-180.png" });
    if (!D.querySelector('meta[name="apple-mobile-web-app-capable"]')) head("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    if (!D.querySelector('meta[name="mobile-web-app-capable"]')) head("meta", { name: "mobile-web-app-capable", content: "yes" });
    if (!D.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) head("meta", { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" });
    if (!D.querySelector('meta[name="apple-mobile-web-app-title"]')) head("meta", { name: "apple-mobile-web-app-title", content: "SeLECT" });
  }

  var deferred = null;
  W.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });

  function isStandalone() { return (W.matchMedia && W.matchMedia("(display-mode: standalone)").matches) || W.navigator.standalone === true; }
  function isMobile() { return (W.matchMedia && (W.matchMedia("(max-width: 860px)").matches || W.matchMedia("(pointer: coarse)").matches)); }
  function isIOS() { var ua = navigator.userAgent || ""; return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in D); }
  function dismissedRecently() { try { var t = +localStorage.getItem(LS) || 0; return (Date.now() - t) < 30 * 864e5; } catch (e) { return false; } }

  function css() {
    if (D.getElementById("select-a2hs-css")) return;
    var s = D.createElement("style"); s.id = "select-a2hs-css";
    s.textContent =
      '#selectA2HS{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483000;' +
      'background:#fff;border:1px solid #e2e8d0;border-radius:16px;box-shadow:0 10px 34px rgba(40,58,6,.24);' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#1e2600;' +
      'padding:13px 14px;display:flex;gap:12px;align-items:center;max-width:520px;margin:0 auto;' +
      'transform:translateY(140%);transition:transform .34s cubic-bezier(.2,.8,.2,1)}' +
      '#selectA2HS.show{transform:translateY(0)}' +
      '#selectA2HS .ic{width:46px;height:46px;border-radius:12px;flex:0 0 auto;box-shadow:0 3px 10px rgba(40,58,6,.28)}' +
      '#selectA2HS .tx{flex:1;min-width:0}' +
      '#selectA2HS .tt{font-weight:750;font-size:14.5px;line-height:1.2}' +
      '#selectA2HS .ts{font-size:12.5px;color:#5a6b3a;margin-top:3px;line-height:1.35}' +
      '#selectA2HS .ts b{color:#5a7302}' +
      '#selectA2HS .btn{border:0;background:linear-gradient(150deg,#b8d61a,#8fae06);color:#1e2600;font-weight:800;' +
      'font-size:13.5px;padding:9px 15px;border-radius:999px;cursor:pointer;flex:0 0 auto;white-space:nowrap}' +
      '#selectA2HS .x{border:0;background:transparent;color:#9aa88a;font-size:20px;line-height:1;cursor:pointer;flex:0 0 auto;padding:2px 4px;align-self:flex-start}' +
      '@media(prefers-reduced-motion:reduce){#selectA2HS{transition:none}}' +
      '@media(prefers-color-scheme:dark){#selectA2HS{background:#1c2210;border-color:#333d1d;color:#eef3e2}#selectA2HS .ts{color:#b6c49a}#selectA2HS .ts b{color:#c2dd3a}}';
    D.head.appendChild(s);
  }

  function close(persist) {
    var b = D.getElementById("selectA2HS"); if (!b) return;
    b.classList.remove("show"); setTimeout(function () { b.remove(); }, 360);
    if (persist) { try { localStorage.setItem(LS, Date.now()); } catch (e) {} }
  }

  function show() {
    if (D.getElementById("selectA2HS")) return;
    css();
    var ios = isIOS();
    var line = deferred ? "Quick access to the SeLECT Consortium, one tap away."
      : (ios ? 'Tap <b>Share&nbsp;&#x2191;</b>, then <b>Add to Home&nbsp;Screen</b>.'
             : 'Open the browser <b>&#8942;&nbsp;menu</b>, then <b>Add to Home&nbsp;screen</b>.');
    var action = deferred ? '<button class="btn" id="selInstall">Install</button>' : '';
    var wrap = D.createElement("div"); wrap.id = "selectA2HS";
    wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-label", "Add SeLECT to your home screen");
    wrap.innerHTML =
      '<img class="ic" src="' + ICON + '" alt="" width="46" height="46">' +
      '<div class="tx"><div class="tt">Add to home screen</div><div class="ts">' + line + '</div></div>' +
      action + '<button class="x" id="selClose" aria-label="Dismiss">&times;</button>';
    D.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add("show"); });
    var ib = D.getElementById("selInstall");
    if (ib) ib.addEventListener("click", function () {
      if (!deferred) return; deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; close(true); });
    });
    D.getElementById("selClose").addEventListener("click", function () { close(true); });
  }

  function boot() { try { ensureMeta(); } catch (e) {} if (!isStandalone() && isMobile() && !dismissedRecently()) setTimeout(show, 1200); }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", boot); else boot();
})();
