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
/**
 * Names every island for this sky from its own stream (so the layout's draws stay as they were):
 * the same seed gives the same names. A name is rerolled when it is over 12 letters, when the
 * prefix ends on the letter the suffix starts with, when a part is already used in this sky, or
 * when it is a plain word; after 20 tries the prefix stands alone.
 */
function nameIslands(ws) {
  const R = worldRand(((ws || 12345) ^ 0x51A7) >>> 0), usedP = new Set(), usedS = new Set(), at = a => a[Math.floor(R() * a.length)];
  ISLANDS.forEach((isl, k) => {
    const L = ISLAND_NAME_PARTS[k] || ISLAND_NAME_PARTS[3]; let name = '', p = '', s = '';
    for (let t = 0; t < 20; t++) {
      p = at(L.pre); s = at(L.suf); const two = R() < (L.two || 0);
      name = two ? p + ' ' + s[0].toUpperCase() + s.slice(1) : p + s;
      if (name.length > 12 || p.slice(-1).toLowerCase() === s[0] || usedP.has(p) || usedS.has(s) || ISLAND_NAME_BLOCK.includes(name)) { name = ''; continue; }
      break;
    }
    if (!name) { name = p; }
    usedP.add(p); usedS.add(s); isl.name = name;
  });
}
function generateWorld(ws) {
  WORLD_SEED = ws;
  const R = worldRand(ws || 12345);
  ISLANDS.forEach((isl, k) => {
    const d = DEFAULT_LAYOUT[k];
    Object.assign(isl, { cx: d.cx * tune.islandSpread, cz: d.cz * tune.islandSpread, y: d.y, r: d.r * tune.islandScale, ph: d.ph, seed: d.seed, k0: 0, k1: 0.1, k2: 0.06 });
    isl.features = d.features.map(f => ({ ...f })); isl.secret.a = d.secret.a; isl.secret.f = d.secret.f;
  });
  if (ws) {
    const home = ISLANDS[0];
    Object.assign(home, { r: (tune.homeSizeMin + R() * (tune.homeSizeMax - tune.homeSizeMin)) * tune.islandScale, ph: R() * 6.28, k0: R() * 0.14, k1: 0.04 + R() * 0.12, k2: 0.02 + R() * 0.08, seed: 1 + Math.floor(R() * 999) });
    // Two rings round home: four islands near, four farther out between them; the legendary one always far.
    const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
    const rest = shuffle(ISLANDS.slice(1).filter(i => i.rarity !== 'legendary')), inner = rest.slice(0, 4), outer = shuffle([...rest.slice(4), ...ISLANDS.filter(i => i.rarity === 'legendary')]);
    const place = (isl, ang, far) => {
      const minR = isl.rarity === 'legendary' ? 4.2 : 3.2;
      const r = (minR + R() * (tune.islandSizeMax - minR)) * tune.islandScale;
      const d = home.r + r + tune.islandGapMin + R() * (tune.islandGapMax - tune.islandGapMin) + (far ? tune.islandSizeMax * tune.islandScale + tune.outerRingGap : 0);
      Object.assign(isl, { r, cx: Math.cos(ang) * d, cz: Math.sin(ang) * d, y: tune.skyLowest + R() * (tune.skyHighest - tune.skyLowest), ph: R() * 6.28,
        k0: R() * 0.16, k1: 0.04 + R() * 0.12, k2: 0.02 + R() * 0.08, seed: 1 + Math.floor(R() * 999) });
      isl.features.forEach((f, j) => { if (j) f.a = R() * 6.28; });
      isl.secret.a = R() * 6.28;
    };
    inner.forEach((isl, k) => place(isl, k * Math.PI / 2 + R() * 0.5, false));
    outer.forEach((isl, k) => place(isl, Math.PI / 4 + k * Math.PI / 2 + R() * 0.5, true));
    // keep open sky between any two: an outer island too near another drifts outward
    for (let pass = 0; pass < 4; pass++) for (const a of outer) for (const b of ISLANDS) {
      if (a === b) continue;
      const gap = Math.hypot(a.cx - b.cx, a.cz - b.cz) - a.r - b.r - tune.islandMinGap;
      if (gap < 0) { const d = Math.hypot(a.cx, a.cz), k = (d - gap) / d; a.cx *= k; a.cz *= k; }
    }
  }
  nameIslands(ws);
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
  if (isl.id !== 0 && !isl.lake && R() >= tune.lakeChance) return; // home and a lake island always have one
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
  // A river always rises at a mountain: an island that gets one but drew no mountain gets a small one for it.
  const wantRiver = isl.id === 0 ? true : isl.r >= 3.4 && R() < tune.riverChance;
  let nM = isl.id === 0 ? tune.homeMountains + (R() < tune.extraMountainChance ? 1 : 0) : (isl.r >= 3.8 && R() < tune.extraMountainChance ? 1 : 0);
  const forRiver = wantRiver && nM === 0; if (forRiver) nM = 1;
  for (let m = 0; m < nM; m++) {
    const a = R() * 6.28, f = forRiver ? 0.45 + R() * 0.15 : 0.5 + R() * 0.25, px = isl.cx + Math.cos(a) * f * isl.r, pz = isl.cz + Math.sin(a) * f * isl.r;
    let seed = null, bd = 1e9;
    for (const c of isl.cells) { const d = Math.hypot(c[0] + 0.5 - px, c[1] + 0.5 - pz); if (d < bd && !TERRAIN.has(K(c[0], c[1])) && ctr(c) > 1.8) { bd = d; seed = c; } }
    if (!seed) continue;
    const blob = [seed], size = forRiver ? tune.riverMountainSize : isl.id === 0 ? 4 + Math.floor(R() * 3) : 3 + Math.floor(R() * 2);
    TERRAIN.set(K(seed[0], seed[1]), { kind: 'mountain', isl: isl.id });
    for (let tries = 0; blob.length < size && tries < 40; tries++) {
      const b = blob[Math.floor(R() * blob.length)], [di, dj] = N4[Math.floor(R() * 4)], c = [b[0] + di, b[1] + dj];
      if (landOf(c[0], c[1]) === isl.id && !TERRAIN.has(K(c[0], c[1])) && ctr(c) > 1.8) { TERRAIN.set(K(c[0], c[1]), { kind: 'mountain', isl: isl.id }); blob.push(c); }
    }
    isl.mountains.push(blob);
  }
  if (!wantRiver) return;
  // Spring: a free cell beside a mountain, the one with the most open land running away from it.
  const free = c => landOf(c[0], c[1]) === isl.id && !TERRAIN.has(K(c[0], c[1]));
  const mid = blob => [blob.reduce((s, c) => s + c[0] + 0.5, 0) / blob.length, blob.reduce((s, c) => s + c[1] + 0.5, 0) / blob.length];
  let start = null, back = null, mc = null, bestOpen = -1;
  for (const blob of isl.mountains) {
    const m = mid(blob);
    for (const b of blob) for (const [di, dj] of N4) {
      const c = [b[0] + di, b[1] + dj]; if (!free(c) || ctr(c) <= 1.5) continue;
      const ax = c[0] + 0.5 - m[0], az = c[1] + 0.5 - m[1], al = Math.hypot(ax, az) || 1; let open = 0;
      for (let s = 1; s <= 4; s++) { const n = [Math.floor(c[0] + 0.5 + ax / al * s), Math.floor(c[1] + 0.5 + az / al * s)]; if (!free(n)) break; open++; }
      if (open > bestOpen) { bestOpen = open; start = c; back = [-di, -dj]; mc = m; }
    }
    if (bestOpen >= 3) break; // the first mountain will do when it has room
  }
  if (!start) { // nowhere beside a mountain: raise a small one beside the old fallback spring, on the side towards the centre
    const a = R() * 6.28; start = isl.cells.reduce((best, c) => { const d = Math.hypot(c[0] + 0.5 - isl.cx - Math.cos(a) * isl.r * 0.35, c[1] + 0.5 - isl.cz - Math.sin(a) * isl.r * 0.35); return !best || (free(c) && d < best.d) ? { c, d } : best; }, null).c;
    const tx = isl.cx - (start[0] + 0.5), tz = isl.cz - (start[1] + 0.5), st = Math.abs(tx) > Math.abs(tz) ? [Math.sign(tx), 0] : [0, Math.sign(tz)];
    const m1 = [start[0] + st[0], start[1] + st[1]], m2 = [m1[0] + (st[1] ? 1 : 0), m1[1] + (st[0] ? 1 : 0)];
    if (!free(start) || !free(m1)) return; // no room for a mountain: no river
    const blob = [m1]; TERRAIN.set(K(m1[0], m1[1]), { kind: 'mountain', isl: isl.id });
    if (free(m2)) { blob.push(m2); TERRAIN.set(K(m2[0], m2[1]), { kind: 'mountain', isl: isl.id }); }
    isl.mountains.push(blob); back = st; mc = mid(blob);
  }
  // The river sets off away from its mountain (leaning outward, to the rim), turned a little either way.
  const ax = start[0] + 0.5 - mc[0], az = start[1] + 0.5 - mc[1], al = Math.hypot(ax, az) || 1, ox = start[0] + 0.5 - isl.cx, oz = start[1] + 0.5 - isl.cz, ol = Math.hypot(ox, oz) || 1;
  const out = Math.atan2(az / al + 0.5 * oz / ol, ax / al + 0.5 * ox / ol) + (R() < 0.5 ? 1 : -1) * R() * tune.springTurn, dx = Math.cos(out), dz = Math.sin(out);
  const path = [start], seen = new Set([K(start[0], start[1])]);
  let cur = start, exit = null;
  // First, straight out of the spring's pond, away from the mountain (a sideways first step doubled back along the pond).
  const first = [start[0] - back[0], start[1] - back[1]];
  if (free(first)) { path.push(first); seen.add(K(first[0], first[1])); cur = first; }
  for (let step = 0; step < 24 && !exit; step++) { // (islands are big now: room for a longer walk to the rim)
    let best = null, bs = -1e9;
    const n = path.length, back2 = n >= 3 ? [path[n - 2][0] - path[n - 3][0], path[n - 2][1] - path[n - 3][1]] : null;
    for (const [di, dj] of N4) {
      const c = [cur[0] + di, cur[1] + dj], k = K(c[0], c[1]);
      if (seen.has(k)) continue;
      if (back2 && di === -back2[0] && dj === -back2[1]) continue; // no hairpins: never turn straight back the way it came two steps ago
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
  isl.rivers.push({ path, exit, back });
}


// ---- State -------------------------------------------------------------------------------------
/** A fresh sky: the empty home island and four islands hidden in the mist. */
function newState() {
  const s = {
    t: 0, score: 0, gained: '', dayT: tune.startDayT, nextId: 1,
    pieces: [], occ: {}, folk: [], puffs: [], fluff: [], families: {},
    islands: ISLANDS.map(i => ({ discovered: i.id === 0, secretFound: false, relicTaken: false, reveal: i.id === 0 ? 1 : 0 })),
    quest: 0, questReady: false, mode: 'build', voyage: null, modal: null, modalQueue: [],
    tool: 'look', rot: 0, unlocked: { look: 1, house: 1, path: 1, tree: 1, garden: 1, turn: 1, tidy: 1, move: 1, bloombox: 1, puffcap: 1 },
    worldSeed: WORLD_SEED, over: {}, bridges: [], bridgeStart: null, pets: [], petNames: [],
    relics: { bell: false, starlamp: false, mothlantern: false }, choosing: null, sailed: false, voyageBag: [], lastGame: '', track: 'home', view: 'builder', followId: 0,
    cam: { tx: 0, tz: 0, ty: 0, yaw: 0.7, dist: tune.camZoomStart },
    weather: { kind: 'clear', until: 0, next: tune.weatherFirst, amt: 0, flash: 0, snow: 0, count: 0 },
    counts: { trees: 0, lanterns: 0, bridges: 0, gardens: 0, houses: 0 },
    hint: '', toasts: [], say: null, noteId: 0, told: {}, ended: false, nightShow: false, usedNames: [], found: [],
    cat: 'homes', bridgePreview: '',
    seen: { look: 1, house: 1, path: 1, tree: 1, garden: 1, turn: 1, tidy: 1 }, // pieces picked at least once; an unlocked unseen one wears a gold dot
    tut: tutorialWanted() ? { endAt: 0 } : null, // the first-start guide: build a home, plant a tree
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
  const [px, pz] = centerOf(p);
  return state.pieces.some(q => { if (!GREEN[q.type] || q.isl !== p.isl) return false; const [qx, qz] = centerOf(q), e = r + (sizeOf(q.type) + sizeOf(p.type)) / 2 - 1; return Math.abs(qx - px) <= e && Math.abs(qz - pz) <= e; }); // by centres: a 2x2 meadow counts from any of its cells
}
/**
 * Notifications, two places. Village news (tier 'event': move-ins, births, weddings, pets, unlocks,
 * the quest, relics, weather) stacks under the quest pill with a small drawn icon; the same key
 * while it shows counts up instead of stacking (o.many(n): "3 little ones born"), and one with
 * o.at = [x, z] can be tapped to ease the camera there. An answer to a tap ('info') or a can't-do
 * ('error') takes the one line above the dock; the newest replaces it, but an error never hides an
 * answer younger than notifySayGuardSecs. o: { icon, key, many, at, quest, weather, secs }.
 */
function notify(tier, text, o = {}) {
  if (tier === 'event') {
    const L = state.toasts, secs = o.secs || (o.quest ? tune.notifyQuestSecs : tune.notifyEventSecs);
    const same = L.find(t => (o.key && t.key === o.key) || t.text === text);
    if (same) { same.n++; if (o.many) same.text = o.many(same.n); same.until = state.t + secs; if (o.at) same.at = o.at; return; }
    L.push({ id: ++state.noteId, text, icon: o.icon, key: o.key, at: o.at, n: 1, quest: !!o.quest, weather: !!o.weather, until: state.t + secs });
    while (L.length > tune.notifyMaxEvents) { // full: the oldest weather line goes first, then the oldest that is not the quest
      let k = L.findIndex(t => t.weather); if (k < 0) k = L.findIndex(t => !t.quest); L.splice(Math.max(0, k), 1);
    }
    return;
  }
  const say = state.say, secs = o.secs || (tier === 'error' ? tune.notifyErrorSecs : tune.notifyInfoSecs);
  if (tier === 'error' && say && say.tier === 'info' && say.text !== text && state.t - say.t0 < tune.notifySayGuardSecs) return;
  if (say && say.text === text) { say.until = state.t + secs; return; } // the same again: it stays a little longer
  state.say = { id: ++state.noteId, tier, text, t0: state.t, until: state.t + secs };
}
/** A plain answer above the dock (older code calls this; news goes through notify('event', ...)). */
function toast(text, secs) { notify('info', text, { secs }); }
/** A can't-do line above the dock. */
const oops = text => notify('error', text);
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
    if (!p.style) p.style = houseStyle(p);
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
    // corners: where this path, two beside it and the one between them make a square, pave the
    // corner too (16 +x+z, 32 +x-z, 64 -x+z, 128 -x-z), so a block of paths is one paved square
    const isPath = (i, j) => { const id = state.occ[K(i, j)], q = pieceById(id); return !!q && q.type === 'path'; };
    for (const [sx, sz, b] of [[1, 1, 16], [1, -1, 32], [-1, 1, 64], [-1, -1, 128]]) if (isPath(p.i + sx, p.j) && isPath(p.i, p.j + sz) && isPath(p.i + sx, p.j + sz)) m |= b;
    p.mask = m;
  }
  state.pathIsl = new Set(state.pieces.filter(p => p.type === 'path').map(p => p.isl)); // islands with a path: there, sky-folk plan their walks
  // Planted beds (gardens, meadows, puffcaps) join any planted neighbour: mask has a bit for each
  // joined side, mix the sides whose neighbour is a different kind of bed (a seam is drawn there).
  const JOINS = { garden: 1, puffcap: 1 }, seen = new Set(); // a 2x2 meadow stands on its own
  for (const p of state.pieces) if (JOINS[p.type]) {
    let m = 0, x = 0;
    for (const [di, dj, b] of bits) { const q = pieceAt(p.i + di, p.j + dj); if (q && JOINS[q.type] && !q.lifted) { m |= b; if (q.type !== p.type) x |= b; } }
    p.mask = m; p.mix = x;
  }
  for (const p of state.pieces) if (p.type === 'meadow') Object.assign(p, { mask: 0, mix: 0, kind: meadowKind(p.seed), shelter: true, shelterId: p.id }); // each meadow its own kind and shelter
  for (const p of state.pieces) if (p.type === 'garden' && !seen.has(p.id)) { // a same-type patch takes the kind of its first piece
    const patch = [p], todo = [p]; seen.add(p.id);
    while (todo.length) { const c = todo.pop(); for (const [di, dj] of bits) { const q = pieceAt(c.i + di, c.j + dj); if (q && q.type === p.type && !seen.has(q.id)) { seen.add(q.id); patch.push(q); todo.push(q); } } }
    const first = patch.reduce((a, b) => (b.id < a.id ? b : a)), kind = p.type === 'garden' ? gardenKind(first.seed) : meadowKind(first.seed);
    for (const q of patch) { q.kind = kind; if (p.type === 'meadow') { q.shelter = q === first; q.shelterId = first.id; } } // the meadow's first cell holds the fluffkins' shelter
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
  if (!hit || hit.kind !== 'land' || !state.islands[hit.isl].discovered) return 'Only on a found island';
  if (terrainAt(hit.i, hit.j)) return 'Not on mountain or water';
  if (state.occ[K(hit.i, hit.j)] !== undefined) return 'Something is already here';
  return '';
}
/** Why a bridge from a to b cannot be built, or '' when it can: the straight line must be clear. */
function bridgeProblem(a, b) {
  const e = bridgeEndOk(b); if (e) return e;
  const len = Math.hypot(b.i - a.i, b.j - a.j);
  if (len < 1.5) return 'Tap a little further away';
  if (len > tune.skyBridgeMax) return 'Too far for one bridge';
  const n = Math.ceil(len / 0.2);
  let water = false;
  for (let k = 1; k < n; k++) {
    const x = a.i + 0.5 + (b.i - a.i) * k / n, z = a.j + 0.5 + (b.j - a.j) * k / n, i = Math.floor(x), j = Math.floor(z);
    if ((i === a.i && j === a.j) || (i === b.i && j === b.j)) continue;
    const l = landOf(i, j); if (l < 0) continue;
    if (l !== a.isl && l !== b.isl) return 'Another island is in the way';
    const t = terrainAt(i, j); if (t && t.kind === 'mountain') return 'A mountain is in the way';
    if (t && (t.kind === 'river' || t.kind === 'lake')) water = true;
    if (overAt(i, j)) return 'Something is in the way';
    const o = state.occ[K(i, j)], q = pieceAt(i, j);
    if (q && q.type !== 'path' && q.type !== 'garden' && q.type !== 'meadow') return 'Something is in the way';
    if (typeof o === 'string') return 'Something is in the way';
  }
  if (a.isl === b.isl && !water) return 'Bridges cross to an island or water';
  return '';
}
function buildBridge(a, b) {
  const id = state.nextId++;
  const [ta, tb] = bridgeSpan(a, b);
  state.bridges.push({ id, a: a.isl, b: b.isl, i1: a.i, j1: a.j, i2: b.i, j2: b.j, ta, tb });
  state.occ[K(a.i, a.j)] = 'B' + id; state.occ[K(b.i, b.j)] = 'B' + id;
  refloor(); recount(); sfx.moveIn();
  fxPuff(a.i + 0.5, islandLift(a.isl), a.j + 0.5, '#fff6ee'); fxPuff(b.i + 0.5, islandLift(b.isl), b.j + 0.5, '#fff6ee');
  if (a.isl !== b.isl) notify('event', `A bridge to ${ISLANDS[a.isl === 0 ? b.isl : b.isl === 0 ? a.isl : b.isl].name}`, { icon: 'bridge' });
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
  if (isl < 0) { if (sizeOf(type) > 1 && hit) oops('Needs a clear 2 by 2 space'); return false; }
  hit = anchorFor(type, hit);
  const def = PIECES[type], id = state.nextId++;
  const rot = placeRot(type, hit);
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
// ---- Move: tap a piece to lift it, tap a free spot to put it down -------------------------------
/** The type of the piece being carried by the Move tool, or null. */
function carryType() { const p = state.carry && pieceById(state.carry.id); return p ? p.type : null; }
/** Frees a piece's cells (or the path it stands over). */
function unoccupy(p) { if (p.over) delete state.over[K(p.i, p.j)]; else for (const [i, j] of cellsOf(p)) if (state.occ[K(i, j)] === p.id) delete state.occ[K(i, j)]; }
/** Takes up a piece's cells: over a path for the Star Arch, otherwise its whole footprint. */
function occupy(p) {
  const under = pieceAt(p.i, p.j);
  p.over = false;
  if (OVER_PATH[p.type] && under && under.type === 'path') { p.over = true; state.over[K(p.i, p.j)] = p.id; }
  else for (const [i, j] of cellsOf(p)) state.occ[K(i, j)] = p.id;
}
/** Move tool: the first tap lifts what you built there; the next puts it down where it fits. */
function moveTap(hit) {
  if (!state.carry) {
    const p = topPieceAt(hit.i, hit.j);
    if (!p) { oops(bridgeAtCell(hit.i, hit.j) ? 'Bridges stay put' : 'Tap a piece to lift it'); return; }
    state.carry = { id: p.id, from: { i: p.i, j: p.j, isl: p.isl, rot: p.rot, over: !!p.over } };
    unoccupy(p); p.lifted = true; state.rot = p.rot;
    const [cx, cz] = centerOf(p); fxPuff(cx, pieceY(p), cz, '#e6ffe8'); sfx.ui();
    for (const f of state.folk) if (f.atFire === p.id) f.fireUntil = 0; // a moved campfire: those gathered round it go home
    return;
  }
  const p = pieceById(state.carry.id); if (!p) { state.carry = null; return; }
  const isl = canPlace(p.type, hit);
  if (isl < 0) { oops(sizeOf(p.type) > 1 ? 'Needs a clear 2 by 2 space' : terrainAt(hit.i, hit.j) ? 'Not on mountain or water' : 'Something is in the way'); return; }
  const a = anchorFor(p.type, hit), moved = a.i !== state.carry.from.i || a.j !== state.carry.from.j;
  p.i = a.i; p.j = a.j; p.isl = isl; p.rot = placeRot(p.type, hit); p.lifted = false;
  occupy(p); state.carry = null;
  refloor(); recount();
  const [cx, cz] = centerOf(p); sfx.place(p.type); fxPuff(cx, pieceY(p), cz, '#fff6ee');
  events.push({ type: 'move', piece: p.type });
}
/** Puts a carried piece back exactly where it was (Esc, another tool, or the Move button again). */
function cancelCarry() {
  const c = state.carry; state.carry = null; if (!c) return;
  const p = pieceById(c.id); if (!p) return;
  Object.assign(p, { i: c.from.i, j: c.from.j, isl: c.from.isl, rot: c.from.rot, lifted: false });
  occupy(p); refloor(); recount();
}
/** Turns a placed piece a quarter turn (a bridge swaps its direction; a path fits itself). */
function turnPiece(hit) {
  const p = hit && topPieceAt(hit.i, hit.j);
  if (!p) { oops(hit && bridgeAtCell(hit.i, hit.j) ? 'Bridges cannot turn' : 'Tap a piece to turn it'); return; }
  if (p.type === 'path') { oops('Paths join on their own'); return; }
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
  if (state.families[p.id]) { oops(`The ${state.families[p.id].name}s live here`); return; }
  state.pieces = state.pieces.filter(q => q !== p);
  if (p.over) delete state.over[K(p.i, p.j)]; else for (const [i, j] of cellsOf(p)) delete state.occ[K(i, j)];
  state.fluff = state.fluff.filter(f => f.meadow !== p.id);
  refloor(); recount(); sfx.tidy(); fxPuff(p.i + 0.5, pieceY(p), p.j + 0.5, '#e9e2f2');
}
function familyLine(p) {
  const f = state.families[p.id]; if (!f) return '';
  const here = state.folk.filter(x => x.house === p.id), big = here.filter(x => x.kind === 'adult').length, small = here.length - big;
  const pets = state.pets.filter(x => x.house === p.id).map(x => x.name);
  return `${f.name}s · ${big} grown${small ? `, ${small} little` : ''}${pets.length ? ' · ' + pets.join(', ') : ''}`;
}
/** House styles, in pick order; the last two are dreamed up as the village grows (config key). */
const HOUSE_STYLES = [['tower'], ['mushroom'], ['cottage'], ['moonbell'], ['gourd'], ['rootstump', 'homeStyleRootPop', 'Rootstump homes'], ['mistspire', 'homeStyleMistPop', 'Mist Spires']];
/** A new home's style: by its seed from the styles unlocked so far, but not the same as a home beside it. */
function houseStyle(p) {
  const pool = HOUSE_STYLES.filter(([, key]) => !key || pop() >= tune[key]).map(([n]) => n), near = new Set();
  for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) if (di || dj) { const q = pieceAt(p.i + di, p.j + dj); if (q && q.type === 'house' && q.style) near.add(q.style); }
  const n = pool.length, at = ((p.seed % n) + n) % n;
  for (let k = 0; k < n; k++) if (!near.has(pool[(at + k) % n])) return pool[(at + k) % n];
  return pool[at];
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
  notify('event', `A wedding: the ${name}s`, { icon: 'heart', at: [dx, dz] }); sfx.birth();
  maybeAdopt(p.id);
  events.push({ type: 'wedding', house: p.id });
}

// ---- The simulation step --------------------------------------------------------------------------
/** Which night it is (the night after day n keeps its number through dawn). */
const nightKey = () => (state.dayN || 0) - (state.dayT < 0.5 ? 1 : 0);
/** A night's raw rolls, the same for the same sky and night. */
function nightRoll(n) { const R = worldRand((((WORLD_SEED || 12345) * 977) ^ (n * 7919 + 13)) >>> 0); return { meteor: R() < tune.meteorChance, eye: R() < tune.stillEyeChance, comet: R() < 0.25 }; }
/**
 * Tonight's sky (game designer's spec): the constellations take turns, a planet comes near, and
 * now and then meteors or the Still Eye (never two nights running; meteors win if both come).
 */
function tonight() {
  const n = nightKey(), a = nightRoll(n), b = nightRoll(n - 1), meteor = a.meteor && !b.meteor;
  return { n, c: ((n % 12) + 12) % 12, planet: (((n * 5) % 4) + 4) % 4, meteor, eye: a.eye && !b.eye && !meteor, comet: a.comet };
}
/** One fixed step of play. */
function playStep(dt) {
  keysStep(dt); autosaveStep();
  state.t += dt;
  const show = state.nightShow && sun().night < 0.9;
  const nd = state.dayT + dt / tune.dayLength * (show ? 7 : 1);
  if (nd >= 1) state.dayN = (state.dayN || 0) + 1; // days gone by: each night has its own sky
  state.dayT = nd % 1;
  const nk = nightKey();
  if (state.dayT > 0.64 && state.dayT < 0.9 && state.toldNight !== nk && state.mode !== 'voyage') { // at dusk, one line: tonight's sky
    state.toldNight = nk; const tn = tonight();
    notify('event', 'Tonight: ' + CONSTELLATIONS[tn.c].name + (tn.meteor ? ', and falling stars' : tn.eye ? ', and the Still Eye' : ''), { icon: 'star' });
  }
  if (state.nightShow && sun().night >= 0.9) state.nightShow = false;
  weatherStep(dt);
  if (state.mode === 'voyage') voyageStep(dt);
  else {
    piecesStep(dt); familiesStep(dt); folkStep(dt); fireMusicStep(); petStep(dt); fluffStep(dt); smokeStep(dt); roomsStep(); unlockStep(); questStep(); tapsStep(); tutorialStep();
  }
  taps.length = 0;
  for (const s of state.islands) if (s.discovered && s.reveal < 1) s.reveal = Math.min(1, s.reveal + dt / 2.5);
  state.toasts = state.toasts.filter(t => t.until > state.t);
  if (state.say && state.say.until <= state.t) state.say = null;
  hintStep(); fxStep(dt); camStep(dt); musicStep();
}

function keysStep(dt) {
  if (state.modal) { if (pressed('Enter') || pressed('Space')) closeModal(); return; }
  if (state.choosing) { chartKeys(); return; }
  const c = state.cam;
  const L = down.has('ArrowLeft') || down.has('KeyA'), Rt = down.has('ArrowRight') || down.has('KeyD');
  const U = down.has('ArrowUp') || down.has('KeyW'), D = down.has('ArrowDown') || down.has('KeyS');
  if (state.mode === 'voyage') {
    const v = state.voyage;
    if (L) v.tx -= tune.voyageSteer * dt; if (Rt) v.tx += tune.voyageSteer * dt;
    v.tx = Math.max(-tune.voyageWidth, Math.min(tune.voyageWidth, v.tx));
    if (pressed('Space') || pressed('Enter')) voyageTap();
    return;
  }
  if (pressed('KeyH') && state.view === 'builder') resetCamera();
  if (pressed('BracketLeft')) musicVolumeBy(-0.1);
  if (pressed('BracketRight')) musicVolumeBy(0.1);
  if (pressed('KeyV')) cycleView();
  if (pressed('Tab')) nextFollow();
  if (pressed('Enter') && state.questReady) setSail();
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
  if (pressed('KeyG')) selectTool('move');
  if (pressed('KeyR')) rotatePiece();
}
/** The camera back to where a game starts: over the home island, the starting turn and zoom (it eases there). */
function resetCamera() { const c = state.cam, h = ISLANDS[0]; c.tx = h.cx; c.tz = h.cz; c.ty = 0; c.yaw = 0.7; c.dist = tune.camZoomStart; sfx.ui(); }
function zoom(f) { const c = state.cam; c.dist = Math.max(tune.camZoomMin, Math.min(tune.camZoomMax, c.dist * f)); }
/** Keeps the camera's target near a discovered island, so it never wanders into the mist. */
/**
 * Keeps the camera's focus over the sky you know: a disc round every found island, a lane along
 * each bridge, and an open corridor between every two found islands, so a drag can always carry
 * the view from one island to another (the list jumps; dragging glides).
 */
function clampCam() {
  const c = state.cam, segs = [], found = ISLANDS.filter(isl => state.islands[isl.id].discovered);
  for (const isl of found) segs.push([isl.cx, isl.cz, isl.cx, isl.cz, isl.r + 4.5]);
  for (let a = 0; a < found.length; a++) for (let b = a + 1; b < found.length; b++) segs.push([found[a].cx, found[a].cz, found[b].cx, found[b].cz, tune.camCorridor]);
  for (const b of state.bridges) { const x = (b.i1 + b.i2) / 2 + 0.5, z = (b.j1 + b.j2) / 2 + 0.5; segs.push([x, z, x, z, bridgeLen(b) / 2 + 4]); } // bridges lead the camera across
  let bo = 1e9, bx = c.tx, bz = c.tz;
  for (const [x1, z1, x2, z2, r] of segs) {
    const dx = x2 - x1, dz = z2 - z1, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((c.tx - x1) * dx + (c.tz - z1) * dz) / L)) : 0;
    const px = x1 + dx * t, pz = z1 + dz * t, d = Math.hypot(c.tx - px, c.tz - pz), o = d - r;
    if (o <= 0) return; // inside one of them: free
    if (o < bo) { bo = o; bx = px + (c.tx - px) * r / d; bz = pz + (c.tz - pz) * r / d; }
  }
  c.tx = bx; c.tz = bz;
}
function selectTool(t) {
  if (!state.unlocked[t]) return;
  if (state.carry) cancelCarry(); // switching tools (or Move again) puts a carried piece back
  if (t === state.tool && t !== 'look') { state.tool = 'look'; state.bridgeStart = null; sfx.ui(); return; } // a second tap puts it down
  state.tool = t; state.seen[t] = 1; state.bridgeStart = null; sfx.ui();
  const cat = TOOL_CATS.find(c => c.tools.includes(t)); if (cat) state.cat = cat.id;
  tellOnce(t);
}
/** What a tool or piece does, said once a game: the first time it is picked. */
function tellOnce(t) {
  if (!t || state.told[t]) return; state.told[t] = 1;
  const line = PIECES[t] ? PIECES[t].about : { move: 'Tap a piece, then its new spot', turn: 'Tap a piece to turn it', tidy: 'Tap a piece to clear it' }[t];
  if (line) notify('info', line, { secs: tune.notifyAboutSecs });
}
/** Is this tool on the toolbar now? Look, Turn and Tidy always are; pieces show under their category's tab. */
function toolInView(t) { const c = TOOL_CATS.find(c => c.tools.includes(t)); return !c || c.id === state.cat; }
/** Opens a toolbar category; picks its first unlocked piece when the current tool is in another one. */
function selectCat(id) {
  state.cat = id; sfx.ui();
  if (!toolInView(state.tool)) { const c = TOOL_CATS.find(c => c.id === id), t = c.tools.find(t => state.unlocked[t]); state.tool = t || 'look'; state.bridgeStart = null; tellOnce(t); }
}
/** Turns the piece about to be built a quarter turn (R, right-click, or the Rotate button). */
function rotatePiece() { state.rot = (state.rot + Math.PI / 2) % (Math.PI * 2); sfx.ui(); }
/** The next song you have found. */
function nextTrack() {
  const has = Object.keys(TRACKS).filter(k => k === 'home' || state.relics[k]);
  state.track = has[(has.indexOf(state.track) + 1) % has.length]; resetMusic();
  toast(has.length > 1 ? 'Now playing: ' + TRACKS[state.track].name : 'Find the Wind Bell for more songs');
}
/** Music louder or quieter by a step ([ and ] keys). */
function musicVolumeBy(d) {
  const c = CONFIG.musicVolume; c.value = Math.max(c.min, Math.min(c.max, Math.round((c.value + d) * 100) / 100));
  toast(`Music ${Math.round(c.value * 100)}%`);
}
function cycleView() { const v = ['builder', 'stroll', 'postcard']; setView(v[(v.indexOf(state.view) + 1) % 3]); }
function setView(v) {
  if (state.carry && v !== 'builder') cancelCarry(); // leaving the builder puts a carried piece back
  state.view = v; sfx.ui();
  if (v === 'stroll') { if (!state.folk.some(f => f.id === state.followId)) nextFollow(); if (!state.folk.length) toast('No sky-folk to stroll with yet'); }
}
function nextFollow() {
  const out = state.folk.filter(f => f.mode !== 'inside'), list = out.length ? out : state.folk;
  if (!list.length) return;
  const k = list.findIndex(f => f.id === state.followId);
  state.followId = list[(k + 1) % list.length].id;
  const f = state.folk.find(x => x.id === state.followId), fam = state.families[f.house];
  if (fam) toast(`Strolling with the ${fam.name}s`);
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
        if (p.type === 'meadow') { // the first fluffkin of a game is news; later ones just a green puff
          if (!state.told.fluffkin) { state.told.fluffkin = 1; notify('event', 'A fluffkin found the meadow', { icon: 'paw', at: [p.i + 0.5, p.j + 0.5] }); }
          else fxPuff(p.i + 0.5, pieceY(p), p.j + 0.5, '#d9f5c8');
        } }
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
    notify('event', `The ${name}s moved in`, { icon: 'house', key: 'movein', many: n => `${n} families moved in`, at: [u.x, u.z] }); sfx.moveIn();
    maybeAdopt(p.id);
    fxLabel(u.x, ISLANDS[p.isl].y + 1.2, u.z, '+2 sky-folk');
    events.push({ type: 'movein', house: p.id });
  }
  for (const p of state.pieces) {
    const f = state.families[p.id];
    if (!f || f.kids >= tune.maxChildren || state.t < f.nextChild || isNight()) continue;
    f.kids++; f.nextChild = state.t + childGap();
    const [dx, dz] = doorOf(p); spawnFolk(p, 'child', dx, dz, 'idle');
    notify('event', `A little one for the ${f.name}s`, { icon: 'sprout', key: 'birth', many: n => `${n} little ones born`, at: [dx, dz] }); sfx.birth();
    fxSpark(dx, ISLANDS[p.isl].y + 0.6, dz, '#ffd3e0', 10); fxLabel(dx, ISLANDS[p.isl].y + 1.1, dz, '+1');
  }
}
/** A family name made fresh for this game: two parts joined (Moonwhistle, Fernbottom), now and then one old word alone. */
function pickName() {
  const R = worldRand(state.nameSeed + state.usedNames.length * 7919), P = NAME_PARTS, at = a => a[Math.floor(R() * a.length)];
  let n = '';
  for (let k = 0; k < 20 && (!n || state.usedNames.includes(n) || ISLANDS.some(i => i.name === n)); k++) n = R() < 0.2 ? at(P.alone) : at(P.first) + at(P.last);
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
/** An idle sky-folk may stroll over to stand and look at a Lull Bench, Dream Loom or Sky Orrery on their island. */
/** Rain or thunder heavy enough to keep sky-folk from a campfire (snow is fine: a fire in the snow is cosy). */
function isWet() { const w = state.weather; return (w.kind === 'rain' || w.kind === 'thunder') && w.amt > tune.campfireWetAmt; }
function visitSight(f) {
  if (!isWet() && rng() < tune.campfireDayChance && goToFire(f, 0)) return true;
  if (rng() >= tune.sightVisitChance) return false;
  const all = state.pieces.filter(q => PIECES[q.type].sight && q.done >= 1 && q.isl === f.isl); if (!all.length) return false;
  const q = all[Math.floor(rng() * all.length)], a = rng() * Math.PI * 2, tx = q.i + 0.5 + Math.cos(a) * 0.8, tz = q.j + 0.5 + Math.sin(a) * 0.8;
  if (!freeCell(Math.floor(tx), Math.floor(tz), f.isl) || !clearLine(f.x, f.z, tx, tz, f.isl)) return false;
  f.tx = tx; f.tz = tz; f.mode = 'walk'; f.lookAt = [q.i + 0.5, q.j + 0.5]; return true;
}
/**
 * Sends a sky-folk to a spot round a campfire on their island, facing it. stay > 0 (at night):
 * they keep there that many seconds before going home; 0 (by day): an ordinary idle stop.
 */
function goToFire(f, stay) {
  const fires = state.pieces.filter(q => PIECES[q.type].gather && q.done >= 1 && q.isl === f.isl); if (!fires.length) return false;
  const q = fires[Math.floor(rng() * fires.length)], [cx, cz] = centerOf(q), a0 = rng() * Math.PI * 2;
  if (stay > 0) { // a seat on the logs: little ones like the stump best, everyone else the nearest free seat
    const seats = fireSeats(q), taken = new Set(state.folk.filter(o => o !== f && o.atFire === q.id && o.seat != null).map(o => o.seat));
    const order = seats.map((_, k) => k).filter(k => !taken.has(k)).sort((a, b) => (f.kind === 'child' ? (b === 6) - (a === 6) : 0) || Math.hypot(seats[a].x - f.x, seats[a].z - f.z) - Math.hypot(seats[b].x - f.x, seats[b].z - f.z));
    for (const k of order) {
      const ox = seats[k].ox, oz = seats[k].oz; // walk to just outside the fire on the seat's side, then step onto it
      if (!freeCell(Math.floor(ox), Math.floor(oz), f.isl) || !clearLine(f.x, f.z, ox, oz, f.isl)) continue;
      f.tx = ox; f.tz = oz; f.mode = 'walk'; f.route = null; f.lookAt = [cx, cz];
      f.atFire = q.id; f.fireUntil = state.t + stay; f.seat = k; f.sit = 0; f.act = null; f.actAt = 0; f.seatOut = [ox, oz];
      return true;
    }
  }
  for (let k = 0; k < 8; k++) {
    const a = a0 + k * Math.PI / 4, r = 1.5 + rng() * 0.25, tx = cx + Math.cos(a) * r, tz = cz + Math.sin(a) * r;
    if (!freeCell(Math.floor(tx), Math.floor(tz), f.isl) || !clearLine(f.x, f.z, tx, tz, f.isl)) continue;
    f.tx = tx; f.tz = tz; f.mode = 'walk'; f.route = null; f.lookAt = [cx, cz];
    if (stay > 0) { f.atFire = q.id; f.fireUntil = state.t + stay; }
    return true;
  }
  return false;
}
/** The seats round campfire q in the world: {x, z, y (seat top), h (facing the fire), ox, oz (the step-off spot just outside)}. */
function fireSeats(q) {
  const [cx, cz] = centerOf(q), c = Math.cos(q.rot), s = Math.sin(q.rot);
  return campfireSeats().map(({ x, z, y }) => {
    const wx = cx + x * c + z * s, wz = cz - x * s + z * c, d = Math.hypot(wx - cx, wz - cz) || 1;
    return { x: wx, z: wz, y, h: Math.atan2(cx - wx, cz - wz), ox: cx + (wx - cx) / d * 1.55, oz: cz + (wz - cz) / d * 1.55 };
  });
}
const FIRE_ACTS = ['roast', 'talk', 'sing', 'lute', 'flute', 'drum'], INSTRUMENTS = { lute: 1, flute: 1, drum: 1 };
/** A sitter picks what to do by the fire: roast, talk, sing or play; each instrument once a fire, no lute or flute for little ones. */
function pickFireAct(f) {
  const kid = f.kind === 'child', busy = new Set(state.folk.filter(o => o !== f && o.atFire === f.atFire && o.seat != null).map(o => o.act));
  const w = { roast: tune.campfireRoastW + (kid ? 1 : 0), talk: Math.max(0, tune.campfireTalkW - (kid ? 1 : 0)), sing: tune.campfireSingW + (kid ? 1 : 0), lute: kid ? 0 : tune.campfirePlayW, flute: kid ? 0 : tune.campfirePlayW, drum: tune.campfirePlayW };
  for (const k in INSTRUMENTS) if (busy.has(k)) w[k] = 0;
  let sum = 0; for (const k of FIRE_ACTS) sum += w[k];
  let r = rng() * sum; f.act = 'sing';
  for (const k of FIRE_ACTS) { r -= w[k]; if (w[k] > 0 && r <= 0) { f.act = k; break; } }
  f.actAt = state.t + tune.campfireActSwap * (0.7 + rng() * 0.6);
}
/** Sitters glide onto their seat and take up something to do; when it is time to go, they step back off first. */
function seatStep(f, atFire, dt) {
  if (f.seat == null) return;
  const q = atFire && pieceById(f.atFire);
  if (q && f.mode === 'idle') {
    const s = fireSeats(q)[f.seat], ddx = s.x - f.x, ddz = s.z - f.z, d = Math.hypot(ddx, ddz);
    if (d > 0.01) { const st = Math.min(d, dt * 1.2); f.x += ddx / d * st; f.z += ddz / d * st; }
    else f.sit = Math.min(1, (f.sit || 0) + dt * 3);
    f.h = s.h; f.seatY = s.y;
    if (f.sit >= 1 && isNight() && state.t >= (f.actAt || 0)) pickFireAct(f);
    return;
  }
  if (q && f.mode === 'walk') return; // still on the way
  f.seat = null; f.sit = 0; f.act = null; // time to go: step back off the log before heading home
  if (f.seatOut && (f.mode === 'home' || f.mode === 'idle')) { f.tx = f.seatOut[0]; f.tz = f.seatOut[1]; if (f.mode === 'idle') f.mode = 'walk'; } // by day, they just stroll off
  f.seatOut = null;
}
/** Now and then a soft note from someone playing at a fire near the camera (pentatonic; the Sound panel's effects volume). */
function fireMusicStep() {
  if (state.mode === 'voyage' || state.t < (state.fireBeat || 0)) return;
  state.fireBeat = state.t + 0.45 + rng() * 0.35;
  const c = state.cam, ps = state.folk.filter(f => f.seat != null && f.sit >= 1 && INSTRUMENTS[f.act]); if (!ps.length || tune.campfireMusicVol <= 0) return;
  const f = ps[Math.floor(rng() * ps.length)], near = Math.max(0, 1 - Math.hypot(c.tx - f.x, c.tz - f.z) / 14) * Math.min(1, 22 / c.dist);
  if (near > 0.02) sfx.fireNote(f.act, tune.campfireMusicVol * near, [60, 62, 64, 67, 69, 72, 74, 76][Math.floor(rng() * 8)]);
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
const onPathCell = (i, j) => { const q = pieceAt(i, j); return !!q && q.type === 'path'; };
/** True when the straight line stays on path cells the whole way. */
function pathLine(x0, z0, x1, z1) {
  const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.2);
  for (let k = 0; k <= n; k++) if (!onPathCell(Math.floor(x0 + (x1 - x0) * k / n), Math.floor(z0 + (z1 - z0) * k / n))) return false;
  return true;
}
/**
 * A walk that prefers the paths: a small A* over the island's free cells, where a path cell costs 1
 * and any other pathOffCost, 8 ways without cutting blocked corners. Only on an island with a path
 * and for a goal more than 2.5 away; null otherwise, or when no way is found (a straight walk then).
 * The waypoints sit at cell centres nudged into a lane by the walker's id, pulled straight where a
 * stretch is all on path (staying on it) or all off it (in a clear line).
 */
function planWay(f, gx, gz) {
  const isl = f.isl;
  if (!state.pathIsl || !state.pathIsl.has(isl) || Math.hypot(gx - f.x, gz - f.z) < 2.5) return null;
  const si = Math.floor(f.x), sj = Math.floor(f.z), ei = Math.floor(gx), ej = Math.floor(gz), key = (i, j) => (i + 2048) * 4096 + (j + 2048);
  const ok = (i, j) => (i === ei && j === ej) || freeCell(i, j, isl), off = tune.pathOffCost;
  const g = new Map([[key(si, sj), 0]]), from = new Map(), heap = [[0, si, sj]], closed = new Set();
  const push = e => { heap.push(e); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) { heap[0] = last; let k = 0; while (true) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } }
    return top;
  };
  const hEst = (i, j) => { const dx = Math.abs(i - ei), dz = Math.abs(j - ej); return Math.max(dx, dz) + 0.41 * Math.min(dx, dz); };
  let found = false, n = 0;
  while (heap.length && n < 600) {
    const [, i, j] = pop(), kk = key(i, j); if (closed.has(kk)) continue; closed.add(kk); n++;
    if (i === ei && j === ej) { found = true; break; }
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue; const ni = i + di, nj = j + dj, nk = key(ni, nj);
      if (closed.has(nk) || !ok(ni, nj) || (di && dj && (!ok(i + di, j) || !ok(i, j + dj)))) continue;
      const c = g.get(kk) + (onPathCell(ni, nj) ? 1 : off) * (di && dj ? 1.41 : 1);
      if (c < (g.get(nk) ?? Infinity)) { g.set(nk, c); from.set(nk, kk); push([c + hEst(ni, nj), ni, nj]); }
    }
  }
  if (!found) return null;
  const cells = []; for (let k = key(ei, ej); k !== key(si, sj); k = from.get(k)) cells.unshift([Math.floor(k / 4096) - 2048, (k % 4096) - 2048]);
  const lane = (f.id % 2 ? 1 : -1) * tune.pathLane;
  const pts = cells.map(([i, j], k) => k === cells.length - 1 ? { x: gx, z: gz, p: onPathCell(i, j) } : { x: i + 0.5 + lane, z: j + 0.5 + lane, p: onPathCell(i, j) });
  const out = []; let a = { x: f.x, z: f.z, p: onPathCell(si, sj) }, k = 0;
  while (k < pts.length) {
    let best = k;
    for (let m = k + 1; m < pts.length; m++) {
      if (pts[m].p !== a.p || pts[m - 1].p !== a.p) break;
      if (a.p ? pathLine(a.x, a.z, pts[m].x, pts[m].z) : clearLine(a.x, a.z, pts[m].x, pts[m].z, isl)) best = m; else break;
    }
    out.push([pts[best].x, pts[best].z]); a = pts[best]; k = best + 1;
  }
  return out;
}
/**
 * Called each step for a walker: when the game gave them a new destination, plan a way there that
 * prefers the paths (a few plans a frame, pathPlansPerFrame).
 */
