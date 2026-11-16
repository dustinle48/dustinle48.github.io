// PROTOTYPE - NOT FOR PRODUCTION
// Abovea: the islands, their stories, the quests and the pieces. Words and places, no numbers
// to tune (those live in config.js).
'use strict';

/** Pieces the player can place. kind: built rises at once; living grows over time. */
const PIECES = {
  house:    { name: 'House',    kind: 'built',  icon: 'house' },
  path:     { name: 'Path',     kind: 'built',  icon: 'path',    flat: true },
  tree:     { name: 'Tree',     kind: 'living', icon: 'tree',    grow: 'treeGrowTime' },
  garden:   { name: 'Garden',   kind: 'living', icon: 'garden',  grow: 'gardenGrowTime' },
  lantern:  { name: 'Lantern',  kind: 'built',  icon: 'lantern', unlockPop: 'lanternUnlockPop' },
  bridge:   { name: 'Bridge',   kind: 'built',  icon: 'bridge',  unlockPop: 'bridgeUnlockPop', onVoid: true },
  meadow:   { name: 'Meadow',   kind: 'living', icon: 'meadow',  grow: 'meadowGrowTime', unlockPop: 'meadowUnlockPop', size: 2 },
  school:   { name: 'Magic School', kind: 'built', icon: 'school', utility: true, size: 2, scale: 1.85, unlockPop: 'schoolUnlockPop',
    about: 'Magic School: little ones visit by day, and grow up faster while it stands.' },
  healer:   { name: 'Healing House', kind: 'built', icon: 'healer', utility: true, size: 2, scale: 1.85, unlockPop: 'healerUnlockPop',
    about: 'Healing House: grown-ups rest here by day, and new little ones arrive sooner.' },
  stone:    { name: 'Carved Stone', kind: 'built', icon: 'stone',    secret: true },
  well:     { name: 'Wishing Well', kind: 'built', icon: 'well',     secret: true },
  totem:    { name: 'Tribe Totem',  kind: 'built', icon: 'totem',    secret: true },
  windmill: { name: 'Windmill',     kind: 'built', icon: 'windmill', secret: true, size: 2, scale: 1.6 },
  rock:     { name: 'Rock',         kind: 'built', icon: 'stone',    scenery: true }, // scattered at the start; Tidy clears it
  arch:     { name: 'Star Arch',    kind: 'built', icon: 'arch',     secret: true },
  // Iteration 24: three more for each tab. Each pairs something homely with one small mystery.
  // unlockPop: a config.js population key · unlockIsland: an island's id, once found · unlockRelic: a relic's kind, once home.
  // sight: wandering sky-folk sometimes stop beside it to look · lure: a wild critter of that kind comes to rest by it.
  bloombox:   { name: 'Bloombox',   kind: 'built', icon: 'bloombox', lure: 'puffbird',
    about: 'Bloombox: a tulip post-box. Letters arrive, though no one sees who sends them.' },
  lullbench:  { name: 'Lull Bench', kind: 'built', icon: 'lullbench', unlockPop: 'lullbenchUnlockPop', sight: true,
    about: 'Lull Bench: a bench under sleepy moths, where sky-folk pause to watch the clouds.' },
  dreamkite:  { name: 'Dreamkite',  kind: 'built', icon: 'dreamkite', unlockIsland: 2,
    about: 'Dreamkite: the Wind-folk\'s kite, tied to a post. It tugs toward somewhere far.' },
  puffcap:    { name: 'Puffcap',    kind: 'living', icon: 'puffcap', grow: 'puffcapGrowTime',
    about: 'Puffcap: soft mushrooms that hum at dusk. A home nearby feels greener.' },
  hushwillow: { name: 'Hushwillow', kind: 'living', icon: 'hushwillow', grow: 'hushwillowGrowTime', unlockIsland: 1, lure: 'glimmerfly',
    about: 'Hushwillow: a willow from the old moss hills. Glimmerflies come to rest in its hush.' },
  starbloom:  { name: 'Starbloom',  kind: 'living', icon: 'starbloom', grow: 'starbloomGrowTime', unlockPop: 'starbloomUnlockPop',
    about: 'Starbloom: a crystal flower that opens only when the stars come out.' },
  dewfall:    { name: 'Dewfall Fountain', kind: 'built', icon: 'dewfall', unlockPop: 'dewfallUnlockPop', lure: 'puffbird',
    about: 'Dewfall Fountain: dew rises up instead of falling. The puffbirds don\'t mind.' },
  dreamloom:  { name: 'Dream Loom', kind: 'built', icon: 'dreamloom', unlockIsland: 3, sight: true,
    about: 'Dream Loom: it weaves cloth from petals and mist. Nobody remembers starting it.' },
  bellcote:   { name: 'Bellcote',   kind: 'built', icon: 'bellcote', unlockRelic: 'bell',
    about: 'Bellcote: a little tower for an echo of the Wind Bell. It sways when winds pass.' },
  campfire:   { name: 'Campfire',   kind: 'built', icon: 'campfire', unlockPop: 'campfireUnlockPop', size: 2, gather: true,
    about: 'Campfire: it lights itself at nightfall, and sky-folk gather round to share stories.' },
  wispjar:    { name: 'Wisp Jar',   kind: 'built', icon: 'wispjar', unlockPop: 'wispjarUnlockPop',
    about: 'Wisp Jar: light-motes from the mist, kept in a jar. They glow brighter at night.' },
  orrery:     { name: 'Sky Orrery', kind: 'built', icon: 'orrery', unlockPop: 'orreryUnlockPop', sight: true,
    about: 'Sky Orrery: tiny islands circling a pearl. One of them isn\'t on any map.' },
  keeperlamp: { name: 'Keeper Lamp', kind: 'built', icon: 'keeperlamp', unlockRelic: 'starlamp',
    about: 'Keeper Lamp: a small lamp in the Lumen Keepers\' style. It still knows the way.' },
};
const TOOL_ORDER = ['look', 'house', 'path', 'lantern', 'bridge', 'bloombox', 'lullbench', 'dreamkite', 'tree', 'garden', 'meadow', 'puffcap', 'hushwillow', 'starbloom',
  'school', 'healer', 'dewfall', 'dreamloom', 'bellcote', 'campfire', 'stone', 'well', 'totem', 'windmill', 'arch', 'wispjar', 'orrery', 'keeperlamp', 'turn', 'move', 'tidy'];
