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

export const playShortBeep = () => playTone(880, 0.15, 'triangle');
export const playLongBeep = () => playTone(440, 0.5, 'sine');

export function playFinish() {
  if (finishBuffer) {
    playBuffer(finishBuffer);
  } else {
    // Yedek: 2 uzun bip
    playLongBeep();
    setTimeout(() => playLongBeep(), 600);
  }
}

