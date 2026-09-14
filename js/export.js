/* ============================================================================
   Atelier · js/export.js
   PDF vectorial / rasterizado, exportación SVG para plotter de corte,
   proyecto .json y explorador de glifos (opentype.js)
   ========================================================================== */
(function () {
'use strict';

const NF = window.NF;
if (!NF) { console.error('app.js debe cargarse antes que export.js'); return; }
const $ = NF.$, $$ = NF.$$;
const SVGNS = 'http://www.w3.org/2000/svg';

const CDN = {
  jspdf:    'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
  svg2pdf:  'https://cdn.jsdelivr.net/npm/svg2pdf.js@2.2.4/dist/svg2pdf.umd.min.js',
  opentype: 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js',
};

const loaded = Object.create(null);
function loadScript(url) {
  if (loaded[url]) return loaded[url];
  loaded[url] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url; s.async = true;
    s.onload = res;
    s.onerror = () => rej(new Error('No se pudo cargar ' + url));
    document.head.appendChild(s);
  });
  return loaded[url];
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function stamp() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
}

/* ═══════════════ 1. opentype.js — glifos y contornos ═══════════════ */

NF.parseOpenType = async function (family) {
  const buf = NF.fontBuffers[family];
  if (!buf || NF.otFonts[family]) return NF.otFonts[family] || null;
  try {
    await loadScript(CDN.opentype);
    const font = window.opentype.parse(buf);
    font.__nfFamily = family;          // el modelador necesita saber de quién es
    NF.otFonts[family] = font;
    NF.renderFontList();
    NF.refreshGlyphs();
    NF.rerender();                     // la vista previa pasa a dibujar contornos
    return font;
  } catch (e) {
    console.warn('opentype:', e.message);
    return null;
  }
};

/* ── Modelado tipográfico (shaping) ──
   El navegador aplica por su cuenta las características OpenType que pide el
   CSS: las de serie (ligaduras) y las que marca el usuario en el panel
   «Variantes» (ss01, swsh, salt…). opentype.js NO lo hace: stringToGlyphs()
   sólo resuelve «liga» y «rlig». Por eso el PDF vectorial salía con letras
   distintas de las de la pantalla. Aquí se replica esa sustitución leyendo la
   tabla GSUB de la propia fuente. */

/* Las que el CSS activa por defecto y no se pueden desmarcar desde la UI */
const BASE_TAGS = ['ccmp', 'rlig', 'liga', 'clig'];

const subCache = new Map();     // familia|tags -> {singles, ligs}
const scriptCache = new Map();  // familia -> script OpenType

function otScript(font, family) {
  if (scriptCache.has(family)) return scriptCache.get(family);
  let s = 'latn';
  try {
    const names = font.substitution.getScriptNames() || [];
    if (names.indexOf('latn') === -1) s = names[0] || 'DFLT';
  } catch (e) { /* fuente sin GSUB */ }
  scriptCache.set(family, s);
  return s;
}

/* Reúne, para un juego de características, las sustituciones simples
   (a → a.1) y las ligaduras (t + h → t_h) que declara la fuente. */
function subsFor(font, family, tags) {
  const key = family + '|' + tags.join(',');
  let t = subCache.get(key);
  if (t) return t;

  const script = otScript(font, family);
  const singles = new Map();
  const ligs = [];
  for (const tag of tags) {
    let ss = [], ll = [];
    try { ss = font.substitution.getSingle(tag, script) || []; } catch (e) { /* no está */ }
    try { ll = font.substitution.getLigatures(tag, script) || []; } catch (e) { /* no está */ }
    for (const r of ss) singles.set(r.sub, r.by);
    for (const r of ll) if (r.sub && r.sub.length > 1) ligs.push(r);
  }
  ligs.sort((a, b) => b.sub.length - a.sub.length);   // gana la coincidencia más larga
  t = { singles: singles, ligs: ligs };
  subCache.set(key, t);
  return t;
}

