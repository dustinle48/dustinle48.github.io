// PROTOTYPE - NOT FOR PRODUCTION
// Abovea: the simulation (building, growing, families, quests, the voyage, weather), the 3D
// world that shows it, the HUD and the music. The fixed step, the clock, rng, input and
// window.game live in index.html; everything here runs from its step and draw.
'use strict';

// ---- Grid: global cells, 1 unit each; an island owns the cells inside its rim ---------------------
const LAND = new Map(); // "i,j" -> island id
const K = (i, j) => i + ',' + j;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const TERRAIN = new Map(); // "i,j" -> { kind: 'mountain' | 'river' | 'lake', isl, flow: [di, dj] } — never built on
const landOf = (i, j) => { const v = LAND.get(K(i, j)); return v === undefined ? -1 : v; };
const terrainAt = (i, j) => TERRAIN.get(K(i, j));

// ---- The world: the hand-made sky (seed 0) or a random one ------------------------------------------
const DEFAULT_LAYOUT = ISLANDS.map(i => ({ cx: i.cx, cz: i.cz, y: i.y, r: i.r, ph: i.ph, seed: i.seed,
  features: i.features.map(f => ({ ...f })), secret: { a: i.secret.a, f: i.secret.f } }));
let WORLD_SEED = 0;
/** A small seeded generator for laying out a world (never the gameplay rng). */
function worldRand(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/**
 * Lays out the islands: seed 0 keeps the hand-made positions, any other seed places, sizes and
 * shapes them at random. Then every island gets land cells, mountains, rivers, features and a secret.
 */
function generateWorld(ws) {
  WORLD_SEED = ws;
  const R = worldRand(ws || 12345);
  ISLANDS.forEach((isl, k) => {
    const d = DEFAULT_LAYOUT[k];
    Object.assign(isl, { cx: d.cx, cz: d.cz, y: d.y, r: d.r * tune.islandScale, ph: d.ph, seed: d.seed, k0: 0, k1: 0.1, k2: 0.06 });
    isl.features = d.features.map(f => ({ ...f })); isl.secret.a = d.secret.a; isl.secret.f = d.secret.f;
  });
  if (ws) {
    const home = ISLANDS[0];
    Object.assign(home, { r: (tune.homeSizeMin + R() * (tune.homeSizeMax - tune.homeSizeMin)) * tune.islandScale, ph: R() * 6.28, k0: R() * 0.14, k1: 0.04 + R() * 0.12, k2: 0.02 + R() * 0.08, seed: 1 + Math.floor(R() * 999) });
    const slots = [0, 1, 2, 3].map(k => k * Math.PI / 2 + R() * 0.5);
    for (let k = slots.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [slots[k], slots[j]] = [slots[j], slots[k]]; }
    ISLANDS.slice(1).forEach((isl, k) => {
      const minR = isl.rarity === 'legendary' ? 4.2 : 3.2;
      const r = (minR + R() * (tune.islandSizeMax - minR)) * tune.islandScale, d = home.r + r + tune.islandGapMin + R() * (tune.islandGapMax - tune.islandGapMin);
      Object.assign(isl, { r, cx: Math.cos(slots[k]) * d, cz: Math.sin(slots[k]) * d, y: tune.skyLowest + R() * (tune.skyHighest - tune.skyLowest), ph: R() * 6.28,
        k0: R() * 0.16, k1: 0.04 + R() * 0.12, k2: 0.02 + R() * 0.08, seed: 1 + Math.floor(R() * 999) });
      isl.features.forEach((f, j) => { if (j) f.a = R() * 6.28; });
      isl.secret.a = R() * 6.28;
    });
  }
  LAND.clear(); TERRAIN.clear();
  for (const isl of ISLANDS) {
    isl.cells = [];
    const r = Math.ceil(isl.r * 1.4) + 1;
    for (let i = Math.floor(isl.cx) - r; i <= Math.ceil(isl.cx) + r; i++) for (let j = Math.floor(isl.cz) - r; j <= Math.ceil(isl.cz) + r; j++) {
      const x = i + 0.5 - isl.cx, z = j + 0.5 - isl.cz, a = Math.atan2(z, x);
      if (Math.hypot(x, z) < islandRadius(isl, a) - 0.45) { LAND.set(K(i, j), isl.id); isl.cells.push([i, j]); }
    }
    carveTerrain(isl, R);
    carveLake(isl, worldRand(((WORLD_SEED || 12345) * 131 + isl.id * 977 + 7) >>> 0));
    const used = new Set();
    const near = (a, f) => {
      const px = isl.cx + Math.cos(a) * f * isl.r, pz = isl.cz + Math.sin(a) * f * isl.r;
      let best = null, bd = 1e9;
      for (const c of isl.cells) { const k = K(c[0], c[1]), d = Math.hypot(c[0] + 0.5 - px, c[1] + 0.5 - pz); if (d < bd && !used.has(k) && !TERRAIN.has(k)) { bd = d; best = c; } }
      if (!best) best = isl.cells[0];
      used.add(K(best[0], best[1])); return best;
    };
    isl.featureCells = isl.features.map(f => ({ type: f.type, cell: near(f.a, f.f) }));
    isl.secretCell = near(isl.secret.a, isl.secret.f);
  }
}
/**
 * A small still lake of 3 to 5 cells, well inside the rim and clear of mountains and rivers. It has
 * its own random stream, so adding lakes never moves an older sky's mountains or rivers.
 */
function carveLake(isl, R) {
  isl.lakes = [];
  if (isl.id !== 0 && R() >= tune.lakeChance) return;
  const inner = c => N4.every(([di, dj]) => landOf(c[0] + di, c[1] + dj) === isl.id) && N4.every(([di, dj]) => !TERRAIN.has(K(c[0] + di, c[1] + dj)));
  const ok = c => landOf(c[0], c[1]) === isl.id && !TERRAIN.has(K(c[0], c[1])) && inner(c) && Math.hypot(c[0] + 0.5 - isl.cx, c[1] + 0.5 - isl.cz) > 1.6;
  const cand = isl.cells.filter(ok);
  if (!cand.length) return;
  const seed = cand[Math.floor(R() * cand.length)], blob = [seed], size = 3 + Math.floor(R() * 3), inBlob = new Set([K(seed[0], seed[1])]);
  for (let tries = 0; blob.length < size && tries < 30; tries++) {
    const b = blob[Math.floor(R() * blob.length)], [di, dj] = N4[Math.floor(R() * 4)], c2 = [b[0] + di, b[1] + dj];
    if (!inBlob.has(K(c2[0], c2[1])) && landOf(c2[0], c2[1]) === isl.id && !TERRAIN.has(K(c2[0], c2[1])) && inner(c2)) { blob.push(c2); inBlob.add(K(c2[0], c2[1])); }
  }
  for (const c2 of blob) TERRAIN.set(K(c2[0], c2[1]), { kind: 'lake', isl: isl.id });
  isl.lakes.push(blob);
}
/** How far from a cell's centre, going d, the island's rim is (the slab reaches islandRadius + 0.42). */
function rimFrom(isl, c, d) {
  const lx = c[0] + 0.5 - isl.cx, lz = c[1] + 0.5 - isl.cz; let r = 0.3;
  while (r < 3 && Math.hypot(lx + d[0] * r, lz + d[1] * r) < islandRadius(isl, Math.atan2(lz + d[1] * r, lx + d[0] * r)) + 0.36) r += 0.04;
  return r;
}
/** Is stepping off the land from this cell, going d, a true edge: outward, with the rim right there? */
function exitOk(isl, c, d) {
  const lx = c[0] + 0.5 - isl.cx, lz = c[1] + 0.5 - isl.cz, l = Math.hypot(lx, lz) || 1;
  return (d[0] * lx + d[1] * lz) / l > 0.45 && rimFrom(isl, c, d) < 1.3;
}
/** The shortest way over open land from the spring to a true edge, when the meandering walk found none. */
function riverToRim(isl, start) {
  const prev = new Map([[K(start[0], start[1]), null]]), q = [start];
  while (q.length) {
    const c = q.shift();
    for (const d of N4) {
      const n = [c[0] + d[0], c[1] + d[1]], k = K(n[0], n[1]);
      if (landOf(n[0], n[1]) !== isl.id) {
        if (exitOk(isl, c, d)) { const path = []; for (let p = c; p; p = prev.get(K(p[0], p[1]))) path.unshift(p); return path.length >= 2 ? { path, exit: { cell: c, d } } : null; }
        continue;
      }
      if (prev.has(k) || TERRAIN.has(k)) continue;
      prev.set(k, c); q.push(n);
    }
  }
  return null;
}
/** Raises mountains and runs rivers from them to the rim, where they fall into the clouds. */
function carveTerrain(isl, R) {
  isl.mountains = []; isl.rivers = [];
  const ctr = (c) => Math.hypot(c[0] + 0.5 - isl.cx, c[1] + 0.5 - isl.cz);
  const nM = isl.id === 0 ? tune.homeMountains + (R() < tune.extraMountainChance ? 1 : 0) : (isl.r >= 3.8 && R() < tune.extraMountainChance ? 1 : 0);
  for (let m = 0; m < nM; m++) {
    const a = R() * 6.28, f = 0.5 + R() * 0.25, px = isl.cx + Math.cos(a) * f * isl.r, pz = isl.cz + Math.sin(a) * f * isl.r;
    let seed = null, bd = 1e9;
    for (const c of isl.cells) { const d = Math.hypot(c[0] + 0.5 - px, c[1] + 0.5 - pz); if (d < bd && !TERRAIN.has(K(c[0], c[1])) && ctr(c) > 1.8) { bd = d; seed = c; } }
    if (!seed) continue;
    const blob = [seed], size = isl.id === 0 ? 4 + Math.floor(R() * 3) : 3 + Math.floor(R() * 2);
    TERRAIN.set(K(seed[0], seed[1]), { kind: 'mountain', isl: isl.id });
    for (let tries = 0; blob.length < size && tries < 40; tries++) {
      const b = blob[Math.floor(R() * blob.length)], [di, dj] = N4[Math.floor(R() * 4)], c = [b[0] + di, b[1] + dj];
      if (landOf(c[0], c[1]) === isl.id && !TERRAIN.has(K(c[0], c[1])) && ctr(c) > 1.8) { TERRAIN.set(K(c[0], c[1]), { kind: 'mountain', isl: isl.id }); blob.push(c); }
    }
    isl.mountains.push(blob);
  }
  const wantRiver = isl.id === 0 ? true : isl.r >= 3.4 && R() < tune.riverChance;
  if (!wantRiver) return;
  // Spring: beside a mountain when there is one, otherwise partway out from the centre.
  let start = null;
  const m0 = isl.mountains[0];
  if (m0) for (const b of m0) for (const [di, dj] of N4) { const c = [b[0] + di, b[1] + dj]; if (!start && landOf(c[0], c[1]) === isl.id && !TERRAIN.has(K(c[0], c[1])) && ctr(c) > 1.5) start = c; }
  if (!start) { const a = R() * 6.28; start = isl.cells.reduce((best, c) => { const d = Math.hypot(c[0] + 0.5 - isl.cx - Math.cos(a) * isl.r * 0.35, c[1] + 0.5 - isl.cz - Math.sin(a) * isl.r * 0.35); return !best || d < best.d ? { c, d } : best; }, null).c; }
  const out = Math.atan2(start[1] + 0.5 - isl.cz, start[0] + 0.5 - isl.cx) + (R() < 0.5 ? 1 : -1) * (1.1 + R() * 0.6), dx = Math.cos(out), dz = Math.sin(out);
  const path = [start], seen = new Set([K(start[0], start[1])]);
  let cur = start, exit = null;
  for (let step = 0; step < 14 && !exit; step++) {
    let best = null, bs = -1e9;
    for (const [di, dj] of N4) {
      const c = [cur[0] + di, cur[1] + dj], k = K(c[0], c[1]);
      if (seen.has(k)) continue;
      const s = di * dx + dj * dz + R() * 0.5;
      if (landOf(c[0], c[1]) !== isl.id) { if (s > bs && di * dx + dj * dz > 0.2) { bs = s + 10; best = { c, off: true, d: [di, dj] }; } continue; }
      if (TERRAIN.has(k)) continue;
      if (s > bs) { bs = s; best = { c, off: false, d: [di, dj] }; }
    }
    if (!best) break;
    if (best.off) exit = { cell: cur, d: best.d };
    else { path.push(best.c); seen.add(K(best.c[0], best.c[1])); cur = best.c; }
  }
  // Only a real edge will do: the step off the land must point outward and meet the rim close by.
  if (exit && !exitOk(isl, exit.cell, exit.d)) exit = null;
  if (!exit || path.length < 2) { const alt = riverToRim(isl, start); if (!alt) return; path.length = 0; path.push(...alt.path); exit = alt.exit; }
  path.forEach((c, k) => {
    const n = path[k + 1], d = n ? [n[0] - c[0], n[1] - c[1]] : exit.d;
    TERRAIN.set(K(c[0], c[1]), { kind: 'river', isl: isl.id, flow: d });
  });
  isl.rivers.push({ path, exit });
}


// ---- State -------------------------------------------------------------------------------------
/** A fresh sky: the empty home island and four islands hidden in the mist. */
function newState() {
  const s = {
    t: 0, score: 0, gained: '', dayT: tune.startDayT, nextId: 1,
    pieces: [], occ: {}, folk: [], puffs: [], fluff: [], families: {},
    islands: ISLANDS.map(i => ({ discovered: i.id === 0, secretFound: false, relicTaken: false, reveal: i.id === 0 ? 1 : 0 })),
    quest: 0, questReady: false, mode: 'build', voyage: null, modal: null, modalQueue: [],
    tool: 'look', rot: 0, unlocked: { look: 1, house: 1, path: 1, tree: 1, garden: 1, turn: 1, tidy: 1 },
    worldSeed: WORLD_SEED, over: {}, bridges: [], bridgeStart: null, pets: [], petNames: [],
    relics: { bell: false, starlamp: false }, track: 'home', view: 'builder', followId: 0,
    cam: { tx: 0, tz: 0, ty: 0, yaw: 0.7, dist: tune.camZoomStart },
    weather: { kind: 'clear', until: 0, next: tune.weatherFirst, amt: 0, flash: 0, snow: 0, count: 0 },
    counts: { trees: 0, lanterns: 0, bridges: 0, gardens: 0, houses: 0 },
    hint: '', toasts: [], ended: false, nightShow: false, usedNames: [], found: [],
    cat: 'homes', bridgePreview: '',
    // Family names are fresh every game; a check run (a seed in the address, or cheap render) keeps them repeatable.
    nameSeed: params.has('seed') || CHEAP ? seed * 7 + 3 : (Date.now() % 2147483646) + 1,
  };
  for (const isl of ISLANDS) isl.featureCells.forEach((f, k) => {
    if (PLACED_FEATURES[f.type]) { // stands there from the start, but is yours: Turn and Tidy work on it
      const id = s.nextId++, [i, j] = f.cell, rot = Math.round(Math.atan2(isl.cx - i - 0.5, isl.cz - j - 0.5) / (Math.PI / 2)) * Math.PI / 2;
      s.pieces.push({ id, type: f.type, i, j, isl: isl.id, rot: (rot + Math.PI * 2) % (Math.PI * 2), seed: id * 7 + i * 13 + j * 31, t0: -10, done: 1, grow: 1, floors: 1, readyAt: -1, pre: true });
      s.occ[K(i, j)] = id; return;
    }
    s.occ[K(f.cell[0], f.cell[1])] = 'f' + isl.id + '_' + k;
  });
  // A few rocks scattered near each island's edge; they are pieces, so Tidy clears them.
  for (const isl of ISLANDS) {
    const RR = mrand(isl.seed * 3 + 77 + WORLD_SEED), edge = isl.cells.filter(c => N4.some(([di, dj]) => landOf(c[0] + di, c[1] + dj) !== isl.id) && !TERRAIN.has(K(c[0], c[1])) && s.occ[K(c[0], c[1])] === undefined);
    const n = Math.min(edge.length, tune.rocksPerIsland + (isl.r > 6 ? 1 : 0));
    for (let k = 0; k < n; k++) {
      const c = edge.splice(Math.floor(RR() * edge.length), 1)[0], id = s.nextId++;
      s.pieces.push({ id, type: 'rock', i: c[0], j: c[1], isl: isl.id, rot: RR() * Math.PI * 2, seed: id * 7 + c[0] * 13 + c[1] * 31, t0: -10, done: 1, grow: 1, floors: 1, readyAt: -1, pre: true });
      s.occ[K(c[0], c[1])] = id;
    }
  }
  return s;
}
const taps = []; // screen taps waiting for the next step
/** Features that start out as ordinary pieces (home's first lantern), so they can be turned or tidied. */
const PLACED_FEATURES = { lantern: 1, rock: 1 };

// ---- Day and night ------------------------------------------------------------------------------
/** Sun position and light: day is the first 65% of the cycle, night the rest. */
function sun(dayT = state.dayT) {
  const ang = dayT < 0.65 ? dayT / 0.65 * Math.PI : Math.PI + (dayT - 0.65) / 0.35 * Math.PI;
  const elev = Math.sin(ang);
  const daylight = smooth(-0.22, 0.28, elev);
  const warm = Math.max(0, Math.min(1, 1 - elev * 2.2)) * daylight;
  return { ang, elev, daylight, warm, night: 1 - daylight };
}
function smooth(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
const isNight = () => sun().night > 0.55;
function dayName() {
  const d = state.dayT;
  return d < 0.07 ? 'Dawn' : d < 0.3 ? 'Morning' : d < 0.52 ? 'Afternoon' : d < 0.66 ? 'Dusk' : d < 0.96 ? 'Night' : 'Dawn';
}

// ---- Helpers on pieces ------------------------------------------------------------------------------
const pop = () => state.folk.length;
const pieceAt = (i, j) => { const id = state.occ[K(i, j)]; return typeof id === 'number' ? state.pieces.find(p => p.id === id) : null; };
const pieceById = id => state.pieces.find(p => p.id === id);
/** A piece standing over a path on this cell (a Star Arch), if any. */
const overAt = (i, j) => { const id = state.over[K(i, j)]; return id ? pieceById(id) : null; };
/** The piece a tap on this cell means: an arch over a path first, then whatever stands there. */
const topPieceAt = (i, j) => overAt(i, j) || pieceAt(i, j);
/** Pieces that may stand over a path. */
const OVER_PATH = { arch: 1 };
const blocksWalk = p => p && !(p.type === 'garden' || p.type === 'meadow' || p.type === 'bridge' || p.type === 'path');
/** How many cells a side a piece of this type covers (the village buildings: 2). */
const sizeOf = type => (PIECES[type] && PIECES[type].size) || 1;
/** Every cell a piece covers, from its anchor (its lowest i, j corner). */
function cellsOf(p) { const n = sizeOf(p.type), out = []; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) out.push([p.i + a, p.j + b]); return out; }
/** The middle of a piece's footprint. */
function centerOf(p) { const n = sizeOf(p.type); return [p.i + n / 2, p.j + n / 2]; }
/** Where a piece of this type is anchored for a pointer hit: a big one centres on the grid corner nearest the pointer. */
function anchorFor(type, hit) { if (!hit || sizeOf(type) < 2 || hit.x === undefined) return hit; return { ...hit, i: Math.round(hit.x) - 1, j: Math.round(hit.z) - 1 }; }
function doorOf(p) { const n = sizeOf(p.type), [cx, cz] = centerOf(p); return [cx + Math.sin(p.rot) * n / 2, cz + Math.cos(p.rot) * n / 2]; }
function hasGreen(p) {
  const r = tune.readyRange;
  return state.pieces.some(q => GREEN[q.type] && q.isl === p.isl && Math.abs(q.i - p.i) <= r && Math.abs(q.j - p.j) <= r);
}
function toast(text, secs = 4) { state.toasts.push({ text, until: state.t + secs }); if (state.toasts.length > 3) state.toasts.shift(); }
function recount() {
  const c = { trees: 0, lanterns: 0, bridges: 0, gardens: 0, houses: 0 };
  for (const p of state.pieces) {
    if (p.type === 'tree') c.trees++; else if (p.type === 'lantern' && !p.pre) c.lanterns++; // the lantern home starts with is not one you lit
    else if (p.type === 'house') c.houses++;
    else if (p.type === 'garden' && p.grow >= 1) c.gardens++;
  }
  c.bridges = state.bridges.length;
  state.counts = c;
}
/**
 * Pieces that fit themselves to their neighbours: houses nestled among two or more rise to two
 * floors, and paths join to paths, bridges and the doors of houses beside them.
 */
function refloor() {
  for (const p of state.pieces) if (p.type === 'house') {
    let n = 0;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) if (di || dj) { const q = pieceAt(p.i + di, p.j + dj); if (q && q.type === 'house') n++; }
    p.floors = n >= 2 ? 2 : 1;
  }
  const bits = [[1, 0, 1], [-1, 0, 2], [0, 1, 4], [0, -1, 8]];
  for (const p of state.pieces) if (p.type === 'path') {
    let m = 0;
    for (const [di, dj, b] of bits) {
      const q = pieceAt(p.i + di, p.j + dj), occ = state.occ[K(p.i + di, p.j + dj)];
      if (q && q.type === 'path') m |= b;
      else if (typeof occ === 'string' && occ[0] === 'B') m |= b; // a bridge end
      else if (q && DOORED[q.type]) { const [dx, dz] = doorOf(q); if (Math.floor(dx) === p.i && Math.floor(dz) === p.j) m |= b; }
    }
    p.mask = m;
  }
  const JOINS = { garden: 1, meadow: 1 }, seen = new Set();
  for (const p of state.pieces) if (JOINS[p.type]) {
    let m = 0;
    for (const [di, dj, b] of bits) { const q = pieceAt(p.i + di, p.j + dj); if (q && q.type === p.type) m |= b; }
    p.mask = m;
  }
  for (const p of state.pieces) if (JOINS[p.type] && !seen.has(p.id)) { // a joined patch takes the kind of its first piece
    const patch = [p], todo = [p]; seen.add(p.id);
    while (todo.length) { const c = todo.pop(); for (const [di, dj] of bits) { const q = pieceAt(c.i + di, c.j + dj); if (q && q.type === p.type && !seen.has(q.id)) { seen.add(q.id); patch.push(q); todo.push(q); } } }
    const first = patch.reduce((a, b) => (b.id < a.id ? b : a)), kind = p.type === 'garden' ? gardenKind(first.seed) : meadowKind(first.seed);
    for (const q of patch) q.kind = kind;
  }
}
/** The height a piece stands at: its island's. */
function pieceY(p) { return ISLANDS[p.isl].y; }
/**
 * How high an island floats right now: its resting height plus a slow drift up and down, each
 * island at its own pace and phase, so they never move together.
 */
function islandLift(id) {
  const isl = ISLANDS[id], k = ((isl.seed * 0.618) % 1);
  return isl.y + tune.islandBob * (0.6 + 0.4 * k) * Math.sin(state.t * tune.islandBobSpeed * (0.75 + 0.5 * k) + isl.seed);
}

// ---- Bridges: a straight line between two points you choose -----------------------------------------
const bridgeById = id => state.bridges.find(b => b.id === id);
/** The two ends of a bridge in the world, at the islands' heights right now. */
function bridgeEnds(b, p1 = new THREE.Vector3(), p2 = new THREE.Vector3()) {
  p1.set(b.i1 + 0.5, islandLift(b.a) + 0.03, b.j1 + 0.5); p2.set(b.i2 + 0.5, islandLift(b.b) + 0.03, b.j2 + 0.5);
  return [p1, p2];
}
const bridgeLen = b => Math.hypot(b.i2 - b.i1, b.j2 - b.j1);
/** How high a footbridge over a river or lake arches (0: a sky bridge between islands, which sags). */
const humpFor = (sameIsland, len) => sameIsland ? Math.min(0.45, 0.16 + len * 0.05) : 0;
const bridgeHump = b => humpFor(b.a === b.b, bridgeLen(b));
/**
 * Where a bridge between islands leaves the first island's rim and reaches the second's, as
 * fractions [ta, tb] of its length (the slab reaches about 0.45 past the last land cell). A bridge
 * on one island spans its whole length.
 */
