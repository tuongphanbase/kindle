/* Shared helpers for the Kindle games. Plain ES5 for old Kindle browsers. */
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

KG.setupCanvas = function (canvas, w, h) {
  var d = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * d);
  canvas.height = Math.round(h * d);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  var ctx = canvas.getContext('2d');
  ctx.setTransform(d, 0, 0, d, 0, 0);
  return ctx;
};

KG.circle = function (ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2, false);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
};

KG.shuffle = function (a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
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
    if (easy) {
      v = -KG.search(R, ms[i].ns, depth - 1, -KG.INF, KG.INF, 1) + Math.random() * 120;
    } else {
      v = -KG.search(R, ms[i].ns, depth - 1, -KG.INF, -alpha, 1);
    }
    if (v > bv) { bv = v; best = ms[i]; }
    if (v > alpha) alpha = v;
  }
  return best;
};

/* ---- Shared game screen controller ---- */
KG.Game = function (R) {
  var canvas = KG.$('board'), statusEl = KG.$('status');
  var modeEl = KG.$('mode'), levelEl = KG.$('level'), optEl = KG.$('opt');
  var saved = KG.load(R.key) || {};
  var st = {
    s: saved.s || R.newState(),
    hist: saved.hist || [],
    last: saved.last || null,
    mode: saved.mode || 'ai1',
    level: saved.level || '2',
    flip: !!saved.flip,
    opt: saved.opt || R.defaultOpt
  };
  var sel = -1, moves = [], result = null, thinking = false, geo = null;

  modeEl.value = st.mode; levelEl.value = st.level; optEl.value = st.opt;

  function human() { return st.mode === 'ai2' ? R.sides[1] : R.sides[0]; }
  function computersTurn() { return st.mode !== '2p' && st.s.t !== human() && !result; }
  function viewFlip() { return (st.mode === 'ai2') !== st.flip; }

  function save() {
    KG.save(R.key, { s: st.s, hist: st.hist, last: st.last, mode: st.mode, level: st.level, flip: st.flip, opt: st.opt });
  }

  function draw() {
    var reserve = 250;
    var w = Math.min((window.innerWidth || 600) - 20, ((window.innerHeight || 800) - reserve) / R.aspect, 760);
    w = Math.max(240, Math.floor(w));
    var h = Math.floor(w * R.aspect);
    var ctx = KG.setupCanvas(canvas, w, h);
    var targets = [];
    for (var i = 0; i < moves.length; i++) if (moves[i].f === sel) targets.push(moves[i].t);
    geo = { w: w, h: h, flip: viewFlip() };
    R.draw(ctx, geo, { s: st.s, sel: sel, targets: targets, last: st.last, opt: st.opt, check: R.inCheck(st.s, st.s.t) });
  }

  function setStatus() {
    var txt;
    if (result) txt = result;
    else if (thinking) txt = 'Computer is thinking…';
    else {
      txt = R.sideName(st.s.t) + ' to move';
      if (st.mode !== '2p') txt += st.s.t === human() ? ' (you)' : ' (computer)';
      if (R.inCheck(st.s, st.s.t)) txt = 'Check! ' + txt;
    }
    if (st.last && !thinking) txt += ' — last: ' + R.moveText(st.last);
    statusEl.innerHTML = '';
    statusEl.appendChild(document.createTextNode(txt));
  }

  function refresh() {
    moves = R.legal(st.s);
    result = R.result(st.s, moves);
    setStatus();
    draw();
    save();
    if (computersTurn() && !thinking) {
      thinking = true;
      setStatus();
      setTimeout(function () {
        var m = KG.best(R, st.s, st.level);
        thinking = false;
        if (m && computersTurn()) play(m);
        else setStatus();
      }, 80);
    }
  }

  function play(m) {
    st.hist.push({ s: st.s, last: st.last });
    st.s = m.ns || R.make(st.s, m);
    st.last = { f: m.f, t: m.t, p: m.p || '' };
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

  canvas.onclick = function (e) {
    e = e || window.event;
    var r = canvas.getBoundingClientRect();
    tap(R.hit(e.clientX - r.left, e.clientY - r.top, geo));
  };

  KG.$('newBtn').onclick = function () {
    if (thinking) return;
    if (st.hist.length && !result && !window.confirm('Start a new game?')) return;
    st.s = R.newState(); st.hist = []; st.last = null; sel = -1;
    refresh();
  };
  KG.$('undoBtn').onclick = function () {
    if (thinking || !st.hist.length) return;
    do {
      var h = st.hist.pop();
      st.s = h.s; st.last = h.last;
    } while (st.mode !== '2p' && st.hist.length && st.s.t !== human());
    sel = -1;
    refresh();
  };
  KG.$('flipBtn').onclick = function () { st.flip = !st.flip; draw(); save(); };
  modeEl.onchange = function () { st.mode = modeEl.value; st.flip = false; sel = -1; refresh(); };
  levelEl.onchange = function () { st.level = levelEl.value; save(); };
  optEl.onchange = function () { st.opt = optEl.value; draw(); save(); };
  window.onresize = function () { draw(); };

  refresh();
};
