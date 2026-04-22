function getCellHeight() {
  const el = document.querySelector('.reel-cell');
  return el ? el.getBoundingClientRect().height : 110;
}
const INITIAL_JACKPOT = 5000;
const STARTING_BALANCE = 1000;
const JACKPOT_CONTRIBUTION_RATE = 0.08;
const BONUS_WHEEL_INTERVAL = 10;
const MAX_CUSTOM_FUNDS = 10000000;
const JACKPOT_STORAGE_KEY = 'safariProgressiveJackpot';

const REEL_ROWS = 3;
const ACTIVE_PAYLINES = 3;
const TARGET_RTP = 0.9650;

// ── Symbol definitions ─────────────────────────────────────────────────────
const SYMBOLS = [
  { sym: '\u{1F48E}', lbl: 'DIAMOND',    rare: true  },  // 0
  { sym: '\u{1F981}', lbl: 'LION',       rare: true  },  // 1
  { sym: '\u{1F406}', lbl: 'JAGUAR',     rare: true  },  // 2
  { sym: '\u{1F451}', lbl: 'CROWN',      rare: false },  // 3
  { sym: '\u{1FA99}', lbl: 'COIN',       rare: false },  // 4
  { sym: '\u{1F33F}', lbl: 'LEAF',       rare: false },  // 5
  { sym: '\u{1F3C6}', lbl: 'TROPHY',     rare: false },  // 6
  { sym: '\u26A1',    lbl: 'BOLT',       rare: false },  // 7
  { sym: '\u{1F3AF}', lbl: 'TARGET',     rare: false },  // 8
  { sym: '\u{1F334}', lbl: 'PALM',       rare: false },  // 9
  { sym: '\u{1F52E}', lbl: 'CRYSTAL',    rare: false },  // 10
  { sym: '\u{1F3C5}', lbl: 'MEDAL',      rare: false },  // 11
  { sym: '\u{1F0CF}', lbl: 'WILD',       rare: true  },  // 12
  { sym: '\u2B50',    lbl: 'SCATTER',    rare: true  },  // 13
  { sym: '\u{1F525}', lbl: 'MULTIPLIER', rare: true  },  // 14
];

// Weights — total 55. Rare symbols intentionally low.
const SYMBOL_WEIGHTS = [1, 2, 3, 4, 5, 6, 6, 6, 5, 5, 4, 5, 1, 1, 1];

const WILD_SUBSTITUTES = [
  'DIAMOND', 'LION', 'JAGUAR', 'CROWN', 'COIN',
  'LEAF', 'TROPHY', 'BOLT', 'TARGET', 'PALM', 'CRYSTAL', 'MEDAL',
];

const SPECIAL_LABELS = ['WILD', 'SCATTER', 'MULTIPLIER'];

const SCATTER_FREE_SPINS = 3;

const TOTAL_WEIGHT = SYMBOL_WEIGHTS.reduce(function (a, b) { return a + b; }, 0);

// ── Cryptographic RNG ──────────────────────────────────────────────────────
function secureRandom() {
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / (0xFFFFFFFF + 1);
  } catch (e) {
    return Math.random();
  }
}

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

const STRIP_POSITIONS = (function () {
  const map = [];
  for (let i = 0; i < SYMBOLS.length; i++) map.push([]);
  for (let p = 0; p < STRIP.length; p++) {
    map[SYMBOLS.indexOf(STRIP[p])].push(p);
  }
  return map;
})();

const STRIP_SYMBOL_IDX = STRIP.map(function (s) { return SYMBOLS.indexOf(s); });

function weightedSymbol() {
  var factor = (typeof getDifficultyFactor === 'function') ? getDifficultyFactor() : 1;
  var adjustedWeights = SYMBOL_WEIGHTS.map(function (w, i) {
    return SYMBOLS[i].rare ? Math.max(1, Math.round(w * factor)) : w;
  });
  var total = adjustedWeights.reduce(function (a, b) { return a + b; }, 0);
  var r = secureRandom() * total;
  for (var i = 0; i < adjustedWeights.length; i++) {
    r -= adjustedWeights[i];
    if (r <= 0) return i;
  }
  return adjustedWeights.length - 1;
}

function stripPositionFor(symIdx) {
  const positions = STRIP_POSITIONS[symIdx];
  return positions[Math.floor(secureRandom() * positions.length)];
}

// ── Flavor text ────────────────────────────────────────────────────────────
const MSGS = {
  lose: [
    'The savanna gives nothing today.',
    'The hunt ends empty-handed.',
    'Even the lions turn away from you.',
    'The pride does not smile upon this spin.',
    'Dust and silence on the plains.',
    'Fortune hides in the tall grass today.',
    'The jaguar vanished into the jungle.',
    'No prey spotted on this hunt.',
    'The golden plains offer no reward.',
    'Try again, brave hunter.',
  ],
  pair: [
    'Two beasts align. A modest reward.',
    'Half the pride answers your call.',
    'Two matching — the savanna nods.',
    'A small bounty from the jungle.',
    'Partial victory on the plains.',
    'Two of a kind. The hunt is not over.',
  ],
  win: [
    'The hunt succeeds! Chips claimed.',
    'Three of a kind! The pride roars.',
    'The safari yields its treasure.',
    'Fortune smiles on the brave hunter.',
    'The jungle rewards your patience.',
    'A worthy catch on the plains.',
  ],
  bigwin: [
    'MASSIVE WIN! The savanna erupts!',
    'The pride celebrates your triumph!',
    'Gold rains from the acacia trees!',
    'The lion king bestows his blessing!',
    'Riches beyond measure from the wild!',
    'The vault of the savanna is open!',
  ],
  jackpot: [
    '\u{1F48E} DIAMOND JACKPOT! The crown jewels are yours!',
    '\u{1F48E} MAXIMUM GLORY! The vault swings wide open!',
    '\u{1F48E} Three diamonds! Safari Casino weeps tears of gold!',
    '\u{1F48E} The rarest of prizes — the diamond jackpot!',
    '\u{1F48E} JACKPOT! The lion roars and the gold flows!',
  ],
  nearmiss: [
    'So close! The jaguar slipped away.',
    'Almost — the gold glinted but did not fall.',
    'Two hunters align, but the third escapes.',
    'The pride was watching. Better luck awaits.',
    'Nearly a jackpot. The savanna teases.',
    'Fortune circled but did not land.',
    'The wild beasts almost cooperated.',
  ],
  lion_triple: [
    '\u{1F981} LION PRIDE! Three lions dominate the reels!',
    '\u{1F981} The king of the savanna rewards you 50\u00D7!',
    '\u{1F981} THREE LIONS! The pride bows to your fortune!',
    '\u{1F981} Roar! The lion pride has spoken!',
  ],
  jaguar_triple: [
    '\u{1F406} JAGUAR HUNT! Three jaguars stalk the reels!',
    '\u{1F406} The spotted hunters bring you 40\u00D7!',
    '\u{1F406} THREE JAGUARS! The jungle king rewards you!',
  ],
  crown_triple: [
    '\u{1F451} ROYAL FLUSH! Three crowns grace the reels!',
    '\u{1F451} Royalty rewards your courage \u2014 30\u00D7!',
    '\u{1F451} The crown shines with royal favour!',
  ],
  coin_triple: [
    '\u{1FA99} GOLD RUSH! Three coins gleam on the reels!',
    '\u{1FA99} Rivers of gold flow across the savanna!',
    '\u{1FA99} The golden hoard multiplies \u2014 25\u00D7!',
  ],
  safari_trio: [
    '\u{1F48E}\u{1F981}\u{1F406} SAFARI TRIO! Diamond, Lion, Jaguar \u2014 the ultimate combo!',
    'The rarest gem meets the apex predators. Epic payout!',
    'Diamond shines between the two great cats. Fortune unleashed!',
  ],
  royal_hunt: [
    '\u{1F48E}\u{1F406}\u{1F451} ROYAL HUNT! Diamond, Jaguar, Crown converge!',
    'The royal hunters claim a magnificent prize \u2014 18\u00D7!',
    'Crown jewels and the spotted hunter aligned!',
  ],
  jungle_crown: [
    '\u{1F981}\u{1F406}\u{1F451} JUNGLE CROWN! Lion, Jaguar, Crown in harmony!',
    'The two great cats bow to the crown \u2014 15\u00D7!',
    'Pride, stealth, and royalty united on the plains.',
  ],
  golden_empire: [
    '\u{1F451}\u{1FA99}\u{1F3C6} GOLDEN EMPIRE! Crown, Coin, Trophy aligned!',
    'The empire of gold rewards your courage \u2014 12\u00D7!',
    'Wealth, royalty, and glory \u2014 all yours.',
  ],
  wild_safari: [
    '\u{1F406}\u26A1\u{1F3AF} WILD SAFARI! Jaguar, Bolt, Target \u2014 hunt complete!',
    'Electric precision! The wild safari pays 10\u00D7!',
    'Swift as lightning, true as the hunt.',
  ],
  scatter: [
    '\u2B50 SCATTER! Stars grace the reels regardless of position.',
    '\u2B50 Celestial alignment! The night sky pays out.',
    '\u2B50 Stars appear across the savanna night sky!',
  ],
  wild: [
    '\u{1F0CF} WILD card! The joker hunts on your behalf.',
    '\u{1F0CF} The wild symbol transforms into what you need!',
    '\u{1F0CF} A wild appeared \u2014 it chose your side!',
    '\u{1F0CF} The wildcard prowls and brings fortune.',
  ],
  multiplier: [
    '\u{1F525} MULTIPLIER! The fire doubles your fortune!',
    '\u{1F525} Blazing heat! Your payout doubles \u2014 2\u00D7!',
    '\u{1F525} The flame ignites your reward!',
  ],
  freespins: [
    '\u2B50\u2B50\u2B50 THREE SCATTERS! Free spins for the champion!',
    '\u2B50 SCATTER TRIPLE! The stars gift you free rounds!',
    '\u2B50 The cosmos smiles \u2014 free spins unlocked!',
  ],
};

const SPEECH = {
  lose: [
    'The savanna gives nothing today.',
    'The hunt ends empty-handed.',
    'Fortune hides in the tall grass.',
    'No prey spotted on this hunt.',
    'Even the lions turn away.',
  ],
  pair: [
    'Two beasts align. A modest reward.',
    'Two matching. The savanna nods.',
    'Partial victory on the plains.',
  ],
  win: [
    'The hunt succeeds! Chips claimed.',
    'Three of a kind! The pride roars!',
    'The safari yields its treasure.',
  ],
  bigwin: [
    'Massive win! The savanna erupts!',
    'Gold rains from the acacia trees!',
    'The lion king bestows his blessing!',
  ],
  jackpot: [
    'Diamond jackpot! The crown jewels are yours!',
    'Maximum glory! The vault is open!',
    'Three diamonds! The ultimate prize!',
  ],
  nearmiss: [
    'So close! The jaguar slipped away.',
    'Nearly a jackpot. The savanna teases.',
    'Fortune circled but did not land.',
    'Two hunters align, but the third escapes.',
    'The gold glinted but did not fall.',
  ],
  scatter: [
    'Scatter! The stars align for you.',
    'Star symbols! The night sky pays out.',
    'Stars across the savanna sky!',
  ],
  wild: [
    'Wild card! The joker hunts for you.',
    'A wild appeared — it chose your side.',
    'The wild transforms into your prize.',
  ],
  multiplier: [
    'Multiplier! Your payout doubles!',
    'The fire doubles your fortune!',
    'Two times! The flame ignites your reward.',
  ],
  freespins: [
    'Three scatters! Free spins for the champion!',
    'Free rounds on the house!',
    'The stars gift you free spins!',
  ],
};

// ── Game state ─────────────────────────────────────────────────────────────
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
  totalWagered: 0,
  totalReturned: 0,
  freeSpinBank: 0,
  spinSpeed: 1,
  biggestWin: 0,
  totalBetSum: 0,
  soundEnabled: true,
  keyboardEnabled: false,
  currentWinStreak: 0,
  bestWinStreak: 0,
};

const SPIN_SPEEDS = [1, 2, 3];
function getSpinSpeed() {
  const s = Number(STATE.spinSpeed) || 1;
  return SPIN_SPEEDS.indexOf(s) === -1 ? 1 : s;
}

// ── Autoplay state ─────────────────────────────────────────────────────────
const AUTOPLAY = {
  active: false,
  remaining: 0,
  total: 0,
};

const AUTOPLAY_MAX_COUNT = 10000;
const AUTOPLAY_GAP_MS = 900;

// ── Utilities ──────────────────────────────────────────────────────────────
function forceReflow(el) { void el.offsetWidth; }
function rnd(arr) { return arr[Math.floor(secureRandom() * arr.length)]; }

// ── Audio engine ───────────────────────────────────────────────────────────
let audioCtx = null;

function getCtx() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch (e) {
    return null;
  }
}

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

function soundClick()       { playNote(900, 0, 0.055, 0.10, 'sine'); }
function soundBetChange()   { playNote(700, 0, 0.045, 0.07, 'sine'); }
function soundLeverPull()   { playNoise(0, 0.05, 0.14); playNote(180, 0, 0.09, 0.22, 'sawtooth'); playNote(140, 0.07, 0.14, 0.18, 'sawtooth'); }
function soundLeverRelease(){ playNoise(0, 0.03, 0.07); playNote(480, 0, 0.04, 0.14, 'square'); playNote(660, 0.04, 0.03, 0.09, 'square'); }

function soundCoinAdd(amount) {
  const count = Math.min(6, Math.floor(Math.log10(Math.max(amount, 1))) + 2);
  const freqs = [880, 1047, 1319, 1047, 1174, 1397];
  for (let i = 0; i < count; i++) playNote(freqs[i], i * 0.07, 0.10, 0.16, 'sine');
  playNoise(0, 0.04, 0.05);
}

function soundSpinStart()  { playNote(300, 0, 0.07, 0.16, 'sawtooth'); playNote(260, 0.06, 0.07, 0.10, 'sawtooth'); }
function soundTick()       { playNote(900, 0, 0.022, 0.035, 'square'); }
function soundLose()       { playNote(280, 0, 0.18, 0.28, 'sawtooth'); playNote(175, 0.18, 0.32, 0.28, 'sawtooth'); }
function soundPair()       { playNote(440, 0, 0.12, 0.20, 'sine'); playNote(554, 0.14, 0.18, 0.20, 'sine'); }
function soundWin()        { playNote(523, 0, 0.10, 0.26, 'sine'); playNote(659, 0.11, 0.10, 0.26, 'sine'); playNote(784, 0.22, 0.22, 0.28, 'sine'); }
function soundBigWin()     { playNote(523, 0, 0.10, 0.28, 'sine'); playNote(659, 0.11, 0.10, 0.28, 'sine'); playNote(784, 0.22, 0.10, 0.28, 'sine'); playNote(1047, 0.33, 0.38, 0.32, 'sine'); }
function soundJackpot()    { const m = [523, 659, 784, 1047, 784, 1047, 1319]; m.forEach(function (f, i) { playNote(f, i * 0.13, 0.18, 0.30, 'sine'); }); playNote(130, 0, 0.5, 0.22, 'triangle'); }
function soundNearMiss()   { playNote(440, 0, 0.06, 0.20, 'sine'); playNote(330, 0.06, 0.06, 0.20, 'sine'); playNote(220, 0.14, 0.22, 0.22, 'sawtooth'); }
function soundReset()      { playNote(440, 0, 0.10, 0.18, 'sine'); playNote(330, 0.12, 0.10, 0.18, 'sine'); playNote(220, 0.24, 0.20, 0.18, 'sine'); }
function soundBroke()      { playNote(220, 0, 0.30, 0.28, 'sawtooth'); playNote(110, 0.28, 0.50, 0.28, 'sawtooth'); }
function soundWheelTick()  { playNote(600, 0, 0.03, 0.12, 'square'); }
function soundWheelStop()  { playNote(880, 0, 0.08, 0.25, 'sine'); playNote(1047, 0.09, 0.12, 0.25, 'sine'); playNote(1319, 0.22, 0.30, 0.28, 'sine'); }
function soundWild()       { playNote(660, 0, 0.08, 0.22, 'sine'); playNote(880, 0.06, 0.08, 0.22, 'sine'); playNote(1100, 0.12, 0.08, 0.22, 'sine'); playNote(1320, 0.18, 0.15, 0.26, 'sine'); }
function soundScatter()    { playNote(1047, 0, 0.06, 0.20, 'sine'); playNote(1319, 0.07, 0.06, 0.20, 'sine'); playNote(1568, 0.14, 0.12, 0.24, 'sine'); playNoise(0, 0.08, 0.06); }
function soundMultiplier() { playNote(220, 0, 0.10, 0.24, 'sawtooth'); playNote(440, 0.08, 0.10, 0.26, 'sawtooth'); playNote(880, 0.16, 0.18, 0.28, 'sine'); playNoise(0, 0.06, 0.10); }
function soundFreeSpins()  { const m = [523, 659, 784, 1047, 1319, 1568]; m.forEach(function (f, i) { playNote(f, i * 0.10, 0.14, 0.26, 'sine'); }); playNoise(0.3, 0.08, 0.08); }

