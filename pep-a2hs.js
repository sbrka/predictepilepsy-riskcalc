/* PEP-A2HS v1 — mobile "Add to Home Screen / Install app" prompt for predictepilepsy.com.
 * Appended to risk-calculator.js / calc-finder.js / calc-home.js so it runs on every page.
 * No service worker (the site's WAF blocks same-origin JS), so: iOS gets a real home-screen
 * app via apple-touch-icon + apple-mobile-web-app-capable (opens standalone); Android/Chrome
 * uses the web manifest (name/icon) and the beforeinstallprompt when available, else a manual
 * "Add to Home screen" hint. Self-contained, runs once, dismissible, respects reduced-motion. */
(function () {
  if (window.__pepA2HS) return;            // run once even if several components load it
  window.__pepA2HS = 1;
  var W = window, D = document, LS = "pepA2HSdismiss";

  function cdnBase() {
    var m = null;
    (D.scripts ? [].slice.call(D.scripts) : []).some(function (s) {
      if (s.src && /predictepilepsy-riskcalc@[0-9a-f]{7,40}/.test(s.src)) {
        m = s.src.replace(/\/(risk-calculator|calc-finder|calc-home|pep-a2hs)\.js.*$/, ""); return true;
      }
      return false;
    });
    return m || "https://cdn.jsdelivr.net/gh/sbrka/predictepilepsy-riskcalc@main";
  }
  var BASE = cdnBase(), ICON = BASE + "/icons/app-icon-192.png";

  function head(tag, attrs) {
    for (var k in attrs) { /* skip if an equivalent tag already exists */ }
    var el = D.createElement(tag);
    for (var a in attrs) el.setAttribute(a, attrs[a]);
    D.head.appendChild(el); return el;
  }
  function ensureMeta() {
    if (!D.querySelector('link[rel="manifest"]'))
      head("link", { rel: "manifest", href: BASE + "/manifest.webmanifest", crossorigin: "anonymous" });
    if (!D.querySelector('meta[name="theme-color"]'))
      head("meta", { name: "theme-color", content: "#135ba8" });
    if (!D.querySelector('link[rel="apple-touch-icon"]'))
      head("link", { rel: "apple-touch-icon", href: BASE + "/icons/app-icon-180.png" });
    if (!D.querySelector('meta[name="apple-mobile-web-app-capable"]'))
      head("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    if (!D.querySelector('meta[name="mobile-web-app-capable"]'))
      head("meta", { name: "mobile-web-app-capable", content: "yes" });
    if (!D.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]'))
      head("meta", { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" });
    if (!D.querySelector('meta[name="apple-mobile-web-app-title"]'))
      head("meta", { name: "apple-mobile-web-app-title", content: "predictepilepsy" });
  }

  var deferred = null;
  W.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });

  function isStandalone() {
    return (W.matchMedia && W.matchMedia("(display-mode: standalone)").matches) || W.navigator.standalone === true;
  }
  function isMobile() {
    return (W.matchMedia && (W.matchMedia("(max-width: 860px)").matches || W.matchMedia("(pointer: coarse)").matches));
  }
  function isIOS() {
    var ua = navigator.userAgent || "";
    return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in D);
  }
  function dismissedRecently() {
    try { var t = +localStorage.getItem(LS) || 0; return (Date.now() - t) < 30 * 864e5; } catch (e) { return false; }
  }

  function css() {
    if (D.getElementById("pep-a2hs-css")) return;
    var s = D.createElement("style"); s.id = "pep-a2hs-css";
    s.textContent =
      '#pepA2HS{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483000;' +
      'background:#fff;border:1px solid #dce6f0;border-radius:16px;box-shadow:0 10px 34px rgba(14,40,74,.24);' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#16202b;' +
      'padding:13px 14px;display:flex;gap:12px;align-items:center;max-width:520px;margin:0 auto;' +
      'transform:translateY(140%);transition:transform .34s cubic-bezier(.2,.8,.2,1)}' +
      '#pepA2HS.show{transform:translateY(0)}' +
      '#pepA2HS .ic{width:46px;height:46px;border-radius:12px;flex:0 0 auto;box-shadow:0 3px 10px rgba(14,40,74,.28)}' +
      '#pepA2HS .tx{flex:1;min-width:0}' +
      '#pepA2HS .tt{font-weight:750;font-size:14.5px;line-height:1.2}' +
      '#pepA2HS .ts{font-size:12.5px;color:#5c6a78;margin-top:3px;line-height:1.35}' +
      '#pepA2HS .ts b{color:#135ba8}' +
      '#pepA2HS .btn{border:0;background:linear-gradient(150deg,#2472c8,#0e4a8a);color:#fff;font-weight:700;' +
      'font-size:13.5px;padding:9px 15px;border-radius:999px;cursor:pointer;flex:0 0 auto;white-space:nowrap}' +
      '#pepA2HS .x{border:0;background:transparent;color:#98a6b5;font-size:20px;line-height:1;cursor:pointer;' +
      'flex:0 0 auto;padding:2px 4px;align-self:flex-start}' +
      '@media(prefers-reduced-motion:reduce){#pepA2HS{transition:none}}' +
      '@media(prefers-color-scheme:dark){#pepA2HS{background:#17222c;border-color:#283743;color:#e7eef4}' +
      '#pepA2HS .ts{color:#9fb0be}}';
    D.head.appendChild(s);
  }

  function close(persist) {
    var b = D.getElementById("pepA2HS"); if (!b) return;
    b.classList.remove("show");
    setTimeout(function () { b.remove(); }, 360);
    if (persist) { try { localStorage.setItem(LS, Date.now()); } catch (e) {} }
  }

  function show() {
    if (D.getElementById("pepA2HS")) return;
    css();
    var ios = isIOS();
    var wrap = D.createElement("div"); wrap.id = "pepA2HS"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-label", "Add predictepilepsy to your home screen");
    var line = deferred
      ? "Quick, one-tap access to this calculator."
      : (ios
        ? 'Tap <b>Share&nbsp;&#x2191;</b>, then <b>Add to Home&nbsp;Screen</b>.'
        : 'Open the browser <b>&#8942;&nbsp;menu</b>, then <b>Add to Home&nbsp;screen</b>.');
    var action = deferred ? '<button class="btn" id="pepInstall">Install</button>' : '';
    wrap.innerHTML =
      '<img class="ic" src="' + ICON + '" alt="" width="46" height="46">' +
      '<div class="tx"><div class="tt">Add to home screen</div>' +
      '<div class="ts">' + line + '</div></div>' +
      action +
      '<button class="x" id="pepClose" aria-label="Dismiss">&times;</button>';
    D.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add("show"); });
    var ib = D.getElementById("pepInstall");
    if (ib) ib.addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; close(true); });
    });
    D.getElementById("pepClose").addEventListener("click", function () { close(true); });
  }

  function maybeShow() {
    if (isStandalone() || !isMobile() || dismissedRecently()) return;
    setTimeout(show, 1200);
  }

  function boot() { try { ensureMeta(); } catch (e) {} maybeShow(); }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", boot); else boot();
})();