/** Toolbar categories: a tab each; Look, Rotate, Turn and Tidy always show. A tab shows once one of its pieces is unlocked. */
const TOOL_CATS = [
  { id: 'homes', name: 'Homes', icon: 'house', tools: ['house', 'path', 'lantern', 'bridge', 'bloombox', 'lullbench', 'dreamkite'] },
  { id: 'nature', name: 'Nature', icon: 'tree', tools: ['tree', 'garden', 'meadow', 'puffcap', 'hushwillow', 'starbloom'] },
  { id: 'village', name: 'Village', icon: 'school', tools: ['school', 'healer', 'dewfall', 'dreamloom', 'bellcote', 'campfire'] },
  { id: 'treasures', name: 'Treasures', icon: 'stone', tools: ['stone', 'well', 'totem', 'windmill', 'arch', 'wispjar', 'orrery', 'keeperlamp'] },
];
const GREEN = { tree: 1, garden: 1, meadow: 1, puffcap: 1, hushwillow: 1, starbloom: 1 };

const RARITY = {
  home:      { label: 'Home', color: '#9cc27a' },
  normal:    { label: 'Normal', color: '#8fbf74' },
  epic:      { label: 'Epic', color: '#b48ce8' },
  legendary: { label: 'Legendary', color: '#f5c76b' },
};

/**
 * The islands. Positions are world units; a feature or secret sits at polar (a radians, f of the
 * radius) from the centre and snaps to the nearest land cell.
 */
/**
 * Island names are made fresh for every sky (generateWorld): a prefix and a suffix from the
 * island's own lists, by its part (home, moss, wind, meadow, star), at most 12 letters. The epic
 * and legendary islands sometimes take two words. The names below are placeholders (classic).
 */
