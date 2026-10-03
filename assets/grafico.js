/* Gráfico interactivo de la guía del Solver: la región de soluciones posibles del
   taller (piezas A y B) y cómo cambia la mejor esquina al mover los beneficios. */
(function () {
  'use strict';
  var caja = document.querySelector('[data-plot]');
  if (!caja) return;

  var EN = (document.documentElement.getAttribute('lang') || 'es').indexOf('en') === 0;
  var X = EN ? {
    titulo: 'Feasible region of the workshop example', ejeX: 'Parts A per week →', ejeY: 'Parts B per week →',
    torno: 'Lathe: 2A + B ≤ 100', fresadora: 'Mill: A + B ≤ 80', demanda: 'Demand: A ≤ 40',
    fTorno: 'the lathe', fFresadora: 'the mill', fDemanda: 'demand for A',
    dinero: function (n) { return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); },
    precio: function (n) { return '$' + n; },
    empate: function (a, b, z) { return 'Tie: any point on the edge between (' + a + ') and (' + b + ') gives ' + z + '.'; },
    mejor: function (x, y, z) { return 'Best plan: ' + x + ' parts A and ' + y + ' parts B, ' + z + ' a week.'; },
    frenan: function (l) { return 'Binding: ' + l.join(' and ') + '.'; },
    nada: 'Nothing is binding: there is slack everywhere.',
    con: function (a, b) { return 'With ' + a + ' per part A and ' + b + ' per part B. '; },
  } : {
    titulo: 'Región de soluciones posibles del taller', ejeX: 'Piezas A a la semana →', ejeY: 'Piezas B a la semana →',
    torno: 'Torno: 2A + B ≤ 100', fresadora: 'Fresadora: A + B ≤ 80', demanda: 'Demanda: A ≤ 40',
    fTorno: 'el torno', fFresadora: 'la fresadora', fDemanda: 'la demanda de A',
    dinero: function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'; },
    precio: function (n) { return n + ' €'; },
    empate: function (a, b, z) { return 'Empate: cualquier punto del borde entre (' + a + ') y (' + b + ') da ' + z + '.'; },
    mejor: function (x, y, z) { return 'Lo mejor: ' + x + ' piezas A y ' + y + ' piezas B, ' + z + ' a la semana.'; },
    frenan: function (l) { return 'Frenan ' + l.join(' y ') + '.'; },
    nada: 'No frena nada: hay margen en todo.',
    con: function (a, b) { return 'Con ' + a + ' por pieza A y ' + b + ' por pieza B. '; },
  };
  var NS = 'http://www.w3.org/2000/svg';
  var W = 600, H = 440, L = 58, R = 578, T = 18, B = 388;
  var XMAX = 60, YMAX = 100;
  var sx = function (x) { return L + (x / XMAX) * (R - L); };
  var sy = function (y) { return B - (y / YMAX) * (B - T); };
  var vertices = [
    { x: 0, y: 0, frenan: [] },
    { x: 40, y: 0, frenan: [X.fDemanda] },
    { x: 40, y: 20, frenan: [X.fTorno, X.fDemanda] },
    { x: 20, y: 60, frenan: [X.fTorno, X.fFresadora] },
    { x: 0, y: 80, frenan: [X.fFresadora] },
  ];

  var el = function (tag, attrs, padre) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(n);
    return n;
  };


  var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-labelledby': 'plot-title plot-desc' });
  var titulo = el('title', { id: 'plot-title' }, svg);
  titulo.textContent = X.titulo;
  var desc = el('desc', { id: 'plot-desc' }, svg);

  // Rejilla y ejes
  for (var gx = 10; gx <= XMAX; gx += 10) el('line', { class: 'gridline', x1: sx(gx), y1: sy(0), x2: sx(gx), y2: sy(YMAX) }, svg);
  for (var gy = 20; gy <= YMAX; gy += 20) el('line', { class: 'gridline', x1: sx(0), y1: sy(gy), x2: sx(XMAX), y2: sy(gy) }, svg);
  el('line', { class: 'axis', x1: sx(0), y1: sy(0), x2: sx(XMAX), y2: sy(0) }, svg);
  el('line', { class: 'axis', x1: sx(0), y1: sy(0), x2: sx(0), y2: sy(YMAX) }, svg);
  for (var tx = 0; tx <= XMAX; tx += 10) { var t1 = el('text', { class: 'tick', x: sx(tx), y: sy(0) + 18, 'text-anchor': 'middle' }, svg); t1.textContent = tx; }
  for (var ty = 20; ty <= YMAX; ty += 20) { var t2 = el('text', { class: 'tick', x: sx(0) - 10, y: sy(ty) + 4, 'text-anchor': 'end' }, svg); t2.textContent = ty; }
  var ax = el('text', { class: 'axis-label', x: sx(XMAX), y: sy(0) + 40, 'text-anchor': 'end' }, svg); ax.textContent = X.ejeX;
  var ay = el('text', { class: 'axis-label', x: 0, y: 0, transform: 'translate(' + (sx(0) - 44) + ' ' + sy(YMAX / 2) + ') rotate(-90)', 'text-anchor': 'middle' }, svg); ay.textContent = X.ejeY;

  // Región posible
  el('polygon', { class: 'region', points: vertices.map(function (v) { return sx(v.x) + ',' + sy(v.y); }).join(' ') }, svg);

  // Restricciones
  el('line', { class: 'cons c1', x1: sx(0), y1: sy(100), x2: sx(50), y2: sy(0) }, svg);
  el('line', { class: 'cons c2', x1: sx(0), y1: sy(80), x2: sx(60), y2: sy(20) }, svg);
  el('line', { class: 'cons c3', x1: sx(40), y1: sy(0), x2: sx(40), y2: sy(100) }, svg);
  var l1 = el('text', { class: 'cons-label c1', x: sx(4), y: sy(95) }, svg); l1.textContent = X.torno;
  var l2 = el('text', { class: 'cons-label c2', x: sx(46), y: sy(39) }, svg); l2.textContent = X.fresadora;
  var l3 = el('text', { class: 'cons-label c3', x: sx(41), y: sy(96) }, svg); l3.textContent = X.demanda;

  // Borde empatado, línea de igual beneficio, esquinas y mejor punto
  var borde = el('line', { class: 'edge-best' }, svg);
  var iso = el('line', { class: 'iso' }, svg);
  vertices.forEach(function (v) { el('circle', { class: 'vertex', cx: sx(v.x), cy: sy(v.y), r: 4.5 }, svg); });
  var anillo = el('circle', { class: 'best-ring', r: 14 }, svg);
  var mejor = el('circle', { class: 'best', r: 7.5 }, svg);
  var etiqueta = el('text', { class: 'best-label' }, svg);

  var lienzo = caja.querySelector('.plot');
  lienzo.appendChild(svg);

  var pA = caja.querySelector('#pA');
  var pB = caja.querySelector('#pB');
  var oA = caja.querySelector('output[for="pA"]');
  var oB = caja.querySelector('output[for="pB"]');
  var lectura = caja.querySelector('.plot-read');

  var pintarRango = function (r) {
    var p = ((r.value - r.min) / (r.max - r.min)) * 100;
    r.style.setProperty('--p', p + '%');
  };

  var dibujar = function () {
    var a = Number(pA.value), b = Number(pB.value);
    oA.textContent = X.precio(a);
    oB.textContent = X.precio(b);
    pintarRango(pA); pintarRango(pB);

    var valores = vertices.map(function (v) { return a * v.x + b * v.y; });
    var max = Math.max.apply(null, valores);
    var mejores = [];
    valores.forEach(function (z, i) { if (Math.abs(z - max) < 1e-9) mejores.push(i); });
    var v = vertices[mejores[0]];
    if (mejores.length > 1) {
      var w = vertices[mejores[mejores.length - 1]];
      borde.setAttribute('x1', sx(v.x)); borde.setAttribute('y1', sy(v.y));
      borde.setAttribute('x2', sx(w.x)); borde.setAttribute('y2', sy(w.y));
      borde.classList.add('on');
      v = vertices[mejores[0]];
    } else {
      borde.classList.remove('on');
    }

    // Línea de igual beneficio que pasa por el mejor punto: a·x + b·y = max
    var y0 = max / b, x0 = 0;
    if (y0 > YMAX) { y0 = YMAX; x0 = (max - b * YMAX) / a; }
    var x1 = XMAX, y1 = (max - a * XMAX) / b;
    if (y1 < 0) { y1 = 0; x1 = max / a; }
    iso.setAttribute('x1', sx(x0)); iso.setAttribute('y1', sy(y0));
    iso.setAttribute('x2', sx(x1)); iso.setAttribute('y2', sy(y1));

    mejor.setAttribute('cx', sx(v.x)); mejor.setAttribute('cy', sy(v.y));
    anillo.setAttribute('cx', sx(v.x)); anillo.setAttribute('cy', sy(v.y));
    var texto = '(' + v.x + ', ' + v.y + ') · ' + X.dinero(max);
    etiqueta.textContent = texto;
    var ex = sx(v.x) + 14, ey = sy(v.y) - 14, ancla = 'start';
    if (v.x >= 40) { ex = sx(v.x) + 14; ey = sy(v.y) - 16; }
    if (v.y >= 80) { ey = sy(v.y) + 6; ex = sx(v.x) + 16; }
    if (v.x === 0 && v.y === 0) { ey = sy(v.y) - 14; }
    etiqueta.setAttribute('x', ex); etiqueta.setAttribute('y', ey); etiqueta.setAttribute('text-anchor', ancla);

    var frase;
    if (mejores.length > 1) {
      var p1 = vertices[mejores[0]], p2 = vertices[mejores[mejores.length - 1]];
      frase = X.empate(p1.x + ', ' + p1.y, p2.x + ', ' + p2.y, X.dinero(max));
    } else {
      frase = X.mejor(v.x, v.y, X.dinero(max));
    }
    var frenan = v.frenan.length ? X.frenan(v.frenan) : X.nada;
    var cifra = X.dinero(max);
    var span1 = document.createElement('span');
    var partes = frase.split(cifra);
    span1.appendChild(document.createTextNode(partes[0]));
    var fuerte = document.createElement('strong'); fuerte.textContent = cifra; span1.appendChild(fuerte);
    span1.appendChild(document.createTextNode(partes.slice(1).join(cifra)));
    var span2 = document.createElement('span'); span2.className = 'muted'; span2.textContent = frenan;
    lectura.textContent = '';
    lectura.appendChild(span1); lectura.appendChild(span2);
    desc.textContent = X.con(X.precio(a), X.precio(b)) + frase + ' ' + frenan;
  };

  pA.addEventListener('input', dibujar);
  pB.addEventListener('input', dibujar);
  var reset = caja.querySelector('[data-reset]');
  if (reset) reset.addEventListener('click', function () { pA.value = 40; pB.value = 30; dibujar(); });
  dibujar();
})();