function wayStep(f) {
  if (!(f.mode === 'walk' || f.mode === 'home' || f.mode === 'toBridge')) { f.way = null; f.wpt = null; return; }
  if (f.wpt && f.wpt[0] === f.tx && f.wpt[1] === f.tz) return; // following the plan
  if (state.plans >= tune.pathPlansPerFrame) return; // too many plans this frame: next one
  state.plans++;
  const way = planWay(f, f.tx, f.tz);
  if (way && way.length) { f.way = way; const w = f.way.shift(); f.tx = w[0]; f.tz = w[1]; }
  else f.way = null;
  f.wpt = [f.tx, f.tz];
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
  state.plans = 0;
  const thunder = state.weather.kind === 'thunder' && state.weather.amt > 0.3, wantHome = isNight() || thunder, wet = isWet();
  for (const f of state.folk) {
    const home = pieceById(f.house); if (!home) continue;
    const [dx, dz] = doorOf(home);
    if (f.kind === 'child') { // a child grows up, faster while a Magic School stands
      f.age = (f.age ?? (state.t - (f.born ?? state.t))) + dt * (hasUtility('school') ? tune.schoolGrowBoost : 1);
      if (f.age >= tune.growUpTime) {
        f.kind = 'adult'; f.grown = true;
        fxPuff(f.x, islandLift(f.isl) + 0.2, f.z, '#ffe7a0'); // grown up: a gold puff, no words
      }
    }
    // Rain: once a spell, each decides: most head home; the rest stay out under an umbrella.
    if (!wet) { f.rainDecided = false; f.rainHome = false; f.umbrella = false; }
    else if (!f.rainDecided) { f.rainDecided = true; if (rng() < tune.rainHomeChance) f.rainHome = true; else f.umbrella = true; }
    if (f.mode === 'inside') {
      if (!wantHome && !f.rainHome && state.t >= f.timer) { f.mode = 'idle'; f.x = dx; f.z = dz; f.isl = home.isl; f.timer = state.t + 0.5 + rng() * 2; }
      f.y = islandLift(f.isl); continue;
    }
    const away = f.isl !== home.isl, goHome = wantHome || f.rainHome; // goHome: night, a storm, or they chose home over the rain
    if (away && (goHome || state.t > (f.visitUntil || 0)) && (f.mode === 'idle' || f.mode === 'walk')) headHome(f, home);
    // At nightfall, someone still out may go to a campfire on their island before home (once a night; never in a storm).
    if (!away && isNight() && !thunder && !wet && (f.mode === 'idle' || f.mode === 'walk' || f.mode === 'home') && state.t - (f.fireRoll ?? -1e9) > tune.dayLength * 0.5) {
      f.fireRoll = state.t;
      if (rng() < tune.campfireGatherChance) goToFire(f, tune.campfireStay * (0.8 + rng() * 0.4));
    }
    if (wet && f.atFire && f.fireUntil > state.t + tune.campfireRainLinger) f.fireUntil = state.t + tune.campfireRainLinger; // rain: a last moment by the fire, then home
    const atFire = !away && !thunder && f.atFire && state.t < f.fireUntil && pieceById(f.atFire);
    if (!away && goHome && !atFire && (f.mode === 'idle' || f.mode === 'walk' || f.mode === 'toBridge')) { f.mode = 'home'; f.tx = dx; f.tz = dz; f.route = null; f.bridge = 0; f.atFire = 0; }
    if (atFire && f.mode === 'idle') f.timer = Math.max(f.timer, state.t + 1); // stay round the fire, no wandering off
    seatStep(f, atFire, dt);
    if (f.mode === 'idle' && state.t >= f.timer) {
      if (!(!goHome && !away && rng() < tune.crossChance && setOff(f)) && !(!goHome && visitUtility(f)) && !(!goHome && !away && visitSight(f))) {
        const ci = away ? f.ai : home.i, cj = away ? f.aj : home.j;
        if (state.pathIsl && state.pathIsl.has(f.isl) && rng() < tune.pathWanderChance) { // a stroll along a path near home
          const near = state.pieces.filter(q => q.type === 'path' && q.isl === f.isl && Math.abs(q.i - ci) <= tune.wanderRange + 2 && Math.abs(q.j - cj) <= tune.wanderRange + 2);
          if (near.length) { const q = near[Math.floor(rng() * near.length)]; f.tx = q.i + 0.3 + rng() * 0.4; f.tz = q.j + 0.3 + rng() * 0.4; f.mode = 'walk'; }
        }
        for (let k = 0; k < 6 && f.mode === 'idle'; k++) {
          const R = tune.wanderRange, i = ci + Math.round((rng() * 2 - 1) * R), j = cj + Math.round((rng() * 2 - 1) * R);
          const tx = i + 0.2 + rng() * 0.6, tz = j + 0.2 + rng() * 0.6;
          if (freeCell(i, j, f.isl) && clearLine(f.x, f.z, tx, tz, f.isl)) { f.tx = tx; f.tz = tz; f.mode = 'walk'; break; }
        }
        if (f.mode === 'idle') f.timer = state.t + 1;
      }
    }
    wayStep(f);
    const sp = tune.folkSpeed * (f.kind === 'child' ? 1.25 : 1) * (onPathCell(Math.floor(f.x), Math.floor(f.z)) ? tune.pathSpeed : 1) * dt;
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
      if (d < sp + 0.01 && f.way && f.way.length) { f.x = f.tx; f.z = f.tz; const w = f.way.shift(); f.tx = w[0]; f.tz = w[1]; f.wpt = [f.tx, f.tz]; } // on to the next waypoint
      else if (d < sp + 0.01) {
        f.x = f.tx; f.z = f.tz; f.walk = 0; f.way = null;
        if (f.mode === 'home') { if (Math.hypot(f.x - dx, f.z - dz) < 0.05) { f.mode = 'inside'; f.timer = state.t + 2 + rng() * 3; } else { f.tx = dx; f.tz = dz; } }
        else if (f.mode === 'toBridge') { if (bridgeById(f.bridge)) { f.mode = 'cross'; f.u = 0; } else { f.mode = 'idle'; f.bridge = 0; } }
        else {
          f.mode = 'idle'; f.timer = state.t + tune.folkIdleMin + rng() * (tune.folkIdleMax - tune.folkIdleMin);
          if (f.lookAt) { f.h = Math.atan2(f.lookAt[0] - f.x, f.lookAt[1] - f.z); f.lookAt = null; } // turn to face what they came to see
        }
      } else {
        f.x += ddx / d * sp; f.z += ddz / d * sp; f.walk += dt;
        const th = Math.atan2(ddx, ddz); let dh = th - f.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); f.h += dh * Math.min(1, dt * 8);
      }
    }
    f.y = islandLift(f.isl);
  }
  // Two sky-folk standing close stop for a chat: they turn to each other and a bubble shows.
  for (const f of state.folk) f.chat = f.seat != null && f.act === 'talk' && f.sit >= 1 && Math.sin(state.t * 0.9 + f.id * 1.7) > 0; // talkers by the fire take turns
  for (const a of state.folk) {
    if (a.mode !== 'idle' || a.chat || a.seat != null) continue;
    const b = state.folk.find(o => o !== a && o.mode === 'idle' && !o.chat && o.seat == null && o.isl === a.isl && Math.hypot(o.x - a.x, o.z - a.z) < 1.1);
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
  notify('event', `The ${state.families[houseId].name}s adopt ${name}`, { icon: 'paw', at: [o.x, o.z] });
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
/**
 * A home grows with its family, never shrinking: each child adds a side room (houseRoomsMax),
 * and each child who grows up raises it (homeLoftsMax): first a storey with a balcony, then a
 * turret. A child who marries away leaves their part of the home behind.
 */
function roomsStep() {
  for (const p of state.pieces) {
    if (p.type !== 'house' || !state.families[p.id]) continue;
    let kids = 0, grown = 0;
    for (const f of state.folk) if (f.house === p.id && (f.kind === 'child' || (f.grown && !f.married))) { kids++; if (f.grown) grown++; }
    const room = Math.min(tune.houseRoomsMax, kids) > (p.rooms || 0), loft = Math.min(tune.homeLoftsMax, grown) > (p.lofts || 0);
    if (!room && !loft) { p.roomAt = 0; continue; }
    if (!p.roomAt) p.roomAt = state.t + tune.houseRoomDelay; // a moment after the birth or growing up, so the two do not crowd each other
    else if (state.t >= p.roomAt) {
      p.roomAt = 0; const [cx, cz] = centerOf(p);
      if (room) { p.rooms = (p.rooms || 0) + 1; fxPuff(cx + (p.rooms === 1 ? -0.3 : 0.3), pieceY(p), cz, '#fff6ee'); }
      else { p.lofts = (p.lofts || 0) + 1; fxPuff(cx, pieceY(p) + 0.9, cz, '#fff6ee'); }
      sfx.place('house');
    }
  }
}
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
/**
 * A spot of a meadow's shelter in the world, turned with the meadow. lx, lz are in the old 1x1
 * meadow's terms (shelter at -0.14, -0.17); makeMeadow2 sets the shelter 1.3 times bigger at
 * (-0.42, -0.42) of the 2x2, turned 0.35.
 */
function shelterSpot(q, lx, lz) {
  const [cx, cz] = centerOf(q), sx = (lx + 0.14) * 1.3, sz = (lz + 0.17) * 1.3, t = 0.35;
  const mx = -0.42 + sx * Math.cos(t) + sz * Math.sin(t), mz = -0.42 - sx * Math.sin(t) + sz * Math.cos(t), c = Math.cos(q.rot), sn = Math.sin(q.rot);
  return [cx + mx * c + mz * sn, cz - mx * sn + mz * c];
}
/**
 * Resting: at nightfall (after a random little wait) each fluffkin walks to its meadow's shelter and
 * lies down to sleep; in rain or a storm it shelters there awake. It comes out a while after the
 * night or the rain is over. With no way there it rests where it stands.
 */
function fluffRest(f, p) {
  const night = isNight(), wet = isWet(), want = night || wet;
  if (want) {
    f.dryAt = 0;
    if (!f.rest) { f.restAt ??= state.t + (night && !wet ? rng() * tune.fluffSleepStagger : 0); if (state.t < f.restAt) return false; f.rest = true; f.slot = null; }
  } else if (f.rest) {
    f.dryAt ||= state.t + (f.asleep ? rng() * tune.fluffSleepStagger : 3);
    if (state.t >= f.dryAt) { f.rest = false; f.restAt = null; f.dryAt = 0; f.inside = false; if (f.asleep) f.stretch = state.t + 1; f.asleep = false; f.timer = state.t + 1.2; return false; } // out of the door again
  } else { f.restAt = null; return false; }
  // resting: find a slot at the shelter (first come, first served), walk there, and settle
  const q = pieceById(p.shelterId) || p;
  if (f.slot === null || f.slot === undefined) { // walk to the shelter's door
    f.slotOf = q.id; const [sx, sz] = shelterSpot(q, -0.14, 0.3);
    if (fluffOk(sx, sz, f.isl) && fluffLine(f.x, f.z, sx, sz, f.isl)) { f.slot = 0; f.tx = sx; f.tz = sz; }
    else { f.slot = -1; f.tx = f.x; f.tz = f.z; } // no way there: rest right here on its meadow
  }
  const arrived = Math.hypot(f.tx - f.x, f.tz - f.z) < 0.03;
  if (arrived && !f.settled) { f.settled = true; f.h = q.rot + (rng() - 0.5) * 0.6; }
  if (!arrived) f.settled = false;
  f.inside = arrived && f.slot === 0; // in through the door and out of sight, as sky-folk go into a house
  f.asleep = arrived && night;
  return true;
}
function fluffStep(dt) {
  for (const p of state.pieces) if (p.type === 'meadow' && p.grow >= 1 && !state.fluff.some(f => f.meadow === p.id)) {
    const [dx, dz] = shelterSpot(p, -0.14, 0.3); // it comes out of the shelter's door
    state.fluff.push({ id: state.nextId++, meadow: p.id, isl: p.isl, x: dx, z: dz, tx: dx, tz: dz, h: 0, timer: state.t + 2, walk: 0 });
  }
  for (const f of state.fluff) {
    const p = pieceById(f.meadow); if (!p) continue;
    const stuck = !fluffOk(f.x, f.z, f.isl); // something was built where it stood: let it walk out
    if (stuck && f.rest) { f.slot = null; f.settled = false; }
    const resting = fluffRest(f, p);
    if (!resting && state.t >= f.timer) { // pick somewhere near its meadow it can actually reach in a straight line
      f.timer = state.t + 4 + rng() * 6; f.tx = f.x; f.tz = f.z;
      const [mcx, mcz] = centerOf(p), [hx, hz] = shelterSpot(p, -0.14, -0.17);
      for (let k = 0; k < 8; k++) { // anywhere on its meadow and a little round it, but not into the hut
        const tx = mcx + (rng() - 0.5) * 2.6, tz = mcz + (rng() - 0.5) * 2.6;
        if (Math.hypot(tx - hx, tz - hz) > 0.42 && fluffOk(tx, tz, f.isl) && fluffLine(f.x, f.z, tx, tz, f.isl)) { f.tx = tx; f.tz = tz; break; }
      }
      if (stuck) { f.tx = mcx; f.tz = mcz; }
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
    // a soft nudge apart from other fluffkins, sky-folk and pets, never into anything solid (two settled in the shelter may lie close)
    for (const o of [...state.fluff, ...state.folk, ...state.pets]) {
      if (f.inside || o === f || o.isl !== f.isl || o.mode === 'inside' || o.inside || (f.settled && o.settled)) continue;
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
/** Is a piece's unlock met: a population, an island found (and its reveal done), or a relic brought home? */
function unlockMet(d) {
  if (d.unlockPop) return pop() >= tune[d.unlockPop];
  if (d.unlockIsland !== undefined) { const s = state.islands[d.unlockIsland]; return !!s && s.discovered && s.reveal >= 1; }
  if (d.unlockRelic) return !!state.relics[d.unlockRelic];
  return false;
}
function unlockStep() {
  state.homeStyles = state.homeStyles || {};
  for (const [n, key, label] of HOUSE_STYLES) if (key && !state.homeStyles[n] && pop() >= tune[key]) { state.homeStyles[n] = 1; notify('event', `New homes dreamed: ${label}`, { icon: 'house' }); sfx.unlock(); }
  for (const t in PIECES) if (!state.unlocked[t] && unlockMet(PIECES[t])) {
    state.unlocked[t] = 1; notify('event', `New piece: ${PIECES[t].name}`, { icon: 'star' }); sfx.unlock();
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
    state.questReady = true; notify('event', 'The mist is thinning...', { icon: 'island', quest: true }); sfx.ready();
  }
}
function hintStep() {
  const c = state.counts;
  let h = '';
  if (state.mode === 'voyage') h = '';
  else if (state.tool === 'bridge' && state.bridgePreview) h = state.bridgePreview;
  else if (state.tool === 'bridge' && state.bridgeStart) h = 'Now tap the far end';
  else if (!c.houses) h = state.tool === 'house' ? 'Tap the island to build a home.' : 'Pick the House, then tap the island.';
  else if (!pop() && !state.puffs.length && !state.pieces.some(p => p.type === 'house' && hasGreen(p))) h = 'Plant a Tree beside your home.';
  else if (!pop()) h = 'Look up... someone is coming.';
  else if (state.questReady) h = 'The mist is parting. Tap Set sail!';
  else if (state.quest === 0 && pop() < 4) h = 'Each ready home draws a family.';
  else if (state.found.length === 1 && !state.islands[state.found[0]].secretFound) h = 'Something shimmers on the new island...';
  state.hint = h;
}

// ---- The first-start guide ------------------------------------------------------------------------
/** Shown on a first start (never finished or skipped in this browser), or with ?tutorial=1 in the address. */
function tutorialWanted() {
  if (params.get('tutorial') === '1') return true;
  if (params.get('tutorial') === '0') return false;
  try { return localStorage.getItem('abovea.tutorialDone') !== '1'; } catch (_) { return true; } // storage blocked: show it
}
function endTutorial() {
  state.tut = null;
  try { localStorage.setItem('abovea.tutorialDone', '1'); } catch (_) { /* storage blocked */ }
}
const homeIsReady = () => state.pieces.some(p => p.type === 'house' && hasGreen(p));
/**
 * The guide's current line, worked out from the island as it is: no home yet, then no green near
 * a home, then a last happy line. target names the button that glows: 'cat:<id>' or 'tool:<id>'.
 */
function tutorialNow() {
  if (!state.tut) return null;
  if (!state.counts.houses) {
    const head = 'First home · 1/2';
    if (state.tool === 'house') return { head, text: 'Tap the island to build.' };
    if (state.cat !== 'homes') return { head, text: 'Welcome! Open Homes below.', target: 'cat:homes' };
    return { head, text: 'Welcome! Pick the House.', target: 'tool:house' };
  }
  if (!homeIsReady()) {
    const head = 'Something green · 2/2';
    if (state.tool === 'tree') return { head, text: 'Tap near your house.' };
    if (state.cat !== 'nature') return { head, text: 'Homes need green nearby. Open Nature.', target: 'cat:nature' };
    return { head, text: 'Pick the Tree.', target: 'tool:tree' };
  }
  return { head: 'Your home is ready', text: 'A family is on the way!' };
}
/** Ends the guide a little while after the first home is ready. */
function tutorialStep() {
  const tt = state.tut;
  if (!tt || !state.counts.houses || !homeIsReady()) return;
  if (!tt.endAt) tt.endAt = state.t + tune.tutorialEndSecs;
  else if (state.t >= tt.endAt) endTutorial();
}

// ---- Taps on the world ----------------------------------------------------------------------------
function tapsStep() {
  for (const tp of taps) {
    if (state.modal) return;
    if (state.choosing) { chartTap(tp); continue; }
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
    else if (state.tool === 'move') moveTap(hit);
    else if (state.tool === 'bridge') bridgeTap(hit);
    else if (!there && ter && state.tool !== 'look') {
      oops(ter.kind === 'mountain' ? 'Not on the mountain' : ter.kind === 'lake' ? 'A still lake: bridges only' : 'The river: bridges only');
    } else if (state.tool === 'look' || (there && canPlace(state.tool, hit) < 0)) {
      if (there && state.families[there.id]) { toast(familyLine(there)); sfx.ui(); }
      else if (there && there.type === 'house') toast(there.done < 1 ? 'Being built...' : hasGreen(there) ? 'Ready: a family is coming' : 'Empty: needs green nearby');
      else if (there && PIECES[there.type].kind === 'living') toast(there.grow < 1 ? `Growing... ${Math.round(there.grow * 100)}%` : 'Fully grown');
    } else place(state.tool, hit);
  }
}
/** Bridge tool: the first tap sets where it starts, the second where it ends; the rest fills in. */
function bridgeTap(hit) {
  const st = state.bridgeStart;
  if (!st) {
    const e = bridgeEndOk(hit); if (e) { oops(e); return; }
    state.bridgeStart = { i: hit.i, j: hit.j, isl: hit.isl }; sfx.ui(); // the dock's hint now asks for the far end
    return;
  }
  if (st.i === hit.i && st.j === hit.j) { state.bridgeStart = null; sfx.ui(); return; }
  const why = bridgeProblem(st, hit);
  if (why) { oops(why); return; }
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
/**
 * The hidden islands a ready quest can sail to: every one not yet found. The legendary island
 * stays out of reach (shown, locked) until tune.spireAfterFound islands are found, unless it is
 * the only one left.
 */
function chartIslands() {
  const hidden = ISLANDS.filter(i => i.id && !state.islands[i.id].discovered);
  return hidden.map(isl => ({ isl, open: isl.rarity !== 'legendary' || state.found.length >= tune.spireAfterFound || hidden.length === 1 }));
}
/**
 * Set sail: the camera rises over the whole sky and you choose a hidden island there (hover or
 * tap one for a word about it). Esc or Back lands again; the quest stays ready.
 */
function openChart() {
  if (!state.questReady || !state.sailed || state.mode === 'voyage' || state.modal || state.choosing) return;
  if (!chartIslands().some(x => x.open)) return;
  if (state.carry) cancelCarry();
  state.choosing = { sel: null, hover: null }; state.tool = 'look'; state.bridgeStart = null; sfx.ui();
  events.push({ type: 'chart' });
}
function closeChart() { if (!state.choosing) return; state.choosing = null; sfx.ui(); }
/** Set sail: the voyage first; once sailed (even if you landed again without choosing), straight to choosing. */
function setSail() { if (!state.questReady) return; if (state.sailed) openChart(); else startVoyage(); }
/** The island you choose from above is found. */
function chooseIsland(id) {
  if (!state.choosing || !chartIslands().some(x => x.open && x.isl.id === id)) return;
  state.choosing = null;
  revealIsland(id);
}
/** The next voyage from the bag: each of the four comes round once before any repeats, never twice running. */
function drawGame() {
  if (!state.voyageBag || !state.voyageBag.length) {
    const b = ['motes', 'firefly', 'gates', 'bell'];
    for (let k = b.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [b[k], b[j]] = [b[j], b[k]]; }
    if (b[b.length - 1] === state.lastGame) [b[0], b[b.length - 1]] = [b[b.length - 1], b[0]];
    state.voyageBag = b;
  }
  return (state.lastGame = state.voyageBag.pop());
}
/** The island's rarity: rolled when it is found (home is home; the spire is always legendary). */
function rarityOf(id) { const s = state.islands[id]; return (s && s.rarity) || ISLANDS[id].rarity; }
/**
 * Found at last: the spire keeps its Star-lamp and stays legendary; any other island may carry
 * one of the relics still to deal (so both come before the last of them), and is rare (epic)
 * with one, or now and then without.
 */
function rollIsland(id) {
  const s = state.islands[id], isl = ISLANDS[id];
  if (isl.relic) { s.rarity = 'legendary'; s.relic = isl.relic; return; }
  const dealt = new Set(state.islands.map(x => x.relic).filter(Boolean));
  const left = ['bell', 'mothlantern'].filter(k => !dealt.has(k) && !state.relics[k]);
  const hidden = ISLANDS.filter(i => i.id && !i.relic && !state.islands[i.id].discovered).length; // counting this one
  s.relic = left.length && rng() < left.length / Math.max(1, hidden) ? left[Math.floor(rng() * left.length)] : null;
  s.rarity = s.relic || rng() < tune.epicChance ? 'epic' : 'normal';
}
/** The hidden island under a screen point, from above: a ray to each island's height. */
function chartPick(x, y) {
  const ray = screenRay(x, y); if (!ray) return null;
  let best = null, bt = 1e9;
  for (const { isl } of chartIslands()) {
    const t = (islandLift(isl.id) - ray.o.y) / ray.d.y; if (t <= 0) continue;
    const px = ray.o.x + ray.d.x * t, pz = ray.o.z + ray.d.z * t;
    if (Math.hypot(px - isl.cx, pz - isl.cz) < isl.r * 1.15 && t < bt) { bt = t; best = isl.id; }
  }
  return best;
}
/** A tap from above: a mouse click sails (hovering already said what it is); a touch picks first, then Sail here or a second tap sails. */
function chartTap(tp) {
  const id = chartPick(tp.x, tp.y), ch = state.choosing;
  if (id == null) { ch.sel = null; return; }
  if (!chartIslands().find(x => x.isl.id === id).open) { ch.sel = id; oops('Too far yet. The light is faint.'); return; }
  if (tp.mouse || ch.sel === id) chooseIsland(id); else { ch.sel = id; sfx.ui(); }
}
/** Keys from above: Left and Right walk the islands you may sail to, round the sky; Enter or Space sails. */
function chartKeys() {
  const ch = state.choosing, open = chartIslands().filter(x => x.open).map(x => x.isl).sort((a, b) => Math.atan2(a.cz, a.cx) - Math.atan2(b.cz, b.cx));
  const L = pressed('ArrowLeft') || pressed('KeyA'), Rt = pressed('ArrowRight') || pressed('KeyD');
  if ((L || Rt) && open.length) { const i = open.findIndex(i => i.id === ch.sel); ch.sel = open[(i < 0 ? 0 : i + (Rt ? 1 : -1) + open.length) % open.length].id; sfx.ui(); }
  if ((pressed('Enter') || pressed('Space')) && ch.sel != null) chooseIsland(ch.sel);
}
function startVoyage() {
  if (!state.questReady || state.mode === 'voyage' || state.sailed) return;
  if (state.carry) cancelCarry();
  const game = drawGame();
  state.mode = 'voyage';
  state.voyage = { x: 0, tx: 0, z: 0, t: 0, caught: 0, need: { motes: tune.voyageMotes, firefly: 6, gates: tune.gateCount, bell: tune.bellCount }[game],
    next: 0.8, motes: [], gates: [], done: -1, bob: 0, game, prog: 0, fly: 0, beat: 0, answered: -1, glow: 0 };
  sfx.sail(); events.push({ type: 'voyage', game });
}
/** Bell Echo: a tap answers the ring whose ripple is meeting the boat; off the beat it is only a soft note. */
function voyageTap() {
  const v = state.voyage; if (!v || v.game !== 'bell' || v.done >= 0) return;
  const k = Math.round((v.t - 1) / tune.bellBeat); // the ring nearest now; ring k reaches you at 1 + k * beat
  if (k >= 1 && k !== v.answered && Math.abs(v.t - 1 - k * tune.bellBeat) <= tune.bellWindow) {
    v.answered = k; v.caught++; v.glow = 1; sfx.mote(v.caught);
    if (v.caught >= v.need) { v.done = v.t; sfx.discover(); }
  } else sfx.ui();
}
function voyageStep(dt) {
  const v = state.voyage;
  v.t += dt; v.z -= tune.voyageSpeed * dt;
  if (v.game === 'bell') v.tx = 0; // the bell's boat glides down the middle
  v.x += (v.tx - v.x) * Math.min(1, dt * 5);
  v.glow = Math.max(0, v.glow - dt * 1.5);
  if (v.game === 'firefly') {
    // the firefly weaves ahead; time kept close to it fills the way
    v.fly = Math.sin(v.t * Math.PI * 2 * tune.fireflyWeave) * tune.voyageWidth * 0.65 + Math.sin(v.t * 1.37) * tune.voyageWidth * 0.2;
    if (v.done < 0 && Math.abs(v.fly - v.x) < tune.fireflyRadius) {
      v.prog += dt; v.glow = Math.max(v.glow, 0.5);
      const c = Math.min(v.need, Math.floor(v.prog / tune.fireflyHold * v.need));
      if (c > v.caught) { v.caught = c; sfx.mote(c); }
      if (v.prog >= tune.fireflyHold) { v.done = v.t; sfx.discover(); }
    }
  } else if (v.game === 'gates') {
    if (v.done < 0 && v.t >= v.next) { v.next += tune.gateEvery; v.gates.push({ id: state.nextId++, x: (rng() * 2 - 1) * tune.voyageWidth * 0.8, z: v.z - 55, lit: 0, judged: false }); }
    for (const gt of v.gates) {
      if (!gt.judged && gt.z >= v.z) {
        gt.judged = true;
        if (v.done < 0 && Math.abs(gt.x - v.x) < tune.gateRadius) { gt.lit = 1; v.caught++; v.glow = 1; sfx.mote(v.caught); if (v.caught >= v.need) { v.done = v.t; sfx.discover(); } }
      }
    }
    v.gates = v.gates.filter(gt => gt.z < v.z + 8);
  } else if (v.game === 'bell') {
    const k = Math.floor((v.t - 1) / tune.bellBeat) + 1; // a ring sounds a beat before it reaches you
    if (v.done < 0 && k > v.beat && v.t >= 1 + (k - 1) * tune.bellBeat) { v.beat = k; sfx.bellRing(); }
  }
  if (v.game === 'motes' && v.done < 0 && v.t >= v.next) {
    v.next += tune.moteEvery;
    v.motes.push({ id: state.nextId++, x: (rng() * 2 - 1) * tune.voyageWidth * 0.9, z: v.z - 55, ph: rng() * 6 });
  }
  for (const m of v.motes) m.x += Math.sin(v.t * 1.3 + m.ph) * dt * 0.6; // (only Mote Catch has motes)
  for (const m of v.motes.slice()) {
    if (Math.abs(m.z - v.z) < tune.moteRadius && Math.abs(m.x - v.x) < tune.moteRadius && v.done < 0) {
      v.caught++; v.motes = v.motes.filter(x => x !== m); sfx.mote(v.caught);
      if (v.caught >= v.need) { v.done = v.t; sfx.discover(); }
    } else if (m.z > v.z + 6) v.motes = v.motes.filter(x => x !== m);
  }
  if (v.done >= 0 && v.t - v.done > 2.4) finishVoyage();
}
/** The voyage's end: the mist parts and the sky opens from above, to choose where it has brought you. */
function finishVoyage() {
  state.mode = 'build'; state.voyage = null; state.sailed = true;
  notify('info', 'The mist parts... where will you land?');
  openChart();
}
/** The chosen island is found: its rarity and relic are rolled now, and its story told. */
function revealIsland(id) {
  const isl = ISLANDS[id];
  rollIsland(id); state.sailed = false;
  state.islands[id].discovered = true; state.islands[id].reveal = 0;
  state.quest++; state.questReady = false; state.found.push(isl.id); // by id: names are made fresh for every sky
  state.gained = 'Found: ' + state.found.map(id => ISLANDS[id].name).join(', ');
  state.view = 'builder'; state.cam.tx = isl.cx; state.cam.tz = isl.cz; state.cam.dist = Math.max(state.cam.dist, 16);
  const rar = rarityOf(id);
  fxSpark(isl.cx, isl.y + 1, isl.cz, rar === 'normal' ? '#fff3b0' : RARITY[rar].color, rar === 'normal' ? 30 : 60);
  if (rar !== 'normal') sfx.ready(); // a rare island chimes
  openModal({ kind: 'story', island: id });
  events.push({ type: 'discover', island: id });
}
function openModal(m) { if (state.modal) state.modalQueue.push(m); else state.modal = m; }
function closeModal() {
  const m = state.modal; if (!m) return;
  state.modal = null; sfx.ui();
  if (m.kind === 'story') {
    const isl = ISLANDS[m.island], rk = state.islands[isl.id].relic, relic = rk && RELICS[rk];
    if (relic && !state.relics[relic.kind]) {
      state.relics[relic.kind] = true; state.islands[isl.id].relicTaken = true;
      if (relic.kind === 'bell') { state.track = 'bell'; resetMusic(); notify('event', 'New song: the Wind Bell', { icon: 'bell', quest: true }); sfx.bell(); }
      if (relic.kind === 'mothlantern') { state.unlocked.wispjar = 1; notify('event', 'New piece: ' + PIECES.wispjar.name, { icon: 'mothlantern', quest: true }); sfx.unlock(); }
      if (relic.kind === 'starlamp') { state.nightShow = true; notify('event', 'Star-lamp lit. Watch tonight...', { icon: 'starlamp', quest: true }); sfx.discover(); }
    }
    notify('info', isl.name + ': you can build here now');
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
      if (w.kind !== 'snow') notify('event', w.kind === 'rain' ? 'Soft rain: gardens grow faster' : 'Thunder: folk hurry home', { icon: 'cloud', weather: true }); // snow speaks for itself
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
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, time: { value: 0 }, day: { value: 1 }, night: { value: 0 }, galRot: { value: new THREE.Matrix3() }, cosmos: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: [
      'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 bot; uniform float time; uniform float day; uniform float night; uniform mat3 galRot; uniform float cosmos; varying vec3 vP;',
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
      // at night, the galaxy: a soft lavender-peach river with darker dust lanes, turning with the sky (above and below)
      '  if (cosmos > 0.01) { vec3 g = galRot * vP; float lat = dot(g, normalize(vec3(0.75, 0.45, 0.5)));',
      '    float mw = exp(-lat * lat * 22.0), lane = smoothstep(0.45, 0.7, fbm(g * 5.0));',
      '    vec3 mwc = mix(vec3(0.788, 0.722, 1.0), vec3(1.0, 0.824, 0.761), fbm(g * 2.0 + 4.0));',
      '    c += mwc * mw * 0.5 * cosmos * (1.0 - 0.6 * lane); c = mix(c, vec3(0.165, 0.137, 0.251), mw * lane * 0.25 * cosmos); }',
      '  gl_FragColor = vec4(c, 1.0);',
      '#include <tonemapping_fragment>',
      '#include <colorspace_fragment>',
      '}'].join('\n'),
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
  const cosmos = makeCosmos(renderer); scene.add(cosmos.group);
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
  sea.material.transparent = true; sea.material.depthWrite = false; // it thins at night so the universe shows below
  R3 = { renderer, scene, cam, hemi, dir, rim, skyMat, cosmos, stars, lampStars, aurora, auroraMats, sunGlow, farMat, farIslands, planet, bankMat, dust, sea, clouds, ghostMat, rain, snow, fxGeo: new THREE.IcosahedronGeometry(0.22, 0) };
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
    // Where each river leaves, the rim is notched so the water pours through a rock-lined gap.
    const notches = (isl.rivers || []).map(rv => { const c = rv.path[rv.path.length - 1], r = rimFrom(isl, c, rv.exit.d); return { x: c[0] + 0.5 - isl.cx + rv.exit.d[0] * r, z: c[1] + 0.5 - isl.cz + rv.exit.d[1] * r, d: rv.exit.d }; });
    const g = makeIsland(isl, notches); g.position.set(isl.cx, isl.y, isl.cz);
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
      const river = makeRiver(rv.path.map(rel), rv.exit.d, rim, rv.back, tune.springCascadeHeight); g.add(river);
      if (river.userData.spring) { vis.falls.push(river.userData.spring.fall); vis.springs.push(river.userData.spring); }
      const fall = makeWaterfall(3 + isl.r * 1.2, 0.54), b = river.userData.brink; // takes over where the water curls over the brink
      fall.position.set(lx + ex * b.along, b.y, lz + ez * b.along); fall.rotation.y = Math.atan2(ex, ez);
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
  toast(`Graphics: ${GFX.high ? 'High' : 'Low'}`);
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
  if (state.choosing && scene !== 'title') {
    // the whole sky from above, framed to the outermost island, the vertical or the side, whichever is tighter
    let E = 10; for (const isl of ISLANDS) E = Math.max(E, Math.hypot(isl.cx, isl.cz) + isl.r);
    const tv = Math.tan(Math.PI * 45 / 360), th = tv * innerWidth / innerHeight, H = E * tune.chartFrame / Math.min(tv, th);
    pos.set(0, H, H * 0.22); look.set(0, 0, 0);
  } else if (state.view === 'postcard' || scene === 'title') {
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
/**
 * The turning sky (art director's spec): one group on the camera holding everything night-only,
 * turned about the vertical: 1400 twinkling stars, thicker along the galaxy band, the twelve
 * constellations (tonight's drawn brighter), four planets (one near each night), the Still Eye,
 * three nebula clouds, a comet and falling stars. All of it sits low, round and below the
 * horizon too, where the builder's camera sees it through the thinned cloud sea.
 */
function makeCosmos(renderer) {
  const group = new THREE.Group(), spin = new THREE.Group(); group.add(spin); group.renderOrder = -1;
  const R = mrand(4242), TAU = Math.PI * 2, dir = (az, el) => new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  const BN = new THREE.Vector3(0.75, 0.45, 0.5).normalize(), deg = Math.PI / 180;
  const flat = o => { o.renderOrder = -1; o.material.fog = false; o.material.depthWrite = false; o.material.transparent = true; return o; };
  // stars: a custom points shader that twinkles; constellation stars carry their figure's number
  const P = [], C = [], S = [], PH = [], FE = [], col = ['#f4eeff', '#ffd9c7', '#c8f0f0'].map(h => new THREE.Color(h));
  const addStar = (v, size, feat, cc) => { P.push(v.x * 430, v.y * 430, v.z * 430); C.push(cc.r, cc.g, cc.b); S.push(size); PH.push(R()); FE.push(feat); };
  for (let k = 0; k < 1400; k++) {
    let v;
    if (k < 770) { do { v = new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); } while (v.lengthSq() > 1 || v.lengthSq() < 0.01); v.normalize(); if (v.y > 0.2 && R() < 0.6) v.y = -v.y; } // more of them low, where the builder's camera looks
    else { const a = R() * TAU, t1 = new THREE.Vector3(1, 0, 0).cross(BN).normalize(), t2 = BN.clone().cross(t1), lat = (R() + R() + R() - 1.5) * 0.14; v = t1.multiplyScalar(Math.cos(a)).addScaledVector(t2, Math.sin(a)).addScaledVector(BN, lat).normalize(); }
    const pick3 = R(); addStar(v, k < 770 ? 1.8 + R() * 3 : 1.6 + R() * 1.6, 0, pick3 < 0.7 ? col[0] : pick3 < 0.85 ? col[1] : col[2]);
  }
  // the constellations: figures low round the sky, each with its lines
  const lines = [];
  CONSTELLATIONS.forEach((cn, k) => {
    let pts = cn.pts, edges = cn.edges;
    if (!pts) { // a figure by a seeded random walk: 5-9 stars, a chain plus one branch
      const Rw = mrand(900 + k), n = 5 + Math.floor(Rw() * 5); pts = [[0, 0]]; let a = Rw() * TAU;
      while (pts.length < n) { a += (Rw() - 0.5) * 2.4; const st = 0.35 + Rw() * 0.2, last = pts[pts.length - 1], q = [last[0] + Math.cos(a) * st, last[1] + Math.sin(a) * st]; if (pts.every(p => Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.25)) pts.push(q); else a += 1; }
      const cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n; pts = pts.map(p => [p[0] - cx, p[1] - cy]);
      edges = pts.slice(1).map((_, i) => [i, i + 1]); edges.push([Math.floor(n / 2), n - 1 - (n > 5 ? 1 : 0)]);
    }
    const az = k * 30 * deg, el = -(22 + (k % 2) * 16) * deg, Cv = dir(az, el), E = new THREE.Vector3(-Math.sin(az), 0, Math.cos(az)), N = new THREE.Vector3().crossVectors(Cv, E).normalize().negate(), s = 0.17;
    const wp = pts.map(([x, y]) => Cv.clone().addScaledVector(E, x * s).addScaledVector(N, y * s).normalize());
    wp.forEach(v => addStar(v, 4.2, k + 1, new THREE.Color('#fff4d8')));
    const lp = []; for (const [a2, b2] of edges) if (wp[a2] && wp[b2]) lp.push(wp[a2].x * 428, wp[a2].y * 428, wp[a2].z * 428, wp[b2].x * 428, wp[b2].y * 428, wp[b2].z * 428);
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const ls = flat(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#ffe7a8', opacity: 0, blending: THREE.AdditiveBlending }))); spin.add(ls); lines.push(ls);
  });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('aColor', new THREE.Float32BufferAttribute(C, 3));
  sg.setAttribute('aSize', new THREE.Float32BufferAttribute(S, 1)); sg.setAttribute('aPhase', new THREE.Float32BufferAttribute(PH, 1)); sg.setAttribute('aFeat', new THREE.Float32BufferAttribute(FE, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uFeat: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute vec3 aColor; attribute float aSize; attribute float aPhase; attribute float aFeat; uniform float uFeat; uniform float uPR; varying vec3 vC; varying float vPh; void main(){ vC = aColor; vPh = aPhase; float on = aFeat > 0.5 && abs(aFeat - uFeat) < 0.5 ? 1.0 : 0.0; gl_PointSize = aSize * uPR * (1.0 + on * 0.8); vC *= aFeat > 0.5 ? (0.55 + on * 0.45) : 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uTime; uniform float uFade; varying vec3 vC; varying float vPh; void main(){ float tw = 0.72 + 0.28 * sin(uTime * (1.4 + vPh * 2.2) + vPh * 6.283); float a = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vC, a * tw * uFade); }',
  });
  const stars = new THREE.Points(sg, starMat); stars.renderOrder = -1; stars.frustumCulled = false; spin.add(stars);
  // planets, low round the sky; one comes near each night
  const planets = ['amberwhorl', 'frostling', 'rosemoon', 'twinlets'].map((kd, k) => {
    const sp = flat(new THREE.Sprite(new THREE.SpriteMaterial({ map: cosmosPlanetTex(kd), opacity: 0 }))); sp.position.copy(dir((45 + k * 90) * deg, -(26 + (k % 2) * 14) * deg)).multiplyScalar(405); spin.add(sp); return sp; });
  // the Still Eye, with a soft lavender glow behind it
  const eye = flat(new THREE.Sprite(new THREE.SpriteMaterial({ map: stillEyeTex(), opacity: 0 }))); eye.position.copy(dir(200 * deg, -32 * deg)).multiplyScalar(410); eye.scale.set(95, 95, 1); spin.add(eye);
  const eyeGlow = flat(glow('#b9a2ff', 150, 0)); eyeGlow.position.copy(eye.position).multiplyScalar(1.01); spin.add(eyeGlow);
  // nebula clouds along the band, and a comet on some nights
  const nebulae = [['rgba(231,166,216,A)', 20], ['rgba(143,211,214,A)', 150], ['rgba(185,162,255,A)', 280]].map(([cc, az], k) => {
    const n = flat(new THREE.Sprite(new THREE.SpriteMaterial({ map: nebulaTex(cc, 70 + k), opacity: 0, blending: THREE.AdditiveBlending }))); n.position.copy(dir(az * deg, -(24 + k * 8) * deg)).multiplyScalar(425); const sc = 220 + k * 40; n.scale.set(sc, sc, 1); spin.add(n); return n; });
  const comet = flat(new THREE.Sprite(new THREE.SpriteMaterial({ map: cometTex(), opacity: 0 }))); comet.position.copy(dir(110 * deg, -30 * deg)).multiplyScalar(415); comet.scale.set(90, 22, 1); comet.material.rotation = 0.5; spin.add(comet);
  // falling stars: a small pool, in the camera's frame
  const mtex = meteorTex(), meteors = [0, 1, 2, 3].map(k => { const s = flat(new THREE.Sprite(new THREE.SpriteMaterial({ map: mtex, color: ['#ffe7a8', '#ffc9e0', '#bff0ec', '#ffffff'][k], opacity: 0, blending: THREE.AdditiveBlending }))); s.scale.set(40, 4.5, 1); s.userData.t = 1; group.add(s); return s; });
  for (const o of [...planets, eye, eyeGlow, ...nebulae, comet]) o.frustumCulled = false;
  return { group, spin, starMat, lines, planets, eye, eyeGlow, nebulae, comet, meteors, nextMeteor: 0, m3: new THREE.Matrix3() };
}
/** Per frame: follow the camera, turn with the night, light tonight's sights, fly the falling stars. F is how far night has come in. */
function cosmosStep(F) {
  const K = R3.cosmos, tn = tonight(), U = R3.skyMat.uniforms;
  K.group.visible = F > 0.01; U.cosmos.value = F;
  if (!K.group.visible) return;
  K.group.position.copy(vis.camPos);
  K.spin.rotation.y = tn.n * 0.53 + state.dayT * Math.PI * 2 * tune.skyTurns;
  K.group.updateMatrixWorld(true);
  U.galRot.value.setFromMatrix4(K.spin.matrixWorld).transpose();
  K.starMat.uniforms.uTime.value = state.t; K.starMat.uniforms.uFade.value = F; K.starMat.uniforms.uFeat.value = tn.c + 1;
  const lampBoost = state.relics.starlamp ? 1.6 : 1;
  K.lines.forEach((l, k) => { l.material.opacity = (k === tn.c ? (tune.constLineGlow + 0.1 * Math.sin(state.t * 0.8)) * lampBoost : 0.15) * F; });
  K.planets.forEach((p, k) => { const near = k === tn.planet, sc = near ? (k === 0 ? 130 : 105) : 28; p.scale.set(sc, sc, 1); p.material.opacity = (near ? 0.95 : 0.7) * F; });
  K.eye.visible = K.eyeGlow.visible = tn.eye; K.eye.material.opacity = F; K.eyeGlow.material.opacity = 0.3 * F; K.eye.material.rotation += 0.0005;
  K.nebulae.forEach(n => { n.material.opacity = 0.35 * F; });
  K.comet.visible = tn.comet; K.comet.material.opacity = 0.5 * F;
  // falling stars: often on a meteor night, now and then otherwise
  if (state.t >= K.nextMeteor) {
    K.nextMeteor = state.t + (tn.meteor ? 3 + rng() * 4 : 30 + rng() * 25);
    const m = K.meteors.find(x => x.userData.t >= 1);
    if (m) {
      const fwd = vis.camLook.clone().sub(vis.camPos), az = Math.atan2(fwd.z, fwd.x) + (rng() - 0.5) * 1.0, el = -(18 + rng() * 25) * Math.PI / 180;
      const a = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(400);
      const side = new THREE.Vector3(-Math.sin(az), 0, Math.cos(az)).multiplyScalar(rng() < 0.5 ? 1 : -1), b2 = (20 + rng() * 25) * Math.PI / 180;
      const v = side.multiplyScalar(Math.cos(b2)).add(new THREE.Vector3(0, -Math.sin(b2), 0)).multiplyScalar(60);
      m.userData = { t: 0, a, v };
      const p0 = a.clone().add(vis.camPos).project(R3.cam), p1 = a.clone().add(v).add(vis.camPos).project(R3.cam);
      m.material.rotation = Math.atan2((p1.y - p0.y) / R3.cam.aspect, p1.x - p0.x) ;
    }
  }
  for (const m of K.meteors) {
    const u = m.userData; if (u.t >= 1) { m.material.opacity = 0; continue; }
    u.t = Math.min(1, u.t + 1 / 60 / 0.9); m.position.copy(u.a).addScaledVector(u.v, u.t); m.material.opacity = Math.sin(Math.PI * u.t) * 0.9 * F;
  }
}
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
  const F = smooth(0.15, 0.7, S.night) * (1 - over); // the universe fades in from dusk
  cosmosStep(F);
  R3.sea.material.opacity = 1 - tune.nightSeaClear * F;
  R3.planet.material.opacity = (0.32 + S.night * 0.55) * (1 - over * 0.8) * (1 - F);
  R3.bankMat.color.copy(hor).lerp(_c1.set('#ffffff'), 0.35 * S.daylight); R3.bankMat.opacity = 0.45 * (1 - over * 0.5);
  R3.dust.material.opacity = (0.35 + S.night * 0.55) * (1 - over * 0.7);
  R3.skyMat.uniforms.bot.value.copy(hor).lerp(_c1.set(S.daylight > 0.5 ? '#fff4ee' : '#4a4a7a'), 0.5);
  R3.scene.fog.color.copy(hor).lerp(_c1.set('#f6e4e0'), 0.25 * S.daylight);
  R3.scene.fog.density = tune.fogDensity * (1 + w.amt * 0.8) * (state.choosing ? 0.12 : 1); // from above, the mist thins so the far islands show
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
    const y = islandLift(isl.id), depth = isl.r * 1.2 + 1.4, cy = c.position.y;
    if (cy > y + 1.0 + sz * 0.6 || cy < y - depth - sz * 0.5) continue;
    // narrow: the rock's rounded profile at this depth (makeIsland)
    const narrow = cy < y ? Math.max(0.15, Math.pow(Math.cos(Math.min(1, (y - cy) / depth) * Math.PI / 2), 0.8)) : 1, dx = c.position.x - isl.cx, dz = c.position.z - isl.cz, dd = Math.hypot(dx, dz) || 1;
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
    f.userData.mist.forEach((m, k) => { const b = 1 + Math.sin(state.t * 1.3 + k * 1.9) * 0.12; m.scale.setScalar(m.userData.s * b); });
    fu.spray.forEach(d => { const t = (state.t * 0.7 + d.userData.ph) % 1, u = d.userData; d.position.set(u.x * (1 + t * 0.6), 0.04 + 0.12 * t - 0.75 * t * t, 0.1 + u.v * t); d.material.opacity = 0.8 * Math.min(1, t * 6) * (1 - t); });
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
    if (state.choosing && !s.discovered) { // from above: the islands you may sail to show plainly, the one you point at brightest
      const ch = state.choosing, open = chartIslands().some(x => x.open && x.isl.id === k), on = ch.hover === k || ch.sel === k;
      v.ghost.opacity = open ? (on ? 0.9 : 0.5 + 0.08 * Math.sin(state.t * 2 + k)) : 0.18;
    }
    const rv = s.reveal, e = 1 - Math.pow(1 - rv, 3);
    v.g.position.y = islandLift(k) + (s.discovered ? (1 - e) * -1.5 : 0);
    v.g.scale.setScalar(s.discovered ? 0.85 + 0.15 * e : 1);
    v.shimmer.visible = s.discovered && !s.secretFound && rv >= 1 && (k !== 0 || pop() > 0);
    v.shimmer.children.forEach((sp, j) => { sp.visible = v.shimmer.visible; sp.material.opacity = 0.35 + 0.45 * Math.max(0, Math.sin(state.t * 3 + j * 1.7)); });
    // the beacon: a faint light over every island the next voyage could reach, pulsing once a quest is ready
    // (and while a quest is ready, light-motes drift off home towards them: callStep)
    v.beacon.visible = !s.discovered && k > 0 && !!QUESTS[state.quest] && chartIslands().some(x => x.open && x.isl.id === k);
    v.beacon.material.opacity = v.beacon.visible ? (state.questReady ? 0.55 + 0.25 * Math.sin(state.t * 3) : 0.18) : 0;
    (v.g.userData.floaters || []).forEach(f => { f.position.y = f.userData.y0 + Math.sin(state.t * 0.5 + f.userData.ph) * 0.25; f.rotation.y = state.t * 0.1 + f.userData.ph; }); // stones floating beneath
    // Features: the bell leaves its gate, the spire's lamp goes quiet, windmills turn.
    v.feats.forEach(f => {
      if (f.userData.bell) f.userData.bell.visible = s.discovered ? s.relic === 'bell' && !s.relicTaken : !state.relics.bell; // hidden: it may be there; found: only if the bell was dealt here
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
const CONTACT = { rock: 0.8, house: 1.5, school: 1.7, healer: 1.6, tree: 1.15, lantern: 0.6, garden: 1.05, well: 1.1, totem: 0.8, windmill: 1.2, arch: 1.2, stone: 0.9,
  bloombox: 0.55, lullbench: 0.95, dreamkite: 0.5, puffcap: 0.8, hushwillow: 1.25, starbloom: 0.6, dewfall: 1.0, dreamloom: 1.0, bellcote: 0.95, wispjar: 0.6, orrery: 0.9, keeperlamp: 0.65, campfire: 1.9 };
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
    const shape = p.type === 'house' ? `${p.floors}|${p.rooms || 0}|${p.lofts || 0}|${p.style || ''}` : p.type === 'path' || p.type === 'bridge' ? (p.mask || 0) : p.type === 'meadow' ? (p.kind || '') : p.type === 'garden' ? `${p.mask || 0}|${p.kind || ''}|${p.mix || 0}|${p.shelter ? 1 : 0}` : p.type === 'puffcap' ? `${p.mask || 0}|${p.mix || 0}` : 0;
    if (m && m.userData.shape !== shape) { R3.scene.remove(m); m = null; }
    if (!m) {
      m = makePiece(p.type, p.seed, shape); m.userData.shape = shape;
      const cs = CONTACT[p.type]; if (cs) m.add(contactShadow(cs));
      R3.scene.add(m); vis.pieces.set(p.id, m);
    }
    const isl = ISLANDS[p.isl], vI = vis.islands[p.isl];
    m.visible = state.islands[p.isl].discovered && !p.lifted; // scenery on an island still in the mist waits for it; a piece being moved shows as its ghost
    const [pcx, pcz] = centerOf(p), sc = PIECES[p.type].scale || 1;
    m.position.set(pcx, pieceY(p) + vI.g.position.y - isl.y, pcz); m.rotation.y = p.rot;
    const def = PIECES[p.type];
    if (def.kind === 'living') {
      const s = Math.min(1, p.done) * (0.3 + 0.7 * p.grow);
      if (p.type === 'garden') { m.scale.setScalar(Math.min(1, p.done)); m.userData.flowers.forEach(f => f.scale.setScalar(Math.max(0.001, Math.min(1, (p.grow - f.userData.th * 0.9) * 4)))); }
      else if (p.type === 'meadow') { // the ground and shelter stand full size; the plants grow in, the tilled patches close over
        m.scale.setScalar(Math.min(1, p.done));
        for (const w of m.userData.plants) { const s = smooth(w.userData.th, w.userData.th + 0.18, p.grow); w.visible = s > 0; if (s > 0) w.scale.setScalar(s + 0.12 * Math.sin(Math.PI * s)); }
        for (const w of m.userData.soil) { const s = 1 - smooth(0.5, 0.8, p.grow); w.visible = s > 0; if (s > 0) w.scale.setScalar(s); }
      }
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
    if (m.userData.anim) m.userData.anim(state.t, S.night, state.weather.amt, p.seed, def.kind === 'living' ? p.grow : Math.min(1, p.done),
      state.weather.kind === 'rain' || state.weather.kind === 'thunder' ? state.weather.amt * tune.campfireRainDim : 0); // damp: how much the rain dims a fire
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
      let [x, y, z] = pos(state.t), [x2, , z2] = pos(state.t + 0.1); const u = m.userData;
      // A Bloombox, Dewfall Fountain or Hushwillow draws its critter down to rest beside it for a while.
      const lures = state.pieces.filter(p => p.isl === isl.id && PIECES[p.type].lure === kind && p.done >= 1 && p.grow >= 1);
      if (lures.length) {
        const q = lures[k % lures.length], c = Math.sin(state.t * 0.07 + ph), w = Math.max(0, Math.min(1, (c - (1 - 2 * tune.lureShare)) * 4));
        if (w > 0) {
          const a = state.t * 0.9 + ph, top = q.type === 'hushwillow' ? 1.05 : q.type === 'dewfall' ? 0.75 : 0.62;
          const cx = q.i + 0.5, cz = q.j + 0.5, ly = lift + top + Math.sin(state.t * 1.7 + ph) * 0.06, e = w * w * (3 - 2 * w);
          const lx = cx + Math.cos(a) * 0.32, lz = cz + Math.sin(a) * 0.32, nx = cx + Math.cos(a + 0.09) * 0.32, nz = cz + Math.sin(a + 0.09) * 0.32;
          x2 += (nx - x2) * e; z2 += (nz - z2) * e;
          x += (lx - x) * e; y += (ly - y) * e; z += (lz - z) * e;
        }
      }
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
    const umb = !!f.umbrella && f.mode !== 'inside'; u.umbrella.visible = umb; // staying out in the rain: umbrella up, held in the right hand
    if (umb) { u.arms[1].rotation.x = -0.55; u.umbrella.rotation.x = Math.sin(state.t * 1.7 + f.id) * 0.05; }
    b.position.y = Math.abs(Math.cos(a.ph)) * 0.025 * amp;
    b.rotation.x = 0.07 * amp; // leans into the walk
    b.rotation.z = s * 0.045 * amp + Math.sin(state.t * 1.5 + f.id) * 0.03 * (1 - amp);
    u.head.rotation.z = -s * 0.04 * amp; u.head.rotation.y = Math.sin(state.t * 0.6 + f.id * 2) * 0.25 * (1 - amp); // looks about when standing
    u.head.rotation.x = 0; u.arms[0].rotation.z = -0.35; u.arms[1].rotation.z = 0.35;
    firePose(m, f);
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
    animQuad(m, a, f.rest ? 0 : Math.max(0, Math.sin(state.t * 0.7 + f.id)) * 0.35); // grazes when it stands
    sleepPose(m, f);
    m.visible = !f.inside; // inside its shelter
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
/**
 * Sitting by a campfire: lifted onto the log with knees up, and the pose and prop of what they
 * are doing (roasting a marshmallow that browns and is eaten, talking, singing, lute, flute, drum).
 */
function firePose(m, f) {
  const u = m.userData, P = u.props, k = f.seat != null ? (f.sit || 0) : 0, act = k >= 1 ? f.act : null, t = state.t, id = f.id;
  P.stick.visible = act === 'roast'; P.lute.visible = act === 'lute'; P.flute.visible = act === 'flute'; P.drum.visible = act === 'drum';
  if (!k) return;
  m.position.y += k * ((f.seatY || 0.155) - 0.05 * (f.kind === 'child' ? 0.62 : 1));
  u.legs[0].rotation.x = u.legs[1].rotation.x = -1.3 * k; u.body.rotation.x = -0.06 * k; u.body.position.y = 0;
  const A = u.arms, H = u.head;
  if (act === 'roast') {
    const cyc = (t * 0.11 + id * 0.37) % 1, eat = cyc > 0.88;
    A[1].rotation.x = eat ? -2.2 : -1.0 + Math.sin(t * 1.3 + id) * 0.05; P.stick.rotation.x = eat ? 0.4 : -0.5;
    P.mallowMat.color.set('#fff3e0').lerp(_toast, Math.min(1, cyc / 0.88) * 0.85); H.rotation.x = eat ? -0.1 : 0.15;
  } else if (act === 'talk') {
    H.rotation.y = Math.sin(t * 0.45 + id) * 0.7; H.rotation.x = Math.sin(t * 3.2 + id) * 0.08;
    A[0].rotation.x = -0.3 - Math.max(0, Math.sin(t * 2.3 + id)) * 0.7; A[1].rotation.x = -0.2;
  } else if (act === 'sing') {
    H.rotation.x = -0.3; u.body.rotation.z = Math.sin(t * 2 + id) * 0.09; A[0].rotation.x = A[1].rotation.x = -0.35; A[0].rotation.z = -0.6; A[1].rotation.z = 0.6;
  } else if (act === 'lute') {
    A[1].rotation.x = -0.75 + Math.sin(t * 9 + id) * 0.15; A[1].rotation.z = 0.15; A[0].rotation.x = -1.05; A[0].rotation.z = 0.35; H.rotation.x = 0.15; H.rotation.z = Math.sin(t * 1.5 + id) * 0.08;
  } else if (act === 'flute') {
    A[0].rotation.x = A[1].rotation.x = -1.65; A[0].rotation.z = 0.55; A[1].rotation.z = -0.05; H.rotation.z = Math.sin(t * 1.2 + id) * 0.06; u.body.rotation.z = Math.sin(t * 1.2 + id) * 0.05;
  } else if (act === 'drum') {
    const b = Math.sin(t * 7 + id); A[0].rotation.x = -0.75 - Math.max(0, b) * 0.3; A[1].rotation.x = -0.75 - Math.max(0, -b) * 0.3; A[0].rotation.z = 0.15; A[1].rotation.z = -0.15; H.rotation.x = Math.abs(b) * 0.06;
  } else { A[0].rotation.x = A[1].rotation.x = -0.25 * k; }
}
const _toast = new THREE.Color('#b9773e');
/** One island's build grid: faint lines round every cell that can be built on (not mountain, river or lake). */
function gridFor(id) {
  if (!vis.grids || vis.grids.ws !== WORLD_SEED) { // a new sky: new cells
    if (vis.grids) for (const k in vis.grids.g) R3.scene.remove(vis.grids.g[k]);
    vis.grids = { ws: WORLD_SEED, g: {} };
  }
  if (vis.grids.g[id]) return vis.grids.g[id];
  const seen = new Set(), pts = [];
  const edge = (x1, z1, x2, z2) => { const k = x1 + ',' + z1 + ',' + x2 + ',' + z2; if (seen.has(k)) return; seen.add(k); pts.push(x1, 0, z1, x2, 0, z2); };
  for (const [i, j] of ISLANDS[id].cells) if (!TERRAIN.has(K(i, j))) { edge(i, j, i + 1, j); edge(i, j + 1, i + 1, j + 1); edge(i, j, i, j + 1); edge(i + 1, j, i + 1, j + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const g = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#fff6e0', transparent: true, opacity: 0.4, depthWrite: false }));
  g.renderOrder = 5; g.visible = false; R3.scene.add(g); vis.grids.g[id] = g;
  return g;
}
/** Building: the island under the mouse (hit) shows its grid; null hides every grid. */
function syncGrid(hit) {
  if (vis.grids) for (const k in vis.grids.g) vis.grids.g[k].visible = false;
  if (!hit || !PIECES[state.tool]) return;
  const g = gridFor(hit.isl);
  g.visible = true; g.position.y = vis.islands[hit.isl].g.position.y + tune.gridLift;
  g.material.opacity = tune.gridOpacity;
}
/** The ghost of the chosen piece under the mouse, pale when it fits and rose when it does not. */
function syncGhost() {
  syncGrid(null);
  for (const t in vis.ghost) vis.ghost[t].visible = false;
  if (vis.hl) { vis.hl.visible = false; vis.hl2.visible = false; }
  if (vis.turnArrowG) vis.turnArrowG.visible = false;
  const tool = state.tool === 'move' && state.carry ? carryType() : state.tool; // carrying: the carried piece's ghost
  if (vis.bm) { vis.bm.a.visible = false; vis.bm.b.visible = false; vis.bm.dots.forEach(d => { d.visible = false; }); }
  state.bridgePreview = '';
  if (state.view !== 'builder' || state.mode !== 'build' || state.modal) return;
  if (PIECES[tool] && vis.hover) { const r = screenRay(vis.hover.x, vis.hover.y); syncGrid(r && pickCell(r)); }
  if (tool === 'bridge') { syncBridgeGhost(); return; }
  if (!vis.hover) return;
  if (tool === 'tidy' || tool === 'turn' || tool === 'move') { syncHighlight(tool); return; }
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
  g.traverse(o => { if (o.isMesh && !o.userData.arrow) o.material.color.set(ok ? (state.carry ? '#c8f5dc' : '#fff3c8') : '#f08aa8'); }); // a carried piece: mint where it can go
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
  const col = keep ? '#a8a0c0' : tool === 'tidy' ? '#ff7fa0' : tool === 'move' ? '#9df0c8' : '#ffd36e';
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
/**
 * A fluffkin asleep: it sinks down with its legs tucked, rolls a little onto one side, shuts its
 * eyes, droops its ears and breathes slowly, and drawn z's drift up from it. It eases in and out.
 */
function sleepPose(m, f) {
  const u = m.userData, b = u.body, dt = Math.min(0.1, Math.max(0, state.t - (u.sleepT ?? state.t))); u.sleepT = state.t;
  u.k = (u.k || 0) + ((f.asleep ? 1 : 0) - (u.k || 0)) * Math.min(1, dt * 2.5);
  const k = u.k, br = Math.sin(state.t * 2.5 + f.id);
  if (k > 0.01) {
    b.position.y -= 0.08 * k; b.rotation.z = 0.08 * k;
    u.legs.forEach((l, n) => { l.rotation.x = (n < 2 ? 1.4 : -1.4) * k; l.scale.y = 1 - 0.4 * k; });
    b.scale.set(1 - 0.015 * br * k, 1 + 0.04 * br * k, 1 - 0.015 * br * k);
    u.ears.forEach((e, n) => { e.rotation.z = (n ? -0.5 : 0.5) * k; });
  } else { b.rotation.z = 0; b.scale.set(1, 1, 1); u.legs.forEach(l => { l.scale.y = 1; }); u.ears.forEach(e => { e.rotation.z = 0; }); }
  if (f.stretch && state.t < f.stretch) b.rotation.x = -0.25 * Math.sin(Math.PI * (f.stretch - state.t)); // a stretch on waking
  const shut = k > 0.5; u.eyes.forEach(e => { e.visible = !shut; }); u.lids.forEach(l => { l.visible = shut; });
  u.zs.forEach(z => {
    z.visible = k > 0.6; if (!z.visible) return;
    const c = (state.t / 2.7 + z.userData.ph + f.id * 0.13) % 1, s2 = 0.06 + 0.07 * c;
    z.position.set(0.06 + 0.1 * c + Math.sin(c * 6) * 0.03, 0.3 + 0.3 * c, 0.1); z.scale.set(s2, s2, 1); z.material.opacity = 0.9 * Math.sin(Math.PI * c) * k;
  });
}
/** A soft wisp of chimney smoke: it swells as it rises, sways and leans with the breeze, then fades. */
function fxSmoke(x, y, z) {
  const S = sun(), col = new THREE.Color('#f4eff6').lerp(new THREE.Color('#8f88a8'), S.night * 0.6);
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color: col, transparent: true, opacity: 0, depthWrite: false }));
  m.position.set(x, y, z); m.scale.setScalar(0.12); R3.scene.add(m);
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
        // it leaves the chimney pot straight up, already visible, and only then leans and swells with the breeze
        f.m.position.x += (f.vx * k * 1.4 + Math.sin(f.t * 1.8 + f.ph) * 0.12 * k) * dt; f.m.position.y += f.vy * (1 - k * 0.5) * dt; f.m.position.z += f.vz * k * dt;
        f.m.material.opacity = 0.62 * Math.min(1, k * 14) * Math.pow(1 - k, 1.3); f.m.scale.setScalar(0.12 + k * 0.9);
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
  drawVoyageGame(v, B);
  R3.vcam.position.set(v.x * 0.6, 2.6, v.z + 7); R3.vcam.lookAt(v.x * 0.8, 1, v.z - 8);
  renderMain(R3.vs, R3.vcam, 0.4);
}

/** The voyage's own game: the firefly and its trail, the cloud gates, or the bell and its ripple; the boat's glow. */
function drawVoyageGame(v, B) {
  let V = R3.vgame;
  if (!V) {
    V = R3.vgame = { fly: makeMote(), trail: [0, 1, 2].map(() => glow('#ffe7a0', 0.9, 0.5)), flyGlow: glow('#fff1b0', 3.2, 0.6),
      ring: new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: '#fff3c8', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })),
      bell: makeBell(), boatGlow: glow('#ffd36a', 3.4, 0), gates: new Map() };
    V.fly.scale.setScalar(0.75); V.fly.add(V.flyGlow); V.ring.rotation.x = -Math.PI / 2; V.bell.scale.setScalar(1.6);
    R3.vs.add(V.fly, V.ring, V.bell, ...V.trail); B.add(V.boatGlow); V.boatGlow.position.set(0, 1.1, 0);
  }
  V.boatGlow.material.opacity = v.glow * 0.8;
  const fly = v.game === 'firefly', bell = v.game === 'bell';
  V.fly.visible = fly; V.trail.forEach(s => { s.visible = fly; });
  if (fly) {
    V.fly.position.set(v.fly, 0.9 + Math.sin(v.t * 3) * 0.25, v.z - 8); V.fly.rotation.y = v.t * 3;
    V.flyGlow.material.opacity = 0.45 + 0.25 * Math.sin(v.t * 9);
    V.trail.forEach((s, k) => { // the way lit so far: little lights trailing the boat
      const on = v.caught / v.need > k / 3; s.position.set(v.x + Math.sin(v.t * 2 + k) * 0.4, 0.6 + k * 0.15, v.z + 1.2 + k * 1.1); s.material.opacity = on ? 0.7 : 0;
    });
  }
  V.ring.visible = bell; V.bell.visible = bell;
  if (bell) {
    const p = ((v.t - 1) % tune.bellBeat + tune.bellBeat) % tune.bellBeat / tune.bellBeat; // 0 at a ring, 1 as it reaches you
    const nearHit = Math.abs(((v.t - 1) / tune.bellBeat) - Math.round((v.t - 1) / tune.bellBeat)) * tune.bellBeat <= tune.bellWindow;
    const s = v.t < 1 || v.done >= 0 ? 0 : 7 - 6 * p;
    V.ring.scale.setScalar(Math.max(0.01, s)); V.ring.position.set(v.x, 0.25, v.z);
    V.ring.material.opacity = v.t < 1 || v.done >= 0 ? 0 : 0.25 + 0.6 * p; V.ring.material.color.set(nearHit ? '#ffd36a' : '#fff3c8');
    V.bell.position.set(0, 4.5, v.z - 26); V.bell.rotation.z = Math.sin(v.t * Math.PI / tune.bellBeat) * 0.35;
  }
  const seen = new Set();
  for (const gt of (v.game === 'gates' ? v.gates : [])) {
    seen.add(gt.id);
    let m = V.gates.get(gt.id);
    if (!m) { m = makeCloudGate(); R3.vs.add(m); V.gates.set(gt.id, m); }
    m.position.set(gt.x, -0.4, gt.z);
    m.userData.mat.emissiveIntensity = gt.lit * 0.8; m.userData.halo.material.opacity = gt.lit * 0.5;
  }
  for (const [id, m] of V.gates) if (!seen.has(id)) { R3.vs.remove(m); V.gates.delete(id); }
}
/**
 * While a quest is ready: a few light-motes drift slowly off the home island towards the islands
 * you could sail to, a quiet pointer to Set sail. Drawn only.
 */
function drawCalls() {
  const targets = state.questReady && state.mode !== 'voyage' ? chartIslands().filter(x => x.open).map(x => x.isl) : [];
  if (!vis.calls) vis.calls = [];
  const n = targets.length ? 4 : 0;
  while (vis.calls.length < n) { const m = makeMote(); m.scale.setScalar(0.8); R3.scene.add(m); vis.calls.push(m); }
  vis.calls.forEach((m, k) => {
    m.visible = k < n; if (!m.visible) return;
    const to = targets[k % targets.length], home = ISLANDS[0], p = ((state.t / 7 + k / n) % 1), e = p * p * (3 - 2 * p);
    const y0 = islandLift(0) + 1.2, y1 = islandLift(to.id) + 2.5;
    m.position.set(home.cx + (to.cx - home.cx) * e * 0.85, y0 + (y1 - y0) * e + Math.sin(p * Math.PI) * 2.5, home.cz + (to.cz - home.cz) * e * 0.85);
    m.scale.setScalar(0.8 * Math.sin(p * Math.PI) + 0.01); m.rotation.y = state.t * 2;
  });
}
/** Draws play: the world (or the voyage), then the floating words. */
function drawWorld() {
  if (!R3) return;
  if (state.mode === 'voyage' && state.voyage) { drawVoyage(); clearOverlay(); return; }
  for (const [, g] of vis.motes) R3.vs.remove(g); vis.motes.clear();
  drawCalls();
  R3.cam.position.copy(vis.camPos); R3.cam.lookAt(vis.camLook);
  R3.cam.fov = state.view === 'stroll' ? 60 : 45; R3.cam.updateProjectionMatrix();
  syncSky(); syncIslands(); syncPieces(); syncFolk(); syncWild(); syncAqua(); syncGhost();
  renderMain(R3.scene, R3.cam, state.view === 'builder' ? 1 : state.view === 'postcard' ? 0.8 : 0);
  clearOverlay();
  for (const f of vis.fx) if (f.label) {
    const p = new THREE.Vector3(f.x, f.y, f.z).project(R3.cam);
    if (p.z < 1) labelText(f.label, (p.x + 1) / 2 * W, (1 - p.y) / 2 * H, 18, `rgba(255,246,232,${Math.max(0, 1 - f.t / f.life)})`);
  }
  // Music notes rising from singers and players by a fire: drawn shapes (a round head, a stem, a flag).
  if (state.view === 'builder' || state.view === 'stroll') for (const f of state.folk) if (f.seat != null && f.sit >= 1 && (f.act === 'sing' || INSTRUMENTS[f.act])) {
    for (let k = 0; k < 2; k++) {
      const u = (state.t * tune.campfireNoteRate * 0.5 + k * 0.5 + f.id * 0.13) % 1, p = new THREE.Vector3(f.x, f.y + (f.kind === 'child' ? 0.55 : 0.8) + u * 0.6, f.z).project(R3.cam);
      if (p.z >= 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) continue;
      const s = Math.max(0.6, Math.min(1.4, 14 / state.cam.dist)), x = (p.x + 1) / 2 * W + Math.sin(u * 6 + f.id) * 6 * s, y = (1 - p.y) / 2 * H;
      ctx.globalAlpha = Math.sin(Math.PI * u) * 0.95; ctx.fillStyle = ctx.strokeStyle = (f.id + k) % 2 ? '#f5c76b' : '#c9a7f2'; ctx.lineWidth = 1.6 * s;
      ctx.beginPath(); ctx.ellipse(x, y, 3.4 * s, 2.5 * s, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 3 * s, y - 0.5 * s); ctx.lineTo(x + 3 * s, y - 12 * s); ctx.quadraticCurveTo(x + 8 * s, y - 9 * s, x + 7 * s, y - 5 * s); ctx.stroke();
    }
    ctx.globalAlpha = 1;
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
      ['Tower house', makeHouse(3, 1, 'tower'), 1.5], ['Mushroom house', makeHouse(5, 1, 'mushroom'), 1.5], ['Fairy cottage', makeHouse(8, 1, 'cottage'), 1.5], ['Tall tower', makeHouse(9, 2, 'tower'), 1.2], ['Moonbell', makeHouse(4, 1, 'moonbell'), 1.5], ['Gourdlight', makeHouse(6, 1, 'gourd'), 1.5], ['Rootstump', makeHouse(7, 1, 'rootstump'), 1.5], ['Mist Spire', makeHouse(2, 1, 'mistspire'), 1.3], ['Home, loft', makeHouse(8, 1, 'cottage', 2, 1), 1.2], ['Tower, full family', makeHouse(3, 1, 'tower', 2, 2), 1.0], ['Mushroom, full', makeHouse(5, 1, 'mushroom', 2, 2), 1.0], ['Moonbell, full', makeHouse(4, 1, 'moonbell', 2, 2), 1.0], ['Gourdlight, full', makeHouse(6, 1, 'gourd', 2, 2), 1.0], ['Rootstump, full', makeHouse(7, 1, 'rootstump', 2, 2), 1.0], ['Mist Spire, full', makeHouse(2, 1, 'mistspire', 2, 2), 0.9], ['Tree', makeTree(4), 1.5], ['Flowerbeds, joined', (() => { const g = new THREE.Group(); const a = makeGarden(2, 'bed', 1), b = makeGarden(9, 'bed', 2); a.position.x = -0.5; b.position.x = 0.5; g.add(a, b); return g; })(), 1.1], ['Vegetable patch', makeGarden(2, 'veg'), 1.6], ['Fairy ring', makeGarden(2, 'ring'), 1.6], ['Rose arbour', makeGarden(2, 'arbour'), 1.4],
      ['Lantern', makeLantern(), 1.4], ['Sky bridge, lit', (() => { const b = makeSkyBridge(8, tune.bridgeLightMin, tune.bridgeLightGap, 0, 0.2, 0.8); placeSkyBridge(b, new THREE.Vector3(-4, 1.4, 0), new THREE.Vector3(4, 0, 0)); const g = grp(b); g.add(mk(new THREE.BoxGeometry(2.2, 0.6, 1.4), T(PAL.grass, 'grass'), -3.7, 1.1, 0)); g.add(mk(new THREE.BoxGeometry(2.2, 0.6, 1.4), T(PAL.grass, 'grass'), 3.7, -0.3, 0)); g.rotation.y = -0.5; return g; })(), 0.24], ...['wild', 'lavender', 'clover', 'sunny'].map(kd => ['Meadow, ' + kd, (() => { const t = new THREE.Group(); const m2 = makeMeadow2(5, kd); m2.userData.soil.forEach(w => { w.visible = false; }); t.add(m2); t.rotation.x = 0.75; return t; })(), 0.8]), ['Meadow, just planted', (() => { const t = new THREE.Group(), m2 = makeMeadow2(7, 'wild'); m2.userData.plants.forEach(w => { w.visible = false; }); t.add(m2); t.rotation.x = 0.75; return t; })(), 0.8], ['Magic School', makeSchool(2), 1.05], ['Healing House', makeHealer(2), 1.35],
      ['Wind-folk hut', makeHut(2), 1.3], ['Carved stone', makeRuneStone(), 1.3], ['Tribe totem', makeTotem(), 1.1], ['Windmill', makeWindmill(false), 1.0], ['Star Arch', makeArch(), 1.1], ['Broken mill', makeWindmill(true), 1.0], ['Wishing well', makeWell(), 1.2], ['Paths, a square', (() => { const g = new THREE.Group(); [[0, 0, 1 | 4 | 16], [1, 0, 2 | 4 | 64], [0, 1, 8 | 1 | 32], [1, 1, 2 | 8 | 128]].forEach(([x, z, m2], k) => { const p2 = makePath(m2, k * 5 + 3); p2.position.set(x - 0.5, 0, z - 0.5); g.add(p2); }); g.rotation.x = 0.5; return g; })(), 0.9], ['Paths, a bend', (() => { const g = new THREE.Group(); [[0, -1, 4], [0, 0, 8 | 1], [1, 0, 2]].forEach(([x, z, m2], k) => { const p2 = makePath(m2, k * 7 + 2); p2.position.set(x - 0.5, 0, z); g.add(p2); }); g.rotation.x = 0.5; return g; })(), 0.9], ['Wind Bell', makeBell(), 1.8], ['Star-lamp', makeStarLamp(true), 1.8], ['Light-mote', makeMote(), 1.4],
      ['Dog', makeDog(0), 4], ['Cat', makeCat(0), 4], ['Bunny', makeBunny(0), 4], ['Sky-fairy', makeFairy(0), 4.5],
      ['Glimmerfly', makeGlimmerfly(0), 5], ['Moth-fox', makeMothFox(0), 4.5], ['Puffbird', makePuffbird(0), 4.5], ['Cloud', makeCloud(7, 0.45), 1],
      ['Glowfin', makeGlowfin(0), 5], ['Lily frog', makeLilyFrog(0), 5],
      ['Campfire evening', (() => { // everyone seated, each at something different, the fire lit
        const g = new THREE.Group(), fire = makeCampfire(3); fire.userData.anim(4, 1, 0, 3, 1, 0); g.add(fire);
        campfireSeats().forEach((st, k) => {
          const kid = k === 6, m = makeFolk(kid ? 'child' : 'adult', k + 2), f = { id: k + 1, kind: kid ? 'child' : 'adult', seat: k, sit: 1, seatY: st.y, act: ['roast', 'talk', 'lute', 'sing', 'flute', 'drum', 'roast'][k] };
          m.position.set(st.x, 0, st.z); m.rotation.y = Math.atan2(-st.x, -st.z); m.userData.head.rotation.set(0, 0, 0); firePose(m, f); g.add(m);
        });
        return g;
      })(), 0.9],
      ...['alpine', 'pinnacles', 'crystal'].map((st, k) => ['Mountain, ' + st, makeMountain([[0, 0], [1, 0], [0, 1]], 11 + k * 5, st), 0.32]),
      ['Waterfall', (() => { const g = new THREE.Group(); g.add(mk(new THREE.BoxGeometry(1.4, 0.5, 1.2), T(PAL.grass, 'grass'), 0, -0.25, -0.6)); g.add(mk(new THREE.BoxGeometry(0.86, 0.02, 1.2), '#e6d3b0', 0, 0.01, -0.6)); const w = mk(new THREE.BoxGeometry(0.54, 0.02, 1.2), waterMat(), 0, 0.035, -0.6); g.add(w); const f = makeWaterfall(2.4, 0.54); g.add(f); g.rotation.y = -0.9; return grp(g); })(), 0.6],
      ...ISLANDS.map(isl => ['Edge, ' + isl.name, (() => { const g = new THREE.Group(), m = makeIsland(isl, []); m.position.set(0, 0, -isl.r * 0.55); g.add(m); g.rotation.x = 0.6; return g; })(), 0.17]),
      ['Island, from the side', (() => { const isl = ISLANDS[1], g = makeIsland(isl, []); g.position.y = (isl.r * 1.2 + 2) * 0.5; g.rotation.x = 0.12; return grp(g); })(), 0.1],
      ['Lake', (() => { const l = makeLake([[0, 0], [1, 0], [0, 1]]); l.position.x = -0.5; return grp(l); })(), 0.75], ['River, footbridge', (() => { const g = grp(makeRiver([[-1, -1], [0, -1], [0, 0], [1, 0]], [1, 0])); const fb = makeSkyBridge(1.8, Infinity, 2.6, humpFor(true, 1.8)); placeSkyBridge(fb, new THREE.Vector3(-0.4, 0.03, 0.9), new THREE.Vector3(0.4, 0.03, -0.75)); g.add(fb); return g; })(), 0.6],
    ];
    if (params.get('only')) { const o = params.get('only').toLowerCase(); for (let k = items.length - 1; k >= 0; k--) if (!items[k][0].toLowerCase().includes(o)) items.splice(k, 1); } // ?only=campfire: a close look at a few
    const focus = !!params.get('only'), cols = focus ? items.length : 12, gap = focus ? 19 / Math.max(1, items.length) : 1.62, big = focus ? Math.min(4, gap / 1.62 * 0.85) : 1, labels = [];
    items.forEach(([name, m, sc], k) => {
      const x = (k % cols - (cols - 1) / 2) * gap, y = focus ? 1.2 : 3.1 - Math.floor(k / cols) * 2.15;
      m.scale.multiplyScalar(sc * big); m.position.set(x, y - 0.8 * big, 0); m.rotation.y = 0.5; s.add(m);
      labels.push({ name, p: new THREE.Vector3(x, y - 0.8 * big - 0.35, 0) });
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
  syncGrid(null);
  renderMain(R3.scene, R3.cam, 0.8);
  clearOverlay();
}

// =====================================================================================================
// ---- HUD: drawn icons, big buttons for touch ------------------------------------------------------
// =====================================================================================================
const UI = {};
/** A drawn icon as an image address (cached), for HUD lines built as HTML. */
const ICON_URLS = {};
function iconImg(name, size, cls = '') {
  const k = name + size; if (!ICON_URLS[k]) ICON_URLS[k] = iconEl(name, size).toDataURL();
  return `<img class="icon ${cls}" src="${ICON_URLS[k]}" width="${size}" height="${size}" alt="">`;
}
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
/** Opens or closes the island list under the island pill. */
function islList(open) { UI.isl.classList.toggle('open', open); UI.islPop.style.display = open ? '' : 'none'; }
/** The found island nearest the camera's target: the one you are looking at. */
function nearestIsland() {
  let best = ISLANDS[0], bd = 1e9;
  for (const i of ISLANDS) if (state.islands[i.id].discovered) { const d = Math.hypot(state.cam.tx - i.cx, state.cam.tz - i.cz) - i.r; if (d < bd) { bd = d; best = i; } }
  return best;
}
function initUI() {
  const $ = id => document.getElementById(id);
  Object.assign(UI, { hud: $('hud'), quest: $('quest'), pop: $('pop'), clock: $('clock'), toasts: $('toasts'), hint: $('hint'), say: $('say'), notes: new Map(),
    modal: $('modal'), title: $('title'), tut: $('tut'), tutHead: $('tuthead'), tutText: $('tuttext'), pause: $('pause'), voy: $('voy'), back: $('back'), topBtns: $('topbtns'), camBtns: $('cambtns') });
  $('popicon').appendChild(iconEl('folk', 26));
  // Relics live in the HUD: a slot each, dim until found; tap one to hear its story again.
  UI.relics = {};
  for (const r of Object.values(RELICS)) {
    const b = btn($('relics'), r.kind, '', () => toast(state.relics[r.kind] ? `${r.name}: ${r.text}` : 'Still lost in the mist', state.relics[r.kind] ? tune.notifyRelicSecs : undefined), 'relic-slot');
    b.title = r.name; UI.relics[r.kind] = b;
  }
  // The build dock: category tabs ("ears") on top of one tray. The tray holds Look, then the
  // current tab's pieces (these scroll), then Rotate, Turn and Tidy. Only the held tool shows its name.
  UI.dock = $('dock'); UI.dock.addEventListener('pointerdown', e => e.stopPropagation());
  UI.cats = {};
  for (const c of TOOL_CATS) { UI.cats[c.id] = btn($('ears'), c.icon, '', () => selectCat(c.id), 'ear'); UI.cats[c.id].title = c.name; UI.cats[c.id].setAttribute('aria-label', c.name); } // icon tabs: the name is the tooltip
  UI.tools = {}; UI.pieces = $('pieces');
  for (const t of TOOL_ORDER) {
    const label = t === 'look' ? 'Look' : t === 'tidy' ? 'Tidy' : t === 'turn' ? 'Turn' : t === 'move' ? 'Move' : PIECES[t].name;
    const zone = t === 'look' ? $('zlook') : PIECES[t] ? UI.pieces : $('zfix');
    if (t === 'turn') { UI.spin = btn(zone, 'rotate', 'Rotate', rotatePiece, 'tool spin'); UI.spinIcon = UI.spin.querySelector('canvas'); UI.spin.title = 'Rotate · R'; }
    UI.tools[t] = btn(zone, PIECES[t] ? PIECES[t].icon : t, label, () => selectTool(t), 'tool' + (PIECES[t] ? '' : ' always'));
  }
  UI.tools.turn.title = 'Turn · T'; UI.tools.tidy.title = 'Tidy · X'; UI.tools.move.title = 'Move · G';
  // The pieces scroll: by touch, mouse wheel, or dragging with the mouse.
  const bar = UI.pieces;
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
  // The island list: one pill (nearest island's name, a dot per found island) that opens a list.
  UI.isl = document.createElement('button'); UI.isl.className = 'btn isl';
  UI.islName = document.createElement('span'); UI.islDots = document.createElement('span'); UI.islDots.className = 'dots';
  const chev = iconEl('chevR', 14); chev.classList.add('chev');
  UI.isl.append(UI.islName, UI.islDots, chev);
  UI.isl.addEventListener('click', e => { e.stopPropagation(); startAudio(); sfx.ui(); islList(!UI.isl.classList.contains('open')); });
  UI.islPop = document.createElement('div'); UI.islPop.id = 'islpop'; UI.islPop.className = 'panel'; UI.islPop.style.display = 'none';
  $('tl').append(UI.isl, UI.islPop);
  $('tl').addEventListener('pointerdown', e => e.stopPropagation());
  addEventListener('pointerdown', e => { if (UI.isl.classList.contains('open') && !UI.isl.contains(e.target) && !UI.islPop.contains(e.target)) islList(false); }, true);
  UI.viewBtn = btn(UI.topBtns, 'builder', '', cycleView, 'small icononly');
  // One Sound button (its speaker shows off, soft or loud) opens the Sound panel: an on/off switch,
  // the song playing with a skip button, and the volume of everything, the music and the sounds.
  const mp = UI.soundPanel = document.getElementById('musicpanel');
  UI.soundBtn = btn(UI.topBtns, 'sound', '', () => show(mp, mp.style.display === 'none'), 'small icononly');
  UI.soundBtn.title = 'Sound';
  UI.trackName = document.getElementById('mptrack');
  const nb = btn(document.getElementById('mpnext'), 'skip', '', nextTrack, 'small icononly'); nb.title = 'Next song';
  UI.muteSwitch = document.getElementById('spmute');
  UI.muteSwitch.addEventListener('click', e => { e.stopPropagation(); startAudio(); setMuted(!muted); sfx.ui(); });
  UI.vol = [];
  for (const [id, key] of [['mpall', 'volume'], ['mpmusic', 'musicVolume'], ['mpsfx', 'sfxVolume']]) {
    const el = document.getElementById(id), out = document.getElementById('ov' + id.slice(2)); el.value = CONFIG[key].value;
    el.addEventListener('input', () => { CONFIG[key].value = Number(el.value); setMuted(false); }); // moving a slider turns the sound back on (and applies the new volume)
    el.addEventListener('pointerdown', e => e.stopPropagation());
    UI.vol.push({ el, out, key });
  }
  for (const el of mp.querySelectorAll('.ic')) el.appendChild(iconEl(el.dataset.ic, 22));
  mp.addEventListener('pointerdown', e => e.stopPropagation());
  addEventListener('pointerdown', e => { if (mp.style.display !== 'none' && !mp.contains(e.target) && !UI.soundBtn.contains(e.target)) show(mp, false); }, true); // a tap elsewhere closes it
  btn(UI.topBtns, 'pause', '', () => { hit.add('KeyP'); }, 'small icononly');
  btn(UI.camBtns, 'turnL', '', () => { state.cam.yaw += 0.5; }, 'round');
  btn(UI.camBtns, 'turnR', '', () => { state.cam.yaw -= 0.5; }, 'round');
  btn(UI.camBtns, 'zoomIn', '', () => zoom(0.8), 'round');
  btn(UI.camBtns, 'zoomOut', '', () => zoom(1.25), 'round');
  const rc = btn(UI.camBtns, 'recenter', '', resetCamera, 'round recenter'); rc.title = 'Back to the start view · H';
  UI.sail = btn($('sailwrap'), 'boat', 'Set sail', setSail, 'sail');
  UI.choose = $('choose'); UI.chartLabel = $('chartlabel');
  btn($('chooseback'), null, 'Back', closeChart, 'small');
  UI.chartLabel.addEventListener('click', e => { const b = e.target.closest('[data-sail]'); if (b) { e.stopPropagation(); startAudio(); chooseIsland(Number(b.dataset.sail)); } });
  UI.chartLabel.addEventListener('pointerdown', e => e.stopPropagation()); UI.sail.title = 'The mist is thinning…'; UI.sail.setAttribute('aria-label', 'Set sail');
  btn(UI.back, 'builder', 'Back', () => setView('builder'), 'small');
  const sk = btn($('tutskip'), 'close', '', () => { endTutorial(); sfx.ui(); }, 'tutx'); sk.title = 'Skip the guide'; sk.setAttribute('aria-label', 'Skip');
  initWorldsUI();
  // The title (game designer's spec): Continue the last world, a New world, your Worlds, a Surprise sky; How to play and Test mode as quiet links.
  UI.contBtn = btn($('begin'), null, 'Continue', () => { if (loadWorld()) scene = 'play'; }, 'big');
  UI.contSub = document.createElement('small'); UI.contBtn.appendChild(UI.contSub);
  UI.newBtn = btn($('begin'), null, 'New world', newWorld, 'big');
  UI.worldsBtn = btn($('begin'), null, 'Worlds', () => openWorlds(true), 'big ghost');
  const sur = btn($('begin'), null, 'Surprise sky', () => startOver(true), 'big ghost'); sur.title = 'A new random sky';
  btn($('titlelinks'), null, 'How to play', () => openHelp(true), 'quiet');
  btn($('titlelinks'), null, 'Test mode', startTest, 'quiet').title = 'Everything unlocked, nothing saved';
  btn($('helpbtns'), null, 'Got it', () => openHelp(false), 'big');
  // Pause: Resume first; Save and Worlds; small settings; starting again set apart, behind a confirm.
  btn($('pausebtns'), null, 'Resume', () => hit.add('KeyP'), 'big');
  UI.saveBtn = btn($('pausebtns'), null, 'Save world', saveFromPause, 'big ghost');
  UI.loadBtn = btn($('pausebtns'), null, 'Worlds', () => openWorlds(true), 'big ghost');
  UI.qBtn = btn($('pauseset'), null, 'Graphics: ' + (GFX.high ? 'High' : 'Low'), () => { setQuality(!GFX.high); UI.qBtn.querySelector('span').textContent = 'Graphics: ' + (GFX.high ? 'High' : 'Low'); }, 'small');
  UI.sndBtn = btn($('pauseset'), null, 'Sound: On', () => setMuted(!muted), 'small');
  btn($('pauseset'), null, 'How to play', () => openHelp(true), 'small');
  btn($('pausedanger'), null, 'Start this sky again', () => confirmAgain(false), 'quiet danger');
  btn($('pausedanger'), null, 'Start in a new sky', () => confirmAgain(true), 'quiet danger');
  btn($('pausedanger'), null, 'Test mode (everything unlocked)', startTest, 'quiet');
  UI.confYes = btn($('confbtns'), null, 'Start again', () => { const r = UI.confRandom; show($('confirm'), false); saveWorld(); startOver(r); }, 'big dangerfill');
  btn($('confbtns'), null, 'Keep playing', () => show($('confirm'), false), 'big ghost');
  UI.modalBtn = btn($('modalbtn'), null, 'OK', closeModal, 'big');
  $('modaltext').addEventListener('click', e => { const b = e.target.closest('[data-more]'); if (!b) return; e.stopPropagation(); const m = $('modaltext').querySelector('.more'); if (m) { show(m, true); b.remove(); } });
  $('modalicon').appendChild(UI.modalIcon = iconEl('island', 64));
  UI.motes = [];
  for (let k = 0; k < 15; k++) { const c = iconEl('mote', 30); $('motes').appendChild(c); UI.motes.push(c); }
  UI.last = {};
}
/**
 * The news stack: one element per line, kept while it shows, so an old line never replays its
 * entrance when a new one arrives. Newest on top; a line fades out over its last notifyFadeSecs.
 */
function renderNotes() {
  const live = new Set();
  for (const t of state.toasts) {
    live.add(t.id);
    let el = UI.notes.get(t.id);
    if (!el) {
      el = document.createElement(t.at ? 'button' : 'div'); el.className = 'toast' + (t.at ? ' go' : '');
      if (t.icon) { const i = document.createElement('span'); i.className = 'ti'; i.appendChild(iconEl(t.icon, 20)); el.appendChild(i); }
      el.appendChild(document.createElement('span'));
      if (t.at) {
        el.title = 'Show me';
        el.addEventListener('pointerdown', e => e.stopPropagation());
        el.addEventListener('click', e => { e.stopPropagation(); const n = state.toasts.find(x => x.id === t.id); if (!n) return; setView('builder'); state.cam.tx = n.at[0]; state.cam.tz = n.at[1]; n.until = Math.min(n.until, state.t + tune.notifyFadeSecs); });
      }
      UI.notes.set(t.id, el); UI.toasts.prepend(el);
    }
    const sp = el.lastChild; if (sp.textContent !== t.text) sp.textContent = t.text;
    el.classList.toggle('out', t.until - state.t < tune.notifyFadeSecs);
  }
  for (const [id, el] of UI.notes) if (!live.has(id)) { el.remove(); UI.notes.delete(id); }
}
function setText(el, key, txt) { if (UI.last[key] !== txt) { UI.last[key] = txt; el.textContent = txt; } }
function setHTML(el, key, h) { if (UI.last[key] !== h) { UI.last[key] = h; el.innerHTML = h; } }
function show(el, on) { const v = on ? '' : 'none'; if (el.style.display !== v) el.style.display = v; }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
/** Updates the HUD from the state; touches the page only when something changed. */
function updateUI() {
  if (!UI.hud) return;
  const play = scene === 'play', voy = play && state.mode === 'voyage';
  show(UI.title, scene === 'title' && !overlayOpen()); show(UI.pause, scene === 'pause' && !overlayOpen()); // the worlds list or naming card stands in their place
  const hasSave = saveExists(); show(UI.contBtn, hasSave); show(UI.worldsBtn, worldList().length >= 2); show(UI.loadBtn, hasSave);
  UI.newBtn.classList.toggle('ghost', hasSave);
  if (hasSave && scene === 'title') { const w = worldList()[0]; setText(UI.contSub, 'contsub', `${w.name} · day ${w.day} · ${w.found}/${ISLANDS.length - 1} islands`); }
  setText(document.getElementById('enterhint'), 'enterhint', hasSave ? 'Press Enter to continue' : 'Press Enter to begin');
  if (scene === 'pause') {
    setText(document.getElementById('pausename'), 'pausename', state.test ? 'Test mode' : state.worldName || 'A new sky');
    const blocked = state.test ? "Test worlds aren't saved" : state.mode === 'voyage' ? 'Save (after the voyage)' : 'Save world';
    setText(UI.saveBtn.querySelector('span'), 'savebtn', blocked); UI.saveBtn.disabled = blocked !== 'Save world';
    setText(UI.sndBtn.querySelector('span'), 'sndbtn', muted ? 'Sound: Off' : 'Sound: On');
  }
  if (scene !== 'title' && scene !== 'pause') { show(UI.worlds, false); show(UI.nameit, false); }
  const ch = play && !voy ? state.choosing : null;
  show(UI.hud, play && !voy && !ch && state.view !== 'postcard'); show(UI.choose, !!ch); chartLabel(ch); show(UI.voy, voy); show(UI.back, play && !voy && state.view === 'postcard');
  show(UI.dock, play && !voy && !ch && state.view === 'builder'); show(UI.camBtns, play && !voy && !ch && state.view === 'builder' && !(innerHeight < 640 && UI.soundPanel.style.display !== 'none')); // on a short screen the open Sound panel covers them
  if (scene === 'figures') { show(UI.title, false); return; }
  if (voy) {
    const v = state.voyage;
    UI.motes.forEach((c, k) => { show(c, k < v.need); c.style.opacity = k < v.caught ? '1' : '0.28'; });
    const G = VOYAGE_GAMES[v.game] || VOYAGE_GAMES.motes;
    setText(document.getElementById('voytext'), 'voytext', v.done >= 0 ? 'The mist parts...' : `${G.goal}: ${v.caught} / ${v.need}`);
    setText(document.getElementById('voyhow'), 'voyhow', G.how);
  }
  if (!play) return;
  setText(UI.pop, 'pop', String(pop()));
  for (const k in UI.relics) UI.relics[k].classList.toggle('found', !!state.relics[k]);
  const w = state.weather.kind;
  show(UI.weatherRow, !!state.test); document.body.classList.toggle('testing', !!state.test);
  if (state.test) for (const k of WEATHERS) UI.weatherBtns[k].classList.toggle('on', state.weather.kind === k);
  // A narrow screen has no room beside the top-left panel: the quest sits under it instead.
  const tcTop = innerWidth <= 600 ? Math.round(document.getElementById('tl').getBoundingClientRect().bottom) + 8 : 0;
  if (UI.last.tcTop !== tcTop) { UI.last.tcTop = tcTop; document.getElementById('tc').style.top = tcTop ? tcTop + 'px' : ''; }
  // The day dial: a needle round dawn, day, dusk and night; the words are its tooltip.
  const dd = Math.round(state.dayT * 100) / 100;
  if (UI.last.dial !== dd) { UI.last.dial = dd; UI.clock.style.setProperty('--d', dd); }
  const ct = (state.test ? 'Test mode · ' : '') + dayName() + (w === 'clear' ? '' : w === 'rain' ? ' · Rain' : w === 'thunder' ? ' · Thunderstorm' : ' · Snow');
  const ct2 = ct + (sun().night > 0.4 ? ' · ' + CONSTELLATIONS[tonight().c].name : '');
  if (UI.clock.title !== ct2) UI.clock.title = ct2;
  // The quest pill: one row of icons, dots and counts; the sentences are tooltips.
  const g = questProgress();
  const dots = (have, need) => need > 8 ? `<span class="bar"><i style="width:${Math.round(100 * Math.min(1, have / need))}%"></i></span>`
    : `<span class="pips">${Array.from({ length: need }, (_, k) => `<i class="${k < have ? 'on' : ''}"></i>`).join('')}</span>`;
  const part = (icon, have, need, tip) => `<span class="qs ${have >= need ? 'ok' : ''}" title="${esc(tip)}">${iconImg(icon, 20)}${dots(have, need)}<b>${Math.min(have, need)}/${need}</b></span>`;
  let qh;
  if (!g) qh = `<span class="qn ok" title="Every island found">${iconImg('island', 22)}<i class="chk"></i></span>`;
  else qh = `<span class="qn" title="Quest ${state.quest + 1} of ${QUESTS.length}: sight a hidden island">${iconImg('island', 22)}<b>${state.quest + 1}/${QUESTS.length}</b></span>` +
      part('folk', g.pop, g.popNeed, `Sky-folk: ${Math.min(g.pop, g.popNeed)} of ${g.popNeed}`) +
      part({ trees: 'tree', lanterns: 'lantern', bridges: 'bridge', gardens: 'garden' }[g.q.task] || 'star', g.task, g.taskNeed, g.q.taskText(g.taskNeed));
  setHTML(UI.quest, 'quest', qh);
  show(UI.sail, state.questReady && !state.choosing);
  const isNew = t => !!state.unlocked[t] && !state.seen[t];
  let key = 0;
  for (const t of TOOL_ORDER) {
    const b = UI.tools[t], on = !!state.unlocked[t] && toolInView(t);
    show(b, on); b.classList.toggle('on', state.tool === t); b.classList.toggle('new', isNew(t));
    if (on) { key++; if (PIECES[t] || t === 'look') { const tt = (PIECES[t] ? PIECES[t].name : 'Look') + (key <= 10 ? ' · ' + (key % 10) : ''); if (b.title !== tt) b.title = tt; } }
  }
  for (const c of TOOL_CATS) { const b = UI.cats[c.id]; show(b, c.tools.some(t => state.unlocked[t])); b.classList.toggle('on', state.cat === c.id); b.classList.toggle('new', c.tools.some(isNew)); }
  UI.pieces.classList.toggle('fade', UI.pieces.scrollWidth > UI.pieces.clientWidth + 4);
  const st = state.tool === 'move' ? carryType() : state.tool, canSpin = !!PIECES[st] && !PIECES[st].flat && st !== 'bridge';
  UI.spin.classList.toggle('off', !canSpin);
  if (canSpin) UI.spinIcon.style.transform = `rotate(${-state.rot}rad)`;
  setText(UI.trackName, 'track', TRACKS[state.track].name);
  renderNotes();
  const tu = scene === 'play' && state.mode === 'build' && state.view === 'builder' && !state.modal ? tutorialNow() : null;
  show(UI.tut, !!tu);
  if (tu) { setText(UI.tutHead, 'tuthead', tu.head); setText(UI.tutText, 'tuttext', tu.text); }
  const tk = (tu && tu.target) || '';
  if (UI.last.tutTarget !== tk) { // the button the guide points at glows
    UI.last.tutTarget = tk;
    document.querySelectorAll('.btn.tut').forEach(b => b.classList.remove('tut'));
    const [kind, id] = tk.split(':'), b = kind === 'cat' ? UI.cats[id] : kind === 'tool' ? UI.tools[id] : null;
    if (b) { b.classList.add('tut'); b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
  const sy = state.say, sayOn = !!sy && state.view !== 'postcard';
  if (UI.last.say !== (sy && sy.id)) { // a new line above the dock: built fresh so it slides in
    UI.last.say = sy && sy.id; UI.say.innerHTML = '';
    if (sy) { UI.say.className = sy.tier === 'error' ? 'err' : ''; if (sy.tier === 'error') UI.say.appendChild(iconEl('alert', 20)); const sp = document.createElement('span'); sp.textContent = sy.text; UI.say.appendChild(sp); }
  }
  if (sy) UI.say.classList.toggle('out', sy.until - state.t < tune.notifyFadeSecs);
  show(UI.say, sayOn); // above the guide card too: a can't-do must be seen
  setText(UI.hint, 'hint', state.hint); show(UI.hint, !!state.hint && !tu && !sayOn && state.view === 'builder');
  // The island pill: shown once a second island is found; names the island you are looking at.
  const found = ISLANDS.filter(i => state.islands[i.id].discovered), near = nearestIsland();
  if (UI.last.islN !== found.length) {
    UI.last.islN = found.length; UI.last.islNear = null;
    show(UI.isl, found.length > 1); if (found.length < 2) islList(false);
    UI.islDots.innerHTML = found.map(i => `<i data-id="${i.id}" style="--dot:${RARITY[rarityOf(i.id)].color}"></i>`).join('');
    UI.islPop.innerHTML = '';
    for (const i of found) {
      const r = btn(UI.islPop, null, i.name, () => { setView('builder'); state.cam.tx = i.cx; state.cam.tz = i.cz; islList(false); }, 'isrow');
      r.style.setProperty('--dot', RARITY[rarityOf(i.id)].color); r.dataset.id = i.id;
    }
  }
  if (UI.last.islNear !== near.id) {
    UI.last.islNear = near.id; UI.islName.textContent = near.name;
    for (const el of UI.islDots.children) el.classList.toggle('here', +el.dataset.id === near.id);
    for (const el of UI.islPop.children) el.classList.toggle('on', +el.dataset.id === near.id);
  }
  const vn = state.view, vk = 'view' + vn;
  if (UI.last.view !== vk) { UI.last.view = vk; UI.viewBtn.innerHTML = ''; UI.viewBtn.appendChild(iconEl(vn, 30)); UI.viewBtn.title = 'View: ' + (vn === 'builder' ? 'Builder' : vn === 'stroll' ? 'Stroll' : 'Postcard'); }
  const mk2 = muted || tune.volume <= 0 ? 'muted' : tune.volume < 0.4 ? 'soundLow' : 'sound';
  if (UI.last.mute !== mk2) { UI.last.mute = mk2; UI.soundBtn.innerHTML = ''; UI.soundBtn.appendChild(iconEl(mk2, 30)); }
  if (UI.last.muted !== muted) { UI.last.muted = muted; UI.muteSwitch.classList.toggle('off', muted); UI.muteSwitch.querySelector('span').textContent = muted ? 'Off' : 'On'; UI.soundPanel.classList.toggle('muted', muted); }
  for (const v of UI.vol) { // the sliders follow the keys ([ ]) and the tweak panel
    const val = CONFIG[v.key].value; if (document.activeElement !== v.el && Number(v.el.value) !== val) v.el.value = val;
    const pc = Math.round(val * 100) + '%'; if (v.out.textContent !== pc) v.out.textContent = pc;
  }
  // The story card.
  const m = state.modal;
  show(UI.modal, !!m);
  if (m) {
    const key = JSON.stringify(m);
    if (UI.last.modal !== key) {
      UI.last.modal = key;
      const isl = ISLANDS[m.island] || ISLANDS[0];
      let icon = 'island', h = '', btnTxt = 'OK', rarCls = '', rarCol = '#8fbf74';
      if (m.kind === 'story') {
        // first: the name and one line; the rest of its story waits behind a link; a pill only when it is rare
        const rk = rarityOf(isl.id), rar = RARITY[rk], relic = RELICS[state.islands[isl.id].relic];
        rarCls = 'r-' + rk; rarCol = rar.color;
        const head = { epic: '✦ Rare · Epic', legendary: '✦ Legendary' }[rk];
        h = (head ? `<div class="rar wow" style="--rc:${rar.color}">${esc(head)}</div>` : '') + `<h2>${esc(isl.name)}</h2><p class="first">${esc(isl.story[0])}</p>` +
          (isl.story.length > 1 ? `<div class="more" style="display:none">${isl.story.slice(1).map(p => `<p>${esc(p)}</p>`).join('')}</div><button class="btn quiet" data-more="1">Read its story</button>` : '');
        if (relic) { h += `<div class="relic"><small>You found</small><b>${esc(relic.name)}</b><p>${esc(relic.text)}</p></div>`; icon = relic.kind; btnTxt = 'Bring it home'; }
        else btnTxt = 'Step ashore';
      } else if (m.kind === 'secret') {
        h = `<div class="rar" style="--rc:#cfe0ff">A secret of ${esc(isl.name)}</div><h2>${esc(isl.secret.title)}</h2><p class="first">${esc(isl.secret.text)}</p><div class="relic"><small>New piece</small><b>${esc(PIECES[isl.secret.bonus].name)}</b></div>`;
        rarCol = '#cfe0ff';
        icon = isl.secret.bonus; btnTxt = 'Keep it';
      } else {
        h = `<div class="rar" style="--rc:#f5c76b">Abovea</div><h2>The sky remembers</h2><p class="first">Every island is home again.</p><div class="more" style="display:none"><p>${esc(state.found.map(id => ISLANDS[id].name).join(', '))}.</p><p>There is no rush and nowhere you must go. Build, wander, and watch the stars your lamp remembers.</p></div><button class="btn quiet" data-more="1">See them all</button>`;
        rarCls = 'r-legendary'; rarCol = '#f5c76b';
        icon = 'starlamp'; btnTxt = 'Keep building';
      }
      document.getElementById('modaltext').innerHTML = h;
      const card = UI.modal.querySelector('.card'); card.className = 'card ' + rarCls; card.style.setProperty('--rc', rarCol);
      UI.modalIcon.getContext('2d').clearRect(0, 0, UI.modalIcon.width, UI.modalIcon.height);
      drawIcon(UI.modalIcon.getContext('2d'), icon, UI.modalIcon.width);
      UI.modalBtn.querySelector('span').textContent = btnTxt;
    }
  } else UI.last.modal = '';
}
// ---- Saving: many named worlds kept in this browser --------------------------------------------------
// abovea.worlds: the list [{ id, name, at, found, folk, day }]; abovea.world.<id>: each world's save.
const WORLDS_KEY = 'abovea.worlds', WORLD_KEY = id => 'abovea.world.' + id, OLD_SAVE_KEY = 'abovea.save';
let WORLDS = null; // cached list: the menus ask every frame
/** The saved worlds, newest first (an older single save is brought into the list once). */
function worldList() {
  if (WORLDS) return WORLDS;
  try {
    WORLDS = JSON.parse(localStorage.getItem(WORLDS_KEY) || '[]');
    const old = localStorage.getItem(OLD_SAVE_KEY);
    if (old) {
      const d = JSON.parse(old), id = 'w' + Date.now().toString(36);
      if (d && d.state) { localStorage.setItem(WORLD_KEY(id), old); WORLDS.push({ id, name: 'My first sky', at: d.at || Date.now(), found: (d.state.found || []).length, folk: (d.state.folk || []).length, day: (d.state.dayN || 0) + 1 }); }
      localStorage.removeItem(OLD_SAVE_KEY); localStorage.setItem(WORLDS_KEY, JSON.stringify(WORLDS));
    }
  } catch (_) { WORLDS = []; } // storage blocked: no list
  WORLDS.sort((a, b) => b.at - a.at); return WORLDS;
}
function saveExists() { return worldList().length > 0; }
/** A name to offer for a new world: its home island's name and the sky's word. */
function suggestName() { const n = ISLANDS[0].name + ' Sky'; let s = n, k = 2; while (worldList().some(w => w.name === s)) s = n + ' ' + k++; return s; }
/**
 * Keeps this world under its own entry (state.saveId; made, with name or a suggested one, the
 * first time): its sky (WORLD_SEED; the islands are made again from it), the chance stream and
 * the whole state, which holds ids and plain data only. Never mid-voyage, never test mode.
 */
function saveWorld(name) {
  if (!state || state.mode === 'voyage' || state.test) return false;
  try {
    const list = worldList();
    if (!state.saveId || !list.some(w => w.id === state.saveId)) { state.saveId = 'w' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); state.worldName = name || state.worldName || suggestName(); }
    if (name) state.worldName = name;
    const st = JSON.stringify(state, (k, v) => (v instanceof Set || v instanceof Map ? undefined : v));
    localStorage.setItem(WORLD_KEY(state.saveId), JSON.stringify({ v: 1, world: WORLD_SEED, seed, at: Date.now(), state: JSON.parse(st) }));
    const row = { id: state.saveId, name: state.worldName, at: Date.now(), found: state.found.length, folk: state.folk.length, day: (state.dayN || 0) + 1 };
    WORLDS = [row, ...list.filter(w => w.id !== row.id)];
    localStorage.setItem(WORLDS_KEY, JSON.stringify(WORLDS));
    state.savedAt = state.t; events.push({ type: 'save', id: row.id }); return true;
  } catch (_) { return false; } // storage full or blocked
}
/** Brings back a saved world (the newest when no id): its sky, then its state over a fresh one (so new fields keep their defaults). */
function loadWorld(id) {
  let d = null; id = id || (worldList()[0] || {}).id;
  try { d = JSON.parse(localStorage.getItem(WORLD_KEY(id)) || 'null'); } catch (_) { d = null; }
  if (!d || d.v !== 1 || !d.state) return false;
  if (d.world !== WORLD_SEED) generateWorld(d.world);
  const fresh = reset() || state;
  Object.assign(state, d.state, { islands: fresh.islands.map((s, k) => (d.state.islands || [])[k] || s), relics: { ...fresh.relics, ...(d.state.relics || {}) } }); seed = d.seed; state.saveId = id; // an older save (fewer islands) keeps the new ones hidden
  state.toasts = []; state.say = null; state.voyage = null; state.mode = 'build'; state.savedAt = state.t; state.choosing = null;
  if (state.carry) cancelCarry();
  resetWorld(); buildIslandMeshes(); refloor(); recount();
  events.push({ type: 'load', id }); return true;
}
function renameWorld(id, name) {
  const w = worldList().find(x => x.id === id); if (!w || !name) return;
  w.name = name; if (state.saveId === id) state.worldName = name;
  try {
    localStorage.setItem(WORLDS_KEY, JSON.stringify(WORLDS));
    const d = JSON.parse(localStorage.getItem(WORLD_KEY(id)) || 'null'); if (d) { d.state.worldName = name; localStorage.setItem(WORLD_KEY(id), JSON.stringify(d)); }
  } catch (_) { /* storage blocked */ }
}
function deleteWorld(id) {
  WORLDS = worldList().filter(w => w.id !== id);
  try { localStorage.removeItem(WORLD_KEY(id)); localStorage.setItem(WORLDS_KEY, JSON.stringify(WORLDS)); } catch (_) { /* storage blocked */ }
  if (state.saveId === id) state.saveId = null;
}
/** Autosave: every tune.autosaveEvery seconds of play, and when the page is hidden or closed; into this world's own entry. */
function autosaveStep() {
  if (tune.autosaveEvery > 0 && state.t - (state.savedAt || 0) >= tune.autosaveEvery && !state.modal) saveWorld();
}
addEventListener('pagehide', () => { if (scene === 'play' || scene === 'pause') saveWorld(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && (scene === 'play' || scene === 'pause')) saveWorld(); });

// ---- The Worlds list and the naming card --------------------------------------------------------------
/** Is a card over the title or pause (the worlds list, the naming card)? Then their keys wait. */
function overlayOpen() { return ['worlds', 'nameit', 'help', 'confirm'].some(id => { const e = document.getElementById(id); return e && e.style.display !== 'none'; }); }
/** Esc over the menus: the top card closes first (naming, confirm, how to play, then the worlds list). */
function closeTopOverlay() {
  for (const id of ['nameit', 'confirm', 'help', 'worlds']) { const e = document.getElementById(id); if (e && e.style.display !== 'none') { if (id === 'nameit') nameDone(false); else show(e, false); return; } }
}
function openHelp(on) { show(document.getElementById('help'), on); }
/** Starting again asks first; the world is saved before it is cleared. */
function confirmAgain(random) {
  UI.confRandom = random;
  document.getElementById('conftitle').textContent = random ? 'Start in a new sky?' : 'Start this sky again?';
  document.getElementById('conftext').textContent = 'This island will be cleared. It is saved first, so your worlds stay safe.';
  show(document.getElementById('confirm'), true);
}
/** New world from the title: a fresh start in this sky. */
function newWorld() { reset(); resetWorld(); scene = 'play'; }
function openWorlds(on) { show(UI.worlds, on); if (on) renderWorlds(); }
function ago(t) {
  const s = Math.max(0, (Date.now() - t) / 1000);
  return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' h ago' : new Date(t).toLocaleDateString();
}
/** One row a world: its name, how far it has come, Resume, Rename and Remove (a second tap removes). */
function renderWorlds() {
  const list = worldList(), hidden = ISLANDS.length - 1;
  UI.wlist.innerHTML = list.length ? list.map(w => `<div class="wlrow${w.id === state.saveId ? ' here' : ''}" data-id="${w.id}">` +
    `<div class="wmain"><b>${esc(w.name)}</b><span>${w.found}/${hidden} islands · ${w.folk} folk · day ${w.day} · ${esc(ago(w.at))}</span></div>` +
    `<button class="btn small" data-act="resume">Resume</button><button class="btn small ghost" data-act="rename" aria-label="Rename" title="Rename">✎</button>` +
    `<button class="btn small ghost" data-act="del" aria-label="Remove" title="Remove">✕</button></div>`).join('')
    : '<p class="soft">No saved worlds yet. Save one from the pause menu.</p>';
}
/** The naming card: then(name) runs on Save with the typed name. */
function askName(title, value, then, okText) {
  UI.nameTitle.textContent = title; UI.wname.value = value; UI.nameThen = then;
  UI.nameOk.querySelector('span').textContent = okText || 'Save'; nameInput();
  show(UI.nameit, true); setTimeout(() => { UI.wname.focus(); UI.wname.select(); }, 30);
}
/** The name card's foot: a counter, and a soft word when another world has this name (both are kept). */
function nameInput() {
  const n = UI.wname.value.trim(), c = document.getElementById('namecount'), hint = document.getElementById('namehint');
  c.textContent = UI.wname.value.length + '/24'; c.classList.toggle('near', UI.wname.value.length >= 22);
  hint.classList.remove('err');
  hint.textContent = n && worldList().some(w => w.name === n && w.id !== state.saveId) ? 'Another world has this name too. Both will be kept.' : '';
}
function nameError(t) { const hint = document.getElementById('namehint'); hint.textContent = t; hint.classList.add('err'); }
/** then(name) may return false to keep the card open (a failed save). */
function nameDone(ok) {
  const n = UI.wname.value.replace(/\s+/g, ' ').trim().slice(0, 24);
  if (ok && !n) { nameError('Give it a name first.'); return; }
  if (ok && UI.nameThen && UI.nameThen(n) === false) return;
  show(UI.nameit, false); UI.wname.blur(); UI.nameThen = null;
}
function initWorldsUI() {
  UI.worlds = document.getElementById('worlds'); UI.wlist = document.getElementById('wlist'); UI.nameit = document.getElementById('nameit'); UI.wname = document.getElementById('wname'); UI.nameTitle = document.getElementById('nametitle');
  btn(document.getElementById('wbtns'), null, 'Back', () => openWorlds(false), 'big ghost');
  UI.nameOk = btn(document.getElementById('nbtns'), null, 'Save', () => nameDone(true), 'big');
  btn(document.getElementById('nbtns'), null, 'Cancel', () => nameDone(false), 'big ghost');
  UI.wname.addEventListener('input', nameInput);
  UI.wname.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') nameDone(true); if (e.key === 'Escape') nameDone(false); });
  UI.wlist.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'), row = e.target.closest('.wlrow'); if (!b || !row) return;
    e.stopPropagation(); startAudio(); sfx.ui();
    const id = row.dataset.id, w = worldList().find(x => x.id === id);
    if (b.dataset.act === 'resume') { if (scene === 'pause' && id !== state.saveId) saveWorld(); if (loadWorld(id)) { openWorlds(false); scene = 'play'; toast('Welcome back to ' + w.name); } }
    else if (b.dataset.act === 'rename') askName('Rename this world', w.name, n => { renameWorld(id, n); renderWorlds(); });
    else if (b.dataset.act === 'del') {
      if (b.classList.contains('sure')) { deleteWorld(id); renderWorlds(); }
      else { b.classList.add('sure'); b.textContent = 'Remove?'; setTimeout(() => { if (b.isConnected) { b.classList.remove('sure'); b.textContent = '✕'; } }, 2500); }
    }
  });
}
/** Save world in pause: the name card, every time (prefilled); Save & play saves and goes back to the game. */
function saveFromPause() {
  if (state.test || state.mode === 'voyage') return;
  const first = !(state.saveId && worldList().some(w => w.id === state.saveId));
  askName(first ? 'Name your world' : 'Save your world', state.worldName || suggestName(), n => {
    if (!saveWorld(n)) { nameError('Could not save. Your browser storage may be full.'); return false; }
    scene = 'play'; toast('Saved · ' + n); return true;
  }, 'Save & play');
}
/**
 * From above: the island under the pointer (or picked) gets a small label: its name and its far-off
 * call (how many islands to find first, when locked); a touch adds Land here.
 */
function chartLabel(ch) {
  if (ch && vis.hover && R3) ch.hover = chartPick(vis.hover.x, vis.hover.y);
  const id = ch ? (ch.hover != null ? ch.hover : ch.sel) : null;
  show(UI.chartLabel, id != null);
  if (id == null) { UI.last.chartLabel = ''; return; }
  const isl = ISLANDS[id], open = chartIslands().find(x => x.isl.id === id).open;
  const key = id + '|' + open + '|' + (ch.sel === id && ch.hover == null);
  if (UI.last.chartLabel !== key) {
    UI.last.chartLabel = key;
    const need = Math.max(0, tune.spireAfterFound - state.found.length);
    UI.chartLabel.innerHTML = `<b>${esc(isl.name)}</b><span>${esc(isl.call)}</span>` +
      (open ? '' : `<em>Find ${need} more island${need === 1 ? '' : 's'} first</em>`) +
      (open && ch.sel === id && ch.hover == null ? '<button class="btn small sailhere" data-sail="' + id + '">Land here</button>' : '');
  }
  const p = _v.set(isl.cx, islandLift(id) + 1.5, isl.cz).project(R3.cam);
  UI.chartLabel.style.left = Math.round((p.x + 1) / 2 * innerWidth) + 'px'; UI.chartLabel.style.top = Math.round((1 - p.y) / 2 * innerHeight) + 'px';
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
  if (random) toast('A new sky drifts in');
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
  toast('Weather: ' + WEATHER_NAMES[kind]); sfx.ui();
  events.push({ type: 'weather', kind });
}
function startTest() {
  startOver(false);
  state.test = true;
  for (const t of TOOL_ORDER) { state.unlocked[t] = 1; state.seen[t] = 1; }
  state.islands.forEach((s, k) => { const isl = ISLANDS[k]; s.discovered = true; s.reveal = 1; s.relic = isl.relic || isl.classicRelic || null; s.relicTaken = !!s.relic; s.rarity = isl.rarity; });
  state.relics.bell = true; state.relics.starlamp = true; state.relics.mothlantern = true;
  state.quest = QUESTS.length; state.questReady = false; state.ended = true; state.tut = null;
  state.found = ISLANDS.slice(1).map(i => i.id); state.gained = 'Found: ' + state.found.map(id => ISLANDS[id].name).join(', ');
  state.cam.dist = Math.max(state.cam.dist, 26);
  toast('Test mode: all unlocked');
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
  bellRing() { if (!this.ok()) return; const t = this.t(); bellVoice(mtof(74), t, 2.4, 0.05, bus.fx); bellVoice(mtof(81), t + 0.02, 1.6, 0.025, bus.fx); },
  bell() { if (!this.ok()) return; const t = this.t(); bellVoice(mtof(62), t, 4, 0.1, bus.fx); bellVoice(mtof(69), t + 0.6, 3.5, 0.07, bus.fx); },
  thunder() { if (!this.ok()) return; const t = this.t() + 0.4; noiseHit(t, 2.6, 0.35, 140); noiseHit(t + 0.2, 1.8, 0.2, 90); },
  ui() { if (!this.ok()) return; epiano(mtof(84), this.t(), 0.025, bus.fx, 0, 0.4); },
  /** A note from a campfire player: a plucked lute, a soft flute, or a low drum thump. */
  fireNote(kind, vol, n) { if (!this.ok()) return; const t = this.t();
    if (kind === 'lute') epiano(mtof(n), t, 0.06 * vol, bus.fx, 0, 0.7);
    else if (kind === 'flute') bellVoice(mtof(n + 12), t, 0.9, 0.035 * vol, bus.fx);
    else kick(t, 0.1 * vol, bus.fx); },
};