function bridgeSpan(a, b) {
  const L = Math.hypot(b.i - a.i, b.j - a.j);
  if (a.isl === b.isl || L < 0.5) return [0, 1];
  const n = Math.ceil(L / 0.1), on = (k, isl) => landOf(Math.floor(a.i + 0.5 + (b.i - a.i) * k / n), Math.floor(a.j + 0.5 + (b.j - a.j) * k / n)) === isl;
  let ka = 0; while (ka < n && on(ka + 1, a.isl)) ka++;
  let kb = n; while (kb > 0 && on(kb - 1, b.isl)) kb--;
  let ta = Math.min(1, ka / n + 0.45 / L), tb = Math.max(0, kb / n - 0.45 / L);
  if (tb - ta < 0.1) { const m = (ta + tb) / 2; ta = Math.max(0, m - 0.05); tb = Math.min(1, m + 0.05); }
  return [ta, tb];
}
/** Can a bridge end on this cell? Open, found ground with no mountain, river or building on it. */
function bridgeEndOk(hit) {
  if (!hit || hit.kind !== 'land' || !state.islands[hit.isl].discovered) return 'Bridges start and end on an island you have found.';
  if (terrainAt(hit.i, hit.j)) return 'A bridge cannot start on a mountain or in the water.';
  if (state.occ[K(hit.i, hit.j)] !== undefined) return 'Something is already here.';
  return '';
}
/** Why a bridge from a to b cannot be built, or '' when it can: the straight line must be clear. */
function bridgeProblem(a, b) {
  const e = bridgeEndOk(b); if (e) return e;
  const len = Math.hypot(b.i - a.i, b.j - a.j);
  if (len < 1.5) return 'Tap a little further away to end the bridge.';
  if (len > tune.skyBridgeMax) return 'That is too far for one bridge.';
  const n = Math.ceil(len / 0.2);
  let water = false;
  for (let k = 1; k < n; k++) {
    const x = a.i + 0.5 + (b.i - a.i) * k / n, z = a.j + 0.5 + (b.j - a.j) * k / n, i = Math.floor(x), j = Math.floor(z);
    if ((i === a.i && j === a.j) || (i === b.i && j === b.j)) continue;
    const l = landOf(i, j); if (l < 0) continue;
    if (l !== a.isl && l !== b.isl) return 'Another island is in the way.';
    const t = terrainAt(i, j); if (t && t.kind === 'mountain') return 'A mountain is in the way.';
    if (t && (t.kind === 'river' || t.kind === 'lake')) water = true;
    if (overAt(i, j)) return 'Something you built is in the way.';
    const o = state.occ[K(i, j)], q = pieceAt(i, j);
    if (q && q.type !== 'path' && q.type !== 'garden' && q.type !== 'meadow') return 'Something you built is in the way.';
    if (typeof o === 'string') return 'Something is in the way.';
  }
  if (a.isl === b.isl && !water) return 'A bridge joins two islands, or crosses a river or a lake.';
  return '';
}
function buildBridge(a, b) {
  const id = state.nextId++;
  const [ta, tb] = bridgeSpan(a, b);
  state.bridges.push({ id, a: a.isl, b: b.isl, i1: a.i, j1: a.j, i2: b.i, j2: b.j, ta, tb });
  state.occ[K(a.i, a.j)] = 'B' + id; state.occ[K(b.i, b.j)] = 'B' + id;
  refloor(); recount(); sfx.moveIn();
  fxPuff(a.i + 0.5, islandLift(a.isl), a.j + 0.5, '#fff6ee'); fxPuff(b.i + 0.5, islandLift(b.isl), b.j + 0.5, '#fff6ee');
  toast(a.isl === b.isl ? 'A bridge now spans the way.' : `A bridge now joins ${ISLANDS[a.isl].name} and ${ISLANDS[b.isl].name}. The sky-folk can visit.`, 4);
  events.push({ type: 'bridge', a: a.isl, b: b.isl });
}
/** The bridge with an end on this cell, if any. */
function bridgeAtCell(i, j) { const o = state.occ[K(i, j)]; return typeof o === 'string' && o[0] === 'B' ? bridgeById(Number(o.slice(1))) : null; }
function removeBridge(b) {
  delete state.occ[K(b.i1, b.j1)]; delete state.occ[K(b.i2, b.j2)];
  state.bridges = state.bridges.filter(x => x !== b);
  for (const f of state.folk) if (f.bridge === b.id && (f.mode === 'cross' || f.mode === 'toBridge')) { // anyone on it floats safely home
    const h = pieceById(f.house); if (h) { const [dx, dz] = doorOf(h); f.x = dx; f.z = dz; f.isl = h.isl; } f.mode = 'idle'; f.bridge = 0; f.route = null;
  }
  refloor(); recount(); sfx.tidy();
}

// ---- Placing -------------------------------------------------------------------------------------
/** Can this piece go at this hit? Returns the island id it belongs to, or -1. Mountains and rivers refuse everything but a bridge over water. */
function canPlace(type, hit) {
  if (hit && sizeOf(type) > 1) { // a village building: all four cells clear, on the same found island
    const a = anchorFor(type, hit);
    if (!state.islands[a.isl] || !state.islands[a.isl].discovered) return -1;
    for (const [i, j] of cellsOf({ type, i: a.i, j: a.j })) if (landOf(i, j) !== a.isl || state.occ[K(i, j)] !== undefined || terrainAt(i, j) || overAt(i, j)) return -1;
    return a.isl;
  }
  if (hit && OVER_PATH[type] && !overAt(hit.i, hit.j)) { const q = pieceAt(hit.i, hit.j); if (q && q.type === 'path') return q.isl; } // over a path
  if (hit && type === 'path') { const q = pieceAt(hit.i, hit.j); if (q && OVER_PATH[q.type] && !q.over) return q.isl; } // a path laid under an arch
  if (!hit || state.occ[K(hit.i, hit.j)] !== undefined) return -1;
  const ter = terrainAt(hit.i, hit.j);
  if (type === 'bridge') return -1; // bridges are laid with two taps (tapsStep)
  if (ter) return -1;
  return hit.kind === 'land' && state.islands[hit.isl].discovered ? hit.isl : -1;
}
/** Pieces with a front door: they turn to face a path beside them. */
const DOORED = { house: 1, school: 1, healer: 1 };
/**
 * The turn a doored piece takes at this cell: the chosen turn when a path is that way or none is
 * beside it, otherwise to face the nearest path (trying the chosen way first, then round).
 */
function placeRot(type, hit) {
  if (!DOORED[type] || !hit) return PIECES[type] && PIECES[type].flat ? 0 : state.rot;
  const q = Math.round(state.rot / (Math.PI / 2)), a = anchorFor(type, hit), n = sizeOf(type);
  for (let k = 0; k < 4; k++) {
    const r = ((q + k) % 4) * Math.PI / 2, dx = Math.round(Math.sin(r)), dz = Math.round(Math.cos(r));
    for (let t = 0; t < n; t++) { // the cells along that side of the footprint
      const i = dx ? (dx > 0 ? a.i + n : a.i - 1) : a.i + t, j = dz ? (dz > 0 ? a.j + n : a.j - 1) : a.j + t, nb = pieceAt(i, j);
      if (nb && nb.type === 'path') return r;
    }
  }
  return state.rot;
}
function place(type, hit) {
  const isl = canPlace(type, hit);
  if (isl < 0) { if (sizeOf(type) > 1 && hit) toast(`The ${PIECES[type].name} needs a clear space of 2 by 2.`, 2.5); return false; }
  hit = anchorFor(type, hit);
  const def = PIECES[type], id = state.nextId++;
  const rot = placeRot(type, hit);
  if (DOORED[type] && rot !== state.rot) toast('It turned to face the path.', 1.5);
  const p = { id, type, i: hit.i, j: hit.j, isl, rot, seed: id * 7 + hit.i * 13 + hit.j * 31, t0: state.t, done: 0, grow: def.kind === 'living' ? 0 : 1, floors: 1, readyAt: -1 };
  const under = pieceAt(hit.i, hit.j);
  if (type === 'path' && under && OVER_PATH[under.type]) { under.over = true; state.over[K(hit.i, hit.j)] = under.id; state.occ[K(hit.i, hit.j)] = id; } // the arch now stands over the new path
  else if (OVER_PATH[type] && under && under.type === 'path') { p.over = true; p.rot = state.rot; state.over[K(hit.i, hit.j)] = id; } // stands over the path, which stays
  else for (const [i, j] of cellsOf(p)) state.occ[K(i, j)] = id;
  state.pieces.push(p);
  refloor(); recount();
  const [pcx, pcz] = centerOf(p);
  sfx.place(type); fxPuff(pcx, pieceY(p), pcz, def.kind === 'living' ? '#cfe8b0' : '#fff6ee');
  events.push({ type: 'place', piece: type, i: hit.i, j: hit.j });
  return true;
}
/** Turns a placed piece a quarter turn (a bridge swaps its direction; a path fits itself). */
function turnPiece(hit) {
  const p = hit && topPieceAt(hit.i, hit.j);
  if (!p) { toast(hit && bridgeAtCell(hit.i, hit.j) ? 'Bridges run straight between their two ends.' : 'Tap something you built to turn it.', 2); return; }
  if (p.type === 'path') { toast('Paths join up on their own.', 2); return; }
  p.rot = (p.rot + Math.PI / 2) % (Math.PI * 2);
  if (p.type === 'house') for (const f of state.folk) if (f.house === p.id && f.mode === 'home') { const [dx, dz] = doorOf(p); f.tx = dx; f.tz = dz; }
  refloor(); sfx.ui(); fxPuff(p.i + 0.5, pieceY(p), p.j + 0.5, '#fff6ee');
  events.push({ type: 'turn', piece: p.type });
}
function tidy(hit) {
  const br = hit && bridgeAtCell(hit.i, hit.j);
  if (br) { removeBridge(br); return; }
  const p = hit && topPieceAt(hit.i, hit.j);
  if (!p) return;
  if (state.families[p.id]) { toast(`The ${state.families[p.id].name} family lives here.`); return; }
  state.pieces = state.pieces.filter(q => q !== p);
  if (p.over) delete state.over[K(p.i, p.j)]; else for (const [i, j] of cellsOf(p)) delete state.occ[K(i, j)];
  state.fluff = state.fluff.filter(f => f.meadow !== p.id);
  refloor(); recount(); sfx.tidy(); fxPuff(p.i + 0.5, pieceY(p), p.j + 0.5, '#e9e2f2');
}
function familyLine(p) {
  const f = state.families[p.id]; if (!f) return '';
  const here = state.folk.filter(x => x.house === p.id), big = here.filter(x => x.kind === 'adult').length, small = here.length - big;
  const pets = state.pets.filter(x => x.house === p.id).map(x => `${PET_KINDS[x.kind].a} named ${x.name}`);
  return `The ${f.name} family: ${big} grown-up${big === 1 ? '' : 's'}${small ? `, ${small} little one${small > 1 ? 's' : ''}` : ''}${pets.length ? `, and ${pets.join(' and ')}` : ''}.`;
}
/** Grown-up children who have not married yet. */
const singles = () => state.folk.filter(f => f.grown && !f.married);
/** Two singles from different families, or null. */
function couple() {
  const s = singles();
  for (const a of s) { const b = s.find(o => o !== a && o.house !== a.house); if (b) return [a, b]; }
  return null;
}
/** A wedding: the two move into the ready home p as a new family, which may have children of its own. */
function wed([a, b], p) {
  const na = state.families[a.house].name.split('-')[0], nb = state.families[b.house].name.split('-')[0], name = `${na}-${nb}`;
  state.families[p.id] = { name, moved: state.t, kids: 0, nextChild: state.t + childGap() };
  for (const f of [a, b]) {
    const old = pieceById(f.house);
    if (f.mode === 'inside' && old) { const [ox, oz] = doorOf(old); f.x = ox; f.z = oz; f.isl = old.isl; f.mode = 'idle'; }
    f.house = p.id; f.married = true; f.visitUntil = 0;
    if (f.isl === p.isl && f.mode !== 'cross' && f.mode !== 'toBridge') { const [dx, dz] = doorOf(p); f.mode = 'home'; f.tx = dx; f.tz = dz; f.route = null; }
  }
  const [dx, dz] = doorOf(p), y = islandLift(p.isl);
  fxSpark(dx, y + 0.8, dz, '#ffc2d6', 18); fxLabel(dx, y + 1.3, dz, 'A wedding!');
  toast(`A ${na} and a ${nb} married and moved into a new home: the ${name} family.`, 5); sfx.birth();
  maybeAdopt(p.id);
  events.push({ type: 'wedding', house: p.id });
}

// ---- The simulation step --------------------------------------------------------------------------
/** One fixed step of play. */
function playStep(dt) {
  keysStep(dt);
  state.t += dt;
  const show = state.nightShow && sun().night < 0.9;
  state.dayT = (state.dayT + dt / tune.dayLength * (show ? 7 : 1)) % 1;
  if (state.nightShow && sun().night >= 0.9) state.nightShow = false;
  weatherStep(dt);
  if (state.mode === 'voyage') voyageStep(dt);
  else {
    piecesStep(dt); familiesStep(dt); folkStep(dt); petStep(dt); fluffStep(dt); smokeStep(dt); unlockStep(); questStep(); tapsStep();
  }
  taps.length = 0;
  for (const s of state.islands) if (s.discovered && s.reveal < 1) s.reveal = Math.min(1, s.reveal + dt / 2.5);
  state.toasts = state.toasts.filter(t => t.until > state.t);
  hintStep(); fxStep(dt); camStep(dt); musicStep();
}

function keysStep(dt) {
  if (state.modal) { if (pressed('Enter') || pressed('Space')) closeModal(); return; }
  const c = state.cam;
  const L = down.has('ArrowLeft') || down.has('KeyA'), Rt = down.has('ArrowRight') || down.has('KeyD');
  const U = down.has('ArrowUp') || down.has('KeyW'), D = down.has('ArrowDown') || down.has('KeyS');
  if (state.mode === 'voyage') {
    const v = state.voyage;
    if (L) v.tx -= tune.voyageSteer * dt; if (Rt) v.tx += tune.voyageSteer * dt;
    v.tx = Math.max(-tune.voyageWidth, Math.min(tune.voyageWidth, v.tx));
    return;
  }
  if (pressed('BracketLeft')) musicVolumeBy(-0.1);
  if (pressed('BracketRight')) musicVolumeBy(0.1);
  if (pressed('KeyV')) cycleView();
  if (pressed('Tab')) nextFollow();
  if (pressed('Enter') && state.questReady) startVoyage();
  if (state.view !== 'builder') return;
  const sp = tune.camPanSpeed * dt * (c.dist / 20), fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw);
  if (U) { c.tx += fx * sp; c.tz += fz * sp; } if (D) { c.tx -= fx * sp; c.tz -= fz * sp; }
  if (Rt) { c.tx += rx * sp; c.tz += rz * sp; } if (L) { c.tx -= rx * sp; c.tz -= rz * sp; }
  if (down.has('KeyQ')) c.yaw += tune.camTurnSpeed * dt; if (down.has('KeyE')) c.yaw -= tune.camTurnSpeed * dt;
  if (down.has('Equal') || down.has('NumpadAdd')) zoom(Math.exp(-dt * 1.5)); if (down.has('Minus') || down.has('NumpadSubtract')) zoom(Math.exp(dt * 1.5));
  clampCam();
  const avail = TOOL_ORDER.filter(t => state.unlocked[t] && toolInView(t));
  for (let k = 1; k <= 9; k++) if (pressed('Digit' + k) && avail[k - 1]) selectTool(avail[k - 1]);
  if (pressed('Digit0') && avail[9]) selectTool(avail[9]);
  if (pressed('KeyX')) selectTool('tidy');
  if (pressed('KeyT')) selectTool('turn');
  if (pressed('KeyR')) rotatePiece();
}
function zoom(f) { const c = state.cam; c.dist = Math.max(tune.camZoomMin, Math.min(tune.camZoomMax, c.dist * f)); }
/** Keeps the camera's target near a discovered island, so it never wanders into the mist. */
function clampCam() {
  const c = state.cam, anchors = [];
  for (const isl of ISLANDS) if (state.islands[isl.id].discovered) anchors.push([isl.cx, isl.cz, isl.r + 4.5]);
  for (const b of state.bridges) anchors.push([(b.i1 + b.i2) / 2 + 0.5, (b.j1 + b.j2) / 2 + 0.5, bridgeLen(b) / 2 + 4]); // bridges lead the camera across
  let best = anchors[0], bo = 1e9;
  for (const a of anchors) { const o = Math.hypot(c.tx - a[0], c.tz - a[1]) - a[2]; if (o < bo) { bo = o; best = a; } }
  if (bo > 0) { const d = Math.hypot(c.tx - best[0], c.tz - best[1]); c.tx = best[0] + (c.tx - best[0]) * best[2] / d; c.tz = best[1] + (c.tz - best[1]) * best[2] / d; }
}
function selectTool(t) {
  if (!state.unlocked[t]) return;
  state.tool = t; state.bridgeStart = null; sfx.ui();
  const cat = TOOL_CATS.find(c => c.tools.includes(t)); if (cat) state.cat = cat.id;
  if (PIECES[t] && PIECES[t].about) toast(PIECES[t].about, 4);
  if (t === 'turn') toast('Tap anything you built to turn it.', 3);
}
/** Is this tool on the toolbar now? Look, Turn and Tidy always are; pieces show under their category's tab. */
function toolInView(t) { const c = TOOL_CATS.find(c => c.tools.includes(t)); return !c || c.id === state.cat; }
/** Opens a toolbar category; picks its first unlocked piece when the current tool is in another one. */
function selectCat(id) {
  state.cat = id; sfx.ui();
  if (!toolInView(state.tool)) { const c = TOOL_CATS.find(c => c.id === id), t = c.tools.find(t => state.unlocked[t]); state.tool = t || 'look'; state.bridgeStart = null; if (t && PIECES[t].about) toast(PIECES[t].about, 4); }
}
/** Turns the piece about to be built a quarter turn (R, right-click, or the Rotate button). */
function rotatePiece() { state.rot = (state.rot + Math.PI / 2) % (Math.PI * 2); sfx.ui(); }
/** The next song you have found. */
function nextTrack() {
  const has = Object.keys(TRACKS).filter(k => k === 'home' || state.relics[k]);
  state.track = has[(has.indexOf(state.track) + 1) % has.length]; resetMusic();
  toast(has.length > 1 ? 'Music: ' + TRACKS[state.track].name : 'Find the Wind Bell for a new song.', 3);
}
/** Music louder or quieter by a step ([ and ] keys). */
function musicVolumeBy(d) {
  const c = CONFIG.musicVolume; c.value = Math.max(c.min, Math.min(c.max, Math.round((c.value + d) * 100) / 100));
  const el = document.getElementById('mpmusic'); if (el) el.value = c.value;
  toast(`Music volume ${Math.round(c.value * 100)}%`, 1.5);
}
function cycleView() { const v = ['builder', 'stroll', 'postcard']; setView(v[(v.indexOf(state.view) + 1) % 3]); }
function setView(v) {
  state.view = v; sfx.ui();
  if (v === 'stroll') { if (!state.folk.some(f => f.id === state.followId)) nextFollow(); if (!state.folk.length) toast('No sky-folk yet: the camera strolls the island alone.'); }
  if (v === 'postcard') toast('Postcard view: tap Back to build again.', 3);
}
function nextFollow() {
  const out = state.folk.filter(f => f.mode !== 'inside'), list = out.length ? out : state.folk;
  if (!list.length) return;
  const k = list.findIndex(f => f.id === state.followId);
  state.followId = list[(k + 1) % list.length].id;
  const f = state.folk.find(x => x.id === state.followId), fam = state.families[f.house];
  if (fam) toast(`Strolling with ${f.kind === 'child' ? 'a little one of' : 'one of'} the ${fam.name} family.`, 3);
}

function piecesStep(dt) {
  const boost = state.weather.kind !== 'clear' && state.weather.kind !== 'snow' ? tune.rainGrowBoost : 1;
  let changed = false;
  for (const p of state.pieces) {
    const def = PIECES[p.type];
    const bt = p.type === 'house' || def.utility ? tune.houseBuildTime : def.kind === 'living' ? 0.4 : tune.smallBuildTime;
    if (p.done < 1) p.done = Math.min(1, (state.t - p.t0) / bt);
    if (def.kind === 'living' && p.grow < 1) {
      p.grow = Math.min(1, p.grow + dt / tune[def.grow] * boost);
      if (p.grow >= 1) { changed = true; sfx.grow(); fxSpark(p.i + 0.5, ISLANDS[p.isl].y + 0.8, p.j + 0.5, '#fff3b0', 6);
        if (p.type === 'meadow') toast('A fluffkin wandered into the meadow.'); }
    }
  }
  if (changed) recount();
}

function familiesStep(dt) {
  for (const p of state.pieces) {
    if (p.type !== 'house' || p.done < 1 || state.families[p.id] || state.puffs.some(u => u.house === p.id)) continue;
    if (!hasGreen(p)) { p.readyAt = -1; continue; }
    if (p.readyAt < 0) p.readyAt = state.t;
    // Grown-up children from two different families marry and take a ready home first.
    const pair = state.t - p.readyAt >= 1 && couple();
    if (pair) { wed(pair, p); continue; }
    if (state.t - p.readyAt >= tune.moveInDelay + (singles().length ? tune.marryDelay : 0)) {
      const [dx, dz] = doorOf(p);
      state.puffs.push({ id: state.nextId++, house: p.id, t: 0, x: dx, z: dz });
      sfx.arrive();
    }
  }
  for (const u of state.puffs) u.t += dt;
  for (const u of state.puffs.filter(u => u.t >= tune.arriveTime)) {
    const p = pieceById(u.house);
    state.puffs = state.puffs.filter(x => x !== u);
    if (!p) continue;
    const name = pickName();
    state.families[p.id] = { name, moved: state.t, kids: 0, nextChild: state.t + childGap() };
    for (let k = 0; k < 2; k++) spawnFolk(p, 'adult', u.x + (k ? 0.15 : -0.15), u.z, 'enter');
    toast(`The ${name} family moved in!`); sfx.moveIn();
    maybeAdopt(p.id);
    fxLabel(u.x, ISLANDS[p.isl].y + 1.2, u.z, '+2 sky-folk');
    events.push({ type: 'movein', house: p.id });
  }
  for (const p of state.pieces) {
    const f = state.families[p.id];
    if (!f || f.kids >= tune.maxChildren || state.t < f.nextChild || isNight()) continue;
    f.kids++; f.nextChild = state.t + childGap();
    const [dx, dz] = doorOf(p); spawnFolk(p, 'child', dx, dz, 'idle');
    toast(`A little one is born to the ${f.name} family.`); sfx.birth();
    fxSpark(dx, ISLANDS[p.isl].y + 0.6, dz, '#ffd3e0', 10); fxLabel(dx, ISLANDS[p.isl].y + 1.1, dz, '+1');
  }
}
/** A family name made fresh for this game: two parts joined (Moonwhistle, Fernbottom), now and then one old word alone. */
function pickName() {
  const R = worldRand(state.nameSeed + state.usedNames.length * 7919), P = NAME_PARTS, at = a => a[Math.floor(R() * a.length)];
  let n = '';
  for (let k = 0; k < 20 && (!n || state.usedNames.includes(n)); k++) n = R() < 0.2 ? at(P.alone) : at(P.first) + at(P.last);
  if (state.usedNames.includes(n)) n += ' II';
  state.usedNames.push(n); return n;
}
/** Is a finished building of this type standing anywhere in the sky? (Optionally on one island.) */
function hasUtility(type, isl) { return state.pieces.some(q => q.type === type && q.done >= 1 && (isl === undefined || q.isl === isl)); }
/** Seconds until a family's next little one: sooner while a Healing House stands. */
function childGap() { return tune.childTime * (0.8 + rng() * 0.4) / (hasUtility('healer') ? tune.healerChildBoost : 1); }
/** An idle sky-folk may walk to the Magic School (little ones) or the Healing House (grown-ups) on their island. */
function visitUtility(f) {
  const q = state.pieces.find(q => q.type === (f.kind === 'child' ? 'school' : 'healer') && q.done >= 1 && q.isl === f.isl);
  if (!q || rng() >= tune.utilityVisitChance) return false;
  const [ux, uz] = doorOf(q), tx = ux + Math.sin(q.rot) * 0.3 + (rng() - 0.5) * 0.5, tz = uz + Math.cos(q.rot) * 0.3 + (rng() - 0.5) * 0.5;
  if (!freeCell(Math.floor(tx), Math.floor(tz), f.isl) || !clearLine(f.x, f.z, tx, tz, f.isl)) return false;
  f.tx = tx; f.tz = tz; f.mode = 'walk'; return true;
}
function spawnFolk(p, kind, x, z, mode) {
  const id = state.nextId++;
  state.folk.push({ id, house: p.id, isl: p.isl, kind, x, z, tx: x, tz: z, h: rng() * 6.28, mode: mode === 'enter' ? 'home' : 'idle', timer: state.t + 1, ci: Math.floor(rng() * 7), walk: 0, y: islandLift(p.isl), bridge: 0, route: null, born: state.t });
  if (!state.followId) state.followId = id;
}

