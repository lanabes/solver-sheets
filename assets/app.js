/* Solver para Google Sheets · comportamiento de la web (castellano e inglés).
   Sin dependencias, sin cookies y sin analítica. */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Textos según el idioma de la página */
  var EN = (raiz.getAttribute('lang') || 'es').indexOf('en') === 0;
  var L = EN ? {
    aClaro: 'Switch to light mode', aOscuro: 'Switch to dark mode', tClaro: 'Light mode', tOscuro: 'Dark mode',
    copiada: 'Copied', copiar: 'Copy', formulaCopiada: 'Formula copied', noCopia: 'Couldn’t copy it: select it by hand',
    enviando: 'Sending…', tarda: 'Still sending…', vacioBaja: 'Type the e-mail you want to remove.', vacio: 'Type your e-mail so we can let you know.',
    incompleto: 'That e-mail looks incomplete. Check it has an @ and a domain, like name@gmail.com.',
    inactiva: 'The waitlist isn’t live yet. Please try again in a few days.',
    yaEstaba: 'You were already on the list with that e-mail. We’ll let you know once, when it launches.',
    invalido: 'That e-mail doesn’t look valid. Please check it.',
    fallo: 'Couldn’t save it right now. Check your connection and try again.',
    usoGracias: 'Thanks: it helps us decide what to build first.', usoFallo: 'Couldn’t save it. Tap your answer again.',
    sinResolver: 'Not solved yet', resolviendo: 'Solving…', optima: '✓ Optimal solution',
    dinero: function (n) { return '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); },
  } : {
    aClaro: 'Cambiar a modo claro', aOscuro: 'Cambiar a modo oscuro', tClaro: 'Modo claro', tOscuro: 'Modo oscuro',
    copiada: 'Copiada', copiar: 'Copiar', formulaCopiada: 'Fórmula copiada', noCopia: 'No se ha podido copiar: selecciónala a mano',
    enviando: 'Enviando…', tarda: 'Sigue enviando…', vacioBaja: 'Escribe el correo que quieres borrar.', vacio: 'Escribe tu correo para que podamos avisarte.',
    incompleto: 'Ese correo no parece completo. Revisa que tenga @ y un dominio, como nombre@gmail.com.',
    inactiva: 'La lista todavía no está activa. Vuelve a intentarlo en unos días.',
    yaEstaba: 'Ya estabas en la lista con ese correo. Te avisaremos una sola vez, cuando salga.',
    invalido: 'Ese correo no parece válido. Revísalo, por favor.',
    fallo: 'No se ha podido guardar ahora mismo. Comprueba tu conexión y vuelve a intentarlo.',
    usoGracias: 'Gracias: nos ayuda a decidir qué hacer primero.', usoFallo: 'No se ha podido guardar. Vuelve a pulsar tu respuesta.',
    sinResolver: 'Sin resolver todavía', resolviendo: 'Resolviendo…', optima: '✓ Solución óptima',
    dinero: function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'; },
  };

  function guardar(clave, valor) { try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ } }

  /* ------------------------------------------------------------ Tema */
  var botonTema = document.querySelector('.theme-toggle');
  if (botonTema) {
    var actualizarEtiqueta = function () {
      var oscuro = raiz.getAttribute('data-theme') === 'dark' ||
        (!raiz.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      botonTema.setAttribute('aria-label', oscuro ? L.aClaro : L.aOscuro);
      botonTema.setAttribute('title', oscuro ? L.tClaro : L.tOscuro);
      return oscuro;
    };
    actualizarEtiqueta();
    botonTema.addEventListener('click', function () {
      var oscuro = actualizarEtiqueta();
      var nuevo = oscuro ? 'light' : 'dark';
      raiz.setAttribute('data-theme', nuevo);
      guardar('tema', nuevo);
      actualizarEtiqueta();
    });
  }

  /* --------------------------------------------- Cabecera y menú móvil */
  var cabecera = document.querySelector('.top');
  var alDesplazar = function () { if (cabecera) cabecera.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();

  var botonMenu = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (botonMenu && nav) {
    var cerrarMenu = function (devolverFoco) {
      nav.classList.remove('open');
      botonMenu.setAttribute('aria-expanded', 'false');
      if (devolverFoco) botonMenu.focus();
    };
    botonMenu.addEventListener('click', function () {
      var abierto = nav.classList.toggle('open');
      botonMenu.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      if (abierto) { var primero = nav.querySelector('a'); if (primero) primero.focus(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) cerrarMenu(true); });
    document.addEventListener('click', function (e) { if (nav.classList.contains('open') && !nav.contains(e.target) && !botonMenu.contains(e.target)) cerrarMenu(false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) cerrarMenu(false); });
  }

  /* ------------------------------------------------- Aparecer al bajar */
  var aparecer = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reducir) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    aparecer.forEach(function (el) { obs.observe(el); });
  } else {
    aparecer.forEach(function (el) { el.classList.add('in'); });
  }

  /* ------------------------------------------------------- Aviso breve */
  var toast;
  function avisar(texto) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = texto;
    toast.classList.add('on');
    clearTimeout(avisar.t);
    avisar.t = setTimeout(function () { toast.classList.remove('on'); }, 2200);
  }

  /* ---------------------------------------------------- Copiar fórmulas */
  document.querySelectorAll('.fx .copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var codigo = b.parentNode.querySelector('code');
      var texto = codigo ? codigo.textContent : '';
      var hecho = function () {
        b.classList.add('done');
        var t = b.querySelector('span');
        if (t) t.textContent = L.copiada;
        avisar(L.formulaCopiada);
        setTimeout(function () { b.classList.remove('done'); if (t) t.textContent = L.copiar; }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(hecho, function () { copiarViejo(texto) ? hecho() : avisar(L.noCopia); });
      } else {
        copiarViejo(texto) ? hecho() : avisar(L.noCopia);
      }
    });
  });
  function copiarViejo(texto) {
    var ta = document.createElement('textarea');
    ta.value = texto; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  /* ------------------------------ Tablas anchas: aviso de que hay más */
  var marcarDesborde = function (el) {
    var hayMas = el.scrollWidth - el.clientWidth - el.scrollLeft > 4;
    el.classList.toggle('scroll-r', hayMas);
  };
  document.querySelectorAll('.sheet-wrap, .table-wrap, .model').forEach(function (el) {
    marcarDesborde(el);
    el.addEventListener('scroll', function () { marcarDesborde(el); }, { passive: true });
  });
  window.addEventListener('resize', function () {
    document.querySelectorAll('.sheet-wrap, .table-wrap, .model').forEach(marcarDesborde);
  });

  /* --------------------------------------- Índice de la guía (activo) */
  var enlacesToc = document.querySelectorAll('.toc a[href^="#"]');
  if (enlacesToc.length && 'IntersectionObserver' in window) {
    var mapa = {};
    enlacesToc.forEach(function (a) { mapa[decodeURIComponent(a.getAttribute('href').slice(1))] = a; });
    var visibles = {};
    var obsToc = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { visibles[en.target.id] = en.isIntersecting; });
      var activo = null;
      document.querySelectorAll('.article h2[id]').forEach(function (h) { if (!activo && visibles[h.id]) activo = h.id; });
      if (activo) enlacesToc.forEach(function (a) { a.classList.toggle('active', a === mapa[activo]); });
    }, { rootMargin: '-80px 0px -60% 0px' });
    document.querySelectorAll('.article h2[id]').forEach(function (h) { obsToc.observe(h); });
  }

  /* -------------------------------------------------- Lista de espera */
  var RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  document.querySelectorAll('.wl-form').forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var fila = form.querySelector('.wl-row');
    var error = form.querySelector('.wl-error');
    var boton = form.querySelector('button[type="submit"]');
    var textoBoton = boton.querySelector('.label');
    var original = textoBoton ? textoBoton.textContent : '';
    var endpoint = form.getAttribute('data-endpoint') || '';

    var estado = function (s, msg) {
      form.setAttribute('data-state', s);
      fila.classList.toggle('invalid', s === 'invalid');
      input.setAttribute('aria-invalid', s === 'invalid' ? 'true' : 'false');
      if (msg !== undefined) error.textContent = msg;
      if (textoBoton) textoBoton.textContent = s === 'sending' ? L.enviando : original;
      boton.setAttribute('aria-disabled', s === 'sending' ? 'true' : 'false');
    };
    input.addEventListener('input', function () { if (form.getAttribute('data-state') === 'invalid' || form.getAttribute('data-state') === 'error') estado('idle', ''); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.getAttribute('data-state') === 'sending') return;
      var correo = (input.value || '').trim();
      if (!correo) { estado('invalid', form.getAttribute('data-accion') === 'baja' ? L.vacioBaja : L.vacio); input.focus(); return; }
      if (!RE_CORREO.test(correo) || correo.length > 254) { estado('invalid', L.incompleto); input.focus(); return; }
      if (!endpoint) { estado('error', L.inactiva); return; }

      estado('sending');
      var datos = new URLSearchParams();
      datos.set('correo', correo);
      datos.set('origen', form.getAttribute('data-origen') || location.pathname);
      datos.set('accion', form.getAttribute('data-accion') || 'alta');
      datos.set('web', (form.querySelector('.wl-hp input') || {}).value || '');

      // Google contesta casi siempre en 1 o 2 s, pero a veces tarda 13-20 s, y a veces guarda
      // el correo y aun así responde 404 (medido el 03/10/2026). Por eso: 30 s por intento y
      // un reintento. Si el reintento dice «ya estaba», es que el primero lo guardó: se da por
      // apuntado sin más. Si tarda, el botón avisa de que sigue enviando.
      var reintentos = 0;
      var aviso = setTimeout(function () {
        if (textoBoton && form.getAttribute('data-state') === 'sending') textoBoton.textContent = L.tarda;
      }, 6000);
      var intento = function (plazo) {
        var controlador = 'AbortController' in window ? new AbortController() : null;
        var limite = setTimeout(function () { if (controlador) controlador.abort(); }, plazo);
        return fetch(endpoint, { method: 'POST', body: datos, signal: controlador ? controlador.signal : undefined })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function (j) { clearTimeout(limite); return j; }, function (err) { clearTimeout(limite); throw err; });
      };
      intento(30000)
        .catch(function () {
          reintentos++;
          return new Promise(function (seguir) { setTimeout(seguir, 800); }).then(function () { return intento(30000); });
        })
        .then(function (j) {
          clearTimeout(aviso);
          if (j && j.ok) {
            var hecho = form.querySelector('.wl-done span');
            if (hecho && j.yaEstaba && !reintentos) hecho.textContent = L.yaEstaba;
            form.setAttribute('data-correo', correo);
            estado('done');
            var titulo = form.querySelector('.wl-done strong');
            if (titulo) { titulo.setAttribute('tabindex', '-1'); titulo.focus(); }
          } else if (j && j.motivo === 'correo') {
            estado('invalid', L.invalido);
            input.focus();
          } else {
            throw new Error('respuesta');
          }
        })
        .catch(function () {
          clearTimeout(aviso);
          estado('error', L.fallo);
        });
    });
  });

  /* Después de apuntarse: «¿para qué lo usarías?», un clic y opcional. Solo manda una
     palabra de una lista cerrada; el servidor descarta cualquier otra. */
  document.querySelectorAll('.wl-uso').forEach(function (grupo) {
    var form = grupo.closest('.wl-form');
    var ok = grupo.querySelector('.wl-uso-ok');
    var chips = grupo.querySelectorAll('.wl-chip');
    var envio = 0;
    var mandar = function (datos) {
      return fetch(form.getAttribute('data-endpoint'), { method: 'POST', body: datos })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error('respuesta'); });
    };
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var correo = form.getAttribute('data-correo');
        if (!correo) return;
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        grupo.setAttribute('data-hecho', '');
        ok.textContent = L.usoGracias;
        var este = ++envio;
        var datos = new URLSearchParams();
        datos.set('correo', correo);
        datos.set('accion', 'uso');
        datos.set('uso', chip.getAttribute('data-uso'));
        datos.set('web', '');
        // Como en el alta: Google a veces guarda y responde 404, así que un reintento.
        mandar(datos)
          .catch(function () { return new Promise(function (s) { setTimeout(s, 800); }).then(function () { return mandar(datos); }); })
          .catch(function () { if (este === envio) ok.textContent = L.usoFallo; });
      });
    });
  });

  /* --------------------------------- La mini hoja que se resuelve sola */
  var vivo = document.querySelector('[data-live-sheet]');
  if (vivo) {
    var celdas = {
      a: vivo.querySelector('[data-k="a"]'), b: vivo.querySelector('[data-k="b"]'),
      obj: vivo.querySelectorAll('[data-k="obj"]'), estado: vivo.querySelector('[data-k="estado"]'),
      u1: vivo.querySelector('[data-k="u1"]'), u2: vivo.querySelector('[data-k="u2"]'), u3: vivo.querySelector('[data-k="u3"]'),
      h1: vivo.querySelector('[data-k="h1"]'), h2: vivo.querySelector('[data-k="h2"]'), h3: vivo.querySelector('[data-k="h3"]'),
    };
    var menu = vivo.querySelector('.window-bar .menu');
    var repetir = vivo.querySelector('.replay');
    var miles = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, EN ? ',' : '.'); };
    var temporizadores = [];
    var despues = function (ms, fn) { temporizadores.push(setTimeout(fn, ms)); };
    var contar = function (el, hasta, formato, ms) {
      if (!el) return;
      var inicio = null;
      var paso = function (t) {
        if (!inicio) inicio = t;
        var p = Math.min(1, (t - inicio) / ms);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = formato ? formato(hasta * e) : miles(hasta * e);
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    };
    var vaciar = function () {
      ['a', 'b', 'u1', 'u2', 'u3', 'h1', 'h2', 'h3'].forEach(function (k) {
        if (celdas[k]) { celdas[k].textContent = ''; celdas[k].classList.remove('ok', 'pop'); }
      });
      celdas.obj.forEach(function (o) { o.textContent = '—'; });
      celdas.estado.textContent = L.sinResolver;
      celdas.estado.classList.remove('done');
    };
    var final = function () {
      celdas.a.textContent = '20'; celdas.b.textContent = '60';
      celdas.u1.textContent = '100'; celdas.u2.textContent = '80'; celdas.u3.textContent = '20';
      celdas.h1.textContent = '0'; celdas.h2.textContent = '0'; celdas.h3.textContent = '20';
      celdas.h1.classList.add('ok'); celdas.h2.classList.add('ok');
      celdas.obj.forEach(function (o) { o.textContent = L.dinero(2600); });
      celdas.estado.textContent = L.optima;
      celdas.estado.classList.add('done');
    };
    var animar = function () {
      temporizadores.forEach(clearTimeout); temporizadores = [];
      if (reducir) { final(); return; }
      vaciar();
      despues(500, function () { menu && menu.classList.add('flash'); });
      despues(1100, function () { menu && menu.classList.remove('flash'); celdas.estado.textContent = L.resolviendo; });
      despues(1700, function () {
        celdas.a.classList.add('pop'); celdas.b.classList.add('pop');
        contar(celdas.a, 20, null, 500); contar(celdas.b, 60, null, 500);
      });
      despues(2200, function () {
        contar(celdas.u1, 100, null, 450); contar(celdas.u2, 80, null, 450); contar(celdas.u3, 20, null, 450);
        celdas.h1.textContent = '0'; celdas.h2.textContent = '0'; celdas.h3.textContent = '20';
      });
      despues(2700, function () { celdas.h1.classList.add('ok'); celdas.h2.classList.add('ok'); });
      despues(2800, function () { celdas.obj.forEach(function (o) { contar(o, 2600, L.dinero, 700); }); });
      despues(3400, function () { celdas.estado.textContent = L.optima; celdas.estado.classList.add('done'); });
    };
    if ('IntersectionObserver' in window && !reducir) {
      var visto = false;
      var obsVivo = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !visto) { visto = true; animar(); obsVivo.disconnect(); }
      }, { threshold: 0.35 });
      vaciar();
      obsVivo.observe(vivo);
    } else {
      final();
    }
    if (repetir) repetir.addEventListener('click', animar);
  }
})();