const SOUND_MAP = {
  click: soundClick, betChange: soundBetChange, leverPull: soundLeverPull,
  leverRelease: soundLeverRelease, coinAdd: soundCoinAdd, spinStart: soundSpinStart,
  tick: soundTick, lose: soundLose, pair: soundPair, win: soundWin,
  bigWin: soundBigWin, jackpot: soundJackpot, nearMiss: soundNearMiss,
  reset: soundReset, broke: soundBroke, wheelTick: soundWheelTick,
  wheelStop: soundWheelStop, wild: soundWild, scatter: soundScatter,
  multiplier: soundMultiplier, freeSpins: soundFreeSpins,
};

function playSound(name) {
  if (!STATE.soundEnabled) return;
  try {
    const fn = SOUND_MAP[name];
    if (fn) fn.apply(null, Array.prototype.slice.call(arguments, 1));
  } catch (e) {
    console.warn('Sound "' + name + '" failed:', e);
  }
}

// ── Speech Synthesis ───────────────────────────────────────────────────────
let speechVoice = null;

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
    console.warn('Speech failed:', e);
  }
}

function toggleSpeech() {
  STATE.speechEnabled = !STATE.speechEnabled;
  syncSpeechUI();
  if (STATE.speechEnabled) {
    speak('Voice enabled. Welcome to Safari Casino.');
  }
  playSound('click');
}

function syncSpeechUI() {
  const btn = document.getElementById('speech-toggle');
  const checkbox = document.getElementById('setting-voice');
  if (STATE.speechEnabled) {
    btn.classList.add('active');
    btn.innerHTML = '\u{1F50A} Voice';
  } else {
    btn.classList.remove('active');
    btn.innerHTML = '\u{1F507} Voice';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  if (checkbox) checkbox.checked = STATE.speechEnabled;
}

// ── Background canvas ──────────────────────────────────────────────────────
const bgCanvas = document.getElementById('bg');
const bgCtx = bgCanvas.getContext('2d');
let embers = [];

const EMBER_COUNT = 60;

function Ember() {
  this.x = Math.random() * window.innerWidth;
  this.y = Math.random() * window.innerHeight;
  this.vx = (Math.random() - 0.5) * 0.5;
  this.vy = -Math.random() * 0.8 - 0.2;
  this.r = Math.random() * 2 + 0.5;
  this.phase = Math.random() * Math.PI * 2;
  this.wobble = Math.random() * 0.05;
}

Ember.prototype.update = function () {
  this.x += this.vx + Math.sin(this.phase) * 0.5;
  this.y += this.vy;
  this.phase += this.wobble;
  if (this.y < -10) {
    this.y = window.innerHeight + 10;
    this.x = Math.random() * window.innerWidth;
  }
  if (this.x < -10) this.x = window.innerWidth + 10;
  if (this.x > window.innerWidth + 10) this.x = -10;
};

function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  const cc = document.getElementById('confetti-canvas');
  cc.width = window.innerWidth;
  cc.height = window.innerHeight;
}

function initBgNodes() {
  embers = [];
  for (let i = 0; i < EMBER_COUNT; i++) embers.push(new Ember());
}

function drawBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  const rgb = '255, 170, 50';

  embers.forEach(function (e) {
    let alpha = 0.4 + Math.sin(e.phase) * 0.3;
    bgCtx.fillStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
    bgCtx.beginPath();
    bgCtx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    bgCtx.fill();
    e.update();
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

function spawnConfetti(count) {
  confettiParticles = [];
  const colors = ['#ffd700', '#d4af37', '#c0392b', '#27ae60', '#f5e6c8', '#8b4513', '#f39c12', '#b8860b'];
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
function screenFlash(color, fadeMs) {
  const el = document.getElementById('screen-flash');
  el.style.background = color;
  el.style.transition = 'opacity 0s';
  el.style.opacity = '0.35';
  setTimeout(function () {
    el.style.transition = 'opacity ' + (fadeMs || 600) + 'ms ease';
    el.style.opacity = '0';
  }, 60);
}

// ── Coin rain ──────────────────────────────────────────────────────────────
function spawnCoinRain(count) {
  for (let i = 0; i < count; i++) {
    (function (idx) {
      setTimeout(function () {
        const el = document.createElement('div');
        el.className = 'coin-rain';
        el.textContent = String.fromCodePoint(0x1FA99);
        el.style.left = Math.random() * 98 + 'vw';
        el.style.fontSize = (14 + Math.random() * 18) + 'px';
        el.style.animationDuration = (0.9 + Math.random() * 0.9) + 's';
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 2200);
      }, idx * 55);
    })(i);
  }
}

function spawnCoins(amount) {
  const count = Math.min(8, Math.floor(Math.log10(Math.max(amount, 1))) + 3);
  const balEl = document.getElementById('balance');
  const rect = balEl.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    (function (idx) {
      const el = document.createElement('div');
      el.className = 'coin-particle';
      el.textContent = String.fromCodePoint(0x1FA99);
      el.style.left = (rect.left + Math.random() * rect.width) + 'px';
      el.style.top = (rect.top + rect.height / 2) + 'px';
      el.style.animationDelay = (idx * 0.065) + 's';
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 1100 + idx * 70);
    })(i);
  }
}

// ── Progressive jackpot ────────────────────────────────────────────────────
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

function saveProgressiveJackpot() {
  try {
    localStorage.setItem(JACKPOT_STORAGE_KEY, String(STATE.progressiveJackpot));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

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

  setMsg('+' + amount.toLocaleString() + ' chips added. The hunt continues!', '');
  clearBetAdjustNotice();
  updateSpinAvailability();
}

function openFundsModal() {
  document.getElementById('funds-modal').classList.add('show');
  clearCustomFundsError();
  setTimeout(function () {
    const inp = document.getElementById('custom-amount');
    inp.value = '';
    inp.focus();
  }, 60);
}

function closeFundsModal() {
  document.getElementById('funds-modal').classList.remove('show');
  clearCustomFundsError();
}

function addFundsAndClose(amount) {
  addFunds(amount);
  closeFundsModal();
}

function clearCustomFundsError() {
  const el = document.getElementById('custom-funds-error');
  if (!el) return;
  el.textContent = '';
  el.classList.remove('show');
}

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
    errorEl.textContent = 'Amount must be between 1 and ' + MAX_CUSTOM_FUNDS.toLocaleString() + '.';
    errorEl.classList.add('show');
    return;
  }
  clearCustomFundsError();
  addFundsAndClose(val);
}

// ── Paytable Modal ─────────────────────────────────────────────────────────
function openPaytableModal() {
  document.getElementById('paytable-modal').classList.add('show');
  playSound('click');
}

function closePaytableModal() {
  document.getElementById('paytable-modal').classList.remove('show');
}

// ── Bonus Wheel ────────────────────────────────────────────────────────────
const WHEEL_PRIZES = [
  { label: '50 CHIPS',  value: 50,   color: '#27ae60' },
  { label: '100 CHIPS', value: 100,  color: '#2980b9' },
  { label: 'SORRY',     value: 0,    color: '#2a1500' },
  { label: '250 CHIPS', value: 250,  color: '#d4af37' },
  { label: '\xD72 BET', value: -2,   color: '#ffd700' },
  { label: '1K CHIPS',  value: 1000, color: '#c0392b' },
  { label: 'FREE!',     value: -99,  color: '#f39c12' },
  { label: '\xD75 BET', value: -5,   color: '#9b1b30' },
];

let wheelAngle = 0;
let wheelSpinning = false;
let lastWheelTick = -1;

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

  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = '#0e0700';
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
    ctx.strokeStyle = '#1c0e02';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = i === 2 ? '#5a3010' : '#0e0700';
    ctx.font = 'bold 11px "Space Mono", monospace';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(prize.label, r - 6, 4);
    ctx.restore();
  });

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
  grad.addColorStop(0, '#4a2c08');
  grad.addColorStop(1, '#1a0900');
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

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

function awardWheelPrize(prize) {
  const betVal = parseInt(document.getElementById('bet').value) || 10;
  let amount = 0;
  let resultText;

  if (prize.value > 0) {
    amount = prize.value;
    resultText = '+' + amount + ' bonus chips awarded!';
  } else if (prize.value === -2) {
    amount = betVal * 2;
    resultText = '2\xD7 your bet! +' + amount + ' chips!';
  } else if (prize.value === -5) {
    amount = betVal * 5;
    resultText = '5\xD7 your bet! +' + amount + ' chips!';
  } else if (prize.value === -99) {
    STATE.freeSpin = true;
    resultText = 'FREE SPIN! Next spin is on the house.';
  } else {
    resultText = 'Nothing this time. Fortune smiles elsewhere!';
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

  speak('Bonus wheel result: ' + resultText.replace(/[+\xD7]/g, ''));
}

function openBonusModal() {
  document.getElementById('bonus-spin-num').textContent = STATE.spinCount;
  document.getElementById('wheel-result').textContent = '';
  document.getElementById('wheel-close-btn').style.display = 'none';
  document.getElementById('wheel-spin-btn').disabled = false;
  lastWheelTick = -1;
  drawWheel(wheelAngle);
  document.getElementById('bonus-modal').classList.add('show');
}

function closeBonusModal() {
  document.getElementById('bonus-modal').classList.remove('show');
}

// ── Lever ──────────────────────────────────────────────────────────────────
function leverSpin() {
  if (STATE.spinning || STATE.leverActive) return;
  STATE.leverActive = true;
  const arm = document.getElementById('lever-arm');
  arm.classList.remove('releasing');
  void arm.offsetWidth; // flush any pending animation
  arm.classList.add('pulling');
  playSound('leverPull');
  setTimeout(function () {
    spin().then(function () {
      arm.classList.remove('pulling');
      void arm.offsetWidth; // flush so releasing keyframe starts from pulled position
      arm.classList.add('releasing');
      playSound('leverRelease');
      setTimeout(function () {
        arm.classList.remove('releasing');
        STATE.leverActive = false;
      }, 480);
    });
  }, 180);
}

// ── Bet helpers ────────────────────────────────────────────────────────────
function clampBet(val) { return Math.min(Math.max(1, val), STATE.balance); }

function reclampBet() {
  const inp = document.getElementById('bet');
  const old = parseInt(inp.value) || 1;
  const target = STATE.balance > 0 ? Math.max(1, Math.min(old, STATE.balance)) : 1;
  if (target !== old) inp.value = target;
  return { adjusted: target < old, oldValue: old, newValue: target };
}

function showBetAdjustNotice(oldVal, newVal) {
  const el = document.getElementById('bet-adjust-note');
  if (!el) return;
  el.textContent = 'Bet adjusted from ' + oldVal + ' to ' + newVal + ' \u2014 balance too low.';
  el.classList.add('show');
}

function clearBetAdjustNotice() {
  const el = document.getElementById('bet-adjust-note');
  if (!el) return;
  el.classList.remove('show');
  el.textContent = '';
}

function updateSpinAvailability() {
  if (STATE.spinning) return;
  const noFunds = STATE.balance <= 0;
  document.getElementById('spin-btn').disabled = noFunds;
  document.querySelectorAll('.bet-preset').forEach(function (b) { b.disabled = noFunds; });
  document.getElementById('bet').disabled = noFunds;
  const autoplayBtn = document.getElementById('autoplay-btn');
  if (autoplayBtn) autoplayBtn.disabled = noFunds && !AUTOPLAY.active;
}

function setBet(val) {
  playSound('click');
  document.getElementById('bet').value = clampBet(val);
  clearBetAdjustNotice();
}

function setBetMax() {
  playSound('click');
  document.getElementById('bet').value = STATE.balance;
  clearBetAdjustNotice();
}

// ── Reel rendering ─────────────────────────────────────────────────────────
function makeReelCell(symbol) {
  const cell = document.createElement('div');
  cell.className = 'reel-cell';
  const symDiv = document.createElement('div');
  symDiv.className = 'reel-sym';
  symDiv.textContent = symbol.sym;
  const lblDiv = document.createElement('div');
  lblDiv.className = 'reel-lbl';
  lblDiv.textContent = symbol.lbl;
  cell.appendChild(symDiv);
  cell.appendChild(lblDiv);
  return cell;
}

function buildReel(id) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  el.appendChild(makeReelCell(STRIP[STRIP.length - 1]));
  STRIP.forEach(function (s) { el.appendChild(makeReelCell(s)); });
  el.appendChild(makeReelCell(STRIP[0]));
}

function initReels() {
  [0, 1, 2].forEach(function (i) {
    buildReel('reel' + i);
    const inner = document.getElementById('reel' + i);
    inner.style.transition = '';
    inner.style.transform = 'translateY(0)';
    document.getElementById('reel-wrap-' + i).className = 'reel-wrap';
    ['top', 'mid', 'bot'].forEach(function (row) {
      const el = document.getElementById('rh-' + i + '-' + row);
      if (el) el.className = 'row-highlight row-highlight-' + row;
    });
  });
  [0, 1, 2].forEach(function (lineIdx) {
    ['pl-mark-' + lineIdx, 'pl-mark-r' + lineIdx].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('winning');
    });
  });
}

function animateReel(reelEl, targetStripPos, duration, delay) {
  return new Promise(function (resolve) {
    const speed = getSpinSpeed();
    const scaledDelay = delay / speed;
    setTimeout(function () {
      const totalCells = STRIP.length + 2;
      const loops = Math.max(1, Math.floor(duration / 80));
      const frameMs = Math.max(8, Math.floor(40 / speed));
      const settleTransition = (0.28 / speed).toFixed(3) + 's';
      const settleDelay = Math.max(60, Math.floor(300 / speed));
      let frame = 0;
      let pos = 0;
      reelEl.style.transition = '';

      const interval = setInterval(function () {
        const currentCellHeight = getCellHeight();
        pos = (pos + currentCellHeight) % (totalCells * currentCellHeight);
        reelEl.style.transform = 'translateY(-' + pos + 'px)';
        frame++;
        if (frame % 5 === 0) playSound('tick');

        if (frame >= loops) {
          clearInterval(interval);
          const offset = targetStripPos * currentCellHeight;
          reelEl.style.transition = 'transform ' + settleTransition + ' cubic-bezier(0.25,0.8,0.5,1)';
          reelEl.style.transform = 'translateY(-' + offset + 'px)';
          setTimeout(resolve, settleDelay);
        }
      }, frameMs);
    }, scaledDelay);
  });
}

// ── Payout logic ───────────────────────────────────────────────────────────
const PAYOUT_TABLE = {
  DIAMOND_TRIPLE:     150,
  LION_TRIPLE:         50,
  JAGUAR_TRIPLE:       40,
  CROWN_TRIPLE:        30,
  COIN_TRIPLE:         25,
  GENERIC_TRIPLE:      15,
  SAFARI_TRIO:         25,
  ROYAL_HUNT:          18,
  JUNGLE_CROWN:        15,
  GOLDEN_EMPIRE:       12,
  WILD_SAFARI:         10,
  PAIR:                 2,
  SCATTER_2:            5,
  SCATTER_3:           20,
  MULTIPLIER_FACTOR:    2,
};