const ISLAND_NAME_PARTS = [
  { pre: ['Hearth', 'Ember', 'Kettle', 'Honey', 'Hazel', 'Candle', 'Bramble', 'Hob', 'Plum', 'Cinder', 'Apple'], suf: ['rest', 'nook', 'stead', 'cote', 'haven', 'croft', 'wick', 'ley', 'by', 'combe', 'fold'] },
  { pre: ['Moss', 'Lichen', 'Fern', 'Root', 'Bark', 'Hush', 'Stump', 'Gnarl', 'Tuft', 'Dapple', 'Loam', 'Velvet'], suf: ['rest', 'mere', 'bough', 'hollow', 'knoll', 'dell', 'nest', 'holt', 'wold', 'bank', 'glen'] },
  { pre: ['Wind', 'Gale', 'Gust', 'Kite', 'Drum', 'Reed', 'Bell', 'Totem', 'Hawk', 'Flute', 'Plume', 'Rune'], suf: ['hollow', 'reach', 'call', 'song', 'roost', 'eyrie', 'crest', 'horn', 'gate', 'ring', 'howl'], two: 0.4 },
  { pre: ['Drift', 'Petal', 'Clover', 'Poppy', 'Daisy', 'Bloom', 'Thistle', 'Seed', 'Mallow', 'Sorrel', 'Pollen'], suf: ['meadow', 'field', 'lea', 'mead', 'sway', 'down', 'green', 'mill', 'wisp', 'patch', 'sweep'] },
  { pre: ['Star', 'Lumen', 'Moon', 'Comet', 'Halo', 'Glint', 'Silver', 'Night', 'Vesper', 'Gleam', 'Aster', 'Dawn'], suf: ['fall', 'spire', 'crown', 'watch', 'light', 'keep', 'veil', 'glass', 'rise', 'helm', 'wake'], two: 0.4 },
  { pre: ['Shell', 'Slow', 'Dozy', 'Amble', 'Hum', 'Old', 'Drowse', 'Dew', 'Snooze', 'Mossy', 'Plod'], suf: ['back', 'shell', 'nap', 'mound', 'dome', 'step', 'doze', 'hump', 'sleep', 'bower', 'lull'] },
  { pre: ['Moth', 'Lamp', 'Wick', 'Glow', 'Dusk', 'Tallow', 'Wax', 'Gloam', 'Owl', 'Lull', 'Shade'], suf: ['wood', 'grove', 'wing', 'flutter', 'hush', 'glade', 'spinney', 'dust', 'copse', 'burrow', 'flit'], two: 0.4 },
  { pre: ['Mirror', 'Still', 'Glass', 'Ripple', 'Calm', 'Dream', 'Echo', 'Lily', 'Pond', 'Wane', 'Hollow'], suf: ['pool', 'water', 'tarn', 'well', 'shallow', 'lake', 'spring', 'deep', 'basin', 'eddy', 'brim'] },
  { pre: ['Loom', 'Cloud', 'Thread', 'Spindle', 'Skein', 'Wool', 'Bobbin', 'Weft', 'Shuttle', 'Tassel', 'Fleece'], suf: ['loft', 'spin', 'weave', 'knot', 'twine', 'bale', 'reel', 'yarn', 'stitch', 'hank', 'braid'], two: 0.4 },
];
/**
 * The twelve constellations of the turning sky, one featured each night in turn (game designer's
 * spec). pts are a small layout (units of the figure's size), edges join them; the ones without
 * pts are drawn by a seeded random walk (cosmos setup).
 */
