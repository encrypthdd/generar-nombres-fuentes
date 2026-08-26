/* ============================================================================
   Atelier · Generador de nombres por lotes
   js/app.js — estado, tipografías, medición, maquetación y render
   ----------------------------------------------------------------------------
   Todo el motor trabaja en MILÍMETROS. Cada pieza se dibuja como un <svg>
   independiente cuyo sistema de coordenadas es 1 unidad = 1 mm, de modo que
   lo que se ve en pantalla es exactamente lo que sale por la impresora
   o por el plotter de corte.
   ========================================================================== */
(function () {
'use strict';

const NF = window.NF = {};
const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
const SVGNS = 'http://www.w3.org/2000/svg';

/* ══════════════════════ 1. CATÁLOGO DE FUENTES ══════════════════════ */

const FONTS = [
  // Local / propia
  { f: 'JosephSophia',            n: 'Joseph Sophia',        g: 'Tu fuente', local: true },

  // Caligráficas formales
  { f: 'Great Vibes',             n: 'Great Vibes',          g: 'Caligráficas' },
  { f: 'Alex Brush',              n: 'Alex Brush',           g: 'Caligráficas' },
  { f: 'Allura',                  n: 'Allura',               g: 'Caligráficas' },
  { f: 'Parisienne',              n: 'Parisienne',           g: 'Caligráficas' },
  { f: 'Sacramento',              n: 'Sacramento',           g: 'Caligráficas' },
  { f: 'Pinyon Script',           n: 'Pinyon Script',        g: 'Caligráficas' },
  { f: 'Italianno',               n: 'Italianno',            g: 'Caligráficas' },
  { f: 'Tangerine',               n: 'Tangerine',            g: 'Caligráficas' },
  { f: 'Mrs Saint Delafield',     n: 'Mrs S. Delafield',     g: 'Caligráficas' },
  { f: 'Herr Von Muellerhoff',    n: 'Herr V. Muellerhoff',  g: 'Caligráficas' },
  { f: 'Monsieur La Doulaise',    n: 'Monsieur La Doulaise', g: 'Caligráficas' },
  { f: 'Petit Formal Script',     n: 'Petit Formal Script',  g: 'Caligráficas' },
  { f: 'Rouge Script',            n: 'Rouge Script',         g: 'Caligráficas' },
  { f: 'Qwigley',                 n: 'Qwigley',              g: 'Caligráficas' },
  { f: 'Ephesis',                 n: 'Ephesis',              g: 'Caligráficas' },
  { f: 'Style Script',            n: 'Style Script',         g: 'Caligráficas' },
  { f: 'Meow Script',             n: 'Meow Script',          g: 'Caligráficas' },
  { f: 'Birthstone',              n: 'Birthstone',           g: 'Caligráficas' },
  { f: 'Mea Culpa',               n: 'Mea Culpa',            g: 'Caligráficas' },
  { f: 'Bilbo Swash Caps',        n: 'Bilbo Swash Caps',     g: 'Caligráficas' },

  // Manuscritas / pincel
  { f: 'Dancing Script',          n: 'Dancing Script',       g: 'Manuscritas' },
  { f: 'Yellowtail',              n: 'Yellowtail',           g: 'Manuscritas' },
  { f: 'Satisfy',                 n: 'Satisfy',              g: 'Manuscritas' },
  { f: 'Cookie',                  n: 'Cookie',               g: 'Manuscritas' },
  { f: 'Grand Hotel',             n: 'Grand Hotel',          g: 'Manuscritas' },
  { f: 'Norican',                 n: 'Norican',              g: 'Manuscritas' },
  { f: 'Kaushan Script',          n: 'Kaushan Script',       g: 'Manuscritas' },
  { f: 'Courgette',               n: 'Courgette',            g: 'Manuscritas' },
  { f: 'Marck Script',            n: 'Marck Script',         g: 'Manuscritas' },
  { f: 'Caveat',                  n: 'Caveat',               g: 'Manuscritas' },
  { f: 'Homemade Apple',          n: 'Homemade Apple',       g: 'Manuscritas' },
  { f: 'Playball',                n: 'Playball',             g: 'Manuscritas' },
  { f: 'Berkshire Swash',         n: 'Berkshire Swash',      g: 'Manuscritas' },
  { f: 'Lobster Two',             n: 'Lobster Two',          g: 'Manuscritas' },

  // Rectas (para nombres de aula, etiquetas, números)
  { f: 'Playfair Display',        n: 'Playfair Display',     g: 'Rectas' },
  { f: 'Cinzel',                  n: 'Cinzel',               g: 'Rectas' },
  { f: 'Cormorant Garamond',      n: 'Cormorant Garamond',   g: 'Rectas' },
  { f: 'Bebas Neue',              n: 'Bebas Neue',           g: 'Rectas' },
  { f: 'Oswald',                  n: 'Oswald',               g: 'Rectas' },
  { f: 'Montserrat',              n: 'Montserrat',           g: 'Rectas' },
  { f: 'Josefin Sans',            n: 'Josefin Sans',         g: 'Rectas' },
];

const PAPERS = [
  { id: 'a4',      n: 'A4 · 210 × 297 mm',        w: 210,   h: 297 },
  { id: 'letter',  n: 'Carta · 216 × 279 mm',     w: 215.9, h: 279.4 },
  { id: 'legal',   n: 'Oficio · 216 × 356 mm',    w: 215.9, h: 355.6 },
  { id: 'a3',      n: 'A3 · 297 × 420 mm',        w: 297,   h: 420 },
  { id: 'tabloid', n: 'Tabloide · 279 × 432 mm',  w: 279.4, h: 431.8 },
  { id: 'a5',      n: 'A5 · 148 × 210 mm',        w: 148,   h: 210 },
  { id: 'mug',     n: 'Taza 11 oz · 200 × 90 mm', w: 200,   h: 90 },
  { id: 'vinyl30', n: 'Vinil rollo · 300 × 600',  w: 300,   h: 600 },
  { id: 'vinyl60', n: 'Vinil rollo · 600 × 900',  w: 600,   h: 900 },
  { id: 'custom',  n: 'Personalizado…',           w: 210,   h: 297 },
];

const GLYPHS = ['♥','❤','♡','❥','❦','❧','✿','❀','✾','✽','✻','✦','✧','★','☆','✩',
                '⚜','☘','ღ','♪','♫','∼','~','·','•','—','–','⁓','«','»','·','ᵕ'];

const FEATURES = [
  { t: 'swsh', n: 'Swash' },   { t: 'salt', n: 'Alternas' },
  { t: 'calt', n: 'Contextual' }, { t: 'liga', n: 'Ligaduras' },
  { t: 'dlig', n: 'Ligad. disc.' }, { t: 'hlig', n: 'Ligad. hist.' },
  { t: 'ss01', n: 'ss01' }, { t: 'ss02', n: 'ss02' }, { t: 'ss03', n: 'ss03' },
  { t: 'ss04', n: 'ss04' }, { t: 'ss05', n: 'ss05' }, { t: 'ss06', n: 'ss06' },
  { t: 'ss07', n: 'ss07' }, { t: 'ss08', n: 'ss08' }, { t: 'titl', n: 'Titling' },
  { t: 'ornm', n: 'Ornamentos' },
];

/* ══════════════════════ 2. ESTADO ══════════════════════ */

const DEFAULTS = {
  text: 'María\nSofía\nValentina\nEmiliano\nFamilia Pérez',
  family: 'JosephSophia',
  weight: '400',
  italic: 'normal',
  repeat: 1,
  caseMode: 'none',
  sizeMode: 'cap',
  unit: 'mm',
  size: 25,
  maxW: 0,
  tracking: 0,
  fillOn: true,  fill: '#111111',
  strokeOn: false, stroke: '#c0392b', strokeW: 0.3,
  prefix: '', suffix: '',
  features: [],
  paper: 'a4', orient: 'portrait', paperW: 210, paperH: 297,
  margin: 10, gapX: 8, gapY: 8,
  align: 'center',
  guides: false, mirror: false, pageNum: false,
  zoom: 0, // 0 = auto/ajustar
};

let S = Object.assign({}, DEFAULTS);
NF.state = () => S;

/* Buffers de fuentes cargadas como archivo (para opentype.js) */
NF.fontBuffers = Object.create(null);   // family -> ArrayBuffer
NF.otFonts     = Object.create(null);   // family -> opentype.Font
NF.pages       = [];                    // resultado de la última maquetación
NF.paper       = { w: 210, h: 297 };

/* ══════════════════════ 3. UTILIDADES ══════════════════════ */

const MM_PER = { mm: 1, cm: 10, in: 25.4, pt: 25.4 / 72 };
const toMm   = (v, u) => v * (MM_PER[u] || 1);
const fromMm = (v, u) => v / (MM_PER[u] || 1);
const clamp  = (v, a, b) => Math.min(b, Math.max(a, v));

function debounce(fn, ms) {
  let t; return function () { clearTimeout(t); t = setTimeout(() => fn.apply(this, arguments), ms); };
}

let toastT;
function toast(msg, ms) {
  const box = $('#toast');
  box.innerHTML = '<div>' + msg + '</div>';
  box.classList.remove('hidden');
  clearTimeout(toastT);
  toastT = setTimeout(() => box.classList.add('hidden'), ms || 2600);
}
NF.toast = toast;

function applyCase(str, mode) {
  if (mode === 'upper') return str.toLocaleUpperCase('es');
  if (mode === 'lower') return str.toLocaleLowerCase('es');
  if (mode === 'title') return str.toLocaleLowerCase('es').replace(/(^|[\s'"([-])([\p{L}])/gu,
    (m, a, b) => a + b.toLocaleUpperCase('es'));
  return str;
}

function featureString(list) {
  if (!list || !list.length) return 'normal';
  return list.map(t => '"' + t + '" 1').join(', ');
}

/* ══════════════════════ 4. DETECCIÓN DE FUENTES ══════════════════════ */

/* Comprueba si una familia está realmente disponible comparando anchos
   contra dos fuentes de referencia distintas. */
function fontAvailable(family) {
  const probe = 'MWQ@#mwq—Ñ 019';
  const cvs = fontAvailable._c || (fontAvailable._c = document.createElement('canvas'));
  const ctx = cvs.getContext('2d');
  const base = ['monospace', 'serif', 'sans-serif'];
  for (const b of base) {
    ctx.font = '72px ' + b;
    const ref = ctx.measureText(probe).width;
    ctx.font = '72px "' + family + '", ' + b;
    if (Math.abs(ctx.measureText(probe).width - ref) > 0.5) return true;
  }
  return false;
}

/* La comparación por canvas da falsos positivos con las @font-face que fallan
   (el navegador deja la cara en estado «loading» y las métricas bailan). Para
   las fuentes que declaramos nosotros preguntamos directamente al
   FontFaceSet, que es determinista. */
NF.localOK = null;

async function probeLocal(family) {
  const load = document.fonts.load('40px "' + family + '"', 'AaÑ0');
  try {
    await Promise.race([load, new Promise(r => setTimeout(r, 3500))]);
  } catch (e) { /* la carga falló: seguimos y consultamos el estado */ }

  let declared = false, loaded = false;
  document.fonts.forEach(face => {
    if (face.family.replace(/^["']|["']$/g, '') !== family) return;
    declared = true;
    if (face.status === 'loaded') loaded = true;
  });
  return declared ? loaded : fontAvailable(family);
}

/* Debe ejecutarse SIEMPRE después de document.fonts.ready. */
async function checkLocalFont() {
  try { await document.fonts.ready; } catch (e) { /* noop */ }
  NF.localOK = {};
  for (const f of FONTS) {
    if (f.local) NF.localOK[f.f] = await probeLocal(f.f);
  }
  const ok = !!NF.localOK['JosephSophia'];
  $('#localFontWarn').classList.toggle('hidden', ok);
  // El archivo binario solo se puede leer por HTTP (file:// lo bloquea por CORS)
  if (ok && /^https?:$/.test(location.protocol)) tryFetchLocalFontFile();
  return ok;
}

async function tryFetchLocalFontFile() {
  const names = ['fonts/josephsophia.ttf', 'fonts/josephsophia.otf',
                 'fonts/JosephSophia.ttf', 'fonts/JosephSophia.otf'];
  for (const url of names) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const buf = await r.arrayBuffer();
      if (buf.byteLength < 1024) continue;
      NF.fontBuffers['JosephSophia'] = buf;
      NF.parseOpenType && NF.parseOpenType('JosephSophia');
      return true;
    } catch (e) { /* siguiente */ }
  }
  return false;
}

/* Carga de archivos de fuente arrastrados por el usuario */
async function loadFontFiles(files) {
  let last = null;
  for (const file of files) {
    const buf = await file.arrayBuffer();
    const family = 'user-' + file.name.replace(/\.[^.]+$/, '').replace(/[^\w\-]+/g, '-');
    const label  = file.name.replace(/\.[^.]+$/, '');
    try {
      const face = new FontFace(family, buf);
      await face.load();
      document.fonts.add(face);
    } catch (e) {
      toast('No se pudo leer «' + file.name + '»'); continue;
    }
    if (!FONTS.some(f => f.f === family))
      FONTS.unshift({ f: family, n: label, g: 'Cargadas por ti', user: true });
    if (/\.(ttf|otf)$/i.test(file.name)) {
      NF.fontBuffers[family] = buf;
      NF.parseOpenType && NF.parseOpenType(family);
    }
    last = family;
  }
  if (last) {
    renderFontList();
    setFamily(last);
    toast('Fuente cargada · ' + files.length + ' archivo(s)');
  }
}

/* ══════════════════════ 5. PARSEO DE LA LISTA ══════════════════════ */

function parseItems() {
  const lines = S.text.split(/\r?\n/);
  const out = [];
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const parts = raw.split('|');
    let txt = parts[0].replace(/\s+$/, '').replace(/^\s+/, '');
    if (!txt) continue;
    const rep  = parts[1] !== undefined ? clamp(parseInt(parts[1], 10) || 1, 1, 999) : S.repeat;
    const size = parts[2] !== undefined && parts[2].trim() !== ''
               ? toMm(parseFloat(parts[2]) || 0, S.unit) : 0;

    txt = applyCase(txt, S.caseMode);
    const full = S.prefix + txt + S.suffix;
    for (let i = 0; i < rep; i++) out.push({ text: full, plain: txt, sizeOverride: size });
  }
  return out;
}

/* ══════════════════════ 6. MEDICIÓN (SVG getBBox) ══════════════════════ */

const measureSVG = () => $('#measure');
const capCache = new Map();

/* Si la familia elegida no está disponible se cae a una caligráfica decente
   en vez de a la «cursive» del sistema, que es horrible. */
const FALLBACK = '"Great Vibes", "Segoe Script", cursive';
NF.FALLBACK = FALLBACK;

function styleText(el, opt) {
  el.style.fontFamily = '"' + opt.family + '", ' + FALLBACK;
  el.style.fontSize = opt.fontSize + 'px';       // en SVG: 1 px = 1 unidad = 1 mm
  el.style.fontWeight = opt.weight;
  el.style.fontStyle = opt.italic;
  el.style.letterSpacing = (opt.tracking || 0) + 'em';
  el.style.fontFeatureSettings = featureString(opt.features);
  el.style.fontKerning = 'normal';
  el.style.whiteSpace = 'pre';
}

/* Devuelve la caja de tinta {x,y,w,h} de un texto, en unidades de usuario */
function measure(text, opt) {
  const svg = measureSVG();
  const t = document.createElementNS(SVGNS, 'text');
  t.setAttribute('x', 0); t.setAttribute('y', 0);
  t.setAttribute('xml:space', 'preserve');
  t.textContent = text;
  styleText(t, opt);
  svg.appendChild(t);
  let b;
  try { b = t.getBBox(); } catch (e) { b = { x: 0, y: -opt.fontSize, width: 1, height: opt.fontSize }; }
  const r = { x: b.x, y: b.y, w: Math.max(b.width, 0.01), h: Math.max(b.height, 0.01) };
  svg.removeChild(t);
  return r;
}

/* ─────────────────────────────────────────────────────────────────────────
   Por qué se mide UNA vez a tamaño de referencia y luego se escala:

   El navegador ajusta («hinting») el contorno del texto a píxeles enteros del
   dispositivo. A tamaño de pantalla eso cuantiza el alto de tinta en saltos de
   ~0,26 mm: para una «H» de 25 mm sólo son alcanzables 24,87 y 25,14, nunca
   25,00. Cualquier bucle que persiga los 25,00 medidos oscila entre esos dos
   valores sin converger, y además es un artefacto de PANTALLA: al imprimir, la
   resolución es mucho mayor y el contorno sigue fielmente al font-size.

   Solución: medir a REF unidades (donde el error de cuantización es ~0,03 %) y
   escalar linealmente, que es exactamente como se comporta la tipografía.
   ───────────────────────────────────────────────────────────────────────── */
const REF = 1000;
const boxCache = new Map();
function clearCaches() { capCache.clear(); boxCache.clear(); }

/* Caja de tinta del texto a tamaño REF (cacheada: los lotes repiten nombres) */
function refBox(text, opt) {
  const key = opt.family + '|' + opt.weight + '|' + opt.italic + '|' +
              opt.tracking + '|' + featureString(opt.features) + '|' + text;
  let b = boxCache.get(key);
  if (!b) {
    b = measure(text, Object.assign({}, opt, { fontSize: REF }));
    boxCache.set(key, b);
  }
  return b;
}

/* Proporción alturaMayúscula / fontSize de la familia (cacheada) */
function capRatio(opt) {
  const key = opt.family + '|' + opt.weight + '|' + opt.italic;
  if (capCache.has(key)) return capCache.get(key);
  const b = measure('H', Object.assign({}, opt, { fontSize: REF, tracking: 0 }));
  const r = b.h / REF || 0.7;
  capCache.set(key, r);
  return r;
}

/* ══════════════════════ 7. MAQUETACIÓN ══════════════════════ */

function paperSize() {
  const p = PAPERS.find(x => x.id === S.paper) || PAPERS[0];
  let w = p.id === 'custom' ? S.paperW : p.w;
  let h = p.id === 'custom' ? S.paperH : p.h;
  if (S.orient === 'landscape') { const t = w; w = h; h = t; }
  return { w: Math.max(20, w), h: Math.max(20, h) };
}

function buildLayout() {
  const paper = paperSize();
  NF.paper = paper;

  const contentW = Math.max(1, paper.w - S.margin * 2);
  const contentH = Math.max(1, paper.h - S.margin * 2);
  const targetMm = toMm(S.size, S.unit);
  const maxWmm   = S.maxW > 0 ? toMm(S.maxW, S.unit) : 0;

  const baseOpt = {
    family: S.family, weight: S.weight, italic: S.italic,
    tracking: S.tracking, features: S.features, fontSize: 100,
  };

  const raw = parseItems();
  const pieces = [];
  let warn = '';

  for (const it of raw) {
    const target = it.sizeOverride > 0 ? it.sizeOverride : targetMm;
    const b0 = refBox(it.text, baseOpt);      // una única medición, a REF unidades

    // Tamaño de fuente que da la medida pedida
    let fs = S.sizeMode === 'em'  ? target
           : S.sizeMode === 'cap' ? target / capRatio(baseOpt)
           :                        target * REF / b0.h;   // 'ink': alto total

    // Límites: ancho máximo del usuario y área útil de la hoja
    if (maxWmm > 0) fs = Math.min(fs, maxWmm * REF / b0.w);
    let over = false;
    if (fs * b0.w / REF > contentW) { fs = contentW * REF / b0.w; over = true; }
    if (fs * b0.h / REF > contentH) { fs = contentH * REF / b0.h; over = true; }
    if (over) warn = 'Algunas piezas se redujeron para caber en la hoja.';

    const k = fs / REF;                       // la tipografía escala linealmente
    const pad = S.strokeOn ? S.strokeW : 0;   // el contorno crece hacia fuera
    pieces.push({
      text: it.text, fontSize: fs,
      bx: b0.x * k - pad,  by: b0.y * k - pad,
      w:  b0.w * k + pad * 2, h: b0.h * k + pad * 2,
      baseline: -(b0.y * k - pad),            // distancia desde el borde superior
      over: over,
    });
  }

  /* --- empaquetado en filas --- */
  const rows = [];
  let row = [], rowW = 0;
  for (const p of pieces) {
    if (row.length && rowW + S.gapX + p.w > contentW + 1e-6) {
      rows.push(finishRow(row, rowW)); row = []; rowW = 0;
    }
    if (row.length) rowW += S.gapX;
    p.rowX = rowW; rowW += p.w; row.push(p);
  }
  if (row.length) rows.push(finishRow(row, rowW));

  function finishRow(items, w) {
    const base = Math.max.apply(null, items.map(i => i.baseline));
    const below = Math.max.apply(null, items.map(i => i.h - i.baseline));
    for (const i of items) i.rowY = base - i.baseline;
    return { items, w, h: base + below, base };
  }

  /* --- reparto de filas en páginas --- */
  const pages = [];
  let cur = [], y = 0;
  for (const r of rows) {
    if (cur.length && y + S.gapY + r.h > contentH + 1e-6) { pages.push(cur); cur = []; y = 0; }
    if (cur.length) y += S.gapY;
    r.y = y; y += r.h; cur.push(r);
  }
  if (cur.length) pages.push(cur);

  /* --- alineación horizontal --- */
  for (const pg of pages) {
    for (const r of pg) {
      const free = contentW - r.w;
      let off = 0, extra = 0;
      if (S.align === 'center') off = free / 2;
      else if (S.align === 'right') off = free;
      else if (S.align === 'justify' && r.items.length > 1) extra = free / (r.items.length - 1);
      r.items.forEach((it, i) => { it.x = off + it.rowX + extra * i; it.y = r.y + it.rowY; });
    }
  }

  NF.pages = pages;
  NF.warn = warn;
  return { pages, paper, contentW, contentH, count: pieces.length };
}

/* ══════════════════════ 8. RENDER ══════════════════════ */

/* Una ÚNICA <svg> por hoja, con 1 unidad de usuario = 1 mm.
   Se usa igual para la vista previa, para el PDF y para el SVG de corte, así
   que lo que se ve en pantalla es exactamente lo que sale por la máquina.
   mode: 'text' (texto vivo) · 'path' (contornos reales, requiere el .ttf/.otf) */
function buildPageSVG(rows, paper, opts) {
  opts = opts || {};
  const usePath = opts.mode === 'path' && !!(NF.textToPath && NF.otFonts[S.family]);

  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('xmlns', SVGNS);
  svg.setAttribute('version', '1.1');
  svg.setAttribute('width',  paper.w + 'mm');
  svg.setAttribute('height', paper.h + 'mm');
  svg.setAttribute('viewBox', '0 0 ' + paper.w + ' ' + paper.h);

  const root = document.createElementNS(SVGNS, 'g');
  if (S.mirror) root.setAttribute('transform', 'translate(' + paper.w + ',0) scale(-1,1)');
  svg.appendChild(root);

  const layer = document.createElementNS(SVGNS, 'g');
  layer.setAttribute('transform', 'translate(' + S.margin + ',' + S.margin + ')');
  root.appendChild(layer);

  const guide = (x, y, w, h, color, dash) => {
    const r = document.createElementNS(SVGNS, 'rect');
    r.setAttribute('x', x); r.setAttribute('y', y);
    r.setAttribute('width', w); r.setAttribute('height', h);
    r.setAttribute('fill', 'none');
    r.setAttribute('stroke', color);
    r.setAttribute('stroke-width', 0.25);
    r.setAttribute('stroke-dasharray', dash);
    return r;
  };

  if (opts.guides) {
    layer.appendChild(guide(0, 0, paper.w - S.margin * 2, paper.h - S.margin * 2, '#ef4444', '2 1.5'));
  }

  for (const row of rows) for (const p of row.items) {
    if (opts.guides) layer.appendChild(guide(p.x, p.y, p.w, p.h, p.over ? '#ef4444' : '#3b82f6', '1 1'));

    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('transform', 'translate(' + (p.x - p.bx) + ',' + (p.y - p.by) + ')');

    let node;
    if (usePath) {
      node = document.createElementNS(SVGNS, 'path');
      node.setAttribute('d', NF.textToPath(NF.otFonts[S.family], p.text, p.fontSize, S.tracking));
    } else {
      node = document.createElementNS(SVGNS, 'text');
      node.setAttribute('x', 0); node.setAttribute('y', 0);
      node.setAttribute('xml:space', 'preserve');
      node.textContent = p.text;
      styleText(node, {
        family: S.family, weight: S.weight, italic: S.italic,
        tracking: S.tracking, features: S.features, fontSize: p.fontSize,
      });
    }
    node.setAttribute('fill', S.fillOn ? S.fill : 'none');
    if (S.strokeOn) {
      node.setAttribute('stroke', S.stroke);
      node.setAttribute('stroke-width', S.strokeW);
      node.setAttribute('stroke-linejoin', 'round');
      node.setAttribute('paint-order', 'stroke');
    }
    node.setAttribute('data-name', p.text);

    if (opts.screen) {   // el tooltip solo interesa en pantalla
      const title = document.createElementNS(SVGNS, 'title');
      title.textContent = p.text + '  ·  ' + p.w.toFixed(1) + ' × ' + p.h.toFixed(1) + ' mm';
      g.appendChild(title);
    }
    g.appendChild(node);
    layer.appendChild(g);
  }
  return { svg: svg, vector: usePath };
}
NF.buildPageSVG = buildPageSVG;

function render() {
  const host = $('#pages');
  const info = buildLayout();
  host.innerHTML = '';

  const empty = info.count === 0;
  $('#empty').classList.toggle('hidden', !empty);

  let inkArea = 0;
  info.pages.forEach((rows, pi) => {
    const page = document.createElement('div');
    page.className = 'page';
    page.style.width  = info.paper.w + 'mm';
    page.style.height = info.paper.h + 'mm';

    for (const r of rows) for (const p of r.items) inkArea += p.w * p.h;
    page.appendChild(buildPageSVG(rows, info.paper,
      { mode: 'text', guides: S.guides, screen: true }).svg);

    if (S.pageNum) {
      const lab = document.createElement('div');
      lab.className = 'page-label';
      lab.textContent = (pi + 1) + ' / ' + info.pages.length;
      page.appendChild(lab);
    }
    host.appendChild(page);
  });

  // Estadísticas
  const totalArea = info.pages.length * info.contentW * info.contentH;
  $('#statItems').textContent = info.count;
  $('#statPages').textContent = info.pages.length;
  $('#statFill').textContent  = totalArea ? Math.round(inkArea / totalArea * 100) + ' %' : '0 %';

  const wb = $('#warnBox');
  wb.classList.toggle('hidden', !NF.warn);
  wb.classList.toggle('flex', !!NF.warn);
  $('#warnTxt').textContent = NF.warn || '';

  // Regla @page para que la impresión salga a escala 1:1
  $('#print-style').textContent =
    '@page{size:' + info.paper.w + 'mm ' + info.paper.h + 'mm;margin:0}';

  applyZoom();
}
NF.render = render;

const rerender = debounce(() => {
  $('#busy').classList.add('flex'); $('#busy').classList.remove('hidden');
  requestAnimationFrame(() => {
    try { render(); } catch (e) { console.error(e); toast('Error al maquetar: ' + e.message); }
    $('#busy').classList.add('hidden'); $('#busy').classList.remove('flex');
  });
}, 180);
NF.rerender = rerender;

/* ── Zoom ── */
function applyZoom() {
  const host = $('#pages');
  const vp = $('#viewport');
  let z = S.zoom;
  if (!z) {
    const avail = vp.clientWidth - 64;
    const pxW = NF.paper.w * 96 / 25.4;
    z = clamp(avail / pxW, 0.06, 1);
  }
  host.style.transform = 'scale(' + z + ')';
  host.style.marginBottom = (host.scrollHeight * (z - 1)) + 'px';
  $('#zoomLbl').textContent = Math.round(z * 100) + ' %';
}

/* ══════════════════════ 9. INTERFAZ ══════════════════════ */

function renderFontList() {
  const host = $('#fontList');
  const q = ($('#fontSearch').value || '').toLowerCase().trim();
  host.innerHTML = '';
  let group = null;

  for (const f of FONTS) {
    if (q && f.n.toLowerCase().indexOf(q) === -1 && f.g.toLowerCase().indexOf(q) === -1) continue;
    if (f.g !== group) {
      group = f.g;
      const g = document.createElement('div');
      g.className = 'fi-group'; g.textContent = group;
      host.appendChild(g);
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'font-item' + (S.family === f.f ? ' on' : '');
    b.dataset.family = f.f;

    const prev = document.createElement('span');
    prev.className = 'fi-prev';
    prev.style.fontFamily = '"' + f.f + '", ' + FALLBACK;
    prev.textContent = 'María ♥';

    const nm = document.createElement('span');
    nm.className = 'fi-name';
    nm.textContent = f.n;

    b.appendChild(prev); b.appendChild(nm);

    if (f.local && NF.localOK && NF.localOK[f.f] === false) {
      const bd = document.createElement('span');
      bd.className = 'fi-badge'; bd.textContent = 'falta';
      b.appendChild(bd);
      prev.style.opacity = '.35';
    }
    if (NF.fontBuffers[f.f]) {
      const bd = document.createElement('span');
      bd.className = 'fi-badge'; bd.textContent = 'vector';
      b.appendChild(bd);
    }
    b.addEventListener('click', () => setFamily(f.f));
    host.appendChild(b);
  }
}

function setFamily(fam) {
  S.family = fam;
  clearCaches();
  $$('#fontList .font-item').forEach(el => el.classList.toggle('on', el.dataset.family === fam));
  NF.refreshGlyphs && NF.refreshGlyphs();
  rerender();
}

function renderPalette() {
  const host = $('#glyphPalette');
  host.innerHTML = '';
  for (const g of GLYPHS) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = g; b.title = g;
    b.addEventListener('click', ev => {
      if (ev.altKey) { S.prefix += g; $('#inpPrefix').value = S.prefix; }
      else           { S.suffix += g; $('#inpSuffix').value = S.suffix; }
      rerender();
    });
    host.appendChild(b);
  }
}

function renderFeatures() {
  const host = $('#featGrid');
  host.innerHTML = '';
  for (const f of FEATURES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (S.features.indexOf(f.t) >= 0 ? ' on' : '');
    b.textContent = f.n; b.title = f.t;
    b.addEventListener('click', () => {
      const i = S.features.indexOf(f.t);
      if (i >= 0) S.features.splice(i, 1); else S.features.push(f.t);
      b.classList.toggle('on');
      clearCaches();
      rerender();
    });
    host.appendChild(b);
  }
}

function renderPapers() {
  const sel = $('#selPaper');
  sel.innerHTML = '';
  for (const p of PAPERS) {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = p.n;
    sel.appendChild(o);
  }
  sel.value = S.paper;
}

/* ── Enlaza un control con una propiedad del estado ── */
function bind(sel, prop, type, extra) {
  const el = $(sel);
  if (!el) return;
  const ev = (type === 'bool' || el.tagName === 'SELECT') ? 'change' : 'input';
  el.addEventListener(ev, () => {
    S[prop] = type === 'num'  ? (parseFloat(el.value) || 0)
            : type === 'int'  ? (parseInt(el.value, 10) || 0)
            : type === 'bool' ? el.checked
            : el.value;
    if (extra) extra(S[prop], el);
    rerender();
  });
}

function syncUI() {
  $('#txtInput').value    = S.text;
  $('#numRepeat').value   = S.repeat;
  $('#selCase').value     = S.caseMode;
  $('#selWeight').value   = S.weight;
  $('#selItalic').value   = S.italic;
  $('#selSizeMode').value = S.sizeMode;
  $('#selUnit').value     = S.unit;
  $('#numSize').value     = S.size;
  $('#rangeSize').value   = clamp(S.size, 1, 200);
  $('#unitLbl').textContent = S.unit;
  $('#numMaxW').value     = S.maxW;
  $('#numTracking').value = S.tracking;
  $('#chkFill').checked   = S.fillOn;
  $('#inpFill').value     = S.fill;
  $('#chkStroke').checked = S.strokeOn;
  $('#inpStroke').value   = S.stroke;
  $('#numStrokeW').value  = S.strokeW;
  $('#inpPrefix').value   = S.prefix;
  $('#inpSuffix').value   = S.suffix;
  $('#selPaper').value    = S.paper;
  $('#selOrient').value   = S.orient;
  $('#numPaperW').value   = S.paperW;
  $('#numPaperH').value   = S.paperH;
  $('#numMargin').value   = S.margin;
  $('#numGapX').value     = S.gapX;
  $('#numGapY').value     = S.gapY;
  $('#selAlign').value    = S.align;
  $('#chkGuides').checked = S.guides;
  $('#chkMirror').checked = S.mirror;
  $('#chkPageNum').checked= S.pageNum;
  $('#customPaper').classList.toggle('hidden', S.paper !== 'custom');
  renderFontList(); renderFeatures();
}
NF.syncUI = syncUI;

function wire() {
  bind('#txtInput',   'text',     'str');
  bind('#numRepeat',  'repeat',   'int');
  bind('#selCase',    'caseMode', 'str');
  bind('#selWeight',  'weight',   'str', () => capCache.clear());
  bind('#selItalic',  'italic',   'str', () => capCache.clear());
  bind('#selSizeMode','sizeMode', 'str');
  bind('#numMaxW',    'maxW',     'num');
  bind('#numTracking','tracking', 'num', () => capCache.clear());
  bind('#chkFill',    'fillOn',   'bool');
  bind('#inpFill',    'fill',     'str');
  bind('#chkStroke',  'strokeOn', 'bool');
  bind('#inpStroke',  'stroke',   'str');
  bind('#numStrokeW', 'strokeW',  'num');
  bind('#inpPrefix',  'prefix',   'str');
  bind('#inpSuffix',  'suffix',   'str');
  bind('#selOrient',  'orient',   'str');
  bind('#numPaperW',  'paperW',   'num');
  bind('#numPaperH',  'paperH',   'num');
  bind('#numMargin',  'margin',   'num');
  bind('#numGapX',    'gapX',     'num');
  bind('#numGapY',    'gapY',     'num');
  bind('#selAlign',   'align',    'str');
  bind('#chkGuides',  'guides',   'bool');
  bind('#chkMirror',  'mirror',   'bool');
  bind('#chkPageNum', 'pageNum',  'bool');

  bind('#selPaper', 'paper', 'str', v => {
    $('#customPaper').classList.toggle('hidden', v !== 'custom');
  });

  // Tamaño: número + deslizador sincronizados
  $('#numSize').addEventListener('input', e => {
    S.size = parseFloat(e.target.value) || 1;
    $('#rangeSize').value = clamp(S.size, 1, 200);
    rerender();
  });
  $('#rangeSize').addEventListener('input', e => {
    S.size = parseFloat(e.target.value);
    $('#numSize').value = S.size;
    rerender();
  });
  $('#selUnit').addEventListener('change', e => {
    const old = S.unit, nu = e.target.value;
    S.size = +fromMm(toMm(S.size, old), nu).toFixed(3);
    S.maxW = +fromMm(toMm(S.maxW, old), nu).toFixed(3);
    S.unit = nu;
    $('#numSize').value = S.size;
    $('#numMaxW').value = S.maxW;
    $('#unitLbl').textContent = nu;
    $('#rangeSize').max = nu === 'in' ? 8 : nu === 'cm' ? 20 : nu === 'pt' ? 600 : 200;
    $('#rangeSize').step = nu === 'in' ? 0.05 : nu === 'cm' ? 0.1 : 1;
    $('#rangeSize').value = clamp(S.size, 0, +$('#rangeSize').max);
    rerender();
  });

  // Herramientas de lista
  const setText = t => { S.text = t; $('#txtInput').value = t; rerender(); };
  const lines = () => S.text.split(/\r?\n/).filter(l => l.trim());
  $('#btnSort').addEventListener('click', () =>
    setText(lines().sort((a, b) => a.localeCompare(b, 'es')).join('\n')));
  $('#btnUnique').addEventListener('click', () => {
    const seen = new Set(), out = [];
    for (const l of lines()) { const k = l.trim().toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(l); } }
    setText(out.join('\n'));
  });
  $('#btnTrimEmpty').addEventListener('click', () => setText(lines().join('\n')));
  $('#btnClear').addEventListener('click', () => { if (confirm('¿Vaciar la lista de nombres?')) setText(''); });

  // Estilos rápidos
  $$('[data-preset-style]').forEach(b => b.addEventListener('click', () => {
    const p = b.dataset.presetStyle;
    if (p === 'black')   Object.assign(S, { fillOn: true,  fill: '#111111', strokeOn: false });
    if (p === 'cut')     Object.assign(S, { fillOn: false, strokeOn: true, stroke: '#111111', strokeW: 0.25 });
    if (p === 'outline') Object.assign(S, { fillOn: true,  fill: '#ffffff', strokeOn: true, stroke: '#111111', strokeW: 0.4 });
    syncUI(); rerender();
  }));

  // Buscador de fuentes
  $('#fontSearch').addEventListener('input', debounce(renderFontList, 120));

  // Carga de archivos de fuente
  const drop = $('#fontDrop'), fin = $('#fontFile');
  drop.addEventListener('click', () => fin.click());
  fin.addEventListener('change', e => { if (e.target.files.length) loadFontFiles(e.target.files); fin.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.add('hot');
  }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
    e.preventDefault(); drop.classList.remove('hot');
  }));
  drop.addEventListener('drop', e => {
    if (e.dataTransfer.files.length) loadFontFiles(e.dataTransfer.files);
  });

  // Zoom
  $('#btnZoomIn').addEventListener('click', () => {
    S.zoom = clamp((S.zoom || currentZoom()) * 1.25, 0.05, 6); applyZoom();
  });
  $('#btnZoomOut').addEventListener('click', () => {
    S.zoom = clamp((S.zoom || currentZoom()) / 1.25, 0.05, 6); applyZoom();
  });
  $('#btnZoomFit').addEventListener('click', () => { S.zoom = 0; applyZoom(); });
  function currentZoom() {
    const m = /scale\(([\d.]+)\)/.exec($('#pages').style.transform || '');
    return m ? parseFloat(m[1]) : 1;
  }
  window.addEventListener('resize', debounce(applyZoom, 150));

  // Tema
  $('#btnTheme').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = cur;
    try { localStorage.setItem('atelier.theme', cur); } catch (e) {}
  });

  // Impresión
  $('#btnPrint').addEventListener('click', () => {
    if (!NF.pages.length) return toast('No hay nada que imprimir.');
    toast('En el diálogo elige «Guardar como PDF», márgenes «Ninguno» y escala 100 %.', 5000);
    setTimeout(() => window.print(), 400);
  });

  // Restablecer
  $('#btnReset').addEventListener('click', () => {
    if (!confirm('¿Restablecer todos los ajustes?')) return;
    S = Object.assign({}, DEFAULTS);
    syncUI(); rerender();
  });

  // Presets
  $('#btnPresetSave').addEventListener('click', savePreset);
  $('#glyphModal').addEventListener('click', e => {
    if (e.target.hasAttribute('data-close')) $('#glyphModal').classList.add('hidden');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $('#glyphModal').classList.add('hidden');
  });
}