function basePayoutCheck(labels) {
  const a = labels[0], b = labels[1], c = labels[2];
  const has = function (l) { return labels.indexOf(l) !== -1; };

  if (a === b && b === c) {
    if (a === 'DIAMOND') return { mult: PAYOUT_TABLE.DIAMOND_TRIPLE, type: 'jackpot', combo: 'DIAMOND JACKPOT',   msgKey: 'jackpot' };
    if (a === 'LION')    return { mult: PAYOUT_TABLE.LION_TRIPLE,    type: 'bigwin',  combo: 'LION PRIDE',        msgKey: 'lion_triple' };
    if (a === 'JAGUAR')  return { mult: PAYOUT_TABLE.JAGUAR_TRIPLE,  type: 'bigwin',  combo: 'JAGUAR HUNT',       msgKey: 'jaguar_triple' };
    if (a === 'CROWN')   return { mult: PAYOUT_TABLE.CROWN_TRIPLE,   type: 'bigwin',  combo: 'ROYAL FLUSH',       msgKey: 'crown_triple' };
    if (a === 'COIN')    return { mult: PAYOUT_TABLE.COIN_TRIPLE,    type: 'bigwin',  combo: 'GOLD RUSH',         msgKey: 'coin_triple' };
    return { mult: PAYOUT_TABLE.GENERIC_TRIPLE, type: 'win', combo: 'SAFARI 3X', msgKey: 'win' };
  }

  if (has('DIAMOND') && has('LION')   && has('JAGUAR'))
    return { mult: PAYOUT_TABLE.SAFARI_TRIO,   type: 'bigwin', combo: 'SAFARI TRIO',    msgKey: 'safari_trio' };
  if (has('DIAMOND') && has('JAGUAR') && has('CROWN'))
    return { mult: PAYOUT_TABLE.ROYAL_HUNT,    type: 'win',    combo: 'ROYAL HUNT',     msgKey: 'royal_hunt' };
  if (has('LION')    && has('JAGUAR') && has('CROWN'))
    return { mult: PAYOUT_TABLE.JUNGLE_CROWN,  type: 'win',    combo: 'JUNGLE CROWN',   msgKey: 'jungle_crown' };
  if (has('CROWN')   && has('COIN')   && has('TROPHY'))
    return { mult: PAYOUT_TABLE.GOLDEN_EMPIRE, type: 'win',    combo: 'GOLDEN EMPIRE',  msgKey: 'golden_empire' };
  if (has('JAGUAR')  && has('BOLT')   && has('TARGET'))
    return { mult: PAYOUT_TABLE.WILD_SAFARI,   type: 'win',    combo: 'WILD SAFARI',    msgKey: 'wild_safari' };

  if (a === b || b === c || a === c)
    return { mult: PAYOUT_TABLE.PAIR, type: 'pair', combo: 'PAIR', msgKey: 'pair' };

  return { mult: 0, type: 'lose', combo: 'NO MATCH', msgKey: 'lose' };
}

function resolveWilds(labels) {
  const wildPositions = [];
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === 'WILD') wildPositions.push(i);
  }
  if (wildPositions.length === 0) return { resolved: labels, wildHelped: false };

  let bestLabels = labels.slice();
  let bestMult = 0;

  function tryAll(pos, current) {
    if (pos >= wildPositions.length) {
      const result = basePayoutCheck(current);
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

function calcPayout(indices) {
  const labels = indices.map(function (i) { return SYMBOLS[i].lbl; });

  const scatterCount = labels.filter(function (l) { return l === 'SCATTER'; }).length;
  let scatterPay = 0;
  let freeSpinsAwarded = 0;
  if (scatterCount === 2) {
    scatterPay = PAYOUT_TABLE.SCATTER_2;
  } else if (scatterCount >= 3) {
    scatterPay = PAYOUT_TABLE.SCATTER_3;
    freeSpinsAwarded = SCATTER_FREE_SPINS;
  }

  const hasMultiplier = labels.indexOf('MULTIPLIER') !== -1;
  const wildResult = resolveWilds(labels);
  let basePayout;

  if (wildResult.wildHelped) {
    basePayout = basePayoutCheck(wildResult.resolved);
    basePayout.combo = '\u{1F0CF} WILD ' + basePayout.combo;
    basePayout.wildUsed = true;
  } else {
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

  if (hasMultiplier && basePayout.mult > 0) {
    basePayout.mult *= PAYOUT_TABLE.MULTIPLIER_FACTOR;
    basePayout.combo = '\u{1F525}2\u00D7 ' + basePayout.combo;
    if (basePayout.type === 'pair') basePayout.type = 'win';
    if (basePayout.type === 'win')  basePayout.type = 'bigwin';
  }

  basePayout.mult += scatterPay;
  basePayout.scatterPay = scatterPay;
  basePayout.hasMultiplier = hasMultiplier;
  basePayout.freeSpinsAwarded = freeSpinsAwarded;

  if (basePayout.type === 'lose' && scatterPay > 0) {
    basePayout.type = 'win';
    basePayout.combo = '\u2B50 SCATTER';
    basePayout.msgKey = 'scatter';
  }

  if (freeSpinsAwarded > 0) {
    basePayout.combo += ' +' + freeSpinsAwarded + ' FREE';
    basePayout.msgKey = 'freespins';
  }

  return basePayout;
}

// ── Near-miss detection ────────────────────────────────────────────────────
function checkNearMiss(indices) {
  const HIGH_VALUE = ['DIAMOND', 'LION', 'JAGUAR'];
  const highCount = indices.filter(function (i) {
    return HIGH_VALUE.indexOf(SYMBOLS[i].lbl) !== -1;
  }).length;
  return highCount >= 2;
}

// ── Payline helpers ────────────────────────────────────────────────────────
function getRowSymbolIndices(stripPositions) {
  const len = STRIP.length;
  return stripPositions.map(function (sp) {
    return [
      STRIP_SYMBOL_IDX[(sp - 1 + len) % len],
      STRIP_SYMBOL_IDX[sp],
      STRIP_SYMBOL_IDX[(sp + 1) % len],
    ];
  });
}

function setPaylineHighlights(winningLines, paylineResultsArg) {
  const rowNames = ['top', 'mid', 'bot'];
  [0, 1, 2].forEach(function (reelIdx) {
    rowNames.forEach(function (rowName) {
      const el = document.getElementById('rh-' + reelIdx + '-' + rowName);
      if (el) el.className = 'row-highlight row-highlight-' + rowName;
    });
  });
  winningLines.forEach(function (lineIdx) {
    const rowName = rowNames[lineIdx];
    const winType = paylineResultsArg[lineIdx].type;
    const colorCls = { jackpot: 'jackpot', bigwin: 'bigwin', win: 'win', pair: 'pair' }[winType] || 'win';
    [0, 1, 2].forEach(function (reelIdx) {
      const el = document.getElementById('rh-' + reelIdx + '-' + rowName);
      if (el) el.classList.add(colorCls);
    });
  });
  [0, 1, 2].forEach(function (lineIdx) {
    const isWin = winningLines.indexOf(lineIdx) !== -1;
    ['pl-mark-' + lineIdx, 'pl-mark-r' + lineIdx].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('winning', isWin);
    });
  });
}

// ── UI helpers ─────────────────────────────────────────────────────────────
function setMsg(text, cls) {
  const el = document.getElementById('msg');
  el.innerHTML = text;
  el.className = cls ? 'msg-box ' + cls : 'msg-box';
}

function setMachineGlow(type) {
  const machine = document.getElementById('machine');
  const glowMap = { jackpot: 'glow-jackpot', bigwin: 'glow-bigwin', win: 'glow-win', pair: 'glow-pair', lose: 'glow-lose' };
  machine.className = glowMap[type] ? 'machine ' + glowMap[type] : 'machine';
  setTimeout(function () { machine.className = 'machine'; }, 2400);
}

function updateUI() {
  document.getElementById('balance').textContent = STATE.balance.toLocaleString();
  document.getElementById('won').textContent = STATE.totalWon.toLocaleString();
  document.getElementById('burned').textContent = STATE.totalBurned.toLocaleString();
  document.getElementById('spins').textContent = STATE.spinCount.toLocaleString();

  const rtpEl = document.getElementById('rtp-display');
  if (rtpEl) {
    if (STATE.totalWagered > 0) {
      const sessionRTP = (STATE.totalReturned / STATE.totalWagered) * 100;
      rtpEl.textContent = sessionRTP.toFixed(1) + '%';
      rtpEl.style.color = sessionRTP >= TARGET_RTP * 100 - 5 ? 'var(--win)' : 'var(--lose)';
    } else {
      rtpEl.textContent = '\u2014';
      rtpEl.style.color = 'var(--muted)';
    }
  }
}

var HISTORY_MAX = 100;

function addHistory(indices, bet, winAmt, type, combo) {
  var syms = indices.map(function (i) { return SYMBOLS[i].sym; }).join(' ');
  var ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  STATE.spinHistory.unshift({ syms: syms, bet: bet, winAmt: winAmt, type: type, combo: combo, ts: ts });
  if (STATE.spinHistory.length > HISTORY_MAX) STATE.spinHistory.length = HISTORY_MAX;
  STATE.totalBetSum += bet;
  if (winAmt > STATE.biggestWin) STATE.biggestWin = winAmt;
}

function setSpinButtonsDisabled(disabled) {
  document.getElementById('spin-btn').disabled = disabled;
  document.querySelectorAll('.bet-preset').forEach(function (b) { b.disabled = disabled; });
  document.getElementById('bet').disabled = disabled;
}

// ── Tiered celebration ─────────────────────────────────────────────────────
function celebrate(type, winAmt, bet) {
  const balEl = document.getElementById('balance');

  if (type === 'jackpot') {
    spawnConfetti(180);
    spawnCoinRain(30);
    screenFlash('rgba(255,215,0,0.4)', 800);
    setTimeout(function () { screenFlash('rgba(255,215,0,0.25)', 600); }, 500);
    balEl.classList.add('jackpot-flash');
    setTimeout(function () { balEl.classList.remove('jackpot-flash'); }, 1200);
    const pj = STATE.progressiveJackpot;
    resetProgressiveJackpot();
    if (pj > INITIAL_JACKPOT) {
      STATE.balance += pj;
      STATE.totalWon += pj;
      updateUI();
      setTimeout(function () {
        setMsg(document.getElementById('msg').innerHTML + ' <span style="color:var(--jackpot);font-weight:700">+' + pj.toLocaleString() + ' JACKPOT POOL!</span>', 'jackpot');
      }, 300);
    }

  } else if (type === 'bigwin') {
    screenFlash('rgba(243,156,18,0.25)', 600);
    if (winAmt >= bet * 10) spawnCoinRain(Math.min(20, Math.floor(winAmt / 50)));
    else spawnCoinRain(8);
    balEl.classList.add('jackpot-flash');
    setTimeout(function () { balEl.classList.remove('jackpot-flash'); }, 1200);

  } else if (type === 'win') {
    if (winAmt >= bet * 6) spawnCoinRain(6);
    screenFlash('rgba(39,174,96,0.10)', 400);

  } else if (type === 'pair') {
    screenFlash('rgba(41,128,185,0.07)', 300);
  }

  if (type !== 'lose') {
    balEl.classList.remove('balance-pop');
    forceReflow(balEl);
    balEl.classList.add('balance-pop');
    setTimeout(function () { balEl.classList.remove('balance-pop'); }, 600);
  }
}

// ── Autoplay ───────────────────────────────────────────────────────────────
function anyBlockingModalOpen() {
  const ids = ['bonus-modal', 'funds-modal', 'paytable-modal', 'autoplay-modal', 'history-modal', 'stats-modal', 'settings-modal', 'rewards-modal', 'progression-modal', 'themes-modal', 'leaderboard-modal', 'arena-modal', 'send-chips-modal'];
  return ids.some(function (id) {
    const el = document.getElementById(id);
    return el && el.classList.contains('show');
  });
}

function updateAutoplayUI() {
  const btn = document.getElementById('autoplay-btn');
  if (!btn) return;
  if (AUTOPLAY.active) {
    btn.classList.add('running');
    btn.innerHTML = '⏹ Stop <span class="autoplay-count">' + AUTOPLAY.remaining + ' left</span>';
    btn.title = 'Click to stop autoplay';
  } else {
    btn.classList.remove('running');
    btn.innerHTML = '<span class="autoplay-btn-label">▶▶ Autoplay</span>';
    btn.title = 'Run multiple spins automatically';
  }
}

function startAutoplay(count) {
  if (AUTOPLAY.active) return;
  if (!Number.isFinite(count) || count < 1) return;
  if (STATE.balance <= 0) {
    setMsg('No chips available. Refill before starting autoplay.', 'lose');
    return;
  }
  AUTOPLAY.active = true;
  AUTOPLAY.total = Math.floor(count);
  AUTOPLAY.remaining = Math.floor(count);
  updateAutoplayUI();
  setMsg('Autoplay started. ' + AUTOPLAY.remaining + ' spins queued.', '');
  speak('Autoplay started. ' + AUTOPLAY.remaining + ' spins queued.');
  runAutoplayNext();
}

function stopAutoplay(reason, cls) {
  const wasActive = AUTOPLAY.active;
  AUTOPLAY.active = false;
  AUTOPLAY.remaining = 0;
  updateAutoplayUI();
  updateSpinAvailability();
  if (wasActive && reason) setMsg(reason, cls || '');
}

function runAutoplayNext() {
  if (!AUTOPLAY.active) return;
  if (AUTOPLAY.remaining <= 0) {
    stopAutoplay('Autoplay complete. The safari rests.', '');
    speak('Autoplay complete.');
    return;
  }
  if (STATE.balance <= 0) {
    stopAutoplay('Out of chips. Autoplay stopped.', 'lose');
    speak('Out of chips. Autoplay stopped.');
    return;
  }
  if (STATE.spinning || STATE.leverActive) {
    setTimeout(runAutoplayNext, 200);
    return;
  }
  if (anyBlockingModalOpen()) {
    setTimeout(runAutoplayNext, 400);
    return;
  }
  const betInput = document.getElementById('bet');
  const bet = Math.max(1, parseInt(betInput.value) || 1);
  if (bet > STATE.balance) {
    stopAutoplay('Bet exceeds balance. Autoplay stopped.', 'lose');
    return;
  }

  AUTOPLAY.remaining--;
  updateAutoplayUI();

  spin().then(function () {
    if (!AUTOPLAY.active) return;
    setTimeout(runAutoplayNext, AUTOPLAY_GAP_MS);
  }).catch(function () {
    stopAutoplay('Autoplay halted due to an error.', 'lose');
  });
}

function handleAutoplayButton() {
  if (AUTOPLAY.active) {
    stopAutoplay('Autoplay stopped. ' + AUTOPLAY.remaining + ' spins cancelled.', '');
    speak('Autoplay stopped.');
    playSound('click');
    return;
  }
  playSound('click');
  openAutoplayModal();
}

function openAutoplayModal() {
  clearAutoplayError();
  const input = document.getElementById('autoplay-custom');
  if (input) input.value = '';
  document.getElementById('autoplay-modal').classList.add('show');
  setTimeout(function () {
    if (input) input.focus();
  }, 60);
}

function closeAutoplayModal() {
  document.getElementById('autoplay-modal').classList.remove('show');
  clearAutoplayError();
}

function clearAutoplayError() {
  const el = document.getElementById('autoplay-error');
  if (!el) return;
  el.textContent = '';
  el.classList.remove('show');
}

function showAutoplayError(msg) {
  const el = document.getElementById('autoplay-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function confirmCustomAutoplay() {
  const input = document.getElementById('autoplay-custom');
  const raw = input.value.trim();
  const val = Number(raw);
  if (raw === '' || !Number.isFinite(val) || !Number.isInteger(val)) {
    showAutoplayError('Enter a whole number.');
    return;
  }
  if (val < 1 || val > AUTOPLAY_MAX_COUNT) {
    showAutoplayError('Pick between 1 and ' + AUTOPLAY_MAX_COUNT.toLocaleString() + ' spins.');
    return;
  }
  clearAutoplayError();
  closeAutoplayModal();
  startAutoplay(val);
}

function startAutoplayPreset(count) {
  closeAutoplayModal();
  startAutoplay(count);
}

// ── Main spin ──────────────────────────────────────────────────────────────
function spin() {
  if (STATE.spinning) return Promise.resolve();

  const betInput = document.getElementById('bet');
  const bet = Math.max(1, parseInt(betInput.value) || 1);

  if (bet > STATE.balance) {
    setMsg('Insufficient chips. Add more to continue the hunt.', 'lose');
    playSound('lose');
    speak('Insufficient chips. Add more to continue.');
    return Promise.resolve();
  }

  STATE.spinning = true;
  setSpinButtonsDisabled(true);

  if (!STATE.freeSpin && STATE.freeSpinBank > 0) {
    STATE.freeSpinBank--;
    STATE.freeSpin = true;
  }

  const wasFree = STATE.freeSpin;
  if (STATE.freeSpin) {
    STATE.freeSpin = false;
    setMsg('\u{1F381} FREE SPIN! The house pays for this round.', '');
  } else {
    STATE.balance -= bet;
  }

  STATE.spinCount++;
  updateUI();
  setMsg('The reels are spinning\u2026', '');
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
      return animateReel(document.getElementById('reel' + i), stripPositions[i], durations[i], delays[i]);
    })
  ).then(function () {
    const rowsByReel = getRowSymbolIndices(stripPositions);

    const rowIndices = Array.from({ length: REEL_ROWS }, function (_, i) { return i; });
    const paylineSymIdx = rowIndices.map(function (row) {
      return [rowsByReel[0][row], rowsByReel[1][row], rowsByReel[2][row]];
    });

    const lineBet = bet / ACTIVE_PAYLINES;
    const paylineResults = paylineSymIdx.map(function (idxs) {
      return calcPayout(idxs);
    });

    let totalWin = 0;
    let bestType = 'lose';
    let bestResult = paylineResults[1];
    const typeRank = { jackpot: 0, bigwin: 1, win: 2, pair: 3, lose: 4 };
    const winningLines = [];
    let freeSpinsTotal = 0;
    let wildUsedAny = false;
    let multiplierAny = false;
    let scatterAny = false;

    paylineResults.forEach(function (res, lineIdx) {
      const lineWin = res.mult > 0 ? Math.max(1, Math.floor(lineBet * res.mult)) : 0;
      if (lineWin > 0) {
        totalWin += lineWin;
        winningLines.push(lineIdx);
        const rank = typeRank[res.type] !== undefined ? typeRank[res.type] : 4;
        if (rank < (typeRank[bestType] !== undefined ? typeRank[bestType] : 4)) {
          bestType = res.type;
          bestResult = res;
        }
      }
      if (res.freeSpinsAwarded > 0 && freeSpinsTotal === 0) freeSpinsTotal = res.freeSpinsAwarded;
      if (res.wildUsed) wildUsedAny = true;
      if (res.hasMultiplier && res.mult > 0) multiplierAny = true;
      if (res.scatterPay > 0) scatterAny = true;
    });

    const winAmt = totalWin;
    let type = winningLines.length > 0 ? bestType : 'lose';
    const result = bestResult;
    const combo = result.combo;

    if (!wasFree) {
      STATE.totalWagered += bet;
      STATE.totalReturned += winAmt;
    }

    if (winAmt > 0) {
      STATE.balance += winAmt;
      STATE.totalWon += winAmt;
      STATE.currentWinStreak++;
      if (STATE.currentWinStreak > STATE.bestWinStreak) STATE.bestWinStreak = STATE.currentWinStreak;
    } else {
      STATE.currentWinStreak = 0;
    }

    if (type === 'lose') {
      updateProgressiveJackpot(Math.ceil(bet * JACKPOT_CONTRIBUTION_RATE));
      STATE.totalBurned += bet;
    }

    updateRewardProgress({ spun: true, won: winAmt > 0, bet: bet, bigWin: type === 'bigwin' || type === 'jackpot' });
    updateProgressionAfterSpin({ spun: true, won: winAmt > 0, bet: bet, bigWin: type === 'bigwin' || type === 'jackpot', jackpot: type === 'jackpot', winAmount: winAmt });

    const typeToSound = { jackpot: 'jackpot', bigwin: 'bigWin', win: 'win', pair: 'pair', lose: 'lose' };
    playSound(typeToSound[type] || 'lose');
    if (wildUsedAny) playSound('wild');
    if (multiplierAny) playSound('multiplier');
    if (scatterAny) playSound('scatter');
    if (freeSpinsTotal > 0) {
      setTimeout(function () { playSound('freeSpins'); }, 300);
    }

    [0, 1, 2].forEach(function (i) {
      const wrap = document.getElementById('reel-wrap-' + i);
      if (winningLines.indexOf(1) !== -1) wrap.classList.add('winner-reel');
      const lbl = SYMBOLS[paylineSymIdx[1][i]].lbl;
      if (lbl === 'WILD')       wrap.classList.add('wild-reel');
      if (lbl === 'SCATTER')    wrap.classList.add('scatter-reel');
      if (lbl === 'MULTIPLIER') wrap.classList.add('multiplier-reel');
    });

    setPaylineHighlights(winningLines, paylineResults);

    const pool = MSGS[result.msgKey] || MSGS[type] || MSGS.lose;
    const base = rnd(pool);
    let lineLabel = '';
    if (winningLines.length === 1) {
      lineLabel = ' <span style="opacity:0.6;font-size:9px">[LINE ' + (winningLines[0] + 1) + ']</span>';
    } else if (winningLines.length > 1) {
      lineLabel = ' <span style="opacity:0.6;font-size:9px">[LINES ' + winningLines.map(function (l) { return l + 1; }).join('+') + ']</span>';
    }

    let msg;
    if (type === 'lose') {
      msg = base + ' \u2212' + bet.toLocaleString() + ' chips.';
    } else if (type === 'pair') {
      msg = base + ' +' + winAmt.toLocaleString() + ' chips!' + lineLabel;
    } else {
      msg = '<span class="combo-badge">' + combo + '</span>' + base + ' +' + winAmt.toLocaleString() + ' chips!' + lineLabel;
    }

    const nearMiss = (type === 'lose') ? checkNearMiss(paylineSymIdx[1]) : false;
    if (nearMiss) {
      playSound('nearMiss');
      type = 'nearmiss';
      msg = '<span class="combo-badge">NEAR MISS</span>' + rnd(MSGS.nearmiss) + ' \u2212' + bet.toLocaleString() + ' chips.';
      const machine = document.getElementById('machine');
      machine.classList.add('shake-anim');
      setTimeout(function () { machine.classList.remove('shake-anim'); }, 600);
      [0, 1, 2].forEach(function (i) {
        const idx = paylineSymIdx[1][i];
        const wrap = document.getElementById('reel-wrap-' + i);
        const high = ['DIAMOND', 'LION', 'JAGUAR'];
        if (high.indexOf(SYMBOLS[idx].lbl) !== -1) wrap.classList.add('near-miss-reel');
      });
      speak(rnd(SPEECH.nearmiss));
    } else {
      const speechPool = SPEECH[result.msgKey] || SPEECH[type] || SPEECH.lose;
      if (speechPool) speak(rnd(speechPool));
    }

    setMsg(msg, type === 'nearmiss' ? 'nearmiss' : type);
    setMachineGlow(type === 'nearmiss' ? 'lose' : type);
    addHistory(paylineSymIdx[1], bet, winAmt, winningLines.length > 0 ? bestType : 'lose', combo);
    updateUI();

    try {
      celebrate(winningLines.length > 0 ? bestType : type, winAmt, bet);
    } catch (e) {
      console.warn('Celebration error:', e);
    }

    if (freeSpinsTotal > 0) {
      STATE.freeSpinBank = (STATE.freeSpinBank || 0) + freeSpinsTotal;
      setTimeout(function () {
        setMsg('\u2B50\u2B50\u2B50 ' + freeSpinsTotal + ' FREE SPINS awarded! ' + STATE.freeSpinBank + ' remaining.', 'win');
        speak(rnd(SPEECH.freespins));
      }, 400);
    }

    const reclamp = reclampBet();
    if (reclamp.adjusted) showBetAdjustNotice(reclamp.oldValue, reclamp.newValue);
    else clearBetAdjustNotice();

    if (STATE.balance <= 0) {
      playSound('broke');
      setTimeout(function () {
        setMsg('All chips are gone. Click \u21BA Refill to continue your safari.', 'lose');
      }, 400);
      speak('All chips are gone. Refill to continue your safari.');
    }

    unlockSpin();
    updateSpinAvailability();

    if (STATE.spinCount % BONUS_WHEEL_INTERVAL === 0) {
      setTimeout(openBonusModal, 800);
    }
  }).catch(function (e) {
    console.warn('Spin error:', e);
    unlockSpin();
    updateSpinAvailability();
    setMsg('Spin error. Please try again.', 'lose');
  });
}

