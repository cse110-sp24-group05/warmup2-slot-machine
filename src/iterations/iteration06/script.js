// ── Named constants ───────────────────────────────────────────────────────
const CELL_HEIGHT = 96;
const INITIAL_JACKPOT = 5000;
const STARTING_BALANCE = 1000;
const JACKPOT_CONTRIBUTION_RATE = 0.08;
const BONUS_WHEEL_INTERVAL = 10;
const HISTORY_DISPLAY_LIMIT = 8;
const MAX_CUSTOM_FUNDS = 10000000;
const JACKPOT_STORAGE_KEY = 'progressiveJackpot';

// ── RTP & Probability constants ──────────────────────────────────────────
// Theoretical RTP: 96.50% — calculated from the weighted symbol probabilities
// and the PAYOUT_TABLE multipliers below. See changes.md for full derivation.
const TARGET_RTP = 0.9650;

// ── Symbol definitions ─────────────────────────────────────────────────────
const SYMBOLS = [
  { sym: '\u{1F48E}', lbl: 'DIAMOND', rare: true },   // 0
  { sym: '\u{1F4B0}', lbl: 'MONEY', rare: true },   // 1
  { sym: '\u{1F916}', lbl: 'AGI', rare: true },   // 2
  { sym: '\u{1F9E0}', lbl: 'BRAIN', rare: false },  // 3
  { sym: '\u{1F52E}', lbl: 'ORACLE', rare: false },  // 4
  { sym: '\u{1F4BE}', lbl: 'STORAGE', rare: false },  // 5
  { sym: '\u26A1', lbl: 'POWER', rare: false },  // 6
  { sym: '\u{1FA99}', lbl: 'TOKEN', rare: false },  // 7
  { sym: '\u{1F4CA}', lbl: 'METRICS', rare: false },  // 8
  { sym: '\u{1F9EC}', lbl: 'DNA', rare: false },  // 9
  { sym: '\u{1F680}', lbl: 'ROCKET', rare: false },  // 10
  { sym: '\u{1F3AF}', lbl: 'TARGET', rare: false },  // 11
  { sym: '\u{1F0CF}', lbl: 'WILD', rare: true },   // 12 — substitutes for any regular symbol
  { sym: '\u2B50', lbl: 'SCATTER', rare: true },   // 13 — pays anywhere, 3 = free spins
  { sym: '\u{1F525}', lbl: 'MULTIPLIER', rare: true },   // 14 — 2× payout when in a win
];

// Weights: higher = more common. Rare symbols intentionally low.
// Special symbols (WILD, SCATTER, MULTIPLIER) are at weight 1 each.
// Total weight: 57  |  Theoretical RTP: 96.50%
const SYMBOL_WEIGHTS = [1, 2, 3, 5, 4, 6, 6, 6, 6, 5, 5, 5, 1, 1, 1];

// Labels that WILD can substitute for — everything except specials.
const WILD_SUBSTITUTES = ['DIAMOND', 'MONEY', 'AGI', 'BRAIN', 'ORACLE',
  'STORAGE', 'POWER', 'TOKEN', 'METRICS', 'DNA', 'ROCKET', 'TARGET'];

// Labels that are "special" and excluded from pair/triple checks when mixed
// with regular symbols.
const SPECIAL_LABELS = ['WILD', 'SCATTER', 'MULTIPLIER'];

// Number of free spins awarded when 3 scatters land.
const SCATTER_FREE_SPINS = 3;

// Pre-computed total weight — avoids recalculating on every spin.
const TOTAL_WEIGHT = SYMBOL_WEIGHTS.reduce(function (a, b) { return a + b; }, 0);

// ── Cryptographic RNG ─────────────────────────────────────────────────────
// Real slot machines use hardware RNG for tamper-proof randomness.
// crypto.getRandomValues is the browser equivalent — it draws from the OS
// entropy pool and is not predictable like Math.random's PRNG.

/**
 * Returns a cryptographically secure random float in [0, 1).
 * Falls back to Math.random if crypto API is unavailable.
 * @returns {number} Random float between 0 (inclusive) and 1 (exclusive)
 */
function secureRandom() {
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / (0xFFFFFFFF + 1);
  } catch (e) {
    console.warn('crypto.getRandomValues unavailable, falling back to Math.random:', e);
    return Math.random();
  }
}

// STRIP mirrors SYMBOL_WEIGHTS so the spinning animation shows symbols at the
// same frequency as real results — rare symbols appear rarely in the strip too.
// Shuffled once at load so common symbols don't clump together visually.
// Uses secureRandom for the Fisher-Yates shuffle.
const STRIP = (function () {
  const s = [];
  for (let i = 0; i < SYMBOLS.length; i++) {
    for (let j = 0; j < SYMBOL_WEIGHTS[i]; j++) s.push(SYMBOLS[i]);
  }
  for (let k = s.length - 1; k > 0; k--) {
    const r = Math.floor(secureRandom() * (k + 1));
    const tmp = s[k]; s[k] = s[r]; s[r] = tmp;
  }
  return s;
})();

// For each symbol index, the STRIP positions containing it — used so animateReel
// can land on a cell that actually shows the chosen symbol.
const STRIP_POSITIONS = (function () {
  const map = [];
  for (let i = 0; i < SYMBOLS.length; i++) map.push([]);
  for (let p = 0; p < STRIP.length; p++) {
    map[SYMBOLS.indexOf(STRIP[p])].push(p);
  }
  return map;
})();

/**
 * Selects a random symbol index using weighted probability and the
 * cryptographic RNG. Each symbol's chance equals its weight divided by
 * TOTAL_WEIGHT.
 *
 * Individual symbol probabilities:
 *   DIAMOND: 1/54 = 1.85%    MONEY: 2/54 = 3.70%    AGI: 3/54 = 5.56%
 *   BRAIN:   5/54 = 9.26%    ORACLE: 4/54 = 7.41%   STORAGE: 6/54 = 11.11%
 *   POWER:   6/54 = 11.11%   TOKEN: 6/54 = 11.11%   METRICS: 6/54 = 11.11%
 *   DNA:     5/54 = 9.26%    ROCKET: 5/54 = 9.26%   TARGET: 5/54 = 9.26%
 *
 * @returns {number} Index into the SYMBOLS array
 */
function weightedSymbol() {
  let r = secureRandom() * TOTAL_WEIGHT;
  for (let i = 0; i < SYMBOL_WEIGHTS.length; i++) {
    r -= SYMBOL_WEIGHTS[i];
    if (r <= 0) return i;
  }
  return SYMBOL_WEIGHTS.length - 1;
}

/**
 * Picks a random STRIP index whose cell displays the given symbol.
 * Uses secureRandom for position selection.
 * @param {number} symIdx - Index into SYMBOLS
 * @returns {number} A STRIP position containing SYMBOLS[symIdx]
 */
function stripPositionFor(symIdx) {
  const positions = STRIP_POSITIONS[symIdx];
  return positions[Math.floor(secureRandom() * positions.length)];
}

