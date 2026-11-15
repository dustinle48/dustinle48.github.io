// PROTOTYPE - NOT FOR PRODUCTION
// Question: Does placing a few houses, watching families move in and grow, then discovering an island and its relic feel calm, magical and worth a 15-minute sitting?
// Date: 2026-11-14
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
window.CONFIG = {
  seed: 1, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },        // master volume
  musicVolume: { value: 0.55, min: 0, max: 1, step: 0.05 },  // music under the master
  sfxVolume: { value: 0.7, min: 0, max: 1, step: 0.05 },    // sounds under the master

  // Day and night
  dayLength: { value: 240, min: 60, max: 900, step: 10 },      // seconds for one full day
  startDayT: { value: 0.03, min: 0, max: 1, step: 0.01 },      // 0 dawn, 0.35 noon, 0.55 dusk, 0.8 night

  // Building and growing
  houseBuildTime: { value: 2.5, min: 0.5, max: 10, step: 0.5 }, // seconds a house takes to rise
  smallBuildTime: { value: 1.2, min: 0.2, max: 5, step: 0.1 },  // seconds for a lantern, bridge or decor piece
  treeGrowTime: { value: 22, min: 3, max: 120, step: 1 },       // seconds from sapling to full tree
  gardenGrowTime: { value: 26, min: 3, max: 120, step: 1 },     // seconds until a garden is in full bloom
  meadowGrowTime: { value: 30, min: 3, max: 120, step: 1 },     // seconds until a meadow is grown and a fluffkin comes
  rainGrowBoost: { value: 2, min: 1, max: 5, step: 0.25 },      // growth speed multiplier while it rains
  readyRange: { value: 2, min: 1, max: 4, step: 1 },            // cells: a home is ready with something green this close

  // Sky-folk
  moveInDelay: { value: 3, min: 0, max: 30, step: 0.5 },        // seconds a ready home waits before a couple comes
  arriveTime: { value: 3.5, min: 1, max: 10, step: 0.5 },       // seconds the cloud-puff takes to float down
  childTime: { value: 60, min: 10, max: 300, step: 5 },         // seconds after moving in (and between) until a child is born
  maxChildren: { value: 2, min: 0, max: 4, step: 1 },           // children a family can have
  petChance: { value: 0.6, min: 0, max: 1, step: 0.05 },        // chance a new family adopts a pet
  growUpTime: { value: 90, min: 10, max: 600, step: 5 },        // seconds until a child grows up
  marryDelay: { value: 6, min: 0, max: 60, step: 1 },           // seconds a ready home waits for a grown-up couple before strangers come
  folkSpeed: { value: 0.75, min: 0.2, max: 3, step: 0.05 },     // cells per second walking
  folkIdleMin: { value: 1.5, min: 0, max: 10, step: 0.5 },      // seconds standing still, at least
  folkIdleMax: { value: 5, min: 0.5, max: 20, step: 0.5 },      // seconds standing still, at most
  wanderRange: { value: 4, min: 1, max: 10, step: 1 },          // cells from home a sky-folk wanders

  // Unlocks, by population
  lanternUnlockPop: { value: 2, min: 0, max: 30, step: 1 },
  bridgeUnlockPop: { value: 6, min: 0, max: 30, step: 1 },
  meadowUnlockPop: { value: 8, min: 0, max: 30, step: 1 },
  schoolUnlockPop: { value: 10, min: 0, max: 40, step: 1 },     // sky-folk before the Magic School unlocks
  healerUnlockPop: { value: 14, min: 0, max: 40, step: 1 },     // sky-folk before the Healing House unlocks
  schoolGrowBoost: { value: 2, min: 1, max: 5, step: 0.25 },    // little ones grow up this many times faster while a Magic School stands
  healerChildBoost: { value: 1.6, min: 1, max: 4, step: 0.1 },  // little ones arrive this many times sooner while a Healing House stands
  utilityVisitChance: { value: 0.3, min: 0, max: 1, step: 0.05 }, // chance an idle sky-folk walks to the school (little ones) or healing house (grown-ups) on their island
  bridgeLightMin: { value: 6, min: 2, max: 30, step: 0.5 },     // bridges at least this long get lantern posts along the way
  bridgeLightGap: { value: 2.6, min: 1, max: 8, step: 0.2 },    // distance between a long bridge's lanterns

  // Quests that open the mist: a population and one small task each
  q1Pop: { value: 6, min: 1, max: 40, step: 1 },    q1Trees: { value: 3, min: 0, max: 10, step: 1 },
  q2Pop: { value: 10, min: 1, max: 40, step: 1 },   q2Lanterns: { value: 2, min: 0, max: 10, step: 1 },
  q3Pop: { value: 14, min: 1, max: 40, step: 1 },   q3Bridges: { value: 1, min: 0, max: 10, step: 1 },
  q4Pop: { value: 18, min: 1, max: 40, step: 1 },   q4Gardens: { value: 2, min: 0, max: 10, step: 1 },

  // The voyage through the mist
  voyageMotes: { value: 5, min: 1, max: 15, step: 1 },          // light-motes to catch to find the way
  voyageSpeed: { value: 9, min: 2, max: 25, step: 0.5 },        // forward speed, units per second
  voyageSteer: { value: 7, min: 2, max: 20, step: 0.5 },        // sideways speed, units per second
  voyageWidth: { value: 5, min: 2, max: 10, step: 0.5 },        // how far left or right the boat can go
  moteEvery: { value: 1.3, min: 0.3, max: 5, step: 0.1 },       // seconds between motes
  moteRadius: { value: 1.4, min: 0.5, max: 3, step: 0.1 },      // catch distance
  secretRadius: { value: 1.3, min: 0.5, max: 3, step: 0.1 },    // how close a tap must land to a shimmer

  // Weather (never harms anything)
  weatherFirst: { value: 140, min: 10, max: 900, step: 10 },    // seconds of clear sky before the first weather
  weatherEvery: { value: 150, min: 30, max: 900, step: 10 },    // seconds of clear sky between weathers
  weatherLength: { value: 40, min: 10, max: 300, step: 5 },     // seconds a weather lasts
  weatherFadeIn: { value: 6, min: 1, max: 30, step: 1 },        // seconds rain or snow takes to build up
  weatherFadeOut: { value: 16, min: 1, max: 60, step: 1 },      // seconds rain or snow takes to die away when the weather ends
  lakeChance: { value: 0.6, min: 0, max: 1, step: 0.05 },       // chance an island has a small lake (the home island always has one when there is room)
  smokeRate: { value: 1.4, min: 0.1, max: 5, step: 0.1 },       // smoke puffs a second from a lived-in chimney
  fishPerLake: { value: 2, min: 0, max: 6, step: 1 },           // glowfins gliding in each lake (and leaping now and then)
  frogsPerLake: { value: 2, min: 0, max: 6, step: 1 },          // lily frogs sitting on each lake's shore
  fishPerRiver: { value: 1, min: 0, max: 4, step: 1 },          // glowfins leaping upstream in each river
  rocksPerIsland: { value: 3, min: 0, max: 10, step: 1 },       // rocks scattered near each island's edge at the start (you can tidy them)
  grassWind: { value: 1, min: 0, max: 3, step: 0.1 },           // how much the grass sways
  wildPerIsland: { value: 2, min: 0, max: 6, step: 1 },         // wild fairy critters flying about each found island (one more on big islands)

  // The world: islands, mountains and rivers (a random sky uses the sizes and gaps)
  homeMountains: { value: 1, min: 0, max: 3, step: 1 },         // mountains always raised on the home island
  extraMountainChance: { value: 0.5, min: 0, max: 1, step: 0.05 }, // chance of one more mountain on an island big enough
  riverChance: { value: 0.6, min: 0, max: 1, step: 0.05 },      // chance a hidden island has a river (home always has one)
  islandScale: { value: 1.4, min: 0.6, max: 2, step: 0.05 },     // every island's size, default and random skies alike
  homeSizeMin: { value: 5.2, min: 4, max: 9, step: 0.1 },       // random sky: home island radius, at least
  homeSizeMax: { value: 6.8, min: 4, max: 10, step: 0.1 },      // random sky: home island radius, at most
  islandSizeMax: { value: 5, min: 3.5, max: 8, step: 0.1 },     // random sky: hidden island radius, at most
  islandGapMin: { value: 7, min: 3, max: 20, step: 0.5 },       // random sky: open sky between home and a hidden island, at least
  islandGapMax: { value: 12, min: 4, max: 30, step: 0.5 },      // random sky: and at most
  skyBridgeMax: { value: 36, min: 10, max: 80, step: 1 },       // longest bridge between two islands, in cells
  islandBob: { value: 0.35, min: 0, max: 1.5, step: 0.05 },     // how far an island drifts up and down, units
  islandBobSpeed: { value: 0.3, min: 0.05, max: 1.5, step: 0.05 }, // how fast it drifts, radians per second
  skyLowest: { value: -2, min: -6, max: 0, step: 0.5 },         // random sky: lowest resting height of a hidden island
  skyHighest: { value: 4, min: 0, max: 8, step: 0.5 },          // random sky: highest resting height
  crossChance: { value: 0.25, min: 0, max: 1, step: 0.05 },     // chance a resting sky-folk sets off over a bridge
  visitMin: { value: 15, min: 3, max: 120, step: 1 },           // seconds a visitor stays on another island, at least
  visitMax: { value: 40, min: 5, max: 240, step: 1 },           // and at most

  // Camera
  camZoomStart: { value: 19, min: 6, max: 45, step: 1 },
  camZoomMin: { value: 6, min: 3, max: 20, step: 1 },
  camZoomMax: { value: 45, min: 20, max: 90, step: 1 },
  camPanSpeed: { value: 12, min: 2, max: 40, step: 1 },         // keyboard pan, units per second
  camTurnSpeed: { value: 1.6, min: 0.2, max: 5, step: 0.1 },    // keyboard turn, radians per second
  postcardSpeed: { value: 0.05, min: 0.01, max: 0.3, step: 0.01 }, // postcard drift, radians per second
  // Look
  exposure: { value: 0.98, min: 0.5, max: 2, step: 0.05 },      // overall brightness after tone mapping
  bloom: { value: 0.45, min: 0, max: 2, step: 0.05 },           // glow around lanterns, windows, sun and motes (High graphics)
  bloomThreshold: { value: 0.95, min: 0.5, max: 1.5, step: 0.01 }, // only things brighter than this glow (clouds stay below it)
  tiltShift: { value: 3.5, min: 0, max: 10, step: 0.5 },        // miniature blur at the top and bottom of the view, pixels (High graphics)
  cloudsLow: { value: 70, min: 10, max: 160, step: 5 },         // clouds in the sea below
  cloudsMid: { value: 12, min: 0, max: 60, step: 1 },           // clouds drifting between the islands
  cloudSpeed: { value: 0.7, min: 0, max: 3, step: 0.05 },       // how fast clouds drift, units per second
  fogDensity: { value: 0.012, min: 0, max: 0.05, step: 0.001 },
};
