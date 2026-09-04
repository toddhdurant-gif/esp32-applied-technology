// home_port.js - Home Port (S-17) admin page for ESPHome web_server, via js_include.
// Copyright (c) 2026 Todd Durant. MIT License - see LICENSE at the repository root.
// Part of Toddlets: https://github.com/toddhdurant-gif/esp32-applied-technology/tree/main/toddlets
// ===========================================================================
// HOME PORT (S-17) - Display 2 / wp47d2
// Fleet standard web page. Design approved by Todd 2026-08-30.
//
// 2026-09-04 (Todd, from his phone, three asks on the rendered page):
//   1. LIVE SCREEN opens a LIVE VIEW in the page itself - a frame every few
//      seconds from :8082/screenshot, one request in flight, last good frame
//      kept on a miss. Before this the card linked ONE JPEG, which is a shot,
//      not a live view. Same polling logic as tools/displayshot_live.html.
//      Deep link: http://<ip>/#live opens straight into it.
//   2. The floating WIRING and DISPLAYSHOT corner buttons moved UP into the
//      services panel as cards, same style as the rest ("for consistency").
//      Everything else on the page is unchanged ("I really like everything
//      you also have there").
//   3. UPDATE badge was hardcoded yellow while its chip said "OTA ready" -
//      read as "update needed". Yellow means degraded in this page's idiom,
//      so it is green now.
//   Also: the footer no longer claims "works offline" - the stock UI still
//   loads from oi.esphome.io until `web_server: local: true` ships
//   (standard 17a forbids printing the claim before that).
//
// This file REPLACES web/displayshot_button.js and carries ALL of its prior
// behaviour forward:
//   1. the DISPLAYSHOT link  (fleet F17 / FM-16) - now the DisplayShot CARD
//   2. the newest-on-top on-page log  (fleet standard, Todd 2026-08-27)
// ESPHome's `js_include:` accepts exactly ONE file, which is why they merged.
//
// SELF-CONTAINED ON PURPOSE. No web fonts, no CDN, no external calls.
//
// Density idiom is Todd's Domotz reference: every icon carries a state-
// coloured badge on its lower-right corner, so reachable / degraded / not-
// fitted reads before any word does.
// ===========================================================================
(function () {
  'use strict';

  var HOST = location.hostname;
  var SHOT_URL = 'http://' + HOST + ':8082/screenshot';

  // ---------------------------------------------------------------------
  // >>>  THE ONE LINE YOU CHANGE  <<<   (pattern copied from Crow 2's
  // web/device_buttons.js - operator edition points at HA's www share, so the
  // drawings can be replaced without reflashing.)
  // ---------------------------------------------------------------------
  var WIRING_URL = 'http://<ha-ip>:8123/local/<device>/aswired.html';

  // ---- palette (approved mockup) ----------------------------------------
  var CSS = `
  :root{
    --hp-ground:#0B1016; --hp-surface:#131C26; --hp-surface2:#182430;
    --hp-hull:#1D2A38; --hp-line:#26374A;
    --hp-ink:#DCE6F0; --hp-dim:#8FA3B8; --hp-faint:#63788D;
    --hp-accent:#FFA630; --hp-accent-ink:#1A1206;
    --hp-good:#3FCF8E; --hp-warn:#F2C14E; --hp-crit:#FF5C5C;
    --hp-info:#4FA8E8; --hp-idle:#5A7086;
    --hp-cond:"Barlow Condensed","Roboto Condensed","Arial Narrow",
              "Helvetica Neue Condensed",system-ui,sans-serif;
    --hp-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace;
  }
  body{
    background:var(--hp-ground)!important; color:var(--hp-ink)!important;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif!important;
    margin:0!important;
  }
  #hp{max-width:1180px;margin:0 auto;padding:20px 16px 8px}
  .hp-lbl{font-family:var(--hp-cond);font-weight:600;text-transform:uppercase;
    letter-spacing:.09em;color:var(--hp-faint);font-size:13px;line-height:1}
  .hp-mono{font-family:var(--hp-mono);font-variant-numeric:tabular-nums}

  .hp-mast{display:flex;background:var(--hp-surface);border:1px solid var(--hp-line);
    border-radius:14px 14px 4px 4px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.45)}
  .hp-elbow{background:var(--hp-accent);width:88px;flex:none;display:flex;
    align-items:flex-end;justify-content:center;padding:10px 0 12px;border-radius:0 0 26px 0}
  .hp-elbow span{font-family:var(--hp-cond);font-weight:700;font-size:12px;
    letter-spacing:.12em;color:var(--hp-accent-ink);text-transform:uppercase;text-align:center}
  .hp-mbody{flex:1;min-width:0;padding:16px 20px;display:flex;flex-wrap:wrap;
    gap:14px 28px;align-items:center}
  .hp-id{flex:1 1 260px;min-width:0}
  .hp-id h1{font-family:var(--hp-cond);font-weight:700;text-transform:uppercase;
    letter-spacing:.03em;font-size:clamp(26px,4.4vw,38px);margin:0;line-height:.98}
  .hp-id .hp-sub{margin-top:5px;font-size:13.5px;color:var(--hp-dim)}
  .hp-id .hp-sub b{color:var(--hp-ink);font-weight:600}
  .hp-health{display:flex;align-items:center;gap:9px;flex:none}
  .hp-health .hp-dot{width:11px;height:11px;border-radius:50%;background:var(--hp-good)}
  .hp-health .hp-txt{font-family:var(--hp-cond);font-weight:700;text-transform:uppercase;
    letter-spacing:.08em;font-size:15px;color:var(--hp-good)}
  .hp-promise{margin:0;padding:11px 20px 12px;background:var(--hp-surface2);
    border:1px solid var(--hp-line);border-top:none;border-radius:0 0 14px 14px;
    color:var(--hp-dim);font-size:14px}
  .hp-promise b{color:var(--hp-ink);font-weight:600}

  .hp-sec{margin-top:24px}
  .hp-head{display:flex;align-items:baseline;gap:12px;margin-bottom:11px}
  .hp-head .hp-lbl{font-size:14px;color:var(--hp-ink)}
  .hp-head .hp-rule{flex:1;height:1px;background:var(--hp-line)}
  .hp-head .hp-note{font-size:12.5px;color:var(--hp-faint)}

  .hp-svc{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:10px}
  .hp-card{display:flex;gap:13px;align-items:flex-start;text-decoration:none;color:inherit;
    background:var(--hp-surface);border:1px solid var(--hp-line);
    border-left:3px solid var(--hp-info);border-radius:4px 10px 10px 4px;padding:13px 14px;
    transition:border-color .15s,transform .15s,background .15s}
  a.hp-card:hover,a.hp-card:focus-visible{background:var(--hp-surface2);
    border-left-color:var(--hp-accent);transform:translateY(-1px);outline:none}
  a.hp-card:focus-visible{box-shadow:0 0 0 2px var(--hp-accent)}
  .hp-card.hp-off{opacity:.72;border-left-color:var(--hp-idle)}
  .hp-ico{position:relative;flex:none;width:34px;height:34px;display:grid;place-items:center;
    background:var(--hp-hull);border-radius:8px;color:var(--hp-dim)}
  .hp-ico svg{width:19px;height:19px}
  .hp-badge{position:absolute;right:-4px;bottom:-4px;width:14px;height:14px;border-radius:50%;
    border:2.5px solid var(--hp-surface);background:var(--hp-good)}
  .hp-badge.warn{background:var(--hp-warn)} .hp-badge.crit{background:var(--hp-crit)}
  .hp-badge.idle{background:var(--hp-idle)}
  .hp-name{font-family:var(--hp-cond);font-weight:700;text-transform:uppercase;
    letter-spacing:.05em;font-size:17px;line-height:1.1}
  .hp-what{font-size:13px;color:var(--hp-dim);margin-top:3px}
  .hp-ports{margin-top:7px;display:flex;gap:7px;flex-wrap:wrap}
  .hp-chip{font-family:var(--hp-mono);font-size:11.5px;background:var(--hp-hull);
    color:var(--hp-dim);padding:2px 7px;border-radius:4px}
  .hp-chip.live{background:rgba(63,207,142,.18);color:var(--hp-good)}
  .hp-chip.na{background:transparent;color:var(--hp-faint);border:1px dashed var(--hp-line)}

  .hp-diag{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
  .hp-tile{background:var(--hp-surface2);border:1px solid var(--hp-line);border-radius:9px;
    padding:9px 10px 10px}
  .hp-tico{position:relative;width:22px;height:22px;display:grid;place-items:center;
    color:var(--hp-faint)}
  .hp-tico svg{width:16px;height:16px}
  .hp-tico .hp-badge{width:9px;height:9px;border-width:2px;border-color:var(--hp-surface2);
    right:-3px;bottom:-3px}
  .hp-val{font-family:var(--hp-mono);font-variant-numeric:tabular-nums;font-weight:600;
    font-size:17px;line-height:1.1;margin-top:6px;letter-spacing:-.02em}
  .hp-unit{font-size:11px;color:var(--hp-faint);font-weight:400}
  .hp-cap{font-family:var(--hp-cond);text-transform:uppercase;letter-spacing:.07em;
    font-size:11.5px;color:var(--hp-faint);margin-top:1px}
  .hp-tile.na .hp-val{color:var(--hp-faint);font-size:13px;font-weight:500}
  .hp-tile.warn .hp-val{color:var(--hp-warn)}

  .hp-foot{margin-top:22px;border-top:1px solid var(--hp-line);padding-top:13px;
    display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;
    font-size:12.5px;color:var(--hp-faint)}
  .hp-foot b{display:block;color:var(--hp-dim);font-family:var(--hp-cond);
    text-transform:uppercase;letter-spacing:.08em;font-size:12px;margin-bottom:3px}
  .hp-ctrlhead{margin-top:26px}

  /* ---- LIVE SCREEN viewer (in-page, 2026-09-04) ---- */
  #hp-live{position:fixed;inset:0;z-index:99999;background:#000;display:none;
    flex-direction:column;color:var(--hp-ink)}
  #hp-live.on{display:flex}
  .hpl-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:8px 12px;
    background:var(--hp-surface);border-bottom:1px solid var(--hp-line)}
  .hpl-bar .hp-name{font-size:16px;color:var(--hp-ink)}
  .hpl-bar .hp-name small{font-family:var(--hp-mono);font-weight:500;text-transform:none;
    letter-spacing:0;color:var(--hp-dim);font-size:12px;margin-left:8px}
  .hpl-bar label{font-size:12.5px;color:var(--hp-dim);display:flex;gap:6px;align-items:center}
  .hpl-bar select,.hpl-bar button,.hpl-bar a.hpl-btn{font:inherit;font-size:12.5px;
    background:var(--hp-hull);color:var(--hp-ink);border:1px solid var(--hp-line);
    border-radius:6px;padding:4px 10px;cursor:pointer;text-decoration:none}
  .hpl-bar a.hpl-btn.shot{background:#4AD4E3;color:#05070C;font-weight:700;letter-spacing:.06em}
  .hpl-bar button.close{background:var(--hp-accent);color:var(--hp-accent-ink);font-weight:700;
    letter-spacing:.06em}
  .hpl-status{margin-left:auto;font-family:var(--hp-mono);font-size:12px;color:var(--hp-dim)}
  .hpl-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;
    padding:8px}
  .hpl-stage img{max-width:100%;max-height:100%;object-fit:contain;
    box-shadow:0 0 0 1px var(--hp-line)}
  .hpl-stage img:not([src]){display:none}
  .hpl-wait{position:absolute;left:0;right:0;top:50%;text-align:center;color:var(--hp-faint);
    font-family:var(--hp-cond);text-transform:uppercase;letter-spacing:.1em;font-size:14px}

  @media (max-width:760px){ .hp-elbow{width:56px} #hp{padding:14px 12px 6px}
    .hpl-status{margin-left:0;flex-basis:100%} }
  @media (prefers-reduced-motion:reduce){ *{transition:none!important} }
  `;

  // ---- inline icons (no icon font - offline) -----------------------------
  var I = {
    screen:'<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3"/>',
    shot:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    logs:'<path d="M4 6h16M4 12h16M4 18h10"/>',
    ctrl:'<path d="M12 3v6M5.6 5.6a9 9 0 1 0 12.8 0"/>',
    ota:'<path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    api:'<path d="M8 3H6a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2"/><path d="M16 3h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2"/>',
    wifi:'<path d="M2 8.8a16 16 0 0 1 20 0M5 12.5a11 11 0 0 1 14 0M8.5 16.2a6 6 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1.2" fill="currentColor"/>',
    chip:'<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    batt:'<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 10v4"/>',
    wire:'<path d="M4 5v6a4 4 0 0 0 4 4h8a4 4 0 0 1 4 4v4"/><circle cx="4" cy="4" r="2"/><circle cx="20" cy="20" r="2"/><path d="M9 15h6"/>',
    mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'
  };
  function svg(d){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '+
           'stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
  }
  // attrs: omit for the default (new tab); pass '' for an in-page link.
  function card(href,icon,name,what,chips,state,attrs){
    var tag = href ? 'a' : 'div';
    var extra = (attrs === undefined) ? ' target="_blank" rel="noopener"' : attrs;
    var h   = href ? ' href="'+href+'"'+extra : (attrs || '');
    return '<'+tag+' class="hp-card'+(state==='idle'?' hp-off':'')+'"'+h+'>'+
      '<span class="hp-ico">'+svg(icon)+'<span class="hp-badge '+(state||'')+'"></span></span>'+
      '<span style="min-width:0;flex:1">'+
        '<span class="hp-name">'+name+'</span>'+
        '<span class="hp-what">'+what+'</span>'+
        '<span class="hp-ports">'+chips+'</span>'+
      '</span></'+tag+'>';
  }
  function tile(id,icon,cap,state){
    return '<div class="hp-tile" id="hpt-'+id+'">'+
      '<span class="hp-tico">'+svg(icon)+'<span class="hp-badge '+(state||'')+'"></span></span>'+
      '<div class="hp-val" id="hpv-'+id+'">&mdash;</div>'+
      '<div class="hp-cap">'+cap+'</div></div>';
  }

  function build(){
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    var hp = document.createElement('div');
    hp.id = 'hp';
    hp.innerHTML =
      '<div class="hp-mast">'+
        '<div class="hp-elbow"><span>Home<br>Port</span></div>'+
        '<div class="hp-mbody">'+
          '<div class="hp-id"><h1>Display 2</h1>'+
            '<div class="hp-sub">Waveshare ESP32-P4 7&Prime; touch panel &middot; '+
            '<b class="hp-mono">'+HOST+'</b> &middot; '+
            '<span class="hp-mono" id="hp-build">&mdash;</span></div></div>'+
          '<div class="hp-health"><span class="hp-dot"></span>'+
            '<span class="hp-txt" id="hp-health">Online</span></div>'+
        '</div>'+
      '</div>'+
      '<p class="hp-promise">You only need to know this device&rsquo;s address. '+
        '<b>Everything it can do is linked from this page</b> &mdash; the live screen, '+
        'the logs, the controls, the settings. No port list. No app. No manual.</p>'+

      '<div class="hp-sec"><div class="hp-head"><span class="hp-lbl">Everything this device offers</span>'+
        '<span class="hp-rule"></span><span class="hp-note">7 services</span></div>'+
        '<div class="hp-svc">'+
          card('#live', I.screen, 'Live screen',
               'See exactly what the panel is showing, right now.',
               '<span class="hp-chip hp-mono">:8082</span><span class="hp-chip live hp-mono">live</span>',
               '', ' id="hp-live-card"')+
          card(SHOT_URL, I.shot, 'DisplayShot',
               'One still frame of the panel, as a JPEG you can save.',
               '<span class="hp-chip hp-mono">:8082</span><span class="hp-chip live hp-mono">jpeg</span>')+
          card('#hp-logs', I.logs, 'Logs',
               'Watch what the device is doing, as it happens.',
               '<span class="hp-chip hp-mono">:80</span><span class="hp-chip live hp-mono">streaming</span>')+
          card('#hp-controls', I.ctrl, 'Controls',
               'Brightness, volume, restart, audio self-test.',
               '<span class="hp-chip hp-mono">:80</span><span class="hp-chip live hp-mono" id="hp-ecount">&mdash;</span>')+
          // Badge + second chip are driven LIVE by the device's own `update`
          // entity (C6 co-processor firmware) in wire() - never hardcoded.
          // Todd 2026-09-04: "it's yellow but it says no update needed".
          card(null, I.ota, 'Update',
               'Send new firmware over Wi&#8209;Fi. No cable needed.',
               '<span class="hp-chip hp-mono">:3232</span><span class="hp-chip live hp-mono" id="hp-otachip">OTA ready</span>',
               '', ' id="hp-update-card"')+
          card(WIRING_URL, I.wire, 'Wiring',
               'How this board is put together, and what you can add.',
               '<span class="hp-chip hp-mono">S&#8209;18</span><span class="hp-chip live hp-mono">as&#8209;wired</span>')+
          card(null, I.api, 'Home Assistant',
               'The native link Home Assistant uses to talk to this device.',
               '<span class="hp-chip hp-mono">:6053</span><span class="hp-chip live hp-mono">API</span>')+
        '</div></div>'+

      '<div class="hp-sec"><div class="hp-head"><span class="hp-lbl">Health</span>'+
        '<span class="hp-rule"></span></div>'+
        '<div class="hp-diag">'+
          tile('wifi', I.wifi,'Wi&#8209;Fi')+
          tile('batt', I.batt,'Battery')+
          tile('up',   I.clock,'Uptime')+
          tile('mic',  I.mic,'Mic level')+
          tile('stage',I.chip,'Build')+
        '</div></div>'+

      '<div class="hp-sec hp-ctrlhead"><div class="hp-head">'+
        '<span class="hp-lbl">All controls</span><span class="hp-rule"></span>'+
        '<span class="hp-note">live from the device</span></div></div>'+

      '<div class="hp-foot">'+
        '<div><b>Standard</b>Home Port (S&#8209;17)</div>'+
        '<div><b>Offline</b>Not yet &mdash; the stock UI still loads from oi.esphome.io.</div>'+
        '<div><b>Screen</b>Live view and DisplayShot, both on port 8082</div>'+
        '<div><b>Sockets</b><span class="hp-mono">18 budgeted</span></div>'+
      '</div>';

    // The stock ESPHome app (the entity table) becomes the "All controls"
    // section - kept, never hidden. Honest: it is the working surface.
    var app = document.querySelector('esp-app');
    if (app && app.parentNode) app.parentNode.insertBefore(hp, app);
    else document.body.insertBefore(hp, document.body.firstChild);
  }

  // ---- LIVE SCREEN viewer --------------------------------------------------
  // Same rules as tools/displayshot_live.html (measured 2026-09-02: one frame
  // ~1.3 s / 22 KB, so 2 s is the floor and 3 s is the filming rate):
  //   - ONE request in flight at a time, so a slow frame never stacks
  //     requests on the panel;
  //   - a frame that fails leaves the last good one up;
  //   - closing the viewer STOPS polling (the timer dies, an in-flight
  //     frame is dropped) so a closed viewer costs the device nothing.
  var live = { el:null, img:null, status:null, rate:null, pauseBtn:null,
               timer:null, open:false, paused:false, n:0, gen:0 };

  function liveBuild(){
    if (live.el) return;
    var d = document.createElement('div');
    d.id = 'hp-live';
    d.innerHTML =
      '<div class="hpl-bar">'+
        '<span class="hp-name">Live screen<small>Display 2 &middot; '+HOST+':8082</small></span>'+
        '<label>every <select id="hpl-rate">'+
          '<option value="2000">2 s</option>'+
          '<option value="3000" selected>3 s</option>'+
          '<option value="5000">5 s</option>'+
          '<option value="10000">10 s</option>'+
        '</select></label>'+
        '<button type="button" id="hpl-pause">pause</button>'+
        '<a class="hpl-btn shot" href="'+SHOT_URL+'" target="_blank" rel="noopener">DISPLAYSHOT</a>'+
        '<button type="button" id="hpl-full" title="Fullscreen - the bar hides itself; move the mouse to bring it back. Esc leaves.">FULLSCREEN</button>'+
        '<button type="button" class="close" id="hpl-close">CLOSE</button>'+
        '<span class="hpl-status" id="hpl-status">starting</span>'+
      '</div>'+
      '<div class="hpl-stage"><span class="hpl-wait" id="hpl-wait">waiting for the first frame</span>'+
        '<img id="hpl-img" alt="live frame of the panel"></div>';
    document.body.appendChild(d);
    live.el = d;
    live.img = d.querySelector('#hpl-img');
    live.status = d.querySelector('#hpl-status');
    live.rate = d.querySelector('#hpl-rate');
    live.pauseBtn = d.querySelector('#hpl-pause');
    live.rate.onchange = liveSchedule;
    live.pauseBtn.onclick = function(){
      live.paused = !live.paused;
      live.pauseBtn.textContent = live.paused ? 'resume' : 'pause';
      if (!live.paused) liveTick();
    };
    d.querySelector('#hpl-close').onclick = liveClose;
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && live.open && !document.fullscreenElement) liveClose();
    });

    // FULLSCREEN for filming (Todd 2026-09-04: the live view is the fridge
    // video's cut-away). The viewer itself goes fullscreen, the bar auto-hides
    // after 2.5 s and comes back on mouse movement; Esc leaves fullscreen only.
    var bar = d.querySelector('.hpl-bar'), hideT = null;
    function showBar(){ bar.style.opacity = '1'; bar.style.pointerEvents = '';
      clearTimeout(hideT);
      if (document.fullscreenElement === d) hideT = setTimeout(function(){
        bar.style.opacity = '0'; bar.style.pointerEvents = 'none'; }, 2500); }
    bar.style.transition = 'opacity .25s';
    d.addEventListener('mousemove', showBar);
    d.addEventListener('touchstart', showBar, {passive:true});
    d.querySelector('#hpl-full').onclick = function(){
      if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
      else if (d.requestFullscreen) d.requestFullscreen().then(showBar, function(){});
    };
    document.addEventListener('fullscreenchange', function(){
      d.querySelector('#hpl-full').textContent = document.fullscreenElement === d ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
      showBar();
    });
  }
  function liveSchedule(){
    clearTimeout(live.timer);
    if (!live.open || live.paused) return;
    live.timer = setTimeout(liveTick, parseInt(live.rate.value, 10));
  }
  function liveTick(){
    if (!live.open || live.paused) return;
    var gen = live.gen, t0 = (window.performance ? performance.now() : Date.now());
    var probe = new Image();
    probe.onload = function(){
      if (gen !== live.gen) return;              // viewer was closed meanwhile
      live.img.src = probe.src; live.n++;
      var w = document.getElementById('hpl-wait'); if (w) w.style.display = 'none';
      var ms = Math.round((window.performance ? performance.now() : Date.now()) - t0);
      live.status.textContent = 'frame '+live.n+' · '+ms+' ms · '+new Date().toLocaleTimeString();
      liveSchedule();
    };
    probe.onerror = function(){
      if (gen !== live.gen) return;
      live.status.textContent = 'no frame ('+new Date().toLocaleTimeString()+') — keeping the last one';
      liveSchedule();
    };
    probe.src = SHOT_URL + '?t=' + Date.now();
  }
  function liveOpen(){
    liveBuild();
    if (live.open) return;
    live.open = true; live.paused = false; live.n = 0; live.gen++;
    live.pauseBtn.textContent = 'pause';
    live.status.textContent = 'starting';
    live.el.classList.add('on');
    document.body.style.overflow = 'hidden';
    if (location.hash !== '#live') { try { history.replaceState(null, '', '#live'); } catch(e){} }
    liveTick();
  }
  function liveClose(){
    if (!live.open) return;
    live.open = false; live.gen++;
    clearTimeout(live.timer);
    live.el.classList.remove('on');
    document.body.style.overflow = '';
    if (location.hash === '#live') { try { history.replaceState(null, '', location.pathname + location.search); } catch(e){} }
  }
  function liveWire(){
    var c = document.getElementById('hp-live-card');
    if (c) c.addEventListener('click', function(e){ e.preventDefault(); liveOpen(); });
    window.addEventListener('hashchange', function(){ if (location.hash === '#live') liveOpen(); });
    if (location.hash === '#live') liveOpen();
  }

  // ---- live values from the device's own event stream --------------------
  // ONE EventSource. Sockets are the real Home Port constraint (fleet F18),
  // and CONFIG_LWIP_MAX_SOCKETS is already raised to 18 on this device.
  function wire(){
    var seen = {};
    function set(id, txt, cls){
      var v = document.getElementById('hpv-'+id); if(!v) return;
      v.innerHTML = txt;
      var t = document.getElementById('hpt-'+id);
      if (t && cls) { t.className = 'hp-tile ' + cls; }
    }
    var es;
    try { es = new EventSource('/events'); } catch(e){ return; }

    es.addEventListener('ping', function(e){
      try{
        var d = JSON.parse(e.data);
        if (d && typeof d.uptime === 'number'){
          var s = d.uptime, dd = Math.floor(s/86400), h = Math.floor((s%86400)/3600),
              m = Math.floor((s%3600)/60);
          set('up', dd ? dd+' <span class="hp-unit">d '+h+' h</span>'
                       : h ? h+' <span class="hp-unit">h '+m+' m</span>'
                           : m+' <span class="hp-unit">min</span>');
        }
      }catch(err){}
    });

    es.addEventListener('state', function(e){
      var d; try { d = JSON.parse(e.data); } catch(err){ return; }
      if (!d || !d.name) return;
      seen[d.name] = 1;
      var n = d.name, val = d.state, num = d.value;

      if (/WiFi Signal/i.test(n)){
        var q = (typeof num==='number') ? num : parseFloat(val);
        set('wifi', (isNaN(q)?val:q)+' <span class="hp-unit">dBm</span>',
            q > -67 ? '' : (q > -75 ? 'warn' : 'warn'));
      }
      else if (/Battery Level/i.test(n)){
        var b = (typeof num==='number') ? Math.round(num) : parseFloat(val);
        set('batt', isNaN(b) ? 'No reading' : b+' <span class="hp-unit">%</span>',
            isNaN(b) ? 'na' : (b>=40?'':'warn'));
      }
      else if (/Mic Level Baseline/i.test(n)){
        var lv = (typeof num==='number') ? num : parseFloat(val);
        set('mic', isNaN(lv) ? 'No reading' : lv.toFixed(1), isNaN(lv)?'na':'');
      }
      else if (/Build Stage/i.test(n)){
        var el = document.getElementById('hp-build');
        if (el) el.textContent = val;
        set('stage', '<span style="font-size:12px;font-weight:500">'+val+'</span>');
      }
      else if (d.domain === 'update'){
        // ESPHome update entity states: NO UPDATE / UPDATE AVAILABLE / INSTALLING.
        var chip = document.getElementById('hp-otachip');
        var uc = document.getElementById('hp-update-card');
        var bd = uc ? uc.querySelector('.hp-badge') : null;
        var avail = /AVAILABLE/i.test(val), busy = /INSTALL/i.test(val);
        var cur = d.current_version ? ' '+d.current_version : '';
        if (chip){
          chip.textContent = busy ? 'installing' :
                             avail ? 'update available'+(d.value ? ' → '+d.value : '') :
                             'up to date'+cur;
          chip.className = 'hp-chip hp-mono' + (avail || busy ? '' : ' live');
          if (avail || busy) chip.style.cssText = 'background:rgba(242,193,78,.18);color:var(--hp-warn)';
          else chip.style.cssText = '';
        }
        if (bd) bd.className = 'hp-badge' + (avail || busy ? ' warn' : '');
      }
      var c = document.getElementById('hp-ecount');
      if (c) c.textContent = Object.keys(seen).length + ' entities';
    });

    es.addEventListener('error', function(){
      var h = document.getElementById('hp-health');
      if (h){ h.textContent = 'Reconnecting'; h.style.color = 'var(--hp-warn)'; }
      var d = document.querySelector('.hp-health .hp-dot');
      if (d) d.style.background = 'var(--hp-warn)';
    });
    es.addEventListener('open', function(){
      var h = document.getElementById('hp-health');
      if (h){ h.textContent = 'All systems normal'; h.style.color = 'var(--hp-good)'; }
      var d = document.querySelector('.hp-health .hp-dot');
      if (d) d.style.background = 'var(--hp-good)';
    });
  }

  // =========================================================================
  // CARRIED FORWARD from displayshot_button.js: the newest-on-top log.
  // (Its DISPLAYSHOT corner button is now the DisplayShot card above, and the
  // WIRING corner button is the Wiring card - Todd, 2026-09-04: "moved up into
  // the rest of the panel ... for consistency".)
  // =========================================================================
  // v5.58 (Todd 2026-09-04, "easiest path forward", "keep the Home Port clean"):
  //  - the three button entities showed ESPHome's stock glyph, a hollow square that
  //    reads as STOP; it becomes a play triangle (same button, same action);
  //  - log-level LEGEND as hover text on each log row instead of a printed legend:
  //    the colours already say worse/better, the hover says exactly what.
  var LEVELS = {
    e:'E · ERROR — something failed; read the message',
    w:'W · WARNING — worth a look, nothing is broken yet',
    i:'I · INFO — a normal milestone (boot, connect, sync)',
    c:'C · CONFIG — what the device is set up with, printed at boot',
    d:'D · DEBUG — ordinary chatter, safe to ignore',
    v:'V · VERBOSE — the finest detail'
  };
  function labelLogRow(tr){
    if (!tr || tr.tagName !== 'TR' || tr.title) return;
    var cls = (tr.className || '').trim().charAt(0);
    if (LEVELS[cls]) tr.title = LEVELS[cls];
  }
  function playGlyphs(){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      var app = document.querySelector('esp-app');
      var tbl = (app && app.shadowRoot) ? app.shadowRoot.querySelector('esp-entity-table') : null;
      var root = (tbl && tbl.shadowRoot) ? tbl.shadowRoot : null;
      if (!root) { if (tries > 40) clearInterval(t); return; }
      clearInterval(t);
      var fix = function(){
        Array.prototype.forEach.call(root.querySelectorAll('button.rnd'), function(b){
          if (b.textContent.trim() === '☐') { b.textContent = '▶'; b.title = 'Press'; }
        });
      };
      fix();
      new MutationObserver(fix).observe(root, { childList:true, subtree:true, characterData:true });
    }, 250);
  }

  function legacyNewestOnTopLog(){
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      var app = document.querySelector('esp-app');
      var log = (app && app.shadowRoot) ? app.shadowRoot.querySelector('esp-log')
                                        : document.querySelector('esp-log');
      var tbody = (log && log.shadowRoot) ? log.shadowRoot.querySelector('tbody') : null;
      if (tbody) {
        clearInterval(t);
        Array.prototype.slice.call(tbody.querySelectorAll('tr')).reverse()
          .forEach(function (r) { labelLogRow(r); tbody.appendChild(r); });
        new MutationObserver(function (muts) {
          muts.forEach(function (m) {
            Array.prototype.forEach.call(m.addedNodes, function (n) {
              if (n.tagName === 'TR') {
                labelLogRow(n);
                if (n !== tbody.firstElementChild) tbody.insertBefore(n, tbody.firstElementChild);
              }
            });
          });
        }).observe(tbody, { childList: true });
      } else if (tries > 40) {
        clearInterval(t);
      }
    }, 250);
  }

  window.addEventListener('load', function () {
    try { build(); } catch (e) { /* never let styling break the page */ }
    try { wire(); }  catch (e) {}
    try { liveWire(); } catch (e) {}
    legacyNewestOnTopLog();
    try { playGlyphs(); } catch (e) {}
  });
})();