/* Cadena → lista de índices de glifo, ya sustituidos */
function shape(font, family, text, features) {
  const ids = [];
  for (const ch of text) ids.push(font.charToGlyphIndex(ch));

  const tags = BASE_TAGS.concat(features || []);
  const subs = subsFor(font, family, tags);

  // 1) ligaduras: las tablas de lookup se aplican antes que las alternativas
  if (subs.ligs.length) {
    const out = [];
    for (let i = 0; i < ids.length; ) {
      let hit = null;
      for (const lg of subs.ligs) {
        const n = lg.sub.length;
        if (n > ids.length - i) continue;
        let ok = true;
        for (let j = 0; j < n; j++) if (ids[i + j] !== lg.sub[j]) { ok = false; break; }
        if (ok) { hit = lg; break; }
      }
      if (hit) { out.push(hit.by); i += hit.sub.length; }
      else     { out.push(ids[i]); i++; }
    }
    ids.length = 0;
    Array.prototype.push.apply(ids, out);
  }

  // 2) alternativas estilísticas y demás sustituciones 1:1
  if (subs.singles.size) {
    for (let i = 0; i < ids.length; i++) {
      const to = subs.singles.get(ids[i]);
      if (to !== undefined) ids[i] = to;
    }
  }
  return ids;
}

/* Interletraje: primero GPOS (el moderno), si no la tabla «kern» antigua */
const kernCache = new Map();
function kernTables(font, family) {
  if (kernCache.has(family)) return kernCache.get(family);
  let k = null;
  try { k = font.position.getKerningTables(otScript(font, family)); } catch (e) { /* sin GPOS */ }
  kernCache.set(family, k);
  return k;
}

function kernBetween(font, family, a, b) {
  const tables = kernTables(font, family);
  try {
    if (tables && tables.length) return font.position.getKerningValue(tables, a, b) || 0;
    return font.getKerningValue(a, b) || 0;
  } catch (e) { return 0; }
}

/* Convierte una cadena en datos de trazado («d») con los contornos reales de
   la fuente, ya modelados. Es lo que necesita el plotter para cortar el vinil y
   lo que hace que el PDF sea vectorial. */
const pathCache = new Map();

NF.textToPath = function (font, text, fontSize, trackingEm, features) {
  const family = font.__nfFamily || 'sin-nombre';
  const key = family + '|' + fontSize + '|' + (trackingEm || 0) + '|' +
              (features || []).join(',') + '|' + text;
  const hit = pathCache.get(key);
  if (hit !== undefined) return hit;

  const ids = shape(font, family, text, features);
  const scale = fontSize / font.unitsPerEm;
  const track = (trackingEm || 0) * fontSize;
  const path = new window.opentype.Path();
  let x = 0;
  for (let i = 0; i < ids.length; i++) {
    const g = font.glyphs.get(ids[i]);
    if (!g) continue;
    path.extend(g.getPath(x, 0, fontSize));
    x += (g.advanceWidth || 0) * scale + track;
    if (i < ids.length - 1) x += kernBetween(font, family, ids[i], ids[i + 1]) * scale;
  }
  const d = path.toPathData(3);
  // Los lotes repiten nombres: cachear evita rehacer el contorno en cada
  // redibujo de la vista previa.
  if (pathCache.size > 4000) pathCache.clear();
  pathCache.set(key, d);
  return d;
};

/* Se llama al cambiar de familia o al cargar un archivo de fuente. */
NF.clearVectorCaches = function () {
  pathCache.clear(); subCache.clear(); kernCache.clear(); scriptCache.clear();
};

/* La fuente sin cursiva ni negra propias: el navegador las finge inclinando y
   engordando el contorno. En modo vectorial hay que hacer lo mismo o el PDF no
   se parecerá a la vista previa. */
NF.synthFor = function (font, weight, italic) {
  const os2 = (font && font.tables && font.tables.os2) || {};
  const faceItalic = !!(os2.fsSelection & 1);
  const faceWeight = os2.usWeightClass || 400;
  return {
    slant:    (italic === 'italic' && !faceItalic) ? 0.25 : 0,
    embolden: (parseInt(weight, 10) >= 600 && faceWeight < 600) ? 1 / 32 : 0,
  };
};

