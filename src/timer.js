export const Phase = Object.freeze({
  Idle: 'idle',
  Prep: 'prep',
  Work: 'work',
  Rest: 'rest',
  Finished: 'finished',
});

export class Timer {
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
