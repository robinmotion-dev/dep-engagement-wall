/*
 * Engagement-Wall – zeigt 5-10 Projekte gleichzeitig, tauscht im Takt je einen Platz.
 *
 * URL-Parameter:
 *   ?n=8        Anzahl Plaetze (5-10, Standard 8)
 *   ?dauer=40   Sekunden, die eine Kachel steht (min 10, Standard 40); Takt = dauer / n
 *   ?seed=42    feste, reproduzierbare Reihenfolge (ohne seed: Math.random)
 *   ?icons=0    keine animierten Icons zwischen den Projekten
 * Welche Kachel wechselt, ist zufaellig (unter den laenger stehenden). Statt eines Projekts
 * erscheint regelmaessig ein animiertes Icon (hoechstens eines gleichzeitig, nie im grossen Platz).
 * Test: window.DEP_WALL.status() -> { n, sichtbar, icon, gezeigt, durchlauf }
 */
(function () {
  'use strict';

  // ---------- Parameter ----------
  var Q = new URLSearchParams(location.search);
  function zahl(k, d) { var v = parseFloat(Q.get(k)); return isFinite(v) ? v : d; }
  var N = Math.max(5, Math.min(10, Math.round(zahl('n', 8))));
  var DAUER = Math.max(10, zahl('dauer', 40));
  var SEED = (Q.get('seed') !== null && isFinite(Number(Q.get('seed')))) ? (Number(Q.get('seed')) | 0) : null;
  var MIT_ICONS = Q.get('icons') !== '0';

  // Animierte Icons (Strichzeichnungen, schwarz, transparent) – Quelle: 01_IN/02_Footage/01_Bilder-Video/animated-icons
  var ICONS = ['gluehbirne', 'gruppe', 'haende-herz'].map(function (n) { return 'assets/icons/' + n + '.webp'; });
  var ICON_FARBEN = ['gelb', 'gelb', 'pink', 'weiss'];   // nur helle Gruende, Linien sind schwarz
  var ICON_ABSTAND = Math.ceil(N / 2);                     // so viele Projektwechsel zwischen zwei Icons

  // ---------- Zufall ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rnd = SEED === null ? Math.random : mulberry32(SEED);

  var buehne = document.getElementById('buehne');
  var DATEN = window.DEP_PROJEKTE;
  if (!DATEN || !DATEN.length) {
    var m = document.createElement('div');
    m.className = 'meldung';
    m.textContent = 'Keine Projektdaten gefunden (data/projekte.js).';
    document.body.appendChild(m);
    window.DEP_WALL = { status: function () { return { n: N, sichtbar: [], gezeigt: 0, durchlauf: 0 }; } };
    return;
  }

  // ---------- Rastervorlagen ----------
  // Jede Zeichenkette = eine Rasterzeile, jeder Buchstabe = eine Zelle, gleiche Buchstaben = ein Platz.
  var V = {
    5:  { quer: ['aab', 'cde'], hoch: ['aa', 'aa', 'bc', 'de'], mittel: ['aab', 'aac', 'dec'], ultra: ['aabcd', 'aaeed'] },
    6:  { quer: ['aabc', 'defc'], hoch: ['aa', 'bc', 'de', 'ff'], mittel: ['aab', 'aac', 'def'], ultra: ['aabcee', 'aaddff'] },
    7:  { quer: ['aabc', 'ddec', 'fggc'], hoch: ['aa', 'bc', 'de', 'fg'], mittel: ['aab', 'aac', 'def', 'ggf'], ultra: ['aabcde', 'aaffge'] },
    8:  { quer: ['aabc', 'deec', 'fghh'], hoch: ['aa', 'bc', 'de', 'fg', 'hh'], mittel: ['abc', 'dec', 'fgh'], ultra: ['aabcdee', 'aafgdhh'] },
    9:  { quer: ['aabc', 'defg', 'hiig'], hoch: ['aa', 'bc', 'de', 'fg', 'hi'], mittel: ['abc', 'def', 'ghi'], ultra: ['aabcdeff', 'aaghdeii'] },
    10: { quer: ['aabcd', 'efghd', 'iijjd'], hoch: ['aa', 'bc', 'de', 'fg', 'hi', 'jj'], mittel: ['aabc', 'debf', 'ghij'], ultra: ['aabcdef', 'aaghijf'] }
  };

  function formatWahl() {
    var a = window.innerWidth / window.innerHeight;
    if (a >= 2.2) return 'ultra';
    if (a >= 1.2) return 'quer';
    if (a < 0.85) return 'hoch';
    return 'mittel';
  }

  // ---------- Plaetze (einmal angelegt, wiederverwendet) ----------
  // Weiss ueberwiegt (ruhiger Grund laut Styleguide), Farbkacheln setzen Akzente
  var FARBEN = ['weiss', 'weiss', 'weiss', 'gelb', 'pink', 'magenta', 'schwarz'];
  var plaetze = [];

  function platzBauen(i) {
    var el = document.createElement('div');
    el.className = 'platz';
    var k = document.createElement('div');
    k.className = 'kachel';
    var inh = document.createElement('div');
    inh.className = 'inhalt';
    var org = document.createElement('div'); org.className = 'org';
    var tit = document.createElement('div'); tit.className = 'titel';
    var sat = document.createElement('div'); sat.className = 'satz';
    inh.appendChild(org); inh.appendChild(tit); inh.appendChild(sat);
    k.appendChild(inh);
    var bild = document.createElement('img'); bild.className = 'bild'; bild.alt = '';
    k.appendChild(bild);
    el.appendChild(k);
    buehne.appendChild(el);
    return {
      i: i, el: el, k: k, inh: inh, org: org, tit: tit, sat: sat, bild: bild,
      farbe: null, proj: null, icon: null, stamp: -1, nachbarn: [], t: null
    };
  }
  for (var i = 0; i < N; i++) plaetze.push(platzBauen(i));

  // Vorlage anwenden, Nachbarschaft neu berechnen
  var aktForm = null;
  function vorlageAnwenden() {
    var f = formatWahl();
    if (f === aktForm) return false;
    aktForm = f;
    var zeilen = V[N][f];
    buehne.style.gridTemplateAreas = zeilen.map(function (z) { return '"' + z.split('').join(' ') + '"'; }).join(' ');
    buehne.style.gridTemplateColumns = 'repeat(' + zeilen[0].length + ', minmax(0, 1fr))';
    buehne.style.gridTemplateRows = 'repeat(' + zeilen.length + ', minmax(0, 1fr))';
    var nb = plaetze.map(function () { return {}; });
    function verbinden(c1, c2) {
      if (c1 === c2) return;
      var a = c1.charCodeAt(0) - 97, b = c2.charCodeAt(0) - 97;
      nb[a][b] = true; nb[b][a] = true;
    }
    for (var y = 0; y < zeilen.length; y++) {
      for (var x = 0; x < zeilen[y].length; x++) {
        if (x + 1 < zeilen[y].length) verbinden(zeilen[y][x], zeilen[y][x + 1]);
        if (y + 1 < zeilen.length) verbinden(zeilen[y][x], zeilen[y + 1][x]);
      }
    }
    plaetze.forEach(function (p, idx) {
      p.el.style.gridArea = String.fromCharCode(97 + idx);
      p.nachbarn = Object.keys(nb[idx]).map(Number);
    });
    return true;
  }
  vorlageAnwenden();

  // ---------- Mischbeutel ----------
  var beutel = [], pos = 0, durchlauf = 0, gezeigt = 0;
  var aktiv = {};   // id -> true, solange sichtbar oder in Vorbereitung
  function mischen() {
    beutel = DATEN.map(function (_, idx) { return idx; });
    for (var j = beutel.length - 1; j > 0; j--) {
      var r = Math.floor(rnd() * (j + 1)), t = beutel[j]; beutel[j] = beutel[r]; beutel[r] = t;
    }
    pos = 0; durchlauf++;
  }
  function naechstes() {
    if (!beutel.length) mischen();
    for (var versuch = 0; versuch < DATEN.length * 2 + 5; versuch++) {
      if (pos >= beutel.length) mischen();
      var idx = beutel[pos++];
      if (!aktiv[DATEN[idx].id]) return DATEN[idx];
      // laeuft schon: mit einem spaeteren Eintrag tauschen, damit er im Durchlauf bleibt
      if (pos < beutel.length) {
        var r = pos + Math.floor(rnd() * (beutel.length - pos));
        beutel[pos - 1] = beutel[r]; beutel[r] = idx; pos--;
      }
    }
    return DATEN[Math.floor(rnd() * DATEN.length)];
  }

  // ---------- Kachel befuellen ----------
  function farbeWaehlen(p, liste) {
    var frei = (liste || FARBEN).filter(function (c) { return c !== p.farbe; });
    var belegt = {};
    p.nachbarn.forEach(function (n) { if (plaetze[n].farbe && plaetze[n].farbe !== 'weiss') belegt[plaetze[n].farbe] = true; });
    var besser = frei.filter(function (c) { return !belegt[c]; });
    var wahl = besser.length ? besser : frei;
    return wahl[Math.floor(rnd() * wahl.length)];
  }
  function klassen(p, zustand) {
    p.k.className = 'kachel ' + p.farbe + (p.icon ? ' icon' : '') + ' ' + zustand;
  }
  // Skalierung schrittweise verkleinern, bis nichts mehr ueberlaeuft
  function anpassen(p) {
    var s = 1.8; // gross anfangen, damit kurze Texte die Kachel fuellen
    p.k.style.setProperty('--skala', s);
    while (s > 0.5 + 1e-9 && (p.inh.scrollHeight > p.inh.clientHeight + 1 || p.inh.scrollWidth > p.inh.clientWidth + 1)) {
      s = Math.round((s - 0.05) * 100) / 100;
      p.k.style.setProperty('--skala', s);
    }
  }
  function befuellen(p, proj) {
    if (p.proj) delete aktiv[p.proj.id];
    p.icon = null;
    p.proj = proj; aktiv[proj.id] = true;
    p.org.textContent = proj.org || '';
    p.tit.textContent = proj.titel;
    p.sat.textContent = proj.satz;
    p.org.lang = p.tit.lang = p.sat.lang = 'de';
    p.farbe = farbeWaehlen(p);
    klassen(p, '');
    anpassen(p);
  }
  function hineinFahren(p) {
    klassen(p, 'rein');
    clearTimeout(p.t);
    p.t = setTimeout(function () { klassen(p, 'steht'); }, 1420);
  }
  // Icons: gemischte Reihenfolge, keines zweimal hintereinander
  var iconBeutel = [], iconLetztes = null;
  function naechstesIcon() {
    if (!iconBeutel.length) {
      iconBeutel = ICONS.slice();
      for (var j = iconBeutel.length - 1; j > 0; j--) {
        var r = Math.floor(rnd() * (j + 1)), t = iconBeutel[j]; iconBeutel[j] = iconBeutel[r]; iconBeutel[r] = t;
      }
      if (iconBeutel.length > 1 && iconBeutel[0] === iconLetztes) iconBeutel.push(iconBeutel.shift());
    }
    iconLetztes = iconBeutel.shift();
    return iconLetztes;
  }
  function iconSetzen(p, src) {
    if (p.proj) delete aktiv[p.proj.id];
    p.proj = null; p.icon = src;
    p.bild.src = src;
    p.farbe = farbeWaehlen(p, ICON_FARBEN);
    klassen(p, '');
  }
  // Vorladen, damit das Icon nicht erst beim Einblenden geladen wird
  if (MIT_ICONS) ICONS.forEach(function (s) { var im = new Image(); im.src = s; });

  function tauschen(p, alsIcon) {
    var neu = alsIcon ? null : naechstes();
    var icon = alsIcon ? naechstesIcon() : null;
    if (neu) aktiv[neu.id] = true;  // reservieren, bis die Kachel gewechselt hat
    klassen(p, 'raus');
    clearTimeout(p.t);
    p.t = setTimeout(function () {
      if (icon) iconSetzen(p, icon); else befuellen(p, neu);
      hineinFahren(p);
    }, 1120);
  }

  // Welche Kachel geht: zufaellig unter der aelteren Haelfte; wer zu lange steht, ist sofort dran
  function opferWaehlen() {
    var sortiert = plaetze.slice().sort(function (a, b) { return a.stamp - b.stamp; });
    var aeltester = sortiert[0];
    if (stampZaehler - aeltester.stamp >= Math.round(N * 1.5)) return aeltester;
    var kandidaten = sortiert.slice(0, Math.max(2, Math.ceil(N / 2)));
    return kandidaten[Math.floor(rnd() * kandidaten.length)];
  }
  var seitIcon = 0;   // Projektwechsel seit dem letzten Icon

  // ---------- Scheduler (eine setTimeout-Kette) ----------
  var timer = null, naechsterZeitpunkt = 0, startIdx = 0, letzterTausch = Date.now(), stampZaehler = 0;
  function takt() { return DAUER / N * 1000; }

  function tick() {
    var jetzt = Date.now();
    letzterTausch = jetzt;
    if (startIdx < N) {
      var p = plaetze[startIdx++];
      p.stamp = stampZaehler++;
      var proj = naechstes();
      befuellen(p, proj);
      hineinFahren(p);
      naechsterZeitpunkt = jetzt + (startIdx < N ? 350 : takt());
    } else {
      var opfer = opferWaehlen();
      opfer.stamp = stampZaehler++;
      var iconSichtbar = plaetze.some(function (q) { return q.icon; });
      // Icon nur in kleinen Plaetzen (nicht im grossen Platz a), nie zwei gleichzeitig
      var alsIcon = MIT_ICONS && ICONS.length && !iconSichtbar && opfer.i !== 0 && seitIcon >= ICON_ABSTAND;
      if (alsIcon) seitIcon = 0; else { seitIcon++; gezeigt++; }
      tauschen(opfer, alsIcon);
      naechsterZeitpunkt += takt();
    }
    planen();
  }
  function planen() {
    clearTimeout(timer);
    var jetzt = Date.now();
    // Zeitdrift tolerieren: liegt der Soll-Zeitpunkt weit zurueck, neu aufsetzen
    if (naechsterZeitpunkt < jetzt - takt()) naechsterZeitpunkt = jetzt + takt();
    timer = setTimeout(tick, Math.max(0, naechsterZeitpunkt - jetzt));
  }

  // Pause im Hintergrund, sauber fortsetzen
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearTimeout(timer); timer = null;
    } else {
      letzterTausch = Date.now();
      naechsterZeitpunkt = Date.now() + (startIdx < N ? 350 : takt());
      planen();
    }
  });

  // Waechter: deutlich laenger als ein Takt (mind. 60 s) kein Tausch -> neu laden
  setInterval(function () {
    if (!document.hidden && Date.now() - letzterTausch > Math.max(60000, 3 * takt())) location.reload();
  }, 5000);

  // Resize: Vorlage neu waehlen, Texte neu einpassen
  var resizeT = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      vorlageAnwenden();
      plaetze.forEach(function (p) { if (p.proj && !p.icon) anpassen(p); });
    }, 150);
  });

  // ---------- Test-Schnittstelle ----------
  window.DEP_WALL = {
    status: function () {
      return {
        n: N,
        sichtbar: plaetze.filter(function (p) { return p.proj; }).map(function (p) { return p.proj.id; }),
        icon: plaetze.filter(function (p) { return p.icon; }).map(function (p) { return { platz: p.i, src: p.icon }; }),
        gezeigt: gezeigt,
        durchlauf: durchlauf
      };
    }
  };

  // Start: erst wenn Lato geladen ist (sonst wuerde mit der Ersatzschrift eingepasst), spaetestens nach 3 s
  var gestartet = false;
  function start() {
    if (gestartet) return;
    gestartet = true;
    naechsterZeitpunkt = Date.now();
    planen();
  }
  if (document.fonts && document.fonts.load) {
    Promise.all(['400', '700', '900'].map(function (w) { return document.fonts.load(w + ' 20px Lato'); })).then(start, start);
    setTimeout(start, 3000);
  } else {
    start();
  }
})();
