/* Shared code for the Latin-square number puzzles (Killer Sudoku, KenKen, Futoshiki, Skyscrapers). ES5. */
var PZ = {};

/* Random n x n Latin square (values 1..n). */
PZ.latin = function (n) {
  var g = [], r, c, rows = [], cols = [], sym = [];
  for (r = 0; r < n; r++) { rows.push(r); cols.push(r); sym.push(r + 1); }
  KG.shuffle(rows); KG.shuffle(cols); KG.shuffle(sym);
  for (r = 0; r < n; r++) for (c = 0; c < n; c++) g.push(sym[(rows[r] + cols[c]) % n]);
  return g;
};

/* Backtracking solver. grid: array of 0 (empty) or digits. box: 3 for 9x9 Sudoku boxes, else 0.
   ok(grid, i, v): extra rule check after placing v at i. Returns number of solutions found (up to limit),
   or -1 if it gave up after `budget` steps. The first solution is copied into out. */
PZ.solve = function (n, grid, box, ok, limit, out, budget) {
  var g = grid.slice(), N = n * n, R = [], C = [], B = [], i, count = 0, steps = 0;
  budget = budget || 200000;
  for (i = 0; i < n; i++) { R.push(0); C.push(0); B.push(0); }
  function bx(k) { return box ? Math.floor(Math.floor(k / n) / box) * box + Math.floor((k % n) / box) : 0; }
  for (i = 0; i < N; i++) if (g[i]) { var b = 1 << g[i]; R[Math.floor(i / n)] |= b; C[i % n] |= b; if (box) B[bx(i)] |= b; }
  var gaveUp = false;
  function rec() {
    if (++steps > budget) { gaveUp = true; return true; }
    var best = -1, bestList = null, j, v;
    for (j = 0; j < N; j++) {
      if (g[j]) continue;
      var used = R[Math.floor(j / n)] | C[j % n] | (box ? B[bx(j)] : 0), list = [];
      for (v = 1; v <= n; v++) {
        if (used & (1 << v)) continue;
        g[j] = v;
        if (!ok || ok(g, j, v)) list.push(v);
        g[j] = 0;
      }
      if (best < 0 || list.length < bestList.length) { best = j; bestList = list; if (list.length <= 1) break; }
    }
    if (best < 0) { count++; if (out && count === 1) for (j = 0; j < N; j++) out[j] = g[j]; return count >= limit; }
    for (var k = 0; k < bestList.length; k++) {
      v = bestList[k];
      var bit = 1 << v, r = Math.floor(best / n), c = best % n, bb = box ? bx(best) : 0;
      g[best] = v; R[r] |= bit; C[c] |= bit; if (box) B[bb] |= bit;
      if (rec()) return true;
      g[best] = 0; R[r] &= ~bit; C[c] &= ~bit; if (box) B[bb] &= ~bit;
    }
    return false;
  }
  rec();
  return gaveUp ? -1 : count;
};

/* Random valid 9x9 Sudoku grid: a fixed pattern with rows, columns, bands, stacks and digits shuffled. */
PZ.sudokuGrid = function () {
  function perm3() { return KG.shuffle([0, 1, 2]); }
  var rows = [], cols = [], bands = perm3(), stacks = perm3(), digits = KG.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]), i, j, g = [];
  for (i = 0; i < 3; i++) { var pr = perm3(), pc = perm3(); for (j = 0; j < 3; j++) { rows.push(bands[i] * 3 + pr[j]); cols.push(stacks[i] * 3 + pc[j]); } }
  for (i = 0; i < 9; i++) for (j = 0; j < 9; j++) {
    var r = rows[i], c = cols[j];
    g.push(digits[(r * 3 + Math.floor(r / 3) + c) % 9]);
  }
  return g;
};

/* Keep adding givens (from the solution) until the puzzle has exactly one solution. */
PZ.makeUnique = function (n, sol, giv, box, ok, budget) {
  var order = [], i;
  for (i = 0; i < n * n; i++) if (!giv[i]) order.push(i);
  KG.shuffle(order);
  for (;;) {
    var res = PZ.solve(n, giv, box, ok, 2, null, budget);
    if (res === 1 || !order.length) return giv;
    var p = order.pop();
    giv[p] = sol[p];
  }
};