/* ══════════════════════ 10. PRESETS (localStorage) ══════════════════════ */

const PKEY = 'atelier.presets';
function getPresets() {
  try { return JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch (e) { return {}; }
}
function savePreset() {
  const name = ($('#presetName').value || '').trim();
  if (!name) return toast('Escribe un nombre para el ajuste.');
  const all = getPresets();
  const copy = Object.assign({}, S); delete copy.text;   // los ajustes no guardan la lista
  all[name] = copy;
  try { localStorage.setItem(PKEY, JSON.stringify(all)); } catch (e) { return toast('No se pudo guardar.'); }
  $('#presetName').value = '';
  renderPresets(); toast('Ajuste «' + name + '» guardado');
}
function renderPresets() {
  const host = $('#presetList'); const all = getPresets();
  const keys = Object.keys(all);
  host.innerHTML = keys.length ? '' : '<p class="hint">Aún no has guardado ajustes.</p>';
  for (const k of keys) {
    const row = document.createElement('div');
    row.className = 'preset-row';
    row.innerHTML = '<span class="flex-1 truncate">' + k + '</span>';
    const use = document.createElement('button'); use.textContent = 'Usar';
    use.addEventListener('click', () => {
      const t = S.text; S = Object.assign({}, DEFAULTS, all[k], { text: t });
      clearCaches(); syncUI(); rerender(); toast('Ajuste aplicado');
    });
    const del = document.createElement('button'); del.textContent = '✕';
    del.addEventListener('click', () => {
      delete all[k]; localStorage.setItem(PKEY, JSON.stringify(all)); renderPresets();
    });
    row.appendChild(use); row.appendChild(del);
    host.appendChild(row);
  }
}
NF.renderPresets = renderPresets;

/* ══════════════════════ 11. ARRANQUE ══════════════════════ */

async function init() {
  try {
    const th = localStorage.getItem('atelier.theme');
    if (th) document.documentElement.dataset.theme = th;
  } catch (e) {}

  renderPapers(); renderPalette(); renderFeatures(); renderPresets();
  syncUI(); wire();

  render();
  await checkLocalFont();          // ya espera internamente a document.fonts.ready
  clearCaches();
  renderFontList();
  render();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* Exportaciones para js/export.js */
NF.FONTS = FONTS;
NF.PAPERS = PAPERS;
NF.DEFAULTS = DEFAULTS;
NF.styleText = styleText;
NF.featureString = featureString;
NF.setState = obj => { S = Object.assign({}, DEFAULTS, obj); clearCaches(); };
NF.clearCapCache = () => clearCaches();
NF.renderFontList = renderFontList;
NF.setFamily = setFamily;
NF.$ = $; NF.$$ = $$;

})();
