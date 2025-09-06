const Phase = Object.freeze({
  Idle: 'idle',
  Prep: 'prep',
  Work: 'work',
  Rest: 'rest',
  Finished: 'finished',
});

class Timer {
  constructor({ prep = 5, work = 20, rest = 10, totalSets = 8, onTick, onPhaseChange, onFinish, onBeat }) {
    this.config = { prep, work, rest };
    this.totalSets = totalSets;
    this.onTick = onTick || (() => {});
    this.onPhaseChange = onPhaseChange || (() => {});
    this.onFinish = onFinish || (() => {});
    this.onBeat = onBeat || (() => {});

    this._heartbeatMs = 200; // drift-tolerant kontrol frekansı (daha akıcı 1s geçişi)
    this.intervalId = null;
    this.phaseEndAt = null; // ms cinsinden bitiş zamanı
    this.reset(totalSets);
  }

  get state() {
    return {
      phase: this.phase,
      timeLeft: this.timeLeft,
      msLeft: Math.max(0, this.phaseEndAt ? (this.phaseEndAt - Date.now()) : this.timeLeft * 1000),
      currentSet: this.currentSet,
      totalSets: this.totalSets,
      isPaused: this.isPaused,
    };
  }

  start() {
    if (!this.isPaused) return;
    this.isPaused = false;

    const now = Date.now();
    if (this.phase === Phase.Idle) {
      this.phase = Phase.Prep;
      this.timeLeft = this.config.prep;
      this.phaseEndAt = now + this.timeLeft * 1000;
      this._emitPhase();
      this._emitTick();
    } else {
      // Devam: mevcut kalan süreye göre yeni bitiş zamanını ayarla
      this.phaseEndAt = now + Math.max(0, this.timeLeft) * 1000;
    }

    if (!this.intervalId) {
      this.intervalId = setInterval(() => this._heartbeat(), this._heartbeatMs);
    }
  }

  pause() {
    // Kalan süreyi doğru hesapla, zamanlayıcıyı durdur
    const now = Date.now();
    if (this.phaseEndAt) {
      this.timeLeft = Math.max(0, Math.ceil((this.phaseEndAt - now) / 1000));
    }
    this.isPaused = true;
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  reset(newTotalSets) {
    this.pause();
    if (typeof newTotalSets === 'number' && newTotalSets > 0) {
      this.totalSets = newTotalSets;
    }
    this.phase = Phase.Idle;
    this.currentSet = 0;
    this.timeLeft = this.config.work;
    this.isPaused = true;
    this.phaseEndAt = null;
    this._emitTick();
  }

  _heartbeat() {
    if (this.isPaused) return;
    if (![Phase.Prep, Phase.Work, Phase.Rest].includes(this.phase)) return;
    const now = Date.now();
    if (!this.phaseEndAt) this.phaseEndAt = now + Math.max(0, this.timeLeft) * 1000;
    // Emit beat for smooth UI progress every heartbeat
    this._emitBeat();

    const remaining = Math.ceil((this.phaseEndAt - now) / 1000);
    if (remaining !== this.timeLeft) {
      this.timeLeft = remaining;
      this._emitTick();
    }

    if (remaining <= 0) {
      // Faz geçişi
      if (this.phase === Phase.Prep) {
        this.phase = Phase.Work;
        this.timeLeft = this.config.work;
        this.currentSet = 1;
      } else if (this.phase === Phase.Work) {
        if (this.currentSet >= this.totalSets) {
          this._finish();
          return;
        }
        this.phase = Phase.Rest;
        this.timeLeft = this.config.rest;
      } else if (this.phase === Phase.Rest) {
        this.phase = Phase.Work;
        this.currentSet += 1;
        this.timeLeft = this.config.work;
      }
      this.phaseEndAt = Date.now() + this.timeLeft * 1000;
      this._emitPhase();
      this._emitTick();
      this._emitBeat();
    }
  }

  _finish() {
    this.pause();
    this.phase = Phase.Finished;
    this.isPaused = true;
    this._emitPhase();
    this._emitTick();
    this.onFinish(this.state);
  }

  _emitTick() {
    this.onTick(this.state);
  }

  _emitPhase() {
    this.onPhaseChange(this.state);
  }

  _emitBeat() {
    this.onBeat(this.state);
  }
}


let audioContext;
let finishBuffer;

export async function setupAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  try {
    const res = await fetch('assets/audio/finish.mp3');
    const arr = await res.arrayBuffer();
    finishBuffer = await audioContext.decodeAudioData(arr);
  } catch (_) {
    finishBuffer = null; // Fallback tona düşeceğiz
  }
}