// ── Flavor text ────────────────────────────────────────────────────────────
const MSGS = {
  lose: [
    'Tokens burned. The model learned absolutely nothing.',
    'Context window: empty. Wallet: also empty.',
    'That spin cost more than a GPT-4 API call.',
    'Your tokens confidently hallucinated a loss.',
    'Inference complete. Result: financially deprecated.',
    'The attention mechanism paid no attention to your luck.',
    'Loss function minimized \u2014 specifically, your balance.',
    'No match. Sam Altman thanks you personally.',
    'Tokens: gone. AGI: still not here. Classic.',
    'The model predicted wrong with 99% confidence.',
    'Backpropagation found nothing worth propagating.',
    'Zero-shot prediction: you lose. As always.',
    'The CUDA cores were never rooting for you.',
    'Gradient descent converged on your empty wallet.',
    'Weights updated. Your stack did not survive the update.',
    'Training data did not include \u201Cwinning.\u201D Sorry.',
    'Stochastic sampling. You drew the short token.',
    'The embeddings tried. The embeddings failed.',
    'Reinforcement learned: do not give you money.',
  ],
  pair: [
    'Two of a kind. Half survived the inference pass.',
    'Partial match. The model hedged, as models do.',
    'Almost aligned. Half back \u2014 the GPU felt charitable.',
    'Two tokens matched. The universe partially acknowledges you.',
    'A consolation payout from the probability gods.',
    'Technically a win. Do not get comfortable.',
    'Stochastic gradient descent split the difference.',
  ],
  win: [
    'Embeddings aligned! Tokens acquired.',
    'Positive reward signal detected! RLHF approved this outcome.',
    'The transformer saw this coming. (It absolutely did not.)',
    'You out-prompted the house. Barely. For now.',
    'Statistically improbable. Enjoy it while it lasts.',
    'A rare moment of favorable stochasticity.',
    'The GPU blessed this spin. Do not ask why.',
    'Convergence achieved. Your balance agrees.',
    'Three of a kind. The loss function malfunctioned briefly.',
  ],
  bigwin: [
    'MASSIVE WIN. The vault doors swing open!',
    'Cash overflow detected. Stack trace: enormous.',
    'Your balance.exe crashed \u2014 from excess profit.',
    'The tokenomics aligned in your favor. Very suspicious.',
    'The expected value just became extremely expected.',
    'The house is filing a formal complaint.',
    'Temperature set to MAX. Money raining from tensors.',
  ],
  jackpot: [
    '\u{1F48E} DIAMOND JACKPOT! The model is genuinely surprised.',
    '\u{1F48E} MAXIMUM SPARKLE. Balance: overflowing the context window.',
    '\u{1F48E} Three diamonds! The house weeps in CUDA.',
    '\u{1F48E} You shattered the embedding space. With diamonds.',
    '\u{1F48E} Temperature set to infinity. You won everything.',
    '\u{1F48E} Jackpot achieved. The AI has no explanation for this.',
    '\u{1F48E} SINGULARITY DETECTED \u2014 in your bank account.',
  ],
  nearmiss: [
    'SO close. The model deliberately stopped one short.',
    'Two high-value symbols walked into a bar. The third called an Uber.',
    'Almost a jackpot. The GPU had second thoughts.',
    'Your luck was 66.7% there. Statistically impressive, financially devastating.',
    'Near miss detected. Running post-mortem... cause: entropy.',
    'The model saw your potential. Then it reconsidered.',
    'Two matching! The third symbol was in another dimension.',
    'Almost. The attention heads looked away at the last second.',
    'The system taunts you with near-optimality. Classic RL trick.',
  ],
  agi_triple: [
    '\u{1F916} AGI ACHIEVED. And it immediately took your tokens.',
    '\u{1F916} THREE ROBOTS. The singularity pays 25x.',
    '\u{1F916} AGI AGI AGI \u2014 the model bootstrapped itself to wealth.',
    '\u{1F916} The robots aligned. For once, in your favor.',
  ],
  oracle: [
    '\u{1F52E} TRIPLE ORACLE. It predicted this outcome all along.',
    '\u{1F52E} Oracle vision activates. The future: more tokens.',
    '\u{1F52E} The oracle gazed into the void. The void paid out.',
  ],
  brain: [
    '\u{1F9E0} NEURAL OVERFLOW! Too many synapses firing.',
    '\u{1F9E0} Three brains, zero common sense, all profit.',
    '\u{1F9E0} The cortex aligned. Your balance grew.',
  ],
  singularity: [
    '\u{1F48E}\u{1F4B0}\u{1F916} SINGULARITY COMBO! Diamond, Money, AGI \u2014 everything converged.',
    'The trifecta of AI dominance. Your tokens multiply.',
    'Diamond meets money meets robot. The inevitable outcome.',
  ],
  trinity: [
    '\u{1F48E}\u{1F916}\u{1F9E0} AI TRINITY! Diamond, Robot, Brain in perfect alignment.',
    'The holy trio of AI: hardware, intelligence, cognition.',
    'Trinity achieved. The model bows to your luck.',
  ],
  computestack: [
    '\u{1F916}\u{1F4BE}\u26A1 COMPUTE STACK! AGI runs on storage and power.',
    'The infrastructure combo pays off. Servers: grateful.',
    'Robot plus disk plus lightning. Classic datacenter jackpot.',
  ],
  neuralnet: [
    '\u{1F9E0}\u{1F52E}\u{1F9EC} NEURAL NET! Brain, Oracle, DNA \u2014 evolution rewarded.',
    'The biological AI stack: neurons, foresight, genetics.',
    'Nature and machine in alignment. Tokens: yours.',
  ],
  hyperdrive: [
    '\u{1F680}\u26A1\u{1F3AF} HYPER DRIVE! Rocket, Power, Target \u2014 locked on.',
    'Ignition sequence complete. Your wallet lifts off.',
    'The trajectory was always winning. Physics says so.',
  ],
  scatter: [
    '\u2B50 SCATTER! Stars align regardless of position.',
    '\u2B50 Scatter symbols detected! The cosmos pays out.',
    '\u2B50 Stars everywhere! The reels bow to chaos theory.',
    '\u2B50 Scatter wins are independent. Like your gambling decisions should be.',
  ],
  wild: [
    '\u{1F0CF} WILD card! The joker substituted in your favor.',
    '\u{1F0CF} Wild symbol became exactly what you needed.',
    '\u{1F0CF} The wild card shape-shifted into profit.',
    '\u{1F0CF} A wild appeared! It chose violence against the house.',
  ],
  multiplier: [
    '\u{1F525} MULTIPLIER! Double the win, double the dopamine.',
    '\u{1F525} The fire symbol ignited your payout. 2\u00D7!',
    '\u{1F525} Multiplier activated! The math got aggressive.',
    '\u{1F525} 2\u00D7 BOOST! The payout function went nonlinear.',
  ],
  freespins: [
    '\u2B50\u2B50\u2B50 THREE SCATTERS! Free spins unlocked!',
    '\u2B50 SCATTER TRIFECTA! The house gives you free rounds.',
    '\u2B50 Triple scatter! The algorithm felt generous.',
  ],
};

// Plain-text speech versions (no HTML entities)
const SPEECH = {
  lose: [
    'Tokens burned. The model learned nothing.',
    'Context window empty. Wallet also empty.',
    'Zero-shot prediction: you lose. As always.',
    'The CUDA cores were never rooting for you.',
    'Gradient descent converged on your empty wallet.',
    'Training data did not include winning. Sorry.',
    'Inference complete. Result: financially deprecated.',
  ],
  pair: [
    'Partial match. The model hedged, as models do.',
    'Technically a win. Do not get comfortable.',
    'Half back. The GPU felt charitable.',
  ],
  win: [
    'Embeddings aligned! Tokens acquired.',
    'Positive reward signal detected!',
    'You out-prompted the house. Barely.',
    'A rare moment of favorable stochasticity.',
  ],
  bigwin: [
    'Massive win! The vault doors swing open!',
    'Cash overflow detected. Stack trace: enormous.',
    'The tokenomics aligned in your favor. Very suspicious.',
  ],
  jackpot: [
    'Diamond jackpot! The model is genuinely surprised.',
    'Maximum sparkle! Balance overflowing the context window.',
    'Three diamonds! The house weeps in CUDA.',
    'Jackpot achieved. The AI has no explanation for this.',
  ],
  nearmiss: [
    'So close. The model deliberately stopped one short.',
    'Two matching symbols walked into a bar. The third called an Uber.',
    'Almost a jackpot. The GPU had second thoughts.',
    'Your luck was 66 point 7 percent there. Financially devastating.',
    'Near miss detected. Cause of death: entropy.',
  ],
  scatter: [
    'Scatter symbols! Stars pay regardless of position.',
    'Scatter detected! The cosmos smiles on you.',
    'Stars aligned! Literally.',
  ],
  wild: [
    'Wild card! The joker substituted in your favor.',
    'A wild appeared! And it chose to help you.',
    'The wild card shape-shifted into profit.',
  ],
  multiplier: [
    'Multiplier! Double the payout!',
    'The fire symbol ignited your win. Two times!',
    'Multiplier activated! Math got aggressive.',
  ],
  freespins: [
    'Three scatters! Free spins unlocked!',
    'Scatter trifecta! Free rounds on the house.',
    'Triple scatter! The algorithm felt generous.',
  ],
};

// ── Themes ─────────────────────────────────────────────────────────────────
const THEMES = {
  purple: { accent: '#a78bfa', accent2: '#f472b6', bg: '#07070d', surface: '#11111a', surface2: '#1a1a26', rgb: '167,139,250' },
  gold: { accent: '#fbbf24', accent2: '#f59e0b', bg: '#0a0800', surface: '#17130a', surface2: '#21190d', rgb: '251,191,36' },
  green: { accent: '#4ade80', accent2: '#22c55e', bg: '#050d07', surface: '#0c1810', surface2: '#112115', rgb: '74,222,128' },
  red: { accent: '#f87171', accent2: '#ef4444', bg: '#0d0505', surface: '#190d0d', surface2: '#221212', rgb: '248,113,113' },
  cyan: { accent: '#38bdf8', accent2: '#06b6d4', bg: '#05090d', surface: '#0d1318', surface2: '#121c24', rgb: '56,189,248' },
};

let currentTheme = 'purple';

/**
 * Applies a color theme to the page by updating CSS custom properties.
 * @param {string} name - Theme key from the THEMES object
 * @returns {void}
 */
function setTheme(name) {
  const t = THEMES[name];
  if (!t) return;
  const root = document.documentElement;
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent2', t.accent2);
  root.style.setProperty('--bg', t.bg);
  root.style.setProperty('--surface', t.surface);
  root.style.setProperty('--surface2', t.surface2);
  currentTheme = name;
  document.querySelectorAll('.theme-swatch').forEach(function (s) {
    s.classList.toggle('active', s.dataset.theme === name);
  });
  playSound('click');
}

// ── Game state (Smell #6) ────────────────────────────────────────────────
// All mutable game state is encapsulated in a single object so state
// transitions are easier to reason about, log, and eventually test.
const STATE = {
  balance: STARTING_BALANCE,
  totalWon: 0,
  totalBurned: 0,
  spinCount: 0,
  spinning: false,
  leverActive: false,
  progressiveJackpot: INITIAL_JACKPOT,
  freeSpin: false,
  speechEnabled: true,
  spinHistory: [],

  // RTP tracking — accumulates total wagered vs total returned to compute
  // the session's actual RTP. Updated every spin in the main spin() function.
  totalWagered: 0,
  totalReturned: 0,

  // Free spin bank — scatter awards stack here; one is consumed per spin.
  freeSpinBank: 0,
};

// ── Utilities ─────────────────────────────────────────────────────────────

/**
 * Forces a browser reflow on an element by reading its offsetWidth.
 * This is the standard technique for restarting a CSS animation: remove the
 * animation class, force a reflow so the browser registers the removal, then
 * re-add the class. Without the reflow the browser batches both operations
 * into the same frame and the animation never restarts.
 * @param {HTMLElement} el - The element to force reflow on
 * @returns {void}
 */
function forceReflow(el) {
  void el.offsetWidth;
}

/**
 * Returns a random element from an array.
 * @param {Array} arr - Source array
 * @returns {*} A random element
 */
function rnd(arr) { return arr[Math.floor(secureRandom() * arr.length)]; }

// ── Audio engine ───────────────────────────────────────────────────────────
let audioCtx = null;

/**
 * Gets or creates the shared AudioContext, resuming it if suspended.
 * @returns {AudioContext|null} The audio context, or null if unavailable
 */
function getCtx() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext init failed:', e);
    return null;
  }
}

/**
 * Plays a single oscillator tone.
 * @param {number} freq - Frequency in Hz
 * @param {number} startOffset - Delay in seconds from now
 * @param {number} duration - Duration in seconds
 * @param {number} [gain=0.28] - Volume (0-1)
 * @param {string} [type='sine'] - Oscillator waveform type
 * @returns {void}
 */
function playNote(freq, startOffset, duration, gain, type) {
  gain = gain !== undefined ? gain : 0.28;
  type = type || 'sine';
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
  vol.gain.setValueAtTime(gain, ctx.currentTime + startOffset);
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration + 0.05);
}

