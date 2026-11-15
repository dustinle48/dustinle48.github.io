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
/** A floating island: grass slab on top, a rocky root-hung underside tapering into the clouds. */
function makeIsland(isl) {
  const g = new THREE.Group(), N = 56, pts = [];
  for (let k = 0; k < N; k++) {
    const a = k / N * Math.PI * 2, r = islandRadius(isl, a) + 0.3;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const shape = new THREE.Shape(pts);
  const top = new THREE.ExtrudeGeometry(shape, { depth: 0.45, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 1, curveSegments: 4 });
  top.rotateX(Math.PI / 2); top.translate(0, -0.12, 0);
  const slab = new THREE.Mesh(top, [T(isl.grass || PAL.grass, 'grass'), T(PAL.grassDark, 'dirt')]);
  slab.receiveShadow = true; slab.castShadow = true; g.add(slab);
  // Underside: a rocky root in terraces, banded in strata from earth through warm clay to lilac
  // rock, narrowing to a crystal-tipped point; stalactites, glowing crystals, curling roots and
  // flowering vines hang from it, and a few stones float beneath (userData.floaters bob).
  const R = mrand(isl.seed), rings = 12, depth = isl.r * 1.5 + 1.5, pos = [], col = [], idx = [], uv = [], ph = R() * 6;
  const tipX = (R() - 0.5) * isl.r * 0.25, tipZ = (R() - 0.5) * isl.r * 0.25;
  const bands = [PAL.dirt, '#c9926e', '#b98aa0', PAL.rock, '#8d82b0', PAL.rock, PAL.rockDeep, '#6e6496'].map(h => new THREE.Color(h)), c = new THREE.Color();
  /** Radius of the underside at depth fraction f (0 top, 1 tip) and angle a: terraced, wavy, narrowing. */
  const radAt = (f, a) => {
    const terrace = 1 - 0.07 * Math.max(0, Math.sin(f * Math.PI * 4.5)), wave = 1 + 0.1 * Math.sin(a * 3 + ph + f * 4) + 0.05 * Math.sin(a * 7 + f * 9 + ph * 2);
    return (islandRadius(isl, a) + 0.4) * Math.pow(1 - f, 0.72) * terrace * (f > 0 ? wave : 1);
  };
  for (let k = 0; k <= rings; k++) {
    const f = k / rings, y = -0.5 - f * depth;
    for (let n = 0; n < N; n++) {
      const a = n / N * Math.PI * 2, r = radAt(f, a), sx = tipX * f * f, sz = tipZ * f * f;
      pos.push(Math.cos(a) * r + sx, y + (k && k < rings ? Math.sin(a * 5 + k) * 0.12 : 0), Math.sin(a) * r + sz);
      const bf = Math.max(0, Math.min(bands.length - 1.001, f * (bands.length - 1) + Math.sin(a * 2 + k) * 0.15)), b0 = Math.floor(bf);
      c.copy(bands[b0]).lerp(bands[b0 + 1], bf - b0); if (k % 2) c.multiplyScalar(0.93); // alternate strata a shade darker
      col.push(c.r, c.g, c.b); uv.push(n / N * isl.r * 2.5, f * depth * 0.6);
    }
  }
  for (let k = 0; k < rings; k++) for (let n = 0; n < N; n++) {
    const a = k * N + n, b = k * N + (n + 1) % N, d = (k + 1) * N + n, e = (k + 1) * N + (n + 1) % N;
    idx.push(a, d, b, b, d, e);
  }
  const ug = new THREE.BufferGeometry();
  ug.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  ug.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); ug.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  ug.setIndex(idx); ug.computeVertexNormals();
  const under = new THREE.Mesh(ug, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, map: ptex('rock') }));
  under.castShadow = true; g.add(under);
  const onUnder = (f, a, inset = 0.1) => { const r = radAt(f, a) - inset; return [Math.cos(a) * r + tipX * f * f, -0.5 - f * depth, Math.sin(a) * r + tipZ * f * f]; };
  // stalactites hanging from the terraces
  for (let k = 0; k < 8 + isl.r * 1.5; k++) {
    const f = 0.15 + R() * 0.7, a = R() * Math.PI * 2, [x, y, z] = onUnder(f, a, 0.25), h = 0.4 + R() * 1.1;
    const st = mk(new THREE.ConeGeometry(0.1 + R() * 0.12, h, 5), T(pick(['#9d8fa8', '#8d82b0', '#a99bbf'], R), 'rock'), x, y - h / 2 + 0.1, z); st.rotation.x = Math.PI; st.rotation.y = R() * 3; g.add(st);
  }
  // glowing crystals poking out of the rock, and a cluster at the tip
  const crys = ['#c9b4ff', '#9fe8f0', '#ffc9e0'];
  for (let k = 0; k < 5 + isl.r * 0.6; k++) {
    const f = 0.25 + R() * 0.6, a = R() * Math.PI * 2, [x, y, z] = onUnder(f, a, 0.05), cc = pick(crys, R);
    const cr = mk(new THREE.OctahedronGeometry(0.1 + R() * 0.1, 0), M(cc, cc, 0.7), x, y, z); cr.scale.y = 2; cr.lookAt(x * 3, y - 1, z * 3); cr.rotateX(Math.PI / 2); g.add(cr);
  }
  const tipY = -0.5 - depth;
  for (let k = 0; k < 5; k++) { const cc = pick(crys, R), cr = mk(new THREE.OctahedronGeometry(0.16 + R() * 0.14, 0), M(cc, cc, 0.9), tipX + (R() - 0.5) * 0.35, tipY - 0.1 - R() * 0.3, tipZ + (R() - 0.5) * 0.35); cr.scale.y = 2.4; cr.rotation.set((R() - 0.5) * 0.6, R() * 3, (R() - 0.5) * 0.6); g.add(cr); }
  const tipGlow = glow('#d6c2ff', 3 + isl.r * 0.3, 0.55); tipGlow.position.set(tipX, tipY - 0.3, tipZ); g.add(tipGlow);
  // curling roots and flowering vines dangling from the top band
  for (let k = 0; k < 7 + isl.r; k++) {
    const a = R() * Math.PI * 2, f0 = 0.04 + R() * 0.15, [x0, y0, z0] = onUnder(f0, a, 0.05), len = 1 + R() * 2.2, vine = k % 3 === 0;
    const pts = []; for (let t = 0; t <= 4; t++) pts.push(new THREE.Vector3(x0 + Math.sin(t * 1.3 + k) * 0.15 * t / 4, y0 - len * t / 4, z0 + Math.cos(t * 1.1 + k) * 0.15 * t / 4));
    const tube = mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, vine ? 0.025 : 0.035, 5, false), vine ? MS('#7aa86a') : T(PAL.woodDark, 'bark')); tube.castShadow = false; g.add(tube);
    if (vine) for (let t = 1; t <= 4; t++) { const p2 = pts[t]; g.add(mk(new THREE.IcosahedronGeometry(0.05, 0), MS(pick(PAL.leaf, R)), p2.x + 0.04, p2.y, p2.z)); if (t % 2 === 0) g.add(mk(new THREE.SphereGeometry(0.03, 8, 6), M('#ffd6ec', '#ffb6d8', 0.6), p2.x - 0.04, p2.y - 0.05, p2.z)); }
  }
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
    const p = mk(grassClumpGeo(), M('#86b86a'), Math.cos(a) * rr, 0, Math.sin(a) * rr); p.scale.setScalar(0.9 + R() * 0.5); p.rotation.y = R() * 6; p.castShadow = false; g.add(p);
  }
  return g;
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
  for (let k = 0; k < 3; k++) { const p = glow('#f4f8ff', 0.6 + k * 0.25, 0.5); p.material.blending = THREE.NormalBlending; p.position.set((k - 1) * 0.15, -0.05 - k * 0.15, 0.2 + k * 0.05); g.add(p); mist.push(p); }
  for (let k = 0; k < 4; k++) { const p = glow('#f4f8ff', 1.2 + k * 0.4, 0.35); p.material.blending = THREE.NormalBlending; p.position.set((k - 1.5) * 0.35, -len * (0.75 + k * 0.06), 0.55 + k * 0.1); g.add(p); mist.push(p); }
  const drops = []; // bright droplets tumbling down the stream's own arc
  for (let k = 0; k < 10; k++) { const d = glow('#ffffff', 0.12 + (k % 3) * 0.04, 0.85); d.userData = { ph: k / 10, x: ((k * 7) % 10 / 10 - 0.5) * width * 1.4 }; g.add(d); drops.push(d); }
  g.userData = { texes, mist, drops, len, out: 0.55, tex: texes[0] };
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
function makeHouse(seed, floors = 1, style) {
  const R = mrand(seed + 17), wall = pick(FAIRY.walls, R), roof = pick(FAIRY.roofs, R), accent = pick(FAIRY.roofs, R);
  style = style || ['tower', 'tower', 'mushroom', 'cottage', 'cottage'][Math.floor(R() * 5) % 5];
  const g = new THREE.Group(), tall = floors === 2;
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
    chimney = new THREE.Vector3(0.1, top + rh * 0.6, -0.12);
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
    chimney = new THREE.Vector3(-0.15, top + 0.3, -0.1);
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
    chimney = new THREE.Vector3(0.2, top + 0.45, -0.12);
  }
  const snow = new THREE.Mesh(roofMesh.geometry, M('#ffffff')); snow.position.copy(roofMesh.position); snow.position.y += 0.025; snow.scale.setScalar(1.035); snow.visible = false; g.add(snow);
  g.userData = { winMat, snow, chimney, lights, style };
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
function joinedBase(g, mask, mat, h, r = 0.42) {
  if (!mask) { g.add(mk(new THREE.CylinderGeometry(r, r + 0.02, h, 20), mat, 0, h / 2, 0)); return; }
  g.add(mk(new THREE.BoxGeometry(0.84, h, 0.84), mat, 0, h / 2, 0));
  for (const [bit, dx, dz] of SIDES) if (mask & bit) g.add(mk(new THREE.BoxGeometry(dx ? 0.1 : 0.84, h, dz ? 0.1 : 0.84), mat, dx * 0.46, h / 2, dz * 0.46));
  // fill the corner between two joined sides only when the diagonal is joined too (left to the caller: corners stay soft)
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
function makeGarden(seed, kind, mask = 0) {
  const R = mrand(seed + 5), g = new THREE.Group(), flowers = [];
  kind = kind || gardenKind(seed); R();
  const grow = (m, th) => { m.userData.th = th; g.add(m); flowers.push(m); };
  const fill = (n) => { const out = []; for (let k = 0; k < n; k++) { let x = (R() - 0.5) * 0.66, z = (R() - 0.5) * 0.66; if (!mask) { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.32; x = Math.cos(a) * r; z = Math.sin(a) * r; } for (const [bit, dx, dz] of SIDES) if ((mask & bit) && R() < 0.35) { if (dx) x = dx * (0.3 + R() * 0.18); else z = dz * (0.3 + R() * 0.18); } out.push([x, z]); } return out; };
  if (kind === 'bed') {
    joinedBase(g, mask, T('#8d6450', 'dirt'), 0.07, 0.4);
    for (const [x, z] of edgePoints(mask, 4, 0.43)) g.add(mk(new THREE.DodecahedronGeometry(0.045 + R() * 0.015, 0), T(pick(['#e6dcd0', '#d9d1e0', '#f1ece6'], R), 'stone'), x, 0.05, z));
    const cols = [pick(PAL.flower, R), pick(PAL.flower, R), pick(PAL.flower, R)];
    fill(13).forEach(([x, z], k) => { const f = makeFlower(cols[k % 3], 0.8 + R() * 0.5, R); f.position.set(x, 0.06, z); grow(f, k / 13); });
  } else if (kind === 'veg') {
    joinedBase(g, mask, T('#7a5442', 'dirt'), 0.08, 0.42);
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
    joinedBase(g, mask, T('#9fcb7c', 'grass'), 0.035, 0.44);
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
    joinedBase(g, mask, T('#d8c8b0', 'stone'), 0.05, 0.4);
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
  g.userData.flowers = flowers; g.userData.kind = kind;
  return g;
}

/**
 * A meadow, one of four kinds chosen by its seed: tall wild grass with daisies and poppies, a
 * lavender field in soft rows, clover with a toadstool cluster and a fallen log, or a patch of
 * sunflowers and bluebells. mask joins it to meadows beside it: the grass runs on with no edge.
 */
function makeMeadow(seed, kind, mask = 0) {
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
  g.userData.kind = kind;
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
  g.add(body); g.userData.body = body; g.userData.legs = legs; g.userData.arms = arms; g.userData.head = head;
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
  for (const x of [-0.025, 0.025]) body.add(mk(new THREE.SphereGeometry(0.01, 3, 3), '#ffffff', x, 0.24, 0.19));
  const legs = [];
  for (const [x, z] of [[-0.06, 0.06], [0.06, 0.06], [-0.06, -0.06], [0.06, -0.06]]) { const hip = new THREE.Group(); hip.position.set(x, 0.1, z); hip.add(mk(new THREE.CylinderGeometry(0.018, 0.016, 0.1, 6), PAL.faceDark, 0, -0.05, 0)); body.add(hip); legs.push(hip); }
  g.add(body); g.userData.body = body; g.userData.legs = legs; g.userData.stride = 20;
  return g;
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
  const boulder = (x, z, s, col = PAL.rock) => { const b = mk(new THREE.DodecahedronGeometry(0.12 * s, 0), T(col, 'rock'), x, 0.08 * s, z); b.rotation.set(R() * 3, R() * 3, 0); g.add(b); };
  const place = (geo, x, z, y = 0) => { const m = new THREE.Mesh(geo, peakMat()); m.position.set(x, y, z); m.rotation.y = R() * 6; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  cells.forEach(([x, z], k) => {
    const main = k === 0, jx = x + (R() - 0.5) * 0.2, jz = z + (R() - 0.5) * 0.2;
    if (style === 'alpine') {
      const h = main ? 2.4 + R() * 1.2 : 1.1 + R() * 0.9, r = main ? 0.9 : 0.62 + R() * 0.15;
      place(peakGeo(r, h, R, [[0, '#7fae66'], [0.16, '#9c8fae', '#ad9fbf'], [0.62, '#c9bfd8'], [0.7, '#fbf7ff']], 0.2), jx, jz, h / 2);
      if (R() < 0.8) pine(x + 0.4, z + 0.3, 0.8 + R() * 0.5);
      if (R() < 0.5) pine(x - 0.35, z + 0.38, 0.6 + R() * 0.4);
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
      place(peakGeo(main ? 0.75 : 0.55, h, R, [[0, '#6f6390'], [0.5, '#8a7aa8']], 0.22), jx, jz, h / 2);
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
        const geo = new THREE.CylinderGeometry(pr * 0.7, pr, ph, 7, 4).toNonIndexed(); const gp = geo.attributes.position;
        for (let i = 0; i < gp.count; i++) { const f = 1 + (Math.sin(gp.getY(i) * 7 + c) * 0.12); gp.setX(i, gp.getX(i) * f); gp.setZ(i, gp.getZ(i) * f); }
        const colA = new THREE.Color('#a99bbf'), colB = new THREE.Color('#c9b8cf'), cc = [];
        for (let i = 0; i < gp.count; i += 3) { const yy = (gp.getY(i) + ph / 2) / ph, cl = (Math.floor(yy * 6) % 2 ? colA : colB); for (let q = 0; q < 3; q++) cc.push(cl.r, cl.g, cl.b); }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); geo.computeVertexNormals();
        place(geo, jx + ox, jz + oz, ph / 2);
        g.add(mk(new THREE.CylinderGeometry(pr * 0.8, pr * 0.72, 0.06, 7), T('#8fbf74', 'grass'), jx + ox, ph + 0.02, jz + oz));
        if (R() < 0.6) { const v = mk(new THREE.CylinderGeometry(0.01, 0.01, ph * 0.5, 3), '#7cbf6a', jx + ox + pr * 0.7, ph * 0.72, jz + oz); g.add(v); }
      }
      boulder(x + 0.35, z + 0.3, 1);
    }
    g.add(mk(new THREE.CylinderGeometry(0.55, 0.62, 0.06, 9), T(PAL.grassDark, 'grass'), x, 0.03, z));
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
function makeRiver(cells, exitDir, rimDist = 0.8) {
  const g = new THREE.Group(), R = mrand(cells.length * 31 + cells[0][0] * 7 + cells[0][1]);
  const pts = cells.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const last = cells[cells.length - 1];
  const runTo = Math.max(0.2, rimDist - 0.3); // the flat river stops short of the rim; the lip below carries it over
  pts.push(new THREE.Vector3(last[0] + exitDir[0] * runTo * 0.55, 0, last[1] + exitDir[1] * runTo * 0.55));
  pts.push(new THREE.Vector3(last[0] + exitDir[0] * runTo, 0, last[1] + exitDir[1] * runTo));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), n = pts.length * 10;
  const bank = new THREE.Mesh(ribbonGeo(curve, 0.86, 0.022, n, 1), T('#e6d3b0', 'dirt')); bank.receiveShadow = true; g.add(bank);
  const water = new THREE.Mesh(ribbonGeo(curve, 0.54, 0.045, n, 0.5), waterMat()); water.receiveShadow = true; g.add(water);
  // the lip: the water bends gently down over the rounded edge of the island before it falls
  const lip = makeRiverLip(new THREE.Vector3(last[0] + exitDir[0] * runTo, 0, last[1] + exitDir[1] * runTo), exitDir, rimDist - runTo + 0.12, R); g.add(lip);
  // the spring: an irregular pond of the river's own water, fed by a little cascade from mossy rocks
  const sp = makeSpring(pts[0], pts[1], R); g.add(sp); g.userData.spring = sp.userData;
  const P = new THREE.Vector3(), Tg = new THREE.Vector3();
  for (let k = 1; k < pts.length * 3; k++) {
    const t = k / (pts.length * 3); curve.getPointAt(t, P); curve.getTangentAt(t, Tg);
    const sx = -Tg.z, sz = Tg.x, side = k % 2 ? 1 : -1, off = 0.36 + R() * 0.06;
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
  const g = new THREE.Group(), sx = -d[1], sz = d[0], n = 10;
  const prof = t => 0.045 - 0.19 * (t * t * (3 - 2 * t)); // eases from river level down to the edge
  const strip = (w0, w1, lift, mat, flow) => {
    const pos = [], uv = [], idx = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n, w = w0 + (w1 - w0) * t, x = p0.x + d[0] * len * t, z = p0.z + d[1] * len * t, y = prof(t) + lift;
      pos.push(x + sx * w / 2, y, z + sz * w / 2, x - sx * w / 2, y, z - sz * w / 2); uv.push(0, t * len * (flow ? 0.5 : 1), 1, t * len * (flow ? 0.5 : 1));
      if (k) { const q = (k - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) { geo.index.array.reverse(); geo.computeVertexNormals(); }
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; return m;
  };
  g.add(strip(0.86, 0.9, -0.022, T('#e6d3b0', 'dirt'), false));
  g.add(strip(0.54, 0.6, 0, waterMat(), true));
  for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { // mossy stones guarding the lip
    const t = 0.35 + k * 0.45, r = 0.07 + R() * 0.05, x = p0.x + d[0] * len * t + sx * sd * (0.42 + R() * 0.05), z = p0.z + d[1] * len * t + sz * sd * (0.42 + R() * 0.05);
    g.add(mk(new THREE.DodecahedronGeometry(r, 0), T('#a99bbf', 'rock'), x, prof(t) + r * 0.5, z));
    const ms = mk(new THREE.SphereGeometry(r * 0.8, 8, 6), MS('#7cae6a'), x, prof(t) + r * 1.05, z); ms.scale.y = 0.35; g.add(ms);
  }
  return g;
}
/**
 * Where a river rises: a pond with a wavy edge, drawn in the river's own flowing water so it runs
 * straight on into the stream, on a pebbly bank; an arc of mossy rocks behind it, with a tiny
 * cascade spilling from the tallest; ripples spread where it lands (userData.ripples, .fall).
 */
function makeSpring(p0, p1, R) {
  const g = new THREE.Group(), fx = p1.x - p0.x, fz = p1.z - p0.z, fl = Math.hypot(fx, fz) || 1, ux = fx / fl, uz = fz / fl, cx = p0.x + ux * 0.15, cz = p0.z + uz * 0.15; // a little downstream, clear of the mountain's foot
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
  // the little cascade from the tallest rock into the pond
  const fall = makeWaterfall(0.75, 0.32); fall.scale.setScalar(0.32);
  fall.position.set(back[0] + ux * 0.1, 0.28, back[1] + uz * 0.1); fall.rotation.y = Math.atan2(ux, uz); g.add(fall);
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
 * A stone way on one cell; mask joins it to neighbours: 1 east (+x), 2 west, 4 south (+z), 8 north.
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
  // flagstones on a jittered grid over the earth
  const inside = (x, z) => (Math.hypot(x, z) < 0.3) || ((mask & 1) && x > 0 && Math.abs(z) < 0.24) || ((mask & 2) && x < 0 && Math.abs(z) < 0.24) || ((mask & 4) && z > 0 && Math.abs(x) < 0.24) || ((mask & 8) && z < 0 && Math.abs(x) < 0.24);
  for (let gx = -2; gx <= 2; gx++) for (let gz = -2; gz <= 2; gz++) {
    const x = gx * 0.19 + (R() - 0.5) * 0.06, z = gz * 0.19 + (R() - 0.5) * 0.06;
    if (Math.abs(x) > 0.46 || Math.abs(z) > 0.46 || !inside(x, z)) continue;
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

/** The model for a piece type. */
function makePiece(type, seed, extra) {
  switch (type) {
    case 'house': return makeHouse(seed, extra || 1);
    case 'path': return makePath(extra || 0, seed);
    case 'tree': return makeTree(seed);
    case 'garden': { const [mk2, kd] = typeof extra === 'string' ? extra.split('|') : [0, '']; return makeGarden(seed, kd || undefined, +mk2 || 0); }
    case 'meadow': { const [mk2, kd] = typeof extra === 'string' ? extra.split('|') : [0, '']; return makeMeadow(seed, kd || undefined, +mk2 || 0); }
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
    case 'sound': case 'muted': P(5, 12, 11, 12, 18, 6, 18, 26, 11, 20, 5, 20); fill('#fff6e8');
      if (name === 'sound') { g.beginPath(); g.arc(19, 16, 5, -0.9, 0.9); stroke('#fff6e8', 2.2); g.beginPath(); g.arc(19, 16, 10, -0.8, 0.8); stroke('#fff6e8', 2.2); }
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
    case 'home': P(5, 15, 16, 6, 27, 15); fill('#fff6e8'); g.fillStyle = '#fff6e8'; g.fillRect(8, 15, 16, 12); g.fillStyle = '#5e4033'; g.fillRect(14, 19, 4, 8); break;
  }
  g.restore();
}
