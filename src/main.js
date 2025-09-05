import { Timer, Phase } from './timer.js';
import { setupAudio, playShortBeep, playLongBeep, playFinish } from './audio.js';
import { els, initUI, updateTimeLeft, updateSetInfo, updateProgress, setPhase, setStartButtonLabel, vibrate, setLanguage, getLanguage, finishedInfo } from './ui.js';

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
