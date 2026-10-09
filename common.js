/* Shared helpers for the Kindle games. Plain ES5, DOM tables only (no canvas). */
var KG = {};
KG.INF = 1000000;
KG.MATE = 100000;

KG.load = function (key) {
  try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
};
KG.save = function (key, v) {
  try { window.localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
};
KG.$ = function (id) { return document.getElementById(id); };
KG.text = function (el, txt) { el.innerHTML = ''; el.appendChild(document.createTextNode(txt)); };

KG.shuffle = function (a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};

/* Find the element carrying data-sq (or other attr) from a click event. */
KG.attrFromEvent = function (e, root, attr) {
  e = e || window.event;
  var t = e.target || e.srcElement;
  while (t && t !== root) {
    if (t.getAttribute && t.getAttribute(attr) !== null) return t.getAttribute(attr);
    t = t.parentNode;
  }
  return null;
};

/* A row of buttons acting like radio buttons. onPick may return false to keep the old choice. */
KG.buttonGroup = function (id, value, onPick) {
  var el = KG.$(id);
  if (!el) return;
  var btns = el.getElementsByTagName('button');
  function mark(v) {
    for (var i = 0; i < btns.length; i++) btns[i].className = btns[i].getAttribute('data-v') === v ? 'on' : '';
  }
  el.onclick = function (e) {
    var v = KG.attrFromEvent(e, el, 'data-v');
    if (v === null) return;
    if (onPick(v) !== false) mark(v);
  };
  mark(value);
};

/* ---- Generic alpha-beta search. R is a rules object. ---- */
KG.order = function (R, s, ms) {
  for (var i = 0; i < ms.length; i++) {
    var m = ms[i], cap = s.b[m.t];
    m.o = (cap !== '' ? 10 * R.value(cap) - R.value(s.b[m.f]) / 10 : 0) + (m.p ? 800 : 0);
  }
  ms.sort(function (a, b) { return b.o - a.o; });
};

KG.qs = function (R, s, alpha, beta, qd) {
  var sp = R.evaluate(s);
  if (sp >= beta) return sp;
  if (sp > alpha) alpha = sp;
  if (qd >= 4) return alpha;
  var ms = R.captures(s);
  KG.order(R, s, ms);
  for (var i = 0; i < ms.length; i++) {
    var ns = R.make(s, ms[i]);
    if (R.inCheck(ns, s.t)) continue;
    var v = -KG.qs(R, ns, -beta, -alpha, qd + 1);
    if (v >= beta) return v;
    if (v > alpha) alpha = v;
  }
  return alpha;
};

KG.search = function (R, s, depth, alpha, beta, ply) {
  if (depth <= 0) return KG.qs(R, s, alpha, beta, 0);
  var ms = R.legal(s);
  if (!ms.length) return R.noMoves(s, ply);
  KG.order(R, s, ms);
  for (var i = 0; i < ms.length; i++) {
    var v = -KG.search(R, ms[i].ns, depth - 1, -beta, -alpha, ply + 1);
    if (v >= beta) return v;
    if (v > alpha) alpha = v;
  }
  return alpha;
};

/* level: '1' easy, '2' medium, '3' hard */
KG.best = function (R, s, level) {
  var ms = KG.shuffle(R.legal(s));
  if (!ms.length) return null;
  var easy = level === '1';
  var depth = easy ? 1 : (level === '2' ? 2 : 3);
  KG.order(R, s, ms);
  var best = ms[0], bv = -KG.INF, alpha = -KG.INF;
  for (var i = 0; i < ms.length; i++) {
    var v;
    if (easy) v = -KG.search(R, ms[i].ns, 0, -KG.INF, KG.INF, 1) + Math.random() * 120;
    else v = -KG.search(R, ms[i].ns, depth - 1, -KG.INF, -alpha, 1);
    if (v > bv) { bv = v; best = ms[i]; }
    if (v > alpha) alpha = v;
  }
  return best;
};

/* Plain negamax for games without a capture search. R needs legal (with ns),
   evaluate (side to move) and terminal(s, moves, ply) -> score or null. */
KG.negamax = function (R, s, depth, alpha, beta, ply) {
  var ms = R.legal(s), term = R.terminal(s, ms, ply);
  if (term !== null) return term;
  if (depth <= 0) return R.evaluate(s);
  for (var i = 0; i < ms.length; i++) {
    var v = -KG.negamax(R, ms[i].ns, depth - 1, -beta, -alpha, ply + 1);
    if (v >= beta) return v;
    if (v > alpha) alpha = v;
  }
  return alpha;
};

KG.bestNegamax = function (R, s, depth, noise) {
  var ms = KG.shuffle(R.legal(s));
  if (!ms.length) return null;
  var best = ms[0], bv = -KG.INF, alpha = -KG.INF;
  for (var i = 0; i < ms.length; i++) {
    var v = noise ? -KG.negamax(R, ms[i].ns, depth - 1, -KG.INF, KG.INF, 1) + Math.random() * noise
                  : -KG.negamax(R, ms[i].ns, depth - 1, -KG.INF, -alpha, 1);
    if (v > bv) { bv = v; best = ms[i]; }
    if (v > alpha) alpha = v;
  }
  return best;
};

/* Alquerque-style 5x5 board (Co Ganh, Co Hum). Diagonals run through points where (r + c) is even. */
KG.ALQ_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
KG.alqAdj = function (r, c, n) {
  var out = [], k = (r + c) % 2 === 0 ? 8 : 4;
  for (var i = 0; i < k; i++) {
    var nr = r + KG.ALQ_DIRS[i][0], nc = c + KG.ALQ_DIRS[i][1];
    if (nr >= 0 && nr < n && nc >= 0 && nc < n) out.push([nr, nc, i]);
  }
  return out;
};
/* Grid lines drawn inside the cell for point (r, c), in display coordinates. */
KG.alqLines = function (S, r, c, n) {
  var h = [], lw = S >= 60 ? 3 : 2, half = Math.floor(S / 2), lo = half - Math.floor(lw / 2);
  var dl = Math.round(S * 0.7072);
  function seg(l, t, w, hh) { h.push('<div class="seg" style="left:' + l + 'px;top:' + t + 'px;width:' + w + 'px;height:' + hh + 'px"></div>'); }
  if (c > 0) seg(0, lo, half, lw);
  if (c < n - 1) seg(lo, lo, S - lo, lw);
  if (r > 0) seg(lo, 0, lw, half);
  if (r < n - 1) seg(lo, lo, lw, S - lo);
  if ((r + c) % 2 === 0) {
    for (var i = 4; i < 8; i++) {
      var d = KG.ALQ_DIRS[i], nr = r + d[0], nc = c + d[1];
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      var tf = 'rotate(' + Math.round(Math.atan2(d[0], d[1]) * 180 / Math.PI) + 'deg)';
      h.push('<div class="diag" style="left:' + half + 'px;top:' + lo + 'px;width:' + dl + 'px;height:' + lw +
        'px;-webkit-transform:' + tf + ';transform:' + tf + '"></div>');
    }
  }
  return h.join('');
};

/* ---- Shared board-game screen controller ---- */
KG.Game = function (R) {
  var boardEl = KG.$('board'), statusEl = KG.$('status'), logEl = KG.$('log');
  var saved = KG.load(R.key) || {};
  var st = {
    s: saved.s || R.newState(),
    hist: saved.hist || [],
    log: saved.log || [],
    last: saved.last || null,
    mode: saved.mode || 'ai1',
    level: saved.level || '2',
    flip: !!saved.flip,
    opt: saved.opt || R.defaultOpt
  };
  var sel = -1, moves = [], result = null, thinking = false;

  function inCheck() { return R.inCheck ? R.inCheck(st.s, st.s.t) : false; }
  function human() { return st.mode === 'ai2' ? R.sides[1] : R.sides[0]; }
  function computersTurn() { return st.mode !== '2p' && st.s.t !== human() && !result; }

  function save() {
    KG.save(R.key, { s: st.s, hist: st.hist, log: st.log, last: st.last, mode: st.mode,
      level: st.level, flip: st.flip, opt: st.opt });
  }

  function draw() {
    var w = Math.min((window.innerWidth || 600) - 24, 760);
    var h = (window.innerHeight || 800) - 300;
    var cell = Math.floor(Math.min(w / R.cols, h / R.rows));
    cell = Math.max(28, cell);
    var targets = {};
    for (var i = 0; i < moves.length; i++) if (moves[i].f === sel) targets[moves[i].t] = 1;
    R.render(boardEl, cell, {
      s: st.s, sel: sel, targets: targets, last: st.last, opt: st.opt,
      flip: (st.mode === 'ai2') !== st.flip, check: inCheck()
    });
  }

  function setStatus() {
    var txt;
    if (result) txt = result;
    else if (thinking) txt = 'Computer is thinking…';
    else {
      txt = R.sideName(st.s.t) + ' to move';
      if (st.mode !== '2p') txt += st.s.t === human() ? ' (you)' : ' (computer)';
      if (inCheck()) txt += ' \u2014 CHECK';
      if (R.extraStatus) txt += R.extraStatus(st.s);
    }
    KG.text(statusEl, txt);
  }

  function drawLog() {
    var parts = [];
    for (var i = 0; i < st.log.length; i++) {
      parts.push((i % 2 === 0 ? (i / 2 + 1) + '. ' : '') + st.log[i]);
    }
    KG.text(logEl, parts.join('  '));
  }

  function refresh() {
    moves = R.legal(st.s);
    result = R.result(st.s, moves);
    if (KG.$('levels')) KG.$('levels').style.display = st.mode === '2p' ? 'none' : '';
    setStatus();
    draw();
    drawLog();
    save();
    if (computersTurn() && !thinking) {
      thinking = true;
      setStatus();
      setTimeout(function () {
        var m = (R.best || KG.best)(R, st.s, st.level);
        thinking = false;
        if (m && computersTurn()) play(m);
        else setStatus();
      }, 80);
    }
  }

  function play(m) {
    st.log.push(R.notate(st.s, m, moves));
    st.hist.push({ s: st.s, last: st.last });
    st.s = m.ns || R.make(st.s, m);
    st.last = { f: m.f, t: m.t };
    sel = -1;
    if (R.cancelChoose) R.cancelChoose();
    refresh();
  }

  function tap(sq) {
    if (R.cancelChoose) R.cancelChoose();
    if (thinking || result || computersTurn() || sq < 0) return;
    var cands = [], i;
    for (i = 0; i < moves.length; i++) if (moves[i].f === sel && moves[i].t === sq) cands.push(moves[i]);
    if (cands.length === 1) { play(cands[0]); return; }
    if (cands.length > 1 && R.choose) { R.choose(cands, play); return; }
    var mine = false;
    for (i = 0; i < moves.length; i++) if (moves[i].f === sq) { mine = true; break; }
    sel = (mine && sel !== sq) ? sq : -1;
    draw();
  }

  boardEl.onclick = function (e) {
    var v = KG.attrFromEvent(e, boardEl, 'data-sq');
    if (v !== null) tap(parseInt(v, 10));
  };

  KG.$('newBtn').onclick = function () {
    if (thinking) return;
    if (st.hist.length && !result && !window.confirm('Start a new game?')) return;
    st.s = R.newState(); st.hist = []; st.log = []; st.last = null; sel = -1;
    refresh();
  };
  KG.$('undoBtn').onclick = function () {
    if (thinking || !st.hist.length) return;
    do {
      var h = st.hist.pop();
      st.s = h.s; st.last = h.last; st.log.pop();
    } while (st.mode !== '2p' && st.hist.length && st.s.t !== human());
    sel = -1;
    refresh();
  };
  if (KG.$('flipBtn')) KG.$('flipBtn').onclick = function () { st.flip = !st.flip; draw(); save(); };
  KG.buttonGroup('modes', st.mode, function (v) { st.mode = v; st.flip = false; sel = -1; refresh(); });
  KG.buttonGroup('levels', st.level, function (v) { st.level = v; save(); });
  KG.buttonGroup('opts', st.opt, function (v) { st.opt = v; draw(); save(); });
  window.onresize = function () { draw(); };

  refresh();
};