/**
 * Plays white noise for a given duration.
 * @param {number} startOffset - Delay in seconds from now
 * @param {number} duration - Duration in seconds
 * @param {number} [gain=0.1] - Volume (0-1)
 * @returns {void}
 */
function playNoise(startOffset, duration, gain) {
  gain = gain !== undefined ? gain : 0.1;
  const ctx = getCtx();
  if (!ctx) return;
  const bufLen = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const vol = ctx.createGain();
  src.connect(vol);
  vol.connect(ctx.destination);
  vol.gain.setValueAtTime(gain, ctx.currentTime + startOffset);
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
  src.start(ctx.currentTime + startOffset);
  src.stop(ctx.currentTime + startOffset + duration + 0.01);
}

/** @returns {void} */
function soundClick() { playNote(900, 0, 0.055, 0.10, 'sine'); }

/** @returns {void} */
function soundBetChange() { playNote(700, 0, 0.045, 0.07, 'sine'); }

/** @returns {void} */
function soundLeverPull() {
  playNoise(0, 0.05, 0.14);
  playNote(180, 0, 0.09, 0.22, 'sawtooth');
  playNote(140, 0.07, 0.14, 0.18, 'sawtooth');
}

/** @returns {void} */
function soundLeverRelease() {
  playNoise(0, 0.03, 0.07);
  playNote(480, 0, 0.04, 0.14, 'square');
  playNote(660, 0.04, 0.03, 0.09, 'square');
}

/**
 * Plays a coin-add sound effect scaled to the amount.
 * @param {number} amount - Token amount added (affects note count)
 * @returns {void}
 */
function soundCoinAdd(amount) {
  const count = Math.min(6, Math.floor(Math.log10(Math.max(amount, 1))) + 2);
  const freqs = [880, 1047, 1319, 1047, 1174, 1397];
  for (let i = 0; i < count; i++) playNote(freqs[i], i * 0.07, 0.10, 0.16, 'sine');
  playNoise(0, 0.04, 0.05);
}

/** @returns {void} */
function soundSpinStart() {
  playNote(300, 0, 0.07, 0.16, 'sawtooth');
  playNote(260, 0.06, 0.07, 0.10, 'sawtooth');
}

/** @returns {void} */
function soundTick() { playNote(900, 0, 0.022, 0.035, 'square'); }

/** @returns {void} */
function soundLose() {
  playNote(280, 0, 0.18, 0.28, 'sawtooth');
  playNote(175, 0.18, 0.32, 0.28, 'sawtooth');
}

/** @returns {void} */
function soundPair() {
  playNote(440, 0, 0.12, 0.20, 'sine');
  playNote(554, 0.14, 0.18, 0.20, 'sine');
}

/** @returns {void} */
function soundWin() {
  playNote(523, 0, 0.10, 0.26, 'sine');
  playNote(659, 0.11, 0.10, 0.26, 'sine');
  playNote(784, 0.22, 0.22, 0.28, 'sine');
}

/** @returns {void} */
function soundBigWin() {
  playNote(523, 0, 0.10, 0.28, 'sine');
  playNote(659, 0.11, 0.10, 0.28, 'sine');
  playNote(784, 0.22, 0.10, 0.28, 'sine');
  playNote(1047, 0.33, 0.38, 0.32, 'sine');
}

/** @returns {void} */
function soundJackpot() {
  const melody = [523, 659, 784, 1047, 784, 1047, 1319];
  melody.forEach(function (freq, i) { playNote(freq, i * 0.13, 0.18, 0.30, 'sine'); });
  playNote(130, 0, 0.5, 0.22, 'triangle');
}

/** @returns {void} */
function soundNearMiss() {
  playNote(440, 0, 0.06, 0.20, 'sine');
  playNote(330, 0.06, 0.06, 0.20, 'sine');
  playNote(220, 0.14, 0.22, 0.22, 'sawtooth');
}

/** @returns {void} */
function soundReset() {
  playNote(440, 0, 0.10, 0.18, 'sine');
  playNote(330, 0.12, 0.10, 0.18, 'sine');
  playNote(220, 0.24, 0.20, 0.18, 'sine');
}

/** @returns {void} */
function soundBroke() {
  playNote(220, 0, 0.30, 0.28, 'sawtooth');
  playNote(110, 0.28, 0.50, 0.28, 'sawtooth');
}

/** @returns {void} */
function soundWheelTick() { playNote(600, 0, 0.03, 0.12, 'square'); }

/** @returns {void} */
function soundWheelStop() {
  playNote(880, 0, 0.08, 0.25, 'sine');
  playNote(1047, 0.09, 0.12, 0.25, 'sine');
  playNote(1319, 0.22, 0.30, 0.28, 'sine');
}

/**
 * Plays a shimmering wild-card sound.
 * @returns {void}
 */
function soundWild() {
  playNote(660, 0, 0.08, 0.22, 'sine');
  playNote(880, 0.06, 0.08, 0.22, 'sine');
  playNote(1100, 0.12, 0.08, 0.22, 'sine');
  playNote(1320, 0.18, 0.15, 0.26, 'sine');
}

/**
 * Plays a sparkling scatter sound.
 * @returns {void}
 */
function soundScatter() {
  playNote(1047, 0, 0.06, 0.20, 'sine');
  playNote(1319, 0.07, 0.06, 0.20, 'sine');
  playNote(1568, 0.14, 0.12, 0.24, 'sine');
  playNoise(0, 0.08, 0.06);
}

/**
 * Plays a fiery multiplier activation sound.
 * @returns {void}
 */
function soundMultiplier() {
  playNote(220, 0, 0.10, 0.24, 'sawtooth');
  playNote(440, 0.08, 0.10, 0.26, 'sawtooth');
  playNote(880, 0.16, 0.18, 0.28, 'sine');
  playNoise(0, 0.06, 0.10);
}

/**
 * Plays a celebratory free-spins-awarded sound.
 * @returns {void}
 */
function soundFreeSpins() {
  const melody = [523, 659, 784, 1047, 1319, 1568];
  melody.forEach(function (freq, i) { playNote(freq, i * 0.10, 0.14, 0.26, 'sine'); });
  playNoise(0.3, 0.08, 0.08);
}

// ── Sound wrapper (Smell #13) ─────────────────────────────────────────────
// Maps logical sound names to their implementing functions so callers don't
// need individual try/catch blocks.  All audio errors are logged to console.
const SOUND_MAP = {
  click: soundClick,
  betChange: soundBetChange,
  leverPull: soundLeverPull,
  leverRelease: soundLeverRelease,
  coinAdd: soundCoinAdd,
  spinStart: soundSpinStart,
  tick: soundTick,
  lose: soundLose,
  pair: soundPair,
  win: soundWin,
  bigWin: soundBigWin,
  jackpot: soundJackpot,
  nearMiss: soundNearMiss,
  reset: soundReset,
  broke: soundBroke,
  wheelTick: soundWheelTick,
  wheelStop: soundWheelStop,
  wild: soundWild,
  scatter: soundScatter,
  multiplier: soundMultiplier,
  freeSpins: soundFreeSpins,
};

/**
 * Plays a named sound effect.  Catches and logs any audio errors so callers
 * don't need their own try/catch.
 * @param {string} name - Key from SOUND_MAP
 * @param {...*} args - Extra arguments forwarded to the sound function
 * @returns {void}
 */
function playSound(name) {
  try {
    const fn = SOUND_MAP[name];
    if (fn) fn.apply(null, Array.prototype.slice.call(arguments, 1));
  } catch (e) {
    console.warn(`Sound "${name}" failed:`, e);
  }
}

// ── Speech Synthesis (Smell #13) ──────────────────────────────────────────
let speechVoice = null;

/**
 * Initializes the speech synthesis system and selects an English voice.
 * @returns {void}
 */
function initSpeech() {
  if (!window.speechSynthesis) return;
  function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    speechVoice = voices.find(function (v) { return v.lang.startsWith('en'); }) || voices[0] || null;
  }
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined)
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Speaks text aloud using the Web Speech API.  Checks the speechEnabled flag
 * and catches errors internally so callers don't need try/catch.
 * @param {string} text - The text to speak
 * @returns {void}
 */
function speak(text) {
  if (!STATE.speechEnabled || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (speechVoice) utt.voice = speechVoice;
    utt.rate = 0.92;
    utt.pitch = 1.05;
    utt.volume = 0.85;
    window.speechSynthesis.speak(utt);
  } catch (e) {
    console.warn('Speech synthesis failed:', e);
  }
}

/**
 * Toggles the speech synthesis on/off and updates the button state.
 * @returns {void}
 */
function toggleSpeech() {
  STATE.speechEnabled = !STATE.speechEnabled;
  const btn = document.getElementById('speech-toggle');
  if (STATE.speechEnabled) {
    btn.classList.add('active');
    btn.innerHTML = '\u{1F50A} AI Voice';
    speak('AI voice enabled. How delightful.');
  } else {
    btn.classList.remove('active');
    btn.innerHTML = '\u{1F507} AI Voice';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  playSound('click');
}

// ── Background canvas ──────────────────────────────────────────────────────
const bgCanvas = document.getElementById('bg');
const bgCtx = bgCanvas.getContext('2d');
let bgNodes = [];

const NODE_COUNT = 30;
const CONNECT_DIST = 155;

/**
 * Creates a background node with random position, velocity, and visual properties.
 * @constructor
 */
function BgNode() {
  this.x = Math.random() * bgCanvas.width;
  this.y = Math.random() * bgCanvas.height;
  this.vx = (Math.random() - 0.5) * 0.22;
  this.vy = (Math.random() - 0.5) * 0.22;
  this.r = Math.random() * 1.4 + 0.6;
  this.phase = Math.random() * Math.PI * 2;
}

/**
 * Updates the node position and wraps at canvas edges.
 * @returns {void}
 */
BgNode.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  this.phase += 0.014;
  if (this.x < -20) this.x = bgCanvas.width + 20;
  if (this.x > bgCanvas.width + 20) this.x = -20;
  if (this.y < -20) this.y = bgCanvas.height + 20;
  if (this.y > bgCanvas.height + 20) this.y = -20;
};

