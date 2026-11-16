// PROTOTYPE - NOT FOR PRODUCTION
// Abovea: every figure, prop and icon, drawn in code. Soft painterly low poly, flat shaded,
// no outlines. Pure builders: each returns a THREE.Group; nothing here reads game state.
'use strict';

const PAL = {
  grass: '#a6d27c', grassDark: '#84b466', dirt: '#b98c6b', rock: '#9d8fa8', rockDeep: '#7a6f92',
  walls: ['#f6e7d2', '#f8dccb', '#ece3f3', '#f4ecd4', '#e8efe0'],
  roofs: ['#d9785a', '#e9b44c', '#c96f78', '#7f9fd6', '#9c80c8', '#6fae9a'],
  wood: '#8a5f45', woodDark: '#5e4033', window: '#ffd98a', cream: '#fff6e8',
  leaf: ['#86b86a', '#9fcb7c', '#6fa35e', '#a8cf86'], blossom: ['#f4b6c8', '#f7cfd9'],
  flower: ['#f49ab0', '#ffd36e', '#c9a7f2', '#ffffff', '#ff9f7a', '#8fc7f2'],
  skin: '#ffe6d3', cloth: ['#e98c74', '#7fa7dc', '#f0c35a', '#a88fd8', '#79b99b', '#e9849f', '#f2a65a'],
  stone: '#f1ece6', stoneShade: '#d9d1e0', gold: '#f5c76b', straw: '#dcb56d', ochre: '#d39a62',
  wool: '#fbf5ee', faceDark: '#5b4a6b',
};

const _mats = new Map();
/** A cached flat-shaded Lambert material for a colour (optional emissive, optional texture kind). */
function M(color, emissive, ei, tex) {
  const k = color + '|' + (emissive || '') + '|' + (ei || 0) + '|' + (tex || '');
  if (!_mats.has(k)) {
    const m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = ei || 1; }
    if (tex) m.map = ptex(tex);
    _mats.set(k, m);
  }
  return _mats.get(k);
}
/** A textured material: the colour tints a hand-drawn texture (see ptex). */
const T = (color, tex) => M(color, null, 0, tex);

const _tex = {};
/**
 * Small hand-drawn textures, white with soft darker and lighter marks, so a material's colour
 * tints them: plaster, roof shingles, wood grain, stone bricks, grass, dirt, rock strata, bark,
 * leaves and thatch. Drawn once each, repeated across surfaces.
 */
function ptex(kind) {
  if (_tex[kind]) return _tex[kind];
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), R = mrand(kind.length * 977 + kind.charCodeAt(0));
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  const ink = (a, light) => light ? `rgba(255,255,255,${a})` : `rgba(40,30,60,${a})`;
  const speck = (n, a, sz) => { for (let i = 0; i < n; i++) { g.fillStyle = ink(a * R(), R() < 0.45); g.fillRect(R() * S, R() * S, sz * (0.5 + R()), sz * (0.5 + R())); } };
  const line = (x0, y0, x1, y1, w, st) => { g.strokeStyle = st; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  switch (kind) {
    case 'plaster':
      speck(1200, 0.07, 2);
      for (let i = 0; i < 10; i++) { g.fillStyle = ink(0.035, R() < 0.5); g.beginPath(); g.ellipse(R() * S, R() * S, 8 + R() * 18, 5 + R() * 10, R() * 3, 0, 7); g.fill(); }
      break;
    case 'shingle':
      for (let r = 0; r < 8; r++) {
        const y = r * 16, off = (r % 2) * 10;
        const gr = g.createLinearGradient(0, y, 0, y + 16); gr.addColorStop(0, ink(0.0, true)); gr.addColorStop(1, ink(0.18)); g.fillStyle = gr; g.fillRect(0, y, S, 16);
        line(0, y + 15.5, S, y + 15.5, 2, ink(0.3)); line(0, y + 1, S, y + 1, 1, ink(0.25, true));
        for (let x = -off; x < S; x += 20 + (r % 3)) { line(x, y, x, y + 16, 1.2, ink(0.22)); g.fillStyle = ink(0.06 * R(), R() < 0.5); g.fillRect(x + 1, y + 1, 18, 14); }
      }
      speck(300, 0.05, 1.5);
      break;
    case 'wood':
      for (let k = 0; k < 4; k++) {
        const x = k * 32; g.fillStyle = ink(0.07 * R(), R() < 0.5); g.fillRect(x, 0, 32, S);
        line(x + 0.5, 0, x + 0.5, S, 1.5, ink(0.35));
        for (let i = 0; i < 6; i++) { const gx = x + 4 + R() * 24; g.strokeStyle = ink(0.09); g.lineWidth = 1; g.beginPath(); g.moveTo(gx, 0); for (let y = 0; y <= S; y += 8) g.lineTo(gx + Math.sin(y * 0.08 + i) * 2, y); g.stroke(); }
        if (R() < 0.6) { g.fillStyle = ink(0.18); g.beginPath(); g.ellipse(x + 8 + R() * 16, R() * S, 2.5, 4, 0, 0, 7); g.fill(); }
      }
      break;
    case 'stone':
      for (let r = 0; r < 8; r++) {
        const y = r * 16, off = (r % 2) * 14;
        for (let x = -off; x < S; x += 28) { g.fillStyle = ink(0.1 * R(), R() < 0.5); g.fillRect(x + 1, y + 1, 26, 14); }
        line(0, y + 0.5, S, y + 0.5, 2, ink(0.28, true));
        for (let x = -off; x < S; x += 28) line(x + 0.5, y, x + 0.5, y + 16, 2, ink(0.28, true));
      }
      speck(400, 0.08, 1.5);
      break;
    case 'grass':
      for (let i = 0; i < 26; i++) { g.fillStyle = ink(0.05, R() < 0.5); g.beginPath(); g.ellipse(R() * S, R() * S, 10 + R() * 20, 6 + R() * 12, R() * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 700; i++) { const x = R() * S, y = R() * S; line(x, y, x + (R() - 0.5) * 3, y - 3 - R() * 4, 1, ink(0.08 + R() * 0.08, R() < 0.4)); }
      break;
    case 'dirt':
      for (let y = 0; y < S; y += 6 + R() * 8) line(0, y, S, y + (R() - 0.5) * 6, 1 + R() * 2, ink(0.08, R() < 0.3));
      speck(900, 0.12, 2);
      break;
    case 'rock':
      for (let y = 0; y < S; y += 5 + R() * 10) { g.fillStyle = ink(0.07, R() < 0.4); g.fillRect(0, y, S, 2 + R() * 5); }
      for (let i = 0; i < 18; i++) { const x = R() * S, y = R() * S; line(x, y, x + (R() - 0.5) * 20, y + R() * 14, 1, ink(0.2)); }
      speck(700, 0.1, 2);
      break;
    case 'bark':
      for (let i = 0; i < 40; i++) { const x = R() * S; g.strokeStyle = ink(0.12 + R() * 0.12, R() < 0.25); g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= S; y += 10) g.lineTo(x + Math.sin(y * 0.05 + i) * 3, y); g.stroke(); }
      break;
    case 'leaf':
      for (let i = 0; i < 90; i++) { g.fillStyle = ink(0.06 + R() * 0.08, R() < 0.5); g.beginPath(); g.ellipse(R() * S, R() * S, 3 + R() * 7, 2 + R() * 4, R() * 3, 0, 7); g.fill(); }
      break;
    case 'straw':
      for (let i = 0; i < 260; i++) { const x = R() * S, y = R() * S; line(x, y, x + (R() - 0.5) * 3, y + 8 + R() * 12, 1, ink(0.1 + R() * 0.12, R() < 0.4)); }
      for (let y = 0; y < S; y += 21) line(0, y, S, y, 2, ink(0.15));
      break;
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (kind === 'grass' || kind === 'dirt') t.repeat.set(0.5, 0.5);
  _tex[kind] = t; return t;
}
/** A mesh at a position, casting and receiving shadows. */
function mk(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? M(mat) : mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
const _smats = new Map();
/** A cached smooth-shaded Lambert material: for round, soft things (sky-folk, critters). */
function MS(color, emissive, ei) {
  const k = color + '|' + (emissive || '') + '|' + (ei || 0);
  if (!_smats.has(k)) { const m = new THREE.MeshLambertMaterial({ color }); if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = ei || 1; } _smats.set(k, m); }
  return _smats.get(k);
}
function grp(...kids) { const g = new THREE.Group(); kids.forEach(k => k && g.add(k)); return g; }
/** Tiny seeded random for model variety (never the gameplay rng). */
function mrand(s) { let x = (((Math.floor(s) * 9301 + 49297) % 233280) + 233280) % 233280; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; } // seeds may be negative (cells west or north of centre): keep x in range
function pick(a, r) { return a[Math.floor(r() * a.length) % a.length]; }

let _glowTex;
/** Radial glow texture for halos, motes and the sun. */
function glowTex() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.6)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _glowTex = new THREE.CanvasTexture(c); return _glowTex;
}
/** An additive glow sprite. */
function glow(color, size, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true,
    opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); return s;
}

// ---- Island --------------------------------------------------------------------------------
/** Edge radius of an island at angle a: the same function decides which cells are land. */
function islandRadius(isl, a) {
  return isl.r * (1 + (isl.k0 || 0) * Math.sin(2 * a + isl.ph * 1.7) + (isl.k1 ?? 0.1) * Math.sin(3 * a + isl.ph) + (isl.k2 ?? 0.06) * Math.sin(5 * a + isl.ph * 2.3) + 0.03 * Math.sin(9 * a + isl.ph));
}
/** Half-width of the gap a river cuts in the rim, and how far it reaches in from the edge. */
const NOTCH_W = 0.64, NOTCH_D = 0.75; // the slab's 0.12 bevel eats into the gap, so it is cut wider than the water
/**
 * A floating island: grass slab on top, a rocky root-hung underside tapering into the clouds.
 * notches: where rivers leave ({x, z} on the rim, d the flow), each cut into the slab as a
 * round-bottomed U gap, so no grass lies over the water as it pours off.
 */
let _vineMat, _budMat;
/** Shared by every island: the hanging vines, leaves, grass fringe and roots (lit, both sides). */
const islandVineMat = () => _vineMat || (_vineMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }));
/** Shared by every island: buds and crystals that glow on their own. */
const islandBudMat = () => _budMat || (_budMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
function makeIsland(isl, notches = []) {
  const g = new THREE.Group(), N = 56, pts = [], angs = [];
  for (let k = 0; k < N; k++) angs.push(k / N * Math.PI * 2);
  for (const n of notches) { const th = Math.atan2(n.z, n.x), span = 2.2 * NOTCH_W / Math.hypot(n.x, n.z); for (let s = -16; s <= 16; s++) angs.push(((th + s / 16 * span) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)); }
  angs.sort((a, b) => a - b);
  for (let k = 0; k < angs.length; k++) {
    const a = angs[k]; if (k && a - angs[k - 1] < 1e-4) continue;
    const r = islandRadius(isl, a) + 0.3; let x = Math.cos(a) * r, z = Math.sin(a) * r;
    for (const n of notches) { // pull the outline back along the flow inside the gap
      const ex = x - n.x, ez = z - n.z, along = ex * n.d[0] + ez * n.d[1], across = Math.abs(-ex * n.d[1] + ez * n.d[0]);
      if (across >= NOTCH_W) continue;
      const want = -NOTCH_D * Math.pow(1 - Math.pow(across / NOTCH_W, 3), 0.5);
      if (along > want) { x -= n.d[0] * (along - want); z -= n.d[1] * (along - want); }
    }
    pts.push(new THREE.Vector2(x, z));
  }
  // the grass top sits a hair inside the outline, so its edge hides under the rim's rolled lip
  const shape = new THREE.Shape(pts.map((p, n) => { const a = pts[(n - 1 + pts.length) % pts.length], b = pts[(n + 1) % pts.length]; let nx = b.y - a.y, nz = a.x - b.x; const l = Math.hypot(nx, nz) || 1; return new THREE.Vector2(p.x - nx / l * 0.06, p.y - nz / l * 0.06); }));
  const top = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false, curveSegments: 4 }); // the grass top (its sides hide behind the rim strip)
  top.rotateX(Math.PI / 2);
  const slab = new THREE.Mesh(top, [T(isl.grass || PAL.grass, 'grass'), T(PAL.grassDark, 'dirt')]);
  slab.receiveShadow = true; slab.castShadow = true; g.add(slab);
  // Underside: a rocky root in terraces, banded in strata from earth through warm clay to lilac
  // rock, narrowing to a crystal-tipped point; stalactites, glowing crystals, curling roots and
  // flowering vines hang from it, and a few stones float beneath (userData.floaters bob).
  const R = mrand(isl.seed), rings = 14, depth = isl.r * 1.2 + 1.4, pos = [], col = [], idx = [], uv = [], ph = R() * 6;
  const tipX = (R() - 0.5) * isl.r * 0.25, tipZ = (R() - 0.5) * isl.r * 0.25;
  // strata: dark earth under the lip, peach clay, rose, then soft lilac rock towards the tip
  const bands = ['#8a6a5a', '#b98c6b', '#d4a487', '#c9a3b8', '#b3a6c9', '#9d8fc0', '#8679ad', '#7a6fa6'].map(h => new THREE.Color(h)), c = new THREE.Color();
  const moss = new THREE.Color('#9cbf86'), lipMoss = new THREE.Color('#7f9a6a'), tint = new THREE.Color('#c9b4ff');
  /** Radius of the underside at depth fraction f (0 top, 1 tip) and angle a: a full belly rounding into a bowl, three soft ledges. */
  const radAt = (f, a) => {
    const terrace = 1 - 0.05 * Math.max(0, Math.sin(f * Math.PI * 3.5)), wave = 1 + (0.1 * Math.sin(a * 3 + ph + f * 4) + 0.05 * Math.sin(a * 7 + f * 9 + ph * 2)) * (1 - 0.6 * f);
    return (islandRadius(isl, a) + 0.3) * Math.pow(Math.max(0, Math.cos(f * Math.PI / 2)), 0.8) * terrace * (f > 0 ? wave : 1);
  };
  for (let k = 0; k <= rings; k++) {
    const f = k / rings, y = -0.55 - f * depth, ter = Math.max(0, Math.sin(f * Math.PI * 3.5));
    for (let n = 0; n < N; n++) {
      const a = n / N * Math.PI * 2, r = radAt(f, a), sx = tipX * f * f, sz = tipZ * f * f;
      pos.push(Math.cos(a) * r + sx, y + (k && k < rings ? Math.sin(a * 5 + k) * 0.08 : 0), Math.sin(a) * r + sz);
      const bf = Math.max(0, Math.min(bands.length - 1.001, f * (bands.length - 1) + Math.sin(a * 2 + k) * 0.15)), b0 = Math.floor(bf);
      c.copy(bands[b0]).lerp(bands[b0 + 1], bf - b0); if (k % 2) c.multiplyScalar(0.96); // alternate strata a shade darker
      if (ter > 0.8 && f < 0.65) c.lerp(moss, 0.5 * (ter - 0.8) / 0.2 * (0.5 + 0.5 * Math.sin(a * 5 + ph))); // moss in patches on the ledges
      if (k === 0) c.lerp(lipMoss, 0.3); // the grass creeping over the edge
      c.lerp(tint, 0.3 * sstep(0.7, 1, f)); // the tip crystals' light on the rock
      col.push(c.r, c.g, c.b); uv.push(n / N * isl.r * 2.5, f * depth * 0.6);
    }
  }
  for (let k = 0; k < rings; k++) for (let n = 0; n < N; n++) {
    const a = k * N + n, b = k * N + (n + 1) % N, d = (k + 1) * N + n, e = (k + 1) * N + (n + 1) % N;
    idx.push(a, b, d, b, e, d); // wound to face outward: seen from outside, the near wall is drawn (the other way round it was culled, and the island looked hollow)
  }
  const ug = new THREE.BufferGeometry();
  ug.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  ug.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); ug.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  ug.setIndex(idx); ug.computeVertexNormals();
  const under = new THREE.Mesh(ug, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, map: ptex('rock') }));
  under.castShadow = true; g.add(under);
  const onUnder = (f, a, inset = 0.1) => { const r = radAt(f, a) - inset; return [Math.cos(a) * r + tipX * f * f, -0.55 - f * depth, Math.sin(a) * r + tipZ * f * f]; };
  // Everything that hangs from the rock goes into two merged meshes: vines, leaves, grass fringe,
  // roots and blunt stalactites in one (lit), glowing buds and crystals in the other (unlit).
  const V = { p: [], c: [] }, B = { p: [], c: [] }, o = new THREE.Object3D(), cc = new THREE.Color();
  const put = (into, geo, hex) => { // a geometry placed by o, in one colour
    const g2 = geo.index ? geo.toNonIndexed() : geo.clone(); o.updateMatrix(); g2.applyMatrix4(o.matrix);
    const p = g2.attributes.position.array; cc.set(hex);
    for (let q = 0; q < p.length; q += 3) { into.p.push(p[q], p[q + 1], p[q + 2]); into.c.push(cc.r, cc.g, cc.b); }
  };
  const tri = (into, hex, ...v) => { cc.set(hex); for (const w of v) { into.p.push(w.x, w.y, w.z); into.c.push(cc.r, cc.g, cc.b); } };
  const place = (x, y, z) => { o.position.set(x, y, z); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); };
  const nearNotch = a => notches.some(n => { const d = Math.abs(((Math.atan2(n.z, n.x) - a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI); return d < 0.35; });
  // leafy vines hugging the rock, then hanging free, with glowing buds; a few bare roots among them
  const leafCols = ['#7fae6e', '#97c283', '#6a9a63', '#a9cf92'], budCols = ['#ffd6ec', '#fff1b8', '#d9c8ff'];
  for (let k = 0, n = 10 + 2 * isl.r; k < n; k++) {
    const a = k / n * Math.PI * 2 + (R() - 0.5) * 0.25; if (nearNotch(a)) continue;
    const root = k % Math.ceil(n / 3) === 1, f0 = R() * 0.04, L = 0.25 + R() * 0.3, pts = [];
    for (let t = 0; t <= 4; t++) { const [x, y, z] = onUnder(f0 + t / 4 * L, a + Math.sin(t * 0.9 + k) * 0.08, -0.06); pts.push(new THREE.Vector3(x, y, z)); }
    const end = pts[4], drop = 0.4 + R() * 0.6;
    for (let t = 1; t <= 2; t++) pts.push(new THREE.Vector3(end.x + (R() - 0.5) * 0.2, end.y - drop * t / 2, end.z + (R() - 0.5) * 0.2));
    const curve = new THREE.CatmullRomCurve3(pts);
    place(0, 0, 0); put(V, new THREE.TubeGeometry(curve, 12, root ? 0.035 : 0.028, 3, false), root ? '#6b4c3e' : '#5f8f5a');
    if (root) continue;
    const m = Math.max(3, Math.floor(curve.getLength() / 0.14)), sp = curve.getSpacedPoints(m);
    for (let q = 1; q < sp.length; q++) {
      const p = sp[q], tg = curve.getTangentAt(q / m), out = new THREE.Vector3(p.x - tipX, 0, p.z - tipZ).normalize();
      const side = new THREE.Vector3().crossVectors(tg, out).normalize(), th = (q % 2 ? 1 : -1) * 0.7;
      const ax = tg.clone().multiplyScalar(Math.cos(th)).addScaledVector(side, Math.sin(th)).normalize(), w = new THREE.Vector3().crossVectors(ax, out).normalize();
      const A = p.clone(), C = p.clone().addScaledVector(ax, 0.2).addScaledVector(out, 0.015);
      const Bv = p.clone().addScaledVector(ax, 0.1).addScaledVector(w, 0.06).addScaledVector(out, 0.03), D = p.clone().addScaledVector(ax, 0.1).addScaledVector(w, -0.06).addScaledVector(out, 0.03);
      const lc = R() < 0.15 ? '#b7c4a6' : pick(leafCols, R); tri(V, lc, A, Bv, C); tri(V, lc, A, C, D);
      if (q % 3 === 0) { place(C.x, C.y, C.z); put(B, new THREE.OctahedronGeometry(0.035, 0), pick(budCols, R)); }
    }
    place(end.x, end.y - drop, end.z); o.position.copy(pts[6]); put(B, new THREE.OctahedronGeometry(0.05, 0), pick(budCols, R)); // a bud at the strand's end
  }
  // a few blunt stalactites under the ledges
  for (let k = 0; k < 4 + isl.r * 0.4; k++) {
    const f = 0.2 + R() * 0.6, a = R() * Math.PI * 2, [x, y, z] = onUnder(f, a, 0.18), h = 0.35 + R() * 0.35;
    const bi = Math.min(bands.length - 1, Math.floor(f * (bands.length - 1))); c.copy(bands[bi]).multiplyScalar(0.9);
    place(x, y - h / 2 + 0.08, z); o.rotation.y = R() * 3; put(V, new THREE.CylinderGeometry(0.15, 0.04, h, 5), c);
  }
  // glowing crystals poking out of the rock, and a cluster at the tip
  const crys = ['#c9b4ff', '#9fe8f0', '#ffc9e0'];
  for (let k = 0; k < 5 + isl.r * 0.6; k++) {
    const f = 0.25 + R() * 0.6, a = R() * Math.PI * 2, [x, y, z] = onUnder(f, a, 0.02);
    place(x, y, z); o.scale.set(1, 2, 1); o.lookAt(x * 3, y - 1, z * 3); o.rotateX(Math.PI / 2); put(B, new THREE.OctahedronGeometry(0.1 + R() * 0.1, 0), pick(crys, R));
  }
  const tipY = -0.55 - depth;
  for (let k = 0; k < 5; k++) { place(tipX + (R() - 0.5) * 0.35, tipY - 0.1 - R() * 0.3, tipZ + (R() - 0.5) * 0.35); o.scale.set(1, 2.4, 1); o.rotation.set((R() - 0.5) * 0.6, R() * 3, (R() - 0.5) * 0.6); put(B, new THREE.OctahedronGeometry(0.16 + R() * 0.14, 0), pick(crys, R)); }
  const tipGlow = glow('#d6c2ff', 3 + isl.r * 0.3, 0.55); tipGlow.position.set(tipX, tipY - 0.3, tipZ); g.add(tipGlow);
  // stones floating beneath the island
  const floaters = [];
  for (let k = 0; k < 3 + Math.floor(isl.r / 2); k++) {
    const a = R() * Math.PI * 2, r = isl.r * (0.4 + R() * 0.6), st = mk(new THREE.DodecahedronGeometry(0.25 + R() * 0.3, 0), T(pick(['#9d8fa8', '#a99bbf'], R), 'rock'), Math.cos(a) * r, tipY * (0.45 + R() * 0.35), Math.sin(a) * r);
    st.scale.y = 0.7; const cap = mk(new THREE.SphereGeometry(0.22, 8, 6), MS('#86b86a'), 0, 0.16, 0); cap.scale.set(1.1, 0.35, 1.1); st.add(cap);
    st.userData.y0 = st.position.y; st.userData.ph = R() * 6; g.add(st); floaters.push(st);
  }
  g.userData.floaters = floaters;
  // Grass along the rim, outside the build cells (rocks are pieces now, so they can be tidied).
  for (let k = 0; k < 14; k++) {
    const a = R() * Math.PI * 2, rr = islandRadius(isl, a) + 0.05;
    if (notches.some(n => Math.hypot(Math.cos(a) * rr - n.x, Math.sin(a) * rr - n.z) < 1)) continue; // never in a river's gap
    place(Math.cos(a) * rr, 0, Math.sin(a) * rr); o.scale.setScalar(0.9 + R() * 0.5); o.rotation.y = R() * 6; put(V, grassClumpGeo(), '#86b86a');
  }
  islandRim(isl, pts, ph, R, { V, B, o, cc, put, place, nearNotch });
  for (const [P, mat] of [[V, islandVineMat()], [B, islandBudMat()]]) {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P.p, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(P.c, 3)); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = false; g.add(mesh);
  }
  return g;
}

/**
 * The island's edge: a soft grassy lip rolling over a band of earth and clay strata (following the
 * outline, river gaps too), roots and tufts poking out, then the island's own edge style:
 * the home island's cosy flowers, pebbles and mushrooms; the mossy island's moss pillows spilling
 * over, roots and lichen; the Wind-folk's island's carved posts with ropes, pennants, feathers and
 * glyph stones; the meadow's wildflowers, tall grass and seed puffs; the starry spire's pale lip,
 * crystals and star-moss. Everything goes into the island's merged meshes (k.V lit, k.B glowing).
 */
function islandRim(isl, pts, ph, R, k) {
  const { V, B, o, cc, put, place, nearNotch } = k, TAU = Math.PI * 2;
  const style = ['hearth', 'moss', 'wind', 'meadow', 'star', 'meadow', 'moss', 'meadow', 'wind'][isl.id] || ({ normal: 'meadow', epic: 'wind', legendary: 'star' })[isl.rarity] || 'plain';
  // the rim strip: seven rows from the lip down to just inside the rock
  const M2 = pts.length, rows = [];
  for (let n = 0; n < M2; n++) {
    const p = pts[n], pp = pts[(n - 1 + M2) % M2], pn = pts[(n + 1) % M2];
    let nx = pn.y - pp.y, nz = -(pn.x - pp.x); const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const a = Math.atan2(p.y, p.x), w = 0.04 * Math.sin(a * 5 + ph) + 0.025 * Math.sin(a * 11 + ph * 2), dip = 0.035 * (0.5 + 0.5 * Math.sin(a * 3 + ph * 1.7));
    rows.push([[-0.1, 0.025], [0.04 + w, -0.01 - dip], [0.07 + w, -0.09 - dip], [-0.02 + w * 0.5, -0.15 - dip], [0.01 + w * 0.6, -0.27 + 0.03 * Math.sin(a * 7)], [w * 0.4, -0.41 + 0.04 * Math.sin(a * 4 + ph)], [-0.01, -0.58]]
      .map(([dr, y]) => [p.x + nx * dr, y, p.y + nz * dr]));
  }
  const rimCols = [isl.grass || PAL.grass, '#8fbd78', '#6f9a5e', '#7a5e4f', '#8a6a5a', '#b98c6b', '#c09279'].map(h => new THREE.Color(h));
  if (style === 'star') for (let r = 0; r < 3; r++) rimCols[r].lerp(new THREE.Color('#d9d3e8'), 0.35); // a pale stone lip
  const pv = (n, r) => { const q = rows[n][r]; V.p.push(q[0], q[1], q[2]); cc.copy(rimCols[r]); if (r >= 4 && r <= 5 && n % 3 === 0) cc.multiplyScalar(0.92); V.c.push(cc.r, cc.g, cc.b); };
  for (let n = 0; n < M2; n++) { const n2 = (n + 1) % M2; for (let r = 0; r < 6; r++) { pv(n, r); pv(n2, r); pv(n, r + 1); pv(n2, r); pv(n2, r + 1); pv(n, r + 1); } }
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  /** A blade from base along dir (unit), len long, w wide across side (unit), blunt at the tip. */
  const blade = (into, hex, base, dir, len, w, side) => {
    const bl = base.clone().addScaledVector(side, -w / 2), br = base.clone().addScaledVector(side, w / 2), tip = base.clone().addScaledVector(dir, len);
    const tl = tip.clone().addScaledVector(side, -w * 0.2), tr = tip.clone().addScaledVector(side, w * 0.2);
    cc.set(hex); for (const v of [bl, br, tr, bl, tr, tl]) { into.p.push(v.x, v.y, v.z); into.c.push(cc.r, cc.g, cc.b); }
  };
  const at = (a, out) => { const rr = islandRadius(isl, a) + out, ca = Math.cos(a), sa = Math.sin(a); return { x: ca * rr, z: sa * rr, ca, sa, tan: V3(-sa, 0, ca), out: V3(ca, 0, sa) }; };
  /** Grows what one decoration just added k times about its own middle (the sizes above are drawn small; they read at the island's scale this big). */
  const grow = (v0, b0, k) => {
    if (k === 1) return; let sx = 0, sz = 0, n = 0;
    for (const [A, i0] of [[V.p, v0], [B.p, b0]]) for (let i = i0; i < A.length; i += 3) { sx += A[i]; sz += A[i + 2]; n++; }
    if (!n) return; sx /= n; sz /= n;
    for (const [A, i0] of [[V.p, v0], [B.p, b0]]) for (let i = i0; i < A.length; i += 3) { A[i] = sx + (A[i] - sx) * k; A[i + 1] *= k; A[i + 2] = sz + (A[i + 2] - sz) * k; }
  };
  const DECOR = 3;
  const each = (n, fn, k = DECOR) => { for (let q = 0; q < n; q++) { const a = q / n * TAU + (R() - 0.5) * 0.3; if (nearNotch(a)) continue; const v0 = V.p.length, b0 = B.p.length; fn(a, q); grow(v0, b0, k); } };
  // roots poking out of the earth band, and tufts hanging over the lip
  for (let a = R() * 0.5; a < TAU; a += 0.45 + R() * 0.1) {
    if (nearNotch(a)) continue; const s = at(a, 0.3);
    place(0, 0, 0); put(V, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(s.x + s.ca * 0.01, -0.27, s.z + s.sa * 0.01), V3(s.x + s.ca * 0.07, -0.36, s.z + s.sa * 0.07), V3(s.x + s.ca * 0.03, -0.47, s.z + s.sa * 0.03)]), 4, 0.018, 3, false), '#6b4c3e');
  }
  for (let a = R() * 0.35; a < TAU; a += 0.3 + R() * 0.1) {
    if (nearNotch(a)) continue; const s = at(a, 0.37);
    for (let b = -1; b <= 1; b++) { const sp = b * 0.4; blade(V, R() < 0.5 ? '#86b86a' : '#a6d27c', V3(s.x + s.tan.x * b * 0.03, -0.08, s.z + s.tan.z * b * 0.03), V3(s.ca * 0.3 + s.tan.x * Math.sin(sp), -1, s.sa * 0.3 + s.tan.z * Math.sin(sp)).normalize(), 0.1 + R() * 0.06, 0.035, s.tan); }
  }
  // the island's own decorations, in the free band just outside the build cells
  const UP = V3(0, 1, 0);
  const tuft = (x, z) => { place(x, 0.02, z); o.scale.set(1, 0.6, 1); put(V, new THREE.SphereGeometry(0.05, 6, 4), '#7fae6e'); for (let b = 0; b < 3; b++) { place(x + (R() - 0.5) * 0.08, 0.06 + R() * 0.02, z + (R() - 0.5) * 0.08); put(V, new THREE.IcosahedronGeometry(0.025, 0), pick(['#ffb3c7', '#ffd59e', '#c9b4ff'], R)); } };
  const pebble = (x, z, cols) => { place(x, 0.015, z); o.scale.set(1, 0.55, 1); o.rotation.y = R() * 3; put(V, new THREE.IcosahedronGeometry(0.06 + R() * 0.03, 1), pick(cols, R)); };
  if (style === 'hearth' || style === 'plain') {
    each(style === 'hearth' ? 34 : 16, a => { const s = at(a, 0.08 + R() * 0.18); tuft(s.x, s.z); });
    each(14, a => { const s = at(a, 0.1 + R() * 0.18); pebble(s.x, s.z, ['#cbbfd6', '#b3a6c9']); });
    if (style === 'hearth') each(6, a => { const s = at(a, 0.16);
      for (let m = 0; m < 3; m++) {
        const x = s.x + s.tan.x * (m - 1) * 0.09 + (R() - 0.5) * 0.03, z = s.z + s.tan.z * (m - 1) * 0.09 + (R() - 0.5) * 0.03, sc = 0.7 + R() * 0.5;
        place(x, 0.035 * sc, z); o.scale.setScalar(sc); put(V, new THREE.CylinderGeometry(0.018, 0.022, 0.07, 6), '#f3e6d6');
        place(x, 0.065 * sc, z); o.scale.setScalar(sc); put(V, new THREE.SphereGeometry(0.05, 8, 4, 0, TAU, 0, Math.PI / 2), '#e88f8f');
        for (let d = 0; d < 3; d++) { const da = d / 3 * TAU + R(); place(x + Math.cos(da) * 0.025 * sc, 0.105 * sc, z + Math.sin(da) * 0.025 * sc); o.scale.setScalar(sc); put(V, new THREE.SphereGeometry(0.009, 5, 3), '#fff4e8'); }
      } });
  } else if (style === 'moss') {
    each(22, a => { const s = at(a, 0.28), r = 0.14 + R() * 0.08; place(s.x, -0.02, s.z); o.rotation.y = -a; o.scale.set(1, 0.45, 1.3); put(V, new THREE.SphereGeometry(r, 7, 5), pick(['#8fb87a', '#a6c98c', '#7a9f6a'], R)); }, 2);
    each(6, a => { const s = at(a, 0.3); place(0, 0, 0); put(V, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(s.x, -0.27, s.z), V3(s.x + s.ca * 0.14, -0.06, s.z + s.sa * 0.14), V3(s.x - s.ca * 0.1, 0.03, s.z - s.sa * 0.1)]), 8, 0.035, 5, false), '#6b4c3e'); }, 1);
    each(12, a => { const s = at(a, 0.12 + R() * 0.12); place(s.x, 0.006, s.z); put(V, new THREE.CylinderGeometry(0.04, 0.04, 0.01, 8), '#d8e3b0'); }, 1.8);
  } else if (style === 'wind') {
    each(4, a => { // two carved posts with a rope and pennants between them, each post standing on the edge itself
      const S = 2.2, a2 = a + 1.4 / islandRadius(isl, a); if (nearNotch(a2) || nearNotch((a + a2) / 2)) return; // both ends on ground, never over a river gap
      const s1 = at(a, 0.14), s2 = at(a2, 0.14);
      for (const s of [s1, s2]) { place(s.x, 0.19 * S, s.z); o.scale.setScalar(S); put(V, new THREE.CylinderGeometry(0.03, 0.035, 0.38, 6), '#7a5a48'); place(s.x, 0.4 * S, s.z); o.scale.setScalar(S); put(V, new THREE.IcosahedronGeometry(0.045, 1), '#a8826a'); }
      const A = V3(s1.x, 0.34 * S, s1.z), C = V3(s2.x, 0.34 * S, s2.z), mid = A.clone().add(C).multiplyScalar(0.5); mid.y -= 0.06 * S;
      const rope = new THREE.CatmullRomCurve3([A, mid, C]); place(0, 0, 0); put(V, new THREE.TubeGeometry(rope, 8, 0.008 * S, 3, false), '#d9c3a0');
      const dir = C.clone().sub(A).normalize(); let pc = 0;
      for (const t of [0.3, 0.5, 0.7]) { const p = rope.getPoint(t), hex = ['#e7a6b8', '#9fc8e8', '#f2d38a'][pc++ % 3]; cc.set(hex); for (const v of [p, p.clone().addScaledVector(dir, 0.08 * S), p.clone().addScaledVector(dir, 0.04 * S).add(V3(0, -0.12 * S, 0))]) { V.p.push(v.x, v.y, v.z); V.c.push(cc.r, cc.g, cc.b); } }
    }, 1); // sized in place: growing the pair about its middle pushed the posts off the curved edge
    each(8, a => { const s = at(a, 0.1 + R() * 0.15), ax = R() * TAU, ad = V3(Math.cos(ax), 0, Math.sin(ax)), sd = V3(-ad.z, 0, ad.x), c0 = V3(s.x, 0.012, s.z);
      const P0 = c0.clone().addScaledVector(ad, -0.07), P1 = c0.clone().addScaledVector(sd, 0.015), P2 = c0.clone().addScaledVector(ad, 0.07), P3 = c0.clone().addScaledVector(sd, -0.015);
      cc.set('#f6efe6'); for (const v of [P0, P1, P2, P0, P2, P3]) { V.p.push(v.x, v.y, v.z); V.c.push(cc.r, cc.g, cc.b); } });
    each(5, a => { const s = at(a, 0.16); place(s.x, 0.09, s.z); o.scale.set(1, 1.3, 1); o.rotation.y = R() * 3; put(V, new THREE.IcosahedronGeometry(0.08, 1), '#b3a6c9');
      place(s.x + s.ca * 0.075, 0.11, s.z + s.sa * 0.075); o.rotation.set(0, -a, 0); o.rotateZ(Math.PI / 2); put(B, new THREE.CylinderGeometry(0.025, 0.025, 0.006, 8), '#bfe9ff'); });
  } else if (style === 'meadow') {
    const bloomCols = ['#ffd6ec', '#fff1b8', '#d9c8ff', '#ffb48f', '#bfe0ff'];
    each(44, a => { const s = at(a, 0.07 + R() * 0.2);
      for (let b = 0; b < 2 + (R() < 0.5 ? 1 : 0); b++) { const x = s.x + (R() - 0.5) * 0.08, z = s.z + (R() - 0.5) * 0.08, h = 0.09 + R() * 0.05; blade(V, '#7fae6e', V3(x, 0, z), UP, h, 0.012, s.tan); place(x, h, z); put(V, new THREE.IcosahedronGeometry(0.03, 0), pick(bloomCols, R)); } });
    each(18, a => { const s = at(a, 0.12 + R() * 0.15);
      for (let b = 0; b < 5; b++) { const sp = (b - 2) * 0.22, d = V3(s.tan.x * Math.sin(sp), Math.cos(sp), s.tan.z * Math.sin(sp)).normalize(); blade(V, R() < 0.5 ? '#a6d27c' : '#c4dd96', V3(s.x + s.tan.x * (b - 2) * 0.012, 0, s.z + s.tan.z * (b - 2) * 0.012), d, 0.22 + R() * 0.08, 0.03, s.tan); } });
    each(12, a => { const s = at(a, 0.1 + R() * 0.15); blade(V, '#8fbd78', V3(s.x, 0, s.z), UP, 0.16, 0.01, s.tan); place(s.x, 0.17, s.z); put(B, new THREE.SphereGeometry(0.04, 6, 4), '#fff8ec'); });
  } else if (style === 'star') {
    each(14, a => { const s = at(a, 0.15 + R() * 0.1);
      for (let m = 0; m < 3; m++) { const x = s.x + s.tan.x * (m - 1) * 0.06 + (R() - 0.5) * 0.03, z = s.z + s.tan.z * (m - 1) * 0.06 + (R() - 0.5) * 0.03, r = 0.05 + R() * 0.04;
        place(x, r * 1.2, z); o.rotation.set(0, 0, 0); o.rotateY(-a); o.rotateZ(-0.3 + (R() - 0.5) * 0.2); o.scale.set(1, 1.6, 1); put(B, new THREE.IcosahedronGeometry(r, 0), pick(['#c9b4ff', '#9fe8f0', '#ffc9e0'], R)); } });
    each(26, a => { const s = at(a, 0.06 + R() * 0.22); place(s.x, 0.006, s.z); put(B, new THREE.CylinderGeometry(0.05, 0.05, 0.012, 8), R() < 0.5 ? '#d6c2ff' : '#b8f0e0'); });
    each(10, a => { const s = at(a, 0.1 + R() * 0.18); pebble(s.x, s.z, ['#e4def0']); });
  }
}

let _fallTex;
/**
 * A waterfall pouring over the rim along +z: it leaves the river at its width, curls over the lip,
 * arcs out a little and widens as it falls, fading into mist. Two layers of streaks scroll at
 * different speeds (userData.texes); soft mist puffs hang at the lip and the foot (userData.mist).
 */
function makeWaterfall(len, width = 0.54) {
  if (!_fallTex) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0, 'rgba(150,200,240,0.0)'); gr.addColorStop(0.15, 'rgba(170,215,248,0.75)'); gr.addColorStop(0.5, 'rgba(205,232,255,0.9)'); gr.addColorStop(0.85, 'rgba(170,215,248,0.75)'); gr.addColorStop(1, 'rgba(150,200,240,0.0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const R = mrand(91);
    for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(255,255,255,${0.35 + R() * 0.5})`; const x = 6 + R() * 52, y = R() * 256, l = 14 + R() * 40; g.beginPath(); g.ellipse(x, y, 1 + R() * 1.6, l / 2, 0, 0, Math.PI * 2); g.fill(); }
    _fallTex = new THREE.CanvasTexture(c); _fallTex.wrapS = _fallTex.wrapT = THREE.RepeatWrapping; _fallTex.colorSpace = THREE.SRGBColorSpace;
  }
  const g = new THREE.Group(), texes = [], mist = [];
  const layer = (w0, w1, out, speedK, alpha0) => {
    const n = 24, pos = [], uv = [], col = [], idx = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n, lip = Math.min(1, t * 6); // the first sixth curls over the edge
      const y = 0.045 - Math.pow(t, 1.15) * len, z = out * Math.sqrt(t) + 0.08 * (1 - (1 - lip) * (1 - lip)), w = w0 + (w1 - w0) * Math.pow(t, 0.8);
      pos.push(-w / 2, y, z, w / 2, y, z); uv.push(0, t * len / 2.5, 1, t * len / 2.5);
      const a = alpha0 * Math.min(1, (1 - t) * 2.2); col.push(1, 1, 1, a, 1, 1, 1, a);
      if (k) { const b = (k - 1) * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); geo.setIndex(idx);
    const tex = _fallTex.clone(); tex.needsUpdate = true; tex.userData = { speed: speedK }; texes.push(tex);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    m.renderOrder = 2; g.add(m);
  };
  layer(width, width * 2.2, 0.55, 0.9, 0.95);
  layer(width * 0.7, width * 1.6, 0.5, 1.4, 0.7);
  for (let k = 0; k < 2; k++) { const s = 0.4 + k * 0.2, p = glow('#ffffff', s, 0.5); p.material.blending = THREE.NormalBlending; p.position.set((k - 0.5) * 0.18, -0.02 - k * 0.08, 0.12 + k * 0.04); p.userData.s = s; g.add(p); mist.push(p); } // a soft breath of mist at the brink
  for (let k = 0; k < 4; k++) { const s = 1.2 + k * 0.4, p = glow('#f4f8ff', s, 0.35); p.material.blending = THREE.NormalBlending; p.position.set((k - 1.5) * 0.35, -len * (0.75 + k * 0.06), 0.55 + k * 0.1); p.userData.s = s; g.add(p); mist.push(p); }
  const drops = []; // bright droplets tumbling down the stream's own arc
  for (let k = 0; k < 10; k++) { const d = glow('#ffffff', 0.12 + (k % 3) * 0.04, 0.85); d.userData = { ph: k / 10, x: ((k * 7) % 10 / 10 - 0.5) * width * 1.4 }; g.add(d); drops.push(d); }
  const spray = []; // droplets flung outward from the curl, arcing away before they drop
  for (let k = 0; k < 6; k++) { const d = glow('#ffffff', 0.08 + (k % 2) * 0.04, 0.8); d.userData = { ph: k / 6, x: ((k * 5) % 6 / 6 - 0.5) * width * 1.2, v: 0.5 + (k % 3) * 0.2 }; g.add(d); spray.push(d); }
  g.userData = { texes, mist, drops, spray, len, out: 0.55, tex: texes[0] };
  return g;
}

let _aoTex;
/** A soft dark spot laid on the ground under a figure or building, so it sits on the island. */
function contactShadow(size, opacity = 0.32) {
  if (!_aoTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    gr.addColorStop(0, 'rgba(40,28,70,1)'); gr.addColorStop(0.55, 'rgba(40,28,70,0.45)'); gr.addColorStop(1, 'rgba(40,28,70,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); _aoTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: _aoTex, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.renderOrder = 1; m.userData.contact = true;
  return m;
}
/**
 * A puffy cloud: a flat-bottomed heap of smooth puffs, big ones on top and small ones round the
 * rim, shaded from a warm white crown to a soft lavender underside (vertex colours). colour tints
 * the crown. Every puff shares the cloud's one material (syncSky moves its glow).
 */
function makeCloud(seed, size, color = '#efe7ef', detail = 1) {
  const R = mrand(seed), g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#ffe8e0'), emissiveIntensity: 0.06 });
  const top = new THREE.Color('#fffaf6').lerp(new THREE.Color(color), 0.35), bottom = new THREE.Color('#cdbfe0'), c = new THREE.Color();
  const puffs = [], nRim = 5 + Math.floor(R() * 3), nTop = 2 + Math.floor(R() * 2), wx = size * 1.15, wz = size * 0.6;
  for (let k = 0; k < nRim; k++) { const a = k / nRim * Math.PI * 2 + R() * 0.4; puffs.push([Math.cos(a) * wx * (0.6 + R() * 0.3), size * 0.05, Math.sin(a) * wz * (0.6 + R() * 0.3), size * (0.32 + R() * 0.16)]); }
  for (let k = 0; k < nTop; k++) puffs.push([(k / Math.max(1, nTop - 1) - 0.5) * wx * 0.9 + (R() - 0.5) * size * 0.2, size * (0.22 + R() * 0.12), (R() - 0.5) * wz * 0.5, size * (0.48 + R() * 0.2)]);
  puffs.push([0, size * 0.1, 0, size * 0.55]);
  const yMin = -size * 0.12, yMax = size * 0.95;
  for (const [x, y, z, r] of puffs) {
    const geo = new THREE.IcosahedronGeometry(r, Math.max(1, detail + 1)), pos = geo.attributes.position, col = [];
    for (let v = 0; v < pos.count; v++) {
      let py = pos.getY(v); if (py < 0) { py *= 0.3; pos.setY(v, py); } // flat underside
      const t = Math.max(0, Math.min(1, (y + py - yMin) / (yMax - yMin)));
      c.copy(bottom).lerp(top, Math.pow(t, 0.7)); col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const nrm = geo.attributes.normal, v3 = new THREE.Vector3(); // round normals, so the puff shades smooth, not faceted
    for (let v = 0; v < pos.count; v++) { v3.set(pos.getX(v), pos.getY(v) < 0 ? pos.getY(v) * 3 : pos.getY(v), pos.getZ(v)).normalize(); nrm.setXYZ(v, v3.x, v3.y, v3.z); }
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m);
  }
  g.userData.mat = mat; g.userData.size = size;
  return g;
}

// ---- Pieces --------------------------------------------------------------------------------
/** Pastel colours for the fairy houses. */
const FAIRY = {
  walls: ['#fff4e6', '#fde8f0', '#eef0ff', '#effbef', '#fff8d8', '#f6ecff'],
  roofs: ['#f2a6c4', '#b9a3f0', '#8fd0e8', '#f7c98a', '#a8e0b8', '#f49a9a', '#c9a7f2'],
  trim: '#fff7ea', door: '#a4708c', vine: '#7cbf6a',
};
/** A cone bent toward +x near its tip: a witch-hat roof. */
function bentCone(r, h, bend, seg = 16) {
  const geo = new THREE.ConeGeometry(r, h, seg, 6), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + h / 2) / h; p.setX(i, p.getX(i) + bend * t * t * t); }
  geo.computeVertexNormals(); return geo;
}
/** An arched door (a rectangle with a round top), flat, facing +z. */
function archGeo(w, h, d) {
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h - w / 2); sh.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); sh.lineTo(-w / 2, 0);
  return new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 10 });
}
/**
 * A fairy house, one of three styles chosen by its seed (or forced by style): a round tower with
 * a bent witch-hat roof, a mushroom house with a spotted cap, or a cottage with a swooping roof.
 * Every one has round glowing windows, an arched door, climbing vines with flowers, a string of
 * fairy lights and a little star on top. floors 2 makes it taller. Window and light glow are per
 * house (userData.winMat, userData.lights); userData.chimney is where smoke rises.
 */
function makeHouse(seed, floors = 1, style, rooms = 0, lofts = 0) {
  const R = mrand(seed + 17), wall = pick(FAIRY.walls, R), roof = pick(FAIRY.roofs, R), accent = pick(FAIRY.roofs, R);
  style = style || ['tower', 'tower', 'mushroom', 'cottage', 'cottage'][Math.floor(R() * 5) % 5];
  // tall: two storeys, from crowding neighbours or a grown-up child's loft. upY/front: the upper
  // floor's height and the front wall there (the loft balcony); crown: where the stage-4 turret
  // rises [x, base y, z, height], or null when the style crowns itself.
  const g = new THREE.Group(), tall = floors === 2 || lofts >= 1;
  let upY = 0.58, front = 0.27, crown = null, anim = null;
  const winMat = new THREE.MeshLambertMaterial({ color: '#6b5d7e', emissive: new THREE.Color(PAL.window), emissiveIntensity: 0, flatShading: true });
  const lights = new THREE.MeshLambertMaterial({ color: '#fff3c8', emissive: new THREE.Color('#ffd98a'), emissiveIntensity: 0.2 });
  const roundWin = (x, y, z, ry, r = 0.06) => {
    const w = new THREE.Group(); w.position.set(x, y, z); w.rotation.y = ry;
    const pane = mk(new THREE.CylinderGeometry(r, r, 0.03, 14), winMat, 0, 0, 0.005); pane.rotation.x = Math.PI / 2; w.add(pane);
    const ring = mk(new THREE.TorusGeometry(r + 0.004, 0.013, 5, 16), T(FAIRY.trim, 'wood'), 0, 0, 0.016); w.add(ring);
    const cross = mk(new THREE.BoxGeometry(r * 1.9, 0.01, 0.02), T(FAIRY.trim, 'wood'), 0, 0, 0.02); w.add(cross);
    const cross2 = mk(new THREE.BoxGeometry(0.01, r * 1.9, 0.02), T(FAIRY.trim, 'wood'), 0, 0, 0.02); w.add(cross2);
    g.add(w);
  };
  const door = (z, h = 0.27) => {
    const d = mk(archGeo(0.16, h, 0.03), T(FAIRY.door, 'wood'), 0, 0.075, z); g.add(d);
    const fr = mk(archGeo(0.2, h + 0.02, 0.02), T(FAIRY.trim, 'wood'), 0, 0.07, z - 0.008); g.add(fr);
    g.add(mk(new THREE.SphereGeometry(0.014, 8, 6), PAL.gold, 0.045, 0.075 + h * 0.45, z + 0.035));
    g.add(mk(new THREE.CylinderGeometry(0.12, 0.13, 0.035, 12), T(PAL.stoneShade, 'stone'), 0, 0.02, z + 0.08));
  };
  const vine = (x, z, h, ry) => { // a climbing vine with leaves and a few flowers
    const v = new THREE.Group(); v.position.set(x, 0.08, z); v.rotation.y = ry;
    for (let k = 0; k < 7; k++) {
      const t = k / 6, lx = Math.sin(k * 1.7) * 0.03;
      v.add(mk(new THREE.IcosahedronGeometry(0.03 + R() * 0.012, 0), FAIRY.vine, lx, t * h, 0.012));
      if (k % 2) v.add(mk(new THREE.IcosahedronGeometry(0.016, 0), pick(PAL.flower, R), lx + 0.02, t * h + 0.02, 0.025));
    }
    g.add(v);
  };
  const star = (y, x = 0) => { // a little gold star on a pole
    g.add(mk(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 4), PAL.gold, x, y + 0.07, 0));
    const st = mk(new THREE.OctahedronGeometry(0.045, 0), M(PAL.gold, '#ffcf60', 0.5), x, y + 0.16, 0); st.scale.set(1, 1, 0.35); g.add(st);
  };
  const fairyLights = (pts) => { for (const [x, y, z] of pts) g.add(mk(new THREE.SphereGeometry(0.014, 6, 4), lights, x, y, z)); };
  g.add(mk(new THREE.CylinderGeometry(0.36, 0.38, 0.07, 18), T(PAL.stoneShade, 'stone'), 0, 0.035, 0));
  let roofMesh, chimney, top;
  if (style === 'tower') {
    const h = tall ? 1.0 : 0.62; top = 0.07 + h;
    g.add(mk(new THREE.CylinderGeometry(0.26, 0.3, h, 18), T(wall, 'plaster'), 0, 0.07 + h / 2, 0));
    const band = mk(new THREE.TorusGeometry(0.27, 0.02, 5, 22), T(FAIRY.trim, 'wood'), 0, top - 0.01, 0); band.rotation.x = Math.PI / 2; g.add(band);
    const rh = tall ? 0.85 : 0.72;
    roofMesh = mk(bentCone(0.36, rh, 0.14), T(roof, 'shingle'), 0, top + rh / 2, 0); g.add(roofMesh);
    star(top + rh - 0.02, 0.14);
    for (const y of tall ? [0.32, 0.72] : [0.42]) { roundWin(0.18, y, 0.21, Math.PI / 5); roundWin(-0.27, y, 0, -Math.PI / 2); roundWin(0.12, y, -0.25, Math.PI * 0.85); }
    door(0.27);
    vine(-0.2, 0.2, h * 0.9, -Math.PI / 4); vine(0.27, -0.08, h * 0.7, Math.PI / 2);
    const lp = []; for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; lp.push([Math.cos(a) * 0.34, top + 0.06 + Math.sin(k * 1.3) * 0.015, Math.sin(a) * 0.34]); } fairyLights(lp);
    // a little stone chimney through the roof's back slope; the smoke rises from its top
    const cy = top + rh * 0.3, ch = mk(new THREE.CylinderGeometry(0.042, 0.05, 0.34, 8), T('#c7a3b8', 'stone'), 0.14, cy, -0.14); g.add(ch);
    g.add(mk(new THREE.CylinderGeometry(0.058, 0.058, 0.04, 8), T('#a98aa0', 'stone'), 0.14, cy + 0.17, -0.14));
    chimney = new THREE.Vector3(0.14, cy + 0.2, -0.14);
    upY = 0.58; front = 0.27; crown = [-0.15, top, -0.13, rh * 0.8];
  } else if (style === 'mushroom') {
    const h = tall ? 0.85 : 0.5; top = 0.07 + h;
    const stem = mk(new THREE.CylinderGeometry(0.24, 0.3, h, 18), T('#fbf1e2', 'plaster'), 0, 0.07 + h / 2, 0); g.add(stem);
    const capR = 0.48, cap = new THREE.SphereGeometry(capR, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2); cap.scale(1, 0.72, 1);
    roofMesh = mk(cap, T(roof, 'plaster'), 0, top - 0.03, 0); g.add(roofMesh);
    g.add(mk(new THREE.CylinderGeometry(capR * 0.98, capR * 0.9, 0.05, 22), T('#fff4e8', 'plaster'), 0, top - 0.035, 0));
    for (let k = 0; k < 9; k++) { // white spots on the cap
      const a = R() * Math.PI * 2, el = 0.25 + R() * 0.9, rr = capR * Math.cos(el), y = top - 0.03 + capR * 0.72 * Math.sin(el);
      const sp = mk(new THREE.SphereGeometry(0.035 + R() * 0.03, 8, 6), '#ffffff', Math.cos(a) * rr, y, Math.sin(a) * rr); sp.scale.y = 0.35;
      sp.lookAt(0, top - 0.6, 0); sp.rotateX(Math.PI / 2); g.add(sp);
    }
    star(top + capR * 0.72 - 0.06);
    for (const y of tall ? [0.3, 0.62] : [0.36]) { roundWin(0.15, y, 0.22, Math.PI / 5, 0.055); roundWin(-0.26, y, 0.02, -Math.PI / 2, 0.05); }
    door(0.25, 0.25);
    vine(0.22, 0.12, h * 0.8, Math.PI / 3);
    const lp = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; lp.push([Math.cos(a) * capR * 0.95, top - 0.07 - Math.abs(Math.sin(k * 0.9)) * 0.03, Math.sin(a) * capR * 0.95]); } fairyLights(lp);
    // a crooked little stone chimney poking up through the cap
    const ch = mk(new THREE.CylinderGeometry(0.04, 0.048, 0.24, 8), T('#c7a3b8', 'stone'), -0.18, top + 0.31, -0.1); ch.rotation.z = 0.15; g.add(ch);
    g.add(mk(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 8), T('#a98aa0', 'stone'), -0.198, top + 0.43, -0.1));
    chimney = new THREE.Vector3(-0.2, top + 0.46, -0.1);
    upY = 0.5; front = 0.26; crown = [0.17, top, -0.12, 0.6];
  } else if (style === 'moonbell') {
    // A bell-shaped home in pale lilac under a silver-blue roof whose rim curls up, with a glowing
    // bell-lantern swaying under the front eave.
    const h = tall ? 0.92 : 0.56; top = 0.07 + h;
    const lil = pick(['#efe6ff', '#e8e4fb', '#f3e8ff'], R), silver = pick(['#9fb4e8', '#a9c2f0', '#b7b0ec'], R);
    g.add(mk(lathe([[0.33, 0], [0.3, h * 0.08], [0.255, h * 0.35], [0.24, h * 0.7], [0.225, h]], 18), T(lil, 'plaster'), 0, 0.07, 0));
    const rp = [[0.4, 0.07], [0.37, 0.01], [0.3, 0.03], [0.2, 0.17], [0.1, 0.36], [0.03, 0.53], [0, 0.56]];
    roofMesh = mk(lathe(rp, 18), T(silver, 'shingle'), 0, top, 0); g.add(roofMesh);
    const band = mk(new THREE.TorusGeometry(0.23, 0.018, 5, 22), T(FAIRY.trim, 'wood'), 0, top, 0); band.rotation.x = Math.PI / 2; g.add(band);
    for (const y of tall ? [0.34, 0.74] : [0.4]) { roundWin(0.18, y, 0.18, Math.PI / 4, 0.055); roundWin(-0.18, y, 0.18, -Math.PI / 4, 0.055); roundWin(-0.25, y, -0.06, -Math.PI / 2 - 0.2, 0.05); }
    door(0.29, 0.25);
    vine(0.24, 0.12, h * 0.75, Math.PI / 2.4);
    const lp = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; lp.push([Math.cos(a) * 0.39, top + 0.05 + Math.sin(k * 1.3) * 0.012, Math.sin(a) * 0.39]); } fairyLights(lp);
    const bell = new THREE.Group(); bell.position.set(0.24, top + 0.03, 0.26); g.add(bell); // hangs from the eave
    bell.add(mk(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 4), PAL.gold, 0, -0.04, 0));
    bell.add(mk(lathe([[0.045, -0.13], [0.04, -0.11], [0.028, -0.09], [0.02, -0.08], [0, -0.075]], 10), M('#e8eeff', '#c9d6ff', 0.6), 0, 0, 0));
    const bl = glow('#d6e0ff', 0.22, 0.6); bl.position.y = -0.12; bell.add(bl);
    anim = (t, night, wind, s) => { bell.rotation.z = Math.sin(t * 1.6 + s) * (0.12 + wind * 0.25); bell.rotation.x = Math.sin(t * 1.1 + s * 2) * 0.06; bl.material.opacity = 0.25 + night * 0.6; };
    const ch = mk(new THREE.CylinderGeometry(0.04, 0.048, 0.3, 8), T('#c7a3b8', 'stone'), 0.14, top + 0.25, -0.14); g.add(ch);
    g.add(mk(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 8), T('#a98aa0', 'stone'), 0.14, top + 0.41, -0.14));
    chimney = new THREE.Vector3(0.14, top + 0.44, -0.14);
    if (lofts >= 2) { // a third, tiny bell tier with a crescent moon on top
      g.add(mk(lathe([[0.13, 0], [0.11, 0.08], [0.1, 0.16], [0.09, 0.2]], 14), T(lil, 'plaster'), 0, top + 0.34, 0));
      roundWin(0, top + 0.44, 0.11, 0, 0.035);
      g.add(mk(lathe([[0.19, 0.03], [0.16, 0], [0.11, 0.06], [0.05, 0.2], [0, 0.26]], 14), T(silver, 'shingle'), 0, top + 0.53, 0));
      const moon = mk(new THREE.TorusGeometry(0.06, 0.016, 6, 16, Math.PI * 1.25), M(PAL.gold, '#ffe08a', 0.7), 0, top + 0.9, 0); moon.rotation.z = 0.8; g.add(moon);
    } else star(top + 0.54);
    upY = 0.56; front = 0.25;
  } else if (style === 'gourd') {
    // Gourdlight: a squashed, ribbed peach gourd with a darker cap; its curled stem is the chimney.
    const h = tall ? 0.9 : 0.55, sy = (h + 0.12) / 0.68, cy = 0.34 * sy - 0.12, peach = pick(['#ffd2b0', '#ffc9a8', '#fcd9b8'], R), capC = pick(['#f2a65a', '#e98f6a', '#f4b37a'], R);
    top = cy + 0.34 * sy * 0.5;
    const body = mk(new THREE.SphereGeometry(0.34, 20, 14), T(peach, 'plaster'), 0, cy, 0); body.scale.y = sy; g.add(body);
    for (let k = 0; k < 6; k++) { const rib = mk(new THREE.TorusGeometry(0.343, 0.014, 4, 28), T(capC, 'plaster'), 0, cy, 0); rib.scale.set(1, sy, 1); rib.rotation.y = k / 6 * Math.PI; g.add(rib); }
    roofMesh = mk(new THREE.SphereGeometry(0.352, 20, 8, 0, Math.PI * 2, 0, Math.PI / 3), T(capC, 'plaster'), 0, cy, 0); roofMesh.scale.y = sy; g.add(roofMesh);
    let y0 = cy + 0.34 * sy; // the gourd's crown
    for (const y of tall ? [cy - 0.1 * sy, cy + 0.12 * sy] : [cy + 0.04]) { const rr = 0.34 * Math.sqrt(Math.max(0.2, 1 - ((y - cy) / (0.34 * sy)) ** 2)) - 0.005; roundWin(Math.sin(0.7) * rr, y, Math.cos(0.7) * rr, 0.7, 0.055); roundWin(-Math.sin(1.3) * rr, y, Math.cos(1.3) * rr, -1.3, 0.05); }
    door(0.31, 0.24);
    vine(-0.26, 0.16, h * 0.7, -Math.PI / 3);
    const lp = []; for (let k = 0; k < 15; k++) { const a = k / 15 * Math.PI * 2; lp.push([Math.cos(a) * 0.3, top + 0.04 + Math.sin(k * 1.1) * 0.012, Math.sin(a) * 0.3]); } fairyLights(lp);
    if (lofts >= 2) { // a tiny gourd perched on the crown, with a leaf
      const s2 = mk(new THREE.SphereGeometry(0.13, 14, 10), T(peach, 'plaster'), 0, y0 + 0.08, 0); s2.scale.y = 0.85; g.add(s2);
      roundWin(0, y0 + 0.08, 0.125, 0, 0.032);
      g.add(mk(new THREE.SphereGeometry(0.135, 14, 6, 0, Math.PI * 2, 0, Math.PI / 3), T(capC, 'plaster'), 0, y0 + 0.08, 0));
      y0 += 0.19;
    }
    const stem = mk(new THREE.TorusGeometry(0.07, 0.032, 6, 12, Math.PI * 0.7), T('#8a6a4a', 'wood'), -0.07, y0 + 0.02, 0); g.add(stem); // curls up and over
    const leaf = mk(new THREE.SphereGeometry(0.09, 8, 6), T('#8fc47a', 'plaster'), 0.1, y0 + 0.02, 0.06); leaf.scale.set(1, 0.25, 0.55); leaf.rotation.y = -0.6; g.add(leaf);
    chimney = new THREE.Vector3(-0.07 + 0.07 * Math.cos(Math.PI * 0.7), y0 + 0.02 + 0.07 * Math.sin(Math.PI * 0.7) + 0.03, 0);
    upY = cy + 0.06 * sy; front = 0.34 * Math.sqrt(Math.max(0.2, 1 - (0.06 / 0.34) ** 2)) - 0.03;
  } else if (style === 'rootstump') {
    // A hollow tree-stump home: bark walls with roots spreading at the foot, a mossy band, a puffy
    // sage leaf roof and a round butter-yellow door under a vine arch.
    const h = tall ? 0.95 : 0.55; top = 0.07 + h;
    const bark = pick(['#9a7458', '#a07a5e', '#8e6c55'], R), leafC = pick(['#9cc79a', '#a8d0a0', '#8fc0a0'], R);
    g.add(mk(new THREE.CylinderGeometry(0.27, 0.32, h, 14), T(bark, 'wood'), 0, 0.07 + h / 2, 0));
    const moss = mk(new THREE.TorusGeometry(0.31, 0.035, 5, 18), T('#8cc47a', 'plaster'), 0, 0.1, 0); moss.rotation.x = Math.PI / 2; moss.scale.z = 0.6; g.add(moss);
    for (const a of [0.9, 2.0, 3.1, 4.2, 5.3]) { const rg = new THREE.Group(); rg.rotation.y = a; const r = mk(new THREE.ConeGeometry(0.07, 0.32, 6), T(bark, 'wood'), 0, 0.09, 0.31); r.rotation.x = Math.PI / 2 + 0.35; rg.add(r); g.add(rg); }
    roofMesh = mk(new THREE.IcosahedronGeometry(0.38, 1), T(leafC, 'plaster'), 0, top + 0.12, 0); roofMesh.scale.set(1, 0.58, 1); g.add(roofMesh);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.4, p2 = mk(new THREE.IcosahedronGeometry(0.15 + R() * 0.05, 1), T(k % 2 ? leafC : '#b4d8a8', 'plaster'), Math.cos(a) * 0.26, top + 0.2 + R() * 0.06, Math.sin(a) * 0.26); p2.scale.y = 0.75; g.add(p2); }
    const dr = mk(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 16), T('#f4d77a', 'wood'), 0, 0.18, 0.31); dr.rotation.x = Math.PI / 2; g.add(dr);
    g.add(mk(new THREE.SphereGeometry(0.014, 8, 6), PAL.gold, 0.05, 0.18, 0.33));
    const arch = mk(new THREE.TorusGeometry(0.125, 0.022, 5, 14, Math.PI), FAIRY.vine, 0, 0.18, 0.31); g.add(arch);
    for (let k = 0; k < 4; k++) { const a = 0.4 + k * 0.75; g.add(mk(new THREE.IcosahedronGeometry(0.018, 0), pick(PAL.flower, R), Math.cos(a) * 0.125, 0.18 + Math.sin(a) * 0.125, 0.33)); }
    g.add(mk(new THREE.CylinderGeometry(0.12, 0.13, 0.035, 12), T(PAL.stoneShade, 'stone'), 0, 0.02, 0.4));
    for (const y of tall ? [0.4, 0.78] : [0.42]) { roundWin(Math.sin(0.95) * 0.29, y, Math.cos(0.95) * 0.29, 0.95, 0.05); roundWin(-Math.sin(1.1) * 0.29, y, Math.cos(1.1) * 0.29, -1.1, 0.05); }
    const lp = []; for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; lp.push([Math.cos(a) * 0.37, top + 0.06 + Math.sin(k * 1.7) * 0.025, Math.sin(a) * 0.37]); } fairyLights(lp);
    const ch = mk(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 8), T('#c7a3b8', 'stone'), 0.16, top + 0.32, -0.13); ch.rotation.z = -0.12; g.add(ch);
    g.add(mk(new THREE.CylinderGeometry(0.055, 0.055, 0.035, 8), T('#a98aa0', 'stone'), 0.178, top + 0.48, -0.13));
    chimney = new THREE.Vector3(0.18, top + 0.51, -0.13);
    if (lofts >= 2) { // a birdhouse lookout on a pole above the leaves
      g.add(mk(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 5), T(bark, 'wood'), -0.12, top + 0.4, 0.02));
      g.add(mk(new THREE.BoxGeometry(0.16, 0.14, 0.16), T('#f6ecd8', 'wood'), -0.12, top + 0.6, 0.02));
      const lr = mk(new THREE.ConeGeometry(0.15, 0.13, 4), T(pick(FAIRY.roofs, R), 'shingle'), -0.12, top + 0.735, 0.02); lr.rotation.y = Math.PI / 4; g.add(lr);
      roundWin(-0.12, top + 0.6, 0.1, 0, 0.032);
    } else star(top + 0.3, -0.05);
    upY = 0.6; front = 0.28;
  } else if (style === 'mistspire') {
    // Mist Spire: a slim periwinkle tower under a tall deep-blue cone, with a crescent window and
    // thin pale rings drifting round its top (one more for each loft).
    const h = tall ? 1.15 : 0.78; top = 0.07 + h;
    const peri = pick(['#c8ccf4', '#c4d0f2', '#d0c8f2'], R), deep = pick(['#5d63b8', '#6a5fc0', '#4f6fb0'], R);
    g.add(mk(new THREE.CylinderGeometry(0.2, 0.24, h, 16), T(peri, 'plaster'), 0, 0.07 + h / 2, 0));
    const band = mk(new THREE.TorusGeometry(0.21, 0.018, 5, 20), T('#e8ecff', 'wood'), 0, top, 0); band.rotation.x = Math.PI / 2; g.add(band);
    roofMesh = mk(new THREE.ConeGeometry(0.3, 0.92, 16), T(deep, 'shingle'), 0, top + 0.46, 0); g.add(roofMesh);
    for (let k = 0; k < 6; k++) { const a = R() * Math.PI * 2, t = 0.15 + R() * 0.55, rr = 0.3 * (1 - t) + 0.008; g.add(mk(new THREE.OctahedronGeometry(0.018, 0), M(PAL.gold, '#ffcf60', 0.6), Math.cos(a) * rr, top + t * 0.92, Math.sin(a) * rr)); }
    const cres = mk(new THREE.TorusGeometry(0.05, 0.017, 5, 14, Math.PI * 1.2), winMat, 0.1, top - 0.16, 0.19); cres.rotation.set(0, 0.48, 0.9); g.add(cres); // a crescent window
    for (const y of tall ? [0.34, 0.7] : [0.36]) { roundWin(-0.21, y, 0.05, -Math.PI / 2 + 0.25, 0.045); roundWin(0.16, y, -0.14, Math.PI * 0.75, 0.045); }
    door(0.23, 0.27);
    vine(-0.15, 0.17, h * 0.6, -Math.PI / 4);
    const lp = []; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; lp.push([Math.cos(a) * 0.28, top + 0.03 + Math.sin(k * 1.3) * 0.012, Math.sin(a) * 0.28]); } fairyLights(lp);
    const ringMat = new THREE.MeshLambertMaterial({ color: '#e6ebff', emissive: new THREE.Color('#c9d4ff'), emissiveIntensity: 0.5, transparent: true, opacity: 0.8 });
    const rings = []; for (let k = 0; k <= Math.min(2, lofts); k++) { const r = mk(new THREE.TorusGeometry(0.34 + k * 0.06, 0.007, 4, 40), ringMat, 0, top + 0.3 + k * 0.12, 0); r.castShadow = false; g.add(r); rings.push(r); }
    anim = (t, night, wind, s) => { rings.forEach((r, k) => { r.rotation.x = Math.PI / 2 + Math.sin(t * 0.4 + k * 2 + s) * 0.25; r.rotation.y = Math.sin(t * 0.3 + k + s) * 0.2; r.position.y = top + 0.3 + k * 0.12 + Math.sin(t * 0.8 + k * 1.7 + s) * 0.03; }); ringMat.emissiveIntensity = 0.3 + night * 0.9; };
    const ch = mk(new THREE.CylinderGeometry(0.035, 0.042, 0.36, 8), T('#a9a6cf', 'stone'), -0.13, top + 0.3, -0.1); g.add(ch);
    g.add(mk(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 8), T('#8f8bb8', 'stone'), -0.13, top + 0.49, -0.1));
    chimney = new THREE.Vector3(-0.13, top + 0.52, -0.1);
    if (lofts >= 2) { // a gold crescent and a soft light crown the spire
      const moon = mk(new THREE.TorusGeometry(0.07, 0.018, 6, 16, Math.PI * 1.25), M(PAL.gold, '#ffe08a', 0.7), 0, top + 1.02, 0); moon.rotation.z = 0.8; g.add(moon);
      const lt = glow('#e0e6ff', 0.35, 0.6); lt.position.set(0, top + 1.02, 0); g.add(lt);
    } else star(top + 0.88);
    upY = 0.66; front = 0.2;
  } else {
    const h = tall ? 0.92 : 0.52; top = 0.07 + h;
    const body = mk(new THREE.BoxGeometry(0.56, h, 0.5), T(wall, 'plaster'), 0, 0.07 + h / 2, 0); g.add(body);
    for (const x of [-0.28, 0.28]) for (const z of [-0.25, 0.25]) g.add(mk(new THREE.CylinderGeometry(0.035, 0.035, h, 8), T(accent, 'wood'), x, 0.07 + h / 2, z));
    // A swooping roof: a stretched dome whose eaves curl up at the corners.
    const dome = new THREE.SphereGeometry(0.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), dp = dome.attributes.position;
    for (let i = 0; i < dp.count; i++) { const x = dp.getX(i), z = dp.getZ(i), y = dp.getY(i), edge = 1 - y / 0.5; dp.setY(i, y * 1.15 + edge * edge * 0.09 * (Math.abs(x) + Math.abs(z)) * 2); }
    dome.scale(0.92, 1, 0.82); dome.computeVertexNormals();
    roofMesh = mk(dome, T(roof, 'shingle'), 0, top - 0.02, 0); g.add(roofMesh);
    const dormer = mk(new THREE.CylinderGeometry(0.09, 0.1, 0.16, 12), T(wall, 'plaster'), 0, top + 0.27, 0.22); g.add(dormer);
    g.add(mk(bentCone(0.12, 0.2, 0.04, 12), T(accent, 'shingle'), 0, top + 0.45, 0.22));
    roundWin(0, top + 0.26, 0.31, 0, 0.045);
    star(top + 0.5, -0.05);
    for (const y of tall ? [0.32, 0.72] : [0.36]) { roundWin(0.17, y, 0.255, 0, 0.06); roundWin(0.28, y, -0.05, Math.PI / 2, 0.055); roundWin(-0.28, y, -0.05, -Math.PI / 2, 0.055); }
    if (tall) roundWin(-0.17, 0.72, 0.255, 0, 0.06);
    door(0.255);
    vine(-0.2, 0.255, h * 0.85, 0); vine(0.28, 0.18, h * 0.6, Math.PI / 2);
    const lp = []; for (let k = 0; k < 13; k++) { const t = k / 12; lp.push([-0.3 + t * 0.6, top + 0.02 + Math.sin(t * Math.PI) * -0.03, 0.29]); } fairyLights(lp);
    g.add(mk(new THREE.CylinderGeometry(0.045, 0.06, 0.26, 10), T('#c7a3b8', 'stone'), 0.2, top + 0.3, -0.12));
    g.add(mk(new THREE.CylinderGeometry(0.058, 0.058, 0.035, 10), T('#a98aa0', 'stone'), 0.2, top + 0.44, -0.12));
    chimney = new THREE.Vector3(0.2, top + 0.47, -0.12); // the top of the chimney pot
    upY = 0.56; front = 0.25; crown = [-0.18, top, -0.1, 0.62];
  }
  // A grown-up child's loft: an upper door onto a little round balcony with a railing and a lantern.
  if (lofts >= 1) {
    g.add(mk(archGeo(0.12, 0.19, 0.02), T(FAIRY.door, 'wood'), 0, upY + 0.015, front - 0.025));
    g.add(mk(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 14, 1, false, -Math.PI / 2, Math.PI), T(PAL.woodDark, 'wood'), 0, upY, front - 0.02));
    const rail = mk(new THREE.TorusGeometry(0.16, 0.008, 4, 14, Math.PI), T(FAIRY.trim, 'wood'), 0, upY + 0.1, front - 0.02); rail.rotation.x = Math.PI / 2; rail.rotation.z = Math.PI; g.add(rail);
    for (const a of [-1.3, -0.65, 0, 0.65, 1.3]) g.add(mk(new THREE.CylinderGeometry(0.007, 0.007, 0.1, 4), T(FAIRY.trim, 'wood'), Math.sin(a) * 0.16, upY + 0.05, front - 0.02 + Math.cos(a) * 0.16));
    g.add(mk(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4), PAL.gold, 0.15, upY + 0.08, front + 0.05));
    g.add(mk(new THREE.SphereGeometry(0.026, 8, 6), lights, 0.15, upY + 0.16, front + 0.05));
  }
  // The second loft: a slim turret with a cone cap, a lit window and a star (styles that crown
  // themselves, like the moonbell's third bell, leave crown null and built their own above).
  if (lofts >= 2 && crown) {
    const [x, y, z, ht] = crown;
    g.add(mk(new THREE.CylinderGeometry(0.075, 0.085, ht, 10), T(wall, 'plaster'), x, y + ht / 2, z));
    g.add(mk(bentCone(0.12, 0.26, 0.03, 10), T(accent, 'shingle'), x, y + ht + 0.13, z));
    roundWin(x, y + ht - 0.1, z + 0.08, 0, 0.032);
    star(y + ht + 0.24, x); // the pole sits at z 0: nudge it onto the turret
    g.children[g.children.length - 1].position.z = z; g.children[g.children.length - 2].position.z = z;
  }
  const snow = new THREE.Mesh(roofMesh.geometry, M('#ffffff')); snow.position.copy(roofMesh.position); snow.position.y += 0.025; snow.scale.setScalar(1.035); snow.visible = false; g.add(snow);
  // Rooms a growing family added: a low round annex on one side, then the other, each with its own
  // little roof in the house's colours and a round window looking out.
  for (let k = 0; k < Math.min(2, rooms); k++) {
    const sd = k ? 1 : -1, ax = sd * 0.31, az = -0.05;
    g.add(mk(new THREE.CylinderGeometry(0.13, 0.14, 0.26, 14), T(style === 'mushroom' ? '#fbf1e2' : wall, 'plaster'), ax, 0.07 + 0.13, az));
    g.add(mk(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 14), T(PAL.stoneShade, 'stone'), ax, 0.02, az));
    g.add(mk(bentCone(0.18, 0.18, sd * 0.03, 12), T(style === 'mushroom' ? roof : accent, 'shingle'), ax, 0.07 + 0.26 + 0.09, az));
    roundWin(ax + sd * 0.12, 0.22, az + 0.04, sd * Math.PI / 2, 0.045);
    const fl = makeFlower(pick(PAL.flower, R), 0.6, R); fl.position.set(ax + sd * 0.08, 0.03, az + 0.13); g.add(fl);
  }
  g.userData = { winMat, snow, chimney, lights, style };
  if (anim) g.userData.anim = anim;
  return g;
}

// ---- Village buildings: the Magic School and the Healing House --------------------------------
/** Window glass that glows at night (shared shape with the houses' round windows). */
function utilWin(g, winMat, x, y, z, ry, r = 0.06) {
  const w = new THREE.Group(); w.position.set(x, y, z); w.rotation.y = ry;
  const pane = mk(new THREE.CylinderGeometry(r, r, 0.03, 14), winMat, 0, 0, 0.005); pane.rotation.x = Math.PI / 2; w.add(pane);
  w.add(mk(new THREE.TorusGeometry(r + 0.004, 0.013, 5, 16), T(FAIRY.trim, 'wood'), 0, 0, 0.016));
  g.add(w);
}
/** An arched door with a frame, a gold knob and a round doorstep, facing +z at z. */
function utilDoor(g, z, col, h = 0.3, w = 0.18) {
  g.add(mk(archGeo(w, h, 0.03), T(col, 'wood'), 0, 0.075, z));
  g.add(mk(archGeo(w + 0.04, h + 0.02, 0.02), T(FAIRY.trim, 'wood'), 0, 0.07, z - 0.008));
  g.add(mk(new THREE.SphereGeometry(0.015, 8, 6), PAL.gold, 0.05, 0.075 + h * 0.45, z + 0.035));
  g.add(mk(new THREE.CylinderGeometry(0.14, 0.15, 0.035, 14), T(PAL.stoneShade, 'stone'), 0, 0.02, z + 0.09));
}
/**
 * The Magic School: an eight-sided hall under a tall star-capped witch-hat roof, a slim moon tower,
 * a little stargazing dome, a pennant, and glowing orbs and open books that circle the roof
 * (userData.orbit spins). userData.winMat and userData.lights glow at night.
 */
function makeSchool(seed = 1) {
  const R = mrand(seed + 29), g = new THREE.Group();
  const winMat = new THREE.MeshLambertMaterial({ color: '#6b5d7e', emissive: new THREE.Color('#ffd98a'), emissiveIntensity: 0, flatShading: true });
  const lights = new THREE.MeshLambertMaterial({ color: '#e8ddff', emissive: new THREE.Color('#c9b4ff'), emissiveIntensity: 0.3 });
  const wall = '#efe8ff', roof = pick(['#6f5fd0', '#5b6fd0', '#8a5fc8'], R), trim = '#fff7ea';
  g.add(mk(new THREE.CylinderGeometry(0.46, 0.48, 0.07, 20), T(PAL.stoneShade, 'stone'), 0, 0.035, 0));
  const h = 0.62, top = 0.07 + h;
  g.add(mk(new THREE.CylinderGeometry(0.3, 0.33, h, 8), T(wall, 'plaster'), 0, 0.07 + h / 2, 0));
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; g.add(mk(new THREE.BoxGeometry(0.04, h, 0.04), T('#c9b8e8', 'stone'), Math.sin(a) * 0.31, 0.07 + h / 2, Math.cos(a) * 0.31)); }
  const band = mk(new THREE.TorusGeometry(0.31, 0.022, 5, 24), T(PAL.gold, 'wood'), 0, top, 0); band.rotation.x = Math.PI / 2; g.add(band);
  const rh = 0.95, roofMesh = mk(bentCone(0.4, rh, -0.16, 8), T(roof, 'shingle'), 0, top + rh / 2, 0); g.add(roofMesh);
  // little gold stars painted on the roof
  for (let k = 0; k < 7; k++) { const a = R() * Math.PI * 2, t = 0.15 + R() * 0.5, rr = 0.4 * (1 - t) + 0.01; const st = mk(new THREE.OctahedronGeometry(0.022, 0), M(PAL.gold, '#ffcf60', 0.6), Math.cos(a) * rr - 0.16 * t * t * t, top + t * rh, Math.sin(a) * rr); g.add(st); }
  g.add(mk(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), PAL.gold, -0.16, top + rh + 0.06, 0));
  const star = mk(new THREE.OctahedronGeometry(0.07, 0), M(PAL.gold, '#ffcf60', 0.8), -0.16, top + rh + 0.17, 0); star.scale.set(1, 1, 0.35); g.add(star);
  // the moon tower
  const th = 1.05, tx = -0.3, tz = -0.16;
  g.add(mk(new THREE.CylinderGeometry(0.12, 0.14, th, 12), T('#e4dcf8', 'plaster'), tx, 0.07 + th / 2, tz));
  g.add(mk(bentCone(0.17, 0.42, 0.06, 12), T('#b9a3f0', 'shingle'), tx, 0.07 + th + 0.21, tz));
  const moon = mk(new THREE.TorusGeometry(0.06, 0.018, 6, 16, Math.PI * 1.25), M(PAL.gold, '#ffe08a', 0.7), tx + 0.06, 0.07 + th + 0.52, tz); moon.rotation.z = 0.8; g.add(moon);
  utilWin(g, winMat, tx + 0.09, 0.07 + th * 0.72, tz + 0.09, Math.PI / 4, 0.045);
  // the stargazing dome
  const dx = 0.3, dz = -0.12, dh = 0.34;
  g.add(mk(new THREE.CylinderGeometry(0.15, 0.16, dh, 12), T(wall, 'plaster'), dx, 0.07 + dh / 2, dz));
  g.add(mk(new THREE.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), T('#8fd0e8', 'plaster'), dx, 0.07 + dh, dz));
  const scope = mk(new THREE.CylinderGeometry(0.025, 0.035, 0.22, 8), PAL.gold, dx + 0.06, 0.07 + dh + 0.16, dz); scope.rotation.z = -0.7; g.add(scope);
  // windows, door, steps and a pennant
  for (const [x, y, z, ry] of [[0.2, 0.42, 0.24, Math.PI / 4], [-0.2, 0.42, 0.24, -Math.PI / 4], [0, 0.56, 0.31, 0]]) utilWin(g, winMat, x, y, z, ry, 0.055);
  utilDoor(g, 0.3, '#7a5fb0', 0.3, 0.18);
  g.add(mk(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4), PAL.woodDark, 0.3, 0.07 + dh + 0.36, dz - 0.08));
  const flag = mk(new THREE.ConeGeometry(0.05, 0.18, 3), '#f2a6c4', 0.39, 0.07 + dh + 0.55, dz - 0.08); flag.rotation.z = -Math.PI / 2; g.add(flag);
  // fairy lights round the eaves
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.add(mk(new THREE.SphereGeometry(0.015, 6, 4), lights, Math.cos(a) * 0.37, top + 0.04 + Math.sin(k * 1.3) * 0.015, Math.sin(a) * 0.37)); }
  // orbs and books circling the roof
  const orbit = new THREE.Group(); orbit.position.y = top + 0.45;
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2, col = ['#c9b4ff', '#8fe0f0', '#ffd98a'][k];
    const o = mk(new THREE.SphereGeometry(0.04, 10, 8), M(col, col, 1.1), Math.cos(a) * 0.5, Math.sin(k * 2) * 0.08, Math.sin(a) * 0.5); o.castShadow = false; orbit.add(o);
    const gl = glow(col, 0.32, 0.7); gl.position.copy(o.position); orbit.add(gl);
    const b = new THREE.Group(), ba = a + Math.PI / 3; b.position.set(Math.cos(ba) * 0.46, 0.12 + Math.sin(k) * 0.05, Math.sin(ba) * 0.46); b.rotation.set(0.3, -ba, 0.2);
    for (const s2 of [-1, 1]) { const pg = mk(new THREE.BoxGeometry(0.07, 0.008, 0.09), '#fffaf0', s2 * 0.036, 0, 0); pg.rotation.z = s2 * 0.35; pg.castShadow = false; b.add(pg); }
    b.add(mk(new THREE.BoxGeometry(0.15, 0.006, 0.095), pick(['#a4708c', '#6f5fd0', '#6fae9a'], R), 0, -0.012, 0));
    orbit.add(b);
  }
  g.add(orbit);
  const snow = new THREE.Mesh(roofMesh.geometry, M('#ffffff')); snow.position.copy(roofMesh.position); snow.position.y += 0.025; snow.scale.setScalar(1.035); snow.visible = false; g.add(snow);
  g.userData = { winMat, lights, orbit, snow };
  return g;
}
/**
 * The Healing House: a round white cottage under a roof of soft lotus petals, a glowing pearl at
 * its heart (userData.halo), a mint door with a leaf above it, herb pots and a small healing
 * spring. userData.winMat and userData.lights glow at night.
 */
function makeHealer(seed = 1) {
  const R = mrand(seed + 31), g = new THREE.Group();
  const winMat = new THREE.MeshLambertMaterial({ color: '#6b5d7e', emissive: new THREE.Color('#fff0b8'), emissiveIntensity: 0, flatShading: true });
  const lights = new THREE.MeshLambertMaterial({ color: '#e6fff0', emissive: new THREE.Color('#a8f0c8'), emissiveIntensity: 0.3 });
  const petal = pick(['#f7c6d8', '#f4d0e8', '#ffd9cf'], R), petal2 = '#bfe8d4';
  g.add(mk(new THREE.CylinderGeometry(0.46, 0.48, 0.07, 20), T(PAL.stoneShade, 'stone'), 0, 0.035, 0));
  const h = 0.5, top = 0.07 + h;
  g.add(mk(new THREE.CylinderGeometry(0.32, 0.35, h, 20), T('#fbfff8', 'plaster'), 0, 0.07 + h / 2, 0));
  const band = mk(new THREE.TorusGeometry(0.33, 0.02, 5, 24), T('#bfe8d4', 'wood'), 0, top, 0); band.rotation.x = Math.PI / 2; g.add(band);
  // the lotus roof: an inner dome and two rings of petals curling up
  const roofMesh = mk(new THREE.SphereGeometry(0.3, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), T('#fff4f8', 'plaster'), 0, top, 0); g.add(roofMesh);
  for (const [n, r, len, tilt, col, off] of [[9, 0.3, 0.34, 0.95, petal2, 0], [8, 0.2, 0.36, 0.55, petal, 0.35]]) {
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 + off, pg = new THREE.SphereGeometry(0.11, 10, 8); pg.scale(0.75, 1.6, 0.3);
      const m = mk(pg, T(col, 'plaster'), Math.cos(a) * r, top + 0.08, Math.sin(a) * r);
      m.rotation.order = 'YXZ'; m.rotation.y = -a + Math.PI / 2; m.rotation.x = tilt; m.position.y += len * 0.3; g.add(m);
    }
  }
  const pearl = mk(new THREE.SphereGeometry(0.075, 14, 10), M('#fffaf0', '#fff0c8', 0.9), 0, top + 0.36, 0); g.add(pearl);
  const halo = glow('#ffe9b8', 0.9, 0.5); halo.position.set(0, top + 0.36, 0); g.add(halo);
  // windows, a mint door and a glowing leaf above it
  for (const [x, z, ry] of [[0.24, 0.22, Math.PI / 4], [-0.24, 0.22, -Math.PI / 4], [0.33, -0.05, Math.PI / 2], [-0.33, -0.05, -Math.PI / 2]]) utilWin(g, winMat, x, 0.36, z, ry, 0.055);
  utilDoor(g, 0.33, '#7cc7a8', 0.29, 0.17);
  const leaf = mk(new THREE.OctahedronGeometry(0.06, 0), M('#9fe0b8', '#7fd8a8', 0.8), 0, 0.47, 0.35); leaf.scale.set(0.7, 1.2, 0.3); leaf.rotation.z = 0.5; g.add(leaf);
  // herb pots and a little healing spring
  for (const [x, z] of [[0.3, 0.3], [-0.32, 0.28], [-0.38, -0.2]]) {
    g.add(mk(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 10), T('#d39a62', 'stone'), x, 0.11, z));
    for (let k = 0; k < 4; k++) g.add(mk(new THREE.IcosahedronGeometry(0.03, 0), pick(PAL.leaf, R), x + (R() - 0.5) * 0.05, 0.17 + R() * 0.04, z + (R() - 0.5) * 0.05));
    g.add(mk(new THREE.IcosahedronGeometry(0.014, 0), pick(['#ffffff', '#c9a7f2', '#ffd36e'], R), x, 0.22, z));
  }
  g.add(mk(new THREE.CylinderGeometry(0.11, 0.12, 0.06, 14), T(PAL.stone, 'stone'), 0.3, 0.1, -0.28));
  g.add(mk(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 14), M('#9fd8f0', '#7fc8e8', 0.4), 0.3, 0.13, -0.28));
  for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; g.add(mk(new THREE.SphereGeometry(0.014, 6, 4), lights, Math.cos(a) * 0.37, top + 0.02 + Math.sin(k * 1.1) * 0.012, Math.sin(a) * 0.37)); }
  const snow = new THREE.Mesh(roofMesh.geometry, M('#ffffff')); snow.position.copy(roofMesh.position); snow.position.y += 0.02; snow.scale.setScalar(1.04); snow.visible = false; g.add(snow);
  g.userData = { winMat, lights, halo, snow };
  return g;
}

/** A tree: round puffs of leaves, sometimes pink blossom. Scaled by its growth. */
function makeTree(seed) {
  const R = mrand(seed + 3), g = new THREE.Group(), blossom = R() < 0.28, bark = T(PAL.wood, 'bark');
  g.add(mk(new THREE.CylinderGeometry(0.045, 0.075, 0.6, 7), bark, 0, 0.3, 0));
  g.add(mk(new THREE.ConeGeometry(0.12, 0.12, 7), bark, 0, 0.06, 0)); // root flare
  for (const s of [-1, 1]) { const b = mk(new THREE.CylinderGeometry(0.014, 0.025, 0.22, 5), bark, s * 0.07, 0.5, 0.02); b.rotation.z = -s * 0.8; g.add(b); }
  const n = 4 + Math.floor(R() * 3), cols = blossom ? PAL.blossom : PAL.leaf;
  for (let k = 0; k < n; k++) {
    const r = 0.17 + R() * 0.12, a = k / n * Math.PI * 2 + R() * 0.5;
    g.add(mk(new THREE.IcosahedronGeometry(r, 1), T(pick(cols, R), 'leaf'), Math.cos(a) * 0.16, 0.62 + R() * 0.2, Math.sin(a) * 0.16));
  }
  g.add(mk(new THREE.IcosahedronGeometry(0.25, 1), T(blossom ? PAL.blossom[0] : PAL.leaf[1], 'leaf'), 0, 0.88, 0));
  if (blossom) for (let k = 0; k < 6; k++) g.add(mk(new THREE.IcosahedronGeometry(0.03, 0), '#ffffff', (R() - 0.5) * 0.5, 0.6 + R() * 0.45, (R() - 0.5) * 0.5));
  else if (R() < 0.5) for (let k = 0; k < 4; k++) g.add(mk(new THREE.IcosahedronGeometry(0.035, 0), '#f08a6a', (R() - 0.5) * 0.45, 0.6 + R() * 0.35, (R() - 0.5) * 0.45));
  return g;
}

/** A flower: a stem, a leaf, five round petals and a golden heart. size scales it. */
function makeFlower(col, size = 1, R = Math.random) {
  const f = new THREE.Group(), h = 0.16 * size;
  f.add(mk(new THREE.CylinderGeometry(0.008 * size, 0.01 * size, h, 4), MS('#6aa85a'), 0, h / 2, 0));
  const lf = mk(new THREE.SphereGeometry(0.03 * size, 6, 4), MS('#86b86a'), 0.025 * size, h * 0.4, 0); lf.scale.set(1, 0.3, 0.5); lf.rotation.z = -0.5; f.add(lf);
  const head = new THREE.Group(); head.position.y = h; head.rotation.x = -0.3 + R() * 0.2; f.add(head);
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, p = mk(new THREE.SphereGeometry(0.024 * size, 8, 6), MS(col), Math.cos(a) * 0.028 * size, 0, Math.sin(a) * 0.028 * size); p.scale.y = 0.45; head.add(p); }
  head.add(mk(new THREE.SphereGeometry(0.016 * size, 8, 6), MS('#ffd96a'), 0, 0.008 * size, 0));
  return f;
}
/** A grass blade: a thin cone leaning a little. */
function blade(col, h, x, z, R) { const b = mk(new THREE.ConeGeometry(0.022, h, 4), MS(col), x, h / 2, z); b.rotation.set((R() - 0.5) * 0.5, R() * 3, (R() - 0.5) * 0.5); b.castShadow = false; return b; }
const GARDEN_KINDS = ['bed', 'veg', 'ring', 'arbour'], MEADOW_KINDS = ['wild', 'lavender', 'clover', 'sunny'];
/** The kind a garden or meadow of this seed is (joined neighbours all take the kind of the first one built). */
function gardenKind(seed) { return GARDEN_KINDS[Math.floor(mrand(seed + 5)() * 4) % 4]; }
function meadowKind(seed) { return MEADOW_KINDS[Math.floor(mrand(seed + 9)() * 4) % 4]; }
const SIDES = [[1, 1, 0], [2, -1, 0], [4, 0, 1], [8, 0, -1]];
/**
 * The ground of a bed that joins its neighbours: alone it is round; joined, it is a rounded square
 * that reaches right to each joined side, so neighbouring beds meet with no seam.
 */
function joinedBase(g, mask, mat, h, r = 0.42, arms = mask) {
  const add = m => { m.userData.base = true; g.add(m); };
  if (!mask) { add(mk(new THREE.CylinderGeometry(r, r + 0.02, h, 20), mat, 0, h / 2, 0)); return; }
  add(mk(new THREE.BoxGeometry(0.84, h, 0.84), mat, 0, h / 2, 0));
  for (const [bit, dx, dz] of SIDES) if (arms & bit) add(mk(new THREE.BoxGeometry(dx ? 0.1 : 0.84, h, dz ? 0.1 : 0.84), mat, dx * 0.46, h / 2, dz * 0.46));
  for (const [a, b, dx, dz] of [[1, 4, 1, 1], [1, 8, 1, -1], [2, 4, -1, 1], [2, 8, -1, -1]]) // where two joined sides meet, fill the corner so the patch shows no notch
    if ((arms & a) && (arms & b)) add(mk(new THREE.BoxGeometry(0.1, h, 0.1), mat, dx * 0.46, h / 2, dz * 0.46));
}
/**
 * Where a bed meets a planted neighbour of another kind (a garden beside a meadow or puffcap): a
 * strip of grass carries the ground across at grass height, with a few blades and a daisy, so the
 * two run together with no edging and no step between them.
 */
function seamStrips(g, mix, R) {
  for (const [bit, dx, dz] of SIDES) if (mix & bit) {
    const st = mk(new THREE.BoxGeometry(dx ? 0.16 : 0.84, 0.035, dz ? 0.16 : 0.84), T('#9fcb7c', 'grass'), dx * 0.43, 0.0175, dz * 0.43); st.userData.base = true; g.add(st);
    for (let k = 0; k < 3; k++) { const t = (R() - 0.5) * 0.7, o = 0.4 + R() * 0.08; g.add(blade(pick(['#86b86a', '#a8cf86'], R), 0.12 + R() * 0.08, dx ? dx * o : t, dz ? dz * o : t, R)); }
    const t = (R() - 0.5) * 0.6, f = makeFlower('#ffffff', 0.6, R); f.position.set(dx ? dx * 0.44 : t, 0.035, dz ? dz * 0.44 : t); g.add(f);
  }
}
/** Points along a bed's open edges (all round when it stands alone), n to a side: [x, z, angle]. */
function edgePoints(mask, n, r = 0.42) {
  const out = [];
  if (!mask) { for (let k = 0; k < n * 4; k++) { const a = k / (n * 4) * Math.PI * 2; out.push([Math.cos(a) * r, Math.sin(a) * r, a]); } return out; }
  for (const [bit, dx, dz] of SIDES) if (!(mask & bit)) for (let k = 0; k < n; k++) { const t = (k + 0.5) / n * 0.84 - 0.42; out.push([dx ? dx * r : t, dz ? dz * r : t, Math.atan2(dz, dx)]); }
  return out;
}
/**
 * A garden, one of four kinds chosen by its seed (like the houses): a flowerbed edged with stones,
 * a vegetable patch with cabbages, carrots and a pumpkin, a fairy ring of spotted toadstools among
 * bluebells, or a rose arbour with a little bench. mask joins it to gardens beside it (1 east, 2
 * west, 4 south, 8 north): the beds run together and the edging only rings the outside. Its
 * flowers and crops (userData.flowers, each with a threshold th) open one by one as it grows.
 */
function makeGarden(seed, kind, mask = 0, mix = 0) {
  const R = mrand(seed + 5), g = new THREE.Group(), flowers = [];
  kind = kind || gardenKind(seed); R();
  const grow = (m, th) => { m.userData.th = th; g.add(m); flowers.push(m); };
  const fill = (n) => { const out = []; for (let k = 0; k < n; k++) { let x = (R() - 0.5) * 0.66, z = (R() - 0.5) * 0.66; if (!mask) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.32; x = Math.cos(a) * r; z = Math.sin(a) * r; } for (const [bit, dx, dz] of SIDES) if ((mask & bit) && R() < 0.35) { if (dx) x = dx * (0.3 + R() * 0.18); else z = dz * (0.3 + R() * 0.18); } out.push([x, z]); } return out; };
  if (kind === 'bed') {
    joinedBase(g, mask, T('#8d6450', 'dirt'), 0.07, 0.4, mask & ~mix);
    for (const [x, z] of edgePoints(mask, 4, 0.43)) g.add(mk(new THREE.DodecahedronGeometry(0.045 + R() * 0.015, 0), T(pick(['#e6dcd0', '#d9d1e0', '#f1ece6'], R), 'stone'), x, 0.05, z));
    const cols = [pick(PAL.flower, R), pick(PAL.flower, R), pick(PAL.flower, R)];
    fill(13).forEach(([x, z], k) => { const f = makeFlower(cols[k % 3], 0.8 + R() * 0.5, R); f.position.set(x, 0.06, z); grow(f, k / 13); });
  } else if (kind === 'veg') {
    joinedBase(g, mask, T('#7a5442', 'dirt'), 0.08, 0.42, mask & ~mix);
    const ex = (mask & 1 ? 0.08 : 0) + (mask & 2 ? 0.08 : 0), ox = ((mask & 1 ? 0.08 : 0) - (mask & 2 ? 0.08 : 0)) / 2;
    for (const z of [-0.22, 0, 0.22]) g.add(mk(new THREE.BoxGeometry(0.7 + ex, 0.04, 0.1), T('#8d6450', 'dirt'), ox, 0.09, z));
    for (const [bit, dx, dz] of SIDES) if (!(mask & bit)) { // a little fence on each open side
      for (let k = 0; k < 3; k++) { const t = (k - 1) * 0.36; g.add(mk(new THREE.BoxGeometry(0.035, 0.12, 0.035), T(PAL.wood, 'wood'), dx ? dx * 0.42 : t, 0.1, dz ? dz * 0.42 : t)); }
      g.add(mk(new THREE.BoxGeometry(dx ? 0.02 : 0.76, 0.02, dz ? 0.02 : 0.76), T(PAL.wood, 'wood'), dx * 0.42, 0.14, dz * 0.42));
    }
    let n = 0;
    for (let k = 0; k < 4; k++) { const c = new THREE.Group(); c.position.set(-0.27 + k * 0.18, 0.11, -0.22); for (let l = 0; l < 5; l++) { const lf = mk(new THREE.SphereGeometry(0.045, 8, 6), MS(l ? '#8fc76a' : '#bfe39a'), Math.cos(l) * (l ? 0.03 : 0), 0.03 + (l ? 0 : 0.015), Math.sin(l) * (l ? 0.03 : 0)); lf.scale.y = 0.7; c.add(lf); } grow(c, n++ / 10); }
    for (let k = 0; k < 4; k++) { const c = new THREE.Group(); c.position.set(-0.27 + k * 0.18, 0.11, 0); c.add(mk(new THREE.ConeGeometry(0.02, 0.06, 6), MS('#f2a65a'), 0, 0.01, 0)); for (let l = 0; l < 3; l++) { const t = mk(new THREE.ConeGeometry(0.012, 0.09, 4), MS('#6fae5a'), (l - 1) * 0.012, 0.08, 0); t.rotation.z = (l - 1) * 0.3; c.add(t); } grow(c, n++ / 10); }
    const pk = new THREE.Group(); pk.position.set(0.12, 0.11, 0.22);
    for (let l = 0; l < 6; l++) { const a = l / 6 * Math.PI * 2, s2 = mk(new THREE.SphereGeometry(0.05, 10, 8), MS('#f0a35e'), Math.cos(a) * 0.035, 0.04, Math.sin(a) * 0.035); s2.scale.set(0.7, 0.85, 0.7); pk.add(s2); }
    pk.add(mk(new THREE.CylinderGeometry(0.008, 0.01, 0.04, 5), MS('#6aa85a'), 0, 0.1, 0)); grow(pk, 0.85);
  } else if (kind === 'ring') {
    joinedBase(g, mask, T('#9fcb7c', 'grass'), 0.035, 0.44, mask & ~mix);
    edgePoints(mask, 2, 0.34).forEach(([x, z], k) => {
      const t = new THREE.Group(), h = 0.06 + R() * 0.06, cap = pick(['#e9849f', '#f2a6c4', '#c96f78', '#b9a3f0'], R);
      t.position.set(x, 0.03, z);
      t.add(mk(new THREE.CylinderGeometry(0.016, 0.02, h, 8), MS('#fbf1e2'), 0, h / 2, 0));
      const cp = mk(new THREE.SphereGeometry(0.045, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), MS(cap), 0, h, 0); cp.scale.y = 0.75; t.add(cp);
      for (let d = 0; d < 3; d++) t.add(mk(new THREE.SphereGeometry(0.008, 6, 4), MS('#ffffff'), Math.cos(d * 2.1) * 0.025, h + 0.025, Math.sin(d * 2.1) * 0.025));
      grow(t, (k % 9) / 9 * 0.7);
    });
    fill(6).forEach(([x, z], k) => { const f = makeFlower(pick(['#8fb4f2', '#a8c4ff', '#c9a7f2'], R), 0.75, R); f.position.set(x * 0.7, 0.03, z * 0.7); grow(f, 0.3 + k / 9); });
    const glw = glow('#d6c2ff', 0.6, 0.35); glw.position.y = 0.15; g.add(glw);
  } else {
    joinedBase(g, mask, T('#d8c8b0', 'stone'), 0.05, 0.4, mask & ~mix);
    const arch = new THREE.Group(); arch.position.z = -0.18; g.add(arch);
    for (const x of [-0.3, 0.3]) arch.add(mk(new THREE.BoxGeometry(0.04, 0.55, 0.04), T(FAIRY.trim, 'wood'), x, 0.3, 0));
    arch.add(mk(new THREE.TorusGeometry(0.3, 0.022, 6, 20, Math.PI), T(FAIRY.trim, 'wood'), 0, 0.57, 0));
    g.add(mk(new THREE.BoxGeometry(0.4, 0.03, 0.12), T(PAL.wood, 'wood'), 0, 0.14, 0.12));
    for (const x of [-0.17, 0.17]) g.add(mk(new THREE.BoxGeometry(0.03, 0.12, 0.1), T(PAL.woodDark, 'wood'), x, 0.07, 0.12));
    const rose = pick(['#e9849f', '#f4b6c8', '#ff9f7a', '#ffffff'], R);
    for (let k = 0; k < 14; k++) {
      const a = k / 13 * Math.PI, side = k % 2 ? 1 : -1, x = k < 4 ? side * 0.3 : Math.cos(a) * 0.3, y = k < 4 ? 0.15 + k * 0.1 : 0.57 + Math.sin(a) * 0.3;
      g.add(mk(new THREE.IcosahedronGeometry(0.045 + R() * 0.02, 1), MS(pick(PAL.leaf, R)), x, y, -0.18 + (R() - 0.5) * 0.06));
      if (k % 2 === 0) { const r2 = new THREE.Group(); r2.position.set(x, y + 0.02, -0.14); for (let p2 = 0; p2 < 4; p2++) r2.add(mk(new THREE.SphereGeometry(0.02, 8, 6), MS(rose), Math.cos(p2 * 1.6) * 0.012, p2 * 0.004, Math.sin(p2 * 1.6) * 0.012)); grow(r2, k / 14); }
    }
    edgePoints(mask, 2, 0.36).filter(([, z]) => z > -0.1).forEach(([x, z], k) => { const f = makeFlower(pick(PAL.flower, R), 0.7, R); f.position.set(x, 0.05, z); grow(f, 0.5 + (k % 5) / 10); });
  }
  seamStrips(g, mix, R);
  g.userData.flowers = flowers; g.userData.kind = kind;
  return g;
}

/**
 * A meadow, one of four kinds chosen by its seed: tall wild grass with daisies and poppies, a
 * lavender field in soft rows, clover with a toadstool cluster and a fallen log, or a patch of
 * sunflowers and bluebells. mask joins it to meadows beside it: the grass runs on with no edge.
 */
function makeMeadow(seed, kind, mask = 0, mix = 0, shelter = false) {
  const R = mrand(seed + 9), g = new THREE.Group();
  kind = kind || meadowKind(seed); R();
  joinedBase(g, mask, T(kind === 'clover' ? '#9fcf80' : '#a9d184', 'grass'), 0.035, 0.46);
  const spot = () => { let x, z; if (!mask) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.42; x = Math.cos(a) * r; z = Math.sin(a) * r; } else { x = (R() - 0.5) * 0.84; z = (R() - 0.5) * 0.84; for (const [bit, dx, dz] of SIDES) if ((mask & bit) && R() < 0.4) { if (dx) x = dx * (0.3 + R() * 0.2); else z = dz * (0.3 + R() * 0.2); } } return [x, z]; };
  if (kind === 'wild') {
    for (let k = 0; k < 22; k++) { const [x, z] = spot(); g.add(blade(pick(['#86b86a', '#a8cf86', '#9fcb7c', '#c2d98a'], R), 0.2 + R() * 0.18, x, z, R)); }
    for (let k = 0; k < 8; k++) { const [x, z] = spot(), f = makeFlower(k % 3 ? '#ffffff' : '#ff8a7a', 0.65 + R() * 0.4, R); f.position.set(x, 0.03, z); g.add(f); }
  } else if (kind === 'lavender') {
    const xr = [mask & 2 ? -3 : -2, mask & 1 ? 3 : 2], zr = [mask & 8 ? -2 : -1, mask & 4 ? 2 : 1];
    for (let row = zr[0]; row <= zr[1]; row++) for (let k = xr[0]; k <= xr[1]; k++) {
      const x = k * 0.17, z = row * 0.26; if (Math.abs(x) > 0.5 || Math.abs(z) > 0.52) continue;
      if (!mask && Math.abs(x) + Math.abs(z) >= 0.6) continue;
      const b = new THREE.Group(); b.position.set(x, 0.03, z);
      b.add(mk(new THREE.SphereGeometry(0.075, 10, 6), MS('#8fae7a'), 0, 0.04, 0));
      for (let l = 0; l < 6; l++) { const a = l / 6 * Math.PI * 2, sp = mk(new THREE.CapsuleGeometry(0.014, 0.07, 3, 6), MS(pick(['#b9a3f0', '#a48ae0', '#c9b4ff'], R)), Math.cos(a) * 0.04, 0.14 + R() * 0.03, Math.sin(a) * 0.04); sp.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); b.add(sp); }
      g.add(b);
    }
  } else if (kind === 'clover') {
    for (let k = 0; k < 18; k++) { const [x, z] = spot(), c = new THREE.Group(); c.position.set(x, 0.04, z); for (let l = 0; l < 3; l++) { const lf = mk(new THREE.SphereGeometry(0.022, 8, 6), MS('#6fae5a'), Math.cos(l * 2.1) * 0.02, 0, Math.sin(l * 2.1) * 0.02); lf.scale.y = 0.3; c.add(lf); } g.add(c); }
    for (let k = 0; k < 6; k++) { const [x, z] = spot(), f = makeFlower(k % 2 ? '#ffffff' : '#f4b6c8', 0.5, R); f.position.set(x, 0.03, z); g.add(f); }
    if (!(mask & 4)) { const logm = mk(new THREE.CylinderGeometry(0.05, 0.055, 0.42, 10), T(PAL.wood, 'bark'), 0.1, 0.06, 0.18); logm.rotation.z = Math.PI / 2; logm.rotation.y = 0.4; g.add(logm); }
    for (let k = 0; k < 3; k++) { const h = 0.05 + k * 0.025, x = -0.2 + k * 0.05, z = -0.12 + (k % 2) * 0.05; g.add(mk(new THREE.CylinderGeometry(0.012, 0.015, h, 6), MS('#fbf1e2'), x, 0.03 + h / 2, z)); const cp = mk(new THREE.SphereGeometry(0.035 - k * 0.006, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), MS('#e9849f'), x, 0.03 + h, z); cp.scale.y = 0.75; g.add(cp); }
  } else {
    for (let k = 0; k < 12; k++) { const [x, z] = spot(); g.add(blade(pick(['#86b86a', '#9fcb7c'], R), 0.16 + R() * 0.1, x, z, R)); }
    for (let k = 0; k < 3; k++) {
      const s2 = new THREE.Group(), h = 0.32 + R() * 0.12; s2.position.set(-0.18 + k * 0.17, 0.03, -0.1 + (k % 2) * 0.12);
      s2.add(mk(new THREE.CylinderGeometry(0.01, 0.014, h, 5), MS('#6aa85a'), 0, h / 2, 0));
      for (const sd of [-1, 1]) { const lf = mk(new THREE.SphereGeometry(0.035, 8, 6), MS('#86b86a'), sd * 0.03, h * 0.5, 0); lf.scale.set(1, 0.3, 0.6); lf.rotation.z = sd * 0.5; s2.add(lf); }
      const hd = new THREE.Group(); hd.position.y = h; hd.rotation.x = 0.5; s2.add(hd);
      for (let p2 = 0; p2 < 10; p2++) { const a = p2 / 10 * Math.PI * 2, pt = mk(new THREE.SphereGeometry(0.02, 6, 4), MS('#ffd36e'), Math.cos(a) * 0.045, 0, Math.sin(a) * 0.045); pt.scale.set(1.4, 0.35, 0.8); pt.rotation.y = -a; hd.add(pt); }
      const ctr = mk(new THREE.SphereGeometry(0.03, 10, 6), MS('#7a4e3a'), 0, 0.008, 0); ctr.scale.y = 0.5; hd.add(ctr);
      g.add(s2);
    }
    for (let k = 0; k < 7; k++) { const [x, z] = spot(), f = makeFlower('#8fb4f2', 0.55, R); f.position.set(x, 0.03, z); g.add(f); }
  }
  for (const [bit, dx, dz] of SIDES) if (mix & bit) for (let k = 0; k < 2; k++) { // flowers from the neighbouring bed stray across the seam
    const t = (R() - 0.5) * 0.7, o = 0.38 + R() * 0.1, f = makeFlower(pick([...PAL.flower, '#c9a7f2'], R), 0.6, R); f.position.set(dx ? dx * o : t, 0.03, dz ? dz * o : t); g.add(f);
  }
  if (shelter) {
    // nothing grows through the shelter: clear the plants from its corner of the meadow
    for (const c of [...g.children]) if (!c.userData.base && c.position.x > -0.46 && c.position.x < 0.16 && c.position.z > -0.42 && c.position.z < 0.04) g.remove(c);
    const sh = makeShelter(); sh.position.set(-0.14, 0, -0.17); g.add(sh);
    g.userData.shelter = { door: [-0.14, 0.12], beds: [[-0.24, -0.18], [-0.04, -0.18]] };
    g.userData.anim = (t, night) => { sh.userData.halo.material.opacity = (0.1 + night * 0.55) * (1 + 0.1 * Math.sin(t * 2.3)); sh.userData.lamp.emissiveIntensity = 0.3 + night * 0.9; };
  }
  g.userData.kind = kind;
  return g;
}
/** A canvas texture drawn once by fn(context, width, height). */
function canvasTex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
/** A night-sky planet (art director's spec): amberwhorl (banded, ringed), frostling (ice), rosemoon (craters), twinlets (a pair). */
function cosmosPlanetTex(kind) {
  const TAU = Math.PI * 2, R = mrand(kind.length * 97);
  return canvasTex(256, 256, (g) => {
    const disc = (x, y, r, paint) => {
      g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip(); paint();
      const sh = g.createRadialGradient(x + r * 0.35, y - r * 0.35, r * 0.2, x - r * 0.2, y + r * 0.2, r * 1.25); sh.addColorStop(0, 'rgba(40,20,60,0)'); sh.addColorStop(1, 'rgba(40,20,60,0.4)'); g.fillStyle = sh; g.fillRect(x - r, y - r, r * 2, r * 2);
      g.restore(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.strokeStyle = 'rgba(255,240,250,0.4)'; g.lineWidth = 2; g.stroke();
    };
    if (kind === 'amberwhorl') {
      const ring = front => { g.beginPath(); g.ellipse(128, 128, 133, 32, -0.25, front ? 0 : Math.PI, front ? Math.PI : TAU); g.strokeStyle = 'rgba(255,240,220,0.55)'; g.lineWidth = 6; g.stroke(); };
      ring(false);
      disc(128, 128, 70, () => { const b = ['#ffe6cc', '#ffd2b0', '#f5b49a']; for (let k = 0; k < 7; k++) { g.fillStyle = b[k % 3]; g.beginPath(); g.moveTo(58, 198); for (let x = 58; x <= 198; x += 4) g.lineTo(x, 58 + k * 20 + Math.sin(x * 0.08 + k) * 3); g.lineTo(198, 198); g.fill(); } });
      ring(true);
    } else if (kind === 'frostling') {
      const h = g.createRadialGradient(128, 128, 80, 128, 128, 112); h.addColorStop(0, 'rgba(95,184,201,0.25)'); h.addColorStop(1, 'rgba(95,184,201,0)'); g.fillStyle = h; g.fillRect(0, 0, 256, 256);
      disc(128, 128, 88, () => { const gr = g.createRadialGradient(110, 100, 10, 128, 128, 88); gr.addColorStop(0, '#bff0ec'); gr.addColorStop(0.5, '#9fe3e0'); gr.addColorStop(1, '#5fb8c9'); g.fillStyle = gr; g.fillRect(40, 40, 176, 176);
        const cap = g.createRadialGradient(128, 44, 4, 128, 44, 46); cap.addColorStop(0, 'rgba(255,255,255,0.6)'); cap.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = cap; g.fillRect(40, 0, 176, 100); });
    } else if (kind === 'rosemoon') {
      disc(128, 128, 88, () => { g.fillStyle = '#f2b8c8'; g.fillRect(40, 40, 176, 176);
        for (let k = 0; k < 9; k++) { const x = 70 + R() * 116, y = 70 + R() * 116, r = 4 + R() * 14; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = '#d995ad'; g.fill(); g.beginPath(); g.arc(x, y, r, 0.1, 1.6); g.strokeStyle = '#ffe0ea'; g.lineWidth = 1.5; g.stroke(); } });
    } else {
      disc(100, 136, 40, () => { g.fillStyle = '#c9b8ff'; g.fillRect(60, 96, 80, 80); });
      disc(170, 112, 26, () => { g.fillStyle = '#ffd9b8'; g.fillRect(144, 86, 52, 52); });
    }
  });
}
/** The Still Eye: a soft dark core with a glowing lavender-peach ring and a gentle lensing halo (never pure black). */
function stillEyeTex() {
  return canvasTex(512, 512, (g) => {
    const c = 256, r = 250, TAU = Math.PI * 2;
    let gr = g.createRadialGradient(c, c, 0, c, c, r); gr.addColorStop(0, 'rgba(200,180,255,0)'); gr.addColorStop(0.55, 'rgba(200,180,255,0.22)'); gr.addColorStop(1, 'rgba(200,180,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    gr = g.createRadialGradient(c, c, r * 0.32, c, c, r * 0.52); gr.addColorStop(0, 'rgba(255,201,168,0.85)'); gr.addColorStop(1, 'rgba(185,162,255,0)');
    g.beginPath(); g.arc(c, c, r * 0.52, 0, TAU); g.arc(c, c, r * 0.32, 0, TAU, true); g.fillStyle = gr; g.fill();
    g.save(); g.beginPath(); g.arc(c, c, r * 0.52, 0, TAU); g.arc(c, c, r * 0.32, 0, TAU, true); g.clip();
    const sw = g.createLinearGradient(c - r * 0.52, 0, c + r * 0.52, 0); sw.addColorStop(0, 'rgba(255,241,228,0.4)'); sw.addColorStop(0.5, 'rgba(255,241,228,0)'); g.fillStyle = sw; g.fillRect(0, 0, 512, 512); g.restore();
    g.beginPath(); g.arc(c, c, r * 0.42, 0, TAU); g.strokeStyle = 'rgba(255,231,240,0.5)'; g.lineWidth = 2; g.stroke();
    gr = g.createRadialGradient(c, c, r * 0.27, c, c, r * 0.31); gr.addColorStop(0, 'rgba(26,20,48,1)'); gr.addColorStop(1, 'rgba(26,20,48,0)'); g.beginPath(); g.arc(c, c, r * 0.31, 0, TAU); g.fillStyle = gr; g.fill();
  });
}
/** A falling star's streak: a soft round head at the right, a fading tail to the left. */
function meteorTex() {
  return canvasTex(128, 16, (g) => {
    const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(255,244,232,0)'); gr.addColorStop(0.85, 'rgba(255,244,232,0.8)'); gr.addColorStop(1, 'rgba(255,244,232,0)');
    g.fillStyle = gr; g.fillRect(0, 5, 128, 6);
    const h = g.createRadialGradient(118, 8, 0, 118, 8, 6); h.addColorStop(0, 'rgba(255,255,255,1)'); h.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = h; g.fillRect(108, 0, 20, 16);
  });
}
/** A soft nebula cloud: many faint round blobs of one colour. */
function nebulaTex(col, seed) {
  const R = mrand(seed);
  return canvasTex(256, 256, (g) => {
    for (let k = 0; k < 30; k++) { const x = 60 + R() * 136, y = 60 + R() * 136, r = 30 + R() * 60, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col.replace('A', String(0.05 + R() * 0.07))); gr.addColorStop(1, col.replace('A', '0')); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
  });
}
/** A comet: a bright head and a tapering tail. */
function cometTex() {
  return canvasTex(256, 64, (g) => {
    const gr = g.createLinearGradient(0, 0, 230, 0); gr.addColorStop(0, 'rgba(191,240,240,0)'); gr.addColorStop(1, 'rgba(191,240,240,0.7)');
    g.beginPath(); g.moveTo(0, 32); g.lineTo(230, 22); g.lineTo(230, 42); g.closePath(); g.fillStyle = gr; g.fill();
    const h = g.createRadialGradient(232, 32, 0, 232, 32, 14); h.addColorStop(0, 'rgba(244,251,255,1)'); h.addColorStop(1, 'rgba(244,251,255,0)'); g.fillStyle = h; g.fillRect(210, 10, 46, 44);
  });
}
let _meadowGround;
/**
 * A 2x2 meadow (art director's and game designer's spec): a soft domed patch of sunlit grass with a
 * rounded, wavy outline that fades into the island grass, a feathered rim of tufts and tiny flowers,
 * a worn path from the shelter's door, a few pebbles, and the fluffkins' shelter (bigger, a door mat,
 * a little fence) in the back-left. The plants are one of four kinds (wild, lavender, clover, sunny)
 * and grow in outward from the hut: each wraps in a group at the ground with userData.th (when it
 * starts, 0..1); a just-planted meadow shows tilled patches with sprouts (userData.soil), which the
 * grass closes over. The ground, rim, path, pebbles and shelter are full size from the start.
 */
function makeMeadow2(seed, kind) {
  const R = mrand(seed + 9), g = new THREE.Group(); kind = kind || meadowKind(seed); R();
  const p1 = R() * 6.28, p2 = R() * 6.28, rad = a => 0.86 + 0.045 * Math.sin(3 * a + p1) + 0.025 * Math.sin(5 * a + p2);
  const groundY = (x, z) => { const d = Math.hypot(x, z) / rad(Math.atan2(z, x)); return 0.01 + 0.045 * Math.max(0, 1 - d * d); };
  // the ground: a fan of rings from the dome's top to a skirt that sinks just under the island grass
  const SEG = 48, F = [0, 0.35, 0.7, 1.0], H = [0.055, 0.048, 0.032, 0.01], J = [0, 1, 2].map(() => Array.from({ length: SEG }, () => (R() - 0.5) * 0.008));
  const cols = [kind === 'clover' ? '#a9d58a' : '#c4df94', '#b9da8a', '#acd386', '#86b36a', '#93bf72'].map(h => new THREE.Color(h)); // a darker trodden ring at the rim sets each meadow apart
  const pt = (k, n) => { n %= SEG; const a = n / SEG * Math.PI * 2; if (!k) return [0, H[0], 0]; const r = k === 4 ? rad(a) + 0.05 : rad(a) * F[k], y = k === 4 ? -0.01 : H[k] + (k < 3 ? J[k][n] : 0); return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  const pos = [], col = [], uv = [], put = (k, n) => { const q = pt(k, n); pos.push(...q); uv.push(q[0] * 0.8 + 0.5, q[2] * 0.8 + 0.5); col.push(cols[k].r, cols[k].g, cols[k].b); };
  for (let n = 0; n < SEG; n++) { put(0, n); put(1, n + 1); put(1, n); for (let k = 1; k < 4; k++) { put(k, n); put(k, n + 1); put(k + 1, n); put(k, n + 1); put(k + 1, n + 1); put(k + 1, n); } }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.computeVertexNormals();
  _meadowGround ||= new THREE.MeshLambertMaterial({ map: ptex('grass'), vertexColors: true, flatShading: true });
  const ground = new THREE.Mesh(gg, _meadowGround); ground.receiveShadow = true; ground.userData.base = true; g.add(ground);
  const base = (o, x, z, dy = 0) => { o.position.set(x, groundY(x, z) + dy, z); o.userData.base = true; g.add(o); return o; };
  // the feathered rim: tufts and tiny flowers
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + R() * 0.2, r = rad(a) - 0.03, t = new THREE.Group(); for (let b = 0; b < 3; b++) t.add(blade(pick(['#86b86a', '#a8cf86', '#c2d98a'], R), 0.08 + R() * 0.06, (R() - 0.5) * 0.06, (R() - 0.5) * 0.06, R)); base(t, Math.cos(a) * r, Math.sin(a) * r); }
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2, r = rad(a) - 0.06; base(makeFlower(pick(['#ffffff', '#f4b6c8', '#c9a7f2'], R), 0.45, R), Math.cos(a) * r, Math.sin(a) * r); }
  // a loose border of soft round stones along the rim (gaps at the path), so meadows side by side read as two
  const rimStone = MS('#dcd3e3');
  for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2 + (R() - 0.5) * 0.12; if (Math.abs(((a - 1.45) % 6.283 + 6.283) % 6.283 - 3.14) > 2.9) continue; const r = rad(a) + 0.01, s = mk(new THREE.DodecahedronGeometry(0.035 + R() * 0.02, 1), rimStone, 0, 0, 0); s.scale.y = 0.6; base(s, Math.cos(a) * r, Math.sin(a) * r, 0.01); }
  // the worn path from the door, and pebbles
  const dirt = T('#c9a27e', 'dirt');
  [[-0.48, -0.18], [-0.36, 0.12], [-0.14, 0.4], [0.08, 0.66]].forEach(([x, z], k) => { const s = 0.075 + R() * 0.02, d = mk(new THREE.CylinderGeometry(s, s, 0.012, 8), dirt, 0, 0, 0); d.rotation.y = R() * 3; d.scale.set(1 - k * 0.08, 1, 0.7 * (1 - k * 0.08)); base(d, x, z, 0.004); });
  const peb = MS('#e6dcd0');
  for (const [x, z] of [[-0.3, -0.02], [-0.02, 0.5], [0.7, 0.1], [0.3, -0.72], [-0.75, 0.35]]) { const p = mk(new THREE.DodecahedronGeometry(0.03 + R() * 0.015, 1), peb, 0, 0, 0); p.scale.y = 0.55; base(p, x, z, 0.01); }
  // the shelter, a door mat and a little fence behind it
  const hut = new THREE.Group(), sh = makeShelter(); hut.add(sh);
  const mat = mk(new THREE.CylinderGeometry(0.17 / 1.3, 0.18 / 1.3, 0.014, 12), T('#e8cf8e', 'straw'), 0, 0.007, 0.26); mat.scale.z = 0.65; hut.add(mat);
  const tops = [];
  for (const deg of [200, 235, 270]) { const a = deg * Math.PI / 180, x = Math.cos(a) * 0.33, z = Math.sin(a) * 0.33; hut.add(mk(new THREE.CylinderGeometry(0.02, 0.022, 0.12, 6), T('#8a5f45', 'wood'), x, 0.06, z)); hut.add(mk(new THREE.SphereGeometry(0.024, 8, 6), T('#a8826a', 'wood'), x, 0.125, z)); tops.push(new THREE.Vector3(x, 0.1, z)); }
  hut.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([tops[0], tops[0].clone().lerp(tops[1], 0.5).add(new THREE.Vector3(0, -0.025, 0)), tops[1], tops[1].clone().lerp(tops[2], 0.5).add(new THREE.Vector3(0, -0.025, 0)), tops[2]]), 12, 0.006, 4, false), MS('#e6d3b0')));
  hut.scale.setScalar(1.3); hut.rotation.y = 0.35; base(hut, -0.42, -0.42, -0.01);
  g.userData.anim = (t, night) => { sh.userData.halo.material.opacity = (0.1 + night * 0.55) * (1 + 0.1 * Math.sin(t * 2.3)); sh.userData.lamp.emissiveIntensity = 0.3 + night * 0.9; };
  // the plants: by kind, kept out of the hut's corner and the fluffkin's clearing; they fill in outward from the hut
  const plants = [], soil = [];
  const free = (x, z) => Math.hypot(x + 0.42, z + 0.42) > 0.42 && Math.hypot(x + 0.15, z - 0.15) > 0.28;
  const spot = () => { let x = 0, z = 0; for (let t = 0; t < 8; t++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 0.92 * rad(a); x = Math.cos(a) * d; z = Math.sin(a) * d; if (free(x, z)) break; } return [x, z]; };
  const plant = (o, x, z) => { const w = new THREE.Group(); w.add(o); w.position.set(x, groundY(x, z), z); w.userData.th = Math.max(0, Math.min(0.95, 0.05 + 0.8 * Math.hypot(x + 0.5, z + 0.5) / 1.9 + (R() - 0.5) * 0.12)); g.add(w); plants.push(w); return w; };
  const bladeAt = (cc, h) => { const [x, z] = spot(); plant(blade(cc, h, 0, 0, R), x, z); };
  const flowerAt = (cc, s) => { const [x, z] = spot(); plant(makeFlower(cc, s, R), x, z); };
  if (kind === 'wild') {
    for (let k = 0; k < 46; k++) bladeAt(pick(['#86b86a', '#a8cf86', '#9fcb7c', '#c2d98a'], R), 0.24 + R() * 0.2);
    for (let k = 0; k < 16; k++) flowerAt(k < 2 ? '#ffd36e' : k % 3 ? '#ffffff' : '#ff8a7a', 0.8 + R() * 0.4);
  } else if (kind === 'lavender') {
    [-0.66, -0.33, 0, 0.33, 0.66].forEach((z, row) => { for (let x = -0.96 + (row % 2) * 0.12; x <= 0.96; x += 0.24) {
      if (Math.hypot(x, z) > rad(Math.atan2(z, x)) - 0.1 || !free(x, z)) continue;
      const b = new THREE.Group(); b.add(mk(new THREE.SphereGeometry(0.095, 10, 6), MS('#8fae7a'), 0, 0.05, 0));
      for (let l = 0; l < 8; l++) { const a = l / 8 * Math.PI * 2, sp = mk(new THREE.CapsuleGeometry(0.018, 0.09, 3, 6), MS(pick(['#b9a3f0', '#a48ae0', '#c9b4ff'], R)), Math.cos(a) * 0.05, 0.17 + R() * 0.03, Math.sin(a) * 0.05); sp.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); b.add(sp); }
      plant(b, x, z);
    } });
  } else if (kind === 'clover') {
    for (let k = 0; k < 40; k++) { const c = new THREE.Group(); for (let l = 0; l < 3; l++) { const lf = mk(new THREE.SphereGeometry(0.028, 8, 6), MS('#6fae5a'), Math.cos(l * 2.1) * 0.025, 0.012, Math.sin(l * 2.1) * 0.025); lf.scale.y = 0.3; c.add(lf); } const [x, z] = spot(); plant(c, x, z); }
    for (let k = 0; k < 12; k++) flowerAt(k % 2 ? '#ffffff' : '#f4b6c8', 0.6);
    for (const [tx, tz] of [[0.55, -0.5], [0.62, 0.42]]) { const tr = new THREE.Group();
      for (let k = 0; k < 3; k++) { const h = 0.06 + k * 0.03, x = (k - 1) * 0.06, z = (k % 2) * 0.05; tr.add(mk(new THREE.CylinderGeometry(0.014, 0.018, h, 6), MS('#fbf1e2'), x, h / 2, z)); const cp = mk(new THREE.SphereGeometry(0.045 - k * 0.006, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), MS('#e9849f'), x, h, z); cp.scale.y = 0.75; tr.add(cp); }
      plant(tr, tx, tz); }
    const lg = new THREE.Group(), lm = mk(new THREE.CylinderGeometry(0.065, 0.07, 0.6, 10), T(PAL.wood, 'bark'), 0, 0.065, 0); lm.rotation.z = Math.PI / 2; lg.add(lm);
    for (const sx of [-0.3, 0.3]) { const e = mk(new THREE.SphereGeometry(0.066, 10, 6), MS('#e6c89a'), sx, 0.065, 0); e.scale.x = 0.25; lg.add(e); }
    lg.rotation.y = 0.45; plant(lg, 0.15, 0.55);
  } else {
    for (let k = 0; k < 7; k++) {
      const s2 = new THREE.Group(), h = 0.42 + R() * 0.18;
      s2.add(mk(new THREE.CylinderGeometry(0.012, 0.016, h, 5), MS('#6aa85a'), 0, h / 2, 0));
      for (const sd of [-1, 1]) { const lf = mk(new THREE.SphereGeometry(0.045, 8, 6), MS('#86b86a'), sd * 0.04, h * 0.5, 0); lf.scale.set(1, 0.3, 0.6); lf.rotation.z = sd * 0.5; s2.add(lf); }
      const hd = new THREE.Group(); hd.position.y = h; hd.rotation.x = 0.5; s2.add(hd);
      for (let q = 0; q < 12; q++) { const a = q / 12 * Math.PI * 2, pt2 = mk(new THREE.SphereGeometry(0.026, 6, 4), MS('#ffd36e'), Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06); pt2.scale.set(1.4, 0.35, 0.8); pt2.rotation.y = -a; hd.add(pt2); }
      const ctr = mk(new THREE.SphereGeometry(0.038, 10, 6), MS('#7a4e3a'), 0, 0.01, 0); ctr.scale.y = 0.5; hd.add(ctr);
      plant(s2, k / 6 * 0.75, -0.7 + 0.5 * Math.sin(k / 6 * Math.PI));
    }
    for (let k = 0; k < 22; k++) bladeAt(pick(['#86b86a', '#9fcb7c'], R), 0.18 + R() * 0.12);
    for (let k = 0; k < 14; k++) flowerAt('#8fb4f2', 0.65);
  }
  // a just-planted meadow: tilled patches with sprouts, closed over as the plants come
  const till = T('#a07a5c', 'dirt'), sprout = MS('#a8d98a');
  for (let k = 0; k < 6; k++) {
    const [x, z] = spot(), s = 0.14 + R() * 0.06, w = new THREE.Group(); w.add(mk(new THREE.CylinderGeometry(s, s, 0.012, 9), till, 0, 0.004, 0));
    for (let q = 0; q < 4; q++) { const sx = (R() - 0.5) * s * 1.2, sz = (R() - 0.5) * s * 1.2; for (const sd of [-1, 1]) { const lf = mk(new THREE.SphereGeometry(0.018, 6, 4), sprout, sx + sd * 0.012, 0.03, sz); lf.scale.y = 0.35; lf.rotation.z = sd * 0.5; w.add(lf); } }
    w.position.set(x, groundY(x, z), z); w.userData.soil = true; g.add(w); soil.push(w);
  }
  g.userData.plants = plants; g.userData.soil = soil; g.userData.kind = kind;
  g.userData.shelter = true;
  return g;
}
/**
 * The fluffkins' shelter: a little round straw hut on a meadow, open at the front (+z), with a
 * straw bed inside for two, a thatched roof with moss on top and a lantern hung from the eave.
 */
function makeShelter() {
  const g = new THREE.Group(), wood = T('#8a5f45', 'wood'), straw = T('#dcb56d', 'straw');
  g.add(mk(new THREE.CylinderGeometry(0.2, 0.21, 0.02, 14), T('#e8cf8e', 'straw'), 0, 0.04, -0.01));
  for (const [x, z, h] of [[-0.22, 0.02, 0.34], [0.22, 0.02, 0.34], [-0.17, -0.2, 0.3], [0.17, -0.2, 0.3]]) g.add(mk(new THREE.CylinderGeometry(0.02, 0.024, h, 6), wood, x, h / 2, z));
  const wall = mk(new THREE.CylinderGeometry(0.24, 0.25, 0.24, 14, 1, true, Math.PI / 2, Math.PI), new THREE.MeshLambertMaterial({ color: '#dcb56d', map: ptex('straw'), side: THREE.DoubleSide, flatShading: true }), 0, 0.12, -0.02); g.add(wall);
  const roof = mk(new THREE.ConeGeometry(0.32, 0.22, 8), straw, 0, 0.44, -0.04); g.add(roof);
  const band = mk(new THREE.TorusGeometry(0.3, 0.02, 4, 16), T('#c9a05a', 'straw'), 0, 0.34, -0.04); band.rotation.x = Math.PI / 2; g.add(band);
  for (const [x, z] of [[-0.1, -0.1], [0.08, -0.14], [0.02, 0.05]]) { const m = mk(new THREE.IcosahedronGeometry(0.04, 0), MS('#7cae6a'), x, 0.45 + (0.1 - Math.hypot(x, z)) * 0.5, z - 0.04); m.scale.y = 0.6; g.add(m); }
  g.add(mk(new THREE.SphereGeometry(0.025, 8, 6), MS('#fff6e8'), 0, 0.56, -0.04));
  g.add(mk(new THREE.CylinderGeometry(0.003, 0.003, 0.06, 4), wood, 0.2, 0.3, 0.04));
  const lamp = GM('#fff6e8', '#f5c76b', 0.3); g.add(mk(new THREE.BoxGeometry(0.045, 0.06, 0.045), lamp, 0.2, 0.25, 0.04));
  g.add(mk(new THREE.ConeGeometry(0.035, 0.03, 4), wood, 0.2, 0.295, 0.04));
  const halo = glow('#f5c76b', 0.5, 0); halo.position.set(0.2, 0.25, 0.06); g.add(halo);
  g.userData = { lamp, halo };
  return g;
}

/** A lantern post with a warm core and a halo that wakes at dusk. */
function makeLantern() {
  const g = new THREE.Group();
  g.add(mk(new THREE.CylinderGeometry(0.1, 0.12, 0.06, 6), PAL.stoneShade, 0, 0.03, 0));
  g.add(mk(new THREE.CylinderGeometry(0.03, 0.03, 0.85, 5), PAL.woodDark, 0, 0.45, 0));
  g.add(mk(new THREE.BoxGeometry(0.22, 0.03, 0.03), PAL.woodDark, 0.08, 0.86, 0));
  const core = mk(new THREE.BoxGeometry(0.11, 0.14, 0.11), M('#ffe2a0', '#ffc860', 0.6), 0.17, 0.74, 0);
  g.add(core);
  g.add(mk(new THREE.ConeGeometry(0.1, 0.08, 4), PAL.woodDark, 0.17, 0.85, 0));
  const halo = glow('#ffcf78', 1.3, 0); halo.position.set(0.17, 0.74, 0); g.add(halo);
  g.userData = { halo };
  return g;
}

/**
 * One bridge span on a cell. mask joins it to neighbours (1 east +x, 2 west, 4 south +z, 8 north):
 * planks reach toward each joined side, and rope rails close every open side, so runs can turn corners.
 */
function makeBridgeTile(mask = 3) {
  const g = new THREE.Group(), EW = mask & 3, NS = mask & 12;
  const alongX = EW || !NS; // planks run across the main direction
  for (let k = 0; k < 4; k++) {
    const o = -0.3 + k * 0.2, col = T(k % 2 ? PAL.wood : '#9a6c50', 'wood');
    g.add(alongX ? mk(new THREE.BoxGeometry(0.18, 0.06, 0.62), col, o, -0.02, 0) : mk(new THREE.BoxGeometry(0.62, 0.06, 0.18), col, 0, -0.02, o));
  }
  const arms = [[1, 0.42, 0, 0], [2, -0.42, 0, 0], [4, 0, 0.42, 1], [8, 0, -0.42, 1]];
  for (const [bit, x, z, ns] of arms) if (mask & bit) g.add(ns ? mk(new THREE.BoxGeometry(0.62, 0.06, 0.18), '#9a6c50', x, -0.02, z) : mk(new THREE.BoxGeometry(0.18, 0.06, 0.62), '#9a6c50', x, -0.02, z));
  for (const x of [-0.31, 0.31]) for (const z of [-0.31, 0.31]) g.add(mk(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 4), PAL.woodDark, x, 0.17, z));
  const rope = (x, z, alongXr) => { const r = mk(new THREE.CylinderGeometry(0.012, 0.012, 0.62, 3), '#e6d3b0', x, 0.32, z); if (alongXr) r.rotation.z = Math.PI / 2; else r.rotation.x = Math.PI / 2; g.add(r); };
  if (!(mask & 4)) rope(0, 0.31, true); if (!(mask & 8)) rope(0, -0.31, true);
  if (!(mask & 1)) rope(0.31, 0, false); if (!(mask & 2)) rope(-0.31, 0, false);
  g.add(mk(new THREE.BoxGeometry(0.7, 0.05, 0.06), PAL.woodDark, 0, -0.09, 0.25));
  g.add(mk(new THREE.BoxGeometry(0.7, 0.05, 0.06), PAL.woodDark, 0, -0.09, -0.25));
  return g;
}
function makeBridge() { return makeBridgeTile(3); }

const HAIR = ['#7a4e3a', '#e6b36a', '#b8694a', '#f2d7a0', '#5e4a6e', '#d98a9a', '#9a7ad0'];
/**
 * A sky-folk: a soft bell-shaped robe, a scarf with a trailing tail, a round face with shining
 * eyes and rosy cheeks, a cap of hair, little hands and feet, and a leafy sprout on top. Children
 * are small, with bigger heads and one sprout. userData.body sways and bobs as they walk.
 */
function makeFolk(kind, ci) {
  const g = new THREE.Group(), body = new THREE.Group(), child = kind === 'child', cloth = PAL.cloth[ci % PAL.cloth.length], scarfC = PAL.cloth[(ci + 3) % PAL.cloth.length];
  const robe = new THREE.LatheGeometry([[0, 0.05], [0.115, 0.05], [0.125, 0.08], [0.115, 0.15], [0.092, 0.23], [0.065, 0.285], [0, 0.3]].map(([x, y]) => new THREE.Vector2(x, y)), 18);
  body.add(mk(robe, MS(cloth)));
  const hem = mk(new THREE.TorusGeometry(0.118, 0.012, 5, 18), MS(scarfC), 0, 0.085, 0); hem.rotation.x = Math.PI / 2; body.add(hem);
  const scarf = mk(new THREE.TorusGeometry(0.07, 0.026, 6, 14), MS(scarfC), 0, 0.282, 0); scarf.rotation.x = Math.PI / 2; body.add(scarf);
  const tail = mk(new THREE.BoxGeometry(0.04, 0.1, 0.018), MS(scarfC), 0.045, 0.235, -0.07); tail.rotation.set(0.25, 0.3, 0.15); body.add(tail);
  const hs = child ? 1.18 : 1, hy = 0.4;
  const head = new THREE.Group(); head.position.y = hy; head.scale.setScalar(hs); body.add(head);
  head.add(mk(new THREE.SphereGeometry(0.105, 18, 14), MS(PAL.skin)));
  const hair = mk(new THREE.SphereGeometry(0.11, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), MS(HAIR[(ci * 3 + 1) % HAIR.length]), 0, 0.004, -0.008); hair.rotation.x = -0.35; head.add(hair);
  for (const x of [-0.036, 0.036]) {
    const e = mk(new THREE.SphereGeometry(0.017, 10, 8), MS('#3b2f4a'), x, -0.005, 0.093); e.scale.set(0.85, 1.15, 0.6); head.add(e);
    head.add(mk(new THREE.SphereGeometry(0.0055, 6, 4), MS('#ffffff'), x + 0.005, 0.003, 0.104));
    const ck = mk(new THREE.SphereGeometry(0.018, 8, 6), MS('#f6a9a6'), x * 1.75, -0.03, 0.08); ck.scale.set(1, 0.6, 0.4); head.add(ck);
  }
  const smile = mk(new THREE.TorusGeometry(0.014, 0.0035, 4, 10, Math.PI), MS('#a0565e'), 0, -0.035, 0.1); smile.rotation.z = Math.PI; head.add(smile);
  const leaf = (rz, x) => { const l = mk(new THREE.SphereGeometry(0.045, 10, 8), MS('#7cbf6a'), x + Math.sin(rz) * -0.03, 0.15, 0); l.scale.set(0.45, 1.25, 0.22); l.rotation.z = rz; return l; };
  head.add(mk(new THREE.CylinderGeometry(0.006, 0.008, 0.06, 5), MS('#6aa85a'), 0, 0.12, 0));
  if (child) head.add(leaf(0, 0)); else { head.add(leaf(0.55, -0.02)); head.add(leaf(-0.55, 0.02)); }
  const legs = [], arms = [];
  for (const x of [-0.045, 0.045]) { // a foot on a hip pivot: it steps forward and back under the robe
    const hip = new THREE.Group(); hip.position.set(x, 0.09, 0);
    hip.add(mk(new THREE.CylinderGeometry(0.016, 0.018, 0.06, 6), MS(PAL.woodDark), 0, -0.04, 0));
    const f = mk(new THREE.SphereGeometry(0.03, 10, 6), MS(PAL.woodDark), 0, -0.065, 0.022); f.scale.set(0.9, 0.55, 1.35); hip.add(f);
    body.add(hip); legs.push(hip);
  }
  for (const s2 of [-1, 1]) { // an arm on a shoulder pivot: it swings opposite the leg on its side
    const sh = new THREE.Group(); sh.position.set(s2 * 0.085, 0.255, 0); sh.rotation.z = s2 * 0.35;
    sh.add(mk(new THREE.CapsuleGeometry(0.022, 0.07, 3, 8), MS(cloth), 0, -0.05, 0.005));
    sh.add(mk(new THREE.SphereGeometry(0.022, 10, 8), MS(PAL.skin), 0, -0.1, 0.01));
    body.add(sh); arms.push(sh);
  }
  // an umbrella, held up in the right hand when they stay out in the rain (hidden otherwise)
  const umb = new THREE.Group(); umb.position.set(0.11, 0.17, 0.06); umb.rotation.z = -0.12; umb.visible = false; body.add(umb);
  const uc = ['#f4a6b8', '#a8c8f0', '#c8a4e8', '#f5c76b', '#9fd8c0', '#f7b892', '#d8c8ff'][(ci * 5 + 2) % 7], ut = ['#fff6e8', '#f4b6c8', '#c9a7f2'][ci % 3];
  umb.add(mk(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 5), MS(PAL.woodDark), 0, 0.25, 0));
  const hook = mk(new THREE.TorusGeometry(0.018, 0.006, 4, 10, Math.PI), MS(PAL.woodDark), -0.018, 0, 0); hook.rotation.z = Math.PI; umb.add(hook);
  const canopy = mk(new THREE.ConeGeometry(0.24, 0.12, 8, 1, true), new THREE.MeshLambertMaterial({ color: uc, side: THREE.DoubleSide, flatShading: true }), 0, 0.5, 0); umb.add(canopy);
  for (let k = 0; k < 8; k += 2) { const a = k / 8 * Math.PI * 2 + Math.PI / 8, p = mk(new THREE.ConeGeometry(0.06, 0.12, 3, 1, true), new THREE.MeshLambertMaterial({ color: ut, side: THREE.DoubleSide, flatShading: true }), Math.cos(a) * 0.15, 0.505, Math.sin(a) * 0.15); p.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); p.scale.set(1, 0.25, 0.5); umb.add(p); } // stripes of a second colour
  umb.add(mk(new THREE.SphereGeometry(0.014, 6, 5), MS(PAL.gold), 0, 0.57, 0));
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, d = mk(new THREE.SphereGeometry(0.008, 5, 4), MS(uc), Math.cos(a) * 0.24, 0.44, Math.sin(a) * 0.24); umb.add(d); } // little tips round the rim
  // Campfire props, hidden until used: a roasting stick in the right hand with a marshmallow that
  // browns, a little lute, a flute and a hand drum.
  const stick = new THREE.Group(); stick.position.set(0, -0.1, 0.01); stick.rotation.x = -0.5; stick.visible = false; arms[1].add(stick);
  stick.add(mk(new THREE.CylinderGeometry(0.005, 0.005, 0.36, 4), MS(PAL.woodDark), 0, -0.18, 0));
  const mallowMat = new THREE.MeshLambertMaterial({ color: '#fff3e0' }), mallow = mk(new THREE.SphereGeometry(0.024, 8, 6), mallowMat, 0, -0.37, 0); mallow.scale.y = 1.25; stick.add(mallow);
  const lute = new THREE.Group(); lute.position.set(0, 0.19, 0.12); lute.rotation.set(0.25, 0, 0.7); lute.visible = false; body.add(lute);
  const lb = mk(new THREE.SphereGeometry(0.06, 12, 8), MS('#c98a5a'), 0, 0, 0); lb.scale.set(1, 1.15, 0.45); lute.add(lb);
  lute.add(mk(new THREE.CircleGeometry(0.016, 10), MS('#5b3a2e'), 0, 0.01, 0.028));
  lute.add(mk(new THREE.BoxGeometry(0.022, 0.16, 0.012), MS('#8a5f45'), 0, 0.13, 0.008));
  lute.add(mk(new THREE.BoxGeometry(0.03, 0.04, 0.014), MS('#6b4a3a'), 0, 0.225, 0.004));
  const flute = new THREE.Group(); flute.position.set(0.07, 0.395, 0.1); flute.rotation.y = -0.3; flute.visible = false; body.add(flute);
  const fl = mk(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6), MS('#eadbb8'), 0, 0, 0); fl.rotation.z = Math.PI / 2; flute.add(fl);
  for (let k = 0; k < 3; k++) flute.add(mk(new THREE.SphereGeometry(0.004, 4, 3), MS('#7a5a4a'), 0.02 + k * 0.03, 0.007, 0));
  const drum = new THREE.Group(); drum.position.set(0, 0.15, 0.15); drum.visible = false; body.add(drum);
  drum.add(mk(new THREE.CylinderGeometry(0.055, 0.05, 0.07, 12), MS('#d98a8a'), 0, 0, 0));
  drum.add(mk(new THREE.CylinderGeometry(0.056, 0.056, 0.006, 12), MS('#fff4e0'), 0, 0.037, 0));
  const dband = mk(new THREE.TorusGeometry(0.054, 0.005, 4, 14), MS(PAL.gold), 0, 0.02, 0); dband.rotation.x = Math.PI / 2; drum.add(dband);
  g.userData.props = { stick, mallowMat, lute, flute, drum };
  g.add(body); g.userData.body = body; g.userData.legs = legs; g.userData.arms = arms; g.userData.head = head; g.userData.umbrella = umb;
  if (child) g.scale.setScalar(0.62);
  return g;
}

/** A fluffkin: a little cloud-wool grazer from the meadows. */
function makeFluffkin() {
  const g = new THREE.Group(), body = new THREE.Group();
  for (const [x, y, z, r] of [[0, 0.2, 0, 0.13], [0.09, 0.22, 0.03, 0.1], [-0.09, 0.22, -0.02, 0.1], [0, 0.29, 0, 0.1], [0.02, 0.2, -0.1, 0.09]])
    body.add(mk(new THREE.IcosahedronGeometry(r, 1), PAL.wool, x, y, z));
  body.add(mk(new THREE.SphereGeometry(0.07, 6, 5), PAL.faceDark, 0, 0.22, 0.13));
  for (const x of [-0.07, 0.07]) { const e = mk(new THREE.SphereGeometry(0.03, 4, 3), PAL.faceDark, x, 0.27, 0.11); e.scale.set(1.4, 0.6, 0.6); body.add(e); }
  const eyes = [], lids = [], ears = [];
  body.children.forEach(c => { if (c.position.z === 0.11) ears.push(c); });
  for (const x of [-0.025, 0.025]) { const e = mk(new THREE.SphereGeometry(0.01, 3, 3), '#ffffff', x, 0.24, 0.19); body.add(e); eyes.push(e); }
  for (const x of [-0.025, 0.025]) { const l = mk(new THREE.TorusGeometry(0.014, 0.004, 4, 8, Math.PI), MS('#fff6e8'), x, 0.238, 0.192); l.rotation.z = Math.PI; l.visible = false; body.add(l); lids.push(l); } // shut eyes: two sleepy curves
  const zs = [];
  for (let k = 0; k < 3; k++) { const z = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex(), transparent: true, opacity: 0, depthWrite: false })); z.visible = false; z.userData.ph = k / 3; g.add(z); zs.push(z); }
  const legs = [];
  for (const [x, z] of [[-0.06, 0.06], [0.06, 0.06], [-0.06, -0.06], [0.06, -0.06]]) { const hip = new THREE.Group(); hip.position.set(x, 0.1, z); hip.add(mk(new THREE.CylinderGeometry(0.018, 0.016, 0.1, 6), PAL.faceDark, 0, -0.05, 0)); body.add(hip); legs.push(hip); }
  g.add(body); g.userData.body = body; g.userData.legs = legs; g.userData.stride = 20; Object.assign(g.userData, { eyes, lids, ears, zs });
  return g;
}
let _zTex;
/** A drawn 'z' for a sleeping fluffkin: a lilac stroke with a cream line inside (drawn, never a font glyph). */
function zTex() {
  if (_zTex) return _zTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const path = () => { x.beginPath(); x.moveTo(18, 18); x.lineTo(46, 18); x.lineTo(18, 46); x.lineTo(46, 46); };
  x.lineCap = x.lineJoin = 'round'; path(); x.strokeStyle = '#c9b4ff'; x.lineWidth = 9; x.stroke(); path(); x.strokeStyle = '#fff6e8'; x.lineWidth = 3; x.stroke();
  _zTex = new THREE.CanvasTexture(c); _zTex.colorSpace = THREE.SRGBColorSpace; return _zTex;
}

/** The sky-boat: a wooden hull hung under a striped balloon, a small pilot aboard. */
function makeBoat() {
  const g = new THREE.Group();
  const hullG = new THREE.SphereGeometry(0.6, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const hull = mk(hullG, PAL.wood, 0, 0, 0); hull.scale.set(0.8, 0.6, 1.5); g.add(hull);
  g.add(mk(new THREE.BoxGeometry(0.9, 0.05, 1.6), '#c99a72', 0, 0.02, 0));
  const bg = new THREE.SphereGeometry(0.8, 12, 8), bc = [], ca = new THREE.Color('#ffc9a8'), cb = new THREE.Color(PAL.cream);
  const p = bg.attributes.position;
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const c = Math.floor((a + Math.PI) / (Math.PI / 4)) % 2 ? ca : cb; bc.push(c.r, c.g, c.b); }
  bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
  const balloon = new THREE.Mesh(bg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  balloon.scale.set(0.9, 0.75, 1.35); balloon.position.y = 1.55; balloon.castShadow = true; g.add(balloon);
  for (const [x, z] of [[-0.35, -0.55], [0.35, -0.55], [-0.35, 0.55], [0.35, 0.55]]) {
    const r = mk(new THREE.CylinderGeometry(0.01, 0.01, 1.0, 3), '#e6d3b0', x * 0.9, 0.55, z * 0.9); g.add(r);
  }
  for (const s of [-1, 1]) { const fin = mk(new THREE.ConeGeometry(0.18, 0.5, 3), '#b9a0e0', s * 0.7, 1.55, 0.9); fin.rotation.x = Math.PI / 2; g.add(fin); }
  const sail = mk(new THREE.ConeGeometry(0.22, 0.6, 3), '#b9a0e0', 0, 1.6, 1.2); sail.rotation.x = Math.PI / 2; g.add(sail);
  g.add(mk(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 6), PAL.gold, 0, 0.12, 0.62));
  const lamp = glow('#ffd88a', 0.8, 0.8); lamp.position.set(0, 0.25, 0.75); g.add(lamp);
  const pilot = makeFolk('adult', 1); pilot.position.set(0, 0.02, -0.1); pilot.scale.setScalar(1.3); g.add(pilot);
  g.userData.balloon = balloon;
  return g;
}

/** A drifting light-mote: a bright core in a soft halo. */
/** An old wind-arch of cloud puffs, standing across the way; lit (gold) once passed beneath. */
function makeCloudGate() {
  const g = new THREE.Group(), puff = new THREE.IcosahedronGeometry(0.42, 1), mat = new THREE.MeshLambertMaterial({ color: '#f4eefe', emissive: '#ffd36a', emissiveIntensity: 0 });
  for (let k = 0; k < 14; k++) {
    const a = k / 14 * Math.PI * 2, s = 0.8 + 0.35 * Math.abs(Math.sin(k * 2.3));
    const p = new THREE.Mesh(puff, mat); p.position.set(Math.cos(a) * 1.9, 1 + Math.sin(a) * 1.9, 0); p.scale.setScalar(s); g.add(p);
  }
  const halo = glow('#ffe7a8', 5.5, 0); halo.position.y = 1; g.add(halo);
  g.userData = { mat, halo }; return g;
}
function makeMote() {
  const g = new THREE.Group();
  g.add(mk(new THREE.OctahedronGeometry(0.18, 0), M('#fff3c8', '#ffd76a', 1)));
  g.add(glow('#ffd36a', 2.2, 0.9));
  return g;
}

// ---- Relics and found things ------------------------------------------------------------------
/** The Wind Bell of the lost tribe, hung from a curved yoke. */
function makeBell() {
  const g = new THREE.Group(), prof = [];
  for (let k = 0; k <= 8; k++) { const t = k / 8; prof.push(new THREE.Vector2(0.06 + 0.24 * Math.pow(t, 1.6) + (t > 0.9 ? 0.04 : 0), 0.5 - t * 0.5)); }
  const bell = mk(new THREE.LatheGeometry(prof, 10), M(PAL.gold, '#a8742a', 0.25), 0, 0, 0);
  g.add(bell);
  g.add(mk(new THREE.SphereGeometry(0.06, 6, 4), '#a8742a', 0, 0.02, 0));
  const yoke = mk(new THREE.TorusGeometry(0.2, 0.03, 4, 10, Math.PI), PAL.wood, 0, 0.5, 0); g.add(yoke);
  g.userData.swing = bell;
  return g;
}
/** The Star-lamp: a pale stone lantern cradling a star. */
function makeStarLamp(lit = true) {
  const g = new THREE.Group();
  g.add(mk(new THREE.CylinderGeometry(0.16, 0.22, 0.12, 8), PAL.stone, 0, 0.06, 0));
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.add(mk(new THREE.BoxGeometry(0.04, 0.4, 0.04), PAL.stone, Math.cos(a) * 0.15, 0.3, Math.sin(a) * 0.15)); }
  g.add(mk(new THREE.ConeGeometry(0.24, 0.2, 8), PAL.stone, 0, 0.6, 0));
  const star = mk(new THREE.OctahedronGeometry(0.11, 0), lit ? M('#e8f0ff', '#9fc4ff', 1.2) : M('#8c8aa6'), 0, 0.3, 0);
  star.scale.y = 1.4; g.add(star);
  const halo = glow('#a8c8ff', 1.6, lit ? 0.9 : 0); halo.position.y = 0.3; g.add(halo);
  g.userData = { star, halo };
  return g;
}
/** A round hut of the lost tribe: low wall, tall woven roof. */
function makeHut(seed) {
  const R = mrand(seed), g = new THREE.Group();
  g.add(mk(new THREE.CylinderGeometry(0.34, 0.36, 0.34, 12), T(PAL.ochre, 'plaster'), 0, 0.17, 0));
  const roof = mk(new THREE.ConeGeometry(0.46, 0.78 + R() * 0.2, 12), T(PAL.straw, 'straw'), 0, 0.72, 0); g.add(roof);
  { const band = mk(new THREE.TorusGeometry(0.3, 0.025, 3, 12), "#a8643c", 0, 0.55, 0); band.rotation.x = Math.PI / 2; g.add(band); }
  g.add(mk(new THREE.BoxGeometry(0.14, 0.22, 0.04), '#5e4033', 0, 0.12, 0.34));
  g.add(mk(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 3), PAL.woodDark, 0, 1.18, 0));
  return g;
}
/** A carved totem: three faces stacked, the smallest smiling. */
function makeTotem() {
  const g = new THREE.Group(), woods = ['#5e4033', '#6b4a3a', '#7a5642'];
  const eyeMat = new THREE.MeshLambertMaterial({ color: '#ffe6a8', emissive: new THREE.Color('#ffc46a'), emissiveIntensity: 1 });
  const runeMat = new THREE.MeshBasicMaterial({ color: '#b9e6ff', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  // a ring of faint runes on the ground
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.4, 32), runeMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.015; g.add(ring);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, r = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.02), runeMat); r.rotation.x = -Math.PI / 2; r.rotation.z = a; r.position.set(Math.cos(a) * 0.46, 0.016, Math.sin(a) * 0.46); g.add(r); }
  // three carved faces, each a little smaller: grandparent, parent, child
  [0.2, 0.17, 0.14].forEach((r, k) => {
    const y = 0.22 + k * 0.38;
    g.add(mk(new THREE.CylinderGeometry(r, r * 1.06, 0.36, 9), T(woods[k], 'bark'), 0, y, 0));
    const band = mk(new THREE.TorusGeometry(r * 1.02, 0.014, 4, 18), T('#3b2f4a', 'wood'), 0, y + 0.17, 0); band.rotation.x = Math.PI / 2; g.add(band);
    const brow = mk(new THREE.BoxGeometry(r * 1.2, 0.04, 0.05), T('#3b2f4a', 'wood'), 0, y + 0.1, r * 0.92); g.add(brow);
    for (const x of [-r * 0.4, r * 0.4]) { const e = mk(new THREE.SphereGeometry(0.03, 10, 8), eyeMat, x, y + 0.05, r * 0.93); e.scale.set(1.2, 0.7, 0.5); g.add(e); }
    const mouth = mk(new THREE.TorusGeometry(0.045, 0.012, 4, 10, Math.PI), T('#2e2438', 'wood'), 0, y - 0.07, r * 0.95); if (k === 2) mouth.rotation.z = Math.PI; g.add(mouth);
    for (const sd of [-1, 1]) g.add(mk(new THREE.BoxGeometry(0.012, 0.12, 0.012), runeMat, sd * r * 0.75, y - 0.02, r * 0.72));
  });
  // wings of feathers at the top
  for (const sd of [-1, 1]) for (let f = 0; f < 4; f++) { const fe = mk(new THREE.SphereGeometry(0.05, 8, 6), MS(['#7fa7dc', '#a8c4ff', '#c9a7f2', '#f2a6c4'][f]), sd * (0.17 + f * 0.07), 1.0 + f * 0.035, -0.02); fe.scale.set(1.8, 0.35, 0.6); fe.rotation.z = sd * (0.35 + f * 0.12); g.add(fe); }
  // hanging charms that sway
  const charms = [];
  for (const sd of [-1, 1]) { const c = new THREE.Group(); c.position.set(sd * 0.2, 0.9, 0.08); c.add(mk(new THREE.CylinderGeometry(0.003, 0.003, 0.18, 3), MS('#e6d3b0'), 0, -0.09, 0)); c.add(mk(new THREE.OctahedronGeometry(0.022, 0), M('#b9e6ff', '#7fd0ff', 0.8), 0, -0.19, 0)); for (let b = 0; b < 3; b++) c.add(mk(new THREE.SphereGeometry(0.011, 6, 4), MS(['#f2a65a', '#ffffff', '#7fa7dc'][b]), 0, -0.04 - b * 0.04, 0)); g.add(c); charms.push(c); }
  // a crystal eye floating above, turning slowly
  const orbit = new THREE.Group(); orbit.position.y = 1.28; g.add(orbit);
  const cr = mk(new THREE.OctahedronGeometry(0.07, 0), M('#d6ecff', '#8fd0ff', 1.2), 0, 0, 0); cr.scale.y = 1.5; orbit.add(cr);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2, sh = mk(new THREE.TetrahedronGeometry(0.025, 0), M('#d6ecff', '#8fd0ff', 0.8), Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15); orbit.add(sh); }
  const halo = glow('#9fd8ff', 0.8, 0.6); halo.position.y = 1.28; g.add(halo);
  g.userData = { mystic: true, glowMats: [eyeMat], runeMat, orbit, halo, charms };
  return g;
}
/** The gate where the Wind Bell hangs on the lost tribe's island. */
function makeBellGate() {
  const g = new THREE.Group();
  for (const x of [-0.45, 0.45]) g.add(mk(new THREE.CylinderGeometry(0.06, 0.07, 1.3, 6), '#a8643c', x, 0.65, 0));
  const top = mk(new THREE.BoxGeometry(1.15, 0.1, 0.14), '#a8643c', 0, 1.32, 0); g.add(top);
  const bell = makeBell(); bell.position.y = 0.72; bell.scale.setScalar(0.9); g.add(bell);
  g.userData.bell = bell;
  return g;
}
/** A broken pale column of the forgotten civilization. */
function makeColumn(seed) {
  const R = mrand(seed), h = 0.6 + R() * 1.1, g = new THREE.Group();
  g.add(mk(new THREE.BoxGeometry(0.42, 0.1, 0.42), PAL.stoneShade, 0, 0.05, 0));
  g.add(mk(new THREE.CylinderGeometry(0.14, 0.16, h, 10), T(PAL.stone, 'stone'), 0, 0.1 + h / 2, 0));
  const cap = mk(new THREE.BoxGeometry(0.34, 0.08, 0.34), PAL.stone, 0, 0.14 + h, 0); cap.rotation.y = R(); cap.rotation.z = (R() - 0.5) * 0.3; g.add(cap);
  for (let k = 0; k < 3; k++) g.add(mk(new THREE.BoxGeometry(0.03, h * 0.9, 0.02), PAL.gold, Math.cos(k * 2.1) * 0.15, 0.1 + h / 2, Math.sin(k * 2.1) * 0.15));
  return g;
}
/** The Starfall Spire: rings of white stone rising to an empty socket where the lamp hung. */
function makeSpire() {
  const g = new THREE.Group();
  g.add(mk(new THREE.CylinderGeometry(0.75, 0.85, 0.2, 10), PAL.stoneShade, 0, 0.1, 0));
  g.add(mk(new THREE.CylinderGeometry(0.55, 0.7, 0.2, 10), PAL.stone, 0, 0.3, 0));
  g.add(mk(new THREE.CylinderGeometry(0.16, 0.42, 3.4, 8), PAL.stone, 0, 2.1, 0));
  for (let k = 0; k < 4; k++) { const ring = mk(new THREE.TorusGeometry(0.36 - k * 0.06, 0.03, 4, 12), PAL.gold, 0, 0.9 + k * 0.7, 0); ring.rotation.x = Math.PI / 2; g.add(ring); }
  g.add(mk(new THREE.ConeGeometry(0.25, 0.4, 8), PAL.gold, 0, 3.95, 0));
  const lamp = makeStarLamp(true); lamp.position.y = 4.15; g.add(lamp);
  g.userData.lamp = lamp;
  return g;
}
/** A white arch with a glowing keystone. */
function makeArch() {
  const g = new THREE.Group(), R = mrand(73), stone = ['#f1ece6', '#e6dcd0', '#ece3f3', '#e4d8e8'];
  const glowMat = new THREE.MeshLambertMaterial({ color: '#e8f0ff', emissive: new THREE.Color('#9fc4ff'), emissiveIntensity: 1 });
  // two slender pillars with twisting flutes on stepped bases, each crowned with a little capital
  for (const x of [-0.4, 0.4]) {
    g.add(mk(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 8), T(stone[0], 'stone'), x, 0.04, 0));
    g.add(mk(new THREE.CylinderGeometry(0.1, 0.11, 0.05, 8), T(stone[1], 'stone'), x, 0.105, 0));
    g.add(mk(new THREE.CylinderGeometry(0.065, 0.075, 0.6, 10), T(stone[2], 'stone'), x, 0.43, 0));
    for (let k = 0; k < 10; k++) { const a = k * 0.9, f = mk(new THREE.SphereGeometry(0.016, 6, 4), MS('#d6c8e8'), x + Math.cos(a) * 0.068, 0.15 + k * 0.058, Math.sin(a) * 0.068); f.scale.y = 1.8; g.add(f); }
    g.add(mk(new THREE.BoxGeometry(0.17, 0.05, 0.17), T(stone[0], 'stone'), x, 0.755, 0));
  }
  // the arch of separate voussoir stones, with a glowing star keystone
  const n = 9;
  for (let k = 0; k < n; k++) {
    const a = Math.PI * (k + 0.5) / n, vs = mk(new THREE.BoxGeometry(0.15, 0.1, 0.15), T(pick(stone, R), 'stone'), Math.cos(a) * 0.4, 0.78 + Math.sin(a) * 0.4, 0);
    vs.rotation.z = a - Math.PI / 2; vs.scale.x = k === (n - 1) / 2 ? 1.25 : 1; g.add(vs);
  }
  const star = mk(new THREE.OctahedronGeometry(0.09, 0), glowMat, 0, 1.32, 0); star.scale.set(1, 1.3, 0.5); g.add(star);
  const halo = glow('#a8c8ff', 0.95, 0.7); halo.position.y = 1.32; g.add(halo);
  // a shimmering veil inside the arch, as if it opens onto somewhere else
  const vc = document.createElement('canvas'); vc.width = 64; vc.height = 64; const vg = vc.getContext('2d'), gr = vg.createRadialGradient(32, 40, 2, 32, 40, 34);
  gr.addColorStop(0, 'rgba(220,235,255,0.75)'); gr.addColorStop(0.5, 'rgba(190,170,255,0.35)'); gr.addColorStop(1, 'rgba(190,170,255,0)'); vg.fillStyle = gr; vg.fillRect(0, 0, 64, 64);
  const sh = new THREE.Shape(); sh.moveTo(-0.33, 0.12); sh.lineTo(0.33, 0.12); sh.lineTo(0.33, 0.78); sh.absarc(0, 0.78, 0.33, 0, Math.PI, false); sh.lineTo(-0.33, 0.12);
  const veilGeo = new THREE.ShapeGeometry(sh, 16), vp = veilGeo.attributes.position, vuv = [];
  for (let v = 0; v < vp.count; v++) vuv.push((vp.getX(v) + 0.33) / 0.66, (vp.getY(v) - 0.12) / 1.0);
  veilGeo.setAttribute('uv', new THREE.Float32BufferAttribute(vuv, 2));
  const veil = new THREE.Mesh(veilGeo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(vc), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  veil.castShadow = false; g.add(veil);
  // vines with flowers over the arch, and little stars hanging on threads that sway
  for (let k = 0; k < 12; k++) { const a = Math.PI * (0.15 + R() * 0.7), r = 0.4 + (R() - 0.5) * 0.06; g.add(mk(new THREE.IcosahedronGeometry(0.035, 0), MS(pick(PAL.leaf, R)), Math.cos(a) * r, 0.78 + Math.sin(a) * r, 0.07)); if (k % 3 === 0) g.add(mk(new THREE.IcosahedronGeometry(0.018, 0), MS(pick(['#f2a6c4', '#ffffff', '#c9a7f2'], R)), Math.cos(a) * r, 0.8 + Math.sin(a) * r, 0.09)); }
  const charms = [];
  for (const [x, len] of [[-0.18, 0.22], [0, 0.14], [0.2, 0.26]]) {
    const c = new THREE.Group(), a = Math.acos(Math.max(-1, Math.min(1, x / 0.4))); c.position.set(x, 0.78 + Math.sin(a) * 0.4 - 0.05, 0);
    c.add(mk(new THREE.CylinderGeometry(0.003, 0.003, len, 3), MS('#e6d3b0'), 0, -len / 2, 0));
    const st = mk(new THREE.OctahedronGeometry(0.03, 0), glowMat, 0, -len - 0.02, 0); st.scale.z = 0.4; c.add(st);
    g.add(c); charms.push(c);
  }
  g.userData = { arch: true, veil, glowMat, halo, charms };
  return g;
}
/** A stone wishing well with a little roof. */
function makeWell() {
  const g = new THREE.Group(), R = mrand(57);
  // a round wall of fitted stones in two courses, a mossy rim and flowers at its foot
  g.add(mk(new THREE.CylinderGeometry(0.4, 0.42, 0.04, 20), T('#d8c8b0', 'stone'), 0, 0.02, 0));
  g.add(mk(new THREE.CylinderGeometry(0.28, 0.3, 0.3, 18), T('#bfb4cc', 'stone'), 0, 0.17, 0));
  for (let row = 0; row < 2; row++) for (let k = 0; k < 12; k++) {
    const a = (k + row * 0.5) / 12 * Math.PI * 2, st = mk(new THREE.BoxGeometry(0.15, 0.12, 0.08), T(pick(['#e6dcd0', '#d9d1e0', '#cfc4dc', '#efe4d2'], R), 'stone'), Math.cos(a) * 0.3, 0.09 + row * 0.13, Math.sin(a) * 0.3);
    st.rotation.y = -a + Math.PI / 2; st.scale.set(1 + (R() - 0.5) * 0.15, 1, 1); g.add(st);
  }
  const rim = mk(new THREE.TorusGeometry(0.3, 0.045, 8, 24), T('#e6dcd0', 'stone'), 0, 0.33, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
  for (let k = 0; k < 5; k++) { const a = R() * Math.PI * 2, ms = mk(new THREE.SphereGeometry(0.05, 8, 6), MS('#7cae6a'), Math.cos(a) * 0.3, 0.355, Math.sin(a) * 0.3); ms.scale.set(1.3, 0.35, 0.8); ms.rotation.y = -a; g.add(ms); }
  // the water: deep blue, glowing softly, with a few coins glinting
  const water = new THREE.MeshLambertMaterial({ color: '#5fa8e0', emissive: new THREE.Color('#7fd0ff'), emissiveIntensity: 0.4 });
  g.add(mk(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 20), water, 0, 0.29, 0));
  for (let k = 0; k < 4; k++) { const c = mk(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 10), M(PAL.gold, '#ffcf60', 0.6), (R() - 0.5) * 0.3, 0.302, (R() - 0.5) * 0.3); c.rotation.x = (R() - 0.5) * 0.3; g.add(c); }
  // posts, a beam with a crank, a rope and a bucket that sways
  for (const x of [-0.31, 0.31]) { g.add(mk(new THREE.CylinderGeometry(0.03, 0.035, 0.68, 7), T(PAL.wood, 'wood'), x, 0.63, 0)); }
  const beam = mk(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), T(PAL.woodDark, 'wood'), 0, 0.78, 0); beam.rotation.z = Math.PI / 2; g.add(beam);
  const reel = mk(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 10), T('#e6d3b0', 'wood'), 0, 0.78, 0); reel.rotation.z = Math.PI / 2; g.add(reel);
  const crank = new THREE.Group(); crank.position.set(0.36, 0.78, 0); g.add(crank);
  crank.add(mk(new THREE.BoxGeometry(0.02, 0.12, 0.02), T(PAL.woodDark, 'wood'), 0.01, -0.05, 0));
  const hd = mk(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6), T(PAL.wood, 'wood'), 0.03, -0.1, 0); hd.rotation.z = Math.PI / 2; crank.add(hd);
  const swing = new THREE.Group(); swing.position.set(0, 0.76, 0); g.add(swing);
  swing.add(mk(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 4), MS('#e6d3b0'), 0, -0.12, 0));
  swing.add(mk(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 10), T(PAL.wood, 'wood'), 0, -0.27, 0));
  const hb = mk(new THREE.TorusGeometry(0.045, 0.005, 4, 12, Math.PI), MS('#8a7a6a'), 0, -0.235, 0); swing.add(hb);
  // a shingled cone roof with a flower on top
  const roof = mk(bentCone(0.46, 0.34, 0.03, 12), T(pick(['#7f9fd6', '#9c80c8', '#6fae9a'], R), 'shingle'), 0, 1.12, 0); g.add(roof);
  g.add(mk(new THREE.CylinderGeometry(0.44, 0.44, 0.03, 12), T(FAIRY.trim, 'wood'), 0, 0.96, 0));
  const fl = makeFlower('#f2a6c4', 1.1, R); fl.position.y = 1.27; g.add(fl);
  // ivy up one post, flowers round the foot
  for (let k = 0; k < 6; k++) g.add(mk(new THREE.IcosahedronGeometry(0.03, 0), MS(pick(PAL.leaf, R)), -0.31 + Math.sin(k) * 0.03, 0.35 + k * 0.08, 0.03));
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3, f = makeFlower(pick(PAL.flower, R), 0.55, R); f.position.set(Math.cos(a) * 0.38, 0.03, Math.sin(a) * 0.38); g.add(f); }
  // wishes: little lights rising from the water now and then
  const wishes = [];
  for (let k = 0; k < 4; k++) { const w = glow(['#fff3c8', '#d6ecff', '#ffd6ec', '#e8ffd6'][k], 0.16, 0); w.userData.ph = k / 4; g.add(w); wishes.push(w); }
  g.userData = { well: true, swing, crank, wishes, water };
  return g;
}
/** A windmill; its sails turn in the wind (userData.blades). */
function makeWindmill(broken = false) {
  const g = new THREE.Group(), wall = broken ? '#e8dccb' : '#fff4e6', roof = broken ? '#b98c6b' : '#f2a6c4';
  // a stone foot, a tapering plastered tower with timber bands, round windows and an arched door
  g.add(mk(new THREE.CylinderGeometry(0.36, 0.4, 0.14, 12), T(PAL.stoneShade, 'stone'), 0, 0.07, 0));
  g.add(mk(new THREE.CylinderGeometry(0.22, 0.32, 1.05, 12), T(wall, 'plaster'), 0, 0.665, 0));
  for (const y of [0.4, 0.8]) { const b = mk(new THREE.TorusGeometry(0.31 - (y - 0.14) * 0.1, 0.018, 4, 20), T(PAL.wood, 'wood'), 0, y, 0); b.rotation.x = Math.PI / 2; g.add(b); }
  g.add(mk(archGeo(0.16, 0.26, 0.03), T(FAIRY.door, 'wood'), 0, 0.14, 0.3));
  g.add(mk(archGeo(0.2, 0.28, 0.02), T(FAIRY.trim, 'wood'), 0, 0.13, 0.295));
  for (const [y, a] of [[0.6, 0.6], [0.95, -0.5]]) { const w = mk(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), M('#6b5d7e', '#ffd98a', broken ? 0 : 0.5), Math.sin(a) * 0.27, y, Math.cos(a) * 0.27); w.rotation.x = Math.PI / 2; w.rotation.y = a; g.add(w); }
  // a little balcony ring and a shingled cap with a pennant
  const bal = mk(new THREE.TorusGeometry(0.27, 0.014, 4, 22), T(PAL.woodDark, 'wood'), 0, 1.13, 0); bal.rotation.x = Math.PI / 2; g.add(bal);
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.add(mk(new THREE.BoxGeometry(0.012, 0.08, 0.012), T(PAL.woodDark, 'wood'), Math.cos(a) * 0.27, 1.17, Math.sin(a) * 0.27)); }
  g.add(mk(bentCone(0.3, 0.42, broken ? 0.05 : -0.04, 12), T(roof, 'shingle'), 0, 1.4, 0));
  if (!broken) { g.add(mk(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 4), PAL.gold, 0, 1.68, 0)); const pn = mk(new THREE.ConeGeometry(0.035, 0.13, 3), '#7fa7dc', 0.06, 1.74, 0); pn.rotation.z = -Math.PI / 2; g.add(pn); }
  // four lattice sails round a hub (userData.blades turns them clockwise, seen from the front).
  // Each sail's lattice and cloth sit on the trailing side of its stock, pitched so the wind
  // pushing on it drives that turn, as on a real mill.
  const blades = new THREE.Group(); blades.position.set(0, 1.2, 0.32);
  const cloth = new THREE.MeshLambertMaterial({ color: broken ? '#efe4d2' : '#fff8ec', transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2 + 0.3; blades.add(arm);
    const L = 0.68, side = -1; // clockwise: an arm pointing up moves to +x, so its trailing side is -x
    arm.add(mk(new THREE.BoxGeometry(0.025, L, 0.025), T(PAL.woodDark, 'wood'), 0, L / 2, 0));
    const lattice = new THREE.Group(); lattice.rotation.y = 0.28 * side; arm.add(lattice); // the pitch: the trailing edge sits back
    for (let r = 1; r <= 4; r++) lattice.add(mk(new THREE.BoxGeometry(0.14, 0.012, 0.012), T(PAL.wood, 'wood'), side * 0.07, r * L / 4.4, 0.005));
    lattice.add(mk(new THREE.BoxGeometry(0.012, L * 0.8, 0.012), T(PAL.wood, 'wood'), side * 0.135, L * 0.55, 0.005));
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.12, L * 0.75), cloth); sail.position.set(side * 0.07, L * 0.56, 0.012); lattice.add(sail);
    if (broken && k === 2) { const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.1), new THREE.MeshLambertMaterial({ color: '#d9b8c8', side: THREE.DoubleSide })); patch.position.set(side * 0.06, L * 0.5, 0.016); lattice.add(patch); } // a mended patch
  }
  const hub = mk(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 10), T(PAL.woodDark, 'wood'), 0, 0, 0); hub.rotation.x = Math.PI / 2; blades.add(hub);
  blades.add(mk(new THREE.SphereGeometry(0.035, 10, 8), PAL.gold, 0, 0, 0.05));
  g.add(blades); g.userData.blades = blades;
  // flowers and a sack of seeds at its foot
  const R = mrand(broken ? 19 : 23);
  for (let k = 0; k < 5; k++) { const a = -0.6 + k * 0.4 + Math.PI, f = makeFlower(pick(PAL.flower, R), 0.6, R); f.position.set(Math.sin(a) * 0.42, 0.02, Math.cos(a) * 0.42); g.add(f); }
  const sack = mk(new THREE.SphereGeometry(0.08, 10, 8), T(PAL.straw, 'straw'), 0.3, 0.12, 0.25); sack.scale.set(0.8, 1.1, 0.8); g.add(sack);
  return g;
}
/** The carved humming stone from home's edge. */
function makeRuneStone() {
  const g = new THREE.Group();
  const runeGlow = new THREE.MeshLambertMaterial({ color: '#cfe0ff', emissive: new THREE.Color('#8fb4ff'), emissiveIntensity: 1 });
  const runeMat = new THREE.MeshBasicMaterial({ color: '#c9b4ff', transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide });
  // a leaning monolith of dark slate, with mossy shoulders and a few fallen pieces
  const geo = new THREE.CylinderGeometry(0.17, 0.25, 1.0, 6, 3), pp = geo.attributes.position, R = mrand(41);
  for (let v = 0; v < pp.count; v++) { const y = pp.getY(v); pp.setX(v, pp.getX(v) * (1 + (R() - 0.5) * 0.25)); pp.setZ(v, pp.getZ(v) * 0.7 * (1 + (R() - 0.5) * 0.25)); if (y > 0.45) pp.setY(v, y + (R() - 0.5) * 0.12); }
  geo.computeVertexNormals();
  const stone = new THREE.Group(); stone.rotation.z = 0.08; stone.rotation.x = -0.05; g.add(stone);
  stone.add(mk(geo, T('#6e6890', 'rock'), 0, 0.5, 0));
  for (const [x, y, z, r] of [[0.1, 0.9, 0.05, 0.07], [-0.12, 0.75, -0.06, 0.06], [0.14, 0.4, -0.08, 0.05]]) { const ms = mk(new THREE.SphereGeometry(r, 8, 6), MS('#7cae6a'), x, y, z); ms.scale.y = 0.4; stone.add(ms); }
  // carvings: a spiral eye, and rune strokes down the face, glowing softly (they pulse)
  const eye = mk(new THREE.TorusGeometry(0.07, 0.012, 5, 20, Math.PI * 1.7), runeGlow, 0, 0.78, 0.15); stone.add(eye);
  stone.add(mk(new THREE.SphereGeometry(0.02, 8, 6), runeGlow, 0, 0.78, 0.155));
  const strokes = [[0, 0.6, 0.12, 0], [0, 0.48, 0.08, 0.6], [0.03, 0.38, 0.1, -0.5], [-0.04, 0.3, 0.06, 0], [0.02, 0.2, 0.12, 0.3]];
  for (const [x, y, w, r] of strokes) { const b = mk(new THREE.BoxGeometry(w, 0.018, 0.02), runeGlow, x, y, 0.165 + (0.6 - y) * 0.06); b.rotation.z = r; stone.add(b); }
  for (const [x, z, r] of [[0.3, 0.12, 0.06], [-0.26, 0.2, 0.05], [0.18, -0.28, 0.045]]) g.add(mk(new THREE.DodecahedronGeometry(r, 0), T('#6e6890', 'rock'), x, r * 0.6, z));
  // a ring of runes on the ground
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.44, 36), runeMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.015; g.add(ring);
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, r2 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.018), runeMat); r2.rotation.x = -Math.PI / 2; r2.rotation.z = -a; r2.position.set(Math.cos(a) * 0.5, 0.016, Math.sin(a) * 0.5); g.add(r2); }
  // stone shards floating round it, slowly
  const orbit = new THREE.Group(); orbit.position.y = 0.65; g.add(orbit);
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2, sh = mk(new THREE.TetrahedronGeometry(0.04 + (k % 2) * 0.02, 0), T('#8a83a8', 'rock'), Math.cos(a) * 0.36, Math.sin(k * 1.7) * 0.15, Math.sin(a) * 0.36); sh.rotation.set(k, k * 2, 0); orbit.add(sh); }
  const halo = glow('#a8b8ff', 1.1, 0.4); halo.position.y = 0.6; g.add(halo);
  g.userData = { mystic: true, glowMats: [runeGlow], runeMat, orbit, halo };
  return g;
}
/** An old mossy tree, wider and lower than a planted one. */
function makeOldTree(seed) {
  const R = mrand(seed), g = new THREE.Group();
  const t = mk(new THREE.CylinderGeometry(0.09, 0.16, 0.7, 5), PAL.woodDark, 0, 0.35, 0); t.rotation.z = 0.15; g.add(t);
  for (let k = 0; k < 5; k++) { const a = k * 1.3; g.add(mk(new THREE.IcosahedronGeometry(0.26 + R() * 0.1, 0), k % 2 ? '#6c9a5c' : '#7fae66', Math.cos(a) * 0.25, 0.75 + R() * 0.15, Math.sin(a) * 0.25)); }
  for (let k = 0; k < 3; k++) { const m = mk(new THREE.ConeGeometry(0.04, 0.3, 3), '#8fbf74', Math.cos(k * 2) * 0.35, 0.5, Math.sin(k * 2) * 0.35); m.rotation.x = Math.PI; g.add(m); }
  return g;
}
/** A mossy rock. */
function makeRock(seed) {
  const R = mrand(seed), g = new THREE.Group();
  const r = mk(new THREE.DodecahedronGeometry(0.22 + R() * 0.12, 0), PAL.rock, 0, 0.15, 0); r.scale.y = 0.7; g.add(r);
  g.add(mk(new THREE.DodecahedronGeometry(0.12, 0), '#8fbf74', 0.05, 0.28, 0));
  return g;
}

// ---- Terrain and ways -------------------------------------------------------------------------------
/**
 * A jagged peak: a cone with several rings, its sides pushed in and out at random, coloured by
 * height through bands (bottom to top). Flat shaded, rock-textured.
 */
function peakGeo(r, h, R, bands, jag = 0.18, seg = 9) {
  const geo = new THREE.ConeGeometry(r, h, seg, 5).toNonIndexed(), p = geo.attributes.position, col = [], c = new THREE.Color(), c2 = new THREE.Color();
  const bump = new Map();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (!bump.has(key)) bump.set(key, 1 + (R() - 0.5) * jag * 2);
    const t = (y + h / 2) / h, k = t > 0.98 ? 1 : bump.get(key);
    p.setXYZ(i, x * k, y + (t > 0.02 && t < 0.98 ? (bump.get(key) - 1) * h * 0.15 : 0), z * k);
  }
  for (let i = 0; i < p.count; i += 3) { // one colour per face, by its height
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, t = (y + h / 2) / h;
    let b = bands[0];
    for (const band of bands) if (t >= band[0]) b = band;
    c.set(b[1]); if (b[2]) c.lerp(c2.set(b[2]), Math.max(0, Math.min(1, (t - b[0]) * 4)));
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  return geo;
}
/** The soft mountain profile (radius, height) as fractions of r and h, base to top: a rounded dome. */
const DOME = [[1, 0], [0.9, 0.2], [0.72, 0.44], [0.52, 0.66], [0.31, 0.84], [0.12, 0.965], [0, 1]];
/** The dome's radius fraction at height fraction t. */
function domeR(t) { for (let k = 1; k < DOME.length; k++) if (t <= DOME[k][1]) { const [r0, y0] = DOME[k - 1], [r1, y1] = DOME[k]; return r0 + (r1 - r0) * (t - y0) / (y1 - y0); } return 0; }
/**
 * A soft mountain hump: a lathed dome (base at y 0), its sides nudged in and out a little (less
 * near the top, so the crown stays round), coloured by height through bands. Flat shaded rock.
 */
function domeGeo(r, h, R, bands, jag = 0.06, seg = 12) {
  const geo = lathe(DOME.map(([x, y]) => [x * r, y * h]), seg).toNonIndexed(), p = geo.attributes.position, col = [], c = new THREE.Color(), c2 = new THREE.Color();
  const bump = new Map();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (!bump.has(key)) bump.set(key, (R() - 0.5) * 2);
    const t = y / h, b = bump.get(key), k = t > 0.98 ? 1 : 1 + b * jag;
    p.setXYZ(i, x * k, y + (t > 0.02 && t < 0.7 ? b * jag * h * 0.12 : 0), z * k);
  }
  for (let i = 0; i < p.count; i += 3) {
    const t = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3 / h;
    let b = bands[0];
    for (const band of bands) if (t >= band[0]) b = band;
    c.set(b[1]); if (b[2]) c.lerp(c2.set(b[2]), Math.max(0, Math.min(1, (t - b[0]) * 4)));
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  return geo;
}
/** A soft snow cap over the top `cover` of a dome (r, h): smooth shaded, with a gently wavy hem. */
function snowCap(r, h, cover, seed) {
  const th = 0.32 * Math.PI, geo = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, th), p = geo.attributes.position;
  const sx = domeR(1 - cover) * r * 1.03 / Math.sin(th), sy = cover * h / (1 - Math.cos(th));
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), w = (1 - y) / (1 - Math.cos(th)); p.setY(i, y + w * w * Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 5 + seed) * 0.06 * h / sy); }
  geo.scale(sx, sy, sx); geo.computeVertexNormals();
  const m = mk(geo, MS('#fbf7ff'), 0, h + 0.01 - sy, 0);
  const rim = mk(new THREE.TorusGeometry(domeR(1 - cover) * r * 1.02, 0.025, 5, 20), MS('#e6def5'), 0, h * (1 - cover) + 0.01, 0); rim.rotation.x = Math.PI / 2; rim.scale.z = 0.6;
  return [m, rim];
}
let _peakMat;
function peakMat() { return _peakMat || (_peakMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, map: ptex('rock') })); }
const MOUNTAIN_STYLES = ['alpine', 'alpine', 'mesa', 'crystal', 'mossy', 'pinnacles'];
/**
 * A mountain over a blob of cells (offsets from the island centre), in one of five styles picked
 * by its seed: snowy alpine peaks, a layered pink mesa, a crag of glowing crystals, mossy rounded
 * hills, or tall rock pinnacles. The first cell holds the tallest part.
 */
function makeMountain(cells, seed, style) {
  const R = mrand(seed), g = new THREE.Group();
  style = style || MOUNTAIN_STYLES[Math.floor(R() * MOUNTAIN_STYLES.length) % MOUNTAIN_STYLES.length];
  const pine = (x, z, s) => { g.add(mk(new THREE.CylinderGeometry(0.02, 0.03, 0.12 * s, 5), T(PAL.wood, 'bark'), x, 0.06 * s, z)); for (let k = 0; k < 3; k++) g.add(mk(new THREE.ConeGeometry((0.13 - k * 0.03) * s, 0.18 * s, 7), T(k % 2 ? '#5f9a5a' : '#6fa86a', 'leaf'), x, (0.16 + k * 0.1) * s, z)); };
  const boulder = (x, z, s, col = '#b9adc9') => { const b = mk(new THREE.IcosahedronGeometry(0.12 * s, 1), T(col, 'rock'), x, 0.07 * s, z); b.scale.y = 0.7; b.rotation.y = R() * 3; g.add(b); };
  const place = (geo, x, z, y = 0) => { const m = new THREE.Mesh(geo, peakMat()); m.position.set(x, y, z); m.rotation.y = R() * 6; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  cells.forEach(([x, z], k) => {
    const main = k === 0, [x0, z0] = cells[0], d0 = Math.hypot(x0 - x, z0 - z) || 1;
    // the humps after the first lean in toward it, so the mountain reads as one soft massif
    const jx = x + (R() - 0.5) * 0.2 + (main ? 0 : (x0 - x) / d0 * 0.15), jz = z + (R() - 0.5) * 0.2 + (main ? 0 : (z0 - z) / d0 * 0.15);
    if (style === 'alpine') {
      // Rounded humps of faceted lilac rock over a mossy foot, under soft smooth snow caps.
      const h = main ? 1.9 + R() * 0.6 : 0.95 + R() * 0.5, r = main ? 0.98 : 0.7 + R() * 0.12;
      place(domeGeo(r, h, R, [[0, '#8fbf74'], [0.12, '#a596b8'], [0.4, '#b8aacc'], [0.62, '#cfc4e0']]), jx, jz, 0);
      if (main || h > 1.2) for (const c of snowCap(r, h, main ? 0.3 : 0.18, seed + k)) { c.position.x += jx; c.position.z += jz; g.add(c); }
      if (main && R() < 0.33) { // a faint crystal vein down one flank
        const a = R() * Math.PI * 2, pts = [];
        for (let q = 0; q <= 6; q++) { const t = 0.72 - q * 0.08, w = a + Math.sin(q * 1.3) * 0.12, rr = domeR(t) * r * 1.03; pts.push(new THREE.Vector3(jx + Math.cos(w) * rr, t * h, jz + Math.sin(w) * rr)); }
        g.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.02, 4), M('#c8b4ff', '#c8b4ff', 0.35), 0, 0, 0));
      } else if (main && R() < 0.5) { // or a thin ring of mist about its shoulders
        const ring = new THREE.Mesh(new THREE.TorusGeometry(domeR(0.55) * r * 1.35, 0.06, 6, 28), new THREE.MeshBasicMaterial({ color: '#f3eefc', transparent: true, opacity: 0.22, depthWrite: false }));
        ring.position.set(jx, h * 0.55, jz); ring.rotation.set(Math.PI / 2 + 0.12, 0, 0.08); g.add(ring);
      }
      if (R() < 0.8) pine(x + 0.45, z + 0.35, 0.8 + R() * 0.5);
      if (R() < 0.5) pine(x - 0.4, z + 0.42, 0.6 + R() * 0.4);
      boulder(x - 0.42, z - 0.3, 1 + R() * 0.5); if (R() < 0.5) boulder(x + 0.4, z - 0.4, 0.8 + R() * 0.4);
    } else if (style === 'mesa') {
      const tiers = main ? 3 + Math.floor(R() * 2) : 2;
      let y = 0, rad = main ? 0.62 : 0.5;
      const strata = ['#d99a86', '#e8b8a0', '#c98a7a', '#efc9b0'];
      for (let t = 0; t < tiers; t++) {
        const th = 0.3 + R() * 0.25, geo = peakGeo(rad, th, R, [[0, strata[t % 4]], [0.5, strata[(t + 1) % 4]]], 0.1, 10);
        const m = place(geo, jx, jz, y + th / 2); m.scale.set(1, 1, 1); geo.attributes.position.needsUpdate = true;
        y += th; rad *= 0.82;
      }
      const capG = new THREE.CylinderGeometry(rad * 1.12, rad * 1.18, 0.07, 10); g.add(mk(capG, T('#9cc27a', 'grass'), jx, y + 0.02, jz));
      if (main) pine(jx, jz, 0.6);
      if (R() < 0.6) boulder(x + 0.4, z - 0.3, 1.2, '#d9a08c');
    } else if (style === 'crystal') {
      const h = main ? 1.2 + R() * 0.5 : 0.7 + R() * 0.4;
      place(domeGeo(main ? 0.8 : 0.6, h, R, [[0, '#6f6390'], [0.5, '#8a7aa8']]), jx, jz, 0);
      const hues = ['#9fe6ff', '#ffb6e1', '#c8b4ff', '#b6ffd8'], n = main ? 6 : 3;
      for (let c = 0; c < n; c++) {
        const hue = hues[Math.floor(R() * 4)], ch = (main ? 0.8 : 0.5) + R() * (main ? 1.1 : 0.6), cr = 0.07 + R() * 0.08;
        const cry = mk(new THREE.CylinderGeometry(0, cr, ch, 6), M(hue, hue, 0.55), jx + (R() - 0.5) * 0.5, h * 0.35 + ch / 2, jz + (R() - 0.5) * 0.5);
        cry.rotation.set((R() - 0.5) * 0.7, R() * 3, (R() - 0.5) * 0.7); g.add(cry);
      }
      const halo = glow(hues[k % 4], main ? 2.2 : 1.4, 0.35); halo.position.set(jx, h * 0.8, jz); g.add(halo);
    } else if (style === 'mossy') {
      const r = main ? 0.85 : 0.6, h = main ? 1.1 + R() * 0.5 : 0.6 + R() * 0.3;
      const hill = new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2); hill.scale(1, h / r, 1);
      const hp = hill.attributes.position; for (let i = 0; i < hp.count; i++) { const f = 1 + (R() - 0.5) * 0.12; hp.setXYZ(i, hp.getX(i) * f, hp.getY(i), hp.getZ(i) * f); }
      hill.computeVertexNormals();
      const m = mk(hill, T(k % 2 ? '#8fbf74' : '#7fb06a', 'grass'), jx, 0, jz); g.add(m);
      for (let b = 0; b < (main ? 3 : 1); b++) { const a = R() * 6; boulder(jx + Math.cos(a) * r * 0.75, jz + Math.sin(a) * r * 0.75, 1 + R()); }
      for (let f = 0; f < 5; f++) { const a = R() * 6, rr = R() * r * 0.6; g.add(mk(new THREE.IcosahedronGeometry(0.03, 0), pick(PAL.flower, R), jx + Math.cos(a) * rr, h * Math.sqrt(1 - (rr / r) ** 2) + 0.01, jz + Math.sin(a) * rr)); }
      if (main) pine(jx + 0.15, jz - 0.1, 1.1);
    } else {
      const n = main ? 3 : 2;
      for (let c = 0; c < n; c++) {
        const ph = (main ? 1.6 : 1.0) + R() * (main ? 1.4 : 0.8), pr = 0.18 + R() * 0.12, ox = (R() - 0.5) * 0.45, oz = (R() - 0.5) * 0.45;
        const geo = new THREE.CylinderGeometry(pr * 0.85, pr, ph, 7, 4).toNonIndexed(); const gp = geo.attributes.position;
        for (let i = 0; i < gp.count; i++) { const f = 1 + (Math.sin(gp.getY(i) * 7 + c) * 0.12); gp.setX(i, gp.getX(i) * f); gp.setZ(i, gp.getZ(i) * f); }
        const colA = new THREE.Color('#a99bbf'), colB = new THREE.Color('#c9b8cf'), cc = [];
        for (let i = 0; i < gp.count; i += 3) { const yy = (gp.getY(i) + ph / 2) / ph, cl = (Math.floor(yy * 6) % 2 ? colA : colB); for (let q = 0; q < 3; q++) cc.push(cl.r, cl.g, cl.b); }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); geo.computeVertexNormals();
        place(geo, jx + ox, jz + oz, ph / 2);
        const cap = mk(new THREE.SphereGeometry(pr * 0.9, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), T('#8fbf74', 'grass'), jx + ox, ph - 0.01, jz + oz); cap.scale.y = 0.55; g.add(cap); // a rounded mossy top, not a flat cut
        if (R() < 0.6) { const v = mk(new THREE.CylinderGeometry(0.01, 0.01, ph * 0.5, 3), '#7cbf6a', jx + ox + pr * 0.7, ph * 0.72, jz + oz); g.add(v); }
      }
      boulder(x + 0.35, z + 0.3, 1);
    }
    g.add(mk(new THREE.CylinderGeometry(0.62, 0.7, 0.08, 12), T(PAL.grassDark, 'grass'), x, 0.04, z)); // a soft grass collar
  });
  g.userData.style = style;
  return g;
}
let _waterMat, _lakeMat, _flowTex;
/** Flowing water: a soft blue with pale streaks, its texture scrolled downstream each frame (waterFlowTex). */
function waterFlowTex() {
  if (_flowTex) return _flowTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#79b9e6'); gr.addColorStop(0.5, '#9ad3f4'); gr.addColorStop(1, '#79b9e6');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
  const R = mrand(77);
  for (let k = 0; k < 34; k++) { g.fillStyle = `rgba(255,255,255,${0.18 + R() * 0.35})`; const x = 6 + R() * 52, y = R() * 128, l = 8 + R() * 22; g.beginPath(); g.ellipse(x, y, 1.2 + R() * 1.5, l / 2, 0, 0, Math.PI * 2); g.fill(); }
  _flowTex = new THREE.CanvasTexture(c); _flowTex.wrapS = _flowTex.wrapT = THREE.RepeatWrapping; _flowTex.colorSpace = THREE.SRGBColorSpace;
  return _flowTex;
}
/** River water: glossy, with the flowing texture. */
function waterMat() {
  if (!_waterMat) _waterMat = new THREE.MeshPhongMaterial({ color: '#ffffff', map: waterFlowTex(), specular: '#ffffff', shininess: 70, emissive: new THREE.Color('#3f88c8'), emissiveIntensity: 0.18 });
  return _waterMat;
}
/** Still lake water: glossy and clear blue. */
function lakeMat() {
  if (!_lakeMat) _lakeMat = new THREE.MeshPhongMaterial({ color: '#7cc3ec', specular: '#ffffff', shininess: 90, emissive: new THREE.Color('#3f88c8'), emissiveIntensity: 0.2 });
  return _lakeMat;
}
/** A flat ribbon of the given width along a smooth curve through pts, its v coordinate running along it. */
function ribbonGeo(curve, width, y, n, vScale) {
  const pos = [], uv = [], idx = [], P = new THREE.Vector3(), Tg = new THREE.Vector3();
  let dist = 0, prev = null;
  for (let k = 0; k <= n; k++) {
    const t = k / n; curve.getPointAt(t, P); curve.getTangentAt(t, Tg);
    if (prev) dist += P.distanceTo(prev); prev = P.clone();
    const sx = -Tg.z, sz = Tg.x, l = Math.hypot(sx, sz) || 1, w = width * (0.9 + 0.1 * Math.sin(k * 0.9));
    pos.push(P.x + sx / l * w / 2, y, P.z + sz / l * w / 2, P.x - sx / l * w / 2, y, P.z - sz / l * w / 2);
    uv.push(0, dist * vScale, 1, dist * vScale);
    if (k) { const a = (k - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  if (geo.attributes.normal.getY(0) < 0) geo.index.array.reverse(); // face up
  geo.computeVertexNormals(); return geo;
}
/**
 * A river through cells (offsets from the island centre, in flow order), ending at the rim: a
 * smooth winding ribbon of glossy flowing water on a pebbly sand bed, a spring pool with stones
 * at its source, reeds and pebbles along the banks.
 */
function makeRiver(cells, exitDir, rimDist = 0.8, back = null, cascadeH = 0.45) {
  const g = new THREE.Group(), R = mrand(cells.length * 31 + cells[0][0] * 7 + cells[0][1]);
  const pts = cells.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const last = cells[cells.length - 1];
  const runTo = Math.max(0.15, rimDist - 0.06 - NOTCH_D - 0.08); // the flat river stops where the rim's gap begins; the lip carries it down and over
  pts.push(new THREE.Vector3(last[0] + exitDir[0] * runTo * 0.55, 0, last[1] + exitDir[1] * runTo * 0.55));
  pts.push(new THREE.Vector3(last[0] + exitDir[0] * runTo, 0, last[1] + exitDir[1] * runTo));
  // The course: straight runs between cells, and each turn a round arc fitted inside its cell (a
  // curve through the cell centres pinched and folded the banks at a sharp turn).
  const base = [...pts.slice(0, -2), pts[pts.length - 1]], dense = [], bends = [];
  const add = v => { if (!dense.length || dense[dense.length - 1].distanceTo(v) > 0.02) dense.push(v.clone()); };
  const runTo2 = v => { const a = dense[dense.length - 1], l = a.distanceTo(v), steps = Math.ceil(l / 0.2); for (let k = 1; k <= steps; k++) add(a.clone().lerp(v, k / steps)); };
  add(base[0]);
  for (let i = 1; i < base.length - 1; i++) {
    const a = base[i - 1], b = base[i], c = base[i + 1], d1 = b.clone().sub(a), d2 = c.clone().sub(b), l1 = d1.length(), l2 = d2.length(); d1.normalize(); d2.normalize();
    if (d1.dot(d2) > 0.995) continue; // straight on
    const r = Math.min(0.5, l1 / 2, l2 / 2), s = b.clone().addScaledVector(d1, -r), e = b.clone().addScaledVector(d2, r);
    runTo2(s);
    for (let k = 1; k <= 10; k++) { const t = k / 10, u = 1 - t; add(new THREE.Vector3(u * u * s.x + 2 * u * t * b.x + t * t * e.x, 0, u * u * s.z + 2 * u * t * b.z + t * t * e.z)); }
    bends.push({ s, b, e, c: b.clone().add(d2.clone().sub(d1).multiplyScalar(r)), r });
  }
  runTo2(base[base.length - 1]);
  const curve = new THREE.CatmullRomCurve3(dense, false, 'centripetal'), n = Math.ceil(curve.getLength() * 14);
  const bank = new THREE.Mesh(ribbonGeo(curve, 0.86, 0.022, n, 1), T('#e6d3b0', 'dirt')); bank.receiveShadow = true; g.add(bank);
  const water = new THREE.Mesh(ribbonGeo(curve, 0.54, 0.045, n, 0.5), waterMat()); water.receiveShadow = true; g.add(water);
  // where it turns, the current swings wide: pale flow lines sweep round the outside of the bend
  const swirl = new THREE.MeshBasicMaterial({ map: waterFlowTex(), color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  for (const bd of bends) for (const [rr, w] of [[0.16, 0.035], [0.22, 0.025]]) {
    const vs = bd.s.clone().sub(bd.c), ve = bd.e.clone().sub(bd.c), arc = [];
    for (let k = 0; k <= 8; k++) { const v = vs.clone().lerp(ve, k / 8).normalize().multiplyScalar(bd.r + rr); arc.push(bd.c.clone().add(v)); }
    const m = new THREE.Mesh(ribbonGeo(new THREE.CatmullRomCurve3(arc), w, 0.05, 16, 3), swirl); m.renderOrder = 2; g.add(m);
  }
  // the lip: the water bends gently down over the rounded edge of the island before it falls
  const lip = makeRiverLip(new THREE.Vector3(last[0] + exitDir[0] * runTo, 0, last[1] + exitDir[1] * runTo), exitDir, rimDist - runTo, R); g.add(lip);
  g.userData.brink = { along: runTo + lip.userData.end.along, y: lip.userData.end.y - 0.045 }; // where the waterfall takes over, from the last cell's centre
  // the spring: an irregular pond of the river's own water, fed by a little cascade off its mountain's flank
  const sp = makeSpring(pts[0], pts[1], R, back, cascadeH); g.add(sp); g.userData.spring = sp.userData;
  const P = new THREE.Vector3(), Tg = new THREE.Vector3();
  for (let k = 1; k < pts.length * 3; k++) {
    const t = k / (pts.length * 3); curve.getPointAt(t, P); curve.getTangentAt(t, Tg);
    const sx = -Tg.z, sz = Tg.x, side = k % 2 ? 1 : -1, off = 0.36 + R() * 0.06, px = P.x + sx * off * side, pz = P.z + sz * off * side;
    if (dense.some(q => Math.hypot(q.x - px, q.z - pz) < off - 0.06)) { R(); continue; } // inside a bend this would land in the water
    if (R() < 0.55) g.add(mk(new THREE.ConeGeometry(0.03, 0.22 + R() * 0.12, 4), pick(PAL.leaf, R), P.x + sx * off * side, 0.12, P.z + sz * off * side));
    else g.add(mk(new THREE.DodecahedronGeometry(0.035 + R() * 0.03, 0), T(PAL.stoneShade, 'stone'), P.x + sx * off * side, 0.04, P.z + sz * off * side));
  }
  return g;
}
/**
 * The end of a river: from where the flat stream stops, the water (and its sandy bed) curves gently
 * down over the island's rounded edge, widening a touch, with mossy stones on either side; the
 * waterfall takes over below it (makeWaterfall, placed at the lip's end).
 */
function makeRiverLip(p0, d, len, R) {
  // len: from p0 to the rim's edge (the brink). The water runs down through the rim's gap, then
  // curls over the brink in one unbroken surface, where the waterfall takes over.
  const g = new THREE.Group(), sx = -d[1], sz = d[0], n = 12, nc = 7, CURL = 0.25, PHI = 1.35, YB = -0.18;
  const samples = []; // [along, y, t] where t runs 0 → 1 over the whole lip and curl
  for (let k = 0; k <= n; k++) { const t = k / n; samples.push([len * t, 0.045 + (YB - 0.045) * (t * t * (3 - 2 * t))]); }
  for (let k = 1; k <= nc; k++) { const f = k / nc * PHI; samples.push([len + CURL * Math.sin(f), YB - CURL * (1 - Math.cos(f))]); }
  samples.forEach((s, k) => { s[2] = k / (samples.length - 1); });
  const strip = (from, to, w0, w1, lift, mat, flow, alpha) => {
    const pos = [], uv = [], col = [], idx = [];
    for (let k = from; k <= to; k++) {
      const [a, y0] = samples[k], u = (k - from) / (to - from), w = w0 + (w1 - w0) * u, x = p0.x + d[0] * a, z = p0.z + d[1] * a, y = y0 + lift;
      pos.push(x + sx * w / 2, y, z + sz * w / 2, x - sx * w / 2, y, z - sz * w / 2); uv.push(0, a * (flow ? 0.5 : 1), 1, a * (flow ? 0.5 : 1));
      if (alpha) { const al = alpha(u); col.push(1, 1, 1, al, 1, 1, 1, al); }
      if (k > from) { const q = (k - from - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (alpha) geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    geo.setIndex(idx); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) { geo.index.array.reverse(); geo.computeVertexNormals(); }
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; return m;
  };
  const last = samples.length - 1;
  g.add(strip(0, n, 0.86, 2 * NOTCH_W - 0.2, -0.022, T('#e6d3b0', 'dirt'), false)); // the sandy bed, down to the brink
  g.add(strip(0, last, 0.54, 0.6, 0, waterMat(), true)); // the water, flat, down and over in one piece
  const white = strip(n - 4, last, 0.5, 0.58, 0.004, new THREE.MeshBasicMaterial({ map: waterFlowTex(), color: '#eef8ff', vertexColors: true, transparent: true, depthWrite: false }), true, u => 0.7 * u * u);
  white.renderOrder = 2; g.add(white); // the water whitens as it speeds over the brink
  const at = (a, across, y) => [p0.x + d[0] * a + sx * across, y, p0.z + d[1] * a + sz * across];
  // a bright crest line where the water tips over, and foam heaped at the brink
  const crest = mk(new THREE.BoxGeometry(0.58, 0.012, 0.035), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 }), ...at(len + 0.02, 0, YB + 0.008));
  crest.rotation.y = Math.atan2(d[0], d[1]); crest.castShadow = false; g.add(crest);
  for (const [o, r] of [[-0.25, 0.08], [0.26, 0.07], [-0.08, 0.06], [0.1, 0.065], [0.0, 0.05]]) { const f = mk(new THREE.IcosahedronGeometry(r, 0), MS('#f4fbff', '#e8f6ff', 0.3), ...at(len - 0.02 + R() * 0.05, o, YB + 0.01)); f.scale.y = 0.5; f.castShadow = false; g.add(f); }
  // rocks lining the gap, then stepping down the cliff on either side of the fall, mossy on top
  const rockCols = ['#a99bbf', '#8f82a8', '#a99bbf', '#b5a8c8'];
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const t = 0.12 + k * 0.27, a = len * t, r = 0.12 + R() * 0.09, y = 0.045 + (YB - 0.045) * (t * t * (3 - 2 * t));
      const st = mk(new THREE.DodecahedronGeometry(r, 0), T(pick(rockCols, R), 'rock'), ...at(a, sd * (NOTCH_W + 0.02 + R() * 0.04), y + r * 0.35)); st.scale.set(1, 0.85, 1.15); st.rotation.y = R() * 3; g.add(st);
      if (k >= 2) { const ms = mk(new THREE.SphereGeometry(r * 0.85, 8, 6), MS('#7cae6a'), st.position.x, st.position.y + r * 0.6, st.position.z); ms.scale.y = 0.33; g.add(ms); }
    }
    for (let k = 0; k < 3; k++) {
      const r = 0.16 - k * 0.025 + R() * 0.04, st = mk(new THREE.DodecahedronGeometry(r, 0), T(pick(rockCols, R), 'rock'), ...at(len + 0.1, sd * (NOTCH_W - 0.02 - k * 0.04), -0.32 - k * 0.36)); st.rotation.set(R() * 3, R() * 3, 0); g.add(st);
      if (k === 0) { const ms = mk(new THREE.SphereGeometry(r * 0.8, 8, 6), MS('#7cae6a'), st.position.x, st.position.y + r * 0.65, st.position.z); ms.scale.y = 0.35; g.add(ms); }
    }
  }
  // the gap's floor under the bed, and wet dark rock on the cut face behind the fall
  const slope = Math.atan2(0.24, len), floor = mk(new THREE.BoxGeometry(2 * NOTCH_W + 0.04, 0.5, len + 0.08), T('#a8907e', 'dirt'));
  floor.position.set(...at(len / 2, 0, -0.105 - 0.25 / Math.cos(slope))); floor.rotation.order = 'YXZ'; floor.rotation.set(slope, Math.atan2(d[0], d[1]), 0); g.add(floor);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(2 * NOTCH_W, 0.62), new THREE.MeshBasicMaterial({ color: '#6f8fb0', transparent: true, opacity: 0.4, depthWrite: false }));
  wet.position.set(...at(len + 0.05, 0, YB - 0.33)); wet.rotation.y = Math.atan2(d[0], d[1]); g.add(wet);
  g.userData.end = { along: samples[last][0], y: samples[last][1] };
  return g;
}
/**
 * Where a river rises: a pond with a wavy edge, drawn in the river's own flowing water so it runs
 * straight on into the stream, on a pebbly bank; an arc of mossy rocks behind it, with a tiny
 * cascade spilling from the tallest; ripples spread where it lands (userData.ripples, .fall).
 */
function makeSpring(p0, p1, R, mtn = null, cascadeH = 0.45) {
  // u points away from the mountain (mtn: the step from the spring cell to it), else downstream
  const fx = mtn ? -mtn[0] : p1.x - p0.x, fz = mtn ? -mtn[1] : p1.z - p0.z;
  const g = new THREE.Group(), fl = Math.hypot(fx, fz) || 1, ux = fx / fl, uz = fz / fl, cx = p0.x + ux * 0.15, cz = p0.z + uz * 0.15; // a little out from the mountain's foot
  const outline = (rad, wob) => { const pts = []; for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2, along = Math.cos(a) * ux * 0 + 1; const r = rad * (1 + wob * Math.sin(a * 3 + 1.3) + wob * 0.6 * Math.sin(a * 5 + 0.4)); pts.push(new THREE.Vector2(Math.cos(a) * r * 1.15 * along, Math.sin(a) * r)); } return new THREE.Shape(pts); };
  const ang = Math.atan2(uz, ux);
  const flat = (shape, y, mat, uvFlow) => {
    const geo = new THREE.ShapeGeometry(shape, 2); geo.rotateX(Math.PI / 2); // shape x,y → world x,z (faces down: flip below)
    const pp = geo.attributes.position, uv = [];
    for (let v = 0; v < pp.count; v++) { const x = pp.getX(v), z = pp.getZ(v), wx = x * Math.cos(ang) - z * Math.sin(ang), wz = x * Math.sin(ang) + z * Math.cos(ang); pp.setXYZ(v, cx + wx, y, cz + wz); if (uvFlow) { const along = (wx * ux + wz * uz), across = (-wx * uz + wz * ux); uv.push(across / 0.54 + 0.5, along * 0.5); } }
    if (uvFlow) geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.index.array.reverse(); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; return m;
  };
  g.add(flat(outline(0.56, 0.08), 0.03, T('#e6d3b0', 'dirt'), false));
  g.add(flat(outline(0.4, 0.07), 0.052, waterMat(), true));
  // pebbles round the bank, mossy rocks in an arc behind, the tallest in the middle
  for (let k = 0; k < 9; k++) { const a = ang + Math.PI * 0.35 + k / 8 * Math.PI * 1.3, r = 0.5 + R() * 0.06; g.add(mk(new THREE.DodecahedronGeometry(0.03 + R() * 0.02, 0), T(PAL.stoneShade, 'stone'), cx + Math.cos(a) * r, 0.035, cz + Math.sin(a) * r)); }
  const back = [cx - ux * 0.42, cz - uz * 0.42], sx = -uz, sz = ux;
  [[0, 0.17, 0.0], [-0.2, 0.11, 0.05], [0.21, 0.12, 0.04], [-0.36, 0.07, 0.12], [0.36, 0.08, 0.1]].forEach(([o, r, fwd]) => {
    const rock = mk(new THREE.DodecahedronGeometry(r, 0), T('#a99bbf', 'rock'), back[0] + sx * o + ux * fwd, r * 0.75, back[1] + sz * o + uz * fwd); rock.scale.set(1, 1.15, 0.9); rock.rotation.y = o * 3; g.add(rock);
    const moss = mk(new THREE.SphereGeometry(r * 0.75, 8, 6), MS('#7cae6a'), rock.position.x, rock.position.y + r * 0.7, rock.position.z); moss.scale.y = 0.35; g.add(moss);
  });
  // the little cascade: it springs from the mountain's flank, over the tallest rock, into the pond
  const fall = makeWaterfall(Math.max(0.75, (cascadeH - 0.04) / 0.32), 0.32); fall.scale.setScalar(0.32);
  fall.position.set(back[0] - ux * 0.22, cascadeH, back[1] - uz * 0.22); fall.rotation.y = Math.atan2(ux, uz); g.add(fall);
  const seep = mk(new THREE.SphereGeometry(0.07, 8, 6), MS('#9ad3f4', '#7fd0ff', 0.35), back[0] - ux * 0.24, cascadeH + 0.02, back[1] - uz * 0.24); seep.scale.set(1.2, 0.5, 0.8); g.add(seep); // the wet mouth it pours from
  // ripples spreading where it lands
  const ripples = [];
  for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.065, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(back[0] + ux * 0.2, 0.05, back[1] + uz * 0.2); r.userData.ph = k / 3; r.renderOrder = 3; g.add(r); ripples.push(r); }
  g.userData = { ripples, fall };
  return g;
}
/**
 * A still lake over cells (offsets from the island centre): rounded water on a sandy shore,
 * lily pads (some in flower), reeds and stones along the edge.
 */
function makeLake(cells) {
  const g = new THREE.Group(), R = mrand(cells.length * 17 + cells[0][0] * 5 + cells[0][1] * 3);
  const has = new Set(cells.map(c => c[0] + ',' + c[1])), spots = cells.map(c => [c[0], c[1], 0.62]);
  for (const [x, z] of cells) for (const [dx, dz] of [[1, 0], [0, 1], [1, 1], [1, -1]]) if (has.has((x + dx) + ',' + (z + dz))) spots.push([x + dx / 2, z + dz / 2, dx && dz ? 0.5 : 0.6]);
  for (const [x, z, r] of spots) {
    g.add(mk(new THREE.CylinderGeometry(r + 0.14, r + 0.16, 0.03, 22), T('#e6d3b0', 'dirt'), x, 0.018, z));
    const w = mk(new THREE.CylinderGeometry(r, r, 0.05, 22), lakeMat(), x, 0.038, z); w.castShadow = false; g.add(w);
  }
  for (const [x, z] of cells) {
    if (R() < 0.8) { // lily pads
      for (let k = 0; k < 2; k++) {
        const pad = mk(new THREE.CylinderGeometry(0.08 + R() * 0.04, 0.08, 0.012, 12, 1, false, 0.4, Math.PI * 2 - 0.4), MS('#6fae6a'), x + (R() - 0.5) * 0.6, 0.068, z + (R() - 0.5) * 0.6);
        pad.rotation.y = R() * 6.28; pad.castShadow = false; g.add(pad);
        if (R() < 0.4) { const fl = mk(new THREE.OctahedronGeometry(0.035, 0), MS(pick(['#f7c6d8', '#ffffff', '#f4b6c8'], R)), pad.position.x, 0.095, pad.position.z); fl.scale.y = 0.6; g.add(fl); }
      }
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!has.has((x + dx) + ',' + (z + dz)) && R() < 0.6) {
      const px = x + dx * 0.7 + (R() - 0.5) * 0.4 * (dz ? 1 : 0), pz = z + dz * 0.7 + (R() - 0.5) * 0.4 * (dx ? 1 : 0);
      if (R() < 0.6) for (let k = 0; k < 3; k++) g.add(mk(new THREE.ConeGeometry(0.03, 0.24 + R() * 0.14, 4), pick(PAL.leaf, R), px + (R() - 0.5) * 0.12, 0.13, pz + (R() - 0.5) * 0.12));
      else g.add(mk(new THREE.DodecahedronGeometry(0.06 + R() * 0.04, 0), T(PAL.stoneShade, 'stone'), px, 0.05, pz));
    }
  }
  return g;
}
/**
 * A stone way on one cell; mask joins it to neighbours: 1 east (+x), 2 west, 4 south (+z), 8 north.
 */
const _flagGeos = [];
/** A few flagstone shapes, shared by every path. */
function flagGeo(k) {
  if (!_flagGeos.length) for (let n = 0; n < 4; n++) { const geo = new THREE.CylinderGeometry(1, 1.06, 1, 6 + n, 1); geo.scale(1, 1, 0.8 + n * 0.08); _flagGeos.push(geo); }
  return _flagGeos[k % _flagGeos.length];
}
/**
 * A stone way on one cell; mask joins it to neighbours: 1 east (+x), 2 west, 4 south (+z), 8 north,
 * and paves a corner where a square of paths meets (16 +x+z, 32 +x-z, 64 -x+z, 128 -x-z), so a
 * block of paths is one paved square with no grass between.
 * Rounded flagstones in soft greys and creams, laid over packed earth that reaches each joined
 * side; grass and tiny flowers soften the open edges. A lone cell is a round stepping-stone plaza.
 */
function makePath(mask, seed) {
  const R = mrand(seed + 21), g = new THREE.Group(), earth = T('#d9c4a0', 'dirt');
  const cols = ['#e6dcd0', '#d9d1e0', '#efe4d2', '#d8cfc0', '#e4d8e8'];
  g.add(mk(new THREE.CylinderGeometry(0.34, 0.36, 0.03, 16), earth, 0, 0.015, 0));
  const arms = [[1, 1, 0], [2, -1, 0], [4, 0, 1], [8, 0, -1]], open = [];
  for (const [bit, dx, dz] of arms) {
    if (mask & bit) g.add(mk(new THREE.BoxGeometry(dx ? 0.5 : 0.56, 0.03, dz ? 0.5 : 0.56), earth, dx * 0.25, 0.015, dz * 0.25));
    else open.push([dx, dz]);
  }
  const corners = [[16, 1, 1], [32, 1, -1], [64, -1, 1], [128, -1, -1]];
  for (const [bit, sx, sz] of corners) {
    if (mask & bit) g.add(mk(new THREE.BoxGeometry(0.5, 0.03, 0.5), earth, sx * 0.25, 0.016, sz * 0.25)); // a paved corner of a square of paths
    else if ((mask & (sx > 0 ? 1 : 2)) && (mask & (sz > 0 ? 4 : 8))) g.add(mk(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 10), earth, sx * 0.28, 0.015, sz * 0.28)); // an L-bend: soften the inner notch
  }
  const inCorner = (x, z) => corners.some(([bit, sx, sz]) => (mask & bit) && x * sx > 0 && z * sz > 0);
  // flagstones on a jittered grid over the earth
  const inside = (x, z) => (Math.hypot(x, z) < 0.3) || inCorner(x, z) || ((mask & 1) && x > 0 && Math.abs(z) < 0.24) || ((mask & 2) && x < 0 && Math.abs(z) < 0.24) || ((mask & 4) && z > 0 && Math.abs(x) < 0.24) || ((mask & 8) && z < 0 && Math.abs(x) < 0.24);
  for (let gx = -2; gx <= 2; gx++) for (let gz = -2; gz <= 2; gz++) {
    const x = gx * 0.19 + (R() - 0.5) * 0.06, z = gz * 0.19 + (R() - 0.5) * 0.06;
    if (Math.abs(x) > 0.42 || Math.abs(z) > 0.42 || !inside(x, z)) continue; // stones stay inside the cell: none cross a seam
    const r = 0.07 + R() * 0.025, st = mk(flagGeo(Math.floor(R() * 4)), T(pick(cols, R), 'stone'), x, 0.035, z);
    st.scale.set(r, 0.025, r); st.rotation.y = R() * 6; st.castShadow = false; g.add(st);
  }
  // grass and tiny flowers along the open edges
  for (const [dx, dz] of open) for (let k = 0; k < 3; k++) {
    const along = (k - 1) * 0.2 + (R() - 0.5) * 0.08, x = dx ? dx * 0.36 : along, z = dz ? dz * 0.36 : along;
    g.add(blade(pick(['#86b86a', '#9fcb7c'], R), 0.1 + R() * 0.06, x, z, R));
    if (R() < 0.35) { const f = makeFlower(pick(PAL.flower, R), 0.4, R); f.position.set(x + (R() - 0.5) * 0.06, 0, z + (R() - 0.5) * 0.06); g.add(f); }
  }
  if (!mask) { // a lone plaza: a ring of little posts with a glowing stone in the middle
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; g.add(mk(new THREE.CylinderGeometry(0.03, 0.035, 0.12, 8), T(FAIRY.trim, 'stone'), Math.cos(a) * 0.38, 0.06, Math.sin(a) * 0.38)); g.add(mk(new THREE.SphereGeometry(0.025, 8, 6), MS('#fff3c8', '#ffd98a', 0.5), Math.cos(a) * 0.38, 0.13, Math.sin(a) * 0.38)); }
  }
  return g;
}
/**
 * A point t (0..1) along a bridge from p1 to p2. A sky bridge between islands sags a little in the
 * middle; with hump > 0 (a footbridge over a river or lake) it rises in a gentle arch instead, so it
 * always clears the water.
 */
function bridgeAt(p1, p2, t, out, hump = 0, ta = 0, tb = 1) {
  // Between islands the walkway runs level with each island's ground up to its rim (ta, tb: where
  // the line leaves the first island and reaches the second), and only slopes and sags over the sky.
  const len = Math.hypot(p2.x - p1.x, p2.z - p1.z) * (tb - ta), bend = hump > 0 ? -hump : Math.min(0.9, len * 0.035);
  out.x = p1.x + (p2.x - p1.x) * t; out.z = p1.z + (p2.z - p1.z) * t;
  const u = t <= ta ? 0 : t >= tb ? 1 : (t - ta) / (tb - ta), e = u * u * (3 - 2 * u) * 0.35 + u * 0.65; // ease the slope in and out at the rims
  out.y = p1.y + (p2.y - p1.y) * e - Math.sin(Math.PI * u) * bend;
  return out;
}
/**
 * A straight rope bridge of planks for a span about len long. Its parts are laid out by
 * placeSkyBridge, every frame if the islands it joins drift.
 */
function makeSkyBridge(len, lightMin = Infinity, lightGap = 2.6, hump = 0, ta = 0, tb = 1) {
  const g = new THREE.Group(), n = Math.max(4, Math.ceil(len / 0.28)), np = Math.max(2, Math.ceil(len / 2.2));
  const u = { planks: [], posts: [], ropes: [], ends: [], lights: [], n, np, hump, ta, tb };
  if (len >= lightMin) { // a long bridge: lantern posts along the way, on alternate sides
    const nl = Math.max(1, Math.floor(len / lightGap) - 1), postG = new THREE.CylinderGeometry(0.03, 0.035, 0.8, 6), armG = new THREE.BoxGeometry(0.16, 0.025, 0.025);
    const boxG = new THREE.CylinderGeometry(0.05, 0.04, 0.1, 6), capG = new THREE.ConeGeometry(0.07, 0.06, 6), lit = M('#fff3c8', '#ffcf78', 1.2);
    for (let k = 0; k < nl; k++) {
      const L = new THREE.Group();
      L.add(mk(postG, PAL.woodDark, 0, 0.4, 0));
      L.add(mk(armG, PAL.woodDark, 0.07, 0.78, 0));
      L.add(mk(boxG, lit, 0.13, 0.68, 0)); L.add(mk(capG, PAL.woodDark, 0.13, 0.75, 0));
      const lamp = glow('#ffcf78', 0.9, 0.5); lamp.position.set(0.13, 0.68, 0); L.add(lamp);
      g.add(L); u.lights.push({ g: L, lamp, t: (k + 1) / (nl + 1), s: k % 2 ? 1 : -1 });
    }
  }
  const plankGeo = new THREE.BoxGeometry(0.66, 0.06, 0.22), postGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.42, 4);
  const ropeGeo = new THREE.CylinderGeometry(0.014, 0.014, 1, 3), endGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.7, 6);
  for (let k = 0; k < n; k++) { const m = mk(plankGeo, T(k % 3 ? PAL.wood : '#9a6c50', 'wood')); g.add(m); u.planks.push(m); }
  for (let k = 0; k <= np; k++) for (const s of [-1, 1]) { const m = mk(postGeo, PAL.woodDark); g.add(m); u.posts.push({ m, t: k / np, s }); }
  for (const s of [-1, 1]) for (let k = 0; k < n; k++) { const m = mk(ropeGeo, '#e6d3b0'); m.castShadow = false; g.add(m); u.ropes.push({ m, k, s }); }
  for (const e of [0, 1]) for (const s of [-1, 1]) {
    const m = mk(endGeo, PAL.woodDark), lamp = glow('#ffcf78', 0.6, 0.5);
    g.add(m); g.add(lamp); u.ends.push({ m, lamp, e, s });
  }
  g.userData = u;
  return g;
}
const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
/** Lays a sky bridge's planks, posts, rails and end posts between p1 and p2. */
function placeSkyBridge(g, p1, p2) {
  const u = g.userData, H = u.hump || 0, TA = u.ta || 0, TB = u.tb ?? 1, dx = p2.x - p1.x, dz = p2.z - p1.z, d = Math.hypot(dx, dz) || 1, sx = -dz / d, sz = dx / d;
  for (let k = 0; k < u.n; k++) {
    const m = u.planks[k], t = (k + 0.5) / u.n;
    bridgeAt(p1, p2, t, m.position, H, TA, TB); bridgeAt(p1, p2, Math.min(1, t + 0.01), _ba, H, TA, TB); m.lookAt(_ba);
  }
  for (const p of u.posts) { bridgeAt(p1, p2, p.t, p.m.position, H, TA, TB); p.m.position.x += sx * 0.34 * p.s; p.m.position.z += sz * 0.34 * p.s; p.m.position.y += 0.2; }
  for (const r of u.ropes) {
    bridgeAt(p1, p2, r.k / u.n, _ba, H, TA, TB); bridgeAt(p1, p2, (r.k + 1) / u.n, _bb, H, TA, TB);
    for (const v of [_ba, _bb]) { v.x += sx * 0.34 * r.s; v.z += sz * 0.34 * r.s; v.y += 0.4; }
    r.m.position.addVectors(_ba, _bb).multiplyScalar(0.5); r.m.scale.y = _ba.distanceTo(_bb) + 0.01;
    r.m.lookAt(_bb); r.m.rotateX(Math.PI / 2);
  }
  for (const L of u.lights) {
    bridgeAt(p1, p2, L.t, L.g.position, H, TA, TB); L.g.position.x += sx * 0.42 * L.s; L.g.position.z += sz * 0.42 * L.s; L.g.position.y -= 0.02;
    L.g.rotation.y = Math.atan2(-sx * L.s, -sz * L.s) - Math.PI / 2; // the lamp arm leans over the walkway
  }
  for (const e of u.ends) {
    const p = e.e ? p2 : p1;
    e.m.position.set(p.x + sx * 0.4 * e.s, p.y + 0.3, p.z + sz * 0.4 * e.s);
    e.lamp.position.set(e.m.position.x, p.y + 0.72, e.m.position.z);
  }
}

/** A flat arrow on the ground pointing +z: shows which way a house's front door faces. */
function makeDoorArrow() {
  const sh = new THREE.Shape();
  sh.moveTo(-0.07, 0); sh.lineTo(0.07, 0); sh.lineTo(0.07, 0.22); sh.lineTo(0.17, 0.22); sh.lineTo(0, 0.42); sh.lineTo(-0.17, 0.22); sh.lineTo(-0.07, 0.22); sh.closePath();
  const geo = new THREE.ShapeGeometry(sh); geo.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffd36e', transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set(0, 0.06, 0.46); m.renderOrder = 5; m.userData.arrow = true;
  return m;
}

// ---- Wild fairy critters: they fly about the islands on their own --------------------------------
/** A pair of wings (left and right) for a critter; each wing pivots at the body (userData.s is its side). */
function critterWings(col, w, h, y, z = 0, glowI = 0.5) {
  const out = [], mat = new THREE.MeshLambertMaterial({ color: col, emissive: new THREE.Color(col), emissiveIntensity: glowI, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(0, y, z); piv.userData.s = s; piv.rotation.z = s * 0.55;
    const wg = new THREE.CircleGeometry(1, 14); wg.scale(w, h, 1);
    const m = new THREE.Mesh(wg, mat); m.rotation.x = -Math.PI / 2; m.position.x = s * w * 0.9; piv.add(m); out.push(piv);
  }
  return out;
}
/** A glimmerfly: a glowing butterfly with two pairs of pastel wings. */
function makeGlimmerfly(ci = 0) {
  const g = new THREE.Group(), b = new THREE.Group(), col = ['#c9b4ff', '#ffc9e0', '#9fe8f0', '#ffe39a'][ci % 4];
  const body = mk(new THREE.CapsuleGeometry(0.018, 0.08, 3, 8), MS('#5e4a7e'), 0, 0, 0); body.rotation.x = Math.PI / 2; b.add(body);
  const wings = [...critterWings(col, 0.09, 0.07, 0.01, 0.025, 0.7), ...critterWings(col, 0.065, 0.05, 0.01, -0.035, 0.7)];
  wings.forEach(w => b.add(w));
  for (const s of [-1, 1]) { const a = mk(new THREE.CylinderGeometry(0.003, 0.003, 0.07, 3), MS('#5e4a7e'), s * 0.015, 0.03, 0.07); a.rotation.x = 0.8; a.rotation.z = -s * 0.3; b.add(a); }
  const halo = glow(col, 0.35, 0.6); b.add(halo);
  g.add(b); g.userData = { body: b, wings, halo, flap: 18 };
  return g;
}
/** A moth-fox: a tiny fox with soft moth wings and a white-tipped tail. */
function makeMothFox(ci = 0) {
  const g = new THREE.Group(), b = new THREE.Group(), fur = ['#f2a65a', '#f4d0a8', '#e9849f'][ci % 3];
  const torso = mk(new THREE.SphereGeometry(0.07, 14, 10), MS(fur), 0, 0, 0); torso.scale.set(0.85, 0.8, 1.25); b.add(torso);
  b.add(mk(new THREE.SphereGeometry(0.06, 14, 10), MS(fur), 0, 0.035, 0.09));
  b.add(mk(new THREE.SphereGeometry(0.035, 10, 8), MS('#fff6e8'), 0, 0.015, 0.125));
  b.add(mk(new THREE.SphereGeometry(0.01, 6, 4), MS('#3b2f4a'), 0, 0.022, 0.158));
  for (const s of [-1, 1]) {
    b.add(mk(new THREE.ConeGeometry(0.022, 0.06, 4), MS(fur), s * 0.03, 0.095, 0.08));
    b.add(mk(new THREE.SphereGeometry(0.009, 6, 4), MS('#3b2f4a'), s * 0.024, 0.05, 0.14));
  }
  const tail = mk(new THREE.SphereGeometry(0.045, 10, 8), MS(fur), 0, 0.03, -0.11); tail.scale.set(0.8, 0.8, 1.5); b.add(tail);
  b.add(mk(new THREE.SphereGeometry(0.03, 10, 8), MS('#ffffff'), 0, 0.04, -0.17));
  const wings = critterWings('#f4ecff', 0.13, 0.08, 0.05, 0, 0.35); wings.forEach(w => b.add(w));
  g.add(b); g.userData = { body: b, wings, flap: 9 };
  return g;
}
/** A puffbird: a round little bird of cloud-fluff with stubby wings and a sprig on its head. */
function makePuffbird(ci = 0) {
  const g = new THREE.Group(), b = new THREE.Group(), col = ['#fffaf2', '#ffe1ec', '#e3f4ff'][ci % 3];
  b.add(mk(new THREE.SphereGeometry(0.075, 16, 12), MS(col), 0, 0, 0));
  const beak = mk(new THREE.ConeGeometry(0.018, 0.04, 6), MS('#f2a65a'), 0, -0.005, 0.085); beak.rotation.x = Math.PI / 2; b.add(beak);
  for (const s of [-1, 1]) { b.add(mk(new THREE.SphereGeometry(0.011, 6, 4), MS('#3b2f4a'), s * 0.03, 0.022, 0.065)); b.add(mk(new THREE.SphereGeometry(0.012, 6, 4), MS('#f6a9a6'), s * 0.045, 0.0, 0.058)); }
  const sprig = mk(new THREE.SphereGeometry(0.02, 8, 6), MS('#7cbf6a'), 0.0, 0.085, 0.01); sprig.scale.set(0.5, 1.4, 0.3); b.add(sprig);
  const tail = mk(new THREE.ConeGeometry(0.03, 0.06, 5), MS(col), 0, 0.01, -0.08); tail.rotation.x = -Math.PI / 2.4; b.add(tail);
  const wings = critterWings(col, 0.06, 0.04, 0.01, 0, 0.1); wings.forEach(w => b.add(w));
  g.add(b); g.userData = { body: b, wings, flap: 14 };
  return g;
}
/** A glowfin: a pastel fairy fish with gauzy wing-fins and a soft glow; it glides half-under and leaps. */
function makeGlowfin(ci = 0) {
  const g = new THREE.Group(), b = new THREE.Group(), col = ['#ffb6c8', '#9fe8e0', '#ffd98a', '#c9b4ff'][ci % 4];
  const body = mk(new THREE.SphereGeometry(0.06, 14, 10), MS(col, col, 0.25), 0, 0, 0); body.scale.set(0.7, 0.75, 1.5); b.add(body);
  const belly = mk(new THREE.SphereGeometry(0.045, 10, 8), MS('#fff6ee'), 0, -0.018, 0.02); belly.scale.set(0.7, 0.55, 1.4); b.add(belly);
  for (const s2 of [-1, 1]) b.add(mk(new THREE.SphereGeometry(0.011, 6, 4), MS('#3b2f4a'), s2 * 0.03, 0.015, 0.06));
  const tail = new THREE.Group(); tail.position.z = -0.085; b.add(tail);
  const tf = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), new THREE.MeshLambertMaterial({ color: col, emissive: new THREE.Color(col), emissiveIntensity: 0.5, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  tf.rotation.y = Math.PI / 2; tf.scale.set(1, 0.8, 1); tf.position.z = -0.045; tail.add(tf);
  const dorsal = mk(new THREE.ConeGeometry(0.025, 0.06, 4), MS(col), 0, 0.05, -0.01); dorsal.scale.z = 2; b.add(dorsal);
  const wings = critterWings('#ffffff', 0.05, 0.035, 0, 0.02, 0.4); wings.forEach(w => { w.rotation.z = w.userData.s * 0.2; b.add(w); });
  const halo = glow(col, 0.3, 0.5); b.add(halo);
  g.add(b); g.userData = { body: b, tail, wings, halo };
  return g;
}
/** A lily frog: a round green frog with big eyes, rosy cheeks and a flower on its head; its throat puffs. */
function makeLilyFrog(ci = 0) {
  const g = new THREE.Group(), b = new THREE.Group(), col = ['#8fd07a', '#a8dca0', '#7cc7a8'][ci % 3], light = '#e8f6c8';
  const body = mk(new THREE.SphereGeometry(0.07, 14, 10), MS(col), 0, 0.055, 0); body.scale.set(1, 0.75, 1.05); b.add(body);
  const throat = mk(new THREE.SphereGeometry(0.035, 10, 8), MS(light), 0, 0.04, 0.05); throat.scale.set(1, 0.8, 0.7); b.add(throat);
  const eyes = [];
  for (const s2 of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s2 * 0.035, 0.1, 0.035);
    e.add(mk(new THREE.SphereGeometry(0.025, 10, 8), MS(col)));
    e.add(mk(new THREE.SphereGeometry(0.018, 10, 8), MS('#ffffff'), 0, 0.006, 0.012));
    e.add(mk(new THREE.SphereGeometry(0.01, 8, 6), MS('#2e2438'), 0, 0.008, 0.025));
    b.add(e); eyes.push(e);
    const ck = mk(new THREE.SphereGeometry(0.012, 8, 6), MS('#f6a9a6'), s2 * 0.05, 0.065, 0.045); ck.scale.set(1, 0.6, 0.4); b.add(ck);
    const hind = mk(new THREE.SphereGeometry(0.03, 10, 8), MS(col), s2 * 0.06, 0.025, -0.03); hind.scale.set(0.7, 0.55, 1.4); b.add(hind);
    const front = mk(new THREE.SphereGeometry(0.014, 8, 6), MS(col), s2 * 0.04, 0.012, 0.06); front.scale.set(1, 0.5, 1.3); b.add(front);
  }
  const fl = mk(new THREE.OctahedronGeometry(0.022, 0), MS(['#f7c6d8', '#ffffff', '#ffe39a'][ci % 3]), 0.015, 0.11, -0.01); fl.scale.y = 0.6; b.add(fl);
  g.add(b); g.userData = { body: b, throat, eyes };
  return g;
}
const WILD_KINDS = ['glimmerfly', 'mothfox', 'puffbird'];
/** A wild critter's model by kind. */
function makeWild(kind, ci) { return kind === 'mothfox' ? makeMothFox(ci) : kind === 'puffbird' ? makePuffbird(ci) : makeGlimmerfly(ci); }

/** A far-off floating island for the horizon: a flat top, a long rocky root, a tree or a tower; one shared material tints them all. */
function makeFarIsland(seed, mat) {
  const R = mrand(seed), g = new THREE.Group(), r = 1 + R() * 0.6;
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, 0.25, 9), mat));
  const root = new THREE.Mesh(new THREE.ConeGeometry(r * 0.9, r * (1.6 + R()), 8), mat); root.rotation.x = Math.PI; root.position.y = -r * 0.9 - 0.1; g.add(root);
  const n = 1 + Math.floor(R() * 3);
  for (let k = 0; k < n; k++) {
    const x = (R() - 0.5) * r, z = (R() - 0.5) * r;
    if (R() < 0.4) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.7, 6), mat); t.position.set(x, 0.45, z); g.add(t); const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 6), mat); c.position.set(x, 1.0, z); g.add(c); }
    else { const t = new THREE.Mesh(new THREE.SphereGeometry(0.28 + R() * 0.15, 8, 6), mat); t.position.set(x, 0.45, z); g.add(t); }
  }
  return g;
}
/** A pale ringed planet painted on a canvas, for the dreamy sky. */
function planetTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const ring = (front) => { g.save(); g.translate(128, 128); g.rotate(-0.35); g.beginPath(); g.ellipse(0, 0, 118, 30, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); g.lineWidth = 9; g.strokeStyle = 'rgba(255,235,250,0.75)'; g.stroke(); g.lineWidth = 3; g.strokeStyle = 'rgba(200,190,255,0.6)'; g.beginPath(); g.ellipse(0, 0, 100, 24, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); g.stroke(); g.restore(); };
  ring(false);
  const gr = g.createRadialGradient(108, 104, 8, 128, 128, 72); gr.addColorStop(0, '#fff4fb'); gr.addColorStop(0.5, '#f2c6e4'); gr.addColorStop(1, '#a99be8');
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 70, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 0.25; g.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(128, 105 + k * 22, 64 - k * 4, 5, -0.1, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1;
  ring(true);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

let _clumpGeo;
/**
 * A clump of grass: five thin blades that taper and bend outward, shaded from a deep green base to a
 * sunny tip (vertex colours), so a field of them reads soft. Shared by every clump.
 */
function grassClumpGeo() {
  if (_clumpGeo) return _clumpGeo;
  const pos = [], col = [], idx = [], base = new THREE.Color('#4f7a45'), tip = new THREE.Color('#e4f2b0'), cc = new THREE.Color(), R = mrand(311);
  for (let b = 0; b < 6; b++) {
    const a = b / 6 * Math.PI * 2 + R() * 0.6, h = 0.17 + R() * 0.13, w = 0.022 + R() * 0.01, lean = 0.05 + R() * 0.07, ox = Math.cos(a) * 0.03, oz = Math.sin(a) * 0.03;
    const dx = Math.cos(a), dz = Math.sin(a), sx = -dz, sz = dx, start = pos.length / 3, seg = 3;
    for (let k = 0; k <= seg; k++) {
      const t = k / seg, y = h * t, out = lean * t * t, ww = w * (1 - t * 0.92);
      pos.push(ox + dx * out - sx * ww, y, oz + dz * out - sz * ww, ox + dx * out + sx * ww, y, oz + dz * out + sz * ww);
      cc.copy(base).lerp(tip, Math.pow(t, 0.8)); col.push(cc.r, cc.g, cc.b, cc.r, cc.g, cc.b);
      if (k) { const q = start + (k - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const n = g.attributes.normal; for (let v = 0; v < n.count; v++) { n.setXYZ(v, n.getX(v) * 0.4, 0.9, n.getZ(v) * 0.4); } // soft, mostly-up normals: lit like a lawn, not like cards
  _clumpGeo = g; return g;
}

// ---- Pets ----------------------------------------------------------------------------------------
/** A small dog: a tan body, floppy ears and a wagging tail (userData.tail). */
function makeDog(ci = 0) {
  const g = new THREE.Group(), b = new THREE.Group(), fur = ['#d8a46a', '#f2e2c4', '#8a6248'][ci % 3], dark = '#5e4033';
  const body = mk(new THREE.CapsuleGeometry(0.06, 0.12, 4, 10), fur, 0, 0.11, 0); body.rotation.x = Math.PI / 2; b.add(body);
  b.add(mk(new THREE.SphereGeometry(0.065, 12, 9), fur, 0, 0.17, 0.11));
  b.add(mk(new THREE.SphereGeometry(0.035, 10, 7), '#f6ead6', 0, 0.155, 0.16));
  b.add(mk(new THREE.SphereGeometry(0.014, 6, 4), '#2e2438', 0, 0.165, 0.193));
  for (const x of [-0.025, 0.025]) b.add(mk(new THREE.SphereGeometry(0.01, 6, 4), '#2e2438', x, 0.19, 0.165));
  for (const s of [-1, 1]) { const e = mk(new THREE.SphereGeometry(0.03, 8, 6), dark, s * 0.055, 0.17, 0.1); e.scale.set(0.5, 1.4, 0.8); e.rotation.z = s * 0.3; b.add(e); }
  const legs = [];
  for (const [x, z] of [[-0.035, 0.07], [0.035, 0.07], [-0.035, -0.06], [0.035, -0.06]]) { const hip = new THREE.Group(); hip.position.set(x, 0.075, z); hip.add(mk(new THREE.CylinderGeometry(0.016, 0.014, 0.075, 6), fur, 0, -0.075 / 2, 0)); b.add(hip); legs.push(hip); }
  const tail = new THREE.Group(); tail.position.set(0, 0.14, -0.11); const t = mk(new THREE.CylinderGeometry(0.01, 0.016, 0.09, 5), fur, 0, 0.04, 0); t.rotation.x = -0.6; tail.add(t); b.add(tail);
  g.add(b); g.userData = { body: b, tail, legs, stride: 26 }; return g;
}
/** A cat: slim, pointed ears, a tail curling up. */
function makeCat(ci = 0) {
  const g = new THREE.Group(), b = new THREE.Group(), fur = ['#f0a35e', '#9a92a8', '#3f3a4a', '#f4efe8'][ci % 4];
  const body = mk(new THREE.CapsuleGeometry(0.045, 0.11, 4, 10), fur, 0, 0.1, 0); body.rotation.x = Math.PI / 2; b.add(body);
  b.add(mk(new THREE.SphereGeometry(0.055, 12, 9), fur, 0, 0.16, 0.1));
  for (const s of [-1, 1]) { const e = mk(new THREE.ConeGeometry(0.022, 0.05, 4), fur, s * 0.03, 0.215, 0.1); e.rotation.z = -s * 0.25; b.add(e); }
  for (const x of [-0.02, 0.02]) b.add(mk(new THREE.SphereGeometry(0.009, 6, 4), '#9fd17c', x, 0.17, 0.15));
  b.add(mk(new THREE.SphereGeometry(0.008, 5, 4), '#e98c9f', 0, 0.155, 0.155));
  const legs = [];
  for (const [x, z] of [[-0.025, 0.06], [0.025, 0.06], [-0.025, -0.05], [0.025, -0.05]]) { const hip = new THREE.Group(); hip.position.set(x, 0.075, z); hip.add(mk(new THREE.CylinderGeometry(0.012, 0.011, 0.075, 6), fur, 0, -0.075 / 2, 0)); b.add(hip); legs.push(hip); }
  const tail = new THREE.Group(); tail.position.set(0, 0.12, -0.1);
  const t1 = mk(new THREE.CylinderGeometry(0.009, 0.012, 0.1, 5), fur, 0, 0.04, -0.02); t1.rotation.x = -0.5; tail.add(t1);
  const t2 = mk(new THREE.CylinderGeometry(0.008, 0.009, 0.07, 5), fur, 0, 0.1, -0.03); t2.rotation.x = 0.4; tail.add(t2); b.add(tail);
  g.add(b); g.userData = { body: b, tail, legs, stride: 30 }; return g;
}
/** A bunny: round, long ears, a cotton tail. */
function makeBunny(ci = 0) {
  const g = new THREE.Group(), b = new THREE.Group(), fur = ['#fbf5ee', '#d9bfa4', '#b8b0c4'][ci % 3];
  const body = mk(new THREE.SphereGeometry(0.075, 12, 9), fur, 0, 0.08, 0); body.scale.set(0.9, 0.85, 1.1); b.add(body);
  b.add(mk(new THREE.SphereGeometry(0.05, 12, 9), fur, 0, 0.14, 0.07));
  for (const s of [-1, 1]) { const e = mk(new THREE.CapsuleGeometry(0.014, 0.07, 3, 8), fur, s * 0.02, 0.22, 0.06); e.rotation.z = s * 0.15; b.add(e);
    const inner = mk(new THREE.CapsuleGeometry(0.007, 0.05, 3, 6), '#f4b6c8', s * 0.02, 0.22, 0.072); inner.rotation.z = s * 0.15; b.add(inner); }
  for (const x of [-0.02, 0.02]) b.add(mk(new THREE.SphereGeometry(0.008, 6, 4), '#2e2438', x, 0.15, 0.11));
  b.add(mk(new THREE.SphereGeometry(0.008, 5, 4), '#e98c9f', 0, 0.135, 0.118));
  const tail = new THREE.Group(); tail.position.set(0, 0.08, -0.085); tail.add(mk(new THREE.SphereGeometry(0.025, 8, 6), '#ffffff')); b.add(tail);
  const legs = []; // big hind feet and small front paws: they push off and tuck in on each hop
  for (const [x, z, big] of [[-0.04, -0.03, 1], [0.04, -0.03, 1], [-0.025, 0.07, 0], [0.025, 0.07, 0]]) {
    const hip = new THREE.Group(); hip.position.set(x, 0.05, z);
    const f = mk(new THREE.SphereGeometry(big ? 0.028 : 0.016, 8, 6), fur, 0, -0.04, big ? 0.02 : 0); f.scale.set(0.8, 0.6, big ? 1.8 : 1.2); hip.add(f);
    b.add(hip); legs.push(hip);
  }
  g.add(b); g.userData = { body: b, tail, legs, hop: true, stride: 16 }; return g;
}
/** A sky-fairy: a tiny glowing body with four shimmering wings and a soft light. */
function makeFairy(ci = 0) {
  const g = new THREE.Group(), b = new THREE.Group(), hue = ['#ffb6e1', '#b6e6ff', '#d6c2ff', '#c8ffd8'][ci % 4];
  b.add(mk(new THREE.CapsuleGeometry(0.018, 0.04, 3, 8), M(hue, hue, 0.9), 0, 0, 0));
  b.add(mk(new THREE.SphereGeometry(0.022, 10, 8), M('#fff6ee', '#ffe8d0', 0.6), 0, 0.045, 0));
  const wingGeo = new THREE.CircleGeometry(0.05, 10); wingGeo.scale(1, 0.55, 1);
  const wingMat = new THREE.MeshBasicMaterial({ color: hue, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
  const wings = [];
  for (const s of [-1, 1]) for (const up of [1, -1]) {
    const pivot = new THREE.Group(); pivot.position.set(0, 0.01 * up, -0.01);
    const w = new THREE.Mesh(wingGeo, wingMat); w.position.set(s * 0.045, 0.012 * up, 0); w.rotation.z = up * 0.35 * s; w.scale.setScalar(up > 0 ? 1 : 0.7);
    pivot.add(w); pivot.userData.s = s; b.add(pivot); wings.push(pivot);
  }
  const halo = glow(hue, 0.45, 0.8); b.add(halo);
  g.add(b); g.userData = { body: b, wings, halo, fairy: true }; return g;
}
/** A pet's model by kind. */
function makePet(kind, ci) { return kind === 'dog' ? makeDog(ci) : kind === 'cat' ? makeCat(ci) : kind === 'bunny' ? makeBunny(ci) : makeFairy(ci); }

// ---- Iteration 24: twelve more pieces --------------------------------------------------------
// Each sets userData.anim(t, night, wind, seed, k): t the clock, night 0..1, wind the weather's
// strength 0..1, k how built (or grown) it is. The game calls it every frame.
const V2 = (x, y) => new THREE.Vector2(x, y);
function lathe(pts, seg = 16) { return new THREE.LatheGeometry(pts.map(([x, y]) => V2(x, y)), seg); }
/** A fresh (unshared) glowing material, so each piece can breathe on its own beat. */
function GM(color, emissive, ei = 0.5, opts) { const m = new THREE.MeshLambertMaterial(Object.assign({ color, emissive: new THREE.Color(emissive), emissiveIntensity: ei }, opts || {})); return m; }
const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

/** Bloombox: a tulip post-box on a crooked post; its petals open and close, a letter peeks out. */
function makeBloombox(seed = 1) {
  const g = new THREE.Group(), R = mrand(seed + 3);
  const post = mk(new THREE.CylinderGeometry(0.03, 0.04, 0.62, 7), T('#b98a64', 'wood'), 0, 0.31, 0); post.rotation.z = 0.06; g.add(post);
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4, l = mk(new THREE.ConeGeometry(0.05, 0.2, 4), MS('#9cc27a'), Math.cos(a) * 0.06, 0.08, Math.sin(a) * 0.06); l.scale.z = 0.3; l.rotation.set(Math.sin(a) * 0.6, -a, -Math.cos(a) * 0.6); g.add(l); }
  const cup = new THREE.Group(); cup.position.set(0.035, 0.62, 0); g.add(cup);
  cup.add(mk(lathe([[0, 0], [0.07, 0.01], [0.12, 0.06], [0.135, 0.13], [0.12, 0.19]], 14), new THREE.MeshLambertMaterial({ color: '#f4a6b8', side: THREE.DoubleSide })));
  const petals = [];
  for (let k = 0; k < 3; k++) {
    const pv = new THREE.Group(), a = k / 3 * Math.PI * 2; pv.position.set(Math.cos(a) * 0.11, 0.12, Math.sin(a) * 0.11); pv.rotation.y = -a + Math.PI / 2; cup.add(pv);
    const p = mk(new THREE.SphereGeometry(0.075, 10, 8), MS('#f7c3cf'), 0, 0.07, 0); p.scale.set(0.75, 1.15, 0.22); pv.add(p); petals.push(pv);
  }
  const letter = mk(new THREE.BoxGeometry(0.11, 0.075, 0.012), MS('#fff4e0'), 0, 0.2, 0); letter.rotation.set(0.25, 0.4, 0.2); cup.add(letter);
  letter.add(mk(new THREE.BoxGeometry(0.025, 0.025, 0.014), MS('#d9785a'), 0.02, 0, 0)); // a wax seal
  const flag = new THREE.Group(); flag.position.set(-0.13, 0.08, 0); cup.add(flag);
  flag.add(mk(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 4), PAL.woodDark, 0, 0.08, 0));
  flag.add(mk(new THREE.BoxGeometry(0.07, 0.045, 0.01), M(PAL.gold, '#ffcf60', 0.3), -0.035, 0.14, 0));
  const halo = glow('#ffd98a', 0.4, 0); halo.position.y = 0.16; cup.add(halo);
  g.userData.anim = (t, night, wind, s) => {
    const o = 0.5 + 0.5 * Math.sin(t * 1.05 + s);
    petals.forEach((pv, k) => { pv.rotation.x = -0.15 - o * 0.55 - Math.sin(t * 2 + k) * 0.03; });
    letter.position.y = 0.15 + o * 0.07; flag.rotation.z = Math.sin(t * 1.6 + s) * 0.15 * (1 + wind);
    halo.material.opacity = 0.15 + o * 0.25 + night * 0.4;
  };
  return g;
}
/** Lull Bench: a cushioned bench under a wire hoop where lantern-moths doze and flutter. */
function makeLullBench(seed = 1) {
  const g = new THREE.Group(), wood = T('#e8d2b0', 'wood'), leg = T('#a8785a', 'wood');
  g.add(mk(new THREE.BoxGeometry(0.62, 0.045, 0.22), wood, 0, 0.21, 0.02));
  const back = mk(new THREE.BoxGeometry(0.62, 0.17, 0.035), wood, 0, 0.34, -0.09); back.rotation.x = -0.18; g.add(back);
  for (const x of [-0.27, 0.27]) for (const z of [-0.06, 0.1]) g.add(mk(new THREE.CylinderGeometry(0.022, 0.026, 0.2, 6), leg, x, 0.1, z));
  for (const x of [-0.29, 0.29]) g.add(mk(new THREE.BoxGeometry(0.035, 0.03, 0.22), leg, x, 0.3, 0.02)); // armrests
  const cush = mk(new THREE.SphereGeometry(0.1, 12, 8), MS('#b4c8f0'), -0.1, 0.25, 0.03); cush.scale.set(1.8, 0.35, 0.9); g.add(cush);
  const pil = mk(new THREE.SphereGeometry(0.06, 10, 8), MS('#f4c8d8'), 0.18, 0.3, -0.04); pil.scale.set(1, 0.9, 0.5); pil.rotation.x = -0.3; g.add(pil);
  const hoop = mk(new THREE.TorusGeometry(0.36, 0.012, 6, 28, Math.PI), MS('#c8b4e8'), 0, 0.12, -0.14); g.add(hoop);
  for (let k = 0; k < 7; k++) { const a = 0.3 + k / 6 * (Math.PI - 0.6), f = makeFlower(pick(['#f4b6c8', '#c9a7f2', '#fff6e8'], mrand(seed + k)), 0.45, mrand(seed * 3 + k)); f.position.set(Math.cos(a) * 0.36, 0.12 + Math.sin(a) * 0.36, -0.14); f.rotation.x = Math.PI / 2; f.scale.setScalar(0.6); g.add(f); }
  const moths = [];
  for (let k = 0; k < 3; k++) {
    const m = new THREE.Group(), a = [0.55, Math.PI / 2, 2.55][k]; m.userData.a = a; g.add(m);
    m.add(mk(new THREE.SphereGeometry(0.022, 8, 6), MS('#fff1c9', '#ffd98a', 0.6)));
    const wings = [];
    for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), new THREE.MeshLambertMaterial({ color: '#fff6e0', transparent: true, opacity: 0.85, side: THREE.DoubleSide })); w.position.x = s * 0.03; w.scale.set(1, 0.75, 1); w.rotation.x = Math.PI / 2; const pv = new THREE.Group(); pv.add(w); pv.userData.s = s; m.add(pv); wings.push(pv); }
    const h = glow('#ffd98a', 0.22, 0.5); m.add(h); m.userData.wings = wings; m.userData.halo = h; moths.push(m);
  }
  g.userData.anim = (t, night, wind, s) => moths.forEach((m, k) => {
    const a = m.userData.a + Math.sin(t * 0.4 + k * 2 + s) * 0.12, r = 0.36 + 0.05 + Math.sin(t * 1.3 + k) * 0.02;
    m.position.set(Math.cos(a) * r, 0.12 + Math.sin(a) * r + Math.sin(t * 2.1 + k * 1.7) * 0.025, -0.14 + Math.sin(t * 0.9 + k) * 0.04);
    m.userData.wings.forEach(w => { w.rotation.z = w.userData.s * (0.2 + Math.abs(Math.sin(t * (3 + k * 0.7) + k)) * 0.8); });
    m.userData.halo.material.opacity = 0.25 + night * 0.7;
  });
  return g;
}
/** Dreamkite: a Wind-folk kite on a carved post, drifting in a slow figure-eight; quicker in wind. */
function makeDreamkite(seed = 1) {
  const g = new THREE.Group();
  g.add(mk(new THREE.CylinderGeometry(0.1, 0.12, 0.05, 8), T(PAL.stoneShade, 'stone'), 0, 0.025, 0));
  g.add(mk(new THREE.CylinderGeometry(0.035, 0.045, 0.55, 7), T('#8a6a8f', 'wood'), 0, 0.3, 0));
  for (const y of [0.22, 0.42]) { const r = mk(new THREE.TorusGeometry(0.043, 0.01, 4, 12), PAL.gold, 0, y, 0); r.rotation.x = Math.PI / 2; g.add(r); }
  g.add(mk(new THREE.SphereGeometry(0.045, 8, 6), MS('#b48ce8', '#b48ce8', 0.3), 0, 0.6, 0));
  const kite = new THREE.Group(); g.add(kite);
  const face = new THREE.Group(); kite.add(face);
  const d1 = mk(new THREE.BoxGeometry(0.26, 0.26, 0.012), MS('#b48ce8'), 0, 0, 0); d1.rotation.z = Math.PI / 4; face.add(d1);
  const d2 = mk(new THREE.BoxGeometry(0.15, 0.15, 0.016), MS('#f4e6ff', '#e8d8ff', 0.4), 0, 0, 0); d2.rotation.z = Math.PI / 4; face.add(d2);
  face.add(mk(new THREE.SphereGeometry(0.025, 8, 6), MS('#fff3c8', '#ffd98a', 0.9), 0, 0, 0.012)); // its little eye
  const kh = glow('#d8c8ff', 0.6, 0.4); face.add(kh);
  const tails = [];
  ['#f4a6b8', '#a8d8e8', '#f5c76b'].forEach((c, k) => {
    let parent = face; const segs = [];
    for (let n = 0; n < 5; n++) { const pv = new THREE.Group(); pv.position.set(n ? 0 : (k - 1) * 0.04, n ? -0.06 : -0.18, 0); parent.add(pv); const b = mk(new THREE.BoxGeometry(0.022, 0.06, 0.006), MS(c), 0, -0.03, 0); b.castShadow = false; pv.add(b); segs.push(pv); parent = pv; }
    tails.push(segs);
  });
  const strG = new THREE.BufferGeometry(); strG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 12), 3));
  const str = new THREE.Line(strG, new THREE.LineBasicMaterial({ color: '#fff4e0', transparent: true, opacity: 0.8 })); g.add(str);
  let ph = 0, lt = null;
  g.userData.anim = (t, night, wind, s) => {
    const dt = lt === null ? 0 : Math.min(0.1, Math.max(0, t - lt)); lt = t; ph += dt * (0.55 + wind * 1.1);
    const x = Math.sin(ph + s) * 0.32, y = 1.35 + Math.sin(2 * (ph + s)) * 0.1, z = -0.35 + Math.cos(ph * 0.7 + s) * 0.08;
    kite.position.set(x, y, z); face.rotation.set(-0.35, Math.sin(ph + s) * -0.3, Math.cos(ph + s) * 0.35);
    tails.forEach((segs, k) => segs.forEach((pv, n) => { pv.rotation.z = Math.sin(t * (2.5 + wind * 3) - n * 0.8 + k) * (0.25 + wind * 0.2); }));
    const pa = strG.attributes.position; // the string sags from the post to the kite
    for (let n = 0; n < 12; n++) { const u = n / 11; pa.setXYZ(n, x * u, 0.6 + (y - 0.6) * u - Math.sin(Math.PI * u) * 0.12, z * u); }
    pa.needsUpdate = true; kh.material.opacity = 0.2 + night * 0.6;
  };
  return g;
}
/** Puffcap: three soft mushrooms on a moss cushion; their caps hum with light at dusk. */
function makePuffcap(seed = 1, mask = 0) {
  const g = new THREE.Group(), R = mrand(seed + 11), caps = [];
  const moss = mk(new THREE.SphereGeometry(0.3, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), T('#8fbf74', 'grass'), 0, 0, 0); moss.scale.y = mask ? 0.1 : 0.18; g.add(moss);
  [[0, 0, 0.42, 0.15, '#c8a4e8', '#b48ce8'], [-0.15, 0.08, 0.26, 0.11, '#a8c8f0', '#8fb4ff'], [0.14, 0.1, 0.3, 0.12, '#f4b8c8', '#f49ab0']].forEach(([x, z, h, r, c, e]) => {
    const m = new THREE.Group(); m.position.set(x, 0.03, z); m.rotation.z = (R() - 0.5) * 0.25; g.add(m);
    m.add(mk(new THREE.CylinderGeometry(r * 0.28, r * 0.38, h, 8), MS('#fff4e0'), 0, h / 2, 0));
    const mat = GM(c, e, 0.2); const cap = mk(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, 0, h - 0.01, 0); cap.scale.y = 0.75; m.add(cap);
    const under = mk(new THREE.CylinderGeometry(r * 0.98, r * 0.4, 0.02, 14), MS('#f2e6d6'), 0, h - 0.012, 0); m.add(under);
    for (let k = 0; k < 5; k++) { const a = R() * Math.PI * 2, el = 0.3 + R() * 0.9, sp = mk(new THREE.SphereGeometry(r * 0.13, 6, 5), MS('#fffaf0', '#fff4e0', 0.5), Math.cos(a) * Math.cos(el) * r, h - 0.01 + Math.sin(el) * r * 0.75, Math.sin(a) * Math.cos(el) * r); sp.scale.y = 0.5; m.add(sp); }
    const h2 = glow(e, r * 4, 0); h2.position.y = h - 0.03; m.add(h2);
    caps.push({ mat, h2, ph: R() * 6 });
  });
  for (let k = 0; k < 4; k++) { const a = R() * Math.PI * 2, b = blade('#86b86a', 0.08 + R() * 0.06, Math.cos(a) * 0.24, Math.sin(a) * 0.24, R); g.add(b); }
  g.userData.anim = (t, night, wind, s, k) => caps.forEach(c => {
    const p = 0.5 + 0.5 * Math.sin(t * 1.2 + c.ph + s), on = sstep(0.6, 1, k);
    c.mat.emissiveIntensity = (0.12 + p * 0.25 + night * 0.65) * on; c.h2.material.opacity = (0.08 + p * 0.12 + night * 0.5) * on;
  });
  const out = new THREE.Group(); g.scale.setScalar(1.3); out.add(g); out.userData.anim = g.userData.anim; // drawn small, shown bigger (the game scales the outer group as it grows)
  if (mask) { // joined to a planted neighbour: a flat moss bed runs out to it, tufts spill over, pale stones on the open sides
    joinedBase(out, mask, T('#8fbf74', 'grass'), 0.03, 0.42);
    for (const [bit, dx, dz] of SIDES) {
      if (mask & bit) for (let k = 0; k < 3; k++) { const t = (R() - 0.5) * 0.7, o = 0.4 + R() * 0.1, m = mk(new THREE.IcosahedronGeometry(0.035, 0), MS('#7cae6a'), dx ? dx * o : t, 0.03, dz ? dz * o : t); m.scale.y = 0.6; out.add(m); }
      else for (let k = 0; k < 4; k++) { const t = (k + 0.5) / 4 * 0.8 - 0.4; out.add(mk(new THREE.DodecahedronGeometry(0.03, 0), T('#e6dcd0', 'stone'), dx ? dx * 0.42 : t, 0.035, dz ? dz * 0.42 : t)); }
    }
  }
  return out;
}
/** Hushwillow: a bent willow with a soft crown and long fronds that sway; two seed-pods glow in it. */
function makeHushwillow(seed = 1) {
  const g = new THREE.Group(), R = mrand(seed + 17), bark = T('#9a7a68', 'bark');
  for (let k = 0; k < 4; k++) { const a = k * 1.6 + 0.3, r = mk(new THREE.ConeGeometry(0.05, 0.22, 5), bark, Math.cos(a) * 0.1, 0.05, Math.sin(a) * 0.1); r.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); g.add(r); }
  const t1 = mk(new THREE.CylinderGeometry(0.06, 0.1, 0.55, 7), bark, 0.02, 0.27, 0); t1.rotation.z = -0.15; g.add(t1);
  const t2 = mk(new THREE.CylinderGeometry(0.045, 0.06, 0.5, 7), bark, 0.1, 0.75, 0); t2.rotation.z = 0.2; g.add(t2);
  const crownY = 1.08, crown = mk(new THREE.IcosahedronGeometry(0.42, 1), T('#a8c890', 'leaf'), 0.04, crownY, 0); crown.scale.set(1, 0.55, 1); g.add(crown);
  g.add(mk(new THREE.IcosahedronGeometry(0.26, 1), T('#bcd8a4', 'leaf'), 0.1, crownY + 0.16, 0.05));
  const fronds = [], fm = T('#c4dca8', 'leaf'), fm2 = T('#b0cf94', 'leaf');
  for (let k = 0; k < 11; k++) {
    const a = k / 11 * Math.PI * 2 + R() * 0.3, r = 0.33 + R() * 0.08, len = 0.45 + R() * 0.3, pv = new THREE.Group();
    pv.position.set(0.04 + Math.cos(a) * r, crownY - 0.05, Math.sin(a) * r); g.add(pv);
    const f = mk(new THREE.ConeGeometry(0.05, len, 5), k % 2 ? fm : fm2, 0, -len / 2, 0); f.rotation.x = Math.PI; f.scale.z = 0.5; f.rotation.y = a; pv.add(f);
    pv.userData.ph = R() * 6; fronds.push(pv);
  }
  const pods = [];
  for (const [x, z] of [[0.3, 0.12], [-0.2, -0.22]]) { const pd = mk(new THREE.SphereGeometry(0.045, 10, 8), GM('#fff1c9', '#ffd98a', 0.5), x, crownY - 0.22, z); g.add(pd); const h = glow('#ffe6a0', 0.45, 0); pd.add(h); pods.push({ pd, h }); }
  g.userData.anim = (t, night, wind, s, k) => {
    fronds.forEach(pv => { pv.rotation.x = Math.sin(t * 0.9 + pv.userData.ph + s) * (0.06 + wind * 0.12); pv.rotation.z = Math.sin(t * 0.7 + pv.userData.ph * 1.3) * (0.05 + wind * 0.1); });
    pods.forEach((p, n) => { p.pd.position.y = crownY - 0.22 + Math.sin(t * 1.1 + n * 2 + s) * 0.03; p.h.material.opacity = (0.15 + night * 0.7) * sstep(0.7, 1, k); });
  };
  return g;
}
/** Starbloom: a crystal flower that stays shut by day and opens when the stars come out. */
function makeStarbloom(seed = 1) {
  const g = new THREE.Group(), R = mrand(seed + 23);
  const stem = mk(new THREE.CylinderGeometry(0.014, 0.022, 0.42, 6), MS('#8fbf74'), 0, 0.21, 0); stem.rotation.z = 0.05; g.add(stem);
  for (const s of [-1, 1]) { const l = mk(new THREE.ConeGeometry(0.05, 0.22, 4), MS('#86b86a'), s * 0.06, 0.12, 0); l.scale.z = 0.3; l.rotation.z = -s * 1.0; g.add(l); }
  for (let k = 0; k < 5; k++) { const a = R() * Math.PI * 2, b = blade('#a8cf86', 0.06 + R() * 0.05, Math.cos(a) * 0.12, Math.sin(a) * 0.12, R); g.add(b); }
  const head = new THREE.Group(); head.position.y = 0.43; g.add(head);
  const pmat = GM('#d8e8ff', '#c8d8ff', 0.3, { transparent: true, opacity: 0.9 }), petals = [];
  for (let k = 0; k < 5; k++) {
    const pv = new THREE.Group(); pv.rotation.y = k / 5 * Math.PI * 2; head.add(pv);
    const p = mk(new THREE.OctahedronGeometry(0.06, 0), k % 2 ? pmat : GM('#f4dcf0', '#f4c8e8', 0.3, { transparent: true, opacity: 0.9 }), 0, 0.08, 0); p.scale.set(0.6, 1.5, 0.25); pv.add(p); petals.push({ pv, p });
  }
  const pearl = mk(new THREE.SphereGeometry(0.03, 10, 8), GM('#fff4c0', '#ffe08a', 0.6), 0, 0.02, 0); head.add(pearl);
  const halo = glow('#cfe0ff', 0.7, 0); head.add(halo);
  const motes = [0, 0.5].map(o => { const m = glow('#fff3c8', 0.12, 0); m.userData.o = o; g.add(m); return m; });
  g.userData.anim = (t, night, wind, s, k) => {
    const open = sstep(0.15, 0.7, night) * sstep(0.8, 1, k);
    petals.forEach(({ pv }, n) => { pv.rotation.x = 0.12 + open * (1.05 + Math.sin(t * 0.8 + n) * 0.05); });
    pearl.material.emissiveIntensity = 0.3 + open * 1.2; pmat.emissiveIntensity = 0.2 + open * 0.6; halo.material.opacity = open * (0.55 + Math.sin(t * 1.4 + s) * 0.1);
    head.rotation.z = Math.sin(t * 0.8 + s) * 0.04 * (1 + wind * 3);
    motes.forEach(m => { const u = (t * 0.18 + m.userData.o + s * 0.1) % 1; m.position.set(Math.sin(u * 8 + s) * 0.08, 0.46 + u * 0.8, Math.cos(u * 6) * 0.08); m.material.opacity = Math.sin(Math.PI * u) * open; });
  };
  const out = new THREE.Group(); g.scale.setScalar(1.7); out.add(g); out.userData.anim = g.userData.anim; // drawn small, shown bigger (the game scales the outer group as it grows)
  return out;
}
/** Dewfall Fountain: a two-bowl fountain whose dew rises upward to a glowing pearl. */
function makeDewfall(seed = 1) {
  const g = new THREE.Group(), stone = T('#e6dccb', 'stone');
  g.add(mk(lathe([[0, 0], [0.4, 0], [0.42, 0.05], [0.38, 0.17], [0.34, 0.2], [0.31, 0.12], [0, 0.12]], 20), stone));
  const wmat = GM('#a8d8e8', '#7fd0ff', 0.35); g.add(mk(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 20), wmat, 0, 0.16, 0));
  g.add(mk(new THREE.CylinderGeometry(0.06, 0.09, 0.42, 10), T('#d8ccb8', 'stone'), 0, 0.37, 0));
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.add(mk(new THREE.BoxGeometry(0.02, 0.38, 0.02), T('#cfc2ae', 'stone'), Math.cos(a) * 0.075, 0.37, Math.sin(a) * 0.075)); } // flutes
  g.add(mk(lathe([[0, 0], [0.06, 0], [0.18, 0.06], [0.2, 0.09], [0.17, 0.08], [0, 0.05]], 18), stone, 0, 0.56, 0));
  g.add(mk(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 16), wmat, 0, 0.635, 0));
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.4, m = mk(new THREE.SphereGeometry(0.045, 8, 6), MS('#7cae6a'), Math.cos(a) * 0.38, 0.19, Math.sin(a) * 0.38); m.scale.set(1.3, 0.35, 0.8); g.add(m); }
  const pearl = mk(new THREE.SphereGeometry(0.05, 12, 10), GM('#fff4e0', '#ffe8c0', 0.6), 0, 0.95, 0); g.add(pearl);
  const halo = glow('#d6ecff', 0.7, 0.4); halo.position.y = 0.95; g.add(halo);
  const drops = [];
  for (let k = 0; k < 7; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshLambertMaterial({ color: '#c8ecff', emissive: new THREE.Color('#a8e0ff'), emissiveIntensity: 0.6, transparent: true, opacity: 0 })); d.userData.o = k / 7; g.add(d); drops.push(d); }
  g.userData.anim = (t, night, wind, s, k) => {
    drops.forEach((d, n) => { const u = (t * 0.32 + d.userData.o) % 1, a = d.userData.o * 6.28 + t * 0.4, r = 0.22 * (1 - u) + 0.02; d.position.set(Math.cos(a) * r, 0.17 + u * 0.78, Math.sin(a) * r); d.material.opacity = Math.sin(Math.PI * u) * 0.9 * k; });
    const p = 0.5 + 0.5 * Math.sin(t * 1.3 + s); pearl.position.y = 0.95 + Math.sin(t * 0.9 + s) * 0.03; halo.position.y = pearl.position.y;
    pearl.material.emissiveIntensity = 0.4 + p * 0.5 + night * 0.5; halo.material.opacity = (0.25 + p * 0.25 + night * 0.4) * k; wmat.emissiveIntensity = 0.25 + night * 0.45;
  };
  return g;
}
let _loomTex;
/** The Dream Loom's cloth: pink and blue bands, softly woven. */
function loomTex() {
  if (_loomTex) return _loomTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  for (let y = 0; y < 64; y += 8) { x.fillStyle = ['#f4c8d8', '#c8d8f4', '#f6e7d2', '#d8c8f4'][(y / 8) % 4]; x.fillRect(0, y, 64, 8); }
  x.strokeStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 64; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.stroke(); }
  _loomTex = new THREE.CanvasTexture(c); _loomTex.colorSpace = THREE.SRGBColorSpace; return _loomTex;
}
/** Dream Loom: a frame loom weaving by itself, its shuttle sliding, petals drifting into the cloth. */
function makeDreamLoom(seed = 1) {
  const g = new THREE.Group(), wood = T('#b98a64', 'wood'), R = mrand(seed + 29);
  for (const x of [-0.3, 0.3]) { g.add(mk(new THREE.BoxGeometry(0.05, 0.8, 0.05), wood, x, 0.4, 0)); g.add(mk(new THREE.BoxGeometry(0.06, 0.04, 0.3), wood, x, 0.02, 0)); }
  g.add(mk(new THREE.BoxGeometry(0.7, 0.05, 0.06), wood, 0, 0.8, 0));
  g.add(mk(new THREE.BoxGeometry(0.64, 0.04, 0.05), wood, 0, 0.2, 0.04));
  for (const x of [-0.31, 0.31]) g.add(mk(new THREE.SphereGeometry(0.035, 8, 6), PAL.gold, x, 0.84, 0));
  const tex = loomTex(), cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.5), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, emissive: new THREE.Color('#f4d8ff'), emissiveIntensity: 0.1 }));
  cloth.position.set(0, 0.5, 0.01); g.add(cloth);
  for (let k = 0; k < 9; k++) { const th = mk(new THREE.BoxGeometry(0.004, 0.25, 0.004), MS('#fff6e8'), -0.24 + k * 0.06, 0.32, 0.03); th.castShadow = false; g.add(th); } // the warp below the cloth
  const shuttle = mk(new THREE.SphereGeometry(0.03, 10, 8), M(PAL.gold, '#ffcf60', 0.3), 0, 0.27, 0.05); shuttle.scale.set(3, 0.8, 0.8); g.add(shuttle);
  const sack = mk(new THREE.SphereGeometry(0.09, 10, 8), T('#d8c098', 'straw'), 0.36, 0.08, 0.2); sack.scale.set(0.9, 1.05, 0.9); g.add(sack);
  const petals = [];
  for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshLambertMaterial({ color: pick(['#f4a6b8', '#f7cfd9', '#c9a7f2'], R), transparent: true, opacity: 0 })); p.scale.set(1, 0.3, 0.7); p.userData.o = k / 3; g.add(p); petals.push(p); }
  const mist = glow('#f4e6ff', 0.9, 0.2); mist.position.set(0, 0.5, 0.05); g.add(mist);
  g.userData.anim = (t, night, wind, s, k) => {
    const u = Math.sin(t * 1.4 + s); shuttle.position.x = u * 0.24; shuttle.rotation.z = Math.cos(t * 1.4 + s) * 0.1;
    tex.offset.y = -t * 0.01; cloth.material.emissiveIntensity = 0.08 + night * 0.35;
    petals.forEach((p, n) => { const v = (t * 0.15 + p.userData.o + s * 0.1) % 1; p.position.set(0.5 - v * 0.5 + Math.sin(v * 9 + n) * 0.05, 0.75 - v * 0.3 + Math.sin(v * 6) * 0.04, 0.25 - v * 0.24); p.rotation.set(v * 6, v * 4, 0); p.material.opacity = Math.sin(Math.PI * v) * k; });
    mist.material.opacity = (0.12 + night * 0.35 + Math.sin(t * 0.7 + s) * 0.05) * k;
  };
  return g;
}
/** Bellcote: a little woven-roofed tower with a gold bell that swings harder when the wind blows. */
function makeBellcote(seed = 1) {
  const g = new THREE.Group(), wood = T('#a8785a', 'wood');
  g.add(mk(new THREE.CylinderGeometry(0.3, 0.33, 0.08, 10), T('#e8d8c0', 'stone'), 0, 0.04, 0));
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; g.add(mk(new THREE.CylinderGeometry(0.022, 0.026, 0.82, 6), wood, Math.cos(a) * 0.22, 0.49, Math.sin(a) * 0.22)); }
  const ring = mk(new THREE.TorusGeometry(0.23, 0.02, 4, 4), wood, 0, 0.88, 0); ring.rotation.x = Math.PI / 2; ring.rotation.z = Math.PI / 4; g.add(ring);
  g.add(mk(bentCone(0.36, 0.4, -0.04, 10), T('#c8a070', 'straw'), 0, 1.09, 0));
  g.add(mk(new THREE.SphereGeometry(0.03, 8, 6), PAL.gold, 0, 1.31, 0));
  const swing = new THREE.Group(); swing.position.y = 0.86; g.add(swing);
  swing.add(mk(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 4), PAL.woodDark, 0, -0.03, 0));
  const bell = mk(lathe([[0, 0], [0.05, -0.005], [0.075, -0.06], [0.09, -0.16], [0.12, -0.21], [0.115, -0.22], [0, -0.2]], 16), M(PAL.gold, '#ffcf60', 0.25), 0, -0.05, 0); swing.add(bell);
  const clap = new THREE.Group(); clap.position.y = -0.1; swing.add(clap);
  clap.add(mk(new THREE.SphereGeometry(0.025, 8, 6), PAL.woodDark, 0, -0.1, 0));
  const charms = [];
  for (const s of [-1, 1]) { const pv = new THREE.Group(); pv.position.set(s * 0.16, 0.86, s * 0.16); g.add(pv); pv.add(mk(new THREE.BoxGeometry(0.025, 0.16, 0.005), MS('#b48ce8'), 0, -0.08, 0)); pv.add(mk(new THREE.OctahedronGeometry(0.02, 0), M('#d8c8ff', '#b48ce8', 0.6), 0, -0.18, 0)); charms.push(pv); }
  const halo = glow('#ffd98a', 0.5, 0); halo.position.y = 0.7; g.add(halo);
  g.userData.anim = (t, night, wind, s, k) => {
    const amp = 0.06 + wind * 0.32, sw = Math.sin(t * 2.2 + s) * amp;
    swing.rotation.z = sw; swing.rotation.x = Math.sin(t * 1.7 + s) * amp * 0.3; clap.rotation.z = -sw * 0.6 + Math.sin(t * 2.2 + s - 0.7) * amp * 0.5;
    charms.forEach((c, n) => { c.rotation.z = Math.sin(t * 2.5 + n * 2 + s) * (0.1 + wind * 0.3); });
    halo.material.opacity = (0.1 + night * 0.45) * k;
  };
  return g;
}
/** Wisp Jar: a glass jar on a mossy stone, holding light-motes that circle and bob. */
function makeWispJar(seed = 1) {
  const g = new THREE.Group(), R = mrand(seed + 31);
  const stone = mk(new THREE.DodecahedronGeometry(0.2, 0), T('#9aa890', 'rock'), 0, 0.07, 0); stone.scale.set(1.2, 0.45, 1); g.add(stone);
  for (let k = 0; k < 4; k++) { const a = R() * 6.28, m = mk(new THREE.SphereGeometry(0.05, 8, 6), MS('#7cae6a'), Math.cos(a) * 0.15, 0.13, Math.sin(a) * 0.12); m.scale.set(1.2, 0.35, 0.9); g.add(m); }
  const jar = new THREE.Mesh(lathe([[0, 0], [0.11, 0], [0.13, 0.04], [0.13, 0.2], [0.1, 0.25], [0.065, 0.27], [0.065, 0.3]], 16),
    new THREE.MeshLambertMaterial({ color: '#e0f0ff', emissive: new THREE.Color('#d6ecff'), emissiveIntensity: 0.15, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide }));
  jar.position.y = 0.15; jar.renderOrder = 2; g.add(jar);
  g.add(mk(new THREE.CylinderGeometry(0.07, 0.06, 0.05, 10), T('#c8a070', 'wood'), 0, 0.47, 0));
  const tw = mk(new THREE.TorusGeometry(0.07, 0.008, 4, 14), MS('#e8d8c0'), 0, 0.43, 0); tw.rotation.x = Math.PI / 2; g.add(tw);
  const loop = mk(new THREE.TorusGeometry(0.04, 0.006, 4, 12), MS('#e8d8c0'), 0, 0.51, 0); g.add(loop);
  const motes = [];
  for (let k = 0; k < 4; k++) { const m = mk(new THREE.SphereGeometry(0.018, 8, 6), GM('#ffe8a0', '#ffd870', 1)); m.castShadow = false; const h = glow(['#ffe8a0', '#d6ecff', '#ffd6ec', '#e8ffd6'][k], 0.2, 0.6); m.add(h); m.userData = { h, ph: k / 4 * 6.28 }; g.add(m); motes.push(m); }
  const halo = glow('#ffe8a0', 0.8, 0); halo.position.y = 0.28; g.add(halo);
  g.userData.anim = (t, night, wind, s, k) => {
    motes.forEach((m, n) => { const a = t * (0.7 + n * 0.15) + m.userData.ph + s; m.position.set(Math.cos(a) * 0.06, 0.24 + Math.sin(t * 1.3 + n * 1.7) * 0.07, Math.sin(a) * 0.06); m.userData.h.material.opacity = (0.35 + night * 0.6) * k; });
    halo.material.opacity = (0.1 + night * 0.45 + Math.sin(t * 1.1 + s) * 0.05) * k;
  };
  return g;
}
/** Sky Orrery: tiny islands circling a pearl on gold rings; one of them, lilac, is on no map. */
function makeOrrery(seed = 1) {
  const g = new THREE.Group(), st = T('#e6e0f0', 'stone');
  g.add(mk(new THREE.CylinderGeometry(0.3, 0.33, 0.07, 12), st, 0, 0.035, 0));
  g.add(mk(new THREE.CylinderGeometry(0.2, 0.24, 0.07, 12), st, 0, 0.1, 0));
  g.add(mk(new THREE.CylinderGeometry(0.035, 0.05, 0.4, 8), T('#c8b4e8', 'stone'), 0, 0.33, 0));
  const arm = mk(new THREE.TorusGeometry(0.3, 0.014, 6, 24, Math.PI), MS('#c8b4e8'), 0, 0.68, 0); arm.rotation.y = 0.5; g.add(arm);
  const pearl = mk(new THREE.SphereGeometry(0.07, 14, 10), GM('#fff4e0', '#ffe8c0', 0.6), 0, 0.68, 0); g.add(pearl);
  const halo = glow('#fff0d0', 0.6, 0.4); halo.position.y = 0.68; g.add(halo);
  const orbits = [];
  [[0.2, 0.25, 0.5, 2], [0.32, -0.2, -0.3, 2]].forEach(([r, tx, sp, n], oi) => {
    const o = new THREE.Group(); o.position.y = 0.68; o.rotation.x = tx; g.add(o);
    const ring = mk(new THREE.TorusGeometry(r, 0.006, 4, 40), M(PAL.gold, '#ffcf60', 0.3)); ring.rotation.x = Math.PI / 2; ring.castShadow = false; o.add(ring);
    const spin = new THREE.Group(); o.add(spin);
    for (let k = 0; k < n; k++) {
      const lost = oi === 1 && k === 1, isl = new THREE.Group(), a = k / n * Math.PI * 2; isl.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); spin.add(isl);
      const rock = mk(new THREE.ConeGeometry(0.035, 0.06, 6), lost ? GM('#8a7ab0', '#b48ce8', 0.3) : MS('#9d8fa8'), 0, -0.02, 0); rock.rotation.x = Math.PI; isl.add(rock);
      const top = mk(new THREE.CylinderGeometry(0.036, 0.036, 0.012, 8), lost ? GM('#b8a8e0', '#c9a7f2', 0.4) : MS('#9cc27a'), 0, 0.012, 0); isl.add(top);
      if (!lost) isl.add(mk(new THREE.SphereGeometry(0.014, 6, 5), MS('#86b86a'), 0.01, 0.026, 0));
      else { const h = glow('#c9a7f2', 0.22, 0.5); isl.add(h); isl.userData.h = h; isl.userData.m = [rock.material, top.material]; orbits.lost = isl; }
    }
    orbits.push({ spin, sp });
  });
  g.userData.anim = (t, night, wind, s, k) => {
    orbits.forEach(o => { o.spin.rotation.y = t * o.sp + s; });
    const p = 0.5 + 0.5 * Math.sin(t * 0.8 + s), L = orbits.lost; L.userData.h.material.opacity = (0.15 + p * 0.5 + night * 0.3) * k; L.userData.m.forEach(m => { m.emissiveIntensity = 0.15 + p * 0.6; });
    pearl.material.emissiveIntensity = 0.5 + night * 0.6; halo.material.opacity = (0.25 + night * 0.4) * k;
  };
  return g;
}
/** Keeper Lamp: a white ringed column in the Lumen Keepers' style, a crescent cradling a star-glass globe. */
function makeKeeperLamp(seed = 1) {
  const g = new THREE.Group(), w = T('#f4f0e8', 'stone');
  g.add(mk(new THREE.CylinderGeometry(0.15, 0.18, 0.06, 10), w, 0, 0.03, 0));
  g.add(mk(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 10), w, 0, 0.09, 0));
  g.add(mk(new THREE.CylinderGeometry(0.055, 0.07, 0.62, 10), w, 0, 0.43, 0));
  for (const y of [0.2, 0.45, 0.7]) { const r = mk(new THREE.TorusGeometry(0.066, 0.012, 5, 16), M(PAL.gold, '#ffcf60', 0.2), 0, y, 0); r.rotation.x = Math.PI / 2; g.add(r); }
  g.add(mk(new THREE.CylinderGeometry(0.09, 0.06, 0.05, 10), w, 0, 0.76, 0));
  const cr = mk(new THREE.TorusGeometry(0.12, 0.018, 6, 20, Math.PI * 1.3), M(PAL.gold, '#ffcf60', 0.35), 0, 0.93, 0); cr.rotation.z = Math.PI * 1.35; g.add(cr); // open at the top: a cradle
  const globe = mk(new THREE.IcosahedronGeometry(0.085, 1), GM('#fff0c8', '#ffe0a0', 0.9), 0, 0.93, 0); g.add(globe);
  const halo = glow('#ffe0a0', 1.8, 0.3); halo.position.y = 0.93; g.add(halo);
  const stars = new THREE.Group(); stars.position.y = 0.93; g.add(stars);
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2, s = mk(new THREE.OctahedronGeometry(0.02, 0), M('#fff6d8', '#ffe8a0', 1), Math.cos(a) * 0.2, Math.sin(k * 2) * 0.04, Math.sin(a) * 0.2); s.castShadow = false; stars.add(s); }
  g.userData.anim = (t, night, wind, s, k) => {
    const p = 0.5 + 0.5 * Math.sin(t * 0.9 + s); globe.material.emissiveIntensity = (0.6 + p * 0.5 + night * 0.8) * k;
    halo.material.opacity = (0.2 + p * 0.15 + night * 0.65) * k; stars.rotation.y = t * 0.6 + s; stars.children.forEach((c, n) => { c.rotation.y = t * 2 + n; });
  };
  return g;
}

/**
 * The seats round a campfire, model-local: two on each of the three log benches, then the stump.
 * {x, z, y}: where a sitter's robe rests, y the seat's top.
 */
function campfireSeats() {
  const out = [];
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + Math.PI / 2; for (const zz of [-0.13, 0.13]) out.push({ x: Math.cos(a) * 0.78 - zz * Math.sin(a), z: Math.sin(a) * 0.78 + zz * Math.cos(a), y: 0.155 }); }
  const sa = -Math.PI / 6 - 0.5; out.push({ x: Math.cos(sa) * 0.8, z: Math.sin(sa) * 0.8, y: 0.165 });
  return out;
}
/**
 * Campfire (2 by 2): a ring of mossy stones round a teepee of logs, three log benches, a pot on a
 * tripod and a woodpile. The fire wakes only after dusk: flames with rosy-lilac tips flicker, the
 * embers glow, sparks drift up, and a warm pool of light spreads on the ground.
 */
function makeCampfire(seed = 1) {
  const g = new THREE.Group(), R = mrand(seed + 37), bark = T('#8a5f45', 'bark'), cut = MS('#e6c89a');
  g.add(mk(new THREE.CylinderGeometry(0.62, 0.66, 0.02, 20), T('#c9a882', 'dirt'), 0, 0.01, 0)); // a patch of trodden earth
  for (let k = 0; k < 11; k++) { // the stone ring
    const a = k / 11 * Math.PI * 2, s = mk(new THREE.DodecahedronGeometry(0.08, 0), T(pick(['#bfb4cc', '#d9d1e0', '#cfc4dc', '#a99bbf'], R), 'stone'), Math.cos(a) * 0.36, 0.05, Math.sin(a) * 0.36);
    s.scale.set(1.1, 0.7, 0.9); s.rotation.y = -a; g.add(s);
    if (k % 3 === 0) { const ms = mk(new THREE.SphereGeometry(0.04, 6, 5), MS('#7cae6a'), Math.cos(a) * 0.36, 0.1, Math.sin(a) * 0.36); ms.scale.set(1.3, 0.4, 1); g.add(ms); }
  }
  g.add(mk(new THREE.CylinderGeometry(0.28, 0.3, 0.03, 14), MS('#4a3a40'), 0, 0.025, 0)); // ash
  for (let k = 0; k < 5; k++) { // a teepee of logs
    const a = k / 5 * Math.PI * 2 + 0.3, l = mk(new THREE.CylinderGeometry(0.03, 0.035, 0.42, 6), bark, Math.cos(a) * 0.1, 0.16, Math.sin(a) * 0.1);
    l.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55); g.add(l);
  }
  const ember = GM('#ff8a50', '#ff6a30', 0); const coals = mk(new THREE.IcosahedronGeometry(0.13, 0), ember, 0, 0.05, 0); coals.scale.y = 0.4; g.add(coals);
  // flames: three nested soft cones, warm at the root and rosy-lilac at the tip
  const flames = [];
  [['#ffb050', '#ff8a30', 0.13, 0.42], ['#ffd27a', '#ffb050', 0.09, 0.32], ['#ffc0d8', '#f49ab0', 0.05, 0.5]].forEach(([c, e, r, h], k) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.position.y = 0.06 + h / 2; m.userData = { h, k }; g.add(m); flames.push(m);
  });
  const halo = glow('#ffb070', 1.6, 0); halo.position.y = 0.3; g.add(halo);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.15, 28), new THREE.MeshBasicMaterial({ map: glowTex(), color: '#ffb070', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.03; g.add(pool);
  const sparks = [];
  for (let k = 0; k < 7; k++) { const s = glow(['#ffd27a', '#ffc0d8', '#d8c8ff'][k % 3], 0.09, 0); s.userData.o = k / 7; g.add(s); sparks.push(s); }
  // three log benches round the fire, a stump on the fourth side
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2 + Math.PI / 2, b = new THREE.Group(); b.position.set(Math.cos(a) * 0.78, 0, Math.sin(a) * 0.78); b.rotation.y = -a; g.add(b);
    const log = mk(new THREE.CylinderGeometry(0.075, 0.08, 0.5, 8), bark, 0, 0.08, 0); log.rotation.x = Math.PI / 2; b.add(log);
    // the cut ends sit just off the log's own ends, so the two faces never flicker through each other
    for (const z of [-0.256, 0.256]) { const e = mk(new THREE.CircleGeometry(0.072, 8), cut, 0, 0.08, z); e.rotation.y = z > 0 ? 0 : Math.PI; b.add(e); }
    const cush = mk(new THREE.SphereGeometry(0.06, 8, 6), MS(pick(['#b4c8f0', '#f4c8d8', '#d8c8f4'], R)), 0, 0.16, 0.08 - k * 0.08); cush.scale.set(1, 0.4, 1.3); b.add(cush);
  }
  const stump = mk(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 8), bark, Math.cos(-Math.PI / 6 - 0.5) * 0.8, 0.08, Math.sin(-Math.PI / 6 - 0.5) * 0.8); g.add(stump);
  g.add(mk(new THREE.CircleGeometry(0.095, 8), cut, stump.position.x, 0.166, stump.position.z).rotateX(-Math.PI / 2));
  // a pot on a tripod over the edge of the fire
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2, l = mk(new THREE.CylinderGeometry(0.01, 0.012, 0.62, 4), PAL.woodDark, Math.cos(a) * 0.17 + 0.05, 0.29, Math.sin(a) * 0.17); l.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); g.add(l); }
  const pot = mk(new THREE.SphereGeometry(0.075, 10, 8, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.75), MS('#5b4a6b'), 0.05, 0.36, 0); g.add(pot);
  g.add(mk(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 4), MS('#8a7a6a'), 0.05, 0.5, 0));
  // a woodpile and a few toadstools at the corners
  for (let k = 0; k < 5; k++) { const l = mk(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 7), bark, 0.62 + (k % 3) * 0.085 - (k > 2 ? -0.04 : 0), 0.04 + (k > 2 ? 0.075 : 0), -0.62); l.rotation.x = Math.PI / 2; l.rotation.z = 0.0; g.add(l); }
  for (let k = 0; k < 4; k++) { const a = R() * Math.PI * 2, r = 0.55 + R() * 0.3, x = Math.cos(a) * r, z = Math.sin(a) * r;
    g.add(mk(new THREE.CylinderGeometry(0.012, 0.016, 0.06, 5), MS('#fff4e0'), x, 0.03, z)); const c = mk(new THREE.SphereGeometry(0.035, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), MS(pick(['#e86a6a', '#c8a4e8', '#f4b8c8'], R)), x, 0.055, z); g.add(c); }
  g.userData.anim = (t, night, wind, s, k, damp = 0) => {
    const lit = sstep(0.35, 0.6, night) * k * (1 - damp), fl = 0.85 + 0.15 * Math.sin(t * 13 + s) * Math.sin(t * 7.3);
    flames.forEach((m, n) => { const sy = lit * (0.75 + 0.3 * Math.sin(t * (9 + n * 3) + n + s)); m.scale.set(lit * (0.9 + 0.1 * Math.sin(t * 11 + n)), Math.max(0.001, sy), lit * (0.9 + 0.1 * Math.cos(t * 10 + n))); m.position.y = 0.06 + m.userData.h * sy / 2; m.rotation.y = t * (0.8 + n * 0.3); m.material.opacity = lit * (n === 2 ? 0.55 : 0.8); });
    ember.emissiveIntensity = 0.1 + lit * 1.2 * fl; halo.material.opacity = lit * 0.75 * fl; pool.material.opacity = lit * 0.45 * fl;
    sparks.forEach((p, n) => { const u = (t * 0.45 + p.userData.o + s * 0.1) % 1; p.position.set(Math.sin(u * 7 + n * 2) * 0.12 * u, 0.25 + u * 1.3, Math.cos(u * 5 + n) * 0.12 * u); p.material.opacity = lit * Math.sin(Math.PI * u); });
  };
  return g;
}

/** The model for a piece type. */
function makePiece(type, seed, extra) {
  switch (type) {
    case 'house': { const [fl, rm, lf, st] = String(extra || 1).split('|'); return makeHouse(seed, +fl || 1, st || undefined, +rm || 0, +lf || 0); }
    case 'path': return makePath(extra || 0, seed);
    case 'tree': return makeTree(seed);
    case 'garden': { const [mk2, kd, mx] = typeof extra === 'string' ? extra.split('|') : [0, '']; return makeGarden(seed, kd || undefined, +mk2 || 0, +mx || 0); }
    case 'meadow': return makeMeadow2(seed, extra || undefined);
    case 'meadow1': { const [mk2, kd, mx, sh] = typeof extra === 'string' ? extra.split('|') : [0, '']; return makeMeadow(seed, kd || undefined, +mk2 || 0, +mx || 0, sh === '1'); }
    case 'lantern': return makeLantern();
    case 'school': return makeSchool(seed);
    case 'healer': return makeHealer(seed);
    case 'bridge': return makeBridgeTile(extra || 3);
    case 'stone': return makeRuneStone();
    case 'well': return makeWell();
    case 'totem': return makeTotem();
    case 'windmill': return makeWindmill(false);
    case 'arch': return makeArch();
    case 'hut': return makeHut(seed);
    case 'bellgate': return makeBellGate();
    case 'column': return makeColumn(seed);
    case 'spire': return makeSpire();
    case 'oldtree': return makeOldTree(seed);
    case 'rock': return makeRock(seed);
    case 'brokenmill': return makeWindmill(true);
    case 'wildflowers': { const g = makeMeadow(seed, 'wild'); g.children[0].visible = false; return g; }
    case 'bloombox': return makeBloombox(seed);
    case 'lullbench': return makeLullBench(seed);
    case 'dreamkite': return makeDreamkite(seed);
    case 'puffcap': return makePuffcap(seed, typeof extra === 'string' ? +extra.split('|')[0] || 0 : 0);
    case 'hushwillow': return makeHushwillow(seed);
    case 'starbloom': return makeStarbloom(seed);
    case 'dewfall': return makeDewfall(seed);
    case 'dreamloom': return makeDreamLoom(seed);
    case 'bellcote': return makeBellcote(seed);
    case 'wispjar': return makeWispJar(seed);
    case 'orrery': return makeOrrery(seed);
    case 'keeperlamp': return makeKeeperLamp(seed);
    case 'campfire': return makeCampfire(seed);
  }
  return new THREE.Group();
}

// ---- Icons: drawn on small canvases for the HUD, never emoji ----------------------------------
/** Draws a HUD icon by name into a 2D context of size s. */
function drawIcon(g, name, s) {
  const u = s / 32; g.save(); g.scale(u, u); g.lineCap = 'round'; g.lineJoin = 'round';
  const fill = (c) => { g.fillStyle = c; g.fill(); }, stroke = (c, w = 2) => { g.strokeStyle = c; g.lineWidth = w; g.stroke(); };
  const P = (...pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); };
  const C = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };
  switch (name) {
    case 'house': P(6, 15, 16, 6, 26, 15); fill('#d9785a'); g.fillStyle = '#f6e7d2'; g.fillRect(8, 15, 16, 12); g.fillStyle = '#5e4033'; g.fillRect(14, 19, 4, 8); g.fillStyle = '#ffd98a'; g.fillRect(9.5, 17.5, 3, 3); g.fillRect(19.5, 17.5, 3, 3); break;
    case 'tree': g.fillStyle = '#8a5f45'; g.fillRect(14.5, 18, 3, 10); C(16, 13, 8); fill('#86b86a'); C(11, 16, 5); fill('#9fcb7c'); C(21, 16, 5); fill('#6fa35e'); break;
    case 'garden': g.fillStyle = '#8d6450'; g.fillRect(5, 23, 22, 4); for (const [x, c] of [[9, '#f49ab0'], [16, '#ffd36e'], [23, '#c9a7f2']]) { g.fillStyle = '#6fa35e'; g.fillRect(x - 0.75, 14, 1.5, 9); C(x, 13, 3.5); fill(c); C(x, 13, 1.3); fill('#fff3c0'); } break;
    case 'mothlantern': // the Moth Lantern: the lantern, with a moth
      g.save(); g.fillStyle = 'rgba(230,220,255,0.9)'; g.beginPath(); g.ellipse(26, 7, 3, 1.6, 0.5, 0, Math.PI * 2); g.ellipse(26, 11, 3, 1.6, -0.5, 0, Math.PI * 2); g.fill(); g.restore();
    // falls through
    case 'lantern': g.fillStyle = '#5e4033'; g.fillRect(9, 6, 2, 22); g.fillRect(9, 6, 12, 2); C(20, 15, 7); fill('rgba(255,207,120,0.35)'); g.fillStyle = '#ffe2a0'; g.fillRect(17, 11, 6, 8); P(16, 11, 20, 8, 24, 11); fill('#5e4033'); break;
    case 'bridge': g.fillStyle = '#8a5f45'; for (let i = 0; i < 5; i++) g.fillRect(4 + i * 5, 18, 4, 5); g.beginPath(); g.moveTo(4, 12); g.quadraticCurveTo(16, 17, 28, 12); stroke('#e6d3b0', 1.6); g.fillStyle = '#5e4033'; g.fillRect(4, 10, 2, 13); g.fillRect(26, 10, 2, 13); break;
    case 'meadow': g.fillStyle = '#a9d184'; g.fillRect(4, 24, 24, 4); for (let i = 0; i < 6; i++) { P(5 + i * 4, 24, 7 + i * 4, 12 + (i % 2) * 4, 9 + i * 4, 24); fill(i % 2 ? '#86b86a' : '#a8cf86'); } C(12, 13, 2); fill('#f49ab0'); C(22, 15, 2); fill('#ffd36e'); break;
    case 'look': g.beginPath(); g.ellipse(16, 16, 12, 8, 0, 0, Math.PI * 2); fill('#fff6e8'); C(16, 16, 5); fill('#7f9fd6'); C(16, 16, 2.2); fill('#2e2a44'); C(14.5, 14.5, 1); fill('#fff'); break;
    case 'tidy': g.save(); g.translate(16, 16); g.rotate(-0.6); g.fillStyle = '#8a5f45'; g.fillRect(-1.5, -14, 3, 16); P(-7, 2, 7, 2, 9, 13, -9, 13); fill('#e9b44c'); g.restore(); C(25, 24, 2); fill('#c9a7f2'); C(6, 26, 1.5); fill('#c9a7f2'); break;
    case 'rotate': g.beginPath(); g.arc(16, 16, 9, -0.3, Math.PI * 1.4); stroke('#fff6e8', 3); P(22, 9, 27, 16, 19, 15); fill('#fff6e8'); break;
    case 'turnL': g.beginPath(); g.arc(16, 18, 9, Math.PI * 1.1, Math.PI * 1.9); stroke('#fff6e8', 3); P(5, 16, 9, 23, 12, 15); fill('#fff6e8'); break;
    case 'turnR': g.beginPath(); g.arc(16, 18, 9, Math.PI * 1.1, Math.PI * 1.9); stroke('#fff6e8', 3); P(27, 16, 23, 23, 20, 15); fill('#fff6e8'); break;
    case 'zoomIn': C(14, 14, 8); stroke('#fff6e8', 3); g.beginPath(); g.moveTo(20, 20); g.lineTo(27, 27); stroke('#fff6e8', 3.5); g.beginPath(); g.moveTo(10, 14); g.lineTo(18, 14); g.moveTo(14, 10); g.lineTo(14, 18); stroke('#fff6e8', 2.2); break;
    case 'zoomOut': C(14, 14, 8); stroke('#fff6e8', 3); g.beginPath(); g.moveTo(20, 20); g.lineTo(27, 27); stroke('#fff6e8', 3.5); g.beginPath(); g.moveTo(10, 14); g.lineTo(18, 14); stroke('#fff6e8', 2.2); break;
    case 'builder': P(16, 5, 28, 12, 16, 19, 4, 12); fill('#9cc27a'); P(4, 12, 16, 19, 16, 27, 4, 20); fill('#b98c6b'); P(28, 12, 16, 19, 16, 27, 28, 20); fill('#9d8fa8'); g.fillStyle = '#d9785a'; P(13, 9, 16, 6, 19, 9); fill('#d9785a'); break;
    case 'stroll': C(16, 9, 4.5); fill('#ffe6d3'); g.beginPath(); g.ellipse(16, 20, 6, 7, 0, 0, Math.PI * 2); fill('#e98c74'); g.beginPath(); g.ellipse(16, 3.5, 1.6, 3, 0, 0, Math.PI * 2); fill('#7cbf6a'); g.fillStyle = '#5e4033'; g.fillRect(12.5, 26, 2.5, 4); g.fillRect(17, 26, 2.5, 4); break;
    case 'postcard': g.fillStyle = '#fff6e8'; g.fillRect(4, 7, 24, 18); g.fillStyle = '#9fc4ff'; g.fillRect(6, 9, 20, 14); C(21, 13, 2.5); fill('#ffd36e'); P(6, 23, 12, 15, 17, 20, 20, 18, 26, 23); fill('#86b86a'); break;
    case 'music': g.fillStyle = '#fff6e8'; g.fillRect(12, 7, 2.5, 16); g.fillRect(23, 5, 2.5, 16); P(12, 7, 25.5, 4, 25.5, 8, 12, 11); fill('#fff6e8'); g.beginPath(); g.ellipse(10.5, 23, 4, 3, -0.4, 0, Math.PI * 2); fill('#fff6e8'); g.beginPath(); g.ellipse(21.5, 21, 4, 3, -0.4, 0, Math.PI * 2); fill('#fff6e8'); break;
    case 'recenter': C(16, 16, 11); stroke('#fff6e8', 2.4); for (const [x0, y0, x1, y1] of [[16, 2, 16, 7], [16, 25, 16, 30], [2, 16, 7, 16], [25, 16, 30, 16]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); stroke('#fff6e8', 2.4); } P(10, 17, 16, 11, 22, 17); fill('#f5c76b'); g.fillStyle = '#f5c76b'; g.fillRect(12, 17, 8, 5); break;
    case 'move': for (const [x, y, r] of [[16, 3, 0], [29, 16, 1], [16, 29, 2], [3, 16, 3]]) { g.save(); g.translate(x, y); g.rotate(r * Math.PI / 2); P(0, 0, 4, 5, -4, 5); fill('#9df0c8'); g.restore(); } P(9, 17, 16, 10, 23, 17); fill('#d9785a'); g.fillStyle = '#f6e7d2'; g.fillRect(11, 17, 10, 7); g.fillStyle = '#5e4033'; g.fillRect(15, 20, 2.5, 4); break;
    case 'skip': P(7, 8, 17, 16, 7, 24); fill('#fff6e8'); P(15, 8, 25, 16, 15, 24); fill('#fff6e8'); g.fillStyle = '#fff6e8'; g.fillRect(24, 8, 2.5, 16); break;
    case 'chime': g.beginPath(); g.moveTo(16, 4); g.lineTo(16, 8); stroke('#fff6e8', 2); g.beginPath(); g.moveTo(9, 22); g.quadraticCurveTo(9, 9, 16, 9); g.quadraticCurveTo(23, 9, 23, 22); g.lineTo(25, 24); g.lineTo(7, 24); g.closePath(); fill('#fff6e8'); C(16, 27, 2.2); fill('#fff6e8'); break;
    case 'sound': case 'muted': case 'soundLow': P(5, 12, 11, 12, 18, 6, 18, 26, 11, 20, 5, 20); fill('#fff6e8');
      if (name === 'soundLow') { g.beginPath(); g.arc(19, 16, 5, -0.9, 0.9); stroke('#fff6e8', 2.2); }
      else if (name === 'sound') { g.beginPath(); g.arc(19, 16, 5, -0.9, 0.9); stroke('#fff6e8', 2.2); g.beginPath(); g.arc(19, 16, 10, -0.8, 0.8); stroke('#fff6e8', 2.2); }
      else { g.beginPath(); g.moveTo(21, 12); g.lineTo(28, 20); g.moveTo(28, 12); g.lineTo(21, 20); stroke('#f49ab0', 2.6); } break;
    case 'pause': g.fillStyle = '#fff6e8'; g.fillRect(9, 7, 5, 18); g.fillRect(18, 7, 5, 18); break;
    case 'folk': C(16, 10, 5); fill('#ffe6d3'); g.beginPath(); g.ellipse(16, 22, 7, 7, 0, 0, Math.PI * 2); fill('#e98c74'); g.beginPath(); g.ellipse(14, 4, 1.6, 3.4, -0.5, 0, Math.PI * 2); fill('#7cbf6a'); g.beginPath(); g.ellipse(18, 4, 1.6, 3.4, 0.5, 0, Math.PI * 2); fill('#7cbf6a'); C(14, 10, 0.9); fill('#3b2f4a'); C(18, 10, 0.9); fill('#3b2f4a'); break;
    case 'boat': g.beginPath(); g.ellipse(16, 10, 10, 7.5, 0, 0, Math.PI * 2); fill('#ffc9a8'); g.fillStyle = '#fff6e8'; g.fillRect(13, 3, 6, 14); g.beginPath(); g.moveTo(9, 15); g.lineTo(11, 22); g.moveTo(23, 15); g.lineTo(21, 22); stroke('#e6d3b0', 1.4); P(7, 22, 25, 22, 22, 28, 10, 28); fill('#8a5f45'); break;
    case 'island': g.beginPath(); g.ellipse(16, 12, 12, 4, 0, 0, Math.PI * 2); fill('#9cc27a'); P(4, 12, 28, 12, 18, 29, 14, 29); fill('#9d8fa8'); C(12, 8, 3); fill('#86b86a'); g.fillStyle = '#d9785a'; P(17, 9, 20, 5, 23, 9); fill('#d9785a'); break;
    case 'bell': g.beginPath(); g.moveTo(10, 23); g.quadraticCurveTo(10, 8, 16, 8); g.quadraticCurveTo(22, 8, 22, 23); g.lineTo(25, 25); g.lineTo(7, 25); g.closePath(); fill('#f5c76b'); C(16, 27, 2.2); fill('#a8742a'); g.beginPath(); g.arc(16, 8, 3, Math.PI, 0); stroke('#8a5f45', 2); break;
    case 'starlamp': C(16, 14, 9); fill('rgba(168,200,255,0.35)'); P(16, 5, 19, 12, 26, 14, 19, 16, 16, 24, 13, 16, 6, 14, 13, 12); fill('#e8f0ff'); g.fillStyle = '#f1ece6'; g.fillRect(11, 25, 10, 4); break;
    case 'school': g.fillStyle = '#efe8ff'; g.fillRect(9, 16, 14, 12); P(6, 17, 16, 2, 26, 17); fill('#6f5fd0'); C(16, 3, 2.4); fill('#ffd36e');
      g.fillStyle = '#e4dcf8'; g.fillRect(4, 12, 5, 16); P(3, 13, 6.5, 6, 10, 13); fill('#b9a3f0'); g.fillStyle = '#7a5fb0'; g.fillRect(14, 21, 4, 7);
      C(12, 19, 1.6); fill('#ffd98a'); C(20, 19, 1.6); fill('#ffd98a'); C(27, 11, 2); fill('#8fe0f0'); C(4, 6, 1.5); fill('#c9b4ff'); break;
    case 'healer': g.fillStyle = '#fbfff8'; g.fillRect(8, 17, 16, 11); for (let k = 0; k < 5; k++) { g.save(); g.translate(16, 17); g.rotate(-1.2 + k * 0.6); g.beginPath(); g.ellipse(0, -6, 3, 7, 0, 0, Math.PI * 2); fill(k % 2 ? '#bfe8d4' : '#f7c6d8'); g.restore(); }
      C(16, 10, 2.6); fill('#fff6d8'); g.fillStyle = '#7cc7a8'; g.fillRect(14, 21, 4, 7); C(11, 21, 1.5); fill('#fff0b8'); C(21, 21, 1.5); fill('#fff0b8'); break;
    case 'stone': g.beginPath(); g.ellipse(16, 17, 7, 12, 0, 0, Math.PI * 2); fill('#a99bbf'); g.fillStyle = '#cfe0ff'; g.fillRect(12, 12, 8, 1.6); g.fillRect(13, 16, 6, 1.6); g.fillRect(14, 20, 4, 1.6); break;
    case 'well': g.fillStyle = '#d9d1e0'; g.fillRect(8, 18, 16, 9); g.fillStyle = '#8a5f45'; g.fillRect(9, 9, 2, 10); g.fillRect(21, 9, 2, 10); P(5, 10, 16, 3, 27, 10); fill('#7f9fd6'); break;
    case 'totem': g.fillStyle = '#b07a52'; g.fillRect(11, 18, 10, 10); g.fillStyle = '#c98e5e'; g.fillRect(12, 10, 8, 8); g.fillStyle = '#d9a873'; g.fillRect(13, 4, 6, 6); g.fillStyle = '#3b2f4a'; g.fillRect(13, 21, 2, 2); g.fillRect(17, 21, 2, 2); g.fillRect(14, 12, 1.5, 1.5); g.fillRect(17, 12, 1.5, 1.5); g.fillStyle = '#e86a6a'; g.fillRect(14.5, 8, 3, 1); g.fillStyle = '#7fa7dc'; P(4, 14, 11, 12, 11, 15); fill('#7fa7dc'); P(28, 14, 21, 12, 21, 15); fill('#7fa7dc'); break;
    case 'windmill': P(12, 28, 20, 28, 18.5, 12, 13.5, 12); fill('#f6e7d2'); P(12, 12, 16, 7, 20, 12); fill('#d9785a'); g.save(); g.translate(16, 11); for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.fillStyle = '#fff6e8'; g.fillRect(-1.5, 1, 3, 10); } g.restore(); break;
    case 'arch': g.beginPath(); g.arc(16, 16, 9, Math.PI, 0); stroke('#f1ece6', 4); g.fillStyle = '#f1ece6'; g.fillRect(5, 16, 4, 12); g.fillRect(23, 16, 4, 12); P(16, 3, 18, 6, 16, 9, 14, 6); fill('#9fc4ff'); break;
    case 'mote': C(16, 16, 11); fill('rgba(255,211,106,0.35)'); P(16, 8, 20, 16, 16, 24, 12, 16); fill('#fff3c8'); break;
    case 'path': g.beginPath(); g.moveTo(4, 28); g.quadraticCurveTo(10, 16, 16, 15); g.quadraticCurveTo(24, 14, 28, 4); g.lineWidth = 8; g.strokeStyle = '#e8d6b0'; g.stroke();
      for (const [x, y] of [[8, 23], [14, 16], [20, 14], [25, 9]]) { g.beginPath(); g.ellipse(x, y, 2.4, 1.6, 0, 0, Math.PI * 2); fill('#b9a48a'); } break;
    case 'turn': g.beginPath(); g.arc(16, 18, 9, Math.PI * 0.9, Math.PI * 2.2); stroke('#fff6e8', 3); P(25, 13, 27, 21, 20, 18); fill('#fff6e8'); g.fillStyle = '#d9785a'; P(12, 18, 16, 14, 20, 18); fill('#d9785a'); g.fillStyle = '#f6e7d2'; g.fillRect(13, 18, 6, 5); break;
    case 'chevL': g.beginPath(); g.moveTo(20, 7); g.lineTo(11, 16); g.lineTo(20, 25); stroke('#fff6e8', 4); break;
    case 'chevR': g.beginPath(); g.moveTo(12, 7); g.lineTo(21, 16); g.lineTo(12, 25); stroke('#fff6e8', 4); break;
    case 'bloombox': g.fillStyle = '#b98a64'; g.fillRect(14.5, 16, 3, 13); P(14, 28, 9, 25, 14, 25); fill('#9cc27a'); g.fillStyle = '#fff4e0'; g.save(); g.translate(17, 7); g.rotate(0.3); g.fillRect(-4, -3, 8, 6); g.restore();
      g.beginPath(); g.moveTo(8, 8); g.quadraticCurveTo(8, 18, 16, 18); g.quadraticCurveTo(24, 18, 24, 8); g.lineTo(20, 11); g.lineTo(16, 7); g.lineTo(12, 11); g.closePath(); fill('#f4a6b8'); g.fillStyle = '#5e4033'; g.fillRect(25, 6, 1.2, 9); g.fillStyle = '#f5c76b'; g.fillRect(26, 6, 4, 3); break;
    case 'lullbench': g.beginPath(); g.arc(16, 22, 12, Math.PI, 0); stroke('#c8b4e8', 2); g.fillStyle = '#e8d2b0'; g.fillRect(6, 19, 20, 3); g.fillRect(6, 13, 3, 9); g.fillStyle = '#a8785a'; g.fillRect(7, 22, 2, 6); g.fillRect(23, 22, 2, 6); g.fillStyle = '#b4c8f0'; g.fillRect(11, 17, 8, 2.5);
      for (const [x, y] of [[7, 14], [16, 10], [25, 14]]) { C(x, y, 2); fill('#ffd98a'); } break;
    case 'dreamkite': g.beginPath(); g.moveTo(9, 29); g.quadraticCurveTo(12, 20, 19, 13); stroke('#fff4e0', 1.2); g.fillStyle = '#8a6a8f'; g.fillRect(7.5, 22, 3, 8); P(19, 2, 26, 9, 19, 16, 12, 9); fill('#b48ce8'); P(19, 5.5, 22.5, 9, 19, 12.5, 15.5, 9); fill('#f4e6ff');
      for (const [c, x] of [['#f4a6b8', 17], ['#a8d8e8', 20], ['#f5c76b', 23]]) { g.beginPath(); g.moveTo(19, 16); g.quadraticCurveTo(x + 2, 20, x, 25); stroke(c, 1.5); } break;
    case 'puffcap': g.beginPath(); g.ellipse(16, 27, 12, 3, 0, 0, Math.PI * 2); fill('#8fbf74'); g.fillStyle = '#fff4e0'; g.fillRect(15, 14, 3, 13); g.fillRect(8, 19, 2.5, 8); g.fillRect(22, 18, 2.5, 9);
      for (const [x, y, r, c] of [[9, 19, 5, '#a8c8f0'], [23.5, 18, 5.5, '#f4b8c8'], [16.5, 13, 7, '#c8a4e8']]) { g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.closePath(); fill(c); C(x - r * 0.35, y - r * 0.5, r * 0.18); fill('#fffaf0'); } break;
    case 'hushwillow': g.fillStyle = '#9a7a68'; g.fillRect(14.5, 14, 3, 15); g.beginPath(); g.ellipse(16, 11, 11, 7, 0, 0, Math.PI * 2); fill('#a8c890');
      for (let k = 0; k < 7; k++) { const x = 6 + k * 3.3; g.beginPath(); g.moveTo(x, 12); g.quadraticCurveTo(x + (k < 3 ? -1.5 : 1.5), 20, x, 26 - Math.abs(k - 3)); stroke('#c4dca8', 1.6); } C(10, 16, 1.8); fill('#ffd98a'); C(22, 18, 1.8); fill('#ffd98a'); break;
    case 'starbloom': g.fillStyle = '#8fbf74'; g.fillRect(15, 17, 2, 12); P(16, 25, 9, 20, 15, 23); fill('#86b86a'); C(16, 11, 10); fill('rgba(200,216,255,0.3)');
      g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 3.4 : 8.5; g.lineTo(16 + Math.cos(a) * r, 11 + Math.sin(a) * r); } g.closePath(); fill('#d8e8ff'); C(16, 11, 2.2); fill('#ffd36e'); break;
    case 'dewfall': for (const [x, y, r] of [[16, 4, 2], [13, 8, 1.3], [19, 9, 1.3], [16, 11, 1]]) { C(x, y, r); fill(r === 2 ? '#fff4e0' : '#8fc7f2'); }
      P(9, 14, 23, 14, 20, 17, 12, 17); fill('#e6dccb'); g.fillStyle = '#d8ccb8'; g.fillRect(14.5, 17, 3, 6); P(4, 22, 28, 22, 25, 28, 7, 28); fill('#e6dccb'); g.fillStyle = '#a8d8e8'; g.fillRect(7, 22, 18, 2); break;
    case 'dreamloom': g.fillStyle = '#b98a64'; g.fillRect(5, 5, 3, 24); g.fillRect(24, 5, 3, 24); g.fillRect(4, 4, 24, 3);
      for (let k = 0; k < 4; k++) { g.fillStyle = ['#f4c8d8', '#c8d8f4', '#f6e7d2', '#d8c8f4'][k]; g.fillRect(8, 7 + k * 3.5, 16, 3.5); } g.fillStyle = '#f5c76b'; g.fillRect(10, 22, 12, 2.5); C(26, 13, 1.6); fill('#f4a6b8'); break;
    case 'bellcote': P(5, 11, 16, 2, 27, 11); fill('#c8a070'); g.fillStyle = '#a8785a'; g.fillRect(7, 11, 2, 15); g.fillRect(23, 11, 2, 15);
      g.beginPath(); g.moveTo(11, 23); g.quadraticCurveTo(11, 12, 16, 12); g.quadraticCurveTo(21, 12, 21, 23); g.closePath(); fill('#f5c76b'); g.fillStyle = '#e8d8c0'; g.fillRect(4, 26, 24, 3); break;
    case 'wispjar': g.beginPath(); g.ellipse(16, 28, 10, 2.5, 0, 0, Math.PI * 2); fill('#9aa890'); g.beginPath(); g.moveTo(10, 11); g.quadraticCurveTo(7, 12, 7, 18); g.lineTo(7, 24); g.quadraticCurveTo(7, 27, 11, 27); g.lineTo(21, 27); g.quadraticCurveTo(25, 27, 25, 24); g.lineTo(25, 18); g.quadraticCurveTo(25, 12, 22, 11); g.closePath(); fill('rgba(224,240,255,0.55)'); stroke('#e0f0ff', 1.2);
      g.fillStyle = '#c8a070'; g.fillRect(11.5, 6, 9, 5); for (const [x, y] of [[13, 17], [19, 15], [16, 22]]) { C(x, y, 3.2); fill('rgba(255,232,160,0.4)'); C(x, y, 1.7); fill('#ffe8a0'); } break;
    case 'orrery': g.fillStyle = '#e6e0f0'; g.fillRect(9, 26, 14, 3); g.fillRect(15, 18, 2, 8); g.beginPath(); g.ellipse(16, 14, 12, 4.5, -0.2, 0, Math.PI * 2); stroke('#f5c76b', 1.4); g.beginPath(); g.ellipse(16, 14, 7, 3, 0.35, 0, Math.PI * 2); stroke('#f5c76b', 1.2);
      C(16, 14, 3); fill('#fff4e0'); C(5, 16, 2); fill('#9cc27a'); C(26, 11, 2); fill('#9cc27a'); C(21, 12, 1.6); fill('#9cc27a'); C(11, 17, 1.8); fill('#b48ce8'); break;
    case 'keeperlamp': C(16, 8, 7); fill('rgba(255,224,160,0.35)'); g.fillStyle = '#f4f0e8'; g.fillRect(14, 14, 4, 13); g.fillRect(10, 27, 12, 3); g.fillStyle = '#f5c76b'; g.fillRect(13.5, 18, 5, 1.2); g.fillRect(13.5, 22, 5, 1.2);
      g.beginPath(); g.arc(16, 9, 6, 0.15 * Math.PI, 0.85 * Math.PI); stroke('#f5c76b', 2); C(16, 8, 3.6); fill('#fff0c8'); break;
    case 'campfire': C(16, 18, 11); fill('rgba(255,176,112,0.25)'); g.beginPath(); g.moveTo(16, 4); g.quadraticCurveTo(24, 14, 21, 21); g.lineTo(11, 21); g.quadraticCurveTo(8, 14, 16, 4); fill('#ffb050');
      g.beginPath(); g.moveTo(16, 10); g.quadraticCurveTo(20, 16, 19, 21); g.lineTo(13, 21); g.quadraticCurveTo(12, 16, 16, 10); fill('#ffd27a'); C(16, 7, 1.3); fill('#ffc0d8');
      g.save(); g.translate(16, 23); g.rotate(0.35); g.fillStyle = '#8a5f45'; g.fillRect(-10, -1.8, 20, 3.6); g.rotate(-0.7); g.fillRect(-10, -1.8, 20, 3.6); g.restore();
      for (const x of [5, 10, 22, 27]) { C(x, 27, 2.2); fill('#bfb4cc'); } break;
    case 'heart': g.beginPath(); g.moveTo(16, 27); g.bezierCurveTo(4, 19, 4, 8, 11, 8); g.bezierCurveTo(14, 8, 16, 11, 16, 12); g.bezierCurveTo(16, 11, 18, 8, 21, 8); g.bezierCurveTo(28, 8, 28, 19, 16, 27); fill('#f49ab0'); C(11.5, 12.5, 2); fill('rgba(255,255,255,0.55)'); break;
    case 'sprout': g.fillStyle = '#8d6450'; g.beginPath(); g.ellipse(16, 26, 9, 3, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#6fa35e'; g.fillRect(15, 14, 2, 12); g.beginPath(); g.ellipse(11, 13, 6, 3.2, -0.5, 0, Math.PI * 2); fill('#9fcb7c'); g.beginPath(); g.ellipse(21, 11, 6, 3.2, 0.5, 0, Math.PI * 2); fill('#86b86a'); C(16, 13, 1.6); fill('#ffd3e0'); break;
    case 'star': { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 5 : 12; g.lineTo(16 + Math.cos(a) * r, 16.5 + Math.sin(a) * r); } g.closePath(); fill('#ffd98a'); C(16, 16.5, 3); fill('#fff3c0'); break; }
    case 'paw': g.beginPath(); g.ellipse(16, 21, 6.5, 5.5, 0, 0, Math.PI * 2); fill('#e9c9a8'); for (const [x, y] of [[8.5, 13], [13, 8.5], [19, 8.5], [23.5, 13]]) { g.beginPath(); g.ellipse(x, y, 2.6, 3.2, 0, 0, Math.PI * 2); fill('#e9c9a8'); } break;
    case 'cloud': C(11, 18, 6); fill('#e6def5'); C(17, 13, 7); fill('#f3eefc'); C(23, 18, 5.5); fill('#e6def5'); g.fillStyle = '#e6def5'; g.fillRect(11, 18, 12, 5.5); for (const x of [11, 17, 23]) { g.beginPath(); g.moveTo(x, 26); g.lineTo(x - 1.5, 30); stroke('#9fc1f0', 2); } break;
    case 'alert': C(16, 16, 12); fill('#e98c74'); g.fillStyle = '#2e244e'; g.beginPath(); g.moveTo(14.4, 8); g.lineTo(17.6, 8); g.lineTo(16.8, 19); g.lineTo(15.2, 19); g.closePath(); g.fill(); C(16, 23, 1.9); fill('#2e244e'); break;
    case 'close': g.beginPath(); g.moveTo(10, 10); g.lineTo(22, 22); g.moveTo(22, 10); g.lineTo(10, 22); stroke('#3a2f55', 3); break;
    case 'home': P(5, 15, 16, 6, 27, 15); fill('#fff6e8'); g.fillStyle = '#fff6e8'; g.fillRect(8, 15, 16, 12); g.fillStyle = '#5e4033'; g.fillRect(14, 19, 4, 8); break;
  }
  g.restore();
}