const CONSTELLATIONS = [
  { name: 'The Lantern-Fox', line: 'Guides lost travellers home.', pts: [[0, 1], [0, 0.7], [-0.45, 0.4], [0.45, 0.4], [-0.45, -0.4], [0.45, -0.4], [0, -0.75]], edges: [[0, 1], [1, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 6], [5, 6]] },
  { name: 'The Sleeping Whale', line: "The sky's slow breath.", pts: [[-0.9, -0.2], [-0.4, 0.1], [0.2, 0.1], [0.7, -0.1], [0.9, 0.5], [0.75, 0.95], [0.55, 0.5]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6]] },
  { name: 'The Kettle', line: 'Warmth shared at a fire.' },
  { name: 'The Moth-Queen', line: 'Drawn to every gentle light.', pts: [[0, 0.6], [-0.5, 0.9], [-0.8, 0.3], [0, 0], [0.8, 0.3], [0.5, 0.9], [0, -0.7]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [3, 6]] },
  { name: 'The Twin Seeds', line: 'What is planted together grows together.' },
  { name: "The Ferryman's Oar", line: 'Safe crossing between islands.' },
  { name: 'The Owl Clock', line: 'Patience: all things in time.' },
  { name: 'The Paper Kite', line: 'A wish let go on the wind.', pts: [[0, 1], [-0.6, 0.2], [0, -0.4], [0.6, 0.2], [0.1, -0.75], [-0.15, -1]], edges: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5]] },
  { name: 'The Mossback Tortoise', line: 'An island that remembers.' },
  { name: "The Weaver's Loom", line: 'Threads binding the village.' },
  { name: 'The Bell-Deer', line: 'The first note of morning.' },
  { name: 'The Hollow Crown', line: 'A king who gave his crown away.' },
];
const ISLAND_NAME_BLOCK = ['Moonlight', 'Starlight', 'Nightlight', 'Moonrise', 'Bellring', 'Windmill'];
const ISLANDS = [
  { id: 0, name: 'Hearthrest', classic: 'Hearthrest', rarity: 'home', cx: 0, cz: 0, y: 0, r: 5.6, ph: 0.7, seed: 11,
    secret: { a: 2.3, f: 0.78, bonus: 'stone', title: 'A humming stone',
      text: 'Half-buried at the island\'s edge, a stone hums softly. Its carving shows a lamp hanging above the clouds, and tiny figures beneath it, looking up.' },
    features: [{ type: 'lantern', a: 0.9, f: 0.35 }] },
  { id: 1, call: 'A shape far out in the mist...', name: 'Mossy Rest', classic: 'Mossy Rest', rarity: 'normal', cx: 17, cz: -9, y: 1.4, r: 3.6, ph: 2.1, seed: 23,
    story: ['A quiet hill of moss and old roots, drifting on its own.', 'Nothing has happened here for a very long time, and that is exactly why the birds love it.'],
    secret: { a: 0.6, f: 0.55, bonus: 'well', title: 'A wooden whistle',
      text: 'In the hollow of an old stump: a child\'s wooden whistle, worn smooth. Someone used to come here to play.' },
    features: [{ type: 'oldtree', a: 0.2, f: 0.1 }, { type: 'oldtree', a: 2.4, f: 0.55 }, { type: 'oldtree', a: 4.2, f: 0.5 }, { type: 'rock', a: 1.4, f: 0.6 }, { type: 'rock', a: 5.3, f: 0.65 }] },
  { id: 2, classicRelic: 'bell', call: 'Something rings, far away...', name: 'Hollow of the Wind-folk', classic: 'Hollow of the Wind-folk', rarity: 'epic', cx: -18, cz: -7, y: -1, r: 4.2, ph: 4.0, seed: 37,
    story: ['Round huts with tall woven roofs stand empty, their doors open, as if everyone stepped out a moment ago.',
      'Carvings tell of the Wind-folk, a lost tribe who followed the winds from island to island, ringing a bell so the clouds would part for them.',
      'Their bell-gate still stands over the old path.'],
    secret: { a: 3.6, f: 0.6, bonus: 'totem', title: 'Faces in the wood',
      text: 'Faces carved one above another, each a little smaller: grandparents, parents, children. The smallest face is smiling.' },
    features: [{ type: 'bellgate', a: 0, f: 0 }, { type: 'hut', a: 0.9, f: 0.55 }, { type: 'hut', a: 2.2, f: 0.6 }, { type: 'hut', a: 4.9, f: 0.55 }, { type: 'totem', a: 3.0, f: 0.35 }] },
  { id: 3, call: 'Petals drift up from the mist...', name: 'Drift Meadow', classic: 'Drift Meadow', rarity: 'normal', cx: 7, cz: 18, y: 0.8, r: 3.5, ph: 1.2, seed: 41,
    story: ['Wildflowers in every colour grow here with nobody to tend them.', 'A broken windmill still turns, slowly, whenever the wind remembers it.'],
    secret: { a: 4.0, f: 0.55, bonus: 'windmill', title: 'A sack of seeds',
      text: 'Under the windmill, a sack of seeds labelled in a tidy hand: "For whoever comes next."' },
    features: [{ type: 'brokenmill', a: 0, f: 0 }, { type: 'wildflowers', a: 1.0, f: 0.5 }, { type: 'wildflowers', a: 2.6, f: 0.55 }, { type: 'wildflowers', a: 5.2, f: 0.5 }, { type: 'rock', a: 3.4, f: 0.6 }] },
  { id: 4, call: 'A pale light answers, high above...', name: 'Starfall Spire', classic: 'Starfall Spire', rarity: 'legendary', cx: -13, cz: 19, y: 3, r: 4.6, ph: 5.1, seed: 53,
    story: ['White stone rises in rings around a spire taller than any tree.',
      'Here lived the Lumen Keepers, a forgotten people who lifted every island above the clouds, and hung a lamp in the sky so that no one would ever be lost at night.',
      'When they left, the lamp went quiet. It is still warm.'],
    relic: 'starlamp',
    secret: { a: 5.6, f: 0.62, bonus: 'arch', title: 'A map of everything',
      text: 'On the spire\'s lowest step: a map of every island, and many more beyond its edge. Abovea is bigger than anyone knows.' },
    features: [{ type: 'spire', a: 0, f: 0 }, { type: 'column', a: 0.5, f: 0.6 }, { type: 'column', a: 2.0, f: 0.62 }, { type: 'column', a: 3.6, f: 0.6 }, { type: 'column', a: 4.6, f: 0.62 }] },
  { id: 5, call: 'Something slow is breathing in the mist...', name: 'Shellback', classic: 'Shellback', rarity: 'normal', cx: 31, cz: 10, y: 0.4, r: 3.7, ph: 3.3, seed: 61,
    story: ['This island is not quite an island. It is the shell of a tortoise older than the clouds, fast asleep.', 'Flowers grow on its back, and it drifts wherever its dreams go.'],
    secret: { a: 1.8, f: 0.55, bonus: 'lullbench', title: 'A napping place',
      text: 'Behind its head, a small worn bench. Someone used to sit here and listen to it breathe.' },
    features: [{ type: 'oldtree', a: 0, f: 0.1 }, { type: 'wildflowers', a: 1.2, f: 0.55 }, { type: 'wildflowers', a: 3.9, f: 0.5 }, { type: 'rock', a: 2.6, f: 0.62 }, { type: 'rock', a: 5.4, f: 0.6 }] },
  { id: 6, classicRelic: 'mothlantern', call: 'Tiny lights flicker between the clouds...', name: 'Mothwood', classic: 'Mothwood', rarity: 'epic', cx: -3, cz: -32, y: 1.8, r: 4, ph: 0.4, seed: 67,
    story: ['Lanterns hang empty from every branch.', 'The Moth-folk once carried light from island to island at night, following moths that knew the way. Their moths never left.'],
    secret: { a: 4.4, f: 0.6, bonus: 'campfire', title: 'A letter in a lamp',
      text: 'Folded inside a cold lamp, in a careful hand: "Meet us at the fire when the moon is full."' },
    features: [{ type: 'oldtree', a: 0, f: 0 }, { type: 'hut', a: 1.1, f: 0.55 }, { type: 'hut', a: 3.3, f: 0.58 }, { type: 'lantern', a: 2.2, f: 0.4 }, { type: 'totem', a: 5.2, f: 0.45 }] },
  { id: 7, call: 'A second sky shines below...', name: 'Mirrormere', classic: 'Mirrormere', rarity: 'normal', lake: true, cx: -32, cz: 9, y: -0.6, r: 3.6, ph: 2.7, seed: 71,
    story: ['A round pool lies perfectly still, and the sky inside it never matches the sky above.', 'Sometimes it shows tomorrow\'s weather. Sometimes it shows stars at noon.'],
    secret: { a: 3.0, f: 0.6, bonus: 'orrery', title: 'Stars at noon',
      text: 'Lean close over the pool, and a small reflection waves back.' },
    features: [{ type: 'column', a: 0.7, f: 0.6 }, { type: 'column', a: 4.1, f: 0.62 }, { type: 'wildflowers', a: 2.0, f: 0.55 }, { type: 'rock', a: 5.5, f: 0.6 }] },
  { id: 8, call: 'Threads of cloud drift upward...', name: 'Loomloft', classic: 'Loomloft', rarity: 'epic', cx: -2, cz: 34, y: 2.2, r: 4.1, ph: 4.6, seed: 79,
    story: ['A great wheel stands still beside small looms.', 'The Cloud-weavers spun the soft clouds that hold every island up. Half a cloud is still on the wheel.'],
    secret: { a: 2.4, f: 0.58, bonus: 'dewfall', title: 'A spindle of dew',
      text: 'Wound tight with morning dew, ready to pour.' },
    features: [{ type: 'brokenmill', a: 0, f: 0 }, { type: 'hut', a: 1.4, f: 0.55 }, { type: 'hut', a: 4.0, f: 0.58 }, { type: 'totem', a: 2.8, f: 0.45 }, { type: 'wildflowers', a: 5.4, f: 0.55 }] },
];