/**
 * Resizes the background and confetti canvases to fill the viewport.
 * @returns {void}
 */
function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  const cc = document.getElementById('confetti-canvas');
  cc.width = window.innerWidth;
  cc.height = window.innerHeight;
}

/**
 * Populates the bgNodes array with fresh BgNode instances.
 * @returns {void}
 */
function initBgNodes() {
  bgNodes = [];
  for (let i = 0; i < NODE_COUNT; i++) bgNodes.push(new BgNode());
}

/**
 * Renders one frame of the animated background network and schedules the next.
 * @returns {void}
 */
function drawBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  const rgb = THEMES[currentTheme].rgb;
  let i, j, dx, dy, dist, alpha;

  for (i = 0; i < bgNodes.length; i++) {
    for (j = i + 1; j < bgNodes.length; j++) {
      dx = bgNodes[i].x - bgNodes[j].x;
      dy = bgNodes[i].y - bgNodes[j].y;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECT_DIST) {
        alpha = (1 - dist / CONNECT_DIST) * 0.055;
        bgCtx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        bgCtx.lineWidth = 0.5;
        bgCtx.beginPath();
        bgCtx.moveTo(bgNodes[i].x, bgNodes[i].y);
        bgCtx.lineTo(bgNodes[j].x, bgNodes[j].y);
        bgCtx.stroke();
      }
    }
  }

  bgNodes.forEach(function (n) {
    alpha = 0.09 + Math.sin(n.phase) * 0.04;
    bgCtx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
    bgCtx.beginPath();
    bgCtx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    bgCtx.fill();
    n.update();
  });

  requestAnimationFrame(drawBg);
}

window.addEventListener('resize', resizeBg);
resizeBg();
initBgNodes();
drawBg();

// ── Confetti system ────────────────────────────────────────────────────────
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiRunning = false;

/**
 * Creates confetti particles that fall from the top of the screen.
 * @param {number} count - Number of confetti particles to spawn
 * @returns {void}
 */
function spawnConfetti(count) {
  confettiParticles = [];
  const colors = ['#fbbf24', '#a78bfa', '#f472b6', '#4ade80', '#60a5fa', '#f87171', '#34d399', '#fff'];
  for (let i = 0; i < count; i++) {
    const col = colors[Math.floor(Math.random() * colors.length)];
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: -10 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 3.5 + 1.5,
      color: col,
      size: Math.random() * 9 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.18,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      wobble: Math.random() * Math.PI * 2,
      life: 1.0,
    });
  }
  if (!confettiRunning) animateConfetti();
}

/**
 * Animation loop for confetti particles, running until all have fallen off-screen.
 * @returns {void}
 */
function animateConfetti() {
  confettiRunning = true;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  let alive = false;

  confettiParticles.forEach(function (p) {
    p.x += p.vx + Math.sin(p.wobble) * 0.8;
    p.y += p.vy;
    p.vy += 0.07;
    p.rotation += p.rotSpeed;
    p.wobble += 0.06;
    if (p.y < confettiCanvas.height + 30) { alive = true; }
    const a = Math.max(0, Math.min(1, 1 - (p.y / confettiCanvas.height)));

    confettiCtx.save();
    confettiCtx.globalAlpha = a * 0.9;
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation);
    confettiCtx.fillStyle = p.color;
    if (p.shape === 'rect') {
      confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      confettiCtx.fill();
    }
    confettiCtx.restore();
  });

  if (alive) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiRunning = false;
  }
}

// ── Screen flash ───────────────────────────────────────────────────────────
/**
 * Flashes the screen overlay with a color that fades out.
 * @param {string} color - CSS color string for the flash
 * @param {number} [fadeMs=600] - Fade-out duration in milliseconds
 * @returns {void}
 */
function screenFlash(color, fadeMs) {
  const el = document.getElementById('screen-flash');
  el.style.background = color;
  el.style.transition = 'opacity 0s';
  el.style.opacity = '0.35';
  setTimeout(function () {
    el.style.transition = `opacity ${fadeMs || 600}ms ease`;
    el.style.opacity = '0';
  }, 60);
}

// ── Coin rain from top ─────────────────────────────────────────────────────
/**
 * Spawns coin emoji elements that rain from the top of the viewport.
 * @param {number} count - Number of coins to spawn
 * @returns {void}
 */
function spawnCoinRain(count) {
  for (let i = 0; i < count; i++) {
    (function (idx) {
      setTimeout(function () {
        const el = document.createElement('div');
        el.className = 'coin-rain';
        el.textContent = String.fromCodePoint(0x1FA99);
        el.style.left = `${Math.random() * 98}vw`;
        el.style.fontSize = `${14 + Math.random() * 18}px`;
        el.style.animationDuration = `${0.9 + Math.random() * 0.9}s`;
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 2200);
      }, idx * 55);
    })(i);
  }
}

// ── Existing coin-fly particles (burst near balance) ──────────────────────
/**
 * Spawns coin particles that burst upward from the balance display.
 * @param {number} amount - Token amount (affects particle count)
 * @returns {void}
 */
function spawnCoins(amount) {
  const count = Math.min(8, Math.floor(Math.log10(Math.max(amount, 1))) + 3);
  const balEl = document.getElementById('balance');
  const rect = balEl.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    (function (idx) {
      const el = document.createElement('div');
      el.className = 'coin-particle';
      el.textContent = String.fromCodePoint(0x1FA99);
      el.style.left = `${rect.left + Math.random() * rect.width}px`;
      el.style.top = `${rect.top + rect.height / 2}px`;
      el.style.animationDelay = `${idx * 0.065}s`;
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 1100 + idx * 70);
    })(i);
  }
}

// ── Progressive jackpot ────────────────────────────────────────────────────

/**
 * Loads the progressive jackpot value from localStorage.
 * Falls back to INITIAL_JACKPOT if no saved value exists or if the
 * stored value is invalid.
 * @returns {number} The loaded jackpot value
 */
function loadProgressiveJackpot() {
  try {
    const stored = localStorage.getItem(JACKPOT_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed) && parsed >= INITIAL_JACKPOT) return parsed;
    }
  } catch (e) {
    console.warn('localStorage read failed:', e);
  }
  return INITIAL_JACKPOT;
}

/**
 * Saves the current progressive jackpot value to localStorage.
 * @returns {void}
 */