// ── Reset ──────────────────────────────────────────────────────────────────
function resetGame() {
  playSound('reset');
  speak('Welcome back to Safari Casino. The hunt begins anew.');

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
  STATE.biggestWin = 0;
  STATE.totalBetSum = 0;
  STATE.currentWinStreak = 0;
  STATE.bestWinStreak = 0;

  resetProgressiveJackpot();

  document.getElementById('machine').className = 'machine';
  document.getElementById('bet').disabled = false;

  updateUI();
  initReels();
  setSpinButtonsDisabled(false);
  clearBetAdjustNotice();
  updateSpinAvailability();
  setMsg('Welcome back to Safari Casino. The hunt begins anew.', '');
}

// ── Event binding ──────────────────────────────────────────────────────────
document.getElementById('speech-toggle').addEventListener('click', toggleSpeech);

document.querySelectorAll('.funds-row .add-btn[data-amount]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    addFunds(parseInt(this.dataset.amount));
  });
});

document.getElementById('open-funds-modal-btn').addEventListener('click', function() {
  playSound('click');
  openFundsModal();
});

document.getElementById('funds-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closeFundsModal();
  }
});

document.querySelectorAll('.modal-preset[data-amount]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    addFundsAndClose(parseInt(this.dataset.amount));
  });
});

document.getElementById('confirm-custom-btn').addEventListener('click', function() {
  playSound('click');
  confirmCustomFunds();
});
document.getElementById('cancel-funds-btn').addEventListener('click', function() {
  playSound('click');
  closeFundsModal();
});

document.getElementById('custom-amount').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    playSound('click');
    confirmCustomFunds();
  }
  if (e.key === 'Escape') {
    playSound('click');
    closeFundsModal();
  }
});

document.getElementById('custom-amount').addEventListener('input', clearCustomFundsError);

document.getElementById('open-paytable-btn').addEventListener('click', openPaytableModal);
document.getElementById('close-paytable-btn').addEventListener('click', function() {
  playSound('click');
  closePaytableModal();
});
document.getElementById('paytable-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closePaytableModal();
  }
});

document.getElementById('spin-btn').addEventListener('click', function () { playSound('click'); spin(); });
document.getElementById('reset-btn').addEventListener('click', function () {
  if (AUTOPLAY.active) stopAutoplay('Autoplay stopped — game reset.', '');
  resetGame();
});

document.getElementById('autoplay-btn').addEventListener('click', handleAutoplayButton);

document.querySelectorAll('.autoplay-preset').forEach(function (btn) {
  btn.addEventListener('click', function () {
    playSound('click');
    startAutoplayPreset(parseInt(this.dataset.count));
  });
});

document.getElementById('autoplay-confirm-btn').addEventListener('click', function () {
  playSound('click');
  confirmCustomAutoplay();
});

document.getElementById('autoplay-cancel-btn').addEventListener('click', function () {
  playSound('click');
  closeAutoplayModal();
});

document.getElementById('autoplay-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closeAutoplayModal();
  }
});

document.getElementById('autoplay-custom').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    playSound('click');
    confirmCustomAutoplay();
  }
  if (e.key === 'Escape') {
    playSound('click');
    closeAutoplayModal();
  }
});

document.getElementById('autoplay-custom').addEventListener('input', clearAutoplayError);

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

document.getElementById('bet-minus').addEventListener('click', function () {
  playSound('click');
  const inp = document.getElementById('bet');
  let val = parseInt(inp.value) || 1;
  val = Math.max(1, val - 1);
  inp.value = clampBet(val);
  clearBetAdjustNotice();
});

document.getElementById('bet-plus').addEventListener('click', function () {
  playSound('click');
  const inp = document.getElementById('bet');
  let val = parseInt(inp.value) || 1;
  val = Math.min(STATE.balance, val + 1);
  inp.value = clampBet(val);
  clearBetAdjustNotice();
});

document.querySelectorAll('.bet-preset').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const val = this.dataset.bet;
    if (val === 'max') setBetMax();
    else setBet(parseInt(val));
  });
});

document.getElementById('lever-wrap').addEventListener('click', leverSpin);
document.getElementById('lever-wrap').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    leverSpin();
  }
});

document.getElementById('wheel-spin-btn').addEventListener('click', function() {
  playSound('click');
  spinBonusWheel();
});
document.getElementById('wheel-close-btn').addEventListener('click', function() {
  playSound('click');
  closeBonusModal();
});

// ── Fast Spin / speed chooser ──────────────────────────────────────────────
function updateFastSpinUI() {
  const btn = document.getElementById('fast-spin-btn');
  if (!btn) return;
  const speed = getSpinSpeed();
  const label = btn.querySelector('.fast-spin-btn-label');
  if (label) {
    label.textContent = speed === 1 ? 'Fast Spin' : 'Fast ' + speed + '×';
  }
  btn.classList.toggle('active', speed !== 1);
  btn.setAttribute('data-speed', String(speed));
  btn.title = speed === 1
    ? 'Speed up reel animation'
    : 'Current speed: ' + speed + '× — click to change';
  document.querySelectorAll('.fast-spin-preset').forEach(function (p) {
    const s = parseInt(p.dataset.speed);
    p.classList.toggle('active', s === speed);
  });
}

function setSpinSpeed(speed) {
  if (SPIN_SPEEDS.indexOf(speed) === -1) return;
  STATE.spinSpeed = speed;
  updateFastSpinUI();
}

function openFastSpinModal() {
  updateFastSpinUI();
  document.getElementById('fast-spin-modal').classList.add('show');
}

function closeFastSpinModal() {
  document.getElementById('fast-spin-modal').classList.remove('show');
}

document.getElementById('fast-spin-btn').addEventListener('click', function () {
  playSound('click');
  openFastSpinModal();
});

document.querySelectorAll('.fast-spin-preset').forEach(function (btn) {
  btn.addEventListener('click', function () {
    playSound('click');
    setSpinSpeed(parseInt(this.dataset.speed));
    closeFastSpinModal();
  });
});

document.getElementById('fast-spin-cancel-btn').addEventListener('click', function () {
  playSound('click');
  closeFastSpinModal();
});

document.getElementById('fast-spin-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closeFastSpinModal();
  }
});

// ── History & Stats panels ────────────────────────────────────────────
function openHistoryModal() {
  var list = document.getElementById('history-list');
  var subtitle = document.getElementById('history-subtitle');
  list.innerHTML = '';

  if (STATE.spinHistory.length === 0) {
    subtitle.textContent = 'No spins yet. Start playing to build your history.';
    subtitle.style.display = '';
  } else {
    subtitle.textContent = 'Showing last ' + STATE.spinHistory.length + ' spin' + (STATE.spinHistory.length === 1 ? '' : 's') + ' (max 100)';
    subtitle.style.display = '';

    STATE.spinHistory.forEach(function (entry, idx) {
      var row = document.createElement('div');
      row.className = 'history-row';
      if (entry.type === 'jackpot') row.classList.add('history-jackpot');
      else if (entry.type === 'bigwin') row.classList.add('history-bigwin');
      else if (entry.type === 'win') row.classList.add('history-win');
      else if (entry.type === 'pair') row.classList.add('history-pair');
      else row.classList.add('history-lose');

      var numSpan = document.createElement('span');
      numSpan.className = 'history-num';
      numSpan.textContent = '#' + (STATE.spinCount - idx);
      row.appendChild(numSpan);

      var symSpan = document.createElement('span');
      symSpan.className = 'history-syms';
      symSpan.textContent = entry.syms;
      row.appendChild(symSpan);

      var betSpan = document.createElement('span');
      betSpan.className = 'history-bet';
      betSpan.textContent = 'Bet: ' + entry.bet.toLocaleString();
      row.appendChild(betSpan);

      var winSpan = document.createElement('span');
      winSpan.className = 'history-win-amt';
      if (entry.winAmt > 0) {
        winSpan.textContent = '+' + entry.winAmt.toLocaleString();
        winSpan.classList.add('positive');
      } else {
        winSpan.textContent = '\u2212' + entry.bet.toLocaleString();
        winSpan.classList.add('negative');
      }
      row.appendChild(winSpan);

      var timeSpan = document.createElement('span');
      timeSpan.className = 'history-time';
      timeSpan.textContent = entry.ts;
      row.appendChild(timeSpan);

      list.appendChild(row);
    });
  }

  document.getElementById('history-modal').classList.add('show');
  playSound('click');
}