/* Cages: random partition of the grid into connected groups. maxSize, and allowed(cage, cell) to accept a cell. */
PZ.cages = function (n, maxSize, allowed) {
  var N = n * n, owner = [], cages = [], order = [], i;
  for (i = 0; i < N; i++) { owner.push(-1); order.push(i); }
  KG.shuffle(order);
  for (i = 0; i < N; i++) {
    var start = order[i];
    if (owner[start] >= 0) continue;
    var cage = [start], target = 1 + Math.floor(Math.random() * maxSize);
    owner[start] = cages.length;
    while (cage.length < target) {
      var opts = [];
      for (var k = 0; k < cage.length; k++) {
        var p = cage[k], r = Math.floor(p / n), c = p % n, nb = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
        for (var j = 0; j < 4; j++) {
          var q = nb[j][0] * n + nb[j][1];
          if (nb[j][0] >= 0 && nb[j][0] < n && nb[j][1] >= 0 && nb[j][1] < n && owner[q] < 0 && (!allowed || allowed(cage, q))) opts.push(q);
        }
      }
      if (!opts.length) break;
      var pick = opts[Math.floor(Math.random() * opts.length)];
      owner[pick] = cages.length; cage.push(pick);
    }
    cages.push(cage);
  }
  return { cages: cages, owner: owner };
};

/* Thick borders where the neighbouring cell is in a different cage (or the edge). */
PZ.cageBorders = function (n, owner, i) {
  var r = Math.floor(i / n), c = i % n, o = owner[i];
  function side(rr, cc) { return rr < 0 || rr >= n || cc < 0 || cc >= n || owner[rr * n + cc] !== o ? '3px solid #000' : '1px solid #bbb'; }
  return 'border-top:' + side(r - 1, c) + ';border-bottom:' + side(r + 1, c) + ';border-left:' + side(r, c - 1) + ';border-right:' + side(r, c + 1);
};

/* Screen controller. P = { key, levels: { v: label }, defaultLevel, make(level) -> puzzle with n, sol, giv (0 or digit),
   and optional: cellStyle(pz, i), deco(pz, i, S) -> html, frame(pz) -> { top, bottom, left, right } clue arrays,
   spacing (px between cells), tableClass }. */