function freeCell(i, j, isl) {
  if (landOf(i, j) !== isl) return false;
  const p = pieceAt(i, j), ter = terrainAt(i, j);
  if (ter) return false; // mountains and rivers: only a bridge crosses them
  return !blocksWalk(p) && !String(state.occ[K(i, j)] || '').startsWith('f');
}
function clearLine(x0, z0, x1, z1, isl) {
  const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.25);
  for (let k = 1; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; if (!freeCell(Math.floor(x), Math.floor(z), isl) && k < n - 1) return false; }
  return true;
}
const _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _pt = new THREE.Vector3();
/**
 * Sky-folk: wander near home, stop to chat, sometimes set off over a bridge to visit another island
 * (or cross a river), and find their way home over the bridges at night, in a storm, or when the
 * visit is over.
 */
function folkStep(dt) {
  const thunder = state.weather.kind === 'thunder' && state.weather.amt > 0.3, wantHome = isNight() || thunder;
  for (const f of state.folk) {
    const home = pieceById(f.house); if (!home) continue;
    const [dx, dz] = doorOf(home);
    if (f.kind === 'child') { // a child grows up, faster while a Magic School stands
      f.age = (f.age ?? (state.t - (f.born ?? state.t))) + dt * (hasUtility('school') ? tune.schoolGrowBoost : 1);
      if (f.age >= tune.growUpTime) {
        f.kind = 'adult'; f.grown = true;
        const fam = state.families[f.house]; if (fam) toast(`A little one of the ${fam.name} family has grown up.`, 3);
      }
    }
    if (f.mode === 'inside') {
      if (!wantHome && state.t >= f.timer) { f.mode = 'idle'; f.x = dx; f.z = dz; f.isl = home.isl; f.timer = state.t + 0.5 + rng() * 2; }
      f.y = islandLift(f.isl); continue;
    }
    const away = f.isl !== home.isl;
    if (away && (wantHome || state.t > (f.visitUntil || 0)) && (f.mode === 'idle' || f.mode === 'walk')) headHome(f, home);
    if (!away && wantHome && (f.mode === 'idle' || f.mode === 'walk' || f.mode === 'toBridge')) { f.mode = 'home'; f.tx = dx; f.tz = dz; f.route = null; f.bridge = 0; }
    if (f.mode === 'idle' && state.t >= f.timer) {
      if (!(!wantHome && !away && rng() < tune.crossChance && setOff(f)) && !(!wantHome && visitUtility(f))) {
        const ci = away ? f.ai : home.i, cj = away ? f.aj : home.j;
        for (let k = 0; k < 6; k++) {
          const R = tune.wanderRange, i = ci + Math.round((rng() * 2 - 1) * R), j = cj + Math.round((rng() * 2 - 1) * R);
          const tx = i + 0.2 + rng() * 0.6, tz = j + 0.2 + rng() * 0.6;
          if (freeCell(i, j, f.isl) && clearLine(f.x, f.z, tx, tz, f.isl)) { f.tx = tx; f.tz = tz; f.mode = 'walk'; break; }
        }
        if (f.mode === 'idle') f.timer = state.t + 1;
      }
    }
    const sp = tune.folkSpeed * (f.kind === 'child' ? 1.25 : 1) * dt;
    if (f.mode === 'cross') {
      const b = bridgeById(f.bridge);
      if (!b) { floatHome(f, home); continue; }
      f.u = Math.min(1, f.u + sp / Math.max(1, bridgeLen(b)));
      bridgeEnds(b, _p1, _p2); bridgeAt(_p1, _p2, f.dir > 0 ? f.u : 1 - f.u, _pt, bridgeHump(b), b.ta ?? 0, b.tb ?? 1);
      f.x = _pt.x; f.z = _pt.z; f.y = _pt.y + 0.04; f.walk += dt;
      f.h = f.dir > 0 ? Math.atan2(_p2.x - _p1.x, _p2.z - _p1.z) : Math.atan2(_p1.x - _p2.x, _p1.z - _p2.z);
      if (f.u >= 1) arriveOver(f, b, home);
      continue;
    }
    if (f.mode === 'walk' || f.mode === 'home' || f.mode === 'toBridge') {
      const ddx = f.tx - f.x, ddz = f.tz - f.z, d = Math.hypot(ddx, ddz);
      if (d < sp + 0.01) {
        f.x = f.tx; f.z = f.tz; f.walk = 0;
        if (f.mode === 'home') { if (Math.hypot(f.x - dx, f.z - dz) < 0.05) { f.mode = 'inside'; f.timer = state.t + 2 + rng() * 3; } else { f.tx = dx; f.tz = dz; } }
        else if (f.mode === 'toBridge') { if (bridgeById(f.bridge)) { f.mode = 'cross'; f.u = 0; } else { f.mode = 'idle'; f.bridge = 0; } }
        else { f.mode = 'idle'; f.timer = state.t + tune.folkIdleMin + rng() * (tune.folkIdleMax - tune.folkIdleMin); }
      } else {
        f.x += ddx / d * sp; f.z += ddz / d * sp; f.walk += dt;
        const th = Math.atan2(ddx, ddz); let dh = th - f.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); f.h += dh * Math.min(1, dt * 8);
      }
    }
    f.y = islandLift(f.isl);
  }
  // Two sky-folk standing close stop for a chat: they turn to each other and a bubble shows.
  for (const f of state.folk) f.chat = false;
  for (const a of state.folk) {
    if (a.mode !== 'idle' || a.chat) continue;
    const b = state.folk.find(o => o !== a && o.mode === 'idle' && !o.chat && o.isl === a.isl && Math.hypot(o.x - a.x, o.z - a.z) < 1.1);
    if (!b) continue;
    a.chat = b.chat = true; a.h = Math.atan2(b.x - a.x, b.z - a.z); b.h = a.h + Math.PI;
  }
}
/** Sets a sky-folk off over a random bridge that has an end on their island. */
function setOff(f) {
  const opts = state.bridges.filter(b => b.a === f.isl || b.b === f.isl);
  return opts.length ? goToBridge(f, opts[Math.floor(rng() * opts.length)]) : false;
}
/** Walk to the end of bridge b on this island, then cross it. False when the way there is blocked. */
function goToBridge(f, b) {
  const ends = [];
  if (b.a === f.isl) ends.push({ dir: 1, i: b.i1, j: b.j1 });
  if (b.b === f.isl) ends.push({ dir: -1, i: b.i2, j: b.j2 });
  if (!ends.length) return false;
  ends.sort((p, q) => Math.hypot(p.i + 0.5 - f.x, p.j + 0.5 - f.z) - Math.hypot(q.i + 0.5 - f.x, q.j + 0.5 - f.z));
  const e = ends[0], tx = e.i + 0.5, tz = e.j + 0.5;
  if (!clearLine(f.x, f.z, tx, tz, f.isl)) return false;
  f.mode = 'toBridge'; f.bridge = b.id; f.dir = e.dir; f.tx = tx; f.tz = tz; return true;
}
/** Off the far end of a bridge: on to the next bridge home, or a visit on this island. */
function arriveOver(f, b, home) {
  const [ei, ej] = f.dir > 0 ? [b.i2, b.j2] : [b.i1, b.j1];
  f.isl = f.dir > 0 ? b.b : b.a; f.x = ei + 0.5; f.z = ej + 0.5; f.ai = ei; f.aj = ej; f.bridge = 0;
  f.mode = 'idle'; f.timer = state.t + 0.3; f.y = islandLift(f.isl);
  if (f.route && f.route.length) { const nb = bridgeById(f.route.shift()); if (!nb || !goToBridge(f, nb)) floatHome(f, home); return; }
  f.route = null;
  if (f.isl !== home.isl) {
    f.visitUntil = state.t + tune.visitMin + rng() * (tune.visitMax - tune.visitMin);
    const fam = state.families[f.house];
    if (fam && f.kind === 'adult' && state.t - (state.lastVisitToast || -99) > 25) { state.lastVisitToast = state.t; toast(`One of the ${fam.name} family is visiting ${ISLANDS[f.isl].name}.`, 3); }
    events.push({ type: 'visit', island: f.isl });
  }
}
/** Bridges from one island to another, in order, or null when no bridges join them. */
function routeHome(from, to) {
  const prev = new Map([[from, null]]), q = [from];
  while (q.length) {
    const c = q.shift(); if (c === to) break;
    for (const b of state.bridges) {
      if (b.a === b.b) continue;
      const n = b.a === c ? b.b : b.b === c ? b.a : -1;
      if (n >= 0 && !prev.has(n)) { prev.set(n, { from: c, bridge: b.id }); q.push(n); }
    }
  }
  if (!prev.has(to)) return null;
  const out = []; for (let c = to; prev.get(c); c = prev.get(c).from) out.unshift(prev.get(c).bridge);
  return out;
}
function headHome(f, home) {
  const route = routeHome(f.isl, home.isl);
  if (!route || !route.length) { floatHome(f, home); return; }
  const first = bridgeById(route.shift()); f.route = route;
  if (!goToBridge(f, first)) floatHome(f, home);
}
/** No way back over the bridges: a little cloud carries them home. */
function floatHome(f, home) {
  fxPuff(f.x, f.y || islandLift(f.isl), f.z, '#fff6ee');
  const [dx, dz] = doorOf(home); f.isl = home.isl; f.x = dx; f.z = dz; f.mode = 'inside'; f.timer = state.t + 2; f.route = null; f.bridge = 0; f.y = islandLift(home.isl);
}
// ---- Pets: some families keep a dog, a cat, a bunny or a little sky-fairy ---------------------------
const PET_KINDS = {
  dog: { a: 'a dog', w: 0.3 }, cat: { a: 'a cat', w: 0.3 }, bunny: { a: 'a bunny', w: 0.2 }, fairy: { a: 'a sky-fairy', w: 0.2 },
};
const PET_NAMES = ['Biscuit', 'Mochi', 'Pip', 'Tumble', 'Clover', 'Bean', 'Nimbus', 'Sprout', 'Wisp', 'Pudding', 'Momo', 'Pebble', 'Tansy', 'Button', 'Fig', 'Glimmer', 'Dot', 'Puff', 'Hazel', 'Kiwi'];
/** A new family may adopt a pet (petChance), owned by one of its grown-ups. */
function maybeAdopt(houseId) {
  if (rng() >= tune.petChance) return;
  const adults = state.folk.filter(f => f.house === houseId && f.kind === 'adult'); if (!adults.length) return;
  let r = rng(), kind = 'dog'; for (const [k, v] of Object.entries(PET_KINDS)) { if (r < v.w) { kind = k; break; } r -= v.w; }
  const free = PET_NAMES.filter(n => !state.petNames.includes(n)), name = free.length ? free[Math.floor(rng() * free.length)] : PET_NAMES[Math.floor(rng() * PET_NAMES.length)];
  const o = adults[Math.floor(rng() * adults.length)];
  state.petNames.push(name);
  state.pets.push({ id: state.nextId++, kind, name, house: houseId, owner: o.id, x: o.x, z: o.z + 0.3, y: o.y, h: 0, walk: 0, ox: 0.4, oz: 0.3, next: 0, inside: false, ci: Math.floor(rng() * 4) });
  toast(`The ${state.families[houseId].name} family adopted ${PET_KINDS[kind].a} named ${name}.`, 4);
  events.push({ type: 'pet', kind });
}
/** Pets trot after their owner, potter about when the owner stops, and go indoors with them. */
function petStep(dt) {
  for (const p of state.pets) {
    let o = state.folk.find(f => f.id === p.owner);
    if (!o || o.house !== p.house) { o = state.folk.find(f => f.house === p.house); if (o) p.owner = o.id; else continue; }
    p.inside = o.mode === 'inside';
    if (p.inside) { p.x = o.x; p.z = o.z; p.y = o.y; p.walk = 0; continue; }
    if (state.t >= p.next) { p.ox = (rng() - 0.5) * 1.3; p.oz = (rng() - 0.5) * 1.3; p.next = state.t + 2 + rng() * 3; }
    const moving = o.mode === 'walk' || o.mode === 'home' || o.mode === 'toBridge' || o.mode === 'cross';
    const tx = moving ? o.x - Math.sin(o.h) * 0.4 + Math.cos(o.h) * 0.22 : o.x + p.ox;
    const tz = moving ? o.z - Math.cos(o.h) * 0.4 - Math.sin(o.h) * 0.22 : o.z + p.oz;
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d > 5) { p.x = o.x; p.z = o.z; } // caught up after a cloud ride
    else if (d > 0.06) {
      const sp = tune.folkSpeed * (d > 1.2 ? 2.2 : 1.3) * dt, k = Math.min(1, sp / d);
      p.x += dx * k; p.z += dz * k; p.walk += dt;
      const th = Math.atan2(dx, dz); let dh = th - p.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); p.h += dh * Math.min(1, dt * 10);
    } else p.walk = 0;
    p.y += (o.y - p.y) * Math.min(1, dt * 6);
  }
}
/** A wisp of smoke now and then from the chimney of a home where someone is in. */
function smokeStep(dt) {
  if (!R3) return;
  for (const p of state.pieces) {
    if (p.type !== 'house' || !state.families[p.id] || rng() >= dt * tune.smokeRate) continue;
    if (!state.folk.some(f => f.house === p.id && f.mode === 'inside') && !isNight()) continue;
    const m = vis.pieces.get(p.id); if (!m || !m.userData.chimney) continue;
    const c = m.userData.chimney.clone().applyMatrix4(m.matrixWorld);
    fxSmoke(c.x, c.y, c.z);
  }
}
function fluffStep(dt) {
  for (const p of state.pieces) if (p.type === 'meadow' && p.grow >= 1 && !state.fluff.some(f => f.meadow === p.id))
    state.fluff.push({ id: state.nextId++, meadow: p.id, isl: p.isl, x: p.i + 0.5, z: p.j + 0.5, tx: p.i + 0.5, tz: p.j + 0.5, h: 0, timer: state.t + 2, walk: 0 });
  for (const f of state.fluff) {
    const p = pieceById(f.meadow); if (!p) continue;
    const stuck = !fluffOk(f.x, f.z, f.isl); // something was built where it stood: let it walk out
    if (state.t >= f.timer) { // pick somewhere near its meadow it can actually reach in a straight line
      f.timer = state.t + 4 + rng() * 6; f.tx = f.x; f.tz = f.z;
      for (let k = 0; k < 8; k++) {
        const tx = p.i + 0.5 + (rng() - 0.5) * 2.2, tz = p.j + 0.5 + (rng() - 0.5) * 2.2;
        if (fluffOk(tx, tz, f.isl) && fluffLine(f.x, f.z, tx, tz, f.isl)) { f.tx = tx; f.tz = tz; break; }
      }
      if (stuck) { f.tx = p.i + 0.5; f.tz = p.j + 0.5; }
    }
    const ddx = f.tx - f.x, ddz = f.tz - f.z, d = Math.hypot(ddx, ddz), sp = 0.3 * dt;
    if (d > sp) {
      const nx = f.x + ddx / d * sp, nz = f.z + ddz / d * sp;
      if (stuck || fluffOk(nx, nz, f.isl)) { f.x = nx; f.z = nz; }
      else if (fluffOk(nx, f.z, f.isl)) f.x = nx; // slide along whatever is in the way
      else if (fluffOk(f.x, nz, f.isl)) f.z = nz;
      else { f.tx = f.x; f.tz = f.z; f.timer = Math.min(f.timer, state.t + 0.5); } // blocked: think again
      f.h = Math.atan2(ddx, ddz); f.walk += dt;
    } else f.walk = 0;
    // a soft nudge apart from other fluffkins, sky-folk and pets, never into anything solid
    for (const o of [...state.fluff, ...state.folk, ...state.pets]) {
      if (o === f || o.isl !== f.isl || o.mode === 'inside' || o.inside) continue;
      const ox = f.x - o.x, oz = f.z - o.z, od = Math.hypot(ox, oz), min = state.fluff.includes(o) ? 0.38 : 0.3;
      if (od > 0.001 && od < min) { const px = f.x + ox / od * (min - od) * 0.5, pz = f.z + oz / od * (min - od) * 0.5; if (fluffOk(px, pz, f.isl)) { f.x = px; f.z = pz; } }
    }
  }
}
const FLUFF_R = 0.17; // a fluffkin's body: it keeps this far from anything solid
/** Can a fluffkin stand here? Its whole body must be on open, walkable ground of its island. */
function fluffOk(x, z, isl) {
  for (const [ox, oz] of [[0, 0], [FLUFF_R, 0], [-FLUFF_R, 0], [0, FLUFF_R], [0, -FLUFF_R]]) if (!freeCell(Math.floor(x + ox), Math.floor(z + oz), isl)) return false;
  return true;
}
/** Is the straight way from one spot to another open for a fluffkin all along? */
function fluffLine(x0, z0, x1, z1, isl) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.15));
  for (let k = 1; k <= n; k++) if (!fluffOk(x0 + (x1 - x0) * k / n, z0 + (z1 - z0) * k / n, isl)) return false;
  return true;
}
function unlockStep() {
  for (const t of ['lantern', 'bridge', 'meadow', 'school', 'healer']) if (!state.unlocked[t] && pop() >= tune[PIECES[t].unlockPop]) {
    state.unlocked[t] = 1; toast(`New piece: ${PIECES[t].name}${PIECES[t].about ? '. ' + PIECES[t].about.split(': ')[1] : ''}`, 6); sfx.unlock();
  }
}
function questProgress() {
  const q = QUESTS[state.quest]; if (!q) return null;
  return { q, pop: pop(), popNeed: tune[q.pop], task: state.counts[q.task], taskNeed: tune[q.n] };
}
function questStep() {
  const g = questProgress();
  if (!g || state.questReady) return;
  if (g.pop >= g.popNeed && g.task >= g.taskNeed) {
    state.questReady = true; toast(g.q.sight, 6); sfx.ready();
  }
}
function hintStep() {
  const c = state.counts;
  let h = '';
  if (state.mode === 'voyage') h = '';
  else if (state.tool === 'bridge' && state.bridgePreview) h = state.bridgePreview;
  else if (!c.houses) h = state.tool === 'house' ? 'Tap the island to build a home.' : 'Pick the House below, then tap the island to build a home.';
  else if (!pop() && !state.puffs.length && !state.pieces.some(p => p.type === 'house' && hasGreen(p))) h = 'Homes feel ready with something green nearby. Plant a Tree beside your house.';
  else if (!pop()) h = 'Look up... someone is coming.';
  else if (state.questReady) h = 'The mist is parting. Tap Set sail!';
  else if (state.quest === 0 && pop() < 4) h = 'Every ready home draws a new family. The quest above shows what the mist is waiting for.';
  else if (state.found.length === 1 && !state.islands[ISLANDS.find(i => i.name === state.found[0]).id].secretFound) h = 'Something shimmers on the new island. Look closely and tap it.';
  state.hint = h;
}

// ---- Taps on the world ----------------------------------------------------------------------------
function tapsStep() {
  for (const tp of taps) {
    if (state.modal) return;
    if (state.view === 'stroll') { nextFollow(); continue; }
    if (state.view !== 'builder') continue;
    const ray = screenRay(tp.x, tp.y);
    if (!ray) continue;
    if (trySecret(ray)) continue;
    const hit = pickCell(ray);
    if (!hit) continue;
    const there = pieceAt(hit.i, hit.j), ter = terrainAt(hit.i, hit.j);
    if (state.tool === 'tidy') tidy(hit);
    else if (state.tool === 'turn') turnPiece(hit);
    else if (state.tool === 'bridge') bridgeTap(hit);
    else if (!there && ter && state.tool !== 'look') {
      toast(ter.kind === 'mountain' ? 'Nothing can be built on the mountain.' : ter.kind === 'lake' ? 'A still lake lies here. Only a bridge can cross it.' : 'The river flows here. Only a bridge can cross it.', 2.5);
    } else if (state.tool === 'look' || (there && canPlace(state.tool, hit) < 0)) {
      if (there && state.families[there.id]) { toast(familyLine(there)); sfx.ui(); }
      else if (there && there.type === 'house') toast(there.done < 1 ? 'Being built...' : hasGreen(there) ? 'Ready: a family is on the way.' : 'Empty. It needs something green nearby.');
      else if (there && PIECES[there.type].kind === 'living') toast(there.grow < 1 ? `Growing: ${Math.round(there.grow * 100)}%` : 'Fully grown.');
      else if (state.tool === 'look') toast('Pick a piece below to build.', 2);
    } else place(state.tool, hit);
  }
}
/** Bridge tool: the first tap sets where it starts, the second where it ends; the rest fills in. */
function bridgeTap(hit) {
  const st = state.bridgeStart;
  if (!st) {
    const e = bridgeEndOk(hit); if (e) { toast(e, 2.5); return; }
    state.bridgeStart = { i: hit.i, j: hit.j, isl: hit.isl }; sfx.ui();
    toast('Now tap where the bridge should end: on another island, or across a river.', 5);
    return;
  }
  if (st.i === hit.i && st.j === hit.j) { state.bridgeStart = null; toast('Bridge cancelled.', 1.5); return; }
  const why = bridgeProblem(st, hit);
  if (why) { toast(why, 3); return; }
  buildBridge(st, hit); state.bridgeStart = null;
}
function trySecret(ray) {
  for (const isl of ISLANDS) {
    const s = state.islands[isl.id];
    if (!s.discovered || s.secretFound || s.reveal < 1) continue;
    if (isl.id === 0 && !pop()) continue;
    const t = (islandLift(isl.id) + 0.3 - ray.o.y) / ray.d.y; if (t <= 0) continue;
    const x = ray.o.x + ray.d.x * t, z = ray.o.z + ray.d.z * t;
    const [ci, cj] = isl.secretCell;
    if (Math.hypot(x - ci - 0.5, z - cj - 0.5) < tune.secretRadius) { foundSecret(isl); return true; }
  }
  return false;
}
function foundSecret(isl) {
  const s = state.islands[isl.id]; s.secretFound = true;
  state.unlocked[isl.secret.bonus] = 1; sfx.secret();
  fxSpark(isl.secretCell[0] + 0.5, isl.y + 0.5, isl.secretCell[1] + 0.5, '#cfe0ff', 16);
  openModal({ kind: 'secret', island: isl.id });
  events.push({ type: 'secret', island: isl.id });
}
/** The land cell of a found island under a ray, tested against each island at its drifting height. */
function pickCell(ray) {
  let best = null;
  for (const isl of ISLANDS) {
    if (!state.islands[isl.id].discovered) continue;
    const y = islandLift(isl.id), t = (y - ray.o.y) / ray.d.y; if (t <= 0) continue;
    const i = Math.floor(ray.o.x + ray.d.x * t), j = Math.floor(ray.o.z + ray.d.z * t);
    if (landOf(i, j) === isl.id && (!best || t < best.t)) best = { i, j, t, y, kind: 'land', isl: isl.id, x: ray.o.x + ray.d.x * t, z: ray.o.z + ray.d.z * t };
  }
  return best;
}

// ---- Quests, the voyage and discoveries -------------------------------------------------------------
function startVoyage() {
  if (!state.questReady || state.mode === 'voyage') return;
  const q = QUESTS[state.quest];
  state.mode = 'voyage';
  state.voyage = { x: 0, tx: 0, z: 0, t: 0, caught: 0, need: tune.voyageMotes, next: 0.8, motes: [], done: -1, island: q.island, bob: 0 };
  sfx.sail(); events.push({ type: 'voyage', island: q.island });
}
function voyageStep(dt) {
  const v = state.voyage;
  v.t += dt; v.z -= tune.voyageSpeed * dt;
  v.x += (v.tx - v.x) * Math.min(1, dt * 5);
  if (v.done < 0 && v.t >= v.next) {
    v.next += tune.moteEvery;
    v.motes.push({ id: state.nextId++, x: (rng() * 2 - 1) * tune.voyageWidth * 0.9, z: v.z - 55, ph: rng() * 6 });
  }
  for (const m of v.motes) m.x += Math.sin(v.t * 1.3 + m.ph) * dt * 0.6;
  for (const m of v.motes.slice()) {
    if (Math.abs(m.z - v.z) < tune.moteRadius && Math.abs(m.x - v.x) < tune.moteRadius && v.done < 0) {
      v.caught++; v.motes = v.motes.filter(x => x !== m); sfx.mote(v.caught);
      if (v.caught >= v.need) { v.done = v.t; sfx.discover(); }
    } else if (m.z > v.z + 6) v.motes = v.motes.filter(x => x !== m);
  }
  if (v.done >= 0 && v.t - v.done > 2.4) finishVoyage();
}
function finishVoyage() {
  const id = state.voyage.island, isl = ISLANDS[id];
  state.mode = 'build'; state.voyage = null;
  state.islands[id].discovered = true; state.islands[id].reveal = 0;
  state.quest++; state.questReady = false; state.found.push(isl.name);
  state.gained = 'Found: ' + state.found.join(', ');
  state.view = 'builder'; state.cam.tx = isl.cx; state.cam.tz = isl.cz; state.cam.dist = Math.max(state.cam.dist, 16);
  fxSpark(isl.cx, isl.y + 1, isl.cz, '#fff3b0', 30);
  openModal({ kind: 'story', island: id });
  events.push({ type: 'discover', island: id });
}
function openModal(m) { if (state.modal) state.modalQueue.push(m); else state.modal = m; }
function closeModal() {
  const m = state.modal; if (!m) return;
  state.modal = null; sfx.ui();
  if (m.kind === 'story') {
    const isl = ISLANDS[m.island];
    if (isl.relic && !state.relics[isl.relic.kind]) {
      state.relics[isl.relic.kind] = true; state.islands[isl.id].relicTaken = true;
      if (isl.relic.kind === 'bell') { state.track = 'bell'; resetMusic(); toast('New music: Song of the Wind Bell', 5); sfx.bell(); }
      if (isl.relic.kind === 'starlamp') { state.nightShow = true; toast('The Star-lamp is lit above Hearthrest. Watch the sky tonight...', 6); sfx.discover(); }
    }
    if (!state.ended && state.found.length >= ISLANDS.length - 1 && state.relics.starlamp) { state.ended = true; state.modalQueue.push({ kind: 'end' }); }
  }
  if (state.modalQueue.length) state.modal = state.modalQueue.shift();
}