function closeHistoryModal() {
  document.getElementById('history-modal').classList.remove('show');
}

function openStatsModal() {
  document.getElementById('stat-total-spins').textContent = STATE.spinCount.toLocaleString();

  if (STATE.spinCount > 0) {
    var avgBet = Math.round(STATE.totalBetSum / STATE.spinCount);
    document.getElementById('stat-avg-bet').textContent = avgBet.toLocaleString();
  } else {
    document.getElementById('stat-avg-bet').textContent = '\u2014';
  }

  document.getElementById('stat-biggest-win').textContent = STATE.biggestWin.toLocaleString();
  document.getElementById('stat-total-won').textContent = STATE.totalWon.toLocaleString();
  document.getElementById('stat-total-burned').textContent = STATE.totalBurned.toLocaleString();

  var net = STATE.totalWon - STATE.totalBurned;
  var netEl = document.getElementById('stat-net-profit');
  if (net > 0) {
    netEl.textContent = '+' + net.toLocaleString();
    netEl.style.color = 'var(--win)';
  } else if (net < 0) {
    netEl.textContent = '\u2212' + Math.abs(net).toLocaleString();
    netEl.style.color = 'var(--lose)';
  } else {
    netEl.textContent = '0';
    netEl.style.color = 'var(--muted)';
  }

  var bestStreak = document.getElementById('stat-best-streak');
  var curStreak = document.getElementById('stat-cur-streak');
  if (bestStreak) bestStreak.textContent = STATE.bestWinStreak.toLocaleString();
  if (curStreak) curStreak.textContent = STATE.currentWinStreak.toLocaleString();

  document.getElementById('stats-modal').classList.add('show');
  playSound('click');
}

function closeStatsModal() {
  document.getElementById('stats-modal').classList.remove('show');
}

document.getElementById('history-btn').addEventListener('click', openHistoryModal);
document.getElementById('close-history-btn').addEventListener('click', function () {
  playSound('click');
  closeHistoryModal();
});
document.getElementById('history-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closeHistoryModal();
  }
});

document.getElementById('stats-btn').addEventListener('click', openStatsModal);
document.getElementById('close-stats-btn').addEventListener('click', function () {
  playSound('click');
  closeStatsModal();
});
document.getElementById('stats-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closeStatsModal();
  }
});

// ── Settings panel ────────────────────────────────────────────────────────
function openSettingsModal() {
  var sfxCb = document.getElementById('setting-sfx');
  var voiceCb = document.getElementById('setting-voice');
  var kbCb = document.getElementById('setting-keyboard');
  if (sfxCb) sfxCb.checked = STATE.soundEnabled;
  if (voiceCb) voiceCb.checked = STATE.speechEnabled;
  if (kbCb) kbCb.checked = STATE.keyboardEnabled;
  var nameInput = document.getElementById('setting-player-name');
  if (nameInput) nameInput.value = getPlayerName();
  document.getElementById('settings-modal').classList.add('show');
  playSound('click');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('show');
}

document.getElementById('settings-btn').addEventListener('click', openSettingsModal);
document.getElementById('close-settings-btn').addEventListener('click', function () {
  playSound('click');
  closeSettingsModal();
});
document.getElementById('settings-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closeSettingsModal();
  }
});

document.getElementById('setting-sfx').addEventListener('change', function () {
  STATE.soundEnabled = this.checked;
  if (STATE.soundEnabled) playSound('click');
});

document.getElementById('setting-voice').addEventListener('change', function () {
  STATE.speechEnabled = this.checked;
  syncSpeechUI();
  if (STATE.speechEnabled) speak('Voiceover enabled.');
});

document.getElementById('setting-keyboard').addEventListener('change', function () {
  STATE.keyboardEnabled = this.checked;
  playSound('click');
});

var saveNameBtn = document.getElementById('save-player-name-btn');
if (saveNameBtn) {
  saveNameBtn.addEventListener('click', function () {
    var inp = document.getElementById('setting-player-name');
    if (!inp) return;
    var name = inp.value.trim();
    if (name.length > 0 && name.length <= 18) {
      setPlayerName(name);
      showRewardToast('\u{1F98A} Name saved: ' + name);
      playSound('click');
    }
  });
}

// ── Keyboard controls ─────────────────────────────────────────────────────
document.addEventListener('keydown', function (e) {
  if (!STATE.keyboardEnabled) return;
  if (e.key !== ' ' && e.key !== 'Enter') return;
  var tag = document.activeElement ? document.activeElement.tagName : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
  if (anyBlockingModalOpen()) return;
  if (STATE.spinning || STATE.leverActive) return;
  e.preventDefault();
  playSound('click');
  spin();
});

// ── Rewards System ────────────────────────────────────────────────────────
var REWARDS_STORAGE_KEY = 'safariRewardsV1';

var DAILY_LOGIN_BASE = 75;
var WEEKLY_REWARD_BASE = 250;
var FRIEND_REWARD_BASE = 200;
var MAX_FRIEND_REFERRALS = 3;

var DAILY_MISSIONS_DEF = [
  { label: 'Spin 5 times today',               target: 5,  reward: 30 },
  { label: 'Win at least once today',          target: 1,  reward: 40 },
  { label: 'Place a single bet of 50+ chips',  target: 1,  reward: 25 },
  { label: 'Play in Arena mode once',          target: 1,  reward: 75 },
  { label: 'Send chips to a friend',           target: 1,  reward: 50 },
];

var WEEKEND_MISSIONS_DEF = [
  { label: 'Spin 10 times this weekend',   target: 10, reward: 100 },
  { label: 'Land a big win or jackpot',    target: 1,  reward: 150 },
];

var REWARDS = {
  lastLoginDate: '',
  loginStreak: 0,
  monthStreak: 0,
  loginClaimedToday: false,
  dailyMissionsDate: '',
  dailyProgress: [0, 0, 0, 0, 0],
  dailyClaimed: [false, false, false, false, false],
  weekendWeek: '',
  weekendProgress: [0, 0],
  weekendClaimed: [false, false],
  weeklyWeek: '',
  weeklyClaimed: false,
  referralsClaimed: 0,
};

function rewardsDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function rewardsWeekStr() {
  var now = new Date();
  var d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var y = d.getUTCFullYear();
  var yearStart = new Date(Date.UTC(y, 0, 1));
  var week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return y + '-' + String(week).padStart(2, '0');
}

function rewardsIsWeekend() {
  var day = new Date().getDay();
  return day === 0 || day === 6;
}

function getRewardMultiplier() {
  return Math.pow(2, Math.min(REWARDS.monthStreak, 4));
}

function loadRewards() {
  try {
    var stored = localStorage.getItem(REWARDS_STORAGE_KEY);
    if (!stored) return;
    var d = JSON.parse(stored);
    var today = rewardsDateStr();
    var week = rewardsWeekStr();

    if (typeof d.loginStreak === 'number') REWARDS.loginStreak = d.loginStreak;
    if (typeof d.monthStreak === 'number') REWARDS.monthStreak = d.monthStreak;
    if (typeof d.lastLoginDate === 'string') REWARDS.lastLoginDate = d.lastLoginDate;

    REWARDS.loginClaimedToday = (d.loginClaimedDate === today);

    if (d.dailyMissionsDate === today) {
      if (Array.isArray(d.dailyProgress)) {
        var dp = d.dailyProgress.slice(0, DAILY_MISSIONS_DEF.length);
        while (dp.length < DAILY_MISSIONS_DEF.length) dp.push(0);
        REWARDS.dailyProgress = dp;
      }
      if (Array.isArray(d.dailyClaimed)) {
        var dc = d.dailyClaimed.slice(0, DAILY_MISSIONS_DEF.length);
        while (dc.length < DAILY_MISSIONS_DEF.length) dc.push(false);
        REWARDS.dailyClaimed = dc;
      }
    }

    if (d.weekendWeek === week) {
      if (Array.isArray(d.weekendProgress) && d.weekendProgress.length >= 2) REWARDS.weekendProgress = d.weekendProgress.slice(0, 2);
      if (Array.isArray(d.weekendClaimed) && d.weekendClaimed.length >= 2) REWARDS.weekendClaimed = d.weekendClaimed.slice(0, 2);
    }

    if (d.weeklyWeek === week) {
      REWARDS.weeklyClaimed = !!d.weeklyClaimed;
    }

    if (typeof d.referralsClaimed === 'number') REWARDS.referralsClaimed = Math.min(d.referralsClaimed, MAX_FRIEND_REFERRALS);
  } catch (e) {
    console.warn('Rewards load failed:', e);
  }
}

function saveRewards() {
  try {
    var today = rewardsDateStr();
    var week = rewardsWeekStr();
    localStorage.setItem(REWARDS_STORAGE_KEY, JSON.stringify({
      lastLoginDate: REWARDS.lastLoginDate,
      loginStreak: REWARDS.loginStreak,
      monthStreak: REWARDS.monthStreak,
      loginClaimedDate: REWARDS.loginClaimedToday ? today : '',
      dailyMissionsDate: today,
      dailyProgress: REWARDS.dailyProgress,
      dailyClaimed: REWARDS.dailyClaimed,
      weekendWeek: week,
      weekendProgress: REWARDS.weekendProgress,
      weekendClaimed: REWARDS.weekendClaimed,
      weeklyWeek: week,
      weeklyClaimed: REWARDS.weeklyClaimed,
      referralsClaimed: REWARDS.referralsClaimed,
    }));
  } catch (e) {
    console.warn('Rewards save failed:', e);
  }
}

function initLoginStreak() {
  var today = rewardsDateStr();
  if (!REWARDS.lastLoginDate) {
    REWARDS.loginStreak = 1;
    REWARDS.monthStreak = 0;
    REWARDS.lastLoginDate = today;
    saveRewards();
    return;
  }
  if (REWARDS.lastLoginDate === today) return;

  var last = new Date(REWARDS.lastLoginDate + 'T00:00:00');
  var now = new Date(today + 'T00:00:00');
  var diffDays = Math.round((now - last) / 86400000);

  if (diffDays === 1) {
    REWARDS.loginStreak++;
  } else {
    REWARDS.loginStreak = 1;
    REWARDS.monthStreak = 0;
  }

  REWARDS.monthStreak = Math.floor((REWARDS.loginStreak - 1) / 30);
  REWARDS.lastLoginDate = today;
  saveRewards();
}

function updateRewardProgress(data) {
  var today = rewardsDateStr();
  if (REWARDS.dailyMissionsDate !== today) {
    REWARDS.dailyMissionsDate = today;
    REWARDS.dailyProgress = [0, 0, 0, 0, 0];
    REWARDS.dailyClaimed = [false, false, false, false, false];
  }

  if (data.spun && !REWARDS.dailyClaimed[0]) {
    REWARDS.dailyProgress[0] = Math.min(DAILY_MISSIONS_DEF[0].target, (REWARDS.dailyProgress[0] || 0) + 1);
  }
  if (data.won && !REWARDS.dailyClaimed[1]) {
    REWARDS.dailyProgress[1] = Math.min(DAILY_MISSIONS_DEF[1].target, (REWARDS.dailyProgress[1] || 0) + 1);
  }
  if (data.bet >= 50 && !REWARDS.dailyClaimed[2]) {
    REWARDS.dailyProgress[2] = Math.min(DAILY_MISSIONS_DEF[2].target, (REWARDS.dailyProgress[2] || 0) + 1);
  }
  if (data.playedArena && !REWARDS.dailyClaimed[3]) {
    REWARDS.dailyProgress[3] = Math.min(DAILY_MISSIONS_DEF[3].target, (REWARDS.dailyProgress[3] || 0) + 1);
  }
  if (data.sentChips && !REWARDS.dailyClaimed[4]) {
    REWARDS.dailyProgress[4] = Math.min(DAILY_MISSIONS_DEF[4].target, (REWARDS.dailyProgress[4] || 0) + 1);
  }

  if (rewardsIsWeekend()) {
    var week = rewardsWeekStr();
    if (REWARDS.weekendWeek !== week) {
      REWARDS.weekendWeek = week;
      REWARDS.weekendProgress = [0, 0];
      REWARDS.weekendClaimed = [false, false];
    }
    if (data.spun && !REWARDS.weekendClaimed[0]) {
      REWARDS.weekendProgress[0] = Math.min(WEEKEND_MISSIONS_DEF[0].target, (REWARDS.weekendProgress[0] || 0) + 1);
    }
    if (data.bigWin && !REWARDS.weekendClaimed[1]) {
      REWARDS.weekendProgress[1] = Math.min(WEEKEND_MISSIONS_DEF[1].target, (REWARDS.weekendProgress[1] || 0) + 1);
    }
  }

  saveRewards();
  updateRewardsBadge();
}

function hasUnclaimedRewards() {
  if (!REWARDS.loginClaimedToday) return true;
  if (!REWARDS.weeklyClaimed) return true;
  for (var i = 0; i < DAILY_MISSIONS_DEF.length; i++) {
    if (!REWARDS.dailyClaimed[i] && (REWARDS.dailyProgress[i] || 0) >= DAILY_MISSIONS_DEF[i].target) return true;
  }
  if (rewardsIsWeekend()) {
    for (var j = 0; j < WEEKEND_MISSIONS_DEF.length; j++) {
      if (!REWARDS.weekendClaimed[j] && (REWARDS.weekendProgress[j] || 0) >= WEEKEND_MISSIONS_DEF[j].target) return true;
    }
  }
  return false;
}

function updateRewardsBadge() {
  var btn = document.getElementById('rewards-btn');
  if (!btn) return;
  var hasPending = hasUnclaimedRewards();
  var badge = btn.querySelector('.rewards-badge');
  if (hasPending) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'rewards-badge';
      document.getElementById('rewards-btn').appendChild(badge);
    }
  } else {
    if (badge) badge.remove();
  }
}

function openRewardsModal() {
  renderRewardsModal();
  document.getElementById('rewards-modal').classList.add('show');
  playSound('click');
}

function closeRewardsModal() {
  document.getElementById('rewards-modal').classList.remove('show');
}

function renderRewardsModal() {
  document.getElementById('reward-login-streak').textContent = REWARDS.loginStreak;
  document.getElementById('reward-month-streak').textContent = REWARDS.monthStreak;
  var mult = getRewardMultiplier();
  document.getElementById('reward-multiplier').textContent = mult + '×';

  var loginReward = Math.floor(DAILY_LOGIN_BASE * mult);
  document.getElementById('daily-login-amount').textContent = '+' + loginReward + ' chips';
  var loginBtn = document.getElementById('claim-login-btn');
  if (REWARDS.loginClaimedToday) {
    loginBtn.textContent = '✔ Claimed Today';
    loginBtn.disabled = true;
    loginBtn.className = 'rewards-claim-btn claimed';
  } else {
    loginBtn.textContent = 'Claim Login Bonus';
    loginBtn.disabled = false;
    loginBtn.className = 'rewards-claim-btn';
  }

  renderMissionList('daily-missions-list', DAILY_MISSIONS_DEF, REWARDS.dailyProgress, REWARDS.dailyClaimed, 'daily', mult);

  if (rewardsIsWeekend()) {
    renderMissionList('weekend-missions-list', WEEKEND_MISSIONS_DEF, REWARDS.weekendProgress, REWARDS.weekendClaimed, 'weekend', mult);
  } else {
    document.getElementById('weekend-missions-list').innerHTML =
      '<div class="rewards-locked">🔒 Available on Saturdays &amp; Sundays only. Check back this weekend!</div>';
  }

  var weeklyReward = Math.floor(WEEKLY_REWARD_BASE * mult);
  document.getElementById('weekly-reward-amount').textContent = '+' + weeklyReward + ' chips';
  var weeklyBtn = document.getElementById('claim-weekly-btn');
  if (REWARDS.weeklyClaimed) {
    weeklyBtn.textContent = '✔ Claimed This Week';
    weeklyBtn.disabled = true;
    weeklyBtn.className = 'rewards-claim-btn claimed';
  } else {
    weeklyBtn.textContent = 'Claim Weekly Reward';
    weeklyBtn.disabled = false;
    weeklyBtn.className = 'rewards-claim-btn';
  }

  document.getElementById('invite-status').textContent = REWARDS.referralsClaimed + ' / ' + MAX_FRIEND_REFERRALS + ' friend bonuses claimed';
  var claimInviteBtn = document.getElementById('claim-invite-btn');
  if (REWARDS.referralsClaimed >= MAX_FRIEND_REFERRALS) {
    claimInviteBtn.textContent = '✔ All Bonuses Claimed';
    claimInviteBtn.disabled = true;
    claimInviteBtn.className = 'rewards-claim-btn claimed';
  } else {
    var invReward = Math.floor(FRIEND_REWARD_BASE * mult);
    claimInviteBtn.textContent = 'Claim Friend Bonus (+' + invReward + ')';
    claimInviteBtn.disabled = false;
    claimInviteBtn.className = 'rewards-claim-btn';
  }
}

