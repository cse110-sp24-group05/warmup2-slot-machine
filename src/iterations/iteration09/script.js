const CELL_HEIGHT = 80;
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
  let r = secureRandom() * TOTAL_WEIGHT;
  for (let i = 0; i < SYMBOL_WEIGHTS.length; i++) {
    r -= SYMBOL_WEIGHTS[i];
    if (r <= 0) return i;
  }
  return SYMBOL_WEIGHTS.length - 1;
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
};

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
  const btn = document.getElementById('speech-toggle');
  if (STATE.speechEnabled) {
    btn.classList.add('active');
    btn.innerHTML = '\u{1F50A} Voice';
    speak('Voice enabled. Welcome to Safari Casino.');
  } else {
    btn.classList.remove('active');
    btn.innerHTML = '\u{1F507} Voice';
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

function BgNode() {
  this.x = Math.random() * bgCanvas.width;
  this.y = Math.random() * bgCanvas.height;
  this.vx = (Math.random() - 0.5) * 0.22;
  this.vy = (Math.random() - 0.5) * 0.22;
  this.r = Math.random() * 1.4 + 0.6;
  this.phase = Math.random() * Math.PI * 2;
}

BgNode.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  this.phase += 0.014;
  if (this.x < -20) this.x = bgCanvas.width + 20;
  if (this.x > bgCanvas.width + 20) this.x = -20;
  if (this.y < -20) this.y = bgCanvas.height + 20;
  if (this.y > bgCanvas.height + 20) this.y = -20;
};

function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  const cc = document.getElementById('confetti-canvas');
  cc.width = window.innerWidth;
  cc.height = window.innerHeight;
}

function initBgNodes() {
  bgNodes = [];
  for (let i = 0; i < NODE_COUNT; i++) bgNodes.push(new BgNode());
}

function drawBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  const rgb = '212,175,55';
  let i, j, dx, dy, dist, alpha;

  for (i = 0; i < bgNodes.length; i++) {
    for (j = i + 1; j < bgNodes.length; j++) {
      dx = bgNodes[i].x - bgNodes[j].x;
      dy = bgNodes[i].y - bgNodes[j].y;
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECT_DIST) {
        alpha = (1 - dist / CONNECT_DIST) * 0.045;
        bgCtx.strokeStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
        bgCtx.lineWidth = 0.5;
        bgCtx.beginPath();
        bgCtx.moveTo(bgNodes[i].x, bgNodes[i].y);
        bgCtx.lineTo(bgNodes[j].x, bgNodes[j].y);
        bgCtx.stroke();
      }
    }
  }

  bgNodes.forEach(function (n) {
    alpha = 0.07 + Math.sin(n.phase) * 0.04;
    bgCtx.fillStyle = 'rgba(' + rgb + ',' + alpha.toFixed(3) + ')';
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
    setTimeout(function () {
      const totalCells = STRIP.length + 2;
      const loops = Math.floor(duration / 80);
      let frame = 0;
      let pos = 0;
      reelEl.style.transition = '';

      const interval = setInterval(function () {
        pos = (pos + CELL_HEIGHT) % (totalCells * CELL_HEIGHT);
        reelEl.style.transform = 'translateY(-' + pos + 'px)';
        frame++;
        if (frame % 5 === 0) playSound('tick');

        if (frame >= loops) {
          clearInterval(interval);
          const offset = targetStripPos * CELL_HEIGHT;
          reelEl.style.transition = 'transform 0.28s cubic-bezier(0.25,0.8,0.5,1)';
          reelEl.style.transform = 'translateY(-' + offset + 'px)';
          setTimeout(resolve, 300);
        }
      }, 40);
    }, delay);
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

function addHistory(indices, bet, winAmt, type, combo) {
  const syms = indices.map(function (i) { return SYMBOLS[i].sym; }).join(' ');
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  STATE.spinHistory.unshift({ syms: syms, bet: bet, winAmt: winAmt, type: type, combo: combo, ts: ts });
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
    }

    if (type === 'lose') {
      updateProgressiveJackpot(Math.ceil(bet * JACKPOT_CONTRIBUTION_RATE));
      STATE.totalBurned += bet;
    }

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

document.getElementById('open-funds-modal-btn').addEventListener('click', openFundsModal);

document.getElementById('funds-modal').addEventListener('click', function (e) {
  if (e.target === this) closeFundsModal();
});

document.querySelectorAll('.modal-preset[data-amount]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    addFundsAndClose(parseInt(this.dataset.amount));
  });
});

document.getElementById('confirm-custom-btn').addEventListener('click', confirmCustomFunds);
document.getElementById('cancel-funds-btn').addEventListener('click', closeFundsModal);

document.getElementById('custom-amount').addEventListener('keydown', function (e) {
  if (e.key === 'Enter')  confirmCustomFunds();
  if (e.key === 'Escape') closeFundsModal();
});

document.getElementById('custom-amount').addEventListener('input', clearCustomFundsError);

document.getElementById('open-paytable-btn').addEventListener('click', openPaytableModal);
document.getElementById('close-paytable-btn').addEventListener('click', closePaytableModal);
document.getElementById('paytable-modal').addEventListener('click', function (e) {
  if (e.target === this) closePaytableModal();
});

document.getElementById('spin-btn').addEventListener('click', function () { spin(); });
document.getElementById('reset-btn').addEventListener('click', resetGame);

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

document.getElementById('wheel-spin-btn').addEventListener('click', spinBonusWheel);
document.getElementById('wheel-close-btn').addEventListener('click', closeBonusModal);

// ── Init ───────────────────────────────────────────────────────────────────
STATE.progressiveJackpot = loadProgressiveJackpot();
document.getElementById('pj-amount').textContent = STATE.progressiveJackpot.toLocaleString();

initReels();
initSpeech();
drawWheel(0);
updateSpinAvailability();
