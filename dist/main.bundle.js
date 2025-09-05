const Phase = Object.freeze({
  Idle: 'idle',
  Prep: 'prep',
  Work: 'work',
  Rest: 'rest',
  Finished: 'finished',
});

class Timer {
  constructor({ prep = 5, work = 20, rest = 10, totalSets = 8, onTick, onPhaseChange, onFinish }) {
    this.config = { prep, work, rest };
    this.totalSets = totalSets;
    this.onTick = onTick || (() => {});
    this.onPhaseChange = onPhaseChange || (() => {});
    this.onFinish = onFinish || (() => {});

    this._heartbeatMs = 250; // drift-tolerant kontrol frekansı
    this.intervalId = null;
    this.phaseEndAt = null; // ms cinsinden bitiş zamanı
    this.reset(totalSets);
  }

  get state() {
    return {
      phase: this.phase,
      timeLeft: this.timeLeft,
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



const RADIUS = 140;
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
  body: document.body,
};

const i18n = {
  en: {
    status: { idle: 'START', prep: 'PREP', work: 'WORK', rest: 'REST', finished: 'DONE!' },
    start: 'Start',
    resume: 'Resume',
    pause: 'Pause',
    reset: 'Reset',
    setsLabel: 'Sets:',
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
    setsLabel: 'Set Sayısı:',
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
  if (els.pauseBtn) els.pauseBtn.textContent = i18n[currentLang].pause;
  if (els.resetBtn) els.resetBtn.textContent = i18n[currentLang].reset;
  // Start button depends on state
  if (state) {
    if (state.isPaused) {
      if (state.phase === 'idle') setStartButtonLabel('start'); else setStartButtonLabel('resume');
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
  const progress = timeLeft / totalDuration;
  const safe = Math.max(0, progress);
  const dashoffset = CIRCUMFERENCE * (1 - safe);
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
  // kind: 'start' | 'resume'
  const label = kind === 'resume' ? i18n[currentLang].resume : i18n[currentLang].start;
  els.startBtn.textContent = label;
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
const savedLang = localStorage.getItem('tabata_lang');
setLanguage(savedLang || 'tr');

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
  onTick: (state) => {
    updateTimeLeft(state.timeLeft);
    // duration for current phase
    let totalDuration = 1;
    if (state.phase === Phase.Prep) totalDuration = PREP_TIME;
    else if (state.phase === Phase.Work) totalDuration = WORK_TIME;
    else if (state.phase === Phase.Rest) totalDuration = REST_TIME;
    updateProgress(state.timeLeft, totalDuration);
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
  }
});

// Event listeners
els.startBtn.addEventListener('click', async () => {
  await setupAudio();
  const wasIdle = timer.state.phase === Phase.Idle;
  timer.start();
  if (!wasIdle) setStartButtonLabel('resume');
});

els.pauseBtn.addEventListener('click', () => {
  timer.pause();
  setStartButtonLabel('resume');
});

els.resetBtn.addEventListener('click', () => {
  totalSets = parseInt(els.setsInput.value, 10) || 8;
  timer.reset(totalSets);
  setPhase(Phase.Idle);
  setStartButtonLabel('start');
  initUI(totalSets, WORK_TIME);
});

els.setsInput.addEventListener('change', () => {
  const v = parseInt(els.setsInput.value, 10) || 8;
  localStorage.setItem('tabata_sets', String(v));
  totalSets = v;
  timer.reset(totalSets);
  setPhase(Phase.Idle);
  setStartButtonLabel('start');
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
  // If this file is opened from dist/, register sw at ./sw.js
  const swPath = (location.pathname.includes('/dist/')) ? './sw.js' : './dist/sw.js';
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