/** Quests in order; each opens the next hidden island. */
/**
 * The relics. The Star-lamp always waits on the legendary island (ISLANDS[].relic); the Wind Bell
 * and the Moth Lantern are dealt to the other islands as they are found (revealIsland).
 */
const RELICS = {
  bell: { kind: 'bell', name: 'The Wind Bell', text: 'Its ring is a song the winds remember. Your sky has a new melody.' },
  mothlantern: { kind: 'mothlantern', name: 'The Moth Lantern', text: 'The moths follow you home. Wisp Jars can be built now.' },
  starlamp: { kind: 'starlamp', name: 'The Star-lamp', text: 'You carry it home and light it. Tonight, the sky will remember its colours.' },
};
/**
 * The voyages: Set sail plays one of these (a bag, so each comes round before any repeats), and
 * then you choose where it has brought you. None can be lost; a miss only means waiting for the
 * next. goal: the counter line; how: the controls line.
 */
const VOYAGE_GAMES = {
  motes: { goal: 'Catch the light-motes to find the way', how: 'Steer with the Left and Right arrow keys or A and D, or touch where you want the boat to go.' },
  firefly: { goal: 'Keep close to the firefly; it knows the way', how: 'Steer with the Left and Right arrow keys or A and D, or touch where you want the boat to go.' },
  gates: { goal: 'Pass beneath the old wind-arches', how: 'Steer with the Left and Right arrow keys or A and D, or touch where you want the boat to go.' },
  bell: { goal: 'When the bell\'s ring reaches you, answer it', how: 'Tap, click or press Space as the ripple meets the boat.' },
};
/** A finished quest lets you sail to any hidden island you choose (Set sail: the sky seen from above). */
const QUESTS = [
  { pop: 'q1Pop', task: 'trees', n: 'q1Trees', taskText: n => `Plant ${n} trees` },
  { pop: 'q2Pop', task: 'lanterns', n: 'q2Lanterns', taskText: n => `Light ${n} lanterns` },
  { pop: 'q3Pop', task: 'bridges', n: 'q3Bridges', taskText: n => n === 1 ? 'Build a bridge' : `Build ${n} bridges` },
  { pop: 'q4Pop', task: 'gardens', n: 'q4Gardens', taskText: n => `Grow ${n} gardens into bloom` },
  { pop: 'q5Pop', task: 'houses', n: 'q5Houses', taskText: n => `Build ${n} homes` },
  { pop: 'q6Pop', task: 'trees', n: 'q6Trees', taskText: n => `Plant ${n} trees` },
  { pop: 'q7Pop', task: 'lanterns', n: 'q7Lanterns', taskText: n => `Light ${n} lanterns` },
  { pop: 'q8Pop', task: 'bridges', n: 'q8Bridges', taskText: n => `Build ${n} bridges` },
];