PZ.game = function (P) {
  var boardEl = KG.$('board'), statusEl = KG.$('status'), padEl = KG.$('pad');
  var saved = KG.load(P.key) || {};
  var level = saved.level || P.defaultLevel, pz = saved.pz || null, cells = saved.cells || null, hist = [], sel = -1, bad = {}, msg = '', done = false;

  function fresh() {
    KG.text(statusEl, 'Making a new puzzle…');
    boardEl.innerHTML = '';
    setTimeout(function () {
      pz = P.make(level);
      cells = pz.giv.slice();
      hist = []; sel = -1; bad = {}; msg = ''; done = false;
      render();
    }, 50);
  }
  function checkDone() {
    for (var i = 0; i < cells.length; i++) if (cells[i] !== pz.sol[i]) return;
    done = true; sel = -1;
  }
  function render() {
    var n = pz.n, i, filled = 0;
    for (i = 0; i < cells.length; i++) if (cells[i]) filled++;
    KG.text(statusEl, done ? 'Solved — well done!' : (n * n - filled) + ' squares to fill' + (msg ? ' — ' + msg : ''));
    var fr = P.frame ? P.frame(pz) : null, sp = P.spacing || 0, extra = fr ? 2 : 0;
    var W = Math.min((window.innerWidth || 600) - 24, (window.innerHeight || 800) - 330, 620);
    var S = Math.floor((W - sp * (n + extra)) / (n + extra)) - 1, fs = Math.round(S * 0.55), selV = sel >= 0 ? cells[sel] : 0;
    var h = ['<table class="pzt ' + (P.tableClass || '') + '" style="' + (sp ? 'border-collapse:separate;border-spacing:' + sp + 'px' : 'border-collapse:collapse') + '">'];
    function clue(v) { return '<td style="width:' + S + 'px;height:' + S + 'px;text-align:center;font-weight:bold;font-size:' + Math.round(S * 0.45) + 'px">' + (v || '') + '</td>'; }
    if (fr) { h.push('<tr><td></td>'); for (i = 0; i < n; i++) h.push(clue(fr.top[i])); h.push('<td></td></tr>'); }
    for (var r = 0; r < n; r++) {
      h.push('<tr>');
      if (fr) h.push(clue(fr.left[r]));
      for (var c = 0; c < n; c++) {
        i = r * n + c;
        var v = cells[i], cls = pz.giv[i] ? 'pg' : 'pu';
        var bg = i === sel ? 'background:#000;color:#fff;' : (bad[i] ? 'background:#777;color:#fff;' : (selV && v === selV ? 'background:#ccc;' : ''));
        h.push('<td data-sq="' + i + '" class="' + cls + '" style="padding:0;' + (P.cellStyle ? P.cellStyle(pz, i) : 'border:2px solid #000') + ';' + bg + '">' +
          '<div style="position:relative;width:' + S + 'px;height:' + S + 'px">' + (P.deco ? P.deco(pz, i, S) : '') +
          '<div style="position:absolute;left:0;right:0;top:0;line-height:' + S + 'px;text-align:center;font-size:' + fs + 'px">' + (v || '') + '</div></div></td>');
      }
      if (fr) h.push(clue(fr.right[r]));
      h.push('</tr>');
    }
    if (fr) { h.push('<tr><td></td>'); for (i = 0; i < n; i++) h.push(clue(fr.bottom[i])); h.push('<td></td></tr>'); }
    h.push('</table>');
    boardEl.innerHTML = h.join('');
    var keys = [];
    for (i = 1; i <= n; i++) keys.push('<button data-n="' + i + '">' + i + '</button>');
    keys.push('<button data-n="0">&times;</button>');
    padEl.innerHTML = keys.join('');
    KG.save(P.key, { level: level, pz: pz, cells: cells });
  }
  boardEl.onclick = function (e) {
    var v = KG.attrFromEvent(e, boardEl, 'data-sq');
    if (v === null || done) return;
    sel = parseInt(v, 10); render();
  };
  padEl.onclick = function (e) {
    var v = KG.attrFromEvent(e, padEl, 'data-n');
    if (v === null || done) return;
    if (sel < 0) { msg = 'tap a square first'; render(); return; }
    if (pz.giv[sel]) return;
    var d = parseInt(v, 10);
    hist.push([sel, cells[sel]]);
    cells[sel] = cells[sel] === d ? 0 : d;
    delete bad[sel]; msg = '';
    checkDone(); render();
  };
  KG.$('checkBtn').onclick = function () {
    bad = {}; var k = 0;
    for (var i = 0; i < cells.length; i++) if (cells[i] && cells[i] !== pz.sol[i]) { bad[i] = 1; k++; }
    msg = k ? k + ' wrong' : 'no mistakes so far'; render();
  };
  KG.$('hintBtn').onclick = function () {
    if (done) return;
    var p = sel >= 0 && cells[sel] !== pz.sol[sel] ? sel : -1, i;
    if (p < 0) for (i = 0; i < cells.length; i++) if (cells[i] !== pz.sol[i]) { p = i; break; }
    if (p < 0) return;
    hist.push([p, cells[p]]); cells[p] = pz.sol[p]; sel = p; delete bad[p]; msg = 'filled one square';
    checkDone(); render();
  };
  KG.$('undoBtn').onclick = function () {
    if (!hist.length || done) return;
    var h = hist.pop(); cells[h[0]] = h[1]; sel = h[0]; render();
  };
  KG.$('newBtn').onclick = function () {
    if (!done && hist.length && !window.confirm('Start a new puzzle?')) return;
    fresh();
  };
  KG.buttonGroup('levels', level, function (v) {
    if (!done && hist.length && !window.confirm('Start a new puzzle at this level?')) return false;
    level = v; fresh();
  });
  window.onresize = function () { if (pz) render(); };
  if (pz && cells) { checkDone(); render(); } else fresh();
};
