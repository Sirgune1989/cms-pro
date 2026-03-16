(function () {
  'use strict';

  // ── Configuration ──
  var API_BASE = window.API_URL || '';
  var ROOM = 'main';
  var POLL_INTERVAL = 60000;  // 60s
  var CACHE_TTL = 5 * 60 * 1000; // 5min IndexedDB cache
  var IDB_NAME = 'PUP_TV_CACHE';
  var IDB_STORE = 'cache';

  // ── Theme definitions (same as v8.1 buildTemplate) ──
  var THEMES = {
    light:   { bg:'#F4F7FA',tile:'#FFFFFF',tx:'#0f1923',tx2:'#4a5a6e',tx3:'#8b9cb8',tkbg:'#101820',tktx:'#e8edf3',bd:'rgba(0,0,0,.07)',sh:'0 2px 16px rgba(0,0,0,.08)' },
    dark:    { bg:'#0D1117',tile:'#161B22',tx:'#E6EDF3',tx2:'#8B949E',tx3:'#4a5568',tkbg:'#010409',tktx:'#E6EDF3',bd:'rgba(255,255,255,.08)',sh:'0 2px 20px rgba(0,0,0,.5)' },
    gray:    { bg:'#E8EDF3',tile:'#FFFFFF',tx:'#1A202C',tx2:'#4A5568',tx3:'#8b9cb8',tkbg:'#2C3240',tktx:'#F0F4F8',bd:'rgba(0,0,0,.07)',sh:'0 2px 12px rgba(0,0,0,.06)' },
    green:   { bg:'#004d26',tile:'#00703c',tx:'#ffffff',tx2:'#d1fae5',tx3:'#a7f3d0',tkbg:'#002914',tktx:'#ffffff',bd:'rgba(255,255,255,.15)',sh:'0 4px 20px rgba(0,0,0,.2)' },
    blue:    { bg:'#003b73',tile:'#005b9f',tx:'#ffffff',tx2:'#e0f2fe',tx3:'#bae6fd',tkbg:'#001e3b',tktx:'#ffffff',bd:'rgba(255,255,255,.15)',sh:'0 4px 20px rgba(0,0,0,.2)' },
    premium: { bg:'#0e0e12',tile:'#16161c',tx:'#ffffff',tx2:'#a1a1aa',tx3:'#71717a',tkbg:'#000000',tktx:'#E6EDF3',bd:'rgba(0,180,216,.3)',sh:'0 0 30px rgba(0,180,216,.08)' }
  };

  var GRADIENTS = {
    blue:['#0ea5e9','#2563eb'], green:['#10b981','#059669'], purple:['#a855f7','#7c3aed'],
    orange:['#f97316','#ea580c'], red:['#ef4444','#dc2626'], teal:['#14b8a6','#0d9488']
  };

  var WX_CODES = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'❄️',73:'❄️',75:'❄️',80:'🌦️',81:'🌦️',82:'🌧️',95:'⛈️'};

  var MAP_GMINY = [
    {n:'Sztum',k:'sztum',p:'M60,40 L190,25 L220,65 L240,140 L220,220 L160,260 L90,250 L50,190 L30,110Z',cx:140,cy:140},
    {n:'Dzierzgoń',k:'dzierzgon',p:'M190,25 L330,8 L380,45 L395,130 L350,185 L240,140 L220,65Z',cx:300,cy:85},
    {n:'Stary Targ',k:'staryTarg',p:'M90,250 L160,260 L220,220 L210,310 L165,360 L100,370 L55,330 L50,280Z',cx:140,cy:300},
    {n:'Stary Dzierzgoń',k:'staryDzierzgon',p:'M240,140 L350,185 L370,265 L325,320 L260,330 L210,310 L220,220Z',cx:295,cy:240},
    {n:'Mikołajki Pom.',k:'mikolajki',p:'M260,330 L325,320 L370,360 L350,390 L280,400 L210,380 L210,310Z',cx:290,cy:355}
  ];

  // ── Helpers ──
  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function shade(hex, pct) {
    var n = parseInt(hex.replace('#', ''), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + pct));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 0xFF) + pct));
    var b = Math.max(0, Math.min(255, (n & 0xFF) + pct));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function rgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return ((n >> 16) & 0xFF) + ',' + ((n >> 8) & 0xFF) + ',' + (n & 0xFF);
  }

  function isVid(src) { return /\.(mp4|webm|ogg)(\?|$)/i.test(src || ''); }

  function mediaTag(src, fit) {
    if (!src) return '<div class="nomedia">🖼️ Brak mediów</div>';
    var f = fit || 'cover';
    if (isVid(src)) return '<video src="' + src + '" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:' + f + ';display:block"></video>';
    return '<img src="' + src + '" alt="" style="width:100%;height:100%;object-fit:' + f + ';display:block">';
  }

  function mediaSrc(s) {
    if (s.mediaUrl) return API_BASE + s.mediaUrl;
    if (s.murl) return s.murl;
    if (s.mpath) return s.mpath;
    if (s.mdata) return s.mdata;
    return '';
  }

  // ── IndexedDB Cache ──
  function openCacheDB() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function cacheGet() {
    return openCacheDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(IDB_STORE, 'readonly');
        var req = tx.objectStore(IDB_STORE).get('screenData');
        req.onsuccess = function () {
          var val = req.result;
          if (val && val.timestamp && Date.now() - val.timestamp < CACHE_TTL) {
            resolve(val.data);
          } else {
            resolve(null);
          }
        };
        req.onerror = function () { resolve(null); };
      });
    }).catch(function () { return null; });
  }

  function cacheSet(data) {
    return openCacheDB().then(function (db) {
      var tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put({ data: data, timestamp: Date.now() }, 'screenData');
    }).catch(function () {});
  }

  // ── Apply Config (CSS variables) ──
  function applyConfig(cfg) {
    var t = THEMES[cfg.theme] || THEMES.light;
    var ac = cfg.accent || '#00A651';
    var root = document.documentElement.style;

    root.setProperty('--bg', t.bg);
    root.setProperty('--tile', t.tile);
    root.setProperty('--tx', t.tx);
    root.setProperty('--tx2', t.tx2);
    root.setProperty('--tx3', t.tx3);
    root.setProperty('--tkbg', t.tkbg);
    root.setProperty('--tktx', t.tktx);
    root.setProperty('--bd', t.bd);
    root.setProperty('--sh', t.sh);
    root.setProperty('--ac', ac);
    root.setProperty('--acd', shade(ac, -12));
    root.setProperty('--acr', rgb(ac));
    root.setProperty('--sw', (cfg.sidebarWidth || 380) + 'px');
    root.setProperty('--headerH', (cfg.headerH || 60) + 'px');
    root.setProperty('--tickerH', (cfg.tickerH || 74) + 'px');
    root.setProperty('--stagePad', (cfg.stagePad || 14) + 'px');
    root.setProperty('--slideRadius', (cfg.slideRadius || 20) + 'px');
    root.setProperty('--fsTitleSlide', (cfg.fsTitleSlide || 3.1) + 'rem');
    root.setProperty('--fsBodySlide', (cfg.fsBodySlide || 2) + 'rem');
    root.setProperty('--fsTicker', (cfg.fsTicker || 1.05) + 'rem');
    root.setProperty('--fsClock', (cfg.fsClock || 2.1) + 'rem');
    root.setProperty('--wxIconSize', (cfg.wxIconSize || 36) + 'px');
    root.setProperty('--wxTempSize', (cfg.wxTempSize || 1.2) + 'rem');

    // Font
    var ff = 'system-ui,-apple-system,"Segoe UI",sans-serif';
    if (cfg.tvFont === 'lato') ff = '"Lato",sans-serif';
    if (cfg.tvFont === 'montserrat') ff = '"Montserrat",sans-serif';
    if (cfg.tvFont === 'roboto') ff = '"Roboto",sans-serif';
    document.body.style.fontFamily = ff;

    if (cfg.tvFont && cfg.tvFont !== 'system') {
      var fam = cfg.tvFont === 'lato' ? 'Lato:wght@400;700;900' :
                cfg.tvFont === 'montserrat' ? 'Montserrat:wght@400;600;800' :
                'Roboto:wght@400;500;700;900';
      if (!document.getElementById('gfont-link')) {
        var link = document.createElement('link');
        link.id = 'gfont-link';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=' + fam + '&display=swap';
        document.head.appendChild(link);
      }
    }
  }

  // ── Build Trend Chart SVG ──
  function buildTrendChart(rh) {
    if (!rh || rh.length < 2) return '';
    var W = 520, H = 130, pl = 38, pr = 12, pt = 14, pb = 28;
    var vals = rh.map(function (x) { return parseFloat(x.v) || 0; });
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    var rng = mx - mn || 0.5; mn -= rng * .15; mx += rng * .15;
    var pts = vals.map(function (v, i) {
      return { x: pl + i / (vals.length - 1) * (W - pl - pr), y: pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb) };
    });
    var line = 'M' + pts.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' L');
    var area = line + ' L' + pts[pts.length - 1].x.toFixed(1) + ',' + (H - pb) + ' L' + pts[0].x.toFixed(1) + ',' + (H - pb) + ' Z';
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto">';
    svg += '<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--ac)" stop-opacity=".25"/><stop offset="100%" stop-color="var(--ac)" stop-opacity=".02"/></linearGradient></defs>';
    svg += '<path d="' + area + '" fill="url(#cg)"/>';
    svg += '<path d="' + line + '" fill="none" stroke="var(--ac)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    pts.forEach(function (p) {
      svg += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4" fill="var(--ac)" stroke="var(--tile)" stroke-width="2.5"/>';
    });
    rh.forEach(function (r, i) {
      svg += '<text x="' + pts[i].x.toFixed(1) + '" y="' + (H - pb + 14) + '" text-anchor="middle" font-size="9.5" fill="var(--tx2)">' + esc(r.m) + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  // ── Build Slides HTML ──
  function buildSlidesHTML(slides, data) {
    if (!slides || !slides.length) {
      return '<div class="slide active st"><div class="sti">📺</div><h2>Brak slajdów</h2><p>Dodaj slajdy w CMS.</p></div>';
    }

    return slides.map(function (s, i) {
      var cl = 'slide' + (i === 0 ? ' active' : '');
      var sp = s.tts_text ? ' data-sp="' + esc(s.tts_text) + '"' : '';
      var dur = (s.duration && +s.duration > 0) ? ' data-dur="' + s.duration + '"' : '';
      var src = mediaSrc(s);

      if (s.type === 'text') {
        var ic = s.svgIcon || '<span style="font-size:72px;line-height:1">' + esc(s.icon || '📌') + '</span>';
        return '<div class="' + cl + ' st"' + sp + dur + '><div class="sti">' + ic + '</div><h2>' + esc(s.title) + '</h2><p>' + esc(s.body || '').replace(/\n/g, '<br>') + '</p></div>';
      }
      if (s.type === 'media') {
        return '<div class="' + cl + ' sm"' + sp + dur + '>' + mediaTag(src, s.objectFit) + '</div>';
      }
      if (s.type === 'split') {
        return '<div class="' + cl + ' ss"' + sp + dur + '><div class="sml">' + mediaTag(src, s.objectFit) + '</div><div class="str2"><h2>' + esc(s.title) + '</h2><p>' + esc(s.body || '').replace(/\n/g, '<br>') + '</p></div></div>';
      }
      if (s.type === 'stats') {
        var vs = [s.sztum, s.dzierzgon, s.staryTarg, s.staryDzierzgon, s.mikolajki];
        var ns = ['Sztum', 'Dzierzgoń', 'Stary Targ', 'Stary Dzierzgoń', 'Mikołajki Pom.'];
        var mx2 = Math.max.apply(null, vs) || 1;
        var bars = vs.map(function (v, j) {
          return '<div class="br"><span class="bn">' + ns[j] + '</span><div class="bt"><div class="bf" data-w="' + Math.round(v / mx2 * 100) + '%"></div></div><span class="bv">' + v + '</span></div>';
        }).join('');
        return '<div class="' + cl + ' sk"' + sp + dur + '><div class="skh"><div class="skb"><span class="ctr" data-t="' + s.total + '">0</span><small>bezrobotnych</small></div><div class="skr"><span>' + esc(s.rate) + '</span><small>stopa bezrobocia</small></div><div class="skp">' + esc(s.period) + '</div></div><div class="sklayout"><div class="skbars"><div class="skbars-t">Bezrobocie wg gmin</div>' + bars + '</div><div class="skchart"><div class="skchart-t">Trend stopy bezrobocia</div>' + buildTrendChart(s.rateHistory) + '</div></div></div>';
      }
      if (s.type === 'quote') {
        return '<div class="' + cl + ' sq"' + sp + dur + '><div class="sqm">\u201c</div><blockquote>' + esc(s.quote) + '</blockquote><cite>' + esc(s.author) + '</cite></div>';
      }
      if (s.type === 'video') {
        return '<div class="' + cl + ' sm"' + sp + dur + '>' + (src ? '<video src="' + src + '" autoplay loop playsinline style="width:100%;height:100%;object-fit:cover" data-vol="' + ((s.volume || 50) / 100).toFixed(2) + '"></video>' : '<div class="nomedia">🎬 Brak</div>') + '</div>';
      }
      if (s.type === 'calendar') {
        var y = s.calYear || 2026, m = s.calMonth || 3;
        var mNames = ['', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
        var dn = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
        var evs = {};
        (s.events || '').split('\n').forEach(function (l) {
          var p = l.split('|'); if (p.length >= 2) evs[parseInt(p[0])] = p[1].trim();
        });
        var fd = new Date(y, m - 1, 1).getDay(); fd = fd === 0 ? 6 : fd - 1;
        var dim = new Date(y, m, 0).getDate();
        var ch = '<div class="' + cl + ' scalendar"' + sp + dur + '><div class="cal-title">' + mNames[m] + ' ' + y + '</div><div class="cal-grid">';
        ch += dn.map(function (d) { return '<div class="cal-hdr">' + d + '</div>'; }).join('');
        for (var e2 = 0; e2 < fd; e2++) ch += '<div class="cal-empty"></div>';
        for (var d2 = 1; d2 <= dim; d2++) {
          var ev = evs[d2];
          ch += '<div class="cal-day' + (ev ? ' cal-event' : '') + '">' + d2 + (ev ? '<span class="cal-dot"></span>' : '') + '</div>';
        }
        ch += '</div></div>';
        return ch;
      }
      if (s.type === 'statsCards') {
        var cards = (data.statCards || []).map(function (c) {
          var cc = GRADIENTS[c.gradient] || GRADIENTS.blue;
          var up = c.change >= 0;
          return '<div class="scard" style="background:linear-gradient(135deg,' + cc[0] + ',' + cc[1] + ')"><div class="scard-icon">' + c.icon + '</div><div class="scard-val"><span class="ctr" data-t="' + c.value + '">0</span> <small>' + esc(c.unit) + '</small></div><div class="scard-title">' + esc(c.title) + '</div><div class="scard-trend ' + (up ? 'tup' : 'tdown') + '">' + (up ? '↑' : '↓') + ' ' + Math.abs(c.change).toFixed(1) + '%</div></div>';
        }).join('');
        return '<div class="' + cl + ' scards-slide"' + sp + dur + '><h2 class="scards-h">' + esc(s.title || 'Statystyki') + '</h2><div class="scards-grid">' + cards + '</div></div>';
      }
      if (s.type === 'mapSlide') {
        var md = data.mapData || {};
        var mu = data.mapUnit || 'os.';
        var mvs = MAP_GMINY.map(function (g) { return md[g.k] || 0; });
        var mmx = Math.max.apply(null, mvs) || 1;
        function mc(v2) {
          var t2 = Math.min(v2 / mmx, 1);
          return 'rgb(' + Math.round(20 * t2) + ',' + Math.round(180 - 100 * t2) + ',' + Math.round(100 - 60 * t2) + ')';
        }
        var msvg = '<svg viewBox="0 0 420 410" style="width:auto;height:90%;max-height:100%;display:block;margin:0 auto;font-family:inherit">';
        MAP_GMINY.forEach(function (g) {
          var v = md[g.k] || 0;
          msvg += '<path d="' + g.p + '" fill="' + mc(v) + '" stroke="rgba(255,255,255,.6)" stroke-width="2.5" opacity=".92"/>';
          msvg += '<text x="' + g.cx + '" y="' + (g.cy - 6) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" stroke="rgba(0,0,0,.5)" stroke-width=".4">' + g.n + '</text>';
          msvg += '<text x="' + g.cx + '" y="' + (g.cy + 14) + '" text-anchor="middle" font-size="16" font-weight="900" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width=".5">' + v + '</text>';
        });
        msvg += '</svg>';
        return '<div class="' + cl + ' map-slide"' + sp + dur + '><h2 class="map-h">' + esc(s.title || 'Mapa powiatu') + '</h2><div class="map-body">' + msvg + '</div><div class="map-unit">' + esc(mu) + '</div></div>';
      }
      if (s.type === 'job') {
        var reqs = (s.jobRequirements || '').split('\n').filter(Boolean).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('');
        var qr = s.jobUrl ? '<div class="job-qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(s.jobUrl) + '" alt="QR" style="width:100px;height:100px;border-radius:8px"></div>' : '';
        return '<div class="' + cl + ' job-slide"' + sp + dur + '><div class="job-icon">💼</div><h2 class="job-title">' + esc(s.jobTitle) + '</h2><div class="job-company">' + esc(s.jobCompany) + ' — ' + esc(s.jobLocation) + '</div><div class="job-body"><ul class="job-reqs">' + reqs + '</ul>' + qr + '</div><div class="job-contact">' + esc(s.jobContact) + '</div></div>';
      }
      return '';
    }).join('\n');
  }

  // ── Render ──
  function render(data) {
    // Apply theme
    applyConfig(data.config);

    // Logo
    var logoEl = document.getElementById('tb-logo');
    if (data.logoUrl) {
      logoEl.innerHTML = '<img src="' + API_BASE + data.logoUrl + '" alt="" style="height:38px;width:auto;object-fit:contain">';
    }

    // Org subtitle
    document.getElementById('tb-sub').textContent = data.org.sub || '';

    // Contact
    var contactHTML = '';
    if (data.contact.phone) contactHTML += '<div class="cl"><div class="clic">📞</div>' + esc(data.contact.phone) + '</div>';
    if (data.contact.email) contactHTML += '<div class="cl"><div class="clic">✉️</div>' + esc(data.contact.email) + '</div>';
    if (data.contact.www) contactHTML += '<div class="cl"><div class="clic">🌐</div>' + esc(data.contact.www) + '</div>';
    if (data.contact.hours) contactHTML += '<div class="cl"><div class="clic">🕐</div>' + esc(data.contact.hours) + '</div>';
    document.getElementById('contact-list').innerHTML = contactHTML;

    // Rooms
    var roomsHTML = data.rooms.map(function (r) {
      return '<li><span class="rn">' + esc(r.number) + '</span><span class="rl">' + esc(r.name) + '</span>' +
        (r.floor ? '<span class="rf">' + esc(r.floor) + '</span>' : '') + '</li>';
    }).join('');
    document.getElementById('rooms-list').innerHTML = roomsHTML || '<li><span class="rl" style="color:var(--tx3)">Brak pokojów</span></li>';

    // Ticker
    var tickerHTML = data.ticker.map(function (t) {
      return '<span class="ti">' + esc(t) + '</span><span class="ts">●</span>';
    }).join('');
    var tkins = document.getElementById('tkins');
    tkins.innerHTML = tickerHTML + tickerHTML; // duplicate for seamless scroll
    var halfW = tkins.scrollWidth / 2;
    tkins.style.animationDuration = Math.max(15, halfW / 90) + 's';

    // Slides
    document.getElementById('stage').innerHTML = buildSlidesHTML(data.slides, data);

    // Start animations & slideshow
    startAnimations();
    startSlideshow(data.config.slideTime || 10);

    // Video volumes
    document.querySelectorAll('video[data-vol]').forEach(function (v) {
      v.volume = parseFloat(v.getAttribute('data-vol')) || 0.5;
    });
  }

  // ── Slide Animations ──
  function startAnimations() {
    var activeSlide = document.querySelector('.slide.active');
    if (activeSlide) animateSlide(activeSlide);
  }

  function animateSlide(el) {
    // Bar chart fill
    el.querySelectorAll('.bf').forEach(function (b) {
      setTimeout(function () { b.style.width = b.getAttribute('data-w'); }, 100);
    });
    // Count-up
    el.querySelectorAll('.ctr[data-t]').forEach(function (c) {
      var tg = parseInt(c.getAttribute('data-t')), st = null;
      function step(ts) {
        if (!st) st = ts;
        var px = Math.min((ts - st) / 1500, 1);
        var p = 1 - Math.pow(1 - px, 3);
        c.textContent = Math.floor(p * tg).toLocaleString('pl-PL');
        if (p < 1) requestAnimationFrame(step);
        else c.textContent = tg.toLocaleString('pl-PL');
      }
      requestAnimationFrame(step);
    });
    // TTS
    var sp = el.getAttribute('data-sp');
    if (sp && window.speechSynthesis) {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(sp);
      u.lang = 'pl-PL'; u.rate = 0.9;
      speechSynthesis.speak(u);
    }
  }

  // ── Slideshow ──
  var slideTimer = null;
  function startSlideshow(defaultSec) {
    if (slideTimer) clearTimeout(slideTimer);
    var slides = document.querySelectorAll('.slide');
    if (slides.length <= 1) return;
    var cur = 0;
    var defMs = (defaultSec || 10) * 1000;

    function getDur(el) {
      var d = parseInt(el.getAttribute('data-dur'));
      return (d && d > 0) ? d * 1000 : defMs;
    }

    function next() {
      if (slideTimer) clearTimeout(slideTimer);
      // Reset bar widths on current slide
      slides[cur].querySelectorAll('.bf').forEach(function(b) { b.style.width = '0'; });
      slides[cur].classList.remove('active');
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add('active');
      animateSlide(slides[cur]);
      slideTimer = setTimeout(next, getDur(slides[cur]));
    }

    slideTimer = setTimeout(next, getDur(slides[0]));
  }

  // ── Clock ──
  function updateClock() {
    var n = new Date();
    document.getElementById('clk').textContent = n.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('dt').textContent = n.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // ── Weather ──
  var weatherData = null;
  function loadWeather(lat, lon, city) {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        weatherData = d;
        try { localStorage.setItem('pup_wx', JSON.stringify(d)); } catch (e) {}
        renderWeather(d, city);
      })
      .catch(function () {
        try {
          var c = localStorage.getItem('pup_wx');
          if (c) renderWeather(JSON.parse(c), city);
        } catch (e) {}
      });
  }

  function renderWeather(d, city) {
    var w = d.current_weather;
    var cd = w.weathercode;
    var cl = (cd <= 1 ? 'wsun' : cd >= 51 ? 'wrain' : '');
    var ic = WX_CODES[cd] || '🌡️';
    document.getElementById('wx').innerHTML =
      '<span class="wx-icon ' + cl + '">' + ic + '</span>' +
      '<span class="wx-temp">' + Math.round(w.temperature) + '°C</span>' +
      '<span class="wx-city">' + esc(city) + '</span>';
  }

  // ── Error display ──
  var errorEl = null;
  function showError(msg) {
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'error-banner';
      document.body.appendChild(errorEl);
    }
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
    setTimeout(function () { errorEl.classList.remove('visible'); }, 5000);
  }

  // ── Fetch & Render ──
  var retryDelay = 1000;

  function fetchAndRender() {
    return fetch(API_BASE + '/api/screen/' + ROOM)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        retryDelay = 1000;
        cacheSet(data);
        render(data);

        // Start weather after first render
        if (data.weather && data.weather.lat) {
          loadWeather(data.weather.lat, data.weather.lon, data.weather.city);
        }

        // Hide loading
        var loading = document.getElementById('loading');
        if (loading) loading.classList.add('hidden');

        return data;
      })
      .catch(function (err) {
        console.error('Fetch error:', err);
        showError('Brak połączenia z serwerem — ponawianie...');

        // Try cache
        return cacheGet().then(function (cached) {
          if (cached) {
            render(cached);
            var loading = document.getElementById('loading');
            if (loading) loading.classList.add('hidden');
          }
        });
      });
  }

  function poll() {
    fetchAndRender().finally(function () {
      setTimeout(poll, POLL_INTERVAL);
    });
  }

  // ── Init ──
  function init() {
    // Check for preview mode (used by CMS live preview)
    var params = new URLSearchParams(window.location.search);
    if (params.has('preview')) {
      POLL_INTERVAL = 2000; // faster polling in preview mode
    }

    // Listen for postMessage from CMS for instant preview updates
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'cms-preview' && e.data.payload) {
        render(e.data.payload);
      }
    });

    updateClock();
    setInterval(updateClock, 1000);

    // Weather refresh every 10 min
    setInterval(function () {
      if (weatherData) {
        // Re-fetch with same coords
      }
    }, 600000);

    // Start fetching
    poll();
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
