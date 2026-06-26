/* ============================================================
   Majo — site behaviour
   · injects the hover "peek" rabbit into every .peek slot
   · injects the rabbit-hole loader + plays it on navigation
   · 3 transition variants (dive / fall / iris)
   · vanilla Tweaks panel (host protocol + localStorage)
   ============================================================ */
(function () {
  "use strict";

  var LS = "majo.tweaks.v1";
  var DEFAULTS = { variant: "dive", dur: 1500, accent: "#0cbadc" };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function load() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(LS) || "{}")); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function save(t) { try { localStorage.setItem(LS, JSON.stringify(t)); } catch (e) {} }
  var T = load();

  function applyAccent() {
    document.documentElement.style.setProperty("--accent", T.accent || "transparent");
  }

  /* ---------- SVG art ---------- */
  var RABBIT_SVG =
    '<svg viewBox="0 0 30 34" aria-hidden="true">' +
    '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 20 C8 12 8 4 11 2 C13.4 4 13.6 13 13.4 20"/>' +
    '<path d="M18 20 C22 12 22 4 19 2 C16.6 4 16.4 13 16.6 20"/>' +
    '<circle cx="15" cy="25" r="6.4"/>' +
    '</g></svg>';

  var PEEK_SVG = '<span class="hole"></span>' + RABBIT_SVG;

  // engraving-style rabbit for the loader
  var RABBIT_BIG =
    '<svg viewBox="0 0 120 150" aria-hidden="true">' +
      '<g class="rh-ink">' +
        // ears
        '<path d="M44 78 C30 50 28 18 40 8 C50 16 50 52 50 78"/>' +
        '<path d="M76 78 C90 50 92 18 80 8 C70 16 70 52 70 78"/>' +
        // inner ear lines
        '<path d="M42 70 C34 50 34 26 41 18" stroke-width="3"/>' +
        '<path d="M78 70 C86 50 86 26 79 18" stroke-width="3"/>' +
        // head
        '<circle cx="60" cy="96" r="26"/>' +
        // face hints
        '<path d="M60 96 C60 104 56 110 52 113" stroke-width="3"/>' +
        '<path d="M60 96 C60 104 64 110 68 113" stroke-width="3"/>' +
      '</g>' +
      '<circle class="rh-fill" cx="50" cy="92" r="3.4"/>' +
      '<circle class="rh-fill" cx="70" cy="92" r="3.4"/>' +
      '<path class="rh-fill" d="M56 102 h8 l-4 5 z"/>' +
    '</svg>';

  function flySvg(kind) {
    // tiny ink ephemera that drift past during the "fall"
    if (kind === "clock")
      return '<svg width="46" height="46" viewBox="0 0 46 46"><g class="rh-ink"><circle cx="23" cy="23" r="18"/><path d="M23 23V11M23 23l9 6"/></g></svg>';
    if (kind === "key")
      return '<svg width="30" height="58" viewBox="0 0 30 58"><g class="rh-ink"><circle cx="15" cy="13" r="9"/><path d="M15 22v30M15 44h9M15 38h7"/></g></svg>';
    if (kind === "cup")
      return '<svg width="52" height="40" viewBox="0 0 52 40"><g class="rh-ink"><path d="M6 8h32v14a16 16 0 0 1-32 0z"/><path d="M38 11h6a6 6 0 0 1 0 12h-6"/><path d="M4 36h40"/></g></svg>';
    return '<svg width="40" height="54" viewBox="0 0 40 54"><g class="rh-ink"><rect x="6" y="4" width="28" height="46" rx="3"/><path d="M20 12l4 8h-8zM20 42a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" stroke-width="3"/></g></svg>';
  }

  /* ---------- build loader DOM ---------- */
  var rh = document.createElement("div");
  rh.className = "rh";
  rh.setAttribute("role", "status");
  rh.setAttribute("aria-live", "polite");
  rh.innerHTML =
    '<div class="rh-strip"><span>The Rabbit Hole</span><span class="rule"></span><span class="rh-issue">No. &mdash;</span></div>' +
    '<div class="rh-lines">' +
      '<i style="left:14%"></i><i style="left:30%;height:30%"></i><i style="left:48%;height:46%"></i>' +
      '<i style="left:64%;height:28%"></i><i style="left:82%;height:40%"></i>' +
    '</div>' +
    '<div class="rh-fly f1" style="left:16%;top:0">' + flySvg("clock") + '</div>' +
    '<div class="rh-fly f2" style="left:74%;top:0">' + flySvg("cup") + '</div>' +
    '<div class="rh-fly f3" style="left:30%;top:0">' + flySvg("key") + '</div>' +
    '<div class="rh-fly f4" style="left:60%;top:0">' + flySvg("card") + '</div>' +
    '<div class="rh-iris"></div>' +
    '<div class="rh-stage">' +
      '<div class="rh-rabbit">' + RABBIT_BIG + '</div>' +
      '<div class="rh-hole"></div>' +
    '</div>' +
    '<div class="rh-cap">' +
      '<div class="digging">Down the hole<span class="dots"><span>.</span><span>.</span><span>.</span></span></div>' +
      '<div class="dest"></div>' +
    '</div>';

  /* ---------- run the transition then navigate ---------- */
  var busy = false;
  function dig(href, label) {
    if (busy) return;
    busy = true;

    rh.setAttribute("data-variant", T.variant);
    rh.style.setProperty("--dur", (T.dur || 1500) + "ms");
    rh.querySelector(".dest").textContent = label ? "\u2192 " + label : "";
    rh.querySelector(".rh-issue").innerHTML = "No.&nbsp;" + (Math.floor(Math.random() * 89) + 10);
    rh.classList.add("on");
    // reflow, then play the dive — this signature moment always animates
    void rh.offsetWidth;
    rh.classList.add("run");

    var dur = (T.dur || 1500);
    var wait = T.variant === "iris" ? dur * 0.92 : (T.variant === "fall" ? dur * 0.82 : dur * 0.86);
    setTimeout(function () { if (href) window.location.href = href; }, wait);
  }

  // preview only — plays then fades back out (no navigation)
  function preview() {
    if (busy) return;
    busy = true;
    rh.setAttribute("data-variant", T.variant);
    rh.style.setProperty("--dur", (T.dur || 1500) + "ms");
    rh.querySelector(".dest").textContent = "\u2192 preview";
    rh.querySelector(".rh-issue").innerHTML = "No.&nbsp;" + (Math.floor(Math.random() * 89) + 10);
    rh.classList.add("on");
    void rh.offsetWidth;
    rh.classList.add("run");
    var dur = (T.dur || 1500);
    setTimeout(function () {
      rh.classList.add("fade");
      setTimeout(function () {
        rh.classList.remove("on", "run", "fade");
        busy = false;
      }, 360);
    }, dur);
  }

  /* ---------- wire up ---------- */
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    applyAccent();
    document.body.appendChild(rh);

    // fill every peek slot
    Array.prototype.forEach.call(document.querySelectorAll(".peek"), function (p) {
      if (!p.children.length) p.innerHTML = PEEK_SVG;
    });

    // give every chip its own dot-burrow rabbit
    Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (c) {
      if (c.querySelector(".cpeek")) return;
      var cp = document.createElement("span");
      cp.className = "cpeek";
      cp.innerHTML = '<span class="chole"></span>' + RABBIT_SVG;
      var dot = c.querySelector(".dot");
      if (dot) c.replaceChild(cp, dot);
      else c.insertBefore(cp, c.firstChild);
    });

    // intercept rabbit-hole links
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-dig]");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
      e.preventDefault();
      var label = a.getAttribute("data-label") || a.textContent.trim();
      dig(href, label);
    });

    buildPanel();

    // image lazy-load: shimmer while in-flight, fade in on arrival
    document.querySelectorAll('img').forEach(function(img) {
      if (img.complete && img.naturalWidth > 0) return;
      img.classList.add('img-loading');
      function reveal() {
        img.classList.remove('img-loading');
        img.classList.add('img-loaded');
        img.removeEventListener('load', reveal);
        img.removeEventListener('error', reveal);
      }
      img.addEventListener('load', reveal);
      img.addEventListener('error', reveal);
      // guard against the load event firing before listeners attach
      if (img.complete && img.naturalWidth > 0) reveal();
    });
  });

  /* ===========================================================
     Vanilla Tweaks panel — host protocol + localStorage
     =========================================================== */
  var panelOpen = false, panelEl = null;

  var PANEL_CSS =
    ".mt-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:262px;" +
      "background:#fbfbfa;color:#141414;border:1px solid #141414;" +
      "font-family:'IBM Plex Mono',monospace;font-size:12px;display:none;" +
      "box-shadow:0 18px 50px rgba(0,0,0,.22)}" +
    ".mt-panel.open{display:block}" +
    ".mt-hd{display:flex;align-items:center;justify-content:space-between;" +
      "padding:11px 12px;border-bottom:1px solid #141414;cursor:move;user-select:none}" +
    ".mt-hd b{font-weight:600;font-size:11px;letter-spacing:.2em;text-transform:uppercase}" +
    ".mt-x{border:0;background:none;font-family:inherit;font-size:15px;cursor:pointer;color:#8a8a8a;line-height:1;padding:2px 4px}" +
    ".mt-x:hover{color:#141414}" +
    ".mt-body{padding:14px 12px 16px;display:flex;flex-direction:column;gap:16px}" +
    ".mt-sec{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8a8a8a;margin-bottom:9px}" +
    ".mt-seg{display:flex;border:1px solid #d7d7d7}" +
    ".mt-seg button{flex:1;border:0;border-right:1px solid #d7d7d7;background:#fff;font-family:inherit;" +
      "font-size:11px;letter-spacing:.04em;padding:8px 4px;cursor:pointer;color:#3a3a3a;text-transform:capitalize}" +
    ".mt-seg button:last-child{border-right:0}" +
    ".mt-seg button.sel{background:#141414;color:#fff}" +
    ".mt-rng{display:flex;align-items:center;gap:10px}" +
    ".mt-rng input{flex:1;accent-color:#141414}" +
    ".mt-rng .v{font-size:11px;color:#8a8a8a;min-width:54px;text-align:right;font-variant-numeric:tabular-nums}" +
    ".mt-sw{display:flex;gap:8px}" +
    ".mt-sw button{width:30px;height:30px;border:1px solid #d7d7d7;cursor:pointer;padding:0;position:relative}" +
    ".mt-sw button.sel{outline:2px solid #141414;outline-offset:1px}" +
    ".mt-sw button .x{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8a8a8a;font-size:13px}" +
    ".mt-btn{border:1px solid #141414;background:#fff;font-family:inherit;font-size:11px;letter-spacing:.12em;" +
      "text-transform:uppercase;padding:10px;cursor:pointer;width:100%}" +
    ".mt-btn:hover{background:#141414;color:#fff}";

  function buildPanel() {
    var style = document.createElement("style");
    style.textContent = PANEL_CSS;
    document.head.appendChild(style);

    panelEl = document.createElement("div");
    panelEl.className = "mt-panel";
    panelEl.innerHTML =
      '<div class="mt-hd"><b>Tweaks</b><button class="mt-x" aria-label="Close">\u00d7</button></div>' +
      '<div class="mt-body">' +
        '<div><div class="mt-sec">Rabbit-hole transition</div>' +
          '<div class="mt-seg" data-k="variant">' +
            '<button data-v="dive">dive</button>' +
            '<button data-v="fall">fall</button>' +
            '<button data-v="iris">iris</button>' +
          '</div></div>' +
        '<div><div class="mt-sec">Pace</div>' +
          '<div class="mt-rng"><input type="range" min="700" max="2600" step="100" data-k="dur">' +
          '<span class="v"></span></div></div>' +
        '<div><div class="mt-sec">Accent</div>' +
          '<div class="mt-sw" data-k="accent">' +
            '<button data-v="#0cbadc" style="background:#0cbadc"></button>' +
            '<button data-v="#9C8CCB" style="background:#9C8CCB"></button>' +
            '<button data-v="#C58F6B" style="background:#C58F6B"></button>' +
            '<button data-v="none" style="background:#fff"><span class="x">/</span></button>' +
          '</div></div>' +
        '<button class="mt-btn" data-act="preview">Preview transition</button>' +
      '</div>';
    document.body.appendChild(panelEl);

    syncPanel();

    panelEl.querySelector(".mt-x").addEventListener("click", dismiss);
    panelEl.querySelector('[data-act="preview"]').addEventListener("click", preview);

    panelEl.querySelector('[data-k="variant"]').addEventListener("click", function (e) {
      var b = e.target.closest("button[data-v]"); if (!b) return;
      set("variant", b.getAttribute("data-v"));
    });
    panelEl.querySelector('[data-k="accent"]').addEventListener("click", function (e) {
      var b = e.target.closest("button[data-v]"); if (!b) return;
      var v = b.getAttribute("data-v");
      set("accent", v === "none" ? "transparent" : v);
      applyAccent();
    });
    var rng = panelEl.querySelector('[data-k="dur"]');
    rng.addEventListener("input", function () {
      set("dur", parseInt(rng.value, 10));
      panelEl.querySelector(".mt-rng .v").textContent = (T.dur / 1000).toFixed(1) + "s";
    });

    enableDrag(panelEl.querySelector(".mt-hd"), panelEl);

    // host protocol
    window.addEventListener("message", function (e) {
      var t = e && e.data && e.data.type;
      if (t === "__activate_edit_mode") openPanel();
      else if (t === "__deactivate_edit_mode") closePanel();
    });
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}
  }

  function set(k, v) {
    T[k] = v; save(T); syncPanel();
    try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { majoTweaks: JSON.stringify(T) } }, "*"); } catch (e) {}
  }
  function syncPanel() {
    if (!panelEl) return;
    Array.prototype.forEach.call(panelEl.querySelectorAll('[data-k="variant"] button'), function (b) {
      b.classList.toggle("sel", b.getAttribute("data-v") === T.variant);
    });
    var acc = (T.accent === "transparent") ? "none" : T.accent;
    Array.prototype.forEach.call(panelEl.querySelectorAll('[data-k="accent"] button'), function (b) {
      b.classList.toggle("sel", b.getAttribute("data-v") === acc);
    });
    var rng = panelEl.querySelector('[data-k="dur"]');
    if (rng) { rng.value = T.dur; panelEl.querySelector(".mt-rng .v").textContent = (T.dur / 1000).toFixed(1) + "s"; }
  }
  function openPanel() { panelOpen = true; if (panelEl) panelEl.classList.add("open"); }
  function closePanel() { panelOpen = false; if (panelEl) panelEl.classList.remove("open"); }
  function dismiss() {
    closePanel();
    try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch (e) {}
  }

  function enableDrag(handle, panel) {
    var sx, sy, sr, sb;
    handle.addEventListener("mousedown", function (e) {
      if (e.target.closest(".mt-x")) return;
      var r = panel.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY;
      sr = window.innerWidth - r.right; sb = window.innerHeight - r.bottom;
      function mv(ev) {
        panel.style.right = Math.max(8, sr - (ev.clientX - sx)) + "px";
        panel.style.bottom = Math.max(8, sb - (ev.clientY - sy)) + "px";
      }
      function up() { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); }
      document.addEventListener("mousemove", mv);
      document.addEventListener("mouseup", up);
      e.preventDefault();
    });
  }
})();