function saveProgressiveJackpot() {
  try {
    localStorage.setItem(JACKPOT_STORAGE_KEY, String(STATE.progressiveJackpot));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

/**
 * Increases the progressive jackpot by a delta and animates the display.
 * Persists the updated value to localStorage.
 * @param {number} delta - Amount to add to the jackpot pool
 * @returns {void}
 */
function updateProgressiveJackpot(delta) {
  STATE.progressiveJackpot += delta;
  const el = document.getElementById('pj-amount');
  el.textContent = STATE.progressiveJackpot.toLocaleString();
  el.classList.remove('pj-pop');
  forceReflow(el);
  el.classList.add('pj-pop');
  setTimeout(function () { el.classList.remove('pj-pop'); }, 500);
  saveProgressiveJackpot();
}

/**
 * Resets the progressive jackpot to its initial value, updates the display,
 * and clears the persisted value from localStorage.
 * @returns {void}
 */
function resetProgressiveJackpot() {
  STATE.progressiveJackpot = INITIAL_JACKPOT;
  document.getElementById('pj-amount').textContent = STATE.progressiveJackpot.toLocaleString();
  try {
    localStorage.removeItem(JACKPOT_STORAGE_KEY);
  } catch (e) {
    console.warn('localStorage remove failed:', e);
  }
}

// ── Add Funds ──────────────────────────────────────────────────────────────
/**
 * Adds tokens to the balance with sound and visual feedback.
 * @param {number} amount - Number of tokens to add
 * @returns {void}
 */
function addFunds(amount) {
  STATE.balance += amount;
  updateUI();
  playSound('coinAdd', amount);
  spawnCoins(amount);

  const balEl = document.getElementById('balance');
  balEl.classList.remove('balance-pop');
  forceReflow(balEl);
  balEl.classList.add('balance-pop');
  setTimeout(function () { balEl.classList.remove('balance-pop'); }, 600);

  setMsg(`+${amount.toLocaleString()} tokens injected. The house is uneasy.`, '');

  // Funds added — bet is still valid; clear any prior auto-adjust notice and
  // re-enable spin if the player was broke.
  clearBetAdjustNotice();
  updateSpinAvailability();
}

/**
 * Opens the custom funds modal and focuses the input field.
 * @returns {void}
 */
function openFundsModal() {
  document.getElementById('funds-modal').classList.add('show');
  clearCustomFundsError();
  setTimeout(function () {
    const inp = document.getElementById('custom-amount');
    inp.value = '';
    inp.focus();
  }, 60);
}

/**
 * Closes the funds modal.
 * @returns {void}
 */
function closeFundsModal() {
  document.getElementById('funds-modal').classList.remove('show');
  clearCustomFundsError();
}

/**
 * Adds a specified amount of funds and closes the modal.
 * @param {number} amount - Number of tokens to add
 * @returns {void}
 */
function addFundsAndClose(amount) {
  addFunds(amount);
  closeFundsModal();
}

/**
 * Clears the custom funds error message in the modal.
 * @returns {void}
 */
function clearCustomFundsError() {
  const el = document.getElementById('custom-funds-error');
  if (!el) return;
  el.textContent = '';
  el.classList.remove('show');
}

/**
 * Validates and adds custom funds from the modal input. Rejects non-numeric
 * input, non-integer values, and amounts outside the 1–10,000,000 range.
 * Shows a visible error message if validation fails.
 * @returns {void}
 */
function confirmCustomFunds() {
  const input = document.getElementById('custom-amount');
  const errorEl = document.getElementById('custom-funds-error');
  const raw = input.value.trim();
  const val = Number(raw);

  if (raw === '' || !Number.isFinite(val) || !Number.isInteger(val)) {
    errorEl.textContent = 'Enter a whole number.';
    errorEl.classList.add('show');
    return;
  }
  if (val < 1 || val > MAX_CUSTOM_FUNDS) {
    errorEl.textContent = `Amount must be between 1 and ${MAX_CUSTOM_FUNDS.toLocaleString()}.`;
    errorEl.classList.add('show');
    return;
  }
  clearCustomFundsError();
  addFundsAndClose(val);
}

// ── Bonus Wheel ────────────────────────────────────────────────────────────
const WHEEL_PRIZES = [
  { label: '50 TOK', value: 50, color: '#4ade80' },
  { label: '100 TOK', value: 100, color: '#60a5fa' },
  { label: 'SORRY', value: 0, color: '#2a2a40' },
  { label: '250 TOK', value: 250, color: '#a78bfa' },
  { label: '\xD72 BET', value: -2, color: '#fbbf24' },
  { label: '1K TOK', value: 1000, color: '#34d399' },
  { label: 'FREE!', value: -99, color: '#f472b6' },
  { label: '\xD75 BET', value: -5, color: '#f87171' },
];

let wheelAngle = 0;
let wheelSpinning = false;
let lastWheelTick = -1;

/**
 * Draws the bonus wheel on the canvas at the given rotation angle.
 * @param {number} angle - Current rotation angle in radians
 * @returns {void}
 */
function drawWheel(angle) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = cx - 8;
  const n = WHEEL_PRIZES.length;
  const sliceAngle = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = '#0d0d1a';
  ctx.fill();

  WHEEL_PRIZES.forEach(function (prize, i) {
    const start = angle + i * sliceAngle;
    const end = start + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = prize.color;
    ctx.fill();
    ctx.strokeStyle = '#11111a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = i === 2 ? '#5050a0' : '#07070d';
    ctx.font = 'bold 11px "Space Mono", monospace';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(prize.label, r - 6, 4);
    ctx.restore();
  });

  // Center hub
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
  grad.addColorStop(0, '#2a2a40');
  grad.addColorStop(1, '#0d0d1a');
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * Spins the bonus wheel with eased animation and determines the prize.
 * @returns {void}
 */
function spinBonusWheel() {
  if (wheelSpinning) return;
  wheelSpinning = true;
  document.getElementById('wheel-spin-btn').disabled = true;
  document.getElementById('wheel-result').textContent = '';

  const targetIdx = Math.floor(secureRandom() * WHEEL_PRIZES.length);
  const n = WHEEL_PRIZES.length;
  const sliceAngle = (Math.PI * 2) / n;
  const fullSpins = (Math.floor(secureRandom() * 4) + 5) * Math.PI * 2;
  let targetFinalAngle = -Math.PI / 2 - targetIdx * sliceAngle - sliceAngle / 2;
  while (targetFinalAngle > wheelAngle) targetFinalAngle -= Math.PI * 2;
  const finalAngle = targetFinalAngle - fullSpins;
  const startAngle = wheelAngle;
  const angleDiff = finalAngle - startAngle;
  const duration = 3200 + Math.random() * 800;
  const startTime = performance.now();

  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  function frame(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = easeOut(t);
    wheelAngle = startAngle + angleDiff * eased;
    drawWheel(wheelAngle);

    const currentSlice = Math.floor((-wheelAngle / sliceAngle) % n);
    if (currentSlice !== lastWheelTick && t < 0.92) {
      playSound('wheelTick');
      lastWheelTick = currentSlice;
    }

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      wheelSpinning = false;
      playSound('wheelStop');
      awardWheelPrize(WHEEL_PRIZES[targetIdx]);
    }
  }

  requestAnimationFrame(frame);
}

/**
 * Awards the prize from the bonus wheel and updates the UI.
 * @param {{label: string, value: number, color: string}} prize - The prize object
 * @returns {void}
 */
function awardWheelPrize(prize) {
  const betVal = parseInt(document.getElementById('bet').value) || 10;
  let amount = 0;
  let resultText;

  if (prize.value > 0) {
    amount = prize.value;
    resultText = `+${amount} bonus tokens awarded!`;
  } else if (prize.value === -2) {
    amount = betVal * 2;
    resultText = `2\xD7 your bet! +${amount} tokens!`;
  } else if (prize.value === -5) {
    amount = betVal * 5;
    resultText = `5\xD7 your bet! +${amount} tokens!`;
  } else if (prize.value === -99) {
    STATE.freeSpin = true;
    resultText = 'FREE SPIN! Next spin is on the house.';
  } else {
    resultText = 'Nothing. The algorithm apologizes. (Briefly.)';
  }

  if (amount > 0) {
    STATE.balance += amount;
    STATE.totalWon += amount;
    updateUI();
    spawnCoins(amount);
    playSound('coinAdd', amount);
    if (amount >= 500) spawnCoinRain(Math.min(20, Math.floor(amount / 50)));
    clearBetAdjustNotice();
    updateSpinAvailability();
  }

  document.getElementById('wheel-result').textContent = resultText;
  const closeBtn = document.getElementById('wheel-close-btn');
  closeBtn.style.display = 'block';
  closeBtn.textContent = STATE.freeSpin ? 'Claim Free Spin \u2192' : 'Collect & Continue \u2192';

  speak(`Bonus wheel result: ${resultText.replace(/[+\xD7]/g, '')}`);
}

/**
 * Opens the bonus wheel modal and resets its state.
 * @returns {void}
 */
function openBonusModal() {
  document.getElementById('bonus-spin-num').textContent = STATE.spinCount;
  document.getElementById('wheel-result').textContent = '';
  document.getElementById('wheel-close-btn').style.display = 'none';
  document.getElementById('wheel-spin-btn').disabled = false;
  lastWheelTick = -1;
  drawWheel(wheelAngle);
  document.getElementById('bonus-modal').classList.add('show');
}

/**
 * Closes the bonus wheel modal.
 * @returns {void}
 */
function closeBonusModal() {
  document.getElementById('bonus-modal').classList.remove('show');
}

// ── Lever ──────────────────────────────────────────────────────────────────
/**
 * Triggers a spin via the lever animation (pull down, spin, release).
 * @returns {void}
 */
function leverSpin() {
  if (STATE.spinning || STATE.leverActive) return;
  STATE.leverActive = true;
  const arm = document.getElementById('lever-arm');
  arm.classList.add('pulled');
  playSound('leverPull');
  setTimeout(function () {
    spin().then(function () {
      setTimeout(function () {
        arm.classList.remove('pulled');
        playSound('leverRelease');
        STATE.leverActive = false;
      }, 100);
    });
  }, 180);
}

// ── Bet helpers ────────────────────────────────────────────────────────────
/**
 * Clamps a bet value between 1 and the current balance.
 * @param {number} val - Raw bet value
 * @returns {number} Clamped bet value
 */
function clampBet(val) { return Math.min(Math.max(1, val), STATE.balance); }

/**
 * Re-clamps the bet input against the current balance. Called after any
 * balance change so the bet never silently exceeds what the player can
 * afford. If balance is 0 the input is parked at 1 (spin is disabled
 * separately via updateSpinAvailability).
 * @returns {{adjusted: boolean, oldValue: number, newValue: number}}
 */
function reclampBet() {
  const inp = document.getElementById('bet');
  const old = parseInt(inp.value) || 1;
  const target = STATE.balance > 0 ? Math.max(1, Math.min(old, STATE.balance)) : 1;
  if (target !== old) inp.value = target;
  return { adjusted: target < old, oldValue: old, newValue: target };
}

/**
 * Shows a small notice below the bet input explaining an auto-adjust.
 * @param {number} oldVal - The bet value before adjustment
 * @param {number} newVal - The bet value after adjustment
 * @returns {void}
 */
function showBetAdjustNotice(oldVal, newVal) {
  const el = document.getElementById('bet-adjust-note');
  if (!el) return;
  el.textContent = `Bet auto-adjusted from ${oldVal} to ${newVal} \u2014 balance too low.`;
  el.classList.add('show');
}

/** @returns {void} */
function clearBetAdjustNotice() {
  const el = document.getElementById('bet-adjust-note');
  if (!el) return;
  el.classList.remove('show');
  el.textContent = '';
}

/**
 * Enables or disables the spin controls based on the current balance.
 * Independent of the per-spin `spinning` lock — when balance is 0 the
 * spin button stays disabled until the player refills.
 * @returns {void}
 */
function updateSpinAvailability() {
  if (STATE.spinning) return;
  const noFunds = STATE.balance <= 0;
  document.getElementById('spin-btn').disabled = noFunds;
  document.querySelectorAll('.bet-preset').forEach(function (b) { b.disabled = noFunds; });
  document.getElementById('bet').disabled = noFunds;
}

/**
 * Sets the bet input to a specific value (clamped).
 * @param {number} val - Desired bet amount
 * @returns {void}
 */
function setBet(val) {
  playSound('click');
  document.getElementById('bet').value = clampBet(val);
  clearBetAdjustNotice();
}

/**
 * Sets the bet input to the player's entire balance.
 * @returns {void}
 */
function setBetMax() {
  playSound('click');
  document.getElementById('bet').value = STATE.balance;
  clearBetAdjustNotice();
}

// ── Reel rendering (Smell #9 — DOM methods instead of innerHTML) ──────────
/**
 * Populates a reel element with symbol cells from the STRIP using DOM
 * methods instead of innerHTML to avoid XSS risk.
 * @param {string} id - DOM id of the reel-inner element
 * @returns {void}
 */
function buildReel(id) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  STRIP.forEach(function (s) {
    const cell = document.createElement('div');
    cell.className = 'reel-cell';
    const symDiv = document.createElement('div');
    symDiv.className = 'reel-sym';
    symDiv.textContent = s.sym;
    const lblDiv = document.createElement('div');
    lblDiv.className = 'reel-lbl';
    lblDiv.textContent = s.lbl;
    cell.appendChild(symDiv);
    cell.appendChild(lblDiv);
    el.appendChild(cell);
  });
}

/**
 * Initializes all three reels to their starting state.
 * @returns {void}
 */
