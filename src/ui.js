export const RADIUS = 125;
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
  // kind: 'start' | 'resume' | 'restart'
  let label = i18n[currentLang].start;
  if (kind === 'resume') label = i18n[currentLang].resume;
  if (kind === 'restart') label = i18n[currentLang].restart || i18n[currentLang].start;
  els.startBtn.textContent = label;
}

export function setStartDisabled(disabled) {
  els.startBtn.disabled = !!disabled;
}

export function vibrate(ms = 120) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

export function finishedInfo(total) {
  return i18n[currentLang].finishedInfo(total);
}