function renderMissionList(containerId, missions, progress, claimed, type, mult) {
  var container = document.getElementById(containerId);
  container.innerHTML = '';
  missions.forEach(function (mission, idx) {
    var prog = progress[idx] || 0;
    var isClaimed = claimed[idx];
    var isComplete = prog >= mission.target;
    var reward = Math.floor(mission.reward * mult);
    var pct = Math.min(100, Math.round((prog / mission.target) * 100));

    var row = document.createElement('div');
    row.className = 'mission-row' + (isClaimed ? ' mission-claimed' : isComplete ? ' mission-complete' : '');

    var info = document.createElement('div');
    info.className = 'mission-info';

    var label = document.createElement('div');
    label.className = 'mission-label';
    label.textContent = mission.label;
    info.appendChild(label);

    var wrap = document.createElement('div');
    wrap.className = 'mission-progress-wrap';
    var fill = document.createElement('div');
    fill.className = 'mission-progress-fill';
    fill.style.width = pct + '%';
    var txt = document.createElement('span');
    txt.className = 'mission-progress-text';
    txt.textContent = prog + ' / ' + mission.target;
    wrap.appendChild(fill);
    info.appendChild(wrap);
    info.appendChild(txt);
    row.appendChild(info);

    var right = document.createElement('div');
    right.className = 'mission-right';

    var rewardLbl = document.createElement('div');
    rewardLbl.className = 'mission-reward';
    rewardLbl.textContent = '+' + reward;
    right.appendChild(rewardLbl);

    var btn = document.createElement('button');
    if (isClaimed) {
      btn.textContent = '✔';
      btn.className = 'mission-claim-btn claimed';
      btn.disabled = true;
    } else if (isComplete) {
      btn.textContent = 'Claim';
      btn.className = 'mission-claim-btn';
      btn.disabled = false;
      (function (i, t) {
        btn.addEventListener('click', function () {
          playSound('click');
          if (t === 'daily') claimDailyMission(i);
          else claimWeekendMission(i);
        });
      })(idx, type);
    } else {
      btn.textContent = 'Claim';
      btn.className = 'mission-claim-btn locked';
      btn.disabled = true;
    }
    right.appendChild(btn);
    row.appendChild(right);
    container.appendChild(row);
  });
}

function claimDailyLogin() {
  if (REWARDS.loginClaimedToday) return;
  var mult = getRewardMultiplier();
  var reward = Math.floor(DAILY_LOGIN_BASE * mult);
  REWARDS.loginClaimedToday = true;
  STATE.balance += reward;
  updateUI();
  saveRewards();
  renderRewardsModal();
  updateRewardsBadge();
  showRewardToast('🎁 +' + reward + ' chips! Daily login bonus claimed!');
  playSound('coinAdd', reward);
  spawnCoins(reward);
  updateSpinAvailability();
}

function claimDailyMission(idx) {
  if (REWARDS.dailyClaimed[idx]) return;
  if ((REWARDS.dailyProgress[idx] || 0) < DAILY_MISSIONS_DEF[idx].target) return;
  var mult = getRewardMultiplier();
  var reward = Math.floor(DAILY_MISSIONS_DEF[idx].reward * mult);
  REWARDS.dailyClaimed[idx] = true;
  STATE.balance += reward;
  updateUI();
  saveRewards();
  renderRewardsModal();
  updateRewardsBadge();
  showRewardToast('🎯 +' + reward + ' chips! Mission complete!');
  playSound('coinAdd', reward);
  spawnCoins(reward);
  updateSpinAvailability();
}

function claimWeekendMission(idx) {
  if (REWARDS.weekendClaimed[idx]) return;
  if ((REWARDS.weekendProgress[idx] || 0) < WEEKEND_MISSIONS_DEF[idx].target) return;
  var mult = getRewardMultiplier();
  var reward = Math.floor(WEEKEND_MISSIONS_DEF[idx].reward * mult);
  REWARDS.weekendClaimed[idx] = true;
  STATE.balance += reward;
  updateUI();
  saveRewards();
  renderRewardsModal();
  updateRewardsBadge();
  showRewardToast('🏆 +' + reward + ' chips! Weekend mission complete!');
  playSound('coinAdd', reward);
  spawnCoins(reward);
  updateSpinAvailability();
}

function claimWeeklyReward() {
  if (REWARDS.weeklyClaimed) return;
  var mult = getRewardMultiplier();
  var reward = Math.floor(WEEKLY_REWARD_BASE * mult);
  REWARDS.weeklyClaimed = true;
  STATE.balance += reward;
  updateUI();
  saveRewards();
  renderRewardsModal();
  updateRewardsBadge();
  showRewardToast('🎉 +' + reward + ' chips! Weekly reward claimed!');
  playSound('coinAdd', reward);
  spawnCoins(reward);
  updateSpinAvailability();
}

function claimFriendBonus() {
  if (REWARDS.referralsClaimed >= MAX_FRIEND_REFERRALS) return;
  var mult = getRewardMultiplier();
  var reward = Math.floor(FRIEND_REWARD_BASE * mult);
  REWARDS.referralsClaimed++;
  STATE.balance += reward;
  updateUI();
  saveRewards();
  renderRewardsModal();
  updateRewardsBadge();
  showRewardToast('👯 +' + reward + ' chips! Friend referral bonus claimed!');
  playSound('coinAdd', reward);
  spawnCoins(reward);
  updateSpinAvailability();
}

function copyInviteLink() {
  var code = 'SAFARI-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  var link = 'https://safari-casino.game/invite?ref=' + code;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(function () {
      showRewardToast('📋 Invite link copied! Share it with a friend.');
    }).catch(function () {
      showRewardToast('Share this code with a friend: ' + code);
    });
  } else {
    showRewardToast('Share this code with a friend: ' + code);
  }
  playSound('click');
}

function showRewardToast(text) {
  var existing = document.querySelector('.reward-toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.className = 'reward-toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  requestAnimationFrame(function () {
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 400);
    }, 2800);
  });
}

document.getElementById('rewards-btn').addEventListener('click', openRewardsModal);
document.getElementById('close-rewards-btn').addEventListener('click', function () {
  playSound('click');
  closeRewardsModal();
});
document.getElementById('rewards-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closeRewardsModal();
  }
});
document.getElementById('claim-login-btn').addEventListener('click', function () {
  claimDailyLogin();
});
document.getElementById('claim-weekly-btn').addEventListener('click', function () {
  claimWeeklyReward();
});
document.getElementById('copy-invite-btn').addEventListener('click', copyInviteLink);
document.getElementById('claim-invite-btn').addEventListener('click', function () {
  claimFriendBonus();
});

// ── Progression System ────────────────────────────────────────────────────
var PROGRESSION_STORAGE_KEY = 'safariProgressionV1';
var MAX_LEVEL = 60;

var TIER_RANKS = [
  { name: 'Bronze',      icon: '\u{1F949}', minLevel: 1,  color: '#cd7f32', diffFactor: 1.00 },
  { name: 'Silver',      icon: '\u{1F948}', minLevel: 8,  color: '#c0c0c0', diffFactor: 0.95 },
  { name: 'Gold',        icon: '\u{1F947}', minLevel: 16, color: '#ffd700', diffFactor: 0.90 },
  { name: 'Platinum',    icon: '\u{1F4A0}', minLevel: 23, color: '#e5e4e2', diffFactor: 0.85 },
  { name: 'Diamond',     icon: '\u{1F48E}', minLevel: 31, color: '#b9f2ff', diffFactor: 0.78 },
  { name: 'Master',      icon: '\u{1F525}', minLevel: 38, color: '#ff6347', diffFactor: 0.72 },
  { name: 'Grandmaster', icon: '\u26A1',    minLevel: 46, color: '#9370db', diffFactor: 0.65 },
  { name: 'Challenger',  icon: '\u{1F451}', minLevel: 53, color: '#ff4500', diffFactor: 0.58 },
];

var PROGRESSION = {
  level: 1,
  xp: 0,
  missionProgress: [0, 0, 0],
  missionClaimed: [false, false, false],
};

function getCurrentRank() {
  var rank = TIER_RANKS[0];
  rank.index = 0;
  for (var i = TIER_RANKS.length - 1; i >= 0; i--) {
    if (PROGRESSION.level >= TIER_RANKS[i].minLevel) {
      rank = TIER_RANKS[i];
      rank.index = i;
      break;
    }
  }
  return rank;
}

function getNextRank() {
  var rank = getCurrentRank();
  if (rank.index < TIER_RANKS.length - 1) return TIER_RANKS[rank.index + 1];
  return null;
}

function getDifficultyFactor() {
  return getCurrentRank().diffFactor;
}

function xpForLevel(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.floor(80 * Math.pow(level, 1.35));
}

function getLevelReward(level) {
  if (level === 60) return 50000;
  if (level === 30) return 8000;
  if (level === 15) return 3000;
  return 50 + level * 25;
}

function isCheckpointLevel(level) {
  return level === 15 || level === 30 || level === 60;
}

function getMissionsForLevel(level) {
  var missions = [];
  var spinTarget = Math.min(100, 3 + Math.floor(level * 1.5));
  missions.push({ key: 'spins', label: 'Spin ' + spinTarget + ' times', target: spinTarget, reward: 20 + level * 5 });

  var winTarget = Math.max(1, Math.floor(1 + level * 0.4));
  missions.push({ key: 'wins', label: 'Win ' + winTarget + ' time' + (winTarget > 1 ? 's' : ''), target: winTarget, reward: 25 + level * 8 });

  if (level <= 15) {
    var betTarget = 10 + level * 10;
    missions.push({ key: 'highBet', label: 'Place a bet of ' + betTarget + '+ chips', target: 1, threshold: betTarget, reward: 15 + level * 5 });
  } else if (level <= 35) {
    var bigWinTarget = Math.max(1, Math.floor((level - 10) / 7));
    missions.push({ key: 'bigWins', label: 'Land ' + bigWinTarget + ' big win' + (bigWinTarget > 1 ? 's' : ''), target: bigWinTarget, reward: 30 + level * 10 });
  } else {
    var chipTarget = 500 + (level - 30) * 200;
    missions.push({ key: 'chipTarget', label: 'Win ' + chipTarget.toLocaleString() + '+ total chips', target: chipTarget, reward: 50 + level * 12 });
  }
  return missions;
}

function loadProgression() {
  try {
    var stored = localStorage.getItem(PROGRESSION_STORAGE_KEY);
    if (!stored) return;
    var d = JSON.parse(stored);
    if (typeof d.level === 'number' && d.level >= 1 && d.level <= MAX_LEVEL) PROGRESSION.level = d.level;
    if (typeof d.xp === 'number' && d.xp >= 0) PROGRESSION.xp = d.xp;
    if (Array.isArray(d.missionProgress) && d.missionProgress.length >= 3) PROGRESSION.missionProgress = d.missionProgress.slice(0, 3);
    if (Array.isArray(d.missionClaimed) && d.missionClaimed.length >= 3) PROGRESSION.missionClaimed = d.missionClaimed.slice(0, 3);
  } catch (e) {
    console.warn('Progression load failed:', e);
  }
}

function saveProgression() {
  try {
    localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify({
      level: PROGRESSION.level,
      xp: PROGRESSION.xp,
      missionProgress: PROGRESSION.missionProgress,
      missionClaimed: PROGRESSION.missionClaimed,
    }));
  } catch (e) {
    console.warn('Progression save failed:', e);
  }
}

function awardXP(amount) {
  if (PROGRESSION.level >= MAX_LEVEL) return;
  PROGRESSION.xp += amount;
  var needed = xpForLevel(PROGRESSION.level);
  while (PROGRESSION.xp >= needed && PROGRESSION.level < MAX_LEVEL) {
    PROGRESSION.xp -= needed;
    PROGRESSION.level++;
    onLevelUp(PROGRESSION.level);
    needed = xpForLevel(PROGRESSION.level);
  }
  if (PROGRESSION.level >= MAX_LEVEL) PROGRESSION.xp = 0;
  saveProgression();
  updateProgressionUI();
}

function onLevelUp(newLevel) {
  var reward = getLevelReward(newLevel);
  STATE.balance += reward;
  updateUI();
  updateSpinAvailability();

  PROGRESSION.missionProgress = [0, 0, 0];
  PROGRESSION.missionClaimed = [false, false, false];

  var rank = getCurrentRank();
  var checkpoint = isCheckpointLevel(newLevel);

  if (checkpoint) {
    spawnConfetti(120);
    spawnCoinRain(20);
    screenFlash('rgba(255,215,0,0.3)', 800);
    showRewardToast(rank.icon + ' LEVEL ' + newLevel + ' CHECKPOINT! +' + reward.toLocaleString() + ' chips!');
    speak('Congratulations! Level ' + newLevel + ' checkpoint reached! You earned ' + reward.toLocaleString() + ' bonus chips!');
    playSound('jackpot');
  } else {
    spawnCoinRain(6);
    screenFlash('rgba(39,174,96,0.15)', 400);
    showRewardToast(rank.icon + ' Level ' + newLevel + '! +' + reward.toLocaleString() + ' chips!');
    speak('Level up! You are now level ' + newLevel + '.');
    playSound('bigWin');
  }

  for (var i = TIER_RANKS.length - 1; i >= 0; i--) {
    if (newLevel === TIER_RANKS[i].minLevel && i > 0) {
      (function (r) {
        setTimeout(function () {
          showRewardToast(r.icon + ' RANK UP! You are now ' + r.name + '!');
          speak('Rank up! You have reached ' + r.name + ' rank! The hunt grows harder.');
        }, 1500);
      })(TIER_RANKS[i]);
      break;
    }
  }
}

function updateProgressionAfterSpin(data) {
  var baseXP = 5 + Math.floor(data.bet / 10);
  if (data.won) baseXP += 10;
  if (data.bigWin) baseXP += 25;
  if (data.jackpot) baseXP += 50;
  awardXP(baseXP);

  if (PROGRESSION.level >= MAX_LEVEL) return;
  var missions = getMissionsForLevel(PROGRESSION.level);

  if (!PROGRESSION.missionClaimed[0]) {
    PROGRESSION.missionProgress[0] = Math.min(missions[0].target, (PROGRESSION.missionProgress[0] || 0) + 1);
  }
  if (data.won && !PROGRESSION.missionClaimed[1]) {
    PROGRESSION.missionProgress[1] = Math.min(missions[1].target, (PROGRESSION.missionProgress[1] || 0) + 1);
  }
  if (!PROGRESSION.missionClaimed[2]) {
    var m2 = missions[2];
    if (m2.key === 'highBet' && data.bet >= m2.threshold) {
      PROGRESSION.missionProgress[2] = Math.min(m2.target, (PROGRESSION.missionProgress[2] || 0) + 1);
    } else if (m2.key === 'bigWins' && data.bigWin) {
      PROGRESSION.missionProgress[2] = Math.min(m2.target, (PROGRESSION.missionProgress[2] || 0) + 1);
    } else if (m2.key === 'chipTarget' && data.winAmount > 0) {
      PROGRESSION.missionProgress[2] = (PROGRESSION.missionProgress[2] || 0) + data.winAmount;
    }
  }

  saveProgression();
  updateProgressionUI();
}

function claimLevelMission(idx) {
  if (PROGRESSION.missionClaimed[idx]) return;
  var missions = getMissionsForLevel(PROGRESSION.level);
  if ((PROGRESSION.missionProgress[idx] || 0) < missions[idx].target) return;
  var reward = missions[idx].reward;
  PROGRESSION.missionClaimed[idx] = true;
  STATE.balance += reward;
  updateUI();
  saveProgression();
  updateSpinAvailability();
  showRewardToast('+' + reward + ' chips! Mission complete!');
  playSound('coinAdd', reward);
  spawnCoins(reward);
  renderProgressionModal();
}