// ---- Weather: rain, thunder, snow; never harmful -----------------------------------------------------
function weatherStep(dt) {
  const w = state.weather;
  if (w.kind === 'clear') {
    if (state.t >= w.next && state.mode !== 'voyage') {
      const kinds = ['rain', 'thunder', 'snow'];
      w.kind = w.count === 0 ? 'rain' : kinds[Math.floor(rng() * 3)]; w.count++; w.last = w.kind;
      w.until = state.t + tune.weatherLength;
      toast(w.kind === 'rain' ? 'Soft rain is falling: gardens and trees grow faster.' : w.kind === 'thunder' ? 'A thunderstorm rolls by. The sky-folk hurry home.' : 'Snow drifts down over the village.', 5);
    }
  } else if (state.t >= w.until) { w.last = w.kind; w.kind = 'clear'; w.next = state.t + tune.weatherEvery; }
  // Rain and snow build up and die away slowly: the drops thin out, then stop.
  if (w.kind === 'clear') w.amt = Math.max(0, w.amt - dt / tune.weatherFadeOut);
  else w.amt = Math.min(1, w.amt + dt / tune.weatherFadeIn);
  if (w.kind === 'thunder' && w.amt > 0.5 && rng() < dt * 0.22) { w.flash = 1; sfx.thunder(); }
  w.flash = Math.max(0, w.flash - dt * 2.5);
  w.snow = Math.max(0, Math.min(1, w.snow + (w.kind === 'snow' ? dt / 15 : -dt / 40)));
}

// =====================================================================================================
// ---- The 3D world --------------------------------------------------------------------------------
// =====================================================================================================
let R3 = null;
const vis = { springs: [], wild: new Map(), pets: new Map(), bridges: new Map(), falls: [], pieces: new Map(), folk: new Map(), fluff: new Map(), puffs: new Map(), motes: new Map(), fx: [], islands: [], hover: null, camPos: null, camLook: null, ghost: {}, strollH: 0 };