/* ═══════════════ 2. SVG de página ═══════════════
   Se delega en NF.buildPageSVG (app.js), el mismo que dibuja la vista previa:
   así la exportación no puede desviarse de lo que el usuario ve. */
const buildPageSVG = (rows, paper, S, mode) => NF.buildPageSVG(rows, paper, { mode: mode });

/* ═══════════════ 3. Exportar SVG ═══════════════ */

async function exportSVG() {
  const S = NF.state();
  if (!NF.pages.length) return NF.toast('No hay piezas que exportar.');

  if (NF.fontBuffers[S.family] && !NF.otFonts[S.family]) await NF.parseOpenType(S.family);
  const hasFont = !!NF.otFonts[S.family];

  if (!hasFont) {
    const go = confirm(
      'Para que el plotter corte las letras se necesitan contornos vectoriales,\n' +
      'y para eso hace falta el archivo .ttf/.otf de «' + S.family + '».\n\n' +
      'Cárgalo en el panel «Fuente» y vuelve a exportar.\n\n' +
      '¿Exportar de todos modos como texto editable?');
    if (!go) return;
  }

  const base = 'nombres-' + stamp();
  for (let i = 0; i < NF.pages.length; i++) {
    const { svg } = buildPageSVG(NF.pages[i], NF.paper, S, hasFont ? 'path' : 'text');
    const src = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg);
    download(new Blob([src], { type: 'image/svg+xml;charset=utf-8' }),
             base + (NF.pages.length > 1 ? '-p' + (i + 1) : '') + '.svg');
    await new Promise(r => setTimeout(r, 250));   // el navegador limita descargas seguidas
  }
  NF.toast(NF.pages.length + ' archivo(s) SVG ' + (hasFont ? 'vectorial(es)' : 'con texto') + ' descargado(s)');
}

/* ═══════════════ 4. Exportar PDF ═══════════════ */

async function exportPDF() {
  const S = NF.state();
  if (!NF.pages.length) return NF.toast('No hay piezas que exportar.');

  const busy = $('#busy');
  busy.classList.remove('hidden'); busy.classList.add('flex');

  try {
    if (NF.fontBuffers[S.family] && !NF.otFonts[S.family]) await NF.parseOpenType(S.family);
    const vector = !!NF.otFonts[S.family];

    if (!vector) {
      const go = confirm(
        'PDF vectorial no disponible para «' + S.family + '».\n\n' +
        'Se generará un PDF de imagen a 300 ppp (perfecto para sublimación\n' +
        'e impresión, pero no para corte por contorno).\n\n' +
        'Para PDF vectorial carga el archivo .ttf/.otf en el panel «Fuente»,\n' +
        'o usa el botón «Imprimir → Guardar como PDF».\n\n¿Continuar con el PDF de imagen?');
      if (!go) { busy.classList.add('hidden'); busy.classList.remove('flex'); return; }
    }

    await loadScript(CDN.jspdf);
    const { jsPDF } = window.jspdf;
    const paper = NF.paper;
    const doc = new jsPDF({
      unit: 'mm',
      format: [paper.w, paper.h],
      orientation: paper.w > paper.h ? 'landscape' : 'portrait',
      compress: true,
    });
    doc.setProperties({ title: 'Nombres — Atelier', creator: 'Atelier' });

    let hecho = false;

    if (vector) {
      try {
        await loadScript(CDN.svg2pdf);
        // Según la build, svg2pdf se expone como método de jsPDF, como espacio
        // de nombres o como función suelta: aceptamos las tres formas.
        const ns = window.svg2pdf;
        const fn = typeof doc.svg === 'function' ? (svg, o) => doc.svg(svg, o)
                 : typeof ns === 'function'        ? (svg, o) => ns(svg, doc, o)
                 : ns && typeof ns.svg2pdf === 'function' ? (svg, o) => ns.svg2pdf(svg, doc, o)
                 : null;
        if (!fn) throw new Error('svg2pdf no disponible');

        const holder = document.createElement('div');
        holder.style.cssText = 'position:fixed;left:-99999px;top:0;';
        document.body.appendChild(holder);
        try {
          for (let i = 0; i < NF.pages.length; i++) {
            if (i) doc.addPage([paper.w, paper.h], paper.w > paper.h ? 'landscape' : 'portrait');
            const { svg } = buildPageSVG(NF.pages[i], paper, S, 'path');
            holder.appendChild(svg);
            await fn(svg, { x: 0, y: 0, width: paper.w, height: paper.h });
            if (S.pageNum) stampPageNumber(doc, paper, i + 1, NF.pages.length);
          }
        } finally { holder.remove(); }
        hecho = 'vectorial';
      } catch (e) {
        console.warn('PDF vectorial no disponible, se rasteriza:', e.message);
      }
    }

    if (!hecho) {
      // Repliegue: PDF de imagen a 300 ppp. Si el intento vectorial dejó
      // páginas a medias, se empieza de cero.
      while (doc.getNumberOfPages() > 1) doc.deletePage(doc.getNumberOfPages());
      for (let i = 0; i < NF.pages.length; i++) {
        if (i) doc.addPage([paper.w, paper.h], paper.w > paper.h ? 'landscape' : 'portrait');
        const png = await rasterPage(NF.pages[i], paper, S, 300);
        doc.addImage(png, 'PNG', 0, 0, paper.w, paper.h, undefined, 'FAST');
        if (S.pageNum) stampPageNumber(doc, paper, i + 1, NF.pages.length);
      }
      hecho = 'de imagen 300 ppp';
    }

    doc.save('nombres-' + stamp() + '.pdf');
    NF.toast('PDF ' + hecho + ' generado');
  } catch (e) {
    console.error(e);
    NF.toast('No se pudo generar el PDF: ' + e.message + ' — usa «Imprimir».', 5000);
  } finally {
    busy.classList.add('hidden'); busy.classList.remove('flex');
  }
}

