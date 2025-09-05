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
  body: document.body,
};

export function initUI(totalSets, workTime) {
  els.progressBar.style.strokeDasharray = CIRCUMFERENCE;
  els.progressBar.style.strokeDashoffset = 0;
  els.timeLeft.textContent = workTime;
  els.status.textContent = 'BAŞLA';
  els.setInfo.textContent = `Set 0 / ${totalSets}`;
}

export function updateTimeLeft(value) {
  els.timeLeft.textContent = value >= 0 ? value : 0;
}

export function updateSetInfo(currentSet, totalSets, phase) {
  if (phase === 'idle' || phase === 'prep') {
    els.setInfo.textContent = `Set 0 / ${totalSets}`;
  } else if (phase !== 'finished') {
    els.setInfo.textContent = `Set ${currentSet} / ${totalSets}`;
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
  if (phase === 'prep') els.status.textContent = 'HAZIRLAN';
  else if (phase === 'work') els.status.textContent = 'ÇALIŞ';
  else if (phase === 'rest') els.status.textContent = 'MOLA';
  else if (phase === 'finished') els.status.textContent = 'BİTTİ!';
  else els.status.textContent = 'BAŞLA';
}

export function setStartButtonLabel(text) {
  els.startBtn.textContent = text;
}

export function vibrate(ms = 120) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

