export const RADIUS = 140;
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const els = {
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
export function getLanguage() { return currentLang; }
export function t() { return i18n[currentLang]; }

export function setLanguage(lang, state) {
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

export function initUI(totalSets, workTime) {
  els.progressBar.style.strokeDasharray = CIRCUMFERENCE;
  els.progressBar.style.strokeDashoffset = 0;
  els.timeLeft.textContent = workTime;
  els.status.textContent = i18n[currentLang].status.idle;
  els.setInfo.textContent = i18n[currentLang].setInfoIdle(totalSets);
}

export function updateTimeLeft(value) {
  els.timeLeft.textContent = value >= 0 ? value : 0;
}

export function updateSetInfo(currentSet, totalSets, phase) {
  if (phase === 'idle' || phase === 'prep') {
    els.setInfo.textContent = i18n[currentLang].setInfoIdle(totalSets);
  } else if (phase !== 'finished') {
    els.setInfo.textContent = i18n[currentLang].setInfo(currentSet, totalSets);
  }
}

export function updateProgress(timeLeft, totalDuration) {
  const progress = timeLeft / totalDuration;
  const safe = Math.max(0, progress);
  const dashoffset = CIRCUMFERENCE * (1 - safe);
  els.progressBar.style.strokeDashoffset = dashoffset;
}

export function setPhase(phase) {
  els.body.classList.remove('phase-idle', 'phase-prep', 'phase-work', 'phase-rest', 'phase-finished');
  els.body.classList.add(`phase-${phase}`);
  if (phase === 'prep') els.status.textContent = i18n[currentLang].status.prep;
  else if (phase === 'work') els.status.textContent = i18n[currentLang].status.work;
  else if (phase === 'rest') els.status.textContent = i18n[currentLang].status.rest;
  else if (phase === 'finished') els.status.textContent = i18n[currentLang].status.finished;
  else els.status.textContent = i18n[currentLang].status.idle;
}

export function setStartButtonLabel(kind) {
  // kind: 'start' | 'resume'
  const label = kind === 'resume' ? i18n[currentLang].resume : i18n[currentLang].start;
  els.startBtn.textContent = label;
}

export function vibrate(ms = 120) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

export function finishedInfo(total) {
  return i18n[currentLang].finishedInfo(total);
}
