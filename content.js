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
  meadow:   { name: 'Meadow',   kind: 'living', icon: 'meadow',  grow: 'meadowGrowTime', unlockPop: 'meadowUnlockPop' },
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
};
const TOOL_ORDER = ['look', 'house', 'path', 'lantern', 'bridge', 'tree', 'garden', 'meadow', 'school', 'healer', 'stone', 'well', 'totem', 'windmill', 'arch', 'turn', 'tidy'];
/** Toolbar categories: a tab each; Look, Rotate, Turn and Tidy always show. A tab shows once one of its pieces is unlocked. */
const TOOL_CATS = [
  { id: 'homes', name: 'Homes', icon: 'house', tools: ['house', 'path', 'lantern', 'bridge'] },
  { id: 'nature', name: 'Nature', icon: 'tree', tools: ['tree', 'garden', 'meadow'] },
  { id: 'village', name: 'Village', icon: 'school', tools: ['school', 'healer'] },
  { id: 'treasures', name: 'Treasures', icon: 'stone', tools: ['stone', 'well', 'totem', 'windmill', 'arch'] },
];
const GREEN = { tree: 1, garden: 1, meadow: 1 };

const RARITY = {
  home:      { label: 'Home', color: '#9cc27a' },
  normal:    { label: 'Normal island', color: '#8fbf74' },
  epic:      { label: 'Epic · Lost Tribe', color: '#b48ce8' },
  legendary: { label: 'Legendary · Forgotten Civilization', color: '#f5c76b' },
};

/**
 * The islands. Positions are world units; a feature or secret sits at polar (a radians, f of the
 * radius) from the centre and snaps to the nearest land cell.
 */
const ISLANDS = [
  { id: 0, name: 'Hearthrest', rarity: 'home', cx: 0, cz: 0, y: 0, r: 5.6, ph: 0.7, seed: 11,
    secret: { a: 2.3, f: 0.78, bonus: 'stone', title: 'A humming stone',
      text: 'Half-buried at the island\'s edge, a stone hums softly. Its carving shows a lamp hanging above the clouds, and tiny figures beneath it, looking up.' },
    features: [{ type: 'lantern', a: 0.9, f: 0.35 }] },
  { id: 1, name: 'Mossy Rest', rarity: 'normal', cx: 17, cz: -9, y: 1.4, r: 3.6, ph: 2.1, seed: 23,
    story: ['A quiet hill of moss and old roots, drifting on its own.', 'Nothing has happened here for a very long time, and that is exactly why the birds love it.'],
    secret: { a: 0.6, f: 0.55, bonus: 'well', title: 'A wooden whistle',
      text: 'In the hollow of an old stump: a child\'s wooden whistle, worn smooth. Someone used to come here to play.' },
    features: [{ type: 'oldtree', a: 0.2, f: 0.1 }, { type: 'oldtree', a: 2.4, f: 0.55 }, { type: 'oldtree', a: 4.2, f: 0.5 }, { type: 'rock', a: 1.4, f: 0.6 }, { type: 'rock', a: 5.3, f: 0.65 }] },
  { id: 2, name: 'Hollow of the Wind-folk', rarity: 'epic', cx: -18, cz: -7, y: -1, r: 4.2, ph: 4.0, seed: 37,
    story: ['Round huts with tall woven roofs stand empty, their doors open, as if everyone stepped out a moment ago.',
      'Carvings tell of the Wind-folk, a lost tribe who followed the winds from island to island, ringing a bell so the clouds would part for them.',
      'The bell still hangs over their gate.'],
    relic: { kind: 'bell', name: 'The Wind Bell', text: 'Its ring is a song the winds remember. Your sky has a new melody.' },
    secret: { a: 3.6, f: 0.6, bonus: 'totem', title: 'Faces in the wood',
      text: 'Faces carved one above another, each a little smaller: grandparents, parents, children. The smallest face is smiling.' },
    features: [{ type: 'bellgate', a: 0, f: 0 }, { type: 'hut', a: 0.9, f: 0.55 }, { type: 'hut', a: 2.2, f: 0.6 }, { type: 'hut', a: 4.9, f: 0.55 }, { type: 'totem', a: 3.0, f: 0.35 }] },
  { id: 3, name: 'Drift Meadow', rarity: 'normal', cx: 7, cz: 18, y: 0.8, r: 3.5, ph: 1.2, seed: 41,
    story: ['Wildflowers in every colour grow here with nobody to tend them.', 'A broken windmill still turns, slowly, whenever the wind remembers it.'],
    secret: { a: 4.0, f: 0.55, bonus: 'windmill', title: 'A sack of seeds',
      text: 'Under the windmill, a sack of seeds labelled in a tidy hand: "For whoever comes next."' },
    features: [{ type: 'brokenmill', a: 0, f: 0 }, { type: 'wildflowers', a: 1.0, f: 0.5 }, { type: 'wildflowers', a: 2.6, f: 0.55 }, { type: 'wildflowers', a: 5.2, f: 0.5 }, { type: 'rock', a: 3.4, f: 0.6 }] },
  { id: 4, name: 'Starfall Spire', rarity: 'legendary', cx: -13, cz: 19, y: 3, r: 4.6, ph: 5.1, seed: 53,
    story: ['White stone rises in rings around a spire taller than any tree.',
      'Here lived the Lumen Keepers, a forgotten people who lifted every island above the clouds, and hung a lamp in the sky so that no one would ever be lost at night.',
      'When they left, the lamp went quiet. It is still warm.'],
    relic: { kind: 'starlamp', name: 'The Star-lamp', text: 'You carry it home and light it. Tonight, the sky will remember its colours.' },
    secret: { a: 5.6, f: 0.62, bonus: 'arch', title: 'A map of everything',
      text: 'On the spire\'s lowest step: a map of every island, and many more beyond its edge. Abovea is bigger than anyone knows.' },
    features: [{ type: 'spire', a: 0, f: 0 }, { type: 'column', a: 0.5, f: 0.6 }, { type: 'column', a: 2.0, f: 0.62 }, { type: 'column', a: 3.6, f: 0.6 }, { type: 'column', a: 4.6, f: 0.62 }] },
];

/** Quests in order; each opens the next hidden island. */
const QUESTS = [
  { island: 1, pop: 'q1Pop', task: 'trees', n: 'q1Trees', taskText: n => `Plant ${n} trees`, sight: 'A shape in the mist, far out over the clouds...' },
  { island: 2, pop: 'q2Pop', task: 'lanterns', n: 'q2Lanterns', taskText: n => `Light ${n} lanterns`, sight: 'Far away, something rings faintly...' },
  { island: 3, pop: 'q3Pop', task: 'bridges', n: 'q3Bridges', taskText: n => n === 1 ? 'Build a bridge' : `Build ${n} bridges`, sight: 'Petals drift up from somewhere in the mist...' },
  { island: 4, pop: 'q4Pop', task: 'gardens', n: 'q4Gardens', taskText: n => `Grow ${n} gardens into bloom`, sight: 'High above, a pale light answers your lanterns...' },
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