/** Family names are made fresh each game from a first part and a last part (or, now and then, one old word alone). */
const NAME_PARTS = {
  first: ['Moon', 'Star', 'Thistle', 'Willow', 'Cloud', 'Fern', 'Bramble', 'Honey', 'Mist', 'Feather', 'Dew', 'Amber', 'Lark', 'Briar', 'Pebble',
    'Clover', 'Sorrel', 'Hazel', 'Wren', 'Ember', 'Silver', 'Plum', 'Sun', 'Rain', 'Snow', 'Bell', 'Wind', 'Drift', 'Apple', 'Bumble', 'Puddle',
    'Sky', 'Moss', 'Rose', 'Pine', 'Glimmer', 'Tumble', 'Poppy', 'Nettle', 'Velvet'],
  last: ['wick', 'down', 'brook', 'bloom', 'whistle', 'song', 'leaf', 'hollow', 'well', 'feather', 'dale', 'glow', 'berry', 'bottom', 'cap',
    'field', 'spark', 'thorn', 'shine', 'root', 'gale', 'mere', 'light', 'button', 'puff', 'kettle', 'by', 'wing', 'nook', 'dew'],
  alone: ['Willow', 'Thistle', 'Puffin', 'Breeze', 'Juniper', 'Marigold', 'Pebble', 'Nimbus', 'Larkspur', 'Fern', 'Clover', 'Bramble', 'Sorrel',
    'Hazel', 'Poppy', 'Saffron', 'Cirrus', 'Dandelion', 'Quill', 'Tansy', 'Rook', 'Meadowsweet', 'Plume'],
};

const TRACKS = {
  home: { name: 'Morning Hearth' },
  bell: { name: 'Song of the Wind Bell' },
};