function initReels() {
  [0, 1, 2].forEach(function (i) {
    buildReel(`reel${i}`);
    const inner = document.getElementById(`reel${i}`);
    inner.style.transition = '';
    inner.style.transform = 'translateY(0)';
    document.getElementById(`reel-wrap-${i}`).className = 'reel-wrap';
  });
}

/**
 * Animates a single reel spinning and stopping at a target STRIP position.
 * @param {HTMLElement} reelEl - The reel-inner DOM element
 * @param {number} targetStripPos - STRIP index to land on (see stripPositionFor)
 * @param {number} duration - Approximate spin duration in ms
 * @param {number} delay - Delay before spin starts in ms
 * @returns {Promise<void>} Resolves when animation completes
 */
function animateReel(reelEl, targetStripPos, duration, delay) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      const totalCells = STRIP.length;
      const loops = Math.floor(duration / 80);
      let frame = 0;
      let pos = 0;
      reelEl.style.transition = '';

      const interval = setInterval(function () {
        pos = (pos + CELL_HEIGHT) % (totalCells * CELL_HEIGHT);
        reelEl.style.transform = `translateY(-${pos}px)`;
        frame++;
        if (frame % 5 === 0) playSound('tick');

        if (frame >= loops) {
          clearInterval(interval);
          const offset = targetStripPos * CELL_HEIGHT;
          reelEl.style.transition = 'transform 0.28s cubic-bezier(0.25,0.8,0.5,1)';
          reelEl.style.transform = `translateY(-${offset}px)`;
          setTimeout(resolve, 300);
        }
      }, 40);
    }, delay);
  });
}

// ── Payout logic ───────────────────────────────────────────────────────────

// Payout multipliers — tuned so theoretical RTP = 96.50% given SYMBOL_WEIGHTS.
// Pair was lowered from 2.4× to 2.0× to compensate for WILD and MULTIPLIER
// boosting overall RTP. See changes.md for full derivation.
const PAYOUT_TABLE = {
  DIAMOND_TRIPLE: 150,
  AGI_TRIPLE: 50,
  MONEY_TRIPLE: 40,
  ORACLE_TRIPLE: 30,
  BRAIN_TRIPLE: 25,
  GENERIC_TRIPLE: 15,
  SINGULARITY_COMBO: 25,
  TRINITY_COMBO: 18,
  NEURAL_NET_COMBO: 15,
  COMPUTE_STACK_COMBO: 12,
  HYPER_DRIVE_COMBO: 10,
  PAIR: 2,
  SCATTER_2: 5,
  SCATTER_3: 20,
  MULTIPLIER_FACTOR: 2,
};

/**
 * Evaluates a standard payout for three resolved labels (no specials).
 * This is the inner payout check used after wilds have been resolved.
 *
 * @param {string[]} labels - Array of three symbol labels (no WILD/SCATTER/MULTIPLIER)
 * @returns {{mult: number, type: string, combo: string, msgKey: string}} Payout result
 */
function basePayoutCheck(labels) {
  const a = labels[0], b = labels[1], c = labels[2];
  const has = function (l) { return labels.indexOf(l) !== -1; };

  if (a === b && b === c) {
    if (a === 'DIAMOND') return { mult: PAYOUT_TABLE.DIAMOND_TRIPLE, type: 'jackpot', combo: 'DIAMOND JACKPOT', msgKey: 'jackpot' };
    if (a === 'AGI') return { mult: PAYOUT_TABLE.AGI_TRIPLE, type: 'bigwin', combo: 'AGI SINGULARITY', msgKey: 'agi_triple' };
    if (a === 'MONEY') return { mult: PAYOUT_TABLE.MONEY_TRIPLE, type: 'bigwin', combo: 'MONEY BAGS', msgKey: 'bigwin' };
    if (a === 'ORACLE') return { mult: PAYOUT_TABLE.ORACLE_TRIPLE, type: 'bigwin', combo: 'ORACLE VISION', msgKey: 'oracle' };
    if (a === 'BRAIN') return { mult: PAYOUT_TABLE.BRAIN_TRIPLE, type: 'bigwin', combo: 'NEURAL OVERFLOW', msgKey: 'brain' };
    return { mult: PAYOUT_TABLE.GENERIC_TRIPLE, type: 'win', combo: '3 OF A KIND', msgKey: 'win' };
  }

  if (has('DIAMOND') && has('MONEY') && has('AGI'))
    return { mult: PAYOUT_TABLE.SINGULARITY_COMBO, type: 'bigwin', combo: 'SINGULARITY', msgKey: 'singularity' };
  if (has('DIAMOND') && has('AGI') && has('BRAIN'))
    return { mult: PAYOUT_TABLE.TRINITY_COMBO, type: 'win', combo: 'AI TRINITY', msgKey: 'trinity' };
  if (has('BRAIN') && has('ORACLE') && has('DNA'))
    return { mult: PAYOUT_TABLE.NEURAL_NET_COMBO, type: 'win', combo: 'NEURAL NET', msgKey: 'neuralnet' };
  if (has('AGI') && has('STORAGE') && has('POWER'))
    return { mult: PAYOUT_TABLE.COMPUTE_STACK_COMBO, type: 'win', combo: 'COMPUTE STACK', msgKey: 'computestack' };
  if (has('ROCKET') && has('POWER') && has('TARGET'))
    return { mult: PAYOUT_TABLE.HYPER_DRIVE_COMBO, type: 'win', combo: 'HYPER DRIVE', msgKey: 'hyperdrive' };

  if (a === b || b === c || a === c)
    return { mult: PAYOUT_TABLE.PAIR, type: 'pair', combo: 'PAIR', msgKey: 'pair' };

  return { mult: 0, type: 'lose', combo: 'NO MATCH', msgKey: 'lose' };
}

/**
 * Resolves WILD symbols by trying every possible substitution and returning
 * the one that produces the highest-paying triple or named combo. WILDs do
 * NOT substitute into pairs — they only upgrade to triples and named combos.
 *
 * @param {string[]} labels - Array of three symbol labels (may contain 'WILD')
 * @returns {{resolved: string[], wildHelped: boolean}} The resolved labels and whether wild mattered
 */
function resolveWilds(labels) {
  const wildPositions = [];
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === 'WILD') wildPositions.push(i);
  }
  if (wildPositions.length === 0) return { resolved: labels, wildHelped: false };

  // Try all substitution combinations, keep the best triple/combo payout
  let bestLabels = labels.slice();
  let bestMult = 0;

  function tryAll(pos, current) {
    if (pos >= wildPositions.length) {
      const result = basePayoutCheck(current);
      // Only count triples and named combos, not pairs
      if (result.mult > PAYOUT_TABLE.PAIR && result.mult > bestMult) {
        bestMult = result.mult;
        bestLabels = current.slice();
      }
      return;
    }
    for (let i = 0; i < WILD_SUBSTITUTES.length; i++) {
      const next = current.slice();
      next[wildPositions[pos]] = WILD_SUBSTITUTES[i];
      tryAll(pos + 1, next);
    }
  }

  tryAll(0, labels.slice());
  return { resolved: bestLabels, wildHelped: bestMult > 0 };
}

/**
 * Calculates the full payout for a set of three symbol indices, including
 * Wild substitution, Scatter independent payouts, and Multiplier doubling.
 *
 * Evaluation order:
 *   1. Count SCATTER symbols → pay independently (2 scatters = 5×, 3 = 20× + free spins)
 *   2. Resolve WILD symbols → find best triple/combo substitution
 *   3. If wild resolved a combo, use that payout; otherwise check regular symbols
 *   4. If MULTIPLIER is present and there's a base win, double it
 *   5. Total = base payout (possibly multiplied) + scatter payout
 *
 * @param {number[]} indices - Array of three symbol indices
 * @returns {{mult: number, type: string, combo: string, msgKey: string, scatterPay: number, hasMultiplier: boolean, wildUsed: boolean, freeSpinsAwarded: number}} Full payout result
 */
function calcPayout(indices) {
  const labels = indices.map(function (i) { return SYMBOLS[i].lbl; });

  // 1. Scatter — pays based on count regardless of position
  const scatterCount = labels.filter(function (l) { return l === 'SCATTER'; }).length;
  let scatterPay = 0;
  let freeSpinsAwarded = 0;
  if (scatterCount === 2) {
    scatterPay = PAYOUT_TABLE.SCATTER_2;
  } else if (scatterCount >= 3) {
    scatterPay = PAYOUT_TABLE.SCATTER_3;
    freeSpinsAwarded = SCATTER_FREE_SPINS;
  }

  // 2. Check for multiplier
  const hasMultiplier = labels.indexOf('MULTIPLIER') !== -1;

  // 3. Resolve wilds (triples and named combos only, not pairs)
  const wildResult = resolveWilds(labels);
  let basePayout;

  if (wildResult.wildHelped) {
    // Wild completed a triple or named combo
    basePayout = basePayoutCheck(wildResult.resolved);
    basePayout.combo = '\u{1F0CF} WILD ' + basePayout.combo;
    basePayout.wildUsed = true;
  } else {
    // No wild help — evaluate regular symbols only (filter out specials)
    const realLabels = labels.filter(function (l) {
      return SPECIAL_LABELS.indexOf(l) === -1;
    });

    if (realLabels.length === 3) {
      basePayout = basePayoutCheck(realLabels);
    } else if (realLabels.length === 2 && realLabels[0] === realLabels[1]) {
      basePayout = { mult: PAYOUT_TABLE.PAIR, type: 'pair', combo: 'PAIR', msgKey: 'pair' };
    } else {
      basePayout = { mult: 0, type: 'lose', combo: 'NO MATCH', msgKey: 'lose' };
    }
    basePayout.wildUsed = false;
  }

  // 4. Multiplier doubles the base payout (not scatter)
  if (hasMultiplier && basePayout.mult > 0) {
    basePayout.mult *= PAYOUT_TABLE.MULTIPLIER_FACTOR;
    basePayout.combo = '\u{1F525}2\u00D7 ' + basePayout.combo;
    if (basePayout.type === 'pair') basePayout.type = 'win';
    if (basePayout.type === 'win') basePayout.type = 'bigwin';
  }

  // 5. Combine scatter + base
  basePayout.mult += scatterPay;
  basePayout.scatterPay = scatterPay;
  basePayout.hasMultiplier = hasMultiplier;
  basePayout.freeSpinsAwarded = freeSpinsAwarded;

  // If only scatter paid, upgrade type from 'lose'
  if (basePayout.type === 'lose' && scatterPay > 0) {
    basePayout.type = 'win';
    basePayout.combo = '\u2B50 SCATTER';
    basePayout.msgKey = 'scatter';
  }

  // If scatter awards free spins, note it in the combo
  if (freeSpinsAwarded > 0) {
    basePayout.combo += ` +${freeSpinsAwarded} FREE`;
    basePayout.msgKey = 'scatter';
  }

  return basePayout;
}

