/* Solver para Google Sheets · motor de programación lineal y entera · MIT · generado desde pruebas/lp.mjs */
(function () {
'use strict';
// Motor de programación lineal y entera.
// Simplex de dos fases con la regla de Bland (no cicla) y ramificación y acotación
// para variables enteras. Sirve para tres cosas:
//   1. comprobar que los números de los ejemplos de la web son exactos;
//   2. hacer de LinearOptimizationService falso para probar el script de la plantilla;
//   3. desde el 09/10/2026, es el motor del Solver online de la web: construir.mjs lo copia a
//      web/assets/motor.js (quitando los «export»). Cualquier cambio aquí se publica.

const EPS = 1e-9;

/**
 * Resuelve min/max c·x  sujeto a  filas (a·x <=|>=|= b)  y  lb <= x <= ub.
 * @param {{sense:'max'|'min', c:number[], rows:{a:number[], op:'<='|'>='|'=', b:number}[],
 *          lb?:number[], ub?:number[]}} m
 * @returns {{status:'OPTIMAL'|'INFEASIBLE'|'UNBOUNDED', x?:number[], z?:number}}
 */
function solveLP(m) {
  const n = m.c.length;
  const lb = m.lb ? m.lb.slice() : Array(n).fill(0);
  const ub = m.ub ? m.ub.slice() : Array(n).fill(Infinity);
  for (let j = 0; j < n; j++) if (lb[j] > ub[j] + EPS) return { status: 'INFEASIBLE' };

  // Cambio de variable para que todas queden >= 0:
  //   lb finito      -> x = lb + y           (y >= 0, y <= ub - lb)
  //   solo ub finito -> x = ub - y           (y >= 0)
  //   libre          -> x = y+ - y-
  const cols = []; // cada columna nueva: {j, sign}
  const shift = Array(n).fill(0);
  const extraRows = [];
  for (let j = 0; j < n; j++) {
    if (Number.isFinite(lb[j])) {
      shift[j] = lb[j];
      cols.push({ j, sign: 1 });
      if (Number.isFinite(ub[j])) extraRows.push({ col: cols.length - 1, b: ub[j] - lb[j] });
    } else if (Number.isFinite(ub[j])) {
      shift[j] = ub[j];
      cols.push({ j, sign: -1 });
    } else {
      cols.push({ j, sign: 1 });
      cols.push({ j, sign: -1 });
    }
  }
  const N = cols.length;
  const rows = [];
  for (const r of m.rows) {
    let b = r.b;
    for (let j = 0; j < n; j++) b -= (r.a[j] || 0) * shift[j];
    const a = cols.map(({ j, sign }) => (r.a[j] || 0) * sign);
    rows.push({ a, op: r.op, b });
  }
  for (const e of extraRows) {
    const a = Array(N).fill(0);
    a[e.col] = 1;
    rows.push({ a, op: '<=', b: e.b });
  }
  const cMin = cols.map(({ j, sign }) => (m.sense === 'max' ? -1 : 1) * m.c[j] * sign);

  // Forma estándar con holguras y artificiales.
  const M = rows.length;
  let nSlack = 0;
  for (const r of rows) if (r.op !== '=') nSlack++;
  const nArt = M;
  const total = N + nSlack + nArt;
  const T = [];
  const basis = [];
  let s = 0;
  for (let i = 0; i < M; i++) {
    const r = rows[i];
    const row = new Float64Array(total + 1);
    let sgn = r.b < 0 ? -1 : 1;
    for (let k = 0; k < N; k++) row[k] = sgn * r.a[k];
    if (r.op !== '=') {
      row[N + s] = sgn * (r.op === '<=' ? 1 : -1);
      s++;
    }
    row[N + nSlack + i] = 1;
    row[total] = sgn * r.b;
    T.push(row);
    basis.push(N + nSlack + i);
  }

  const pivot = (pr, pc) => {
    const prow = T[pr];
    const pv = prow[pc];
    for (let k = 0; k <= total; k++) prow[k] /= pv;
    for (let i = 0; i < M; i++) {
      if (i === pr) continue;
      const f = T[i][pc];
      if (Math.abs(f) > 0) for (let k = 0; k <= total; k++) T[i][k] -= f * prow[k];
    }
    basis[pr] = pc;
  };

  const runSimplex = (cost, allowed) => {
    for (let iter = 0; iter < 100000; iter++) {
      // costes reducidos
      let enter = -1;
      for (let k = 0; k < total; k++) {
        if (!allowed(k) || basis.includes(k)) continue;
        let rc = cost[k];
        for (let i = 0; i < M; i++) rc -= cost[basis[i]] * T[i][k];
        if (rc < -EPS) { enter = k; break; } // Bland: el primer índice que mejora
      }
      if (enter === -1) return 'OPTIMAL';
      let leave = -1;
      let best = Infinity;
      for (let i = 0; i < M; i++) {
        const a = T[i][enter];
        if (a > EPS) {
          const ratio = T[i][total] / a;
          if (ratio < best - EPS || (Math.abs(ratio - best) <= EPS && basis[i] < basis[leave])) {
            best = ratio;
            leave = i;
          }
        }
      }
      if (leave === -1) return 'UNBOUNDED';
      pivot(leave, enter);
    }
    throw new Error('Demasiadas iteraciones');
  };

  // Fase 1: minimizar la suma de artificiales.
  const c1 = new Float64Array(total);
  for (let i = 0; i < nArt; i++) c1[N + nSlack + i] = 1;
  runSimplex(c1, () => true);
  let infeas = 0;
  for (let i = 0; i < M; i++) if (basis[i] >= N + nSlack) infeas += T[i][total];
  if (infeas > 1e-7) return { status: 'INFEASIBLE' };
  // Sacar de la base las artificiales que queden a nivel cero.
  for (let i = 0; i < M; i++) {
    if (basis[i] >= N + nSlack) {
      for (let k = 0; k < N + nSlack; k++) {
        if (Math.abs(T[i][k]) > EPS && !basis.includes(k)) { pivot(i, k); break; }
      }
    }
  }
  // Fase 2.
  const c2 = new Float64Array(total);
  for (let k = 0; k < N; k++) c2[k] = cMin[k];
  const st = runSimplex(c2, (k) => k < N + nSlack);
  if (st === 'UNBOUNDED') return { status: 'UNBOUNDED' };

  const y = Array(N).fill(0);
  for (let i = 0; i < M; i++) if (basis[i] < N) y[basis[i]] = T[i][total];
  const x = shift.slice();
  cols.forEach(({ j, sign }, k) => { x[j] += sign * y[k]; });
  const z = m.c.reduce((acc, cj, j) => acc + cj * x[j], 0);
  return { status: 'OPTIMAL', x, z };
}

/**
 * Programación entera mixta por ramificación y acotación.
 * @param m  igual que solveLP, más  isInt: boolean[]  y, opcional, limiteMs: si se agota el
 *           tiempo devuelve la mejor solución encontrada con status 'FEASIBLE', o 'TIMEOUT'.
 */
function solveMIP(m) {
  const n = m.c.length;
  const isInt = m.isInt || Array(n).fill(false);
  const sgn = m.sense === 'max' ? 1 : -1;
  let best = null;
  let nodes = 0;
  const stack = [{ lb: (m.lb || Array(n).fill(0)).slice(), ub: (m.ub || Array(n).fill(Infinity)).slice() }];
  let rootStatus = null;
  const hasta = m.limiteMs ? Date.now() + m.limiteMs : Infinity;
  while (stack.length) {
    if (Date.now() > hasta) return best ? { ...best, status: 'FEASIBLE' } : { status: 'TIMEOUT' };
    const node = stack.pop();
    nodes++;
    if (nodes > 200000) throw new Error('Demasiados nodos');
    const r = solveLP({ ...m, lb: node.lb, ub: node.ub });
    if (rootStatus === null) rootStatus = r.status;
    if (r.status !== 'OPTIMAL') {
      if (r.status === 'UNBOUNDED' && nodes === 1) return { status: 'UNBOUNDED' };
      continue;
    }
    if (best && sgn * r.z <= sgn * best.z + 1e-9) continue; // poda por cota
    let frac = -1;
    let fracDist = 0;
    for (let j = 0; j < n; j++) {
      if (!isInt[j]) continue;
      const d = Math.abs(r.x[j] - Math.round(r.x[j]));
      if (d > 1e-7 && d > fracDist) { frac = j; fracDist = d; }
    }
    if (frac === -1) {
      const x = r.x.map((v, j) => (isInt[j] ? Math.round(v) : v));
      const z = m.c.reduce((acc, cj, j) => acc + cj * x[j], 0);
      best = { status: 'OPTIMAL', x, z };
      continue;
    }
    const v = r.x[frac];
    const down = { lb: node.lb.slice(), ub: node.ub.slice() };
    down.ub[frac] = Math.floor(v);
    const up = { lb: node.lb.slice(), ub: node.ub.slice() };
    up.lb[frac] = Math.ceil(v);
    stack.push(down, up);
  }
  return best || { status: 'INFEASIBLE' };
}

/** Comprueba que x cumple todas las filas y límites. */
function isFeasible(m, x, tol = 1e-6) {
  const n = m.c.length;
  const lb = m.lb || Array(n).fill(0);
  const ub = m.ub || Array(n).fill(Infinity);
  for (let j = 0; j < n; j++) if (x[j] < lb[j] - tol || x[j] > ub[j] + tol) return false;
  for (const r of m.rows) {
    const lhs = r.a.reduce((acc, a, j) => acc + (a || 0) * x[j], 0);
    if (r.op === '<=' && lhs > r.b + tol) return false;
    if (r.op === '>=' && lhs < r.b - tol) return false;
    if (r.op === '=' && Math.abs(lhs - r.b) > tol) return false;
  }
  return true;
}

self.MotorLP = { solveLP: solveLP, solveMIP: solveMIP };
if (typeof document === 'undefined') {
  self.onmessage = function (e) {
    var inicio = Date.now();
    try { self.postMessage({ ok: true, r: solveMIP(e.data), ms: Date.now() - inicio }); }
    catch (err) { self.postMessage({ ok: false, error: String((err && err.message) || err) }); }
  };
}
})();