/** Creates the renderer, the sky, the cloud sea, the islands and the voyage scene. */
function initWorld() {
  const canvas = document.getElementById('world');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !CHEAP, powerPreference: 'high-performance' });
  GFX.high = loadQuality();
  renderer.setPixelRatio(pixelRatio());
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = tune.exposure;
  renderer.shadowMap.enabled = !CHEAP; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#f3d6cc', tune.fogDensity);
  const cam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 900);
  const hemi = new THREE.HemisphereLight('#fff1e6', '#b9a6d6', 1.4); scene.add(hemi);
  const dir = new THREE.DirectionalLight('#fff0dc', 2.2);
  dir.castShadow = !CHEAP; dir.shadow.mapSize.set(GFX.high ? 2048 : 1024, GFX.high ? 2048 : 1024);
  Object.assign(dir.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
  dir.shadow.bias = -0.0008; dir.shadow.normalBias = 0.02; dir.shadow.radius = 3; // soft edges
  scene.add(dir); scene.add(dir.target);
  // A cool lilac rim light from the far side, so shapes stand off the sky.
  const rim = new THREE.DirectionalLight('#b9a8ff', 0.6); scene.add(rim); scene.add(rim.target);
  // Sky dome with a gradient, stars, an aurora for the Star-lamp, and a sun glow.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, time: { value: 0 }, day: { value: 1 }, night: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: [
      'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 bot; uniform float time; uniform float day; uniform float night; varying vec3 vP;',
      'float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
      'float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),',
      '             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }',
      'float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 4; k++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }',
      'void main(){',
      '  float h = vP.y; vec3 c;',
      '  if (h > 0.0) { float t = pow(h, 0.5); c = t < 0.32 ? mix(hor, mid, t / 0.32) : mix(mid, top, (t - 0.32) / 0.68); }',
      '  else c = mix(hor, bot, pow(-h, 0.4));',
      // dreamy wisps of pink and lilac drifting slowly; at night, a soft nebula of rose and teal
      '  vec3 q = vP * 2.6 + vec3(time * 0.008, 0.0, time * 0.005);',
      '  float n = fbm(q + vec3(fbm(q * 1.7) * 1.6));',
      '  float band = smoothstep(0.42, 0.82, n) * smoothstep(-0.05, 0.22, h) * (1.0 - smoothstep(0.75, 1.0, h));',
      '  vec3 wisp = mix(vec3(1.0, 0.84, 0.93), vec3(0.82, 0.78, 1.0), fbm(q * 0.7 + 3.0));',
      '  vec3 neb = mix(vec3(0.85, 0.35, 0.75), vec3(0.3, 0.65, 0.85), fbm(q * 0.5 + 7.0));',
      '  c += band * (wisp * 0.22 * day + neb * 0.32 * night);',
      // a soft glow band along the horizon
      '  c += vec3(1.0, 0.86, 0.9) * exp(-abs(h) * 14.0) * 0.08 * day;',
      '  gl_FragColor = vec4(c, 1.0);',
      '#include <tonemapping_fragment>',
      '#include <colorspace_fragment>',
      '}'].join('\n'),
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
  const starGeo = new THREE.BufferGeometry(), sp = [], sc = [], R = mrand(5);
  for (let k = 0; k < 700; k++) {
    const a = R() * Math.PI * 2, y = 0.08 + R() * 0.92, r = Math.sqrt(1 - y * y);
    sp.push(Math.cos(a) * r * 450, y * 450, Math.sin(a) * r * 450);
    const c = new THREE.Color().setHSL(0.6 + R() * 0.2, 0.4, 0.85); sc.push(c.r, c.g, c.b);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); starGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  scene.add(stars);
  const lampStarGeo = new THREE.BufferGeometry(), lp = [], lc = [];
  for (let k = 0; k < 400; k++) {
    const a = R() * Math.PI * 2, y = 0.15 + R() * 0.85, r = Math.sqrt(1 - y * y);
    lp.push(Math.cos(a) * r * 440, y * 440, Math.sin(a) * r * 440);
    const c = new THREE.Color().setHSL([0.92, 0.5, 0.13, 0.75][k % 4], 0.8, 0.75); lc.push(c.r, c.g, c.b);
  }
  lampStarGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lampStarGeo.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
  const lampStars = new THREE.Points(lampStarGeo, new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  scene.add(lampStars);
  const aurora = new THREE.Group(), auroraMats = [];
  for (let k = 0; k < 3; k++) {
    const g = new THREE.PlaneGeometry(260, 60, 48, 1), col = [], p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const top = p.getY(i) > 0; const c = new THREE.Color(top ? (k === 1 ? '#ff8fd0' : '#b48cff') : '#5fffd0'); col.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const mesh = new THREE.Mesh(g, m); mesh.position.set(-40 + k * 50, 120 + k * 15, -300 + k * 30); mesh.rotation.y = 0.3 - k * 0.3; mesh.userData.base = Float32Array.from(p.array);
    aurora.add(mesh); auroraMats.push(m);
  }
  scene.add(aurora);
  const sunGlow = glow('#ffe2b0', 90, 0.9); sunGlow.material.fog = false; scene.add(sunGlow);
  // Dreamy distances: far-off floating islands, a pale ringed planet, soft cloud banks on the horizon.
  const farMat = new THREE.MeshBasicMaterial({ color: '#d9c6ec', fog: false }), farIslands = [];
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * Math.PI * 2 + R() * 0.4, d = 300 + R() * 90, f = makeFarIsland(800 + k, farMat);
    f.scale.setScalar(9 + R() * 10); f.position.set(Math.cos(a) * d, -10 + R() * 70, Math.sin(a) * d); f.userData.bob = R() * 6; f.userData.y0 = f.position.y;
    scene.add(f); farIslands.push(f);
  }
  const planet = new THREE.Sprite(new THREE.SpriteMaterial({ map: planetTexture(), transparent: true, opacity: 0.5, fog: false, depthWrite: false }));
  planet.scale.set(70, 70, 1); scene.add(planet);
  const banks = [], bankMat = new THREE.SpriteMaterial({ map: softDot(), color: '#fff0f4', transparent: true, opacity: 0.55, fog: false, depthWrite: false });
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + R() * 0.2, b = new THREE.Sprite(bankMat); b.scale.set(150 + R() * 90, 40 + R() * 30, 1); b.position.set(Math.cos(a) * 420, -25 + R() * 25, Math.sin(a) * 420); scene.add(b); banks.push(b); }
  const dustGeo = new THREE.BufferGeometry(), dp = [], dc = [], dustBase = [];
  for (let k = 0; k < 260; k++) { const x = (R() - 0.5) * 50, y = (R() - 0.3) * 16, z = (R() - 0.5) * 50; dp.push(x, y, z); dustBase.push(x, y, z, R() * 6); const c = new THREE.Color().setHSL([0.92, 0.75, 0.55, 0.12][k % 4], 0.8, 0.85); dc.push(c.r, c.g, c.b); }
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dustGeo.setAttribute('color', new THREE.Float32BufferAttribute(dc, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.16, map: glowTex(), vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  dust.frustumCulled = false; dust.userData.base = dustBase; scene.add(dust);
  // The cloud sea below and a few clouds drifting above.
  const sea = new THREE.Mesh(new THREE.CircleGeometry(700, 48), new THREE.MeshLambertMaterial({ color: '#f1e6ea', emissive: new THREE.Color('#ffe6dc'), emissiveIntensity: 0.06 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -11; scene.add(sea);
  const clouds = [];
  // Clouds at three levels: the sea below, a drifting middle layer between the islands, and a few high ones.
  const detail = GFX.high ? 2 : 1;
  for (let k = 0; k < tune.cloudsLow; k++) {
    const a = R() * Math.PI * 2, d = 14 + R() * 110, size = 1.8 + R() * 3.2;
    const c = makeCloud(100 + k, size, undefined, detail); c.position.set(Math.cos(a) * d, -9 + R() * 3.5, Math.sin(a) * d);
    c.userData.speed = 0.6 + R() * 0.8; c.userData.bob = R() * 6; scene.add(c); clouds.push(c);
  }
  for (let k = 0; k < tune.cloudsMid; k++) {
    const a = R() * Math.PI * 2, d = 26 + R() * 70, c = makeCloud(200 + k, 1.2 + R() * 1.8, undefined, detail);
    c.position.set(Math.cos(a) * d, -3 + R() * 9, Math.sin(a) * d); c.userData.speed = 1 + R() * 1.2; c.userData.bob = R() * 6; scene.add(c); clouds.push(c);
  }
  for (let k = 0; k < 9; k++) {
    const a = R() * Math.PI * 2, d = 20 + R() * 60, c = makeCloud(300 + k, 2 + R() * 2, undefined, detail);
    c.position.set(Math.cos(a) * d, 11 + R() * 7, Math.sin(a) * d); c.userData.speed = 1.2 + R() * 0.8; c.userData.bob = R() * 6; scene.add(c); clouds.push(c);
  }
  const ghostMat = new THREE.MeshBasicMaterial({ color: '#c3b2ea', transparent: true, opacity: 0.24, depthWrite: false });
  // Rain and snow, kept around the camera's target.
  const rainGeo = new THREE.BufferGeometry(), rp = new Float32Array(600 * 6);
  for (let k = 0; k < 600; k++) { const x = (R() - 0.5) * 36, y = R() * 22, z = (R() - 0.5) * 36; rp.set([x, y, z, x + 0.05, y - 0.6, z], k * 6); }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#e4e8ff', transparent: true, opacity: 0 }));
  rain.frustumCulled = false; scene.add(rain);
  const snowGeo = new THREE.BufferGeometry(), snp = new Float32Array(700 * 3);
  for (let k = 0; k < 700; k++) snp.set([(R() - 0.5) * 36, R() * 22, (R() - 0.5) * 36], k * 3);
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snp, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.14, transparent: true, opacity: 0, map: glowTex(), depthWrite: false }));
  snow.frustumCulled = false; scene.add(snow);
  R3 = { renderer, scene, cam, hemi, dir, rim, skyMat, stars, lampStars, aurora, auroraMats, sunGlow, farMat, farIslands, planet, bankMat, dust, sea, clouds, ghostMat, rain, snow, fxGeo: new THREE.IcosahedronGeometry(0.22, 0) };
  buildIslandMeshes();
  initVoyageScene();
  initPost();
  vis.camPos = new THREE.Vector3(20, 14, 20); vis.camLook = new THREE.Vector3();
  addEventListener('resize', onResize);
}
/** (Re)builds every island's meshes from the current world: slab, tufts, terrain, features, shimmer. */
function buildIslandMeshes() {
  for (const v of vis.islands) { R3.scene.remove(v.g); if (v.aq) R3.scene.remove(v.aq.g); }
  vis.islands = []; vis.falls = []; vis.springs = [];
  const tuftGeo = grassClumpGeo();
  const budGeo = new THREE.OctahedronGeometry(0.035, 0); budGeo.translate(0, 0.16, 0);
  for (const isl of ISLANDS) {
    const g = makeIsland(isl); g.position.set(isl.cx, isl.y, isl.cz);
    // Grass tufts and wild buds over the open ground; hidden under anything built.
    const RT = mrand(isl.seed + 400), tufts = [], buds = [];
    for (const c of isl.cells) {
      if (TERRAIN.has(K(c[0], c[1]))) continue;
      if (RT() < 0.75) for (let k = 0; k < 4; k++) tufts.push({ key: K(c[0], c[1]), x: c[0] + 0.1 + RT() * 0.8 - isl.cx, z: c[1] + 0.1 + RT() * 0.8 - isl.cz, s: 0.75 + RT() * 0.75, r: RT() * 6, col: ['#c8e0a0', '#b4d890', '#d8e8a8', '#a8cc88'][k % 4] });
      if (RT() < 0.25) buds.push({ key: K(c[0], c[1]), x: c[0] + 0.2 + RT() * 0.6 - isl.cx, z: c[1] + 0.2 + RT() * 0.6 - isl.cz, s: 0.8 + RT() * 0.6, r: 0, col: pick(PAL.flower, RT) });
    }
    const inst = [];
    for (const [list, geo] of [[tufts, tuftGeo], [buds, budGeo]]) {
      const im = new THREE.InstancedMesh(geo, geo === tuftGeo ? grassMat() : new THREE.MeshLambertMaterial({ flatShading: true }), Math.max(1, list.length));
      list.forEach((t, k) => im.setColorAt(k, new THREE.Color(t.col)));
      im.count = list.length; im.userData.list = list; im.receiveShadow = true; g.add(im); inst.push(im);
    }
    g.userData.inst = inst;
    const feats = [];
    for (const f of isl.featureCells) {
      if (PLACED_FEATURES[f.type]) continue; // a piece in the state, drawn with the others
      const m = makePiece(f.type, f.cell[0] * 7 + f.cell[1]);
      m.position.set(f.cell[0] + 0.5 - isl.cx, 0, f.cell[1] + 0.5 - isl.cz); m.rotation.y = Math.atan2(isl.cx - f.cell[0] - 0.5, isl.cz - f.cell[1] - 0.5);
      if (f.type !== 'wildflowers') m.add(contactShadow(f.type === 'spire' ? 2.4 : 1.3));
      g.add(m); feats.push(m);
    }
    // Painterly patches of lighter and darker grass over the island top.
    const patches = isl.cells.filter(c => RT() < 0.3 && !TERRAIN.has(K(c[0], c[1])));
    if (patches.length) {
      const pg = new THREE.CircleGeometry(1, 9); pg.rotateX(-Math.PI / 2);
      const pm = new THREE.InstancedMesh(pg, new THREE.MeshLambertMaterial({ map: softDot(), transparent: true, opacity: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }), patches.length), cols = ['#bfe39a', '#8fbe6c', '#b0d987', '#cfe8a8', '#94c271'];
      patches.forEach((c, k) => {
        const sc = 0.35 + RT() * 0.5;
        pm.setMatrixAt(k, new THREE.Matrix4().compose(new THREE.Vector3(c[0] + RT() - isl.cx, 0.004, c[1] + RT() - isl.cz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), RT() * 6), new THREE.Vector3(sc * (1 + RT() * 0.6), 1, sc)));
        pm.setColorAt(k, new THREE.Color(cols[k % cols.length]));
      });
      pm.receiveShadow = true; g.add(pm);
    }
    // Mountains and rivers: never built on; each river falls off the rim into the clouds.
    const rel = c => [c[0] + 0.5 - isl.cx, c[1] + 0.5 - isl.cz];
    isl.mountains.forEach((blob, k) => g.add(makeMountain(blob.map(rel), isl.seed * 7 + k)));
    for (const lk of isl.lakes || []) g.add(makeLake(lk.map(rel)));
    for (const rv of isl.rivers) {
      // The river runs right to the rim (the slab reaches islandRadius + 0.42), then pours over it.
      const [lx, lz] = rel(rv.path[rv.path.length - 1]), [ex, ez] = rv.exit.d;
      const rim = rimFrom(isl, rv.path[rv.path.length - 1], rv.exit.d);
      const river = makeRiver(rv.path.map(rel), rv.exit.d, rim); g.add(river);
      if (river.userData.spring) { vis.falls.push(river.userData.spring.fall); vis.springs.push(river.userData.spring); }
      const fall = makeWaterfall(3 + isl.r * 1.2, 0.54);
      fall.position.set(lx + ex * (rim + 0.12), -0.19, lz + ez * (rim + 0.12)); fall.rotation.y = Math.atan2(ex, ez); // takes over at the foot of the river's lip
      g.add(fall); vis.falls.push(fall);
    }
    // Fairy fish and lily frogs in this island's lakes and rivers (a group of their own, so the
    // mist-ghost never touches them; it follows the island).
    const aq = { g: new THREE.Group(), fish: [], frogs: [], rfish: [] };
    (isl.lakes || []).forEach((lk, li) => {
      const cells = lk.map(rel), has = new Set(lk.map(c => K(c[0], c[1]))), shore = [];
      for (const c of lk) for (const [di, dj] of N4) if (!has.has(K(c[0] + di, c[1] + dj))) { const [x, z] = rel(c); shore.push([x + di * 0.68, z + dj * 0.68, Math.atan2(-di, -dj)]); }
      for (let k = 0; k < tune.fishPerLake; k++) { const m = makeGlowfin(li * 3 + k), ring = splashRing(); aq.g.add(m, ring); aq.fish.push({ m, ring, c: cells[(k * 2 + li) % cells.length], ph: isl.id * 3.1 + li * 1.7 + k * 2.9, dir: k % 2 ? 1 : -1, P: 7 + k * 1.7 }); }
      for (let k = 0; k < tune.frogsPerLake && shore.length; k++) {
        const A = shore[(k * 5 + li) % shore.length], B = shore.reduce((best, q) => q !== A && (!best || Math.hypot(q[0] - A[0], q[1] - A[1]) < Math.hypot(best[0] - A[0], best[1] - A[1])) ? q : best, null) || A;
        const m = makeLilyFrog(li + k); aq.g.add(m); aq.frogs.push({ m, A, B, ph: isl.id * 2.3 + k * 4.1, P: 9 + k * 2.3 });
      }
    });
    isl.rivers.forEach((rv, ri) => {
      const cells = rv.path.map(rel);
      for (let k = 0; k < tune.fishPerRiver && cells.length > 2; k++) { const m = makeGlowfin(ri + k + 2), ring = splashRing(); aq.g.add(m, ring); aq.rfish.push({ m, ring, cells, ph: isl.id * 1.9 + k * 3.3, P: 5.5 + k * 1.3 }); }
    });
    R3.scene.add(aq.g);
    const shimmer = new THREE.Group();
    for (let k = 0; k < 4; k++) { const s = glow('#e8f0ff', 0.5, 0.8); s.position.set((k % 2 - 0.5) * 0.4, 0.3 + k * 0.12, (k > 1 ? 0.2 : -0.2)); shimmer.add(s); }
    shimmer.position.set(isl.secretCell[0] + 0.5 - isl.cx, 0.2, isl.secretCell[1] + 0.5 - isl.cz); g.add(shimmer);
    const beacon = glow('#ffe7a8', 9, 0); beacon.position.y = 3; g.add(beacon);
    g.traverse(o => { if (o.isMesh) { o.userData.mat = o.material; o.userData.cast = o.castShadow; } });
    R3.scene.add(g);
    vis.islands.push({ g, feats, shimmer, beacon, disc: null, aq });
  }
}
let _grassMat;
const GRASS_U = { uTime: { value: 0 }, uWind: { value: 1 } };
/** The grass's material: vertex-shaded blades that sway in the wind (more in weather), each clump in its own rhythm. */
function grassMat() {
  if (_grassMat) return _grassMat;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = GRASS_U.uTime; sh.uniforms.uWind = GRASS_U.uWind;
    sh.vertexShader = 'uniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', [
      '#include <begin_vertex>',
      '#ifdef USE_INSTANCING',
      '  vec2 ip = instanceMatrix[3].xz;',
      '#else',
      '  vec2 ip = vec2(0.0);',
      '#endif',
      '  float sw = sin(uTime * 1.6 + ip.x * 1.3 + ip.y * 0.9) * 0.6 + sin(uTime * 2.7 + ip.x * 2.1 - ip.y * 1.4) * 0.3;',
      '  float bend = position.y * position.y * 3.0 * uWind;',
      '  transformed.x += sw * bend * 0.25; transformed.z += sw * bend * 0.12;'].join('\n'));
  };
  _grassMat = m; return m;
}
let _softDot;
/** A soft round spot texture (white, fading out) for painterly grass patches. */
function softDot() {
  if (_softDot) return _softDot;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); _softDot = new THREE.CanvasTexture(c); return _softDot;
}
// ---- Post: soft glow and a miniature (tilt-shift) blur on High; plain rendering on Low ----------------
const GFX = { high: true };
function loadQuality() {
  if (CHEAP) return false;
  try { const v = localStorage.getItem('abovea.quality'); if (v) return v === 'high'; } catch (_) { /* storage blocked */ }
  return !(matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 700); // small phones start on Low
}
function pixelRatio() { return CHEAP ? 0.5 : Math.min(devicePixelRatio || 1, GFX.high ? 2 : 1.25); }
const TiltShift = {
  uniforms: { tDiffuse: { value: null }, amount: { value: 0 }, res: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float amount; uniform vec2 res; varying vec2 vUv;
    void main(){
      float d = abs(vUv.y - 0.5) * 2.0, r = amount * smoothstep(0.3, 1.0, d);
      vec4 sum = texture2D(tDiffuse, vUv); float w = 1.0;
      if (r > 0.01) for (int k = 0; k < 16; k++) { float a = float(k) * 2.39996, rr = sqrt(float(k) + 0.5) / 4.0; sum += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * rr * r / res); w += 1.0; }
      gl_FragColor = sum / w;
    }`,
};
function initPost() {
  if (CHEAP) return;
  const r = R3.renderer, size = r.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new THREE.EffectComposer(r, rt);
  const pass = new THREE.RenderPass(R3.scene, R3.cam);
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(size.x, size.y), tune.bloom, 0.55, tune.bloomThreshold);
  const tilt = new THREE.ShaderPass(TiltShift);
  composer.addPass(pass); composer.addPass(bloom); composer.addPass(tilt); composer.addPass(new THREE.OutputPass());
  R3.post = { composer, pass, bloom, tilt };
  tilt.uniforms.res.value.set(size.x, size.y);
}
/** Draws a scene: through the glow and miniature blur on High, plainly on Low. */
function renderMain(scn, cam, tiltAmount = 0) {
  const P = R3.post;
  R3.renderer.toneMappingExposure = tune.exposure;
  if (P && GFX.high) {
    P.pass.scene = scn; P.pass.camera = cam; P.bloom.strength = tune.bloom; P.bloom.threshold = tune.bloomThreshold;
    P.tilt.uniforms.amount.value = tiltAmount * tune.tiltShift * R3.renderer.getPixelRatio();
    P.composer.render();
  } else R3.renderer.render(scn, cam);
}
/** Switches graphics between High and Low, and remembers it on this device. */
function setQuality(high) {
  GFX.high = high && !CHEAP;
  try { localStorage.setItem('abovea.quality', GFX.high ? 'high' : 'low'); } catch (_) { /* storage blocked */ }
  R3.renderer.setPixelRatio(pixelRatio()); onResize();
  R3.dir.shadow.mapSize.set(GFX.high ? 2048 : 1024, GFX.high ? 2048 : 1024);
  if (R3.dir.shadow.map) { R3.dir.shadow.map.dispose(); R3.dir.shadow.map = null; }
  toast(`Graphics: ${GFX.high ? 'High' : 'Low'}`, 2);
}
function onResize() {
  if (!R3) return;
  R3.renderer.setSize(innerWidth, innerHeight, false);
  if (R3.post) { R3.post.composer.setPixelRatio(R3.renderer.getPixelRatio()); R3.post.composer.setSize(innerWidth, innerHeight); const s = R3.renderer.getDrawingBufferSize(new THREE.Vector2()); R3.post.tilt.uniforms.res.value.set(s.x, s.y); }
  R3.cam.aspect = innerWidth / innerHeight; R3.cam.updateProjectionMatrix();
  if (R3.vcam) { R3.vcam.aspect = R3.cam.aspect; R3.vcam.updateProjectionMatrix(); }
  if (R3.fcam) { R3.fcam.aspect = R3.cam.aspect; R3.fcam.updateProjectionMatrix(); }
}

function initVoyageScene() {
  const vs = new THREE.Scene();
  vs.background = new THREE.Color('#cdb8e8'); vs.fog = new THREE.FogExp2('#cdb8e8', 0.04);
  vs.add(new THREE.HemisphereLight('#fff1f6', '#a890d0', 1.6));
  const d = new THREE.DirectionalLight('#ffe6cc', 1.6); d.position.set(4, 10, 6); vs.add(d);
  const boat = makeBoat(); vs.add(boat);
  const vclouds = [];
  const R = mrand(77);
  for (let k = 0; k < 44; k++) {
    const c = makeCloud(500 + k, 1.5 + R() * 2.5, k % 3 ? '#f4ecfb' : '#fbe8e0');
    const side = k % 2 ? 1 : -1;
    c.position.set(side * (4 + R() * 16), -4 + R() * 9, -R() * 100); vs.add(c); vclouds.push(c);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 400), new THREE.MeshLambertMaterial({ color: '#efe4f8' }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -6; vs.add(floor);
  const vcam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
  Object.assign(R3, { vs, boat, vclouds, vfloor: floor, vcam });
}

// ---- Camera: computed on the step so it moves smoothly at any frame rate -------------------------------
function camStep(dt) {
  if (!R3) return;
  const pos = new THREE.Vector3(), look = new THREE.Vector3(), c = state.cam;
  if (state.view === 'postcard' || scene === 'title') {
    const a = state.t * tune.postcardSpeed + 0.6, h = 7 + 3 * Math.sin(state.t * 0.05);
    let cx = 0, cz = 0, n = 0; for (const isl of ISLANDS) if (state.islands[isl.id].discovered) { cx += isl.cx; cz += isl.cz; n++; }
    cx /= n; cz /= n;
    const r = 15 + n * 5;
    pos.set(cx + Math.cos(a) * r, h + n, cz + Math.sin(a) * r); look.set(cx * 0.8, 1, cz * 0.8);
  } else if (state.view === 'stroll') {
    const f = state.folk.find(x => x.id === state.followId);
    if (f) {
      const y = f.y;
      let dh = f.h - vis.strollH; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); vis.strollH += dh * Math.min(1, dt * 1.5);
      const hx = Math.sin(vis.strollH), hz = Math.cos(vis.strollH);
      pos.set(f.x - hx * 2.1, y + 1.05, f.z - hz * 2.1); look.set(f.x + hx * 2.5, y + 0.45, f.z + hz * 2.5);
    } else { const a = state.t * 0.1; pos.set(Math.cos(a) * 3.5, 1.3, Math.sin(a) * 3.5); look.set(Math.cos(a + 0.8) * 5, 0.5, Math.sin(a + 0.8) * 5); }
  } else {
    let ty = 0, bd = 1e9;
    for (const isl of ISLANDS) if (state.islands[isl.id].discovered) { const d = Math.hypot(isl.cx - c.tx, isl.cz - c.tz); if (d < bd) { bd = d; ty = isl.y; } }
    c.ty += (ty - c.ty) * Math.min(1, dt * 3);
    const f = (c.dist - tune.camZoomMin) / (tune.camZoomMax - tune.camZoomMin), pitch = 0.58 + 0.45 * Math.min(1, f * 1.4);
    look.set(c.tx, c.ty, c.tz);
    pos.set(c.tx + Math.sin(c.yaw) * Math.cos(pitch) * c.dist, c.ty + Math.sin(pitch) * c.dist, c.tz + Math.cos(c.yaw) * Math.cos(pitch) * c.dist);
  }
  const k = state.view === 'stroll' ? 1 - Math.exp(-dt * 4) : 1 - Math.exp(-dt * 7);
  vis.camPos.lerp(pos, k); vis.camLook.lerp(look, k);
}

/** A ray from the camera through a screen point. */
function screenRay(x, y) {
  if (!R3) return null;
  const v = new THREE.Vector3((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, 0.5).unproject(R3.cam);
  const o = R3.cam.position.clone(), d = v.sub(o).normalize();
  if (Math.abs(d.y) < 1e-4) return null;
  return { o, d };
}

// ---- Drawing the world ----------------------------------------------------------------------------
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _c3 = new THREE.Color();
function mixHex(a, b, t, out) { return out.set(a).lerp(_c3.set(b), t); }
/** Sky, light, fog and weather for the time of day. */
function syncSky() {
  const S = sun(), w = state.weather, lamp = state.relics.starlamp;
  // Dreamy pastels: periwinkle above, a lilac-rose band, peach at the horizon; rosier at dawn and dusk; deep violet by night.
  const dayTop = mixHex('#8fb0f4', '#9c8fe0', S.warm, new THREE.Color()), dayHor = mixHex('#ffe8e2', '#ffc2a4', S.warm, new THREE.Color());
  const dayMid = mixHex('#e2c8f2', '#f4b2cc', S.warm, new THREE.Color());
  const nightTop = new THREE.Color(lamp ? '#1a0f44' : '#120f38'), nightHor = new THREE.Color(lamp ? '#5e3478' : '#3e3474'), nightMid = new THREE.Color(lamp ? '#3a1f62' : '#2a2258');
  const top = nightTop.lerp(dayTop, S.daylight), hor = nightHor.lerp(dayHor, S.daylight), mid = nightMid.lerp(dayMid, S.daylight);
  const grey = new THREE.Color(S.daylight > 0.4 ? '#a7a3bd' : '#3e3f5c'), over = w.amt * (w.kind === 'snow' ? 0.35 : 0.55);
  top.lerp(grey, over); hor.lerp(grey, over * 0.8); mid.lerp(grey, over * 0.9);
  const fl = w.flash; if (fl > 0) { top.lerp(_c1.set('#e8e8ff'), fl * 0.6); hor.lerp(_c1.set('#f0f0ff'), fl * 0.6); }
  const U = R3.skyMat.uniforms;
  U.top.value.copy(top); U.hor.value.copy(hor); U.mid.value.copy(mid);
  U.time.value = state.t; U.day.value = S.daylight * (1 - over); U.night.value = Math.max(0, S.night - over) * (lamp ? 1.4 : 1);
  R3.farMat.color.copy(hor).lerp(mid, 0.45).lerp(_c1.set('#ffffff'), 0.12 * S.daylight); // hazy, the sky's own colours
  R3.farIslands.forEach(f => { f.position.y = f.userData.y0 + Math.sin(state.t * 0.12 + f.userData.bob) * 1.5; f.rotation.y = state.t * 0.01 + f.userData.bob; });
  R3.planet.position.set(vis.camPos.x - 220, vis.camPos.y + 120, vis.camPos.z - 250);
  R3.planet.material.opacity = (0.32 + S.night * 0.55) * (1 - over * 0.8);
  R3.bankMat.color.copy(hor).lerp(_c1.set('#ffffff'), 0.35 * S.daylight); R3.bankMat.opacity = 0.45 * (1 - over * 0.5);
  R3.dust.material.opacity = (0.35 + S.night * 0.55) * (1 - over * 0.7);
  R3.skyMat.uniforms.bot.value.copy(hor).lerp(_c1.set(S.daylight > 0.5 ? '#fff4ee' : '#4a4a7a'), 0.5);
  R3.scene.fog.color.copy(hor).lerp(_c1.set('#f6e4e0'), 0.25 * S.daylight);
  R3.scene.fog.density = tune.fogDensity * (1 + w.amt * 0.8);
  R3.sea.material.color.copy(hor).lerp(_c1.set('#f4ecf0'), 0.35 * S.daylight + 0.1);
  for (const cl of R3.clouds) cl.children.forEach(m => { m.material.emissiveIntensity = 0.03 + 0.05 * S.daylight; });
  // Sun by day, a blue moon by night; the same light swaps.
  const sx = Math.cos(S.ang), sy = Math.sin(S.ang), tgt = vis.camLook;
  const dirY = Math.max(0.25, Math.abs(sy));
  R3.dir.position.set(tgt.x + sx * 30, tgt.y + dirY * 30, tgt.z + 14);
  R3.dir.target.position.copy(tgt);
  R3.rim.position.set(tgt.x - sx * 20, tgt.y + 12, tgt.z - 18); R3.rim.target.position.copy(tgt);
  R3.rim.intensity = 0.25 + S.daylight * 0.45 + S.night * 0.3;
  R3.dir.color.copy(S.daylight > 0.3 ? mixHex('#fff3e0', '#ffae78', S.warm, _c1) : _c1.set('#9fb0ff'));
  R3.dir.intensity = (S.daylight * 2.4 + S.night * 0.45) * (1 - over * 0.6) + fl * 2;
  R3.hemi.color.copy(top).lerp(_c1.set('#ffffff'), 0.5); R3.hemi.groundColor.set(S.daylight > 0.4 ? '#c7b2df' : '#3d3966');
  R3.hemi.intensity = 0.8 + S.daylight * 0.9 + fl * 1.5;
  R3.stars.material.opacity = Math.max(0, S.night - over) * 0.95;
  R3.lampStars.material.opacity = lamp ? Math.max(0, S.night - over) : 0;
  R3.auroraMats.forEach(m => { m.opacity = lamp ? Math.max(0, S.night - over) * 0.32 : 0; });
  if (lamp) R3.aurora.children.forEach((m, k) => {
    const p = m.geometry.attributes.position, b = m.userData.base;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(b[i * 3] * 0.03 + state.t * 0.4 + k) * 18);
    p.needsUpdate = true;
  });
  R3.sunGlow.position.set(vis.camPos.x + sx * 300, vis.camPos.y + sy * 300, vis.camPos.z - 80);
  R3.sunGlow.material.opacity = Math.max(0, sy) * 0.9 * (1 - over);
  R3.sunGlow.material.color.copy(mixHex('#fff1d0', '#ffb07a', S.warm, _c1));
  // Rain and snow fall around the camera's target.
  const fk = fallingKind(), look = vis.camLook, rainOn = (fk === 'rain' || fk === 'thunder') ? w.amt : 0, snowOn = fk === 'snow' ? w.amt : 0;
  // fewer drops as it dies away, each a little fainter
  R3.rain.material.opacity = 0.25 + rainOn * 0.3; R3.rain.visible = rainOn > 0.01; R3.rain.position.set(look.x, look.y - 3, look.z);
  R3.rain.geometry.setDrawRange(0, Math.floor(R3.rain.geometry.attributes.position.count * Math.min(1, rainOn * 1.15) / 2) * 2);
  R3.snow.material.opacity = 0.4 + snowOn * 0.55; R3.snow.visible = snowOn > 0.01; R3.snow.position.set(look.x, look.y - 3, look.z);
  R3.snow.geometry.setDrawRange(0, Math.floor(R3.snow.geometry.attributes.position.count * Math.min(1, snowOn * 1.15)));
}
/**
 * A cloud drifting into an island no longer passes through it: it is nudged round the island's
 * side (the rock underneath narrows as it goes down, so lower clouds slip in closer), and thins
 * out and shrinks as it nears, so it seems to part and re-form beyond.
 */
function cloudClear(c, dt) {
  const sz = c.userData.size || 2, u = c.userData; let f = 1;
  for (const isl of ISLANDS) {
    const y = islandLift(isl.id), depth = isl.r * 1.5 + 1.5, cy = c.position.y;
    if (cy > y + 1.0 + sz * 0.6 || cy < y - depth - sz * 0.5) continue;
    const narrow = cy < y ? 1 - Math.min(0.85, (y - cy) / depth) : 1, dx = c.position.x - isl.cx, dz = c.position.z - isl.cz, dd = Math.hypot(dx, dz) || 1;
    const gap = dd - ((isl.r + 0.8) * narrow + sz * 1.1);
    if (gap < 1.5) { const push = (1.5 - gap) * dt * 0.9; c.position.x += dx / dd * push; c.position.z += dz / dd * push; }
    f = Math.min(f, Math.max(0, Math.min(1, (gap + 0.5) / 3)));
  }
  u.fade = (u.fade ?? 1) + (f - (u.fade ?? 1)) * Math.min(1, dt * 3); const k = u.fade;
  if (u.mat) { u.mat.transparent = k < 0.995; u.mat.opacity = k; }
  c.visible = k > 0.03; c.scale.setScalar(0.75 + 0.25 * k);
}
/** The weather still falling: the current one, or the one dying away after it ended. */
function fallingKind() { const w = state.weather; return w.kind === 'clear' ? (w.amt > 0 ? w.last || 'clear' : 'clear') : w.kind; }
/** Moves rain and snow (on the step, so a check can drive it). */
function weatherFx(dt) {
  if (!R3) return;
  if (R3.rain.visible) { const p = R3.rain.geometry.attributes.position; for (let k = 0; k < p.count; k += 2) { let y = p.getY(k) - 16 * dt; if (y < 0) y += 22; p.setY(k, y); p.setY(k + 1, y - 0.6); } p.needsUpdate = true; }
  if (R3.snow.visible) { const p = R3.snow.geometry.attributes.position; for (let k = 0; k < p.count; k++) { let y = p.getY(k) - 1.2 * dt; if (y < 0) y += 22; p.setY(k, y); p.setX(k, p.getX(k) + Math.sin(state.t + k) * 0.004); } p.needsUpdate = true; }
  for (const c of R3.clouds) { c.position.x += c.userData.speed * tune.cloudSpeed * dt; c.position.y += Math.sin(state.t * 0.2 + c.userData.bob) * 0.004; if (c.position.x > 120) c.position.x -= 240; cloudClear(c, dt); }
  for (const f of vis.falls) {
    f.userData.texes.forEach(t => { t.offset.y -= dt * 0.8 * t.userData.speed; }); // v runs down the fall: lowering the offset moves the streaks down
    const fu = f.userData;
    fu.drops.forEach(d => { const t = (state.t * 0.45 + d.userData.ph) % 1; d.position.set(d.userData.x * (1 + t), 0.045 - Math.pow(t, 1.15) * fu.len, fu.out * Math.sqrt(t) + 0.04); d.material.opacity = 0.85 * Math.min(1, t * 8) * (1 - t); });
    f.userData.mist.forEach((m, k) => { const b = 1 + Math.sin(state.t * 1.3 + k * 1.9) * 0.12; m.scale.setScalar((k < 3 ? 0.6 + k * 0.25 : 1.2 + (k - 3) * 0.4) * b); });
  }
  waterFlowTex().offset.y -= dt * 0.35; // rivers flow downstream
  GRASS_U.uTime.value = state.t; GRASS_U.uWind.value = tune.grassWind * (1 + state.weather.amt * 1.5);
  if (R3.dust) { // fairy dust drifts up and sways around wherever you look, wrapping round
    const d = R3.dust, b = d.userData.base, p = d.geometry.attributes.position, look = vis.camLook || _v.set(0, 0, 0);
    d.position.set(look.x, look.y, look.z);
    for (let k = 0; k < p.count; k++) { let y = b[k * 4 + 1] + ((state.t * 0.25 + b[k * 4 + 3]) % 16); if (y > 12) y -= 16; p.setXYZ(k, b[k * 4] + Math.sin(state.t * 0.5 + b[k * 4 + 3]) * 0.6, y, b[k * 4 + 2] + Math.cos(state.t * 0.4 + b[k * 4 + 3]) * 0.6); }
    p.needsUpdate = true;
  }
  for (const sp of vis.springs) sp.ripples.forEach(r => { const k = (state.t * 0.6 + r.userData.ph) % 1; r.scale.setScalar(1 + k * 4); r.material.opacity = 0.6 * (1 - k); });
}

function ghostify(g, on, mat) { g.traverse(o => { if (o.isMesh && o.userData.contact) { o.visible = !on; return; } if (o.isMesh) { o.material = on ? mat : o.userData.mat; o.castShadow = !on && o.userData.cast !== false; } if (o.isSprite) o.visible = !on && o.userData.keep !== false; }); }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
/** Shows the tufts and buds on open ground and hides them under anything built. */
function syncTufts() {
  const ver = state.nextId + ':' + state.pieces.length;
  if (vis.tuftVer === ver) return;
  vis.tuftVer = ver;
  for (const v of vis.islands) for (const im of v.g.userData.inst) {
    im.userData.list.forEach((t, k) => {
      const hide = state.occ[t.key] !== undefined;
      _q.setFromAxisAngle(_up, t.r); _s.setScalar(hide ? 0.0001 : t.s);
      im.setMatrixAt(k, _m4.compose(_v.set(t.x, 0, t.z), _q, _s));
    });
    im.instanceMatrix.needsUpdate = true;
  }
}
function syncIslands() {
  const S = sun();
  syncTufts();
  ISLANDS.forEach((isl, k) => {
    const v = vis.islands[k], s = state.islands[k];
    if (!v.ghost) v.ghost = R3.ghostMat.clone();
    if (v.disc !== s.discovered) { ghostify(v.g, !s.discovered, v.ghost); v.disc = s.discovered; }
    v.ghost.opacity = 0.26 * smooth(9, 24, vis.camPos.distanceTo(_v.set(isl.cx, isl.y, isl.cz)));
    const rv = s.reveal, e = 1 - Math.pow(1 - rv, 3);
    v.g.position.y = islandLift(k) + (s.discovered ? (1 - e) * -1.5 : 0);
    v.g.scale.setScalar(s.discovered ? 0.85 + 0.15 * e : 1);
    v.shimmer.visible = s.discovered && !s.secretFound && rv >= 1 && (k !== 0 || pop() > 0);
    v.shimmer.children.forEach((sp, j) => { sp.visible = v.shimmer.visible; sp.material.opacity = 0.35 + 0.45 * Math.max(0, Math.sin(state.t * 3 + j * 1.7)); });
    const next = QUESTS[state.quest];
    v.beacon.visible = !s.discovered && next && next.island === k;
    v.beacon.material.opacity = v.beacon.visible ? (state.questReady ? 0.55 + 0.25 * Math.sin(state.t * 3) : 0.18) : 0;
    (v.g.userData.floaters || []).forEach(f => { f.position.y = f.userData.y0 + Math.sin(state.t * 0.5 + f.userData.ph) * 0.25; f.rotation.y = state.t * 0.1 + f.userData.ph; }); // stones floating beneath
    // Features: the bell leaves its gate, the spire's lamp goes quiet, windmills turn.
    v.feats.forEach(f => {
      if (f.userData.bell) f.userData.bell.visible = !s.relicTaken;
      if (f.userData.lamp) { const L = f.userData.lamp.userData; L.halo.material.opacity = s.relicTaken || !s.discovered ? 0 : 0.9; L.star.visible = !s.relicTaken; }
      if (f.userData.blades) spinBlades(f, 0.35);
      if (f.userData.halo) f.userData.halo.material.opacity = s.discovered ? 0.3 + S.night * 0.7 : 0;
      if (f.userData.mystic) animMystic(f, k * 7, s.discovered ? 1 : 0);
      if (f.userData.bell && f.userData.bell.userData.swing) f.userData.bell.rotation.z = Math.sin(state.t * 1.2) * 0.12;
    });
  });
  const home = ISLANDS[0];
}
function easeBack(t) { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
/** How wide the soft contact shadow under each kind of piece is (0: none). */
const CONTACT = { rock: 0.8, house: 1.5, school: 1.7, healer: 1.6, tree: 1.15, lantern: 0.6, garden: 1.05, well: 1.1, totem: 0.8, windmill: 1.2, arch: 1.2, stone: 0.9 };
/** Turns a windmill's sails: faster when the weather blows (k: 1 a whole windmill, less for a broken one). */
function spinBlades(m, k) {
  const u = m.userData, dt = Math.min(0.1, Math.max(0, state.t - (u.spinT ?? state.t))); u.spinT = state.t;
  u.blades.rotation.z -= dt * k * (0.9 + state.weather.amt * 1.8);
}
/**
 * The carved stone and the tribe totem: their runes and eyes breathe with a slow glow, the ground
 * ring of runes brightens and fades, the shards or the crystal eye drift round, charms sway.
 */
function animMystic(m, seed, on) {
  const u = m.userData, t = state.t, S = sun(), pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + seed);
  u.glowMats.forEach(g => { g.emissiveIntensity = (0.35 + pulse * 0.9 + S.night * 0.6) * on; });
  u.runeMat.opacity = (0.12 + pulse * 0.4 + S.night * 0.25) * on;
  u.orbit.rotation.y = t * 0.35 + seed; u.orbit.children.forEach((c, k) => { c.rotation.x = t * (0.6 + k * 0.2); c.rotation.y = t * 0.5; });
  u.orbit.position.y = (u.orbitY ??= u.orbit.position.y) + Math.sin(t * 0.8 + seed) * 0.05;
  if (u.halo) u.halo.material.opacity = (0.15 + pulse * 0.35 + S.night * 0.4) * on;
  if (u.charms) u.charms.forEach((c, k) => { c.rotation.z = Math.sin(t * 1.7 + k * 2 + seed) * 0.25; c.rotation.x = Math.sin(t * 1.1 + k) * 0.15; });
}
/** The Star Arch: its keystone star breathes, the veil inside shimmers, the little stars sway on their threads. */
function animArch(m, seed) {
  const u = m.userData, t = state.t, S = sun(), pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + seed);
  u.glowMat.emissiveIntensity = 0.6 + pulse * 0.7 + S.night * 0.5;
  u.veil.material.opacity = 0.25 + 0.25 * Math.sin(t * 0.9 + seed) + S.night * 0.25; u.veil.material.map.offset.y = Math.sin(t * 0.5) * 0.05;
  u.halo.material.opacity = 0.35 + pulse * 0.3 + S.night * 0.3;
  u.charms.forEach((c, k) => { c.rotation.z = Math.sin(t * 1.5 + k * 2.1 + seed) * 0.2; c.rotation.x = Math.sin(t * 1.1 + k) * 0.12; });
}
/** The wishing well: its bucket sways, the water glows softly, and little wish-lights rise from it. */
function animWell(m, seed) {
  const u = m.userData, t = state.t, S = sun();
  u.swing.rotation.z = Math.sin(t * 1.3 + seed) * 0.12; u.swing.rotation.x = Math.sin(t * 0.9 + seed) * 0.06;
  u.water.emissiveIntensity = 0.35 + 0.2 * Math.sin(t * 1.5 + seed) + S.night * 0.5;
  u.wishes.forEach((w, k) => { const k2 = (t * 0.22 + w.userData.ph + seed * 0.13) % 1; w.position.set(Math.sin(k2 * 9 + k) * 0.08, 0.32 + k2 * 0.9, Math.cos(k2 * 7 + k) * 0.08); w.material.opacity = Math.sin(Math.PI * k2) * (0.5 + S.night * 0.5); });
}
function syncPieces() {
  const S = sun(), seen = new Set();
  for (const p of state.pieces) {
    seen.add(p.id);
    let m = vis.pieces.get(p.id);
    const shape = p.type === 'house' ? p.floors : p.type === 'path' || p.type === 'bridge' ? (p.mask || 0) : p.type === 'garden' || p.type === 'meadow' ? `${p.mask || 0}|${p.kind || ''}` : 0;
    if (m && m.userData.shape !== shape) { R3.scene.remove(m); m = null; }
    if (!m) {
      m = makePiece(p.type, p.seed, shape); m.userData.shape = shape;
      const cs = CONTACT[p.type]; if (cs) m.add(contactShadow(cs));
      R3.scene.add(m); vis.pieces.set(p.id, m);
    }
    const isl = ISLANDS[p.isl], vI = vis.islands[p.isl];
    m.visible = state.islands[p.isl].discovered; // scenery on an island still in the mist waits for it
    const [pcx, pcz] = centerOf(p), sc = PIECES[p.type].scale || 1;
    m.position.set(pcx, pieceY(p) + vI.g.position.y - isl.y, pcz); m.rotation.y = p.rot;
    const def = PIECES[p.type];
    if (def.kind === 'living') {
      const s = Math.min(1, p.done) * (0.3 + 0.7 * p.grow);
      if (p.type === 'garden') { m.scale.setScalar(Math.min(1, p.done)); m.userData.flowers.forEach(f => f.scale.setScalar(Math.max(0.001, Math.min(1, (p.grow - f.userData.th * 0.9) * 4)))); }
      else m.scale.setScalar(Math.max(0.001, s));
      if (p.type === 'tree') m.rotation.z = Math.sin(state.t * 1.3 + p.seed) * 0.02 * (1 + state.weather.amt * 2);
    } else m.scale.set(sc, sc * Math.max(0.001, easeBack(Math.min(1, p.done))), sc);
    if (p.type === 'house') {
      const fam = state.families[p.id], inside = fam && state.folk.some(f => f.house === p.id && f.mode === 'inside');
      m.userData.winMat.emissiveIntensity = fam ? (inside ? 0.9 : 0.15) + S.night * 0.6 : 0;
      m.userData.snow.visible = state.weather.snow > 0.35; // a white cap on the roof once the snow has settled
      if (m.userData.lights) m.userData.lights.emissiveIntensity = fam ? 0.15 + S.night * 1.6 : 0.05;
    }
    if (p.type === 'lantern') m.userData.halo.material.opacity = 0.15 + S.night * 0.85;
    if (m.userData.blades) spinBlades(m, p.done >= 1 ? 1 : 0);
    if (m.userData.mystic) animMystic(m, p.seed, Math.min(1, p.done));
    if (m.userData.well) animWell(m, p.seed);
    if (m.userData.arch) animArch(m, p.seed);
    if (PIECES[p.type].utility) {
      const u = m.userData, on = p.done >= 1;
      u.winMat.emissiveIntensity = on ? 0.2 + S.night * 1.1 : 0; u.lights.emissiveIntensity = on ? 0.25 + S.night * 1.6 : 0.05;
      u.snow.visible = state.weather.snow > 0.35;
      if (u.orbit) { u.orbit.rotation.y = state.t * 0.5 + p.seed; u.orbit.position.y = 1.15 + Math.sin(state.t * 1.3 + p.seed) * 0.04; }
      if (u.halo) u.halo.material.opacity = on ? 0.3 + S.night * 0.6 + Math.sin(state.t * 2 + p.seed) * 0.08 : 0;
    }
  }
  for (const [id, m] of vis.pieces) if (!seen.has(id)) { R3.scene.remove(m); vis.pieces.delete(id); }
  // Bridges: laid straight between their two ends, following the islands as they drift.
  const seenB = new Set();
  for (const b of state.bridges) {
    seenB.add(b.id);
    let m = vis.bridges.get(b.id);
    if (!m) { m = makeSkyBridge(bridgeLen(b), tune.bridgeLightMin, tune.bridgeLightGap, bridgeHump(b), b.ta ?? 0, b.tb ?? 1); R3.scene.add(m); vis.bridges.set(b.id, m); }
    bridgeEnds(b, _p1, _p2); placeSkyBridge(m, _p1, _p2);
    m.userData.ends.forEach(e => { e.lamp.material.opacity = 0.2 + S.night * 0.7; });
    m.userData.lights.forEach((L, k) => { L.lamp.material.opacity = 0.15 + S.night * 0.85 + Math.sin(state.t * 3 + k * 1.7) * 0.05 * S.night; });
  }
  for (const [id, m] of vis.bridges) if (!seenB.has(id)) { R3.scene.remove(m); vis.bridges.delete(id); }
}
/** A ripple ring left on the water where a fish leaps out or dives in. */
function splashRing() {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.095, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = 3; return m;
}
function ripple(ring, x, y, z, k) { ring.position.set(x, y, z); const s = 1 + k * 3; ring.scale.set(s, s, 1); ring.material.opacity = Math.max(0, 0.75 * (1 - k)); }
/**
 * Glowfins glide half-under the lake's surface in slow circles and now and then leap in an arc,
 * leaving ripples; river glowfins leap upstream from cell to cell. Lily frogs sit on the shore,
 * blink, puff their throats and hop along the bank. All from the clock: pure scenery.
 */
function syncAqua() {
  const S = sun();
  ISLANDS.forEach((isl, k) => {
    const v = vis.islands[k], st = state.islands[k], aq = v.aq; if (!aq) return;
    aq.g.visible = st.discovered && st.reveal >= 1;
    if (!aq.g.visible) return;
    aq.g.position.copy(v.g.position); aq.g.scale.copy(v.g.scale);
    const t = state.t, WL = 0.064, WR = 0.05;
    for (const f of aq.fish) {
      const u = (t + f.ph) % f.P, leap = u < 0.9 ? u / 0.9 : -1, ang = t * 0.55 * f.dir + f.ph + (leap >= 0 ? leap * 1.4 * f.dir : u >= 0.9 ? 1.4 * f.dir : 0);
      const R = 0.24, x = f.c[0] + Math.cos(ang) * R, z = f.c[1] + Math.sin(ang) * R, m = f.m;
      m.position.set(x, WL + (leap >= 0 ? Math.sin(Math.PI * leap) * 0.32 : -0.005), z);
      m.rotation.set(leap >= 0 ? -Math.cos(Math.PI * leap) * 0.9 : 0, Math.atan2(-Math.sin(ang) * f.dir, Math.cos(ang) * f.dir), 0, 'YXZ');
      m.userData.tail.rotation.y = Math.sin(t * (leap >= 0 ? 14 : 5) + f.ph) * 0.5;
      m.userData.wings.forEach(w => { w.rotation.z = w.userData.s * (0.2 + Math.abs(Math.sin(t * 9 + f.ph)) * (leap >= 0 ? 0.9 : 0.3)); });
      m.userData.halo.material.opacity = 0.25 + S.night * 0.6;
      const since = u - 0.9; // the dive ripple spreads after the fish goes back in
      if (since >= 0 && since < 1.2) ripple(f.ring, x, WL + 0.003, z, since / 1.2); else if (leap >= 0 && leap < 0.3) ripple(f.ring, f.c[0] + Math.cos(ang - leap * 1.4 * f.dir) * R, WL + 0.003, f.c[1] + Math.sin(ang - leap * 1.4 * f.dir) * R, leap / 0.3); else f.ring.material.opacity = 0;
    }
    for (const f of aq.rfish) {
      const n = Math.floor((t + f.ph) / f.P), u = (t + f.ph) % f.P, i = 1 + (n % (f.cells.length - 1)), a = f.cells[i], b = f.cells[i - 1], m = f.m; // upstream: from cell i toward i-1
      if (u < 0.8) {
        const k2 = u / 0.8, x = a[0] + (b[0] - a[0]) * k2 * 0.6, z = a[1] + (b[1] - a[1]) * k2 * 0.6;
        m.visible = true; m.position.set(x, WR + Math.sin(Math.PI * k2) * 0.3, z);
        m.rotation.set(-Math.cos(Math.PI * k2) * 0.9, Math.atan2(b[0] - a[0], b[1] - a[1]), 0, 'YXZ');
        m.userData.tail.rotation.y = Math.sin(t * 16) * 0.5;
        if (k2 < 0.3) ripple(f.ring, a[0], WR + 0.003, a[1], k2 / 0.3); else f.ring.material.opacity = 0;
      } else {
        m.visible = false;
        const since = u - 0.8; if (since < 1.2) ripple(f.ring, a[0] + (b[0] - a[0]) * 0.6, WR + 0.003, a[1] + (b[1] - a[1]) * 0.6, since / 1.2); else f.ring.material.opacity = 0;
      }
    }
    for (const f of aq.frogs) {
      const n = Math.floor((t + f.ph) / f.P), u = (t + f.ph) % f.P, from = n % 2 ? f.B : f.A, to = n % 2 ? f.A : f.B, m = f.m;
      if (u < 0.6) { const k2 = u / 0.6; m.position.set(from[0] + (to[0] - from[0]) * k2, 0.035 + Math.sin(Math.PI * k2) * 0.22, from[1] + (to[1] - from[1]) * k2); m.rotation.y = Math.atan2(to[0] - from[0], to[1] - from[1]); m.userData.body.rotation.x = -Math.cos(Math.PI * k2) * 0.4; }
      else { m.position.set(to[0], 0.035, to[1]); let dh = to[2] - m.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); m.rotation.y += dh * 0.08; m.userData.body.rotation.x = 0; }
      const croak = ((t + f.ph * 1.7) % 4.5) < 1.1 && u >= 0.6;
      m.userData.throat.scale.setScalar(croak ? 1 + Math.max(0, Math.sin(t * 9)) * 0.7 : 1);
      const blink = Math.sin(t * 0.9 + f.ph * 3) > 0.985;
      m.userData.eyes.forEach(e => { e.scale.y = blink ? 0.15 : 1; });
    }
  });
}
/**
 * Walk animation for anything with legs. The step phase follows the distance actually travelled
 * (so feet never skate), the stride eases in and out when it starts and stops, and the heading
 * turns smoothly. Places the model; returns its gait state { ph, amp }.
 */
function gait(m, x, y, z, h, stride) {
  const u = m.userData;
  let a = u.anim;
  if (!a || Math.hypot(x - a.px, z - a.pz) > 1.5) a = u.anim = { px: x, pz: z, ph: 0, amp: 0, h, lt: state.t, sp: 0 };
  const dt = Math.min(0.1, Math.max(0, state.t - a.lt)); a.lt = state.t;
  const d = Math.hypot(x - a.px, z - a.pz); a.px = x; a.pz = z;
  if (dt > 0) a.sp += (d / dt - a.sp) * Math.min(1, dt * 10);
  a.amp += ((a.sp > 0.08 ? 1 : 0) - a.amp) * Math.min(1, dt * 7);
  a.ph += d * stride;
  let dh = h - a.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); a.h += dh * Math.min(1, dt * 9);
  m.position.set(x, y, z); m.rotation.y = a.h;
  return a;
}
/** Swings four legs in a trot (diagonal pairs together), or a hop for a bunny, and bobs the body. */
function animQuad(m, a, idle) {
  const u = m.userData, s = Math.sin(a.ph), amp = a.amp;
  if (u.hop) {
    const hp = Math.abs(Math.sin(a.ph));
    u.body.position.y = hp * 0.07 * amp; u.body.rotation.x = -Math.cos(a.ph) * Math.sign(Math.sin(a.ph)) * 0.25 * amp;
    u.legs.forEach((l, k) => { l.rotation.x = (k < 2 ? 1 : -0.6) * Math.cos(a.ph * 2) * 0.6 * amp; });
    return;
  }
  u.legs.forEach((l, k) => { l.rotation.x = (k === 0 || k === 3 ? 1 : -1) * s * 0.7 * amp; });
  u.body.position.y = Math.abs(Math.cos(a.ph)) * 0.018 * amp;
  u.body.rotation.z = s * 0.04 * amp;
  u.body.rotation.x = idle * (1 - amp);
}

/**
 * Wild fairy critters: glimmerflies, moth-foxes and puffbirds that loop lazily about every found
 * island, dipping and rising. Pure scenery: their paths come from the clock, not from the game.
 */
function syncWild() {
  const S = sun(), seen = new Set();
  for (const isl of ISLANDS) {
    const st = state.islands[isl.id]; if (!st.discovered || st.reveal < 1) continue;
    const n = tune.wildPerIsland + (isl.r > 5 ? 1 : 0), lift = vis.islands[isl.id].g.position.y;
    for (let k = 0; k < n; k++) {
      const key = isl.id * 16 + k, kind = WILD_KINDS[(isl.id + k) % WILD_KINDS.length]; seen.add(key);
      let m = vis.wild.get(key);
      if (!m) { m = makeWild(kind, isl.id + k); R3.scene.add(m); vis.wild.set(key, m); }
      const sp = (kind === 'puffbird' ? 0.22 : 0.14) * (k % 2 ? 1 : -1), ph = key * 2.3, ra = isl.r * (0.45 + ((key * 0.37) % 0.4));
      const pos = (t) => { const a = t * sp + ph; return [isl.cx + Math.cos(a) * ra + Math.sin(a * 2.3) * 0.7, lift + 1.1 + (k % 3) * 0.35 + Math.sin(t * 0.9 + ph) * 0.35, isl.cz + Math.sin(a) * ra * 0.85 + Math.cos(a * 1.7) * 0.6]; };
      const [x, y, z] = pos(state.t), [x2, , z2] = pos(state.t + 0.1), u = m.userData;
      m.position.set(x, y, z); m.rotation.y = Math.atan2(x2 - x, z2 - z);
      u.body.position.y = Math.sin(state.t * (kind === 'mothfox' ? 4.5 : 7) + ph) * 0.04;
      u.wings.forEach(w => { w.rotation.z = w.userData.s * (0.15 + Math.abs(Math.sin(state.t * u.flap + ph)) * 0.9); });
      if (u.halo) u.halo.material.opacity = 0.35 + S.night * 0.6;
    }
  }
  for (const [key, m] of vis.wild) if (!seen.has(key)) { R3.scene.remove(m); vis.wild.delete(key); }
}
function syncFolk() {
  const seen = new Set();
  for (const f of state.folk) {
    seen.add(f.id);
    let m = vis.folk.get(f.id);
    if (m && m.userData.kind !== f.kind) { R3.scene.remove(m); m = null; } // a child grew up
    if (!m) { m = makeFolk(f.kind, f.ci); m.userData.kind = f.kind; m.add(contactShadow(0.42, 0.28)); R3.scene.add(m); vis.folk.set(f.id, m); }
    m.visible = f.mode !== 'inside';
    // A step every ~0.17 units (little ones take quicker, shorter steps); arms swing against the legs.
    const a = gait(m, f.x, f.y, f.z, f.h, f.kind === 'child' ? 24 : 18.5), u = m.userData, b = u.body, s = Math.sin(a.ph), amp = a.amp;
    u.legs[0].rotation.x = s * 0.7 * amp; u.legs[1].rotation.x = -s * 0.7 * amp;
    u.arms[0].rotation.x = -s * 0.6 * amp; u.arms[1].rotation.x = s * 0.6 * amp;
    b.position.y = Math.abs(Math.cos(a.ph)) * 0.025 * amp;
    b.rotation.x = 0.07 * amp; // leans into the walk
    b.rotation.z = s * 0.045 * amp + Math.sin(state.t * 1.5 + f.id) * 0.03 * (1 - amp);
    u.head.rotation.z = -s * 0.04 * amp; u.head.rotation.y = Math.sin(state.t * 0.6 + f.id * 2) * 0.25 * (1 - amp); // looks about when standing
  }
  for (const [id, m] of vis.folk) if (!seen.has(id)) { R3.scene.remove(m); vis.folk.delete(id); }
  const seenP = new Set();
  for (const u of state.puffs) {
    seenP.add(u.id);
    let m = vis.puffs.get(u.id);
    if (!m) { m = makeCloud(u.id, 0.55); const a = makeFolk('adult', u.id % 7), b = makeFolk('adult', (u.id + 3) % 7); a.position.set(-0.15, 0.15, 0); b.position.set(0.15, 0.15, 0); m.add(a, b); R3.scene.add(m); vis.puffs.set(u.id, m); }
    const p = pieceById(u.house), y = p ? vis.islands[p.isl].g.position.y : 0, k = Math.min(1, u.t / tune.arriveTime);
    m.position.set(u.x + Math.sin(u.t * 2) * 0.3 * (1 - k), y + (1 - k * (2 - k)) * 10 - 0.05, u.z);
  }
  for (const [id, m] of vis.puffs) if (!seenP.has(id)) { R3.scene.remove(m); vis.puffs.delete(id); }
  const seenF = new Set();
  for (const f of state.fluff) {
    seenF.add(f.id);
    let m = vis.fluff.get(f.id);
    if (!m) { m = makeFluffkin(); m.add(contactShadow(0.45, 0.28)); R3.scene.add(m); vis.fluff.set(f.id, m); }
    const a = gait(m, f.x, vis.islands[f.isl].g.position.y, f.z, f.h, m.userData.stride);
    animQuad(m, a, Math.max(0, Math.sin(state.t * 0.7 + f.id)) * 0.35); // grazes when it stands
  }
  for (const [id, m] of vis.fluff) if (!seenF.has(id)) { R3.scene.remove(m); vis.fluff.delete(id); }
  const seenP2 = new Set();
  for (const p of state.pets) {
    seenP2.add(p.id);
    let m = vis.pets.get(p.id);
    if (!m) { m = makePet(p.kind, p.ci); if (p.kind !== 'fairy') m.add(contactShadow(0.32, 0.26)); R3.scene.add(m); vis.pets.set(p.id, m); }
    m.visible = !p.inside;
    const u = m.userData, fairy = !!u.fairy;
    if (fairy) { m.position.set(p.x, p.y + 0.42 + Math.sin(state.t * 2.2 + p.id) * 0.08, p.z); m.rotation.y = p.h; }
    else animQuad(m, gait(m, p.x, p.y, p.z, p.h, u.stride), 0);
    if (u.tail) u.tail.rotation.y = Math.sin(state.t * (p.kind === 'dog' ? 14 : 3) + p.id) * (p.kind === 'dog' ? 0.6 : 0.3);
    if (u.wings) u.wings.forEach(w => { w.rotation.y = w.userData.s * (0.3 + Math.abs(Math.sin(state.t * 22 + p.id)) * 0.9); });
  }
  for (const [id, m] of vis.pets) if (!seenP2.has(id)) { R3.scene.remove(m); vis.pets.delete(id); }
}
/** The ghost of the chosen piece under the mouse, pale when it fits and rose when it does not. */
function syncGhost() {
  for (const t in vis.ghost) vis.ghost[t].visible = false;
  if (vis.hl) { vis.hl.visible = false; vis.hl2.visible = false; }
  if (vis.turnArrowG) vis.turnArrowG.visible = false;
  const tool = state.tool;
  if (vis.bm) { vis.bm.a.visible = false; vis.bm.b.visible = false; vis.bm.dots.forEach(d => { d.visible = false; }); }
  state.bridgePreview = '';
  if (state.view !== 'builder' || state.mode !== 'build' || state.modal) return;
  if (tool === 'bridge') { syncBridgeGhost(); return; }
  if (!vis.hover) return;
  if (tool === 'tidy' || tool === 'turn') { syncHighlight(tool); return; }
  if (!PIECES[tool]) return;
  const ray = screenRay(vis.hover.x, vis.hover.y), hit = ray && pickCell(ray);
  if (!hit) return;
  if (!vis.ghost[tool]) {
    const g = makePiece(tool, 1, tool === 'bridge' ? 3 : 1);
    g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.material = new THREE.MeshBasicMaterial({ color: '#fff3c8', transparent: true, opacity: 0.55, depthWrite: false }); } if (o.isSprite) o.visible = false; });
    if (DOORED[tool]) { g.userData.arrow = makeDoorArrow(); g.add(g.userData.arrow); } // which way the front door faces
    R3.scene.add(g); vis.ghost[tool] = g;
  }
  const g = vis.ghost[tool], ok = canPlace(tool, hit) >= 0, ah = anchorFor(tool, hit), n = sizeOf(tool);
  g.visible = true; g.position.set(ah.i + n / 2, vis.islands[hit.isl].g.position.y + 0.02, ah.j + n / 2);
  g.scale.setScalar(PIECES[tool].scale || 1);
  g.rotation.y = placeRot(tool, hit);
  g.traverse(o => { if (o.isMesh && !o.userData.arrow) o.material.color.set(ok ? '#fff3c8' : '#f08aa8'); });
  if (g.userData.arrow) { const a = g.userData.arrow; a.position.z = 0.46 + Math.sin(state.t * 5) * 0.05; a.material.color.set(ok ? '#ffd36e' : '#f08aa8'); }
}
/** A bridge end marker: a ring on the ground, a soft disc inside it, a beam of light and an orb. */
function bridgeMarker() {
  const g = new THREE.Group(), mats = [];
  const mat = (o, extra) => { const m = new THREE.MeshBasicMaterial(Object.assign({ color: '#ffe7a8', transparent: true, opacity: o, depthTest: false, depthWrite: false, side: THREE.DoubleSide }, extra)); mats.push(m); return m; };
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.46, 40), mat(0.95)); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 12;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 40), mat(0.28)); disc.rotation.x = -Math.PI / 2; disc.renderOrder = 11;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 2.6, 16, 1, true), mat(0.32, { blending: THREE.AdditiveBlending, depthTest: true })); beam.position.y = 1.3;
  const orb = glow('#ffe7a8', 0.95, 0.95); orb.position.y = 0.55; orb.renderOrder = 12; orb.material.depthTest = false; mats.push(orb.material);
  g.add(ring, disc, beam, orb); g.userData = { mats, ring, orb }; g.visible = false;
  return g;
}
function markAt(g, x, y, z, col, pulse) {
  g.visible = true; g.position.set(x, y + 0.04, z);
  g.userData.mats.forEach(m => m.color.set(col));
  const k = 1 + Math.sin(state.t * 5 + pulse) * 0.1; g.userData.ring.scale.set(k, k, 1);
  g.userData.orb.position.y = 0.55 + Math.sin(state.t * 3 + pulse) * 0.08;
}
const BRIDGE_DOTS = 72, BRIDGE_OK = '#9df0c8', BRIDGE_BAD = '#f08aa8', BRIDGE_START = '#ffd36e';
/**
 * Bridge tool: a gold ring with a beam of light where the bridge starts, a ring at the cell under
 * the mouse (mint when the bridge can end there, rose when not), and between them a dotted arc
 * that sags like the bridge will, its dots marching from start to end. The hint line says how long
 * the bridge is, or what is in the way.
 */
function syncBridgeGhost() {
  if (!vis.bm) {
    vis.bm = { a: bridgeMarker(), b: bridgeMarker(), dots: [] };
    R3.scene.add(vis.bm.a, vis.bm.b);
    for (let k = 0; k < BRIDGE_DOTS; k++) { const d = glow(BRIDGE_OK, 0.3, 0.95); d.renderOrder = 12; d.material.depthTest = false; d.visible = false; R3.scene.add(d); vis.bm.dots.push(d); }
  }
  const st = state.bridgeStart, ray = vis.hover && screenRay(vis.hover.x, vis.hover.y), hit = ray && pickCell(ray), bm = vis.bm;
  if (st) markAt(bm.a, st.i + 0.5, islandLift(st.isl), st.j + 0.5, BRIDGE_START, 0);
  if (!st) {
    if (!hit) { state.bridgePreview = 'Tap where the bridge starts: at the edge of an island, or beside a river or lake.'; return; }
    const e = bridgeEndOk(hit);
    markAt(bm.b, hit.i + 0.5, islandLift(hit.isl), hit.j + 0.5, e ? BRIDGE_BAD : BRIDGE_START, 0);
    state.bridgePreview = e || 'Tap to start the bridge here.';
    return;
  }
  if (!hit) { state.bridgePreview = 'Now tap where the bridge should end: on another island, or across a river.'; return; }
  if (hit.i === st.i && hit.j === st.j) { state.bridgePreview = 'Tap the start again to cancel, or pick where the bridge should end.'; return; }
  const why = bridgeProblem(st, hit), col = why ? BRIDGE_BAD : BRIDGE_OK;
  markAt(bm.b, hit.i + 0.5, islandLift(hit.isl), hit.j + 0.5, col, 1.5);
  _p1.set(st.i + 0.5, islandLift(st.isl) + 0.18, st.j + 0.5); _p2.set(hit.i + 0.5, islandLift(hit.isl) + 0.18, hit.j + 0.5);
  const span = bridgeSpan(st, hit), len = Math.hypot(_p2.x - _p1.x, _p2.z - _p1.z), n = Math.min(BRIDGE_DOTS, Math.max(4, Math.ceil(len / 0.32))), shift = (state.t * 1.6) % 1;
  for (let k = 0; k < n; k++) {
    const d = bm.dots[k], t = (k + shift) / n;
    bridgeAt(_p1, _p2, t, d.position, humpFor(st.isl === hit.isl, len), span[0], span[1]); d.visible = true; d.material.color.set(col);
    const s2 = 0.22 + 0.12 * Math.sin(Math.PI * t); d.scale.set(s2, s2, 1); d.material.opacity = 0.55 + 0.4 * Math.sin(Math.PI * t);
  }
  state.bridgePreview = why ? why : `A bridge ${Math.round(len)} steps long${len >= tune.bridgeLightMin ? ', lit with lanterns' : ''}. Tap to build it.`;
}
const _box = new THREE.Box3();
/** A selection circle for the ground: a bright ring round a soft disc. */
function selRing() {
  const g = new THREE.Group(), mat = o => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.86, 48), mat(0.18)), ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), mat(0.9));
  for (const m of [disc, ring]) { m.rotation.x = -Math.PI / 2; m.renderOrder = 4; }
  const ticks = new THREE.Group(); // four little marks that turn slowly round the ring
  for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.05), mat(0.95)); t.rotation.x = -Math.PI / 2; t.rotation.z = k * Math.PI / 2; t.position.set(Math.cos(k * Math.PI / 2) * 1.08, 0, -Math.sin(k * Math.PI / 2) * 1.08); t.rotation.z = k * Math.PI / 2 + Math.PI / 2; t.renderOrder = 4; ticks.add(t); }
  g.add(disc, ring, ticks); g.userData = { mats: [disc.material, ring.material, ...ticks.children.map(t => t.material)], ticks }; g.visible = false;
  return g;
}
function showRing(g, x, y, z, r, col) {
  g.visible = true; g.position.set(x, y + 0.035, z);
  const k = r * (1 + Math.sin(state.t * 6) * 0.04); g.scale.set(k, 1, k);
  g.userData.mats.forEach(m => m.color.set(col)); g.userData.ticks.rotation.y = state.t * 0.8;
}
/** Tidy and Turn: a selection circle on the ground under the piece under the mouse (rose to tidy, gold to turn), and the piece pulses. */
function syncHighlight(tool) {
  const ray = screenRay(vis.hover.x, vis.hover.y), hit = ray && pickCell(ray), br = hit && bridgeAtCell(hit.i, hit.j);
  const p = hit && topPieceAt(hit.i, hit.j), m = br ? vis.bridges.get(br.id) : p && vis.pieces.get(p.id);
  if (!m) return;
  const keep = tool === 'tidy' && p && state.families[p.id];
  const col = keep ? '#a8a0c0' : tool === 'tidy' ? '#ff7fa0' : '#ffd36e';
  if (!vis.hl) { vis.hl = selRing(); vis.hl2 = selRing(); R3.scene.add(vis.hl, vis.hl2); }
  if (br) { bridgeEnds(br, _p1, _p2); showRing(vis.hl, _p1.x, _p1.y, _p1.z, 0.45, col); showRing(vis.hl2, _p2.x, _p2.y, _p2.z, 0.45, col); }
  else {
    _box.setFromObject(m); _box.getSize(_v);
    showRing(vis.hl, m.position.x, m.position.y, m.position.z, Math.max(0.38, Math.min(1.8, Math.max(_v.x, _v.z) / 2 + 0.08)), col);
    const pulse = 1 + Math.sin(state.t * 8) * 0.03; m.scale.x *= pulse; m.scale.z *= pulse; // syncPieces sets the scale fresh every frame
  }
  if (p && DOORED[p.type] && tool === 'turn') { // Turn shows where the front door faces now
    if (!vis.turnArrow) { vis.turnArrow = makeDoorArrow(); vis.turnArrowG = new THREE.Group(); vis.turnArrowG.add(vis.turnArrow); R3.scene.add(vis.turnArrowG); }
    const G = vis.turnArrowG; G.visible = true; G.position.copy(m.position); G.rotation.y = p.rot; G.scale.setScalar(PIECES[p.type].scale || 1);
    vis.turnArrow.position.z = 0.46 + Math.sin(state.t * 5) * 0.05;
  }
}

// ---- Little effects: puffs, sparkles, floating words ----------------------------------------------------
function fxPuff(x, y, z, color) {
  if (!R3) return;
  for (let k = 0; k < 5; k++) {
    const m = new THREE.Mesh(R3.fxGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }));
    const a = k / 5 * Math.PI * 2; m.position.set(x + Math.cos(a) * 0.25, y + 0.15, z + Math.sin(a) * 0.25);
    R3.scene.add(m); vis.fx.push({ m, life: 0.7, t: 0, vx: Math.cos(a) * 0.8, vy: 0.6, vz: Math.sin(a) * 0.8, grow: 1.5 });
  }
}
function fxSpark(x, y, z, color, n) {
  if (!R3) return;
  for (let k = 0; k < n; k++) {
    const s = glow(color, 0.45, 1); const a = k / n * Math.PI * 2;
    s.position.set(x, y, z); R3.scene.add(s);
    vis.fx.push({ m: s, life: 1.2 + (k % 3) * 0.2, t: 0, vx: Math.cos(a) * 0.9, vy: 1.2 + (k % 4) * 0.3, vz: Math.sin(a) * 0.9, grow: 0 });
  }
}
/** A soft wisp of chimney smoke: it swells as it rises, sways and leans with the breeze, then fades. */
function fxSmoke(x, y, z) {
  const S = sun(), col = new THREE.Color('#f4eff6').lerp(new THREE.Color('#8f88a8'), S.night * 0.6);
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color: col, transparent: true, opacity: 0, depthWrite: false }));
  m.position.set(x, y, z); m.scale.setScalar(0.18); R3.scene.add(m);
  vis.fx.push({ m, life: 3.6 + (vis.fx.length % 3) * 0.4, t: 0, vx: 0.16, vy: 0.42, vz: 0.06, smoke: true, ph: vis.fx.length * 1.3, x0: x });
}
function fxLabel(x, y, z, text) { vis.fx.push({ label: text, x, y, z, life: 2, t: 0 }); }
function fxStep(dt) {
  weatherFx(dt);
  for (const f of vis.fx) {
    f.t += dt;
    if (f.m) {
      const k = f.t / f.life;
      if (f.smoke) {
        f.m.position.x += (f.vx * (0.4 + k) + Math.sin(f.t * 1.8 + f.ph) * 0.12) * dt; f.m.position.y += f.vy * (1 - k * 0.5) * dt; f.m.position.z += f.vz * dt;
        f.m.material.opacity = 0.62 * Math.min(1, k * 6) * Math.pow(1 - k, 1.3); f.m.scale.setScalar(0.18 + k * 0.85);
        continue;
      }
      f.m.position.x += f.vx * dt; f.m.position.y += f.vy * dt; f.m.position.z += f.vz * dt; f.vy -= dt * 0.8;
      f.m.material.opacity = Math.max(0, 1 - k);
      if (f.grow) f.m.scale.setScalar(1 + k * f.grow);
    } else f.y += dt * 0.5;
  }
  for (const f of vis.fx.filter(f => f.t >= f.life)) { if (f.m) { R3.scene.remove(f.m); f.m.material.dispose(); } }
  vis.fx = vis.fx.filter(f => f.t < f.life);
}

// ---- Voyage drawing ----------------------------------------------------------------------------------
function drawVoyage() {
  const v = state.voyage, B = R3.boat;
  B.position.set(v.x, Math.sin(v.t * 1.6) * 0.2, v.z);
  B.rotation.z = -(v.tx - v.x) * 0.12; B.rotation.y = Math.PI;
  for (const c of R3.vclouds) if (c.position.z > v.z + 12) c.position.z -= 110;
  R3.vfloor.position.z = v.z;
  const k = v.done >= 0 ? Math.min(1, (v.t - v.done) / 2.4) : 0;
  R3.vs.fog.density = 0.04 * (1 - k * 0.8);
  R3.vs.background.set('#cdb8e8').lerp(_c1.set('#ffe9d6'), k); R3.vs.fog.color.copy(R3.vs.background);
  const seen = new Set();
  for (const m of v.motes) {
    seen.add(m.id);
    let g = vis.motes.get(m.id);
    if (!g) { g = makeMote(); R3.vs.add(g); vis.motes.set(m.id, g); }
    g.position.set(m.x, 0.6 + Math.sin(v.t * 2 + m.ph) * 0.3, m.z); g.rotation.y = v.t * 2;
  }
  for (const [id, g] of vis.motes) if (!seen.has(id)) { R3.vs.remove(g); vis.motes.delete(id); }
  R3.vcam.position.set(v.x * 0.6, 2.6, v.z + 7); R3.vcam.lookAt(v.x * 0.8, 1, v.z - 8);
  renderMain(R3.vs, R3.vcam, 0.4);
}

/** Draws play: the world (or the voyage), then the floating words. */
function drawWorld() {
  if (!R3) return;
  if (state.mode === 'voyage' && state.voyage) { drawVoyage(); clearOverlay(); return; }
  for (const [, g] of vis.motes) R3.vs.remove(g); vis.motes.clear();
  R3.cam.position.copy(vis.camPos); R3.cam.lookAt(vis.camLook);
  R3.cam.fov = state.view === 'stroll' ? 60 : 45; R3.cam.updateProjectionMatrix();
  syncSky(); syncIslands(); syncPieces(); syncFolk(); syncWild(); syncAqua(); syncGhost();
  renderMain(R3.scene, R3.cam, state.view === 'builder' ? 1 : state.view === 'postcard' ? 0.8 : 0);
  clearOverlay();
  for (const f of vis.fx) if (f.label) {
    const p = new THREE.Vector3(f.x, f.y, f.z).project(R3.cam);
    if (p.z < 1) labelText(f.label, (p.x + 1) / 2 * W, (1 - p.y) / 2 * H, 18, `rgba(255,246,232,${Math.max(0, 1 - f.t / f.life)})`);
  }
  // Chat bubbles: a small drawn cloud with three dots over sky-folk who stopped to talk.
  if (state.view === 'builder' || state.view === 'stroll') for (const f of state.folk) if (f.chat && f.mode !== 'inside') {
    const p = new THREE.Vector3(f.x, f.y + (f.kind === 'child' ? 0.5 : 0.75), f.z).project(R3.cam);
    if (p.z >= 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) continue;
    const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H, s = Math.max(0.6, Math.min(1.4, 14 / state.cam.dist)), ph = Math.floor(state.t * 3 + f.id) % 3;
    ctx.fillStyle = 'rgba(255,246,232,0.92)'; ctx.beginPath(); ctx.ellipse(x, y - 10 * s, 13 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 3 * s, y - 4 * s); ctx.lineTo(x + 1 * s, y + 2 * s); ctx.lineTo(x + 4 * s, y - 4 * s); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = k === ph ? '#e98c74' : '#7a6a9a'; ctx.beginPath(); ctx.arc(x + (k - 1) * 6 * s, y - 10 * s, 2 * s, 0, Math.PI * 2); ctx.fill(); }
  }
}

// ---- Figures: every unit and piece side by side, named -------------------------------------------------
let FIG = null;
function drawFigures() {
  if (!R3) return;
  if (!FIG) {
    const s = new THREE.Scene(); s.background = new THREE.Color('#e9dcf2');
    s.add(new THREE.HemisphereLight('#ffffff', '#b9a6d6', 1.8));
    const d = new THREE.DirectionalLight('#fff0dc', 2); d.position.set(3, 6, 8); s.add(d);
    const items = [
      ['Sky-folk', makeFolk('adult', 0), 3], ['Little one', makeFolk('child', 1), 3], ['Fluffkin', makeFluffkin(), 3], ['Sky-boat', makeBoat(), 0.75],
      ['Tower house', makeHouse(3, 1, 'tower'), 1.5], ['Mushroom house', makeHouse(5, 1, 'mushroom'), 1.5], ['Fairy cottage', makeHouse(8, 1, 'cottage'), 1.5], ['Tall tower', makeHouse(9, 2, 'tower'), 1.2], ['Tree', makeTree(4), 1.5], ['Flowerbeds, joined', (() => { const g = new THREE.Group(); const a = makeGarden(2, 'bed', 1), b = makeGarden(9, 'bed', 2); a.position.x = -0.5; b.position.x = 0.5; g.add(a, b); return g; })(), 1.1], ['Vegetable patch', makeGarden(2, 'veg'), 1.6], ['Fairy ring', makeGarden(2, 'ring'), 1.6], ['Rose arbour', makeGarden(2, 'arbour'), 1.4],
      ['Lantern', makeLantern(), 1.4], ['Sky bridge, lit', (() => { const b = makeSkyBridge(8, tune.bridgeLightMin, tune.bridgeLightGap, 0, 0.2, 0.8); placeSkyBridge(b, new THREE.Vector3(-4, 1.4, 0), new THREE.Vector3(4, 0, 0)); const g = grp(b); g.add(mk(new THREE.BoxGeometry(2.2, 0.6, 1.4), T(PAL.grass, 'grass'), -3.7, 1.1, 0)); g.add(mk(new THREE.BoxGeometry(2.2, 0.6, 1.4), T(PAL.grass, 'grass'), 3.7, -0.3, 0)); g.rotation.y = -0.5; return g; })(), 0.24], ['Meadows, joined', (() => { const g = new THREE.Group(); const a = makeMeadow(5, 'wild', 1), b = makeMeadow(6, 'wild', 2); a.position.x = -0.5; b.position.x = 0.5; g.add(a, b); return g; })(), 1.1], ['Lavender', makeMeadow(5, 'lavender'), 1.6], ['Clover', makeMeadow(5, 'clover'), 1.6], ['Sunflowers', makeMeadow(5, 'sunny'), 1.4], ['Magic School', makeSchool(2), 1.05], ['Healing House', makeHealer(2), 1.35],
      ['Wind-folk hut', makeHut(2), 1.3], ['Carved stone', makeRuneStone(), 1.3], ['Tribe totem', makeTotem(), 1.1], ['Windmill', makeWindmill(false), 1.0], ['Star Arch', makeArch(), 1.1], ['Broken mill', makeWindmill(true), 1.0], ['Wishing well', makeWell(), 1.2], ['Paths', (() => { const g = new THREE.Group(); [[0, 0, 1 | 4], [1, 0, 2 | 4], [0, 1, 8 | 1], [1, 1, 2 | 8]].forEach(([x, z, m2], k) => { const p2 = makePath(m2, k * 5 + 3); p2.position.set(x - 0.5, 0, z - 0.5); g.add(p2); }); g.rotation.x = 0.5; return g; })(), 0.9], ['Wind Bell', makeBell(), 1.8], ['Star-lamp', makeStarLamp(true), 1.8], ['Light-mote', makeMote(), 1.4],
      ['Dog', makeDog(0), 4], ['Cat', makeCat(0), 4], ['Bunny', makeBunny(0), 4], ['Sky-fairy', makeFairy(0), 4.5],
      ['Glimmerfly', makeGlimmerfly(0), 5], ['Moth-fox', makeMothFox(0), 4.5], ['Puffbird', makePuffbird(0), 4.5], ['Cloud', makeCloud(7, 0.45), 1],
      ['Glowfin', makeGlowfin(0), 5], ['Lily frog', makeLilyFrog(0), 5],
      ['Waterfall', (() => { const g = new THREE.Group(); g.add(mk(new THREE.BoxGeometry(1.4, 0.5, 1.2), T(PAL.grass, 'grass'), 0, -0.25, -0.6)); g.add(mk(new THREE.BoxGeometry(0.86, 0.02, 1.2), '#e6d3b0', 0, 0.01, -0.6)); const w = mk(new THREE.BoxGeometry(0.54, 0.02, 1.2), waterMat(), 0, 0.035, -0.6); g.add(w); const f = makeWaterfall(2.4, 0.54); g.add(f); g.rotation.y = -0.9; return grp(g); })(), 0.6],
      ['Lake', (() => { const l = makeLake([[0, 0], [1, 0], [0, 1]]); l.position.x = -0.5; return grp(l); })(), 0.75], ['River, footbridge', (() => { const g = grp(makeRiver([[-1, -1], [0, -1], [0, 0], [1, 0]], [1, 0])); const fb = makeSkyBridge(1.8, Infinity, 2.6, humpFor(true, 1.8)); placeSkyBridge(fb, new THREE.Vector3(-0.4, 0.03, 0.9), new THREE.Vector3(0.4, 0.03, -0.75)); g.add(fb); return g; })(), 0.6],
    ];
    const cols = 12, labels = [];
    items.forEach(([name, m, sc], k) => {
      const x = (k % cols - (cols - 1) / 2) * 1.62, y = 3.1 - Math.floor(k / cols) * 2.15;
      m.scale.multiplyScalar(sc); m.position.set(x, y - 0.8, 0); m.rotation.y = 0.5; s.add(m);
      labels.push({ name, p: new THREE.Vector3(x, y - 1.15, 0) });
    });
    const c = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100); c.position.set(0, 0.2, 15.5); c.lookAt(0, -0.1, 0);
    R3.fcam = c; FIG = { s, c, labels };
  }
  FIG.c.aspect = innerWidth / innerHeight; FIG.c.updateProjectionMatrix();
  R3.renderer.render(FIG.s, FIG.c);
  clearOverlay();
  for (const l of FIG.labels) { const p = l.p.clone().project(FIG.c); labelText(l.name, (p.x + 1) / 2 * W, (1 - p.y) / 2 * H, 16, '#3a2f55'); }
}

/** The title's backdrop: home island at dawn, the camera drifting. */
function drawTitleWorld() {
  if (!R3) return;
  R3.cam.position.copy(vis.camPos); R3.cam.lookAt(vis.camLook); R3.cam.fov = 45; R3.cam.updateProjectionMatrix();
  syncSky(); syncIslands(); syncPieces(); syncFolk();
  for (const t in vis.ghost) vis.ghost[t].visible = false;
  renderMain(R3.scene, R3.cam, 0.8);
  clearOverlay();
}

// =====================================================================================================
// ---- HUD: drawn icons, big buttons for touch ------------------------------------------------------
// =====================================================================================================
const UI = {};
function iconEl(name, size) {
  const c = document.createElement('canvas'), r = Math.min(3, devicePixelRatio || 1);
  c.width = c.height = Math.round(size * r); c.style.width = c.style.height = size + 'px'; c.className = 'icon';
  drawIcon(c.getContext('2d'), name, size * r); return c;
}
function btn(parent, icon, label, onTap, cls = '') {
  const b = document.createElement('button'); b.className = 'btn ' + cls;
  if (icon) b.appendChild(iconEl(icon, 30));
  if (label) { const s = document.createElement('span'); s.textContent = label; b.appendChild(s); }
  b.addEventListener('click', e => { e.stopPropagation(); startAudio(); onTap(); });
  b.addEventListener('pointerdown', e => e.stopPropagation());
  parent.appendChild(b); return b;
}
function initUI() {
  const $ = id => document.getElementById(id);
  Object.assign(UI, { hud: $('hud'), bar: $('bar'), quest: $('quest'), pop: $('pop'), clock: $('clock'), toasts: $('toasts'), hint: $('hint'), chips: $('chips'),
    modal: $('modal'), title: $('title'), pause: $('pause'), voy: $('voy'), back: $('back'), topBtns: $('topbtns'), camBtns: $('cambtns') });
  $('popicon').appendChild(iconEl('folk', 26));
  // Relics live in the HUD: a slot each, dim until found; tap one to hear its story again.
  UI.relics = {};
  for (const isl of ISLANDS) if (isl.relic) {
    const b = btn($('relics'), isl.relic.kind, '', () => toast(state.relics[isl.relic.kind] ? `${isl.relic.name}: ${isl.relic.text}` : `A relic waits somewhere in the mist${isl.rarity === 'legendary' ? ', far and high' : ''}.`, 5), 'relic-slot');
    b.title = isl.relic.name; UI.relics[isl.relic.kind] = b;
  }
  // Toolbar: category tabs above it; Look, Rotate, Turn and Tidy always on it.
  UI.cats = {}; UI.catRow = $('cats');
  for (const c of TOOL_CATS) UI.cats[c.id] = btn(UI.catRow, c.icon, c.name, () => selectCat(c.id), 'cat');
  UI.catRow.addEventListener('pointerdown', e => e.stopPropagation());
  UI.tools = {};
  for (const t of TOOL_ORDER) {
    const label = t === 'look' ? 'Look' : t === 'tidy' ? 'Tidy' : t === 'turn' ? 'Turn' : PIECES[t].name;
    if (t === 'turn') { UI.spin = btn(UI.bar, 'rotate', 'Rotate', rotatePiece, 'tool spin'); UI.spinIcon = UI.spin.querySelector('canvas'); }
    UI.tools[t] = btn(UI.bar, PIECES[t] ? PIECES[t].icon : t, label, () => selectTool(t), 'tool' + (PIECES[t] ? '' : ' always'));
  }
  // The toolbar scrolls: by touch, mouse wheel, dragging with the mouse, or the arrows at its ends.
  const bar = UI.bar;
  UI.barL = btn(bar, 'chevL', '', () => bar.scrollBy({ left: -240, behavior: 'smooth' }), 'barArrow left');
  bar.insertBefore(UI.barL, bar.firstChild);
  UI.barR = btn(bar, 'chevR', '', () => bar.scrollBy({ left: 240, behavior: 'smooth' }), 'barArrow right');
  bar.addEventListener('wheel', e => { e.preventDefault(); bar.scrollLeft += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; }, { passive: false });
  let drag = null;
  bar.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') drag = { x: e.clientX, s: bar.scrollLeft, moved: false }; }, true);
  addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true; if (drag.moved) bar.scrollLeft = drag.s - dx; });
  addEventListener('pointerup', () => { UI.dragged = !!(drag && drag.moved); drag = null; });
  bar.addEventListener('click', e => { if (UI.dragged) { UI.dragged = false; e.stopPropagation(); e.preventDefault(); } }, true);
  // Test mode: a weather picker under the clock.
  UI.weatherRow = document.createElement('div'); UI.weatherRow.className = 'wrow'; $('tl').appendChild(UI.weatherRow);
  UI.weatherBtns = {};
  for (const k of WEATHERS) UI.weatherBtns[k] = btn(UI.weatherRow, null, WEATHER_NAMES[k], () => setWeather(k), 'wbtn');
  UI.weatherRow.addEventListener('pointerdown', e => e.stopPropagation());
  UI.viewBtn = btn(UI.topBtns, 'builder', 'Builder', cycleView, 'small');
  UI.musicBtn = btn(UI.topBtns, 'music', '', () => { const p = document.getElementById('musicpanel'); show(p, p.style.display === 'none'); }, 'small icononly');
  // Music panel: the track, the next one, and how loud the music and the sounds are.
  const mp = document.getElementById('musicpanel');
  UI.trackName = document.getElementById('mptrack');
  btn(document.getElementById('mpnext'), 'music', 'Next song', nextTrack, 'small');
  for (const [id, key] of [['mpmusic', 'musicVolume'], ['mpsfx', 'sfxVolume']]) {
    const el = document.getElementById(id); el.value = CONFIG[key].value;
    el.addEventListener('input', () => { CONFIG[key].value = Number(el.value); });
    el.addEventListener('pointerdown', e => e.stopPropagation());
  }
  mp.addEventListener('pointerdown', e => e.stopPropagation());
  UI.muteBtn = btn(UI.topBtns, 'sound', '', () => setMuted(!muted), 'small icononly');
  btn(UI.topBtns, 'pause', '', () => { hit.add('KeyP'); }, 'small icononly');
  btn(UI.camBtns, 'turnL', '', () => { state.cam.yaw += 0.5; }, 'round');
  btn(UI.camBtns, 'turnR', '', () => { state.cam.yaw -= 0.5; }, 'round');
  btn(UI.camBtns, 'zoomIn', '', () => zoom(0.8), 'round');
  btn(UI.camBtns, 'zoomOut', '', () => zoom(1.25), 'round');
  UI.sail = btn($('sailwrap'), 'boat', 'Set sail', startVoyage, 'sail');
  btn(UI.back, 'builder', 'Back', () => setView('builder'), 'small');
  btn($('begin'), null, 'Begin', () => hit.add('Enter'), 'big');
  btn($('begin'), null, 'Random sky', () => startOver(true), 'big ghost');
  btn($('begin'), null, 'Test mode', startTest, 'big ghost');
  btn($('pausebtns'), null, 'Resume', () => hit.add('KeyP'), 'big');
  btn($('pausebtns'), null, 'Start over: same sky', () => startOver(false), 'big ghost');
  btn($('pausebtns'), null, 'Start over: new random sky', () => startOver(true), 'big ghost');
  btn($('pausebtns'), null, 'Test mode: everything unlocked', startTest, 'big ghost');
  UI.qBtn = btn($('pausebtns'), null, 'Graphics: ' + (GFX.high ? 'High' : 'Low'), () => { setQuality(!GFX.high); UI.qBtn.querySelector('span').textContent = 'Graphics: ' + (GFX.high ? 'High' : 'Low'); }, 'big ghost');
  UI.modalBtn = btn($('modalbtn'), null, 'OK', closeModal, 'big');
  $('modalicon').appendChild(UI.modalIcon = iconEl('island', 64));
  UI.motes = [];
  for (let k = 0; k < 15; k++) { const c = iconEl('mote', 30); $('motes').appendChild(c); UI.motes.push(c); }
  UI.last = {};
}
function setText(el, key, txt) { if (UI.last[key] !== txt) { UI.last[key] = txt; el.textContent = txt; } }
function setHTML(el, key, h) { if (UI.last[key] !== h) { UI.last[key] = h; el.innerHTML = h; } }
function show(el, on) { const v = on ? '' : 'none'; if (el.style.display !== v) el.style.display = v; }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
/** Updates the HUD from the state; touches the page only when something changed. */
function updateUI() {
  if (!UI.hud) return;
  const play = scene === 'play', voy = play && state.mode === 'voyage';
  show(UI.title, scene === 'title'); show(UI.pause, scene === 'pause');
  show(UI.hud, play && !voy && state.view !== 'postcard'); show(UI.voy, voy); show(UI.back, play && !voy && state.view === 'postcard');
  show(UI.bar, play && !voy && state.view === 'builder'); show(UI.catRow, play && !voy && state.view === 'builder'); show(UI.camBtns, play && !voy && state.view === 'builder');
  if (scene === 'figures') { show(UI.title, false); return; }
  if (voy) {
    const v = state.voyage;
    UI.motes.forEach((c, k) => { show(c, k < v.need); c.style.opacity = k < v.caught ? '1' : '0.28'; });
    setText(document.getElementById('voytext'), 'voytext', v.done >= 0 ? 'The mist parts...' : `Catch the light-motes to find the way: ${v.caught} / ${v.need}`);
  }
  if (!play) return;
  setText(UI.pop, 'pop', `${pop()} sky-folk`);
  for (const k in UI.relics) UI.relics[k].classList.toggle('found', !!state.relics[k]);
  const w = state.weather.kind;
  show(UI.weatherRow, !!state.test); document.body.classList.toggle('testing', !!state.test);
  // The island list sits just under the top-left panel (which grows in test mode); a narrow phone keeps it at the bottom.
  if (innerWidth > 600) { const tlB = Math.round(document.getElementById('tl').getBoundingClientRect().bottom); if (UI.last.chipTop !== tlB) { UI.last.chipTop = tlB; UI.chips.style.top = (tlB + 8) + 'px'; UI.chips.style.bottom = 'auto'; } }
  else if (UI.last.chipTop) { UI.last.chipTop = 0; UI.chips.style.top = ''; UI.chips.style.bottom = ''; }
  if (state.test) for (const k of WEATHERS) UI.weatherBtns[k].classList.toggle('on', state.weather.kind === k);
  setText(UI.clock, 'clock', (state.test ? 'Test mode · ' : '') + dayName() + (w === 'clear' ? '' : w === 'rain' ? ' · Rain' : w === 'thunder' ? ' · Thunderstorm' : ' · Snow'));
  const g = questProgress();
  let qh;
  if (!g) qh = `<div class="qt">The mist has parted</div><div class="ql">Build, wander and watch the sky.</div>`;
  else {
    const line = (ok, txt) => `<div class="ql ${ok ? 'ok' : ''}"><i class="tick"></i>${esc(txt)}</div>`;
    qh = `<div class="qt">Quest ${state.quest + 1} of ${QUESTS.length}: sight a hidden island</div>` +
      line(g.pop >= g.popNeed, `Sky-folk ${Math.min(g.pop, g.popNeed)} / ${g.popNeed}`) +
      line(g.task >= g.taskNeed, `${g.q.taskText(g.taskNeed)} (${Math.min(g.task, g.taskNeed)} / ${g.taskNeed})`);
  }
  setHTML(UI.quest, 'quest', qh);
  show(UI.sail, state.questReady);
  for (const t of TOOL_ORDER) { const b = UI.tools[t]; show(b, !!state.unlocked[t] && toolInView(t)); b.classList.toggle('on', state.tool === t); }
  for (const c of TOOL_CATS) { const b = UI.cats[c.id]; show(b, c.tools.some(t => state.unlocked[t])); b.classList.toggle('on', state.cat === c.id); }
  const over = UI.bar.scrollWidth > UI.bar.clientWidth + 4;
  show(UI.barL, over && UI.bar.scrollLeft > 4); show(UI.barR, over && UI.bar.scrollLeft + UI.bar.clientWidth < UI.bar.scrollWidth - 4);
  const canSpin = PIECES[state.tool] && !PIECES[state.tool].flat && state.tool !== 'bridge';
  show(UI.spin, canSpin);
  if (canSpin) UI.spinIcon.style.transform = `rotate(${-state.rot}rad)`;
  setText(UI.trackName, 'track', TRACKS[state.track].name);
  setHTML(UI.toasts, 'toasts', state.toasts.map(t => `<div class="toast">${esc(t.text)}</div>`).join(''));
  setText(UI.hint, 'hint', state.hint); show(UI.hint, !!state.hint && state.view === 'builder');
  const chips = ISLANDS.filter(i => state.islands[i.id].discovered);
  if (UI.last.chips !== chips.length) {
    UI.last.chips = chips.length; UI.chips.innerHTML = '';
    if (chips.length > 1) chips.forEach(i => btn(UI.chips, null, i.name, () => { setView('builder'); state.cam.tx = i.cx; state.cam.tz = i.cz; }, 'chip').style.setProperty('--dot', RARITY[i.rarity].color));
  }
  const vn = state.view, vk = 'view' + vn;
  if (UI.last.view !== vk) { UI.last.view = vk; UI.viewBtn.innerHTML = ''; UI.viewBtn.appendChild(iconEl(vn, 30)); const s = document.createElement('span'); s.textContent = vn === 'builder' ? 'Builder' : vn === 'stroll' ? 'Stroll' : 'Postcard'; UI.viewBtn.appendChild(s); }
  const mk2 = muted ? 'muted' : 'sound';
  if (UI.last.mute !== mk2) { UI.last.mute = mk2; UI.muteBtn.innerHTML = ''; UI.muteBtn.appendChild(iconEl(mk2, 30)); }
  // The story card.
  const m = state.modal;
  show(UI.modal, !!m);
  if (m) {
    const key = JSON.stringify(m);
    if (UI.last.modal !== key) {
      UI.last.modal = key;
      const isl = ISLANDS[m.island] || ISLANDS[0];
      let icon = 'island', h = '', btnTxt = 'OK';
      if (m.kind === 'story') {
        const rar = RARITY[isl.rarity];
        h = `<div class="rar" style="--rc:${rar.color}">${esc(rar.label)}</div><h2>${esc(isl.name)}</h2>` + isl.story.map(p => `<p>${esc(p)}</p>`).join('');
        if (isl.relic) { h += `<div class="relic"><b>${esc(isl.relic.name)}</b><p>${esc(isl.relic.text)}</p></div>`; icon = isl.relic.kind; btnTxt = 'Bring it home'; }
        else btnTxt = 'Wander ashore';
        h += `<p class="soft">You can build on ${esc(isl.name)} now.</p>`;
      } else if (m.kind === 'secret') {
        h = `<div class="rar" style="--rc:#cfe0ff">A secret of ${esc(isl.name)}</div><h2>${esc(isl.secret.title)}</h2><p>${esc(isl.secret.text)}</p><div class="relic"><b>New piece: ${esc(PIECES[isl.secret.bonus].name)}</b></div>`;
        icon = isl.secret.bonus; btnTxt = 'Keep it';
      } else {
        h = `<div class="rar" style="--rc:#f5c76b">Abovea</div><h2>The sky remembers</h2><p>Every island you found is part of Abovea again: ${esc(state.found.join(', '))}.</p><p>There is no rush and nowhere you must go. Build, wander, and watch the stars your lamp remembers.</p>`;
        icon = 'starlamp'; btnTxt = 'Keep building';
      }
      document.getElementById('modaltext').innerHTML = h;
      UI.modalIcon.getContext('2d').clearRect(0, 0, UI.modalIcon.width, UI.modalIcon.height);
      drawIcon(UI.modalIcon.getContext('2d'), icon, UI.modalIcon.width);
      UI.modalBtn.querySelector('span').textContent = btnTxt;
    }
  } else UI.last.modal = '';
}
/** After a restart: drop every mesh that belonged to the old sky. */
/**
 * A new game. random: a fresh random sky (new island places, shapes, sizes, mountains and rivers);
 * otherwise the same sky as now, emptied.
 */
let skyDraws = 0; // how many random skies this session has drawn: each draw is new
function startOver(random) {
  skyDraws++;
  const ws = random ? 1 + Math.floor(worldRand((WORLD_SEED * 31 + skyDraws * 7919 + Math.floor(state.t * 60)) >>> 0)() * 2147483646) : WORLD_SEED;
  if (ws !== WORLD_SEED) generateWorld(ws);
  reset(); resetWorld(); buildIslandMeshes(); scene = 'play';
  if (random) toast('A new sky drifts into view.', 4);
}
/**
 * Test mode: a fresh game with everything open: every piece and tool, every island found, both
 * relics home and every quest done. A badge says it is test mode.
 */
const WEATHERS = ['clear', 'rain', 'thunder', 'snow'], WEATHER_NAMES = { clear: 'Clear', rain: 'Rain', thunder: 'Thunderstorm', snow: 'Snow' };
/** Test mode: sets the weather now. Rain and snow build up and die away as they always do. */
function setWeather(kind) {
  const w = state.weather;
  if (kind === 'clear') { if (w.kind !== 'clear') w.last = w.kind; w.kind = 'clear'; w.next = state.t + tune.weatherEvery; }
  else { w.kind = kind; w.last = kind; w.until = state.t + tune.weatherLength; if (!w.count) w.count = 1; }
  toast('Weather: ' + WEATHER_NAMES[kind] + (kind === 'clear' ? '. The sky clears slowly.' : '.'), 2.5); sfx.ui();
  events.push({ type: 'weather', kind });
}
function startTest() {
  startOver(false);
  state.test = true;
  for (const t of TOOL_ORDER) state.unlocked[t] = 1;
  state.islands.forEach(s => { s.discovered = true; s.reveal = 1; s.relicTaken = !!ISLANDS[state.islands.indexOf(s)].relic; });
  state.relics.bell = true; state.relics.starlamp = true;
  state.quest = QUESTS.length; state.questReady = false; state.ended = true;
  state.found = ISLANDS.slice(1).map(i => i.name); state.gained = 'Found: ' + state.found.join(', ');
  state.cam.dist = Math.max(state.cam.dist, 26);
  toast('Test mode: everything is unlocked.', 4);
  events.push({ type: 'testmode' });
}
function resetWorld() {
  if (!R3) return;
  for (const map of [vis.pieces, vis.folk, vis.fluff, vis.puffs, vis.bridges, vis.pets, vis.wild]) { for (const [, m] of map) R3.scene.remove(m); map.clear(); }
  vis.islands.forEach(v => { v.disc = null; }); vis.tuftVer = null;
  UI.last = {}; resetMusic();
}

// =====================================================================================================
// ---- Sound: a soft procedural score and gentle effects (Web Audio) --------------------------------
// =====================================================================================================
let bus = null, noiseBuf = null;
const mus = { next: 0, beat: 0, last: 76, seed: 7 };
function musRand() { mus.seed = (mus.seed * 16807) % 2147483647; return mus.seed / 2147483647; } // music only, never gameplay
/**
 * The mix: music through a gentle compressor, with a long generated reverb and a tempo echo
 * shared by music and sounds; a looping rain bed.
 */
function ensureBus() {
  if (!audio || bus) return !!bus;
  const ac = audio.ac, music = ac.createGain(), fx = ac.createGain(), comp = ac.createDynamicsCompressor();
  music.gain.value = tune.musicVolume; fx.gain.value = tune.sfxVolume;
  comp.threshold.value = -20; comp.knee.value = 18; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
  music.connect(comp); comp.connect(audio.out); fx.connect(audio.out);
  // Reverb: a 3.4 s stereo tail of decaying noise.
  const len = Math.floor(ac.sampleRate * 3.4), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let s = 11 + ch * 7; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 1073741823.5 - 1) * Math.pow(1 - i / len, 2.6); } }
  const verb = ac.createConvolver(); verb.buffer = ir;
  const verbIn = ac.createGain(), verbOut = ac.createGain(); verbOut.gain.value = 0.9;
  const verbLP = ac.createBiquadFilter(); verbLP.type = 'lowpass'; verbLP.frequency.value = 5200;
  verbIn.connect(verb); verb.connect(verbLP); verbLP.connect(verbOut); verbOut.connect(comp);
  // Echo: dotted eighths, softened, fed into the reverb.
  const delay = ac.createDelay(2), fb = ac.createGain(), dlp = ac.createBiquadFilter();
  delay.delayTime.value = 0.58; fb.gain.value = 0.3; dlp.type = 'lowpass'; dlp.frequency.value = 2400;
  delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(verbIn);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); let s = 1; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = s / 1073741823.5 - 1; }
  const rainSrc = ac.createBufferSource(); rainSrc.buffer = noiseBuf; rainSrc.loop = true;
  const rbp = ac.createBiquadFilter(); rbp.type = 'bandpass'; rbp.frequency.value = 1400; rbp.Q.value = 0.6;
  const rg = ac.createGain(); rg.gain.value = 0; rainSrc.connect(rbp); rbp.connect(rg); rg.connect(audio.out); rainSrc.start();
  bus = { music, fx, delay, verb: verbIn, rainGain: rg };
  return true;
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
/** Routes a voice's output to its bus, with reverb and echo sends and a stereo place. */
function route(node, dest, verb = 0, echo = 0, pan = 0) {
  const ac = audio.ac; let out = node;
  if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; node.connect(p); out = p; }
  out.connect(dest);
  if (verb) { const g = ac.createGain(); g.gain.value = verb; out.connect(g); g.connect(bus.verb); }
  if (echo) { const g = ac.createGain(); g.gain.value = echo; out.connect(g); g.connect(bus.delay); }
}
/** A simple enveloped oscillator (sounds only). */
function voice(freq, t, dur, type, vol, dest, attack = 0.01, send = 0) {
  const ac = audio.ac, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
  o.connect(g); route(g, dest, 0.3, send * 0.5);
  o.start(t); o.stop(t + attack + dur + 0.05);
}
/** Electric piano: a soft FM tine, bright at the strike and mellow as it rings. */
function epiano(freq, t, vol, dest, pan = 0, dur = 2.2) {
  const ac = audio.ac, c = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
  const tine = ac.createOscillator(), tg = ac.createGain();
  c.type = 'sine'; m.type = 'sine'; c.frequency.value = freq; m.frequency.value = freq;
  mg.gain.setValueAtTime(freq * 1.4, t); mg.gain.exponentialRampToValueAtTime(freq * 0.15, t + 0.9);
  m.connect(mg); mg.connect(c.frequency);
  tine.frequency.value = freq * 4; tg.gain.setValueAtTime(vol * 0.12, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  c.connect(g); tine.connect(tg); tg.connect(g); route(g, dest, 0.45, 0.22, pan);
  for (const o of [c, m, tine]) { o.start(t); o.stop(t + dur + 0.05); }
}
/** A warm pad: two detuned saws per note through a slowly opening low-pass. */
function pad(notes, t, dur, vol, bright = 900) {
  const ac = audio.ac, f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = 'lowpass'; f.Q.value = 0.6; f.frequency.setValueAtTime(bright * 0.6, t); f.frequency.linearRampToValueAtTime(bright, t + dur * 0.5); f.frequency.linearRampToValueAtTime(bright * 0.7, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 2.2); g.gain.setValueAtTime(vol, t + dur - 1.2); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.6);
  f.connect(g); route(g, bus.music, 0.6, 0);
  notes.forEach((n, k) => [-7, 7].forEach(cents => {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = cents + (k - 1.5) * 2;
    o.connect(f); o.start(t); o.stop(t + dur + 1.8);
  }));
}
/** A round sub bass. */
function sub(freq, t, dur, vol) {
  const ac = audio.ac, o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = freq; o2.type = 'triangle'; o2.frequency.value = freq * 2;
  const g2 = ac.createGain(); g2.gain.value = 0.15; o2.connect(g2); g2.connect(f); o.connect(f);
  f.type = 'lowpass'; f.frequency.value = 320;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  f.connect(g); route(g, bus.music);
  o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
}
/** Soft drums: a padded kick, a brushed hat and a rim. */
function kick(t, vol, dest = bus.music) {
  const ac = audio.ac, o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(115, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  o.connect(g); route(g, dest); o.start(t); o.stop(t + 0.4);
}
function noisePart(t, dur, vol, freq, type, dest, verb = 0, q = 0.8, pan = 0) {
  const ac = audio.ac, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); route(g, dest, verb, 0, pan); s.start(t, (t * 7.3) % 1.5); s.stop(t + dur + 0.05);
}
function noiseHit(t, dur, vol, freq, type = 'lowpass') { noisePart(t, dur, vol, freq, type, bus.fx, 0.2); }
/** FM bell for the Wind Bell's song and the chimes. */
function bellVoice(freq, t, dur, vol, dest, pan = 0) {
  const ac = audio.ac, c = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
  c.frequency.value = freq; m.frequency.value = freq * 3.5; mg.gain.setValueAtTime(freq * 1.6, t); mg.gain.exponentialRampToValueAtTime(1, t + dur);
  m.connect(mg); mg.connect(c.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  c.connect(g); route(g, dest, 0.6, 0.3, pan);
  c.start(t); m.start(t); c.stop(t + dur + 0.05); m.stop(t + dur + 0.05);
}
function resetMusic() { mus.next = 0; mus.beat = 0; }
/**
 * The songs. Morning Hearth: lo-fi, 78 bpm, warm pads, electric piano, sub and a swung beat by day.
 * Song of the Wind Bell: ambient, 66 bpm, bells over pads, no drums.
 */
const SONGS = {
  home: { bpm: 78, beat: true, bass: [41, 40, 38, 36], chords: [[57, 60, 64, 67], [55, 59, 62, 67], [57, 60, 62, 65], [55, 59, 62, 64]], scale: [72, 74, 76, 79, 81, 84], bright: 1100 },
  bell: { bpm: 66, beat: false, bass: [38, 34, 41, 36], chords: [[57, 60, 64, 65], [57, 62, 65, 69], [57, 60, 64, 67], [55, 60, 64, 69]], scale: [74, 77, 79, 81, 84, 86, 89], bright: 1500 },
};
/** Schedules the score a little ahead of the audio clock, eighth by eighth. */
function musicStep() {
  if (!audio || audio.ac.state !== 'running' || !ensureBus()) return;
  bus.music.gain.value = tune.musicVolume; bus.fx.gain.value = tune.sfxVolume;
  const w = state ? state.weather : null;
  bus.rainGain.gain.value = w && (fallingKind() === 'rain' || fallingKind() === 'thunder') && scene === 'play' && state.mode !== 'voyage' ? w.amt * 0.12 : 0;
  const ac = audio.ac, now = ac.currentTime, song = SONGS[state && state.track] || SONGS.home, bl = 60 / song.bpm / 2;
  bus.delay.delayTime.value = bl * 1.5;
  if (mus.next < now) mus.next = now + 0.08;
  const night = state ? sun().night : 0, drums = song.beat ? Math.max(0, 1 - night * 1.6) * (w && w.kind === 'thunder' ? 0.4 : 1) : 0;
  while (mus.next < now + 0.35) {
    const t = mus.next, b = mus.beat % 64, bar = Math.floor(b / 16), pos = b % 16, chord = song.chords[bar], root = song.bass[bar];
    const swing = pos % 2 ? bl * 0.16 : 0;
    if (pos === 0) pad(chord, t, bl * 16, 0.022, song.bright * (1 - night * 0.35));
    // Bass: the root, a push before the half, then the fifth.
    if (pos === 0) sub(mtof(root), t, bl * 5.5, 0.16);
    if (pos === 6 && song.beat) sub(mtof(root), t + swing, bl * 1.6, 0.11);
    if (pos === 8) sub(mtof(root + 7), t, bl * 6, 0.13);
    // Electric piano comps: off-beat stabs, strummed a little.
    if (song.beat && (pos === 2 || pos === 10 || (pos === 7 && musRand() < 0.5))) chord.forEach((n, k) => epiano(mtof(n), t + swing + k * 0.012, pos === 7 ? 0.018 : 0.028, bus.music, (k - 1.5) * 0.15, 1.6));
    if (!song.beat && pos % 4 === 0 && musRand() < 0.5) bellVoice(mtof(chord[(pos / 4) % chord.length] + 12), t, 3, 0.03, bus.music, (musRand() - 0.5) * 0.6);
    // Melody: sparse phrases that walk the scale, quieter at night.
    const p = (song.beat ? 0.3 : 0.26) * (1 - night * 0.45);
    if (pos % 2 === 0 && (b % 32) < 26 && musRand() < p) {
      let idx = song.scale.indexOf(mus.last); if (idx < 0) idx = 2;
      idx = Math.max(0, Math.min(song.scale.length - 1, idx + Math.round((musRand() - 0.5) * 3.2)));
      const n = song.scale[idx]; mus.last = n;
      if (song.beat) epiano(mtof(n), t, 0.06, bus.music, 0.2, 2.6);
      else bellVoice(mtof(n), t, 3.2, 0.055, bus.music, 0.25);
    }
    // Drums by day: kick, rim on the backbeat, swung brushed hats.
    if (drums > 0.02) {
      if (pos % 8 === 0 || pos === 5 || (pos === 13 && musRand() < 0.4)) kick(t, 0.2 * drums);
      if (pos % 8 === 4) noisePart(t, 0.14, 0.05 * drums, 2100, 'bandpass', bus.music, 0.35, 1.2, 0.1);
      if (pos % 2 === 1) noisePart(t + swing, 0.05, (pos % 4 === 3 ? 0.03 : 0.018) * drums, 7500, 'highpass', bus.music, 0.1, 0.7, -0.25);
    }
    mus.beat++; mus.next += bl;
  }
}
const sfx = {
  ok() { return audio && audio.ac.state === 'running' && ensureBus(); },
  t() { return audio.ac.currentTime + 0.01; },
  place(type) { if (!this.ok()) return; const t = this.t();
    if (PIECES[type] && PIECES[type].kind === 'living') { epiano(mtof(79), t, 0.07, bus.fx, 0.1, 1.2); epiano(mtof(84), t + 0.07, 0.05, bus.fx, -0.1, 1.2); }
    else { kick(t, 0.12, bus.fx); noiseHit(t, 0.06, 0.06, 1400); epiano(mtof(72), t + 0.04, 0.05, bus.fx, 0, 1.2); } },
  tidy() { if (!this.ok()) return; noiseHit(this.t(), 0.3, 0.08, 2400, 'bandpass'); },
  grow() { if (!this.ok()) return; const t = this.t(); [76, 83].forEach((n, k) => epiano(mtof(n), t + k * 0.09, 0.04, bus.fx, 0, 1.5)); },
  arrive() { if (!this.ok()) return; const t = this.t(); [79, 84, 88].forEach((n, k) => bellVoice(mtof(n), t + k * 0.12, 1.4, 0.03, bus.fx)); },
  moveIn() { if (!this.ok()) return; const t = this.t(); [72, 76, 79, 84].forEach((n, k) => epiano(mtof(n), t + k * 0.1, 0.06, bus.fx, (k - 1.5) * 0.2, 1.8)); },
  birth() { if (!this.ok()) return; const t = this.t(); [84, 88, 91].forEach((n, k) => bellVoice(mtof(n), t + k * 0.14, 1.4, 0.04, bus.fx)); },
  unlock() { if (!this.ok()) return; const t = this.t(); [79, 84].forEach((n, k) => epiano(mtof(n), t + k * 0.12, 0.06, bus.fx, 0, 1.4)); },
  ready() { if (!this.ok()) return; const t = this.t(); [72, 76, 79, 83, 86].forEach((n, k) => bellVoice(mtof(n), t + k * 0.15, 1.8, 0.04, bus.fx, (k - 2) * 0.2)); },
  sail() { if (!this.ok()) return; noiseHit(this.t(), 1.4, 0.1, 600, 'bandpass'); },
  mote(n) { if (!this.ok()) return; const s = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93]; bellVoice(mtof(s[(n - 1) % s.length]), this.t(), 1.4, 0.06, bus.fx); },
  discover() { if (!this.ok()) return; const t = this.t(); [60, 67, 72, 76, 79, 84].forEach((n, k) => epiano(mtof(n), t + k * 0.11, 0.05, bus.fx, (k - 2.5) * 0.15, 2.4)); },
  secret() { if (!this.ok()) return; const t = this.t(); [88, 84, 91, 96].forEach((n, k) => bellVoice(mtof(n), t + k * 0.12, 1.6, 0.035, bus.fx)); },
  bell() { if (!this.ok()) return; const t = this.t(); bellVoice(mtof(62), t, 4, 0.1, bus.fx); bellVoice(mtof(69), t + 0.6, 3.5, 0.07, bus.fx); },
  thunder() { if (!this.ok()) return; const t = this.t() + 0.4; noiseHit(t, 2.6, 0.35, 140); noiseHit(t + 0.2, 1.8, 0.2, 90); },
  ui() { if (!this.ok()) return; epiano(mtof(84), this.t(), 0.025, bus.fx, 0, 0.4); },
};
