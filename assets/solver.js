/* Solver online · Solver para Google Sheets (castellano e inglés).
   La tabla se edita en la página y se resuelve en el navegador con assets/motor.js, el mismo motor
   que validan las pruebas. Nada sale del navegador: ni el modelo ni los resultados. */
(function () {
  'use strict';

  var raiz = document.querySelector('[data-solver]');
  if (!raiz) return;
  var datos = JSON.parse(raiz.querySelector('.sv-datos').textContent);
  var EN = (document.documentElement.getAttribute('lang') || 'es').indexOf('en') === 0;
  var MAX_VARS = 40, MAX_FILAS = 40, LIMITE_MS = 8000;

  var L = EN ? {
    objetivo: 'Goal', max: 'Maximize', min: 'Minimize', ejemplo: 'Example', enBlanco: 'Blank model',
    masVar: 'Variable', masRest: 'Constraint', compartir: 'Share', copiado: 'Link copied', noCopia: 'Copy the address bar to share it',
    resolver: 'Solve', resolviendo: 'Solving…', atajo: 'Ctrl + Enter solves',
    variables: 'Variables', aporta: 'Objective (per unit)', tipo: 'Type', minimo: 'Min', maximo: 'Max', sinLimite: 'none',
    tipos: { c: 'Continuous', i: 'Integer', b: 'Binary' },
    restricciones: 'Constraints', usado: 'Used', signo: 'Sign', limite: 'Limit', holgura: 'Slack', solucion: 'Solution',
    nuevaVar: function (n) { return 'Variable ' + n; }, nuevaRest: function (n) { return 'Constraint ' + n; },
    quitarVar: function (n) { return 'Remove variable “' + n + '”'; }, quitarRest: function (n) { return 'Remove constraint “' + n + '”'; },
    nombreVar: function (n) { return 'Name of variable ' + n; }, nombreRest: function (n) { return 'Name of constraint ' + n; },
    celda: function (f, c) { return f + ', ' + c; },
    optima: 'Optimal solution', factible: 'Valid solution, maybe not the best', valor: 'Objective value',
    factibleTxt: 'The time limit ran out before proving it’s the best. Try fewer integer variables, or solve it in the template.',
    timeout: 'No solution found in time', timeoutTxt: 'The model is too hard for the browser. Try fewer integer variables, or solve it in the template, which uses Google’s engine.',
    infactible: 'No solution meets every constraint', infactibleTxt: 'It’s usually a sign the wrong way round (≤ instead of ≥) or an impossible limit. Check the Min and Max rows too.',
    ilimitado: 'The objective can grow forever', ilimitadoTxt: 'A constraint is missing: something must limit the variables that improve the objective (demand, hours, budget…).',
    errorMotor: 'The solver failed', errorMotorTxt: function (d) { return 'Something went wrong while solving (' + d + '). Check the numbers and try again.'; },
    falta: 'Something is missing in the table',
    faltaNum: function (q) { return '“' + q + '” isn’t a number.'; },
    faltaLimite: function (n) { return 'Constraint “' + n + '” needs a limit.'; },
    sinVars: 'Add at least one variable.',
    minMayor: function (n) { return 'Variable “' + n + '” has a minimum larger than its maximum.'; },
    sinCoefs: 'Write what each variable adds to the objective (the “Objective” row).',
    cambiado: 'You changed the model: solve again to update the result.',
    enMs: function (ms, n) { return 'Solved in your browser in ' + (ms < 1000 ? ms + ' ms' : (ms / 1000).toFixed(1) + ' s') + ' · ' + n + ' variables'; },
    llevar: 'Take it to Google Sheets', llevarTxt: 'The free template solves the same models inside your own sheet, with Google’s engine.',
    copia: 'Make a copy of the template', avisame: 'Get early access to the add-on',
    revisa: 'The answer is only as good as the model: check it describes your problem before you decide.',
    restaurado: 'We restored your last model from this browser.', editado: 'edited',
  } : {
    objetivo: 'Objetivo', max: 'Maximizar', min: 'Minimizar', ejemplo: 'Ejemplo', enBlanco: 'Modelo en blanco',
    masVar: 'Variable', masRest: 'Restricción', compartir: 'Compartir', copiado: 'Enlace copiado', noCopia: 'Copia la dirección de la barra para compartirlo',
    resolver: 'Resolver', resolviendo: 'Resolviendo…', atajo: 'Ctrl + Intro resuelve',
    variables: 'Variables', aporta: 'Objetivo (por unidad)', tipo: 'Tipo', minimo: 'Mínimo', maximo: 'Máximo', sinLimite: 'sin límite',
    tipos: { c: 'Continua', i: 'Entera', b: 'Binaria' },
    restricciones: 'Restricciones', usado: 'Usado', signo: 'Signo', limite: 'Límite', holgura: 'Holgura', solucion: 'Solución',
    nuevaVar: function (n) { return 'Variable ' + n; }, nuevaRest: function (n) { return 'Restricción ' + n; },
    quitarVar: function (n) { return 'Quitar la variable «' + n + '»'; }, quitarRest: function (n) { return 'Quitar la restricción «' + n + '»'; },
    nombreVar: function (n) { return 'Nombre de la variable ' + n; }, nombreRest: function (n) { return 'Nombre de la restricción ' + n; },
    celda: function (f, c) { return f + ', ' + c; },
    optima: 'Solución óptima', factible: 'Solución válida, quizá no la mejor', valor: 'Valor del objetivo',
    factibleTxt: 'Se acabó el tiempo antes de demostrar que es la mejor. Prueba con menos variables enteras, o resuélvelo en la plantilla.',
    timeout: 'No dio tiempo a encontrar una solución', timeoutTxt: 'El modelo es demasiado difícil para el navegador. Prueba con menos variables enteras, o resuélvelo en la plantilla, que usa el motor de Google.',
    infactible: 'Ninguna combinación cumple todas las restricciones', infactibleTxt: 'Suele ser un signo al revés (≤ en vez de ≥) o un límite imposible. Revisa también las filas Mínimo y Máximo.',
    ilimitado: 'El objetivo puede crecer sin fin', ilimitadoTxt: 'Falta una restricción: algo tiene que limitar a las variables que mejoran el objetivo (demanda, horas, presupuesto…).',
    errorMotor: 'El motor ha fallado', errorMotorTxt: function (d) { return 'Algo ha ido mal al resolver (' + d + '). Revisa los números y vuelve a intentarlo.'; },
    falta: 'Falta algo en la tabla',
    faltaNum: function (q) { return '«' + q + '» no es un número.'; },
    faltaLimite: function (n) { return 'La restricción «' + n + '» necesita un límite.'; },
    sinVars: 'Añade al menos una variable.',
    minMayor: function (n) { return 'La variable «' + n + '» tiene un mínimo mayor que su máximo.'; },
    sinCoefs: 'Escribe lo que aporta cada variable al objetivo (la fila «Objetivo»).',
    cambiado: 'Has cambiado el modelo: vuelve a resolver para actualizar el resultado.',
    enMs: function (ms, n) { return 'Resuelto en tu navegador en ' + (ms < 1000 ? ms + ' ms' : (ms / 1000).toFixed(1).replace('.', ',') + ' s') + ' · ' + n + ' variables'; },
    llevar: 'Llévalo a Google Sheets', llevarTxt: 'La plantilla gratis resuelve los mismos modelos dentro de tu propia hoja, con el motor de Google.',
    copia: 'Hacer una copia de la plantilla', avisame: 'Acceso anticipado al complemento',
    revisa: 'La respuesta es tan buena como el modelo: revisa que describe tu problema antes de decidir.',
    restaurado: 'Hemos recuperado tu último modelo de este navegador.', editado: 'modificado',
  };

  /* ------------------------------------------------------------ Modelo */
  var copiaProfunda = function (o) { return JSON.parse(JSON.stringify(o)); };
  var enBlanco = function () {
    return { nombre: L.enBlanco, sentido: 'max', unidad: '', vars: [
      { n: 'X', t: 'c', lo: '', hi: '', c: '' }, { n: 'Y', t: 'c', lo: '', hi: '', c: '' },
    ], rest: [{ n: L.nuevaRest(1), a: ['', ''], s: '<=', b: '' }] };
  };
  var modelo = null, ejemploActual = 0, resultado = null, obsoleto = false, avisoRestaurado = false;

  // Del enlace compartido (#m=…), de este navegador o el primer ejemplo.
  var b64 = {
    a: function (o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
    de: function (s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); },
  };
  var valido = function (m) { return m && Array.isArray(m.vars) && Array.isArray(m.rest) && m.vars.length <= MAX_VARS && m.rest.length <= MAX_FILAS; };
  var CLAVE = 'solver-online-' + (EN ? 'en' : 'es');
  try {
    var h = location.hash.match(/[#&]m=([^&]+)/);
    if (h) { var m = b64.de(h[1]); if (valido(m)) { modelo = m; ejemploActual = -1; } }
  } catch (e) { /* enlace roto: se ignora */ }
  if (!modelo) {
    try {
      var guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      if (valido(guardado)) { modelo = guardado; ejemploActual = -1; avisoRestaurado = true; }
    } catch (e) { /* sin almacenamiento */ }
  }
  if (!modelo) modelo = copiaProfunda(datos.ejemplos[0]);

  var guardar = function () { try { localStorage.setItem(CLAVE, JSON.stringify(modelo)); } catch (e) { /* sin almacenamiento */ } };

  /* --------------------------------------------------------- Números */
  // Acepta «1.234,5», «1,234.5», «0,5», «0.5», «-3» y «25 %». Vacío → null; texto → NaN.
  var leer = function (v) {
    var t = String(v === null || v === undefined ? '' : v).trim().replace(/\s/g, '');
    if (t === '') return null;
    var pct = /%$/.test(t); if (pct) t = t.slice(0, -1);
    if (/,/.test(t) && /\./.test(t)) t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    else if (/,/.test(t)) t = EN && /^-?\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
    else if (!EN && /^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(t)) return NaN;
    var n = Number(t); return pct ? n / 100 : n;
  };
  var fmt = function (n) {
    if (!isFinite(n)) return '—';
    var r = Math.round(n * 1e6) / 1e6; if (Math.abs(r) < 1e-9) r = 0;
    // En español, el navegador no separa los miles de los números de 4 cifras («2600»); la web sí («2.600»).
    var t = r.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return EN ? t : t.replace(/,/g, ' ').replace('.', ',').replace(/ /g, '.');
  };

  /* ------------------------------------------------------- Construir */
  var el = function (tag, attrs, hijos) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    (hijos || []).forEach(function (h) { if (h) e.appendChild(typeof h === 'string' ? document.createTextNode(h) : h); });
    return e;
  };
  var ICONO = {
    mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    enlace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16 10"/></svg>',
    aviso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l9 16H3z"/><path d="M12 10v4.5M12 17.5v.01"/></svg>',
  };

  // Barra de herramientas
  var seg = el('div', { class: 'sv-seg', role: 'radiogroup', 'aria-label': L.objetivo });
  ['max', 'min'].forEach(function (s) {
    seg.appendChild(el('button', { type: 'button', role: 'radio', 'data-s': s, text: L[s], onclick: function () { modelo.sentido = s; cambio(); pintarSentido(); } }));
  });
  var pintarSentido = function () {
    seg.querySelectorAll('button').forEach(function (b) {
      var on = b.getAttribute('data-s') === modelo.sentido;
      b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
  };
  seg.addEventListener('keydown', function (e) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
    e.preventDefault(); modelo.sentido = modelo.sentido === 'max' ? 'min' : 'max'; cambio(); pintarSentido();
    seg.querySelector('[aria-checked="true"]').focus();
  });

  var selEjemplo = el('select', { class: 'sv-ej', 'aria-label': L.ejemplo });
  var pintarEjemplos = function () {
    selEjemplo.innerHTML = '';
    if (ejemploActual === -1) selEjemplo.appendChild(el('option', { value: '-1', text: (modelo.nombre || L.enBlanco) + ' · ' + L.editado }));
    datos.ejemplos.forEach(function (e, i) { selEjemplo.appendChild(el('option', { value: String(i), text: e.nombre })); });
    selEjemplo.appendChild(el('option', { value: 'blanco', text: L.enBlanco }));
    selEjemplo.value = String(ejemploActual === -2 ? 'blanco' : ejemploActual);
  };
  selEjemplo.addEventListener('change', function () {
    var v = selEjemplo.value;
    if (v === '-1') return;
    if (v === 'blanco') { modelo = enBlanco(); ejemploActual = -2; } else { ejemploActual = Number(v); modelo = copiaProfunda(datos.ejemplos[ejemploActual]); }
    resultado = null; obsoleto = false; error = null; avisoRestaurado = false;
    guardar(); limpiarHash(); pintarTodo();
  });

  var bVar = el('button', { type: 'button', class: 'sv-tool', html: ICONO.mas + '<span>' + L.masVar + '</span>', onclick: function () {
    if (modelo.vars.length >= MAX_VARS) return;
    modelo.vars.push({ n: L.nuevaVar(modelo.vars.length + 1), t: 'c', lo: '', hi: '', c: '' });
    modelo.rest.forEach(function (r) { r.a.push(''); });
    cambio(); pintarTabla();
    var ins = tabla.querySelectorAll('thead input'); if (ins.length) { ins[ins.length - 1].focus(); ins[ins.length - 1].select(); }
  } });
  var bRest = el('button', { type: 'button', class: 'sv-tool', html: ICONO.mas + '<span>' + L.masRest + '</span>', onclick: function () {
    if (modelo.rest.length >= MAX_FILAS) return;
    modelo.rest.push({ n: L.nuevaRest(modelo.rest.length + 1), a: modelo.vars.map(function () { return ''; }), s: '<=', b: '' });
    cambio(); pintarTabla();
    var filas = tabla.querySelectorAll('tr.sv-r'); var f = filas[filas.length - 1]; if (f) { var i = f.querySelector('input'); i.focus(); i.select(); }
  } });
  var bCompartir = el('button', { type: 'button', class: 'sv-tool', html: ICONO.enlace + '<span>' + L.compartir + '</span>', onclick: function () {
    var url = location.href.split('#')[0] + '#m=' + b64.a(modelo);
    try { history.replaceState(null, '', url); } catch (e) { /* nada */ }
    var hecho = function (txt) { aviso.textContent = txt; aviso.classList.add('on'); clearTimeout(aviso._t); aviso._t = setTimeout(function () { aviso.classList.remove('on'); }, 2600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { hecho(L.copiado); }, function () { hecho(L.noCopia); });
    else hecho(L.noCopia);
  } });
  var aviso = el('span', { class: 'sv-toast', role: 'status', 'aria-live': 'polite' });
  var bResolver = el('button', { type: 'button', class: 'btn btn-primary sv-go', html: '<span class="sv-spin" aria-hidden="true"></span>' + ICONO.play + '<span class="label">' + L.resolver + '</span>', onclick: function () { resolver(); } });

  var barra = el('div', { class: 'sv-bar' }, [
    el('div', { class: 'sv-bar-l' }, [seg, el('label', { class: 'sv-ej-wrap' }, [el('span', { text: L.ejemplo }), selEjemplo])]),
    el('div', { class: 'sv-bar-r' }, [bVar, bRest, bCompartir, aviso]),
  ]);

  var tabla = el('table', { class: 'sheet sv-sheet' });
  var envoltura = el('div', { class: 'sheet-wrap' }, [tabla]);
  var ventana = el('div', { class: 'window sv-window' }, [
    el('div', { class: 'window-bar' }, [
      el('span', { class: 'dots', 'aria-hidden': 'true', html: '<i></i><i></i><i></i>' }),
      el('span', { class: 'doc sv-doc' }),
      el('span', { class: 'sv-key', text: L.atajo }),
    ]),
    envoltura,
  ]);
  var pie = el('div', { class: 'sv-foot' }, [bResolver]);
  var panel = el('div', { class: 'sv-res', 'aria-live': 'polite' });
  raiz.appendChild(barra); raiz.appendChild(ventana); raiz.appendChild(pie); raiz.appendChild(panel);

  /* ------------------------------------------------------- La tabla */
  var error = null; // {mensaje, celdas:[input…]}
  var entrada = function (valor, etiqueta, alCambiar, extra) {
    var i = el('input', Object.assign({ type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', value: valor === '' || valor === null || valor === undefined ? '' : String(valor), 'aria-label': etiqueta }, extra || {}));
    i.addEventListener('input', function () { alCambiar(i.value); i.classList.remove('bad'); cambio(); });
    return i;
  };
  var texto = function (valor, etiqueta, alCambiar) {
    var i = el('input', { type: 'text', class: 'sv-name', autocomplete: 'off', value: valor, 'aria-label': etiqueta, maxlength: '60' });
    i.addEventListener('input', function () { alCambiar(i.value); cambio(true); });
    return i;
  };
  var selector = function (opciones, valor, etiqueta, alCambiar) {
    var s = el('select', { 'aria-label': etiqueta });
    opciones.forEach(function (o) { s.appendChild(el('option', { value: o[0], text: o[1] })); });
    s.value = valor; s.addEventListener('change', function () { alCambiar(s.value); cambio(); });
    return s;
  };
  var td = function (cls, hijos, attrs) { return el('td', Object.assign({ class: cls || '' }, attrs || {}), hijos); };
  var th = function (cls, hijos, attrs) { return el('th', Object.assign({ class: cls || '' }, attrs || {}), hijos); };

  var pintarTabla = function () {
    tabla.innerHTML = '';
    var nV = modelo.vars.length;
    var resV = resultado && resultado.x;
    // Cabecera: nombres de las variables
    var cab = el('tr', {}, [th('lbl hd sv-first', [L.variables], { scope: 'col' })]);
    modelo.vars.forEach(function (v, j) {
      cab.appendChild(th('hd sv-v', [
        texto(v.n, L.nombreVar(j + 1), function (x) { v.n = x; }),
        nV > 1 ? el('button', { type: 'button', class: 'sv-del', 'aria-label': L.quitarVar(v.n), title: L.quitarVar(v.n), html: ICONO.x, onclick: function () {
          modelo.vars.splice(j, 1); modelo.rest.forEach(function (r) { r.a.splice(j, 1); }); cambio(); pintarTabla();
        } }) : null,
      ], { scope: 'col' }));
    });
    [L.usado, L.signo, L.limite, L.holgura].forEach(function (t) { cab.appendChild(th('hd sv-c', [t], { scope: 'col' })); });
    cab.appendChild(th('hd sv-x', [], { 'aria-hidden': 'true' }));
    tabla.appendChild(el('thead', {}, [cab]));

    var cuerpo = el('tbody');
    var vacias = function (n) { var r = []; for (var k = 0; k < n; k++) r.push(td('sv-empty')); return r; };
    // Objetivo, tipo, mínimo y máximo
    var filaVar = function (etiqueta, cls, celda) {
      var tr = el('tr', { class: cls }, [th('lbl', [etiqueta], { scope: 'row' })]);
      modelo.vars.forEach(function (v, j) { tr.appendChild(td('in', [celda(v, j)])); });
      vacias(5).forEach(function (c) { tr.appendChild(c); });
      return tr;
    };
    cuerpo.appendChild(filaVar(L.aporta, 'sv-obj', function (v) { return entrada(v.c, L.celda(L.aporta, v.n), function (x) { v.c = x; }); }));
    cuerpo.appendChild(filaVar(L.tipo, 'sv-tipo', function (v) {
      return selector([['c', L.tipos.c], ['i', L.tipos.i], ['b', L.tipos.b]], v.t, L.celda(L.tipo, v.n), function (x) { v.t = x; pintarTipo(); });
    }));
    cuerpo.appendChild(filaVar(L.minimo, 'sv-lo', function (v) { return entrada(v.lo, L.celda(L.minimo, v.n), function (x) { v.lo = x; }, { placeholder: '0' }); }));
    cuerpo.appendChild(filaVar(L.maximo, 'sv-hi', function (v) { return entrada(v.hi, L.celda(L.maximo, v.n), function (x) { v.hi = x; }, { placeholder: L.sinLimite }); }));
    // Restricciones
    var sep = el('tr', { class: 'sv-sep' }, [th('lbl sv-sub', [L.restricciones], { scope: 'row', colspan: String(nV + 6) })]);
    cuerpo.appendChild(sep);
    modelo.rest.forEach(function (r, i) {
      var tr = el('tr', { class: 'sv-r' }, [th('lbl sv-rn', [texto(r.n, L.nombreRest(i + 1), function (x) { r.n = x; })], { scope: 'row' })]);
      modelo.vars.forEach(function (v, j) { tr.appendChild(td('in', [entrada(r.a[j], L.celda(r.n, v.n), function (x) { r.a[j] = x; })])); });
      var usado = resultado && resultado.usado ? resultado.usado[i] : null;
      var holg = resultado && resultado.holgura ? resultado.holgura[i] : null;
      var atada = holg !== null && Math.abs(holg) < 1e-6;
      tr.appendChild(td('f n', [usado === null ? '' : fmt(usado)]));
      tr.appendChild(td('in sv-s', [selector([['<=', '≤'], ['>=', '≥'], ['=', '=']], r.s, L.celda(r.n, L.signo), function (x) { r.s = x; })]));
      tr.appendChild(td('in', [entrada(r.b, L.celda(r.n, L.limite), function (x) { r.b = x; })]));
      tr.appendChild(td('n sv-h' + (atada ? ' sv-tight' : ''), [holg === null ? '' : fmt(holg)]));
      tr.appendChild(td('sv-x', [modelo.rest.length > 1 ? el('button', { type: 'button', class: 'sv-del', 'aria-label': L.quitarRest(r.n), title: L.quitarRest(r.n), html: ICONO.x, onclick: function () {
        modelo.rest.splice(i, 1); cambio(); pintarTabla();
      } }) : null]));
      cuerpo.appendChild(tr);
    });
    // Solución
    var sol = el('tr', { class: 'sv-sol' }, [th('lbl sol', [L.solucion], { scope: 'row' })]);
    modelo.vars.forEach(function (v, j) { sol.appendChild(td('sol' + (resV ? ' pop' : ''), [resV ? fmt(resV[j]) : ''])); });
    sol.appendChild(td('sv-objv', [resultado && resultado.z !== undefined ? L.valor + ': ' + fmt(resultado.z) : ''], { colspan: '5' }));
    cuerpo.appendChild(sol);
    tabla.appendChild(cuerpo);

    raiz.querySelector('.sv-doc').textContent = modelo.nombre || L.enBlanco;
    bVar.disabled = modelo.vars.length >= MAX_VARS; bRest.disabled = modelo.rest.length >= MAX_FILAS;
    pintarTipo(); marcarError(); pintarObsoleto(); medirScroll();
  };
  // Con «Binaria», mínimo y máximo no aplican.
  var pintarTipo = function () {
    var lo = tabla.querySelectorAll('.sv-lo input'), hi = tabla.querySelectorAll('.sv-hi input');
    modelo.vars.forEach(function (v, j) { var bin = v.t === 'b'; [lo[j], hi[j]].forEach(function (i) { if (i) { i.disabled = bin; i.placeholder = bin ? (i === lo[j] ? '0' : '1') : (i === lo[j] ? '0' : L.sinLimite); } }); });
  };
  var medirScroll = function () { envoltura.classList.toggle('scroll-r', envoltura.scrollWidth > envoltura.clientWidth + 2 && envoltura.scrollLeft + envoltura.clientWidth < envoltura.scrollWidth - 2); };
  envoltura.addEventListener('scroll', medirScroll, { passive: true });
  window.addEventListener('resize', medirScroll);

  var cambio = function (soloNombre) {
    guardar();
    error = null;
    if (resultado && !soloNombre) { obsoleto = true; pintarObsoleto(); }
    if (ejemploActual >= 0 && !soloNombre) { ejemploActual = -1; modelo.nombre = modelo.nombre || L.enBlanco; pintarEjemplos(); }
    limpiarHash();
  };
  var limpiarHash = function () { if (/[#&]m=/.test(location.hash)) { try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) { /* nada */ } } };
  var pintarObsoleto = function () {
    raiz.classList.toggle('sv-stale', obsoleto);
    var n = panel.querySelector('.sv-stale-note'); if (n) n.hidden = !obsoleto;
  };

  /* ------------------------------------------------------ Resolver */
  var marcarError = function () {
    if (!error) return;
    (error.celdas || []).forEach(function (c) { var i = buscarCelda(c); if (i) i.classList.add('bad'); });
  };
  var buscarCelda = function (c) {
    if (c.fila === 'obj') return tabla.querySelectorAll('.sv-obj input')[c.col];
    if (c.fila === 'lo') return tabla.querySelectorAll('.sv-lo input')[c.col];
    if (c.fila === 'hi') return tabla.querySelectorAll('.sv-hi input')[c.col];
    var f = tabla.querySelectorAll('tr.sv-r')[c.fila]; if (!f) return null;
    var ins = f.querySelectorAll('td input'); // coeficientes… y el límite al final
    return c.col === 'b' ? ins[ins.length - 1] : ins[c.col];
  };
  var traducir = function () {
    var n = modelo.vars.length;
    if (!n) return { error: { mensaje: L.sinVars } };
    var c = [], lb = [], ub = [], isInt = [], celdas = [];
    var num = function (v, celda, defecto, nombre) {
      var x = leer(v);
      if (x === null) return defecto;
      if (isNaN(x)) { celdas.push(celda); throw { mensaje: L.faltaNum(nombre) }; }
      return x;
    };
    try {
      var hayCoef = false;
      modelo.vars.forEach(function (v, j) {
        var cj = num(v.c, { fila: 'obj', col: j }, 0, L.celda(L.aporta, v.n)); if (cj !== 0) hayCoef = true; c.push(cj);
        if (v.t === 'b') { lb.push(0); ub.push(1); isInt.push(true); return; }
        var lo = num(v.lo, { fila: 'lo', col: j }, 0, L.celda(L.minimo, v.n));
        var hi = num(v.hi, { fila: 'hi', col: j }, Infinity, L.celda(L.maximo, v.n));
        if (lo > hi) { celdas.push({ fila: 'lo', col: j }, { fila: 'hi', col: j }); throw { mensaje: L.minMayor(v.n) }; }
        lb.push(lo); ub.push(hi); isInt.push(v.t === 'i');
      });
      if (!hayCoef) { modelo.vars.forEach(function (v, j) { celdas.push({ fila: 'obj', col: j }); }); throw { mensaje: L.sinCoefs }; }
      var rows = modelo.rest.map(function (r, i) {
        var a = modelo.vars.map(function (v, j) { return num(r.a[j], { fila: i, col: j }, 0, L.celda(r.n, v.n)); });
        var b = leer(r.b);
        if (b === null) { celdas.push({ fila: i, col: 'b' }); throw { mensaje: L.faltaLimite(r.n) }; }
        if (isNaN(b)) { celdas.push({ fila: i, col: 'b' }); throw { mensaje: L.faltaNum(L.celda(r.n, L.limite)) }; }
        return { a: a, op: r.s, b: b };
      });
      return { m: { sense: modelo.sentido, c: c, rows: rows, lb: lb, ub: ub, isInt: isInt, limiteMs: LIMITE_MS } };
    } catch (e) {
      if (e && e.mensaje) return { error: { mensaje: e.mensaje, celdas: celdas } };
      throw e;
    }
  };

  var trabajador = null;
  var nuevoTrabajador = function () {
    try { trabajador = new Worker(raiz.getAttribute('data-motor')); } catch (e) { trabajador = null; }
  };
  nuevoTrabajador();
  var ocupado = false;
  var resolver = function () {
    if (ocupado) return;
    error = null;
    tabla.querySelectorAll('input.bad').forEach(function (i) { i.classList.remove('bad'); });
    var t = traducir();
    if (t.error) { error = t.error; resultado = null; obsoleto = false; pintarTabla(); pintarPanel({ tipo: 'error' }); var p = buscarCelda((error.celdas || [])[0] || {}); if (p) p.focus(); return; }
    ocupado = true; raiz.setAttribute('data-state', 'solving');
    bResolver.setAttribute('aria-disabled', 'true'); bResolver.querySelector('.label').textContent = L.resolviendo;
    var fin = function (resp) {
      ocupado = false; raiz.removeAttribute('data-state');
      bResolver.removeAttribute('aria-disabled'); bResolver.querySelector('.label').textContent = L.resolver;
      if (!resp.ok) { resultado = null; obsoleto = false; pintarTabla(); pintarPanel({ tipo: 'motor', detalle: resp.error }); return; }
      var r = resp.r;
      resultado = { estado: r.status, ms: resp.ms };
      if (r.x) {
        resultado.x = r.x; resultado.z = r.z;
        resultado.usado = t.m.rows.map(function (row) { return row.a.reduce(function (s, a, j) { return s + a * r.x[j]; }, 0); });
        resultado.holgura = t.m.rows.map(function (row, i) { var u = resultado.usado[i]; return row.op === '<=' ? row.b - u : row.op === '>=' ? u - row.b : Math.abs(u - row.b); });
      }
      obsoleto = false; pintarTabla(); pintarPanel({ tipo: 'resultado' });
    };
    if (trabajador) {
      var plazo = setTimeout(function () { trabajador.terminate(); nuevoTrabajador(); fin({ ok: true, r: { status: 'TIMEOUT' }, ms: LIMITE_MS }); }, LIMITE_MS + 4000);
      trabajador.onmessage = function (e) { clearTimeout(plazo); fin(e.data); };
      trabajador.onerror = function (e) { clearTimeout(plazo); e.preventDefault(); nuevoTrabajador(); fin({ ok: false, error: e.message || 'worker' }); };
      trabajador.postMessage(t.m);
    } else if (window.MotorLP) {
      setTimeout(function () { var ini = Date.now(); try { fin({ ok: true, r: window.MotorLP.solveMIP(t.m), ms: Date.now() - ini }); } catch (err) { fin({ ok: false, error: String(err.message || err) }); } }, 30);
    } else fin({ ok: false, error: 'motor' });
  };

  /* -------------------------------------------------- Panel de resultado */
  var pintarPanel = function (q) {
    panel.innerHTML = '';
    var tarjeta = function (clase, icono, titulo, textoP) {
      return el('div', { class: 'sv-card ' + clase }, [
        el('span', { class: 'sv-ico', html: icono }),
        el('div', {}, [el('strong', { text: titulo }), textoP ? el('p', { text: textoP }) : null]),
      ]);
    };
    if (q.tipo === 'error') { panel.appendChild(tarjeta('bad', ICONO.aviso, L.falta, error.mensaje)); return; }
    if (q.tipo === 'motor') { panel.appendChild(tarjeta('bad', ICONO.aviso, L.errorMotor, L.errorMotorTxt(q.detalle))); return; }
    var e = resultado.estado;
    if (e === 'OPTIMAL' || e === 'FEASIBLE') {
      var cab = el('div', { class: 'sv-card ' + (e === 'OPTIMAL' ? 'ok' : 'warn') }, [
        el('span', { class: 'sv-ico', html: e === 'OPTIMAL' ? ICONO.ok : ICONO.aviso }),
        el('div', { class: 'sv-sum' }, [
          el('strong', { text: e === 'OPTIMAL' ? L.optima : L.factible }),
          e === 'FEASIBLE' ? el('p', { text: L.factibleTxt }) : null,
          el('p', { class: 'sv-meta', text: L.enMs(resultado.ms || 0, modelo.vars.length) }),
        ]),
        el('div', { class: 'sv-z' }, [el('span', { text: L.valor }), el('b', { text: fmt(resultado.z) }), modelo.unidad ? el('small', { text: modelo.unidad }) : null]),
      ]);
      panel.appendChild(cab);
      panel.appendChild(el('p', { class: 'sv-stale-note', hidden: true, text: L.cambiado }));
      var llevar = el('div', { class: 'sv-next' }, [
        el('div', {}, [el('strong', { text: L.llevar }), el('p', { text: L.llevarTxt })]),
        el('div', { class: 'sv-next-b' }, [
          datos.plantilla ? el('a', { class: 'btn btn-primary btn-sm', href: datos.plantilla, target: '_blank', rel: 'noopener', 'data-plantilla': '', text: L.copia }) : null,
          el('a', { class: 'btn btn-secondary btn-sm', href: '#avisame', text: L.avisame }),
        ]),
      ]);
      panel.appendChild(llevar);
      panel.appendChild(el('p', { class: 'sv-note', text: L.revisa }));
      return;
    }
    var mapa = { INFEASIBLE: [L.infactible, L.infactibleTxt], UNBOUNDED: [L.ilimitado, L.ilimitadoTxt], TIMEOUT: [L.timeout, L.timeoutTxt] };
    var m = mapa[e] || [L.errorMotor, L.errorMotorTxt(e)];
    panel.appendChild(tarjeta('bad', ICONO.aviso, m[0], m[1]));
  };

  // Ctrl/Cmd + Intro resuelve desde cualquier celda.
  raiz.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); resolver(); }
  });

  var pintarTodo = function () { pintarSentido(); pintarEjemplos(); pintarTabla(); panel.innerHTML = ''; if (avisoRestaurado) panel.appendChild(el('p', { class: 'sv-note', text: L.restaurado })); };
  pintarTodo();
  raiz.classList.add('sv-ready');
})();