function stampPageNumber(doc, paper, i, total) {
  doc.setFontSize(7); doc.setTextColor(150);
  doc.text(i + ' / ' + total, paper.w - 6, paper.h - 5, { align: 'right' });
}

/* ── Fuente embebida para el repliegue rasterizado ──
   Una <img> con un SVG dentro está aislada: no ve las fuentes de la página, así
   que hay que meterle la tipografía dentro como data URI. */

const faceCache = Object.create(null);
let gfCSS = null;

function b64(buf) {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(out);
}

/* La hoja de estilo de Google Fonts que ya carga index.html, pedida otra vez
   (viene de la caché del navegador y admite CORS). */
function googleCSS() {
  if (gfCSS) return gfCSS;
  const link = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(l => l.href)
    .filter(h => /fonts\.googleapis\.com\/css2/.test(h))[0];
  gfCSS = link ? fetch(link).then(r => r.text()).catch(() => '') : Promise.resolve('');
  return gfCSS;
}

async function inlineFace(family) {
  if (family in faceCache) return faceCache[family];
  let css = '';
  try {
    const buf = NF.fontBuffers[family];
    if (buf) {
      css = '@font-face{font-family:"' + family + '";' +
            'src:url(data:font/ttf;base64,' + b64(buf) + ');}';
    } else {
      const sheet = await googleCSS();
      const blocks = sheet.match(/@font-face\s*\{[^}]*\}/g) || [];
      const mine = blocks.filter(b => {
        const m = b.match(/font-family:\s*['"]([^'"]+)['"]/);
        return m && m[1] === family;
      }).slice(0, 8);
      for (const block of mine) {
        const url = (block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/) || [])[1];
        if (!url) continue;
        const buf2 = await fetch(url).then(r => r.arrayBuffer());
        const type = /\.woff2/.test(url) ? 'font/woff2' : 'font/woff';
        css += block.replace(/src:[^;]+;/,
          'src:url(data:' + type + ';base64,' + b64(buf2) + ') format("' +
          (type === 'font/woff2' ? 'woff2' : 'woff') + '");');
      }
    }
  } catch (e) {
    console.warn('No se pudo embeber la fuente:', e.message);
    css = '';
  }
  faceCache[family] = css;
  return css;
}

