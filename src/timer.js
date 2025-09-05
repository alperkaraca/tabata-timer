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

    this.intervalId = null;
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

    if (this.phase === Phase.Idle) {
      this.phase = Phase.Prep;
      this.timeLeft = this.config.prep;
      this._emitPhase();
    }

    if (!this.intervalId) {
      this.intervalId = setInterval(() => this._tick(), 1000);
    }
  }

  pause() {
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
    this._emitTick();
  }

  _tick() {
    this.timeLeft -= 1;
    this._emitTick();

    if (this.timeLeft < 0) {
      if (this.phase === Phase.Prep) {
        this.phase = Phase.Work;
        this.timeLeft = this.config.work;
        this.currentSet = 1;
        this._emitPhase();
      } else if (this.phase === Phase.Work) {
        if (this.currentSet >= this.totalSets) {
          this._finish();
          return;
        }
        this.phase = Phase.Rest;
        this.timeLeft = this.config.rest;
        this._emitPhase();
      } else if (this.phase === Phase.Rest) {
        this.phase = Phase.Work;
        this.currentSet += 1;
        this.timeLeft = this.config.work;
        this._emitPhase();
      }
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