function playBuffer(buffer) {
  if (!audioContext || !buffer) return;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
}

function playTone(frequency, duration, type = 'sine') {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.7, now + 0.01);
  oscillator.start(now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.stop(now + duration);
}

const playShortBeep = () => playTone(880, 0.15, 'triangle');
const playLongBeep = () => playTone(440, 0.5, 'sine');

function playFinish() {
  if (finishBuffer) {
    playBuffer(finishBuffer);
  } else {
    // Yedek: 2 uzun bip
    playLongBeep();
    setTimeout(() => playLongBeep(), 600);
  }
}



const RADIUS = 125;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const els = {
  timeLeft: document.getElementById('time-left'),
  status: document.getElementById('status'),
  setInfo: document.getElementById('set-info'),
  progressBar: document.getElementById('progress-bar'),
  startBtn: document.getElementById('startBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  setsInput: document.getElementById('sets-input'),
  setsLabel: document.getElementById('sets-label') || document.querySelector('label[for="sets-input"]'),
  langSelect: document.getElementById('lang-select'),
  langLabel: document.getElementById('lang-label'),
  heroTitle: document.getElementById('hero-title'),
  heroLead: document.getElementById('hero-lead'),
  body: document.body,
};

const i18n = {
  en: {
    status: { idle: 'START', prep: 'PREP', work: 'WORK', rest: 'REST', finished: 'DONE!' },
    start: 'Start',
    resume: 'Resume',
    pause: 'Pause',
    reset: 'Reset',
    restart: 'Restart',
    setsLabel: 'Sets:',
    heroTitle: 'Tabata Timer by ALPER K.',
    heroLead: 'Free, PWA-ready Tabata timer with circular progress, audio/vibration cues, bilingual UI (EN/TR), and offline support.',
    setInfoIdle: (total) => `Set 0 / ${total}`,
    setInfo: (current, total) => `Set ${current} / ${total}`,
    finishedInfo: (total) => `Congrats! ${total} ${total === 1 ? 'set' : 'sets'} completed.`,
    langLabel: 'Language:',
  },
  tr: {
    status: { idle: 'BAŞLA', prep: 'HAZIRLAN', work: 'ÇALIŞ', rest: 'MOLA', finished: 'BİTTİ!' },
    start: 'Başlat',
    resume: 'Devam',
    pause: 'Duraklat',
    reset: 'Sıfırla',
    restart: 'Yeniden Başla',
    setsLabel: 'Set Sayısı:',
    heroTitle: 'Tabata Timer by ALPER K.',
    heroLead: 'Dairesel ilerleme, ses/titreşim uyarıları, iki dilli arayüz (TR/EN) ve çevrimdışı destek sunan ücretsiz, PWA tabanlı Tabata zamanlayıcı.',
    setInfoIdle: (total) => `Set 0 / ${total}`,
    setInfo: (current, total) => `Set ${current} / ${total}`,
    finishedInfo: (total) => `Tebrikler! ${total} set tamamlandı.`,
    langLabel: 'Dil:',
  }
};

let currentLang = 'tr';
function getLanguage() { return currentLang; }
function t() { return i18n[currentLang]; }

function setLanguage(lang, state) {
  currentLang = (lang && i18n[lang]) ? lang : 'tr';
  if (els.langSelect) els.langSelect.value = currentLang;
  // Update html lang attribute
  document.documentElement.setAttribute('lang', currentLang);
  // Static texts
  if (els.setsLabel) els.setsLabel.textContent = i18n[currentLang].setsLabel;
  if (els.langLabel) els.langLabel.textContent = i18n[currentLang].langLabel;
  if (els.heroTitle) els.heroTitle.textContent = i18n[currentLang].heroTitle;
  if (els.heroLead) els.heroLead.textContent = i18n[currentLang].heroLead;
  if (els.pauseBtn) els.pauseBtn.textContent = i18n[currentLang].pause;
  if (els.resetBtn) els.resetBtn.textContent = i18n[currentLang].reset;
  // Start button depends on state
  if (state) {
    if (state.isPaused) {
      if (state.phase === 'idle' || state.phase === 'finished') setStartButtonLabel('start'); else setStartButtonLabel('resume');
    }
  } else {
    setStartButtonLabel('start');
  }
  // Status and set info can be re-applied if state provided
  if (state) {
    setPhase(state.phase);
    if (state.phase === 'finished') {
      els.setInfo.textContent = i18n[currentLang].finishedInfo(state.totalSets);
    } else {
      updateSetInfo(state.currentSet, state.totalSets, state.phase);
    }
  }
}

function initUI(totalSets, workTime) {
  els.progressBar.style.strokeDasharray = CIRCUMFERENCE;
  els.progressBar.style.strokeDashoffset = 0;
  els.timeLeft.textContent = workTime;
  els.status.textContent = i18n[currentLang].status.idle;
  els.setInfo.textContent = i18n[currentLang].setInfoIdle(totalSets);
}

function updateTimeLeft(value) {
  els.timeLeft.textContent = value >= 0 ? value : 0;
}

function updateSetInfo(currentSet, totalSets, phase) {
  if (phase === 'idle' || phase === 'prep') {
    els.setInfo.textContent = i18n[currentLang].setInfoIdle(totalSets);
  } else if (phase !== 'finished') {
    els.setInfo.textContent = i18n[currentLang].setInfo(currentSet, totalSets);
  }
}

function updateProgress(timeLeft, totalDuration) {
  // timeLeft may be in ms (preferred) or seconds
  const denomMs = totalDuration * 1000;
  const tlMs = timeLeft > 100 ? timeLeft : timeLeft * 1000;
  let frac = tlMs / denomMs; // remaining fraction
  // Clamp for perfect full start and empty end
  const EPS_START = 200; // ms tolerance at phase start
  const EPS_END = 40;    // ms tolerance at phase end
  if (tlMs >= denomMs - EPS_START) frac = 1;
  if (tlMs <= EPS_END) frac = 0;
  frac = Math.max(0, Math.min(1, frac));
  const dashoffset = CIRCUMFERENCE * (1 - frac);
  els.progressBar.style.strokeDashoffset = dashoffset;
}

function setPhase(phase) {
  els.body.classList.remove('phase-idle', 'phase-prep', 'phase-work', 'phase-rest', 'phase-finished');
  els.body.classList.add(`phase-${phase}`);
  if (phase === 'prep') els.status.textContent = i18n[currentLang].status.prep;
  else if (phase === 'work') els.status.textContent = i18n[currentLang].status.work;
  else if (phase === 'rest') els.status.textContent = i18n[currentLang].status.rest;
  else if (phase === 'finished') els.status.textContent = i18n[currentLang].status.finished;
  else els.status.textContent = i18n[currentLang].status.idle;
}

function setStartButtonLabel(kind) {
  // kind: 'start' | 'resume' | 'restart'
  let label = i18n[currentLang].start;
  if (kind === 'resume') label = i18n[currentLang].resume;
  if (kind === 'restart') label = i18n[currentLang].restart || i18n[currentLang].start;
  els.startBtn.textContent = label;
}

function setStartDisabled(disabled) {
  els.startBtn.disabled = !!disabled;
}

function vibrate(ms = 120) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function finishedInfo(total) {
  return i18n[currentLang].finishedInfo(total);
}





// Config
const PREP_TIME = 5;
const WORK_TIME = 20;
const REST_TIME = 10;

// Load saved sets and language
const savedSets = parseInt(localStorage.getItem('tabata_sets'), 10);
if (!Number.isNaN(savedSets) && savedSets > 0) {
  els.setsInput.value = savedSets;
}
const params = new URLSearchParams(location.search);
const urlLang = params.get('lang');
const savedLang = localStorage.getItem('tabata_lang');
setLanguage((urlLang || savedLang || 'tr'));
if (urlLang) localStorage.setItem('tabata_lang', urlLang);

let totalSets = parseInt(els.setsInput.value, 10) || 8;

// Init UI
initUI(totalSets, WORK_TIME);
// Ensure static texts reflect language
setLanguage(getLanguage(), { phase: 'idle', timeLeft: WORK_TIME, currentSet: 0, totalSets, isPaused: true });

const timer = new Timer({
  prep: PREP_TIME,
  work: WORK_TIME,
  rest: REST_TIME,
  totalSets,
  onBeat: (state) => {
    // Smooth ring sync each heartbeat using msLeft
    let totalDuration = 1;
    if (state.phase === Phase.Prep) totalDuration = PREP_TIME;
    else if (state.phase === Phase.Work) totalDuration = WORK_TIME;
    else if (state.phase === Phase.Rest) totalDuration = REST_TIME;
    const ms = state.msLeft ?? (state.timeLeft * 1000);
    updateProgress(ms, totalDuration);
    // Numeric shows 1 during the last full second, 0 only at phase end
    const disp = Math.max(0, Math.ceil(ms / 1000));
    updateTimeLeft(disp);
  },
  onTick: (state) => {
    updateTimeLeft(state.timeLeft);
    // duration for current phase
    let totalDuration = 1;
    if (state.phase === Phase.Prep) totalDuration = PREP_TIME;
    else if (state.phase === Phase.Work) totalDuration = WORK_TIME;
    else if (state.phase === Phase.Rest) totalDuration = REST_TIME;
    // Redundant safety update (in case beat missed)
    updateProgress(state.msLeft ?? (state.timeLeft * 1000), totalDuration);
    updateSetInfo(state.currentSet, state.totalSets, state.phase);

    // Audio cues
    if (state.phase === Phase.Prep) {
      if (state.timeLeft > 0) playShortBeep();
    } else if (state.phase === Phase.Work || state.phase === Phase.Rest) {
      if (state.timeLeft === 0) {
        // Son setin sonu değilse uzun bip
        if (!(state.phase === Phase.Work && state.currentSet >= state.totalSets)) {
          playLongBeep();
        }
      } else if (state.timeLeft > 0 && state.timeLeft <= 3) {
        playShortBeep();
      }
    }
  },
  onPhaseChange: (state) => {
    setPhase(state.phase);
    vibrate(120);
  },
  onFinish: (state) => {
    playFinish();
    els.timeLeft.textContent = '🎉';
    els.setInfo.textContent = finishedInfo(state.totalSets);
    updateProgress(0, 1);
    vibrate(200);
    setStartButtonLabel('start');
    setStartDisabled(false);
  }
});

// Event listeners
els.startBtn.addEventListener('click', async () => {
  await setupAudio();
  // If finished, reset then treat as fresh start
  if (timer.state.phase === Phase.Finished) {
    const v = parseInt(els.setsInput.value, 10) || 8;
    timer.reset(v);
    setPhase(Phase.Idle);
    setStartButtonLabel('start');
    initUI(v, WORK_TIME);
  }
  const wasIdle = timer.state.phase === Phase.Idle;
  timer.start();
  if (!wasIdle) setStartButtonLabel('resume');
  // Disable start until paused or finished
  setStartDisabled(true);
});

els.pauseBtn.addEventListener('click', () => {
  timer.pause();
  setStartButtonLabel('resume');
  setStartDisabled(false);
});

els.resetBtn.addEventListener('click', () => {
  totalSets = parseInt(els.setsInput.value, 10) || 8;
  timer.reset(totalSets);
  setPhase(Phase.Idle);
  setStartButtonLabel('start');
  setStartDisabled(false);
  initUI(totalSets, WORK_TIME);
});

els.setsInput.addEventListener('change', () => {
  const v = parseInt(els.setsInput.value, 10) || 8;
  localStorage.setItem('tabata_sets', String(v));
  totalSets = v;
  timer.reset(totalSets);
  setPhase(Phase.Idle);
  setStartButtonLabel('start');
  setStartDisabled(false);
  initUI(totalSets, WORK_TIME);
});

// Keyboard shortcut: Space toggles start/pause
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (timer.state.isPaused) {
      els.startBtn.click();
    } else {
      els.pauseBtn.click();
    }
  }
});

// Register Service Worker when served over http(s)
if ('serviceWorker' in navigator && window.isSecureContext) {
  // Register sw from current directory to avoid path mismatches on Pages/docs
  const swPath = './sw.js';
  navigator.serviceWorker.register(swPath).catch(() => {});
}

// Language selection
if (els.langSelect) {
  // Initialize control value
  els.langSelect.value = getLanguage();
  els.langSelect.addEventListener('change', () => {
    const lang = els.langSelect.value;
    localStorage.setItem('tabata_lang', lang);
    setLanguage(lang, timer.state);
  });
}