/* Rasteriza una página a los ppp indicados dibujando EL MISMO SVG de la vista
   previa. Así el repliegue conserva variantes OpenType, orden de pintado y
   espejo, que la reconstrucción con Canvas2D perdía. */
async function rasterPage(rows, paper, S, dpi) {
  const k = dpi / 25.4;                       // px por mm
  const w = Math.round(paper.w * k), h = Math.round(paper.h * k);
  const cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  try {
    // El mismo modo que dibuja la vista previa.
    const vector = !!NF.otFonts[S.family];
    const svg = NF.buildPageSVG(rows, paper, { mode: vector ? 'path' : 'text' }).svg;
    if (!vector) {
      // Con texto vivo hay que embeber la tipografía; con contornos no hace falta.
      const face = await inlineFace(S.family);
      if (!face) throw new Error('sin fuente embebida');
      const st = document.createElementNS(SVGNS, 'style');
      st.textContent = face;
      svg.insertBefore(st, svg.firstChild);
    }

    const src = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('el SVG no se pudo rasterizar'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
    });
    ctx.drawImage(img, 0, 0, w, h);
    return cvs.toDataURL('image/png');
  } catch (e) {
    console.warn('Rasterizado del SVG no disponible, se redibuja:', e.message);
  }

  // Último recurso: redibujar con Canvas2D (pierde las variantes OpenType).
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
  ctx.save();
  if (S.mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.translate(S.margin * k, S.margin * k);
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';

  for (const r of rows) for (const p of r.items) {
    ctx.save();
    ctx.font = S.italic + ' ' + S.weight + ' ' + (p.fontSize * k) + 'px "' + S.family + '", ' + NF.FALLBACK;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (S.tracking * p.fontSize * k) + 'px';
    ctx.translate((p.x - p.bx) * k, (p.y - p.by) * k);
    // El SVG usa paint-order:stroke, o sea contorno debajo del relleno.
    if (S.strokeOn) { ctx.strokeStyle = S.stroke; ctx.lineWidth = S.strokeW * k; ctx.strokeText(p.text, 0, 0); }
    if (S.fillOn)   { ctx.fillStyle = S.fill;     ctx.fillText(p.text, 0, 0); }
    ctx.restore();
  }
  ctx.restore();
  return cvs.toDataURL('image/png');
}

/* ═══════════════ 5. Proyecto .json ═══════════════ */

function saveProject() {
  const S = NF.state();
  const data = { app: 'atelier-nombres', version: 1, state: S };
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
           'proyecto-' + stamp() + '.json');
  NF.toast('Proyecto guardado');
}

function openProject(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const d = JSON.parse(fr.result);
      if (!d.state) throw new Error('formato no reconocido');
      NF.setState(d.state);
      NF.syncUI();
      NF.render();
      NF.toast('Proyecto cargado');
    } catch (e) { NF.toast('Archivo no válido: ' + e.message); }
  };
  fr.readAsText(file);
}

/* ═══════════════ 6. Explorador de glifos ═══════════════ */

let glyphCache = [];
let glyphFilter = 'all';

/* Clasifica un glifo para los filtros del explorador.
   En fuentes como Joseph Sophia las colas y las terminaciones con corazón
   están en la zona de uso privado (U+E000–U+F8FF) o son ligaduras (a_b). */
function glyphKind(item) {
  const u = item.g.unicode;
  if (u >= 0xE000 && u <= 0xF8FF) return 'pua';
  if (/_/.test(item.name)) return 'liga';
  if (/\p{L}/u.test(item.ch)) return 'letters';
  return 'other';
}

NF.refreshGlyphs = function () {
  const S = NF.state();
  const font = NF.otFonts[S.family];
  const grid = $('#glyphGrid'), empty = $('#glyphEmpty'), info = $('#glyphInfo');
  grid.innerHTML = ''; glyphCache = [];

  if (!font) {
    empty.classList.remove('hidden');
    info.textContent = '';
    return;
  }
  empty.classList.add('hidden');
  info.textContent = (font.names.fullName ? Object.values(font.names.fullName)[0] : S.family) +
                     ' · ' + font.numGlyphs + ' glifos';

  const upm = font.unitsPerEm;
  for (let i = 0; i < font.numGlyphs; i++) {
    const g = font.glyphs.get(i);
    if (!g || g.unicode === undefined) continue;   // sin punto de código no se puede escribir
    if (g.unicode < 32) continue;
    glyphCache.push({ i, g, ch: String.fromCodePoint(g.unicode), name: g.name || '', upm });
  }
  drawGlyphs('');
};