function updateProgressionUI() {
  var rank = getCurrentRank();
  var needed = PROGRESSION.level >= MAX_LEVEL ? 1 : xpForLevel(PROGRESSION.level);
  var xpPct = PROGRESSION.level >= MAX_LEVEL ? 100 : Math.min(100, Math.floor((PROGRESSION.xp / needed) * 100));

  var barRank = document.getElementById('prog-bar-rank');
  var barLevel = document.getElementById('prog-bar-level');
  var barFill = document.getElementById('prog-bar-xp-fill');
  var barText = document.getElementById('prog-bar-xp-text');

  if (barRank) { barRank.textContent = rank.icon + ' ' + rank.name.toUpperCase(); barRank.style.color = rank.color; }
  if (barLevel) barLevel.textContent = PROGRESSION.level;
  if (barFill) barFill.style.width = xpPct + '%';
  if (barText) {
    barText.textContent = PROGRESSION.level >= MAX_LEVEL ? 'MAX LEVEL' : PROGRESSION.xp + ' / ' + needed + ' XP';
  }
}

function renderProgressionModal() {
  var rank = getCurrentRank();
  var nextRank = getNextRank();
  var needed = PROGRESSION.level >= MAX_LEVEL ? 1 : xpForLevel(PROGRESSION.level);
  var xpPct = PROGRESSION.level >= MAX_LEVEL ? 100 : Math.min(100, Math.floor((PROGRESSION.xp / needed) * 100));

  var rankIcon = document.getElementById('prog-rank-icon');
  var rankName = document.getElementById('prog-rank-name');
  var levelEl = document.getElementById('prog-level');
  var rankNext = document.getElementById('prog-rank-next');
  var xpCurrent = document.getElementById('prog-xp-current');
  var xpNeeded = document.getElementById('prog-xp-needed');
  var xpFill = document.getElementById('prog-xp-fill');
  var missionsLevel = document.getElementById('prog-missions-level');
  var rewardPreview = document.getElementById('prog-reward-preview');
  var diffInfo = document.getElementById('prog-difficulty-info');

  if (rankIcon) { rankIcon.textContent = rank.icon; rankIcon.style.textShadow = '0 0 20px ' + rank.color; }
  if (rankName) { rankName.textContent = rank.name.toUpperCase(); rankName.style.color = rank.color; }
  if (levelEl) levelEl.textContent = PROGRESSION.level;
  if (rankNext) {
    rankNext.textContent = nextRank ? 'Next rank: ' + nextRank.name + ' (Lv. ' + nextRank.minLevel + ')' : 'Highest rank achieved!';
  }

  if (PROGRESSION.level >= MAX_LEVEL) {
    if (xpCurrent) xpCurrent.textContent = 'MAX';
    if (xpNeeded) xpNeeded.textContent = 'MAX';
  } else {
    if (xpCurrent) xpCurrent.textContent = PROGRESSION.xp;
    if (xpNeeded) xpNeeded.textContent = needed;
  }
  if (xpFill) xpFill.style.width = xpPct + '%';
  if (missionsLevel) missionsLevel.textContent = PROGRESSION.level;

  var missions = getMissionsForLevel(PROGRESSION.level);
  var container = document.getElementById('prog-missions-list');
  if (container) {
    container.innerHTML = '';
    if (PROGRESSION.level >= MAX_LEVEL) {
      container.innerHTML = '<div class="rewards-locked">\u{1F3C6} Max level reached! All missions complete.</div>';
    } else {
      missions.forEach(function (mission, idx) {
        var prog = PROGRESSION.missionProgress[idx] || 0;
        var isClaimed = PROGRESSION.missionClaimed[idx];
        var displayProg = mission.key === 'chipTarget' ? Math.min(prog, mission.target) : prog;
        var isComplete = prog >= mission.target;
        var pct = Math.min(100, Math.round((prog / mission.target) * 100));

        var row = document.createElement('div');
        row.className = 'mission-row' + (isClaimed ? ' mission-claimed' : isComplete ? ' mission-complete' : '');

        var info = document.createElement('div');
        info.className = 'mission-info';
        var label = document.createElement('div');
        label.className = 'mission-label';
        label.textContent = mission.label;
        info.appendChild(label);

        var wrap = document.createElement('div');
        wrap.className = 'mission-progress-wrap';
        var fill = document.createElement('div');
        fill.className = 'mission-progress-fill';
        fill.style.width = pct + '%';
        wrap.appendChild(fill);
        info.appendChild(wrap);

        var txt = document.createElement('span');
        txt.className = 'mission-progress-text';
        txt.textContent = mission.key === 'chipTarget'
          ? displayProg.toLocaleString() + ' / ' + mission.target.toLocaleString()
          : prog + ' / ' + mission.target;
        info.appendChild(txt);
        row.appendChild(info);

        var right = document.createElement('div');
        right.className = 'mission-right';
        var rewardLbl = document.createElement('div');
        rewardLbl.className = 'mission-reward';
        rewardLbl.textContent = '+' + mission.reward;
        right.appendChild(rewardLbl);

        var btn = document.createElement('button');
        if (isClaimed) {
          btn.textContent = '\u2714';
          btn.className = 'mission-claim-btn claimed';
          btn.disabled = true;
        } else if (isComplete) {
          btn.textContent = 'Claim';
          btn.className = 'mission-claim-btn';
          (function (i) { btn.addEventListener('click', function () { playSound('click'); claimLevelMission(i); }); })(idx);
        } else {
          btn.textContent = 'Claim';
          btn.className = 'mission-claim-btn locked';
          btn.disabled = true;
        }
        right.appendChild(btn);
        row.appendChild(right);
        container.appendChild(row);
      });
    }
  }

  if (rewardPreview) {
    if (PROGRESSION.level >= MAX_LEVEL) {
      rewardPreview.innerHTML = '<div class="prog-reward-item prog-reward-max">\u{1F3C6} You have reached the maximum level!</div>';
    } else {
      var nextLevel = PROGRESSION.level + 1;
      var nextReward = getLevelReward(nextLevel);
      var isCP = isCheckpointLevel(nextLevel);
      var html = '<div class="prog-reward-item' + (isCP ? ' prog-reward-checkpoint' : '') + '">';
      html += '<span>Level ' + nextLevel + (isCP ? ' CHECKPOINT' : '') + '</span>';
      html += '<span class="prog-reward-amount">+' + nextReward.toLocaleString() + ' chips</span></div>';
      var nextCP = [15, 30, 60].filter(function (cp) { return cp > PROGRESSION.level; })[0];
      if (nextCP && nextCP !== nextLevel) {
        var cpReward = getLevelReward(nextCP);
        html += '<div class="prog-reward-item prog-reward-checkpoint">';
        html += '<span>Level ' + nextCP + ' CHECKPOINT</span>';
        html += '<span class="prog-reward-amount">+' + cpReward.toLocaleString() + ' chips</span></div>';
      }
      rewardPreview.innerHTML = html;
    }
  }

  if (diffInfo) {
    var factor = getDifficultyFactor();
    var diffPct = Math.round((1 - factor) * 100);
    var diffLabel = diffPct === 0 ? 'Normal' : 'Rare symbols ' + diffPct + '% harder to hit';
    diffInfo.innerHTML = '<span class="prog-diff-label">' + rank.icon + ' ' + rank.name + ':</span> <span class="prog-diff-value">' + diffLabel + '</span>';
  }
}

function openProgressionModal() {
  renderProgressionModal();
  document.getElementById('progression-modal').classList.add('show');
  playSound('click');
}

function closeProgressionModal() {
  document.getElementById('progression-modal').classList.remove('show');
}

document.getElementById('progression-btn').addEventListener('click', openProgressionModal);
document.getElementById('close-progression-btn').addEventListener('click', function () {
  playSound('click');
  closeProgressionModal();
});
document.getElementById('progression-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closeProgressionModal();
  }
});
document.getElementById('prog-bar').addEventListener('click', openProgressionModal);

// ── Init ───────────────────────────────────────────────────────────────────
// ── Theme Personalization ──────────────────────────────────────────────────
var THEME_STORAGE_KEY = 'safariThemeV1';
var VALID_THEMES = ['default', 'jungle', 'neon'];

function loadTheme() {
  var saved = null;
  try { saved = localStorage.getItem(THEME_STORAGE_KEY); } catch (e) {}
  if (saved && VALID_THEMES.indexOf(saved) !== -1) return saved;
  return 'default';
}

function applyTheme(theme) {
  document.body.classList.remove('theme-jungle', 'theme-neon');
  if (theme === 'jungle') document.body.classList.add('theme-jungle');
  else if (theme === 'neon') document.body.classList.add('theme-neon');
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch (e) {}
  updateThemeCards(theme);
}

function updateThemeCards(theme) {
  var cards = document.querySelectorAll('.theme-card');
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute('data-theme') === theme) {
      cards[i].classList.add('active');
    } else {
      cards[i].classList.remove('active');
    }
  }
}

function openThemesModal() {
  updateThemeCards(loadTheme());
  document.getElementById('themes-modal').classList.add('show');
  playSound('click');
}

function closeThemesModal() {
  document.getElementById('themes-modal').classList.remove('show');
}

document.getElementById('themes-btn').addEventListener('click', openThemesModal);
document.getElementById('close-themes-btn').addEventListener('click', function () {
  playSound('click');
  closeThemesModal();
});
document.getElementById('themes-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    playSound('click');
    closeThemesModal();
  }
});

var themeCards = document.querySelectorAll('.theme-card');
for (var tc = 0; tc < themeCards.length; tc++) {
  (function (card) {
    card.addEventListener('click', function () {
      var theme = card.getAttribute('data-theme');
      if (theme && VALID_THEMES.indexOf(theme) !== -1) {
        playSound('click');
        applyTheme(theme);
      }
    });
  })(themeCards[tc]);
}

// ── PLAYER IDENTITY ─────────────────────────────────────────────────────────

function getOrCreatePlayerId() {
  var id = localStorage.getItem('slotPlayerId');
  if (!id) {
    id = 'player_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem('slotPlayerId', id);
  }
  return id;
}

function getPlayerName() {
  return localStorage.getItem('slotPlayerName') || 'Safari Player';
}

function setPlayerName(name) {
  var trimmed = (name || '').trim().slice(0, 24);
  if (trimmed) {
    localStorage.setItem('slotPlayerName', trimmed);
    return trimmed;
  }
  return getPlayerName();
}

var MY_PLAYER_ID = getOrCreatePlayerId();

// ── SIMULATED FRIENDS ────────────────────────────────────────────────────────

var SIMULATED_FRIENDS = [
  { id: 'f1', name: 'Jayden Xie',    avatar: '🦁', level: 12, totalWon: 18400, bestWinStreak: 7,  spins: 320 },
  { id: 'f2', name: 'Olivia Kim',    avatar: '🐘', level: 9,  totalWon: 11200, bestWinStreak: 5,  spins: 210 },
  { id: 'f3', name: 'Marcus Reed',   avatar: '🦒', level: 15, totalWon: 27800, bestWinStreak: 11, spins: 480 },
  { id: 'f4', name: 'Priya Nair',    avatar: '🦓', level: 6,  totalWon: 7600,  bestWinStreak: 3,  spins: 140 },
  { id: 'f5', name: 'Ethan Cole',    avatar: '🐆', level: 18, totalWon: 41500, bestWinStreak: 14, spins: 700 },
  { id: 'f6', name: 'Amara Diallo',  avatar: '🦏', level: 7,  totalWon: 9100,  bestWinStreak: 4,  spins: 165 },
  { id: 'f7', name: 'Sofia Ruiz',    avatar: '🐊', level: 11, totalWon: 15300, bestWinStreak: 8,  spins: 280 },
  { id: 'f8', name: 'Liam Torres',   avatar: '🦅', level: 20, totalWon: 58000, bestWinStreak: 19, spins: 950 }
];

var WORLD_AVATARS = ['🐻','🐼','🐸','🦊','🐺','🦝','🦨','🦦','🐴','🦌','🐓','🦚','🦜','🐙','🦈','🦋','🐝','🌴'];

function generateWorldPlayers() {
  var names = [
    'BigSpinJoe','LuckyLens','SafariAce','WildKing','GoldenPaw','JungleBoss',
    'SpinMaster','ChipHunter','RoarPlayer','SlotLion','NightOwl','DawnRider',
    'StackAttack','NeonChaser','TropicWin','BushTrail','SunsetBet','StarStreak',
    'CoinStorm','MegaRoar','ElitePlay','ProSafari','TopSlot','WinCycle',
    'BetBlaze','SpinPhoenix','GoldRush','JackpotQ','PrairieAce','VeldtKing'
  ];
  var players = [];
  for (var i = 0; i < 50; i++) {
    var seed = (i * 7919 + 1234) % 10000;
    players.push({
      id: 'world_' + i,
      name: names[i % names.length] + (i < names.length ? '' : ('' + (Math.floor(i / names.length) + 1))),
      avatar: WORLD_AVATARS[i % WORLD_AVATARS.length],
      level: 1 + (seed % 25),
      totalWon: 1000 + (seed * 11) % 80000,
      bestWinStreak: 1 + (seed % 18),
      spins: 20 + (seed * 3) % 1200
    });
  }
  return players;
}

// ── LEADERBOARD ──────────────────────────────────────────────────────────────

var LB_SORT = 'totalWon';
var LB_TAB  = 'friends';

function getLBPlayerData() {
  return {
    id: MY_PLAYER_ID,
    name: getPlayerName(),
    avatar: '🎯',
    level: STATE.level,
    totalWon: STATE.totalWon,
    bestWinStreak: STATE.bestWinStreak,
    spins: STATE.totalSpins,
    isMe: true
  };
}

function getSortedLBData() {
  var me = getLBPlayerData();
  var pool = LB_TAB === 'friends'
    ? SIMULATED_FRIENDS.slice()
    : generateWorldPlayers();
  pool.push(me);
  pool.sort(function (a, b) {
    return (b[LB_SORT] || 0) - (a[LB_SORT] || 0);
  });
  return pool;
}

function renderLeaderboard() {
  var list = document.getElementById('lb-list');
  if (!list) return;
  var data = getSortedLBData();
  var html = '';
  for (var i = 0; i < data.length; i++) {
    var p = data[i];
    var rank = i + 1;
    var rowClass = p.isMe ? 'lb-row lb-row-me' : 'lb-row';
    var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : ('#' + rank);
    var statVal = LB_SORT === 'totalWon'     ? (p.totalWon || 0).toLocaleString() + ' chips'
                : LB_SORT === 'level'        ? 'Level ' + (p.level || 1)
                : LB_SORT === 'bestWinStreak'? (p.bestWinStreak || 0) + ' streak'
                :                             (p.spins || 0).toLocaleString() + ' spins';
    var sendBtn = (!p.isMe && LB_TAB === 'friends')
      ? '<button class="lb-send-btn" data-fid="' + p.id + '">🎁 Send</button>'
      : '';
    html += '<div class="' + rowClass + '">'
      + '<span class="lb-rank">' + medal + '</span>'
      + '<span class="lb-avatar">' + p.avatar + '</span>'
      + '<span class="lb-info"><span class="lb-name">' + p.name + (p.isMe ? ' (You)' : '') + '</span>'
      + '<span class="lb-sub">Lv ' + (p.level || 1) + '</span></span>'
      + '<span class="lb-stat">' + statVal + '</span>'
      + sendBtn
      + '</div>';
  }
  list.innerHTML = html;

  var sendBtns = list.querySelectorAll('.lb-send-btn');
  for (var s = 0; s < sendBtns.length; s++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var fid = btn.getAttribute('data-fid');
        openSendChipsModal(fid);
      });
    })(sendBtns[s]);
  }
}

function openLeaderboardModal() {
  LB_TAB  = 'friends';
  LB_SORT = 'totalWon';
  updateLBTabUI();
  updateLBSortUI();
  renderLeaderboard();
  document.getElementById('leaderboard-modal').classList.add('show');
  playSound('click');
}

function closeLeaderboardModal() {
  document.getElementById('leaderboard-modal').classList.remove('show');
}

function updateLBTabUI() {
  var tabs = document.querySelectorAll('.lb-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === LB_TAB);
  }
}