// ── Near-miss detection ────────────────────────────────────────────────────
/**
 * Checks if a losing spin qualifies as a near-miss. A near-miss fires only
 * when calcPayout already returned type === 'lose' (no payout at all — not
 * even a pair). It triggers when at least two of the three reel symbols are
 * high-value (DIAMOND, MONEY, or AGI). The two high-value symbols do NOT
 * need to match each other: the visual presence of multiple rare symbols
 * landing together without any payout creates a "so close" moment.
 *
 * Because this is only called after a 'lose' result, pairs and actual wins
 * are already excluded — there is no risk of double-counting.
 *
 * @param {number[]} indices - Array of three symbol indices
 * @returns {boolean} True if the spin qualifies as a near-miss
 */
function checkNearMiss(indices) {
  const HIGH_VALUE = ['DIAMOND', 'MONEY', 'AGI'];
  const highCount = indices.filter(function (i) {
    return HIGH_VALUE.indexOf(SYMBOLS[i].lbl) !== -1;
  }).length;
  return highCount >= 2;
}

// ── UI helpers ─────────────────────────────────────────────────────────────

/**
 * Sets the message box content and CSS class.
 * @param {string} text - HTML content for the message
 * @param {string} cls - CSS class to apply (e.g. 'win', 'lose', 'jackpot')
 * @returns {void}
 */
function setMsg(text, cls) {
  const el = document.getElementById('msg');
  el.innerHTML = text;
  el.className = cls ? `msg-box ${cls}` : 'msg-box';
}

/**
 * Applies a temporary glow effect to the machine based on result type.
 * @param {string} type - Result type ('jackpot', 'bigwin', 'win', 'pair', 'lose')
 * @returns {void}
 */
function setMachineGlow(type) {
  const machine = document.getElementById('machine');
  const glowMap = { jackpot: 'glow-jackpot', bigwin: 'glow-bigwin', win: 'glow-win', pair: 'glow-pair', lose: 'glow-lose' };
  machine.className = glowMap[type] ? `machine ${glowMap[type]}` : 'machine';
  setTimeout(function () { machine.className = 'machine'; }, 2400);
}

/**
 * Updates all stat displays (balance, won, burned, spins, RTP) in the DOM.
 * @returns {void}
 */
function updateUI() {
  document.getElementById('balance').textContent = STATE.balance.toLocaleString();
  document.getElementById('won').textContent = STATE.totalWon.toLocaleString();
  document.getElementById('burned').textContent = STATE.totalBurned.toLocaleString();
  document.getElementById('spins').textContent = STATE.spinCount.toLocaleString();

  // RTP display — only show after enough spins for a meaningful sample
  const rtpEl = document.getElementById('rtp-display');
  if (rtpEl) {
    if (STATE.totalWagered > 0) {
      const sessionRTP = (STATE.totalReturned / STATE.totalWagered) * 100;
      rtpEl.textContent = `${sessionRTP.toFixed(1)}%`;
      // Color code: green if above target, red if well below
      if (sessionRTP >= TARGET_RTP * 100 - 5) {
        rtpEl.style.color = 'var(--win)';
      } else {
        rtpEl.style.color = 'var(--lose)';
      }
    } else {
      rtpEl.textContent = '—';
      rtpEl.style.color = 'var(--muted)';
    }
  }
}

/**
 * Adds a spin result to the history display using DOM methods (Smell #9).
 * @param {number[]} indices - Symbol indices from the spin
 * @param {number} bet - Bet amount
 * @param {number} winAmt - Amount won
 * @param {string} type - Result type
 * @param {string} combo - Combo name
 * @returns {void}
 */
function addHistory(indices, bet, winAmt, type, combo) {
  const syms = indices.map(function (i) { return SYMBOLS[i].sym; }).join(' ');
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  STATE.spinHistory.unshift({ syms: syms, bet: bet, winAmt: winAmt, type: type, combo: combo, ts: ts });

  const wrap = document.getElementById('hist-wrap');
  const divider = document.getElementById('hist-divider');
  const list = document.getElementById('hist-list');
  wrap.style.display = 'block';
  divider.style.display = 'block';

  const clsMap = { jackpot: 'j', bigwin: 'bw', win: 'w', pair: 'p', lose: 'l' };

  // Build history rows with DOM methods instead of innerHTML concatenation
  list.innerHTML = '';
  STATE.spinHistory.slice(0, HISTORY_DISPLAY_LIMIT).forEach(function (h) {
    const row = document.createElement('div');
    row.className = `hist-item ${clsMap[h.type] || 'l'}`;

    const symSpan = document.createElement('span');
    symSpan.textContent = h.syms;

    const comboSpan = document.createElement('span');
    comboSpan.style.opacity = '0.6';
    comboSpan.style.fontSize = '10px';
    comboSpan.textContent = h.combo;

    const deltaSpan = document.createElement('span');
    if (h.type === 'lose') deltaSpan.textContent = `\u2212${h.bet} tok`;
    else deltaSpan.textContent = `+${h.winAmt} tok`;

    const tsSpan = document.createElement('span');
    tsSpan.textContent = h.ts;

    row.appendChild(symSpan);
    row.appendChild(comboSpan);
    row.appendChild(deltaSpan);
    row.appendChild(tsSpan);
    list.appendChild(row);
  });
}

/**
 * Enables or disables the spin button and bet controls.
 * @param {boolean} disabled - Whether controls should be disabled
 * @returns {void}
 */
function setSpinButtonsDisabled(disabled) {
  document.getElementById('spin-btn').disabled = disabled;
  document.querySelectorAll('.bet-preset').forEach(function (b) { b.disabled = disabled; });
  document.getElementById('bet').disabled = disabled;
}

// ── Tiered celebration ─────────────────────────────────────────────────────
/**
 * Triggers visual/audio celebrations scaled to the win type.
 * @param {string} type - Result type ('jackpot', 'bigwin', 'win', 'pair', 'lose')
 * @param {number} winAmt - Amount won
 * @param {number} bet - Bet amount
 * @returns {void}
 */
function celebrate(type, winAmt, bet) {
  const balEl = document.getElementById('balance');

  if (type === 'jackpot') {
    spawnConfetti(180);
    spawnCoinRain(30);
    screenFlash('rgba(251,191,36,0.4)', 800);
    setTimeout(function () { screenFlash('rgba(251,191,36,0.25)', 600); }, 500);
    balEl.classList.add('jackpot-flash');
    setTimeout(function () { balEl.classList.remove('jackpot-flash'); }, 1200);
    const pj = STATE.progressiveJackpot;
    resetProgressiveJackpot();
    if (pj > INITIAL_JACKPOT) {
      STATE.balance += pj;
      STATE.totalWon += pj;
      updateUI();
      setTimeout(function () {
        setMsg(`${document.getElementById('msg').innerHTML} <span style="color:var(--jackpot);font-weight:700">+${pj.toLocaleString()} JACKPOT POOL!</span>`, 'jackpot');
      }, 300);
    }

  } else if (type === 'bigwin') {
    screenFlash('rgba(52,211,153,0.25)', 600);
    if (winAmt >= bet * 10) spawnCoinRain(Math.min(20, Math.floor(winAmt / 50)));
    else spawnCoinRain(8);
    balEl.classList.add('jackpot-flash');
    setTimeout(function () { balEl.classList.remove('jackpot-flash'); }, 1200);

  } else if (type === 'win') {
    if (winAmt >= bet * 6) spawnCoinRain(6);
    screenFlash('rgba(74,222,128,0.10)', 400);

  } else if (type === 'pair') {
    screenFlash('rgba(96,165,250,0.07)', 300);
  }

  // Balance pop for any win
  if (type !== 'lose') {
    balEl.classList.remove('balance-pop');
    forceReflow(balEl);
    balEl.classList.add('balance-pop');
    setTimeout(function () { balEl.classList.remove('balance-pop'); }, 600);
  }
}

// ── Main spin ──────────────────────────────────────────────────────────────
/**
 * Executes the main spin sequence: deducts bet, animates reels, calculates payout.
 * @returns {Promise<void>} Resolves when the spin is fully complete
 */