function drawGlyphs(q) {
  const grid = $('#glyphGrid');
  grid.innerHTML = '';
  q = (q || '').toLowerCase().trim();
  let n = 0;

  for (const item of glyphCache) {
    if (glyphFilter !== 'all' && glyphKind(item) !== glyphFilter) continue;
    if (q) {
      const hex = item.g.unicode.toString(16);
      if (item.name.toLowerCase().indexOf(q) === -1 && hex.indexOf(q) === -1 && item.ch !== q) continue;
    }
    if (++n > 1200) break;

    const cell = document.createElement('button');
    cell.type = 'button'; cell.className = 'glyph-cell';
    cell.title = item.name + '  ·  U+' + item.g.unicode.toString(16).toUpperCase().padStart(4, '0');

    // Miniatura vectorial real del glifo
    const box = item.g.getBoundingBox();
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('width', 62); svg.setAttribute('height', 54);
    const w = Math.max(box.x2 - box.x1, 1), h = Math.max(box.y2 - box.y1, 1);
    const pad = item.upm * 0.08;
    svg.setAttribute('viewBox', (box.x1 - pad) + ' ' + (-box.y2 - pad) + ' ' + (w + pad * 2) + ' ' + (h + pad * 2));
    const path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', item.g.getPath(0, 0, item.upm).toPathData(2));
    path.setAttribute('transform', 'scale(1,-1)');
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
    cell.appendChild(svg);

    const lbl = document.createElement('div');
    lbl.className = 'g-lbl';
    lbl.textContent = item.name || ('U+' + item.g.unicode.toString(16).toUpperCase());
    cell.appendChild(lbl);

    cell.addEventListener('click', ev => {
      const S = NF.state();
      if (ev.shiftKey) {
        const ta = $('#txtInput');
        const a = ta.selectionStart, b = ta.selectionEnd;
        ta.value = ta.value.slice(0, a) + item.ch + ta.value.slice(b);
        ta.selectionStart = ta.selectionEnd = a + item.ch.length;
        S.text = ta.value; ta.focus();
      } else if (ev.altKey) {
        S.prefix += item.ch; $('#inpPrefix').value = S.prefix;
      } else {
        S.suffix += item.ch; $('#inpSuffix').value = S.suffix;
      }
      NF.rerender();
      NF.toast('Glifo añadido: ' + (item.name || item.ch));
    });
    grid.appendChild(cell);
  }
  if (!grid.children.length && glyphCache.length)
    grid.innerHTML = '<p class="col-span-full text-center text-[13px] py-10 opacity-60">Sin resultados.</p>';
}

/* ═══════════════ 7. Conexión de botones ═══════════════ */

$('#btnSVG').addEventListener('click', exportSVG);
$('#btnPDF').addEventListener('click', exportPDF);
$('#btnSave').addEventListener('click', saveProject);
$('#btnOpen').addEventListener('click', () => $('#fileProject').click());
$('#fileProject').addEventListener('change', e => {
  if (e.target.files[0]) openProject(e.target.files[0]);
  e.target.value = '';
});
$('#btnGlyphs').addEventListener('click', async () => {
  const S = NF.state();
  if (NF.fontBuffers[S.family] && !NF.otFonts[S.family]) await NF.parseOpenType(S.family);
  NF.refreshGlyphs();
  $('#glyphModal').classList.remove('hidden');
});
$('#glyphSearch').addEventListener('input', e => drawGlyphs(e.target.value));

$$('#glyphFilters .chip').forEach(b => b.addEventListener('click', () => {
  glyphFilter = b.dataset.gf;
  $$('#glyphFilters .chip').forEach(x => x.classList.toggle('on', x === b));
  drawGlyphs($('#glyphSearch').value);
}));

})();