function updateLBSortUI() {
  var sorts = document.querySelectorAll('.lb-sort');
  for (var i = 0; i < sorts.length; i++) {
    sorts[i].classList.toggle('active', sorts[i].getAttribute('data-sort') === LB_SORT);
  }
}

document.getElementById('leaderboard-btn').addEventListener('click', openLeaderboardModal);
document.getElementById('close-leaderboard-btn').addEventListener('click', function () {
  playSound('click');
  closeLeaderboardModal();
});
document.getElementById('leaderboard-modal').addEventListener('click', function (e) {
  if (e.target === this) { playSound('click'); closeLeaderboardModal(); }
});

var lbTabEls = document.querySelectorAll('.lb-tab');
for (var lbti = 0; lbti < lbTabEls.length; lbti++) {
  (function (tab) {
    tab.addEventListener('click', function () {
      LB_TAB = tab.getAttribute('data-tab') || 'friends';
      updateLBTabUI();
      renderLeaderboard();
    });
  })(lbTabEls[lbti]);
}

var lbSortEls = document.querySelectorAll('.lb-sort');
for (var lbsi = 0; lbsi < lbSortEls.length; lbsi++) {
  (function (sortEl) {
    sortEl.addEventListener('click', function () {
      LB_SORT = sortEl.getAttribute('data-sort') || 'totalWon';
      updateLBSortUI();
      renderLeaderboard();
    });
  })(lbSortEls[lbsi]);
}

document.getElementById('lb-copy-invite-btn').addEventListener('click', function () {
  copyToClipboard(buildInviteLink(), 'Invite link copied! 🔗');
});

// ── SEND CHIPS ───────────────────────────────────────────────────────────────

var SEND_CHIPS_FRIEND_ID = null;

function openSendChipsModal(friendId) {
  SEND_CHIPS_FRIEND_ID = friendId || null;
  var friend = null;
  for (var i = 0; i < SIMULATED_FRIENDS.length; i++) {
    if (SIMULATED_FRIENDS[i].id === friendId) { friend = SIMULATED_FRIENDS[i]; break; }
  }
  var recipEl = document.getElementById('send-chips-to');
  if (recipEl) {
    recipEl.textContent = 'To: ' + (friend ? (friend.avatar + ' ' + friend.name) : '🎯 A Friend');
  }
  var customInput = document.getElementById('send-chips-amount');
  if (customInput) customInput.value = '';
  var errEl = document.getElementById('send-chips-error');
  if (errEl) errEl.textContent = '';
  closeLeaderboardModal();
  document.getElementById('send-chips-modal').classList.add('show');
  playSound('click');
}

function closeSendChipsModal() {
  document.getElementById('send-chips-modal').classList.remove('show');
  SEND_CHIPS_FRIEND_ID = null;
}

function confirmSendChips(amount) {
  var amt = parseInt(amount, 10);
  if (!amt || amt <= 0) { showRewardToast('Enter a valid amount.'); return; }
  if (amt > STATE.balance) { showRewardToast('Not enough chips!'); return; }
  STATE.balance -= amt;
  updateUI();
  updateRewardProgress({ spun: false, won: false, bet: 0, bigWin: false, sentChips: true });
  var friend = null;
  for (var i = 0; i < SIMULATED_FRIENDS.length; i++) {
    if (SIMULATED_FRIENDS[i].id === SEND_CHIPS_FRIEND_ID) { friend = SIMULATED_FRIENDS[i]; break; }
  }
  var fname = friend ? friend.name : 'your friend';
  showRewardToast('Sent ' + amt.toLocaleString() + ' chips to ' + fname + '! 🎁');
  closeSendChipsModal();
}

document.getElementById('cancel-send-chips-btn').addEventListener('click', function () {
  playSound('click');
  closeSendChipsModal();
});
document.getElementById('send-chips-modal').addEventListener('click', function (e) {
  if (e.target === this) { playSound('click'); closeSendChipsModal(); }
});
document.getElementById('confirm-send-chips-btn').addEventListener('click', function () {
  var customInput = document.getElementById('send-chips-amount');
  var amt = customInput ? parseInt(customInput.value, 10) : 0;
  playSound('click');
  confirmSendChips(amt);
});

var presetBtns = document.querySelectorAll('.send-chip-preset');
for (var spi = 0; spi < presetBtns.length; spi++) {
  (function (btn) {
    btn.addEventListener('click', function () {
      playSound('click');
      confirmSendChips(parseInt(btn.getAttribute('data-amount'), 10));
    });
  })(presetBtns[spi]);
}

// ── ARENA ────────────────────────────────────────────────────────────────────

var ARENA_STATE = {
  roomCode: '',
  phase: 'lobby',
  stake: 50,
  opponents: [],
  results: []
};

var ARENA_WIN_RANK = { jackpot: 5, bigwin: 4, win: 3, pair: 2, lose: 1 };

function generateRoomCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  var buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  for (var i = 0; i < 6; i++) {
    code += chars[buf[i] % chars.length];
  }
  return code;
}

function getArenaOpponents() {
  var pool = SIMULATED_FRIENDS.slice();
  var shuffled = [];
  var buf = new Uint8Array(pool.length);
  crypto.getRandomValues(buf);
  for (var i = pool.length - 1; i > 0; i--) {
    var j = buf[i] % (i + 1);
    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  return pool.slice(0, 3);
}

function openArenaModal() {
  ARENA_STATE.roomCode = generateRoomCode();
  ARENA_STATE.phase = 'lobby';
  ARENA_STATE.opponents = getArenaOpponents();
  ARENA_STATE.stake = 50;
  ARENA_STATE.results = [];
  resetArenaToLobby();
  document.getElementById('arena-modal').classList.add('show');
  playSound('click');
}

function closeArenaModal() {
  document.getElementById('arena-modal').classList.remove('show');
}

function resetArenaToLobby() {
  document.getElementById('arena-lobby').style.display = '';
  document.getElementById('arena-battle').style.display = 'none';
  document.getElementById('arena-results').style.display = 'none';

  var codeEl = document.getElementById('arena-room-code');
  if (codeEl) codeEl.textContent = ARENA_STATE.roomCode;

  updateArenaStakeUI();
  renderArenaParticipants();
  updateArenaPool();
}

function renderArenaParticipants() {
  var container = document.getElementById('arena-participants');
  if (!container) return;
  var me = {
    id: MY_PLAYER_ID,
    name: getPlayerName(),
    avatar: '🎯',
    level: STATE.level,
    isMe: true
  };
  var all = [me].concat(ARENA_STATE.opponents);
  var html = '';
  for (var i = 0; i < all.length; i++) {
    var p = all[i];
    var cls = p.isMe ? 'arena-player-card arena-player-card-me' : 'arena-player-card';
    html += '<div class="' + cls + '">'
      + '<div class="arena-player-avatar">' + p.avatar + '</div>'
      + '<div class="arena-player-info">'
      + '<div class="arena-player-name">' + p.name + (p.isMe ? ' (You)' : '') + '</div>'
      + '<div class="arena-player-level">Lv ' + (p.level || 1) + '</div>'
      + '</div></div>';
  }
  container.innerHTML = html;
}

function updateArenaPool() {
  var totalParticipants = 1 + ARENA_STATE.opponents.length;
  var pool = ARENA_STATE.stake * totalParticipants;
  var poolEl = document.getElementById('arena-pool-display');
  if (poolEl) poolEl.textContent = "🪙 Pool: " + pool.toLocaleString() + " chips";
}

function updateArenaStakeUI() {
  var btns = document.querySelectorAll('.arena-stake-btn');
  for (var i = 0; i < btns.length; i++) {
    var val = parseInt(btns[i].getAttribute('data-stake'), 10);
    btns[i].classList.toggle('active', val === ARENA_STATE.stake);
  }
}

function simulateOpponentSpin() {
  var reels = [];
  for (var r = 0; r < 3; r++) {
    reels.push(weightedSymbol());
  }
  var pay = calcPayout(reels);
  var winType = pay.type || 'lose';
  return { syms: reels, payout: pay.mult * ARENA_STATE.stake, type: winType, multiplier: pay.mult };
}

function startArenaBattle() {
  if (ARENA_STATE.stake > STATE.balance) {
    showRewardToast('Not enough chips for this stake!');
    return;
  }

  STATE.balance -= ARENA_STATE.stake;
  updateUI();

  ARENA_STATE.phase = 'battle';
  document.getElementById('arena-lobby').style.display = 'none';
  document.getElementById('arena-battle').style.display = '';
  document.getElementById('arena-results').style.display = 'none';

  renderArenaBattle();

  setTimeout(function () {
    resolveArenaBattle();
  }, 2200);
}

function renderArenaBattle() {
  var list = document.getElementById('arena-battle-list');
  if (!list) return;
  var me = { id: MY_PLAYER_ID, name: getPlayerName(), avatar: '🎯', isMe: true };
  var all = [me].concat(ARENA_STATE.opponents);
  var html = '';
  for (var i = 0; i < all.length; i++) {
    var p = all[i];
    var cls = p.isMe ? 'arena-battle-card arena-battle-card-me' : 'arena-battle-card';
    html += '<div class="' + cls + '">'
      + '<span class="arena-battle-avatar">' + p.avatar + '</span>'
      + '<span class="arena-battle-name">' + (p.isMe ? 'You' : p.name) + '</span>'
      + '<span class="arena-spin-anim">🎰 spinning…</span>'
      + '</div>';
  }
  list.innerHTML = html;
}

function resolveArenaBattle() {
  var myReels = [];
  for (var r = 0; r < 3; r++) myReels.push(weightedSymbol());
  var myPay = calcPayout(myReels);
  var myType = myPay.type || 'lose';
  var myPayout = myPay.mult * ARENA_STATE.stake;

  var results = [{
    id: MY_PLAYER_ID,
    name: getPlayerName(),
    avatar: '🎯',
    isMe: true,
    syms: myReels,
    type: myType,
    multiplier: myPay.mult,
    payout: myPayout
  }];

  for (var i = 0; i < ARENA_STATE.opponents.length; i++) {
    var opp = ARENA_STATE.opponents[i];
    var spin = simulateOpponentSpin();
    results.push({
      id: opp.id,
      name: opp.name,
      avatar: opp.avatar,
      isMe: false,
      syms: spin.syms,
      type: spin.type,
      multiplier: spin.multiplier,
      payout: spin.payout
    });
  }

  results.sort(function (a, b) {
    var ra = ARENA_WIN_RANK[a.type] || 0;
    var rb = ARENA_WIN_RANK[b.type] || 0;
    if (rb !== ra) return rb - ra;
    return (b.multiplier || 0) - (a.multiplier || 0);
  });

  ARENA_STATE.results = results;

  var totalParticipants = 1 + ARENA_STATE.opponents.length;
  var pool = ARENA_STATE.stake * totalParticipants;
  var winner = results[0];
  var iWon = winner.isMe;

  if (iWon) {
    STATE.balance += pool;
    STATE.totalWon += pool;
    STATE.currentWinStreak++;
    if (STATE.currentWinStreak > STATE.bestWinStreak) STATE.bestWinStreak = STATE.currentWinStreak;
  } else {
    STATE.currentWinStreak = 0;
  }

  updateUI();
  updateRewardProgress({ spun: true, won: iWon, bet: ARENA_STATE.stake, bigWin: false, playedArena: true });
  updateProgressionUI();

  ARENA_STATE.phase = 'results';
  document.getElementById('arena-battle').style.display = 'none';
  document.getElementById('arena-results').style.display = '';
  renderArenaResults(pool, iWon);
}

function renderArenaResults(pool, iWon) {
  var msgEl = document.getElementById('arena-result-msg');
  if (msgEl) {
    msgEl.textContent = iWon ? '🏆 You won the pool!' : '💀 Better luck next time!';
    msgEl.className = 'arena-result-msg ' + (iWon ? 'arena-result-win' : 'arena-result-lose');
  }

  var poolEl = document.getElementById('arena-result-pool');
  if (poolEl) poolEl.textContent = '🏆 Pool Prize: ' + pool.toLocaleString() + ' chips';

  var list = document.getElementById('arena-result-list');
  if (!list) return;
  var html = '';
  for (var i = 0; i < ARENA_STATE.results.length; i++) {
    var p = ARENA_STATE.results[i];
    var rowClass = 'arena-result-row' + (i === 0 ? ' arena-result-row-winner' : '') + (p.isMe ? ' arena-result-row-me' : '');
    var symStr = p.syms ? p.syms.map(function (idx) { return SYMBOLS[idx] ? SYMBOLS[idx].sym : '?'; }).join(' ') : '? ? ?';
    var outcomeClass = 'arena-result-outcome ' + (p.type || 'lose');
    var outcomeLabel = p.type === 'jackpot' ? '💰 JACKPOT'
                     : p.type === 'bigwin'  ? '🔥 BIG WIN'
                     : p.type === 'win'     ? '✅ WIN'
                     : p.type === 'pair'    ? '🔄 PAIR'
                     : '❌ LOSE';
    html += '<div class="' + rowClass + '">'
      + (i === 0 ? '<span class="arena-result-crown">👑</span>' : '<span class="arena-result-crown">#' + (i + 1) + '</span>')
      + '<span class="arena-result-avatar">' + p.avatar + '</span>'
      + '<span class="arena-result-name">' + (p.isMe ? 'You' : p.name) + '</span>'
      + '<span class="arena-result-syms">' + symStr + '</span>'
      + '<span class="' + outcomeClass + '">' + outcomeLabel + '</span>'
      + '</div>';
  }
  list.innerHTML = html;
}

document.getElementById('arena-btn').addEventListener('click', openArenaModal);
document.getElementById('close-arena-btn').addEventListener('click', function () {
  playSound('click');
  closeArenaModal();
});
document.getElementById('arena-modal').addEventListener('click', function (e) {
  if (e.target === this) { playSound('click'); closeArenaModal(); }
});

document.getElementById('arena-copy-code-btn').addEventListener('click', function () {
  copyToClipboard(buildInviteLink(ARENA_STATE.roomCode), 'Room link copied! 🔗');
});

document.getElementById('arena-start-btn').addEventListener('click', function () {
  playSound('click');
  startArenaBattle();
});

document.getElementById('arena-play-again-btn').addEventListener('click', function () {
  playSound('click');
  ARENA_STATE.opponents = getArenaOpponents();
  ARENA_STATE.roomCode = generateRoomCode();
  ARENA_STATE.results = [];
  resetArenaToLobby();
});

var stakeBtns = document.querySelectorAll('.arena-stake-btn');
for (var stki = 0; stki < stakeBtns.length; stki++) {
  (function (btn) {
    btn.addEventListener('click', function () {
      ARENA_STATE.stake = parseInt(btn.getAttribute('data-stake'), 10) || 50;
      updateArenaStakeUI();
      updateArenaPool();
    });
  })(stakeBtns[stki]);
}

// ── URL INVITE ───────────────────────────────────────────────────────────────

function copyToClipboard(text, successMsg) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  var ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
  if (ok) {
    showRewardToast(successMsg || 'Copied!');
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      showRewardToast(successMsg || 'Copied!');
    }).catch(function () {
      showRewardToast('Link: ' + text);
    });
  } else {
    showRewardToast('Link: ' + text);
  }
}

function buildInviteLink(roomCode) {
  var base = window.location.href.split('?')[0];
  var ref = MY_PLAYER_ID.slice(-6).toUpperCase();
  var url = base + '?ref=' + ref;
  if (roomCode) url += '&room=' + roomCode;
  return url;
}

function checkInviteUrl() {
  var search = window.location.search;
  if (!search) return;
  var params = {};
  search.slice(1).split('&').forEach(function (pair) {
    var kv = pair.split('=');
    params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
  });
  if (params.ref) {
    STATE.balance += 100;
    updateUI();
    showRewardToast('🎁 Bonus! +100 chips for joining via invite!');
  }
}

applyTheme(loadTheme());

STATE.progressiveJackpot = loadProgressiveJackpot();
document.getElementById('pj-amount').textContent = STATE.progressiveJackpot.toLocaleString();

initReels();
initSpeech();
drawWheel(0);
updateAutoplayUI();
updateFastSpinUI();
updateSpinAvailability();
loadRewards();
initLoginStreak();
updateRewardsBadge();
loadProgression();
updateProgressionUI();
checkInviteUrl();