function spin() {
  if (STATE.spinning) return Promise.resolve();

  const betInput = document.getElementById('bet');
  const bet = Math.max(1, parseInt(betInput.value) || 1);

  if (bet > STATE.balance) {
    setMsg('Insufficient tokens. Even the garbage collector pities you.', 'lose');
    playSound('lose');
    speak('Insufficient tokens. Top up your wallet, you broke neural network.');
    return Promise.resolve();
  }

  STATE.spinning = true;
  setSpinButtonsDisabled(true);

  // If there are banked free spins from scatter, activate one
  if (!STATE.freeSpin && STATE.freeSpinBank > 0) {
    STATE.freeSpinBank--;
    STATE.freeSpin = true;
  }

  // Free spin: don't deduct
  const wasFree = STATE.freeSpin;
  if (STATE.freeSpin) {
    STATE.freeSpin = false;
    setMsg('\u{1F381} FREE SPIN activated! The house hates this.', '');
  } else {
    STATE.balance -= bet;
  }

  STATE.spinCount++;
  updateUI();
  setMsg('Sampling from the distribution\u2026', '');
  playSound('spinStart');

  initReels();

  const indices = [0, 1, 2].map(function () { return weightedSymbol(); });
  const stripPositions = indices.map(stripPositionFor);
  const delays = [0, 220, 440];
  const durations = [600, 760, 920];

  function unlockSpin() {
    STATE.spinning = false;
    setSpinButtonsDisabled(false);
  }

  return Promise.all(
    [0, 1, 2].map(function (i) {
      return animateReel(document.getElementById(`reel${i}`), stripPositions[i], durations[i], delays[i]);
    })
  ).then(function () {
    const result = calcPayout(indices);
    const mult = result.mult;
    let type = result.type;
    const combo = result.combo;
    const winAmt = mult > 0 ? Math.floor(bet * mult) : 0;

    // RTP tracking — record wager and return for session statistics.
    // Free spins don't count toward wagered (bet was not deducted).
    if (!wasFree) {
      STATE.totalWagered += bet;
      STATE.totalReturned += winAmt;
    }

    if (winAmt > 0) {
      STATE.balance += winAmt;
      STATE.totalWon += winAmt;
    }

    // Progressive jackpot grows on losses. totalBurned only counts full losses.
    if (type === 'lose') {
      updateProgressiveJackpot(Math.ceil(bet * JACKPOT_CONTRIBUTION_RATE));
      STATE.totalBurned += bet;
    }

    // Result sound
    const typeToSound = { jackpot: 'jackpot', bigwin: 'bigWin', win: 'win', pair: 'pair', lose: 'lose' };
    playSound(typeToSound[type] || 'lose');

    // Play additional sounds for special symbols
    if (result.wildUsed) playSound('wild');
    if (result.hasMultiplier && result.mult > 0) playSound('multiplier');
    if (result.scatterPay > 0) playSound('scatter');
    if (result.freeSpinsAwarded > 0) {
      setTimeout(function () { playSound('freeSpins'); }, 300);
    }

    // Reel highlight — highlight winning reels and special symbols
    [0, 1, 2].forEach(function (i) {
      const wrap = document.getElementById(`reel-wrap-${i}`);
      if (type !== 'lose' && type !== 'pair') wrap.classList.add('winner-reel');
      // Highlight special symbol reels
      const lbl = SYMBOLS[indices[i]].lbl;
      if (lbl === 'WILD') wrap.classList.add('wild-reel');
      if (lbl === 'SCATTER') wrap.classList.add('scatter-reel');
      if (lbl === 'MULTIPLIER') wrap.classList.add('multiplier-reel');
    });

    // Message
    const pool = MSGS[result.msgKey] || MSGS[type] || MSGS.lose;
    const base = rnd(pool);
    let msg;
    if (type === 'lose') msg = `${base} &minus;${bet.toLocaleString()} tokens.`;
    else if (type === 'pair') msg = `${base} +${winAmt.toLocaleString()} tokens!`;
    else msg = `<span class="combo-badge">${combo}</span>${base} +${winAmt.toLocaleString()} tokens!`;

    // Near-miss check (only on loss — see checkNearMiss JSDoc for criteria)
    const nearMiss = (type === 'lose') ? checkNearMiss(indices) : false;
    if (nearMiss) {
      playSound('nearMiss');
      type = 'nearmiss';
      msg = `<span class="combo-badge">NEAR MISS</span>${rnd(MSGS.nearmiss)} &minus;${bet.toLocaleString()} tokens.`;
      const machine = document.getElementById('machine');
      machine.classList.add('shake-anim');
      setTimeout(function () { machine.classList.remove('shake-anim'); }, 600);
      [0, 1, 2].forEach(function (i) {
        const idx = indices[i];
        const wrap = document.getElementById(`reel-wrap-${i}`);
        const high = ['DIAMOND', 'MONEY', 'AGI'];
        if (high.indexOf(SYMBOLS[idx].lbl) !== -1)
          wrap.classList.add('near-miss-reel');
      });
      speak(rnd(SPEECH.nearmiss));
    } else {
      const speechPool = SPEECH[result.msgKey] || SPEECH[type] || SPEECH.lose;
      if (speechPool) speak(rnd(speechPool));
    }

    setMsg(msg, type === 'nearmiss' ? 'nearmiss' : type);
    setMachineGlow(type === 'nearmiss' ? 'lose' : type);
    addHistory(indices, bet, winAmt, result.type, combo);
    updateUI();

    // Tiered celebration
    try {
      celebrate(result.type, winAmt, bet);
    } catch (e) {
      console.warn('Celebration error:', e);
    }

    // Award free spins from scatter (3 scatters = SCATTER_FREE_SPINS rounds)
    if (result.freeSpinsAwarded > 0) {
      STATE.freeSpinBank = (STATE.freeSpinBank || 0) + result.freeSpinsAwarded;
      setTimeout(function () {
        setMsg(`\u2B50\u2B50\u2B50 ${result.freeSpinsAwarded} FREE SPINS awarded! ${STATE.freeSpinBank} remaining.`, 'win');
        speak(rnd(SPEECH.freespins));
      }, 400);
    }

    // Balance may have dropped below the current bet; re-clamp and notify.
    const reclamp = reclampBet();
    if (reclamp.adjusted) showBetAdjustNotice(reclamp.oldValue, reclamp.newValue);
    else clearBetAdjustNotice();

    if (STATE.balance <= 0) {
      playSound('broke');
      setTimeout(function () {
        setMsg('Token balance fully deprecated. Model discontinued. Click \u21BB Refill context to continue.', 'lose');
      }, 400);
      speak('You are completely broke. Even the garbage collector feels bad for you.');
    }

    unlockSpin();
    updateSpinAvailability();

    // Bonus wheel every N spins
    if (STATE.spinCount % BONUS_WHEEL_INTERVAL === 0) {
      setTimeout(openBonusModal, 800);
    }
  }).catch(function (e) {
    console.warn('Spin error:', e);
    unlockSpin();
    updateSpinAvailability();
    setMsg('Inference error. The model crashed. Try again.', 'lose');
  });
}

// ── Reset ──────────────────────────────────────────────────────────────────
/**
 * Resets the entire game state to initial values and clears localStorage.
 * @returns {void}
 */
function resetGame() {
  playSound('reset');
  speak('Context window refilled. Try not to lose it all in under ten spins this time.');

  STATE.balance = STARTING_BALANCE;
  STATE.totalWon = 0;
  STATE.totalBurned = 0;
  STATE.spinCount = 0;
  STATE.freeSpin = false;
  STATE.spinning = false;
  STATE.leverActive = false;
  STATE.spinHistory.length = 0;
  STATE.totalWagered = 0;
  STATE.totalReturned = 0;
  STATE.freeSpinBank = 0;

  resetProgressiveJackpot();

  document.getElementById('hist-wrap').style.display = 'none';
  document.getElementById('hist-divider').style.display = 'none';
  document.getElementById('hist-list').innerHTML = '';
  document.getElementById('machine').className = 'machine';
  document.getElementById('bet').disabled = false;

  updateUI();
  initReels();
  setSpinButtonsDisabled(false);
  clearBetAdjustNotice();
  updateSpinAvailability();
  setMsg('Context window refilled. Try not to blow it all on AGI symbols this time.', '');
}

// ── Event binding ──────────────────────────────────────────────────────────

// Theme swatches
document.querySelectorAll('.theme-swatch').forEach(function (swatch) {
  swatch.addEventListener('click', function () {
    setTheme(this.dataset.theme);
  });
});

// Speech toggle
document.getElementById('speech-toggle').addEventListener('click', toggleSpeech);

// Add funds buttons
document.querySelectorAll('.funds-row .add-btn[data-amount]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    addFunds(parseInt(this.dataset.amount));
  });
});

// Open custom funds modal
document.getElementById('open-funds-modal-btn').addEventListener('click', openFundsModal);

// Funds modal overlay click to close
document.getElementById('funds-modal').addEventListener('click', function (e) {
  if (e.target === this) closeFundsModal();
});

// Modal preset buttons
document.querySelectorAll('.modal-preset[data-amount]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    addFundsAndClose(parseInt(this.dataset.amount));
  });
});

// Confirm custom funds
document.getElementById('confirm-custom-btn').addEventListener('click', confirmCustomFunds);

// Cancel funds modal
document.getElementById('cancel-funds-btn').addEventListener('click', closeFundsModal);

// Custom amount input keyboard shortcuts
document.getElementById('custom-amount').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') confirmCustomFunds();
  if (e.key === 'Escape') closeFundsModal();
});

// Clear custom funds error as the user types
document.getElementById('custom-amount').addEventListener('input', clearCustomFundsError);

// Spin and reset buttons
document.getElementById('spin-btn').addEventListener('click', function () { spin(); });
document.getElementById('reset-btn').addEventListener('click', resetGame);

// Bet input validation
document.getElementById('bet').addEventListener('change', function () {
  this.value = clampBet(parseInt(this.value) || 1);
  playSound('betChange');
  clearBetAdjustNotice();
});
document.getElementById('bet').addEventListener('input', function () {
  const val = parseInt(this.value) || 1;
  if (val < 1) this.value = 1;
  if (val > STATE.balance) this.value = STATE.balance;
  clearBetAdjustNotice();
});

// Bet preset buttons
document.querySelectorAll('.bet-preset').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const val = this.dataset.bet;
    if (val === 'max') setBetMax();
    else setBet(parseInt(val));
  });
});

// Lever — click and keyboard (Smell #15 accessibility)
document.getElementById('lever-wrap').addEventListener('click', leverSpin);
document.getElementById('lever-wrap').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    leverSpin();
  }
});

// Bonus wheel
document.getElementById('wheel-spin-btn').addEventListener('click', spinBonusWheel);
document.getElementById('wheel-close-btn').addEventListener('click', closeBonusModal);

// ── Init ───────────────────────────────────────────────────────────────────
// Load persisted jackpot from localStorage (falls back to INITIAL_JACKPOT)
STATE.progressiveJackpot = loadProgressiveJackpot();
document.getElementById('pj-amount').textContent = STATE.progressiveJackpot.toLocaleString();

initReels();
initSpeech();
drawWheel(0);
updateSpinAvailability();
