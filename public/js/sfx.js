// 효과음 — 음원 파일 없이 Web Audio로 합성한다. 브라우저는 첫 터치 전엔 소리를 막으니, 첫 터치에서 깨운다.
const KEY = 'saebyeok-sound';
let ctx = null, master = null, noiseBuf = null;
let on = (() => { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } })();

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
export function unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); }
export const soundOn = () => on;
export function setSound(v) { on = !!v; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* 저장 불가 */ } if (on) unlock(); }

const ready = () => on && ctx && ctx.state === 'running';
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function noise(t, dur, freq, q, peak) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); env(g, t, 0.005, peak, dur);
  src.connect(f).connect(g).connect(master); src.start(t, Math.random() * 0.5, dur + 0.05);
}
function tone(t, type, f0, f1, dur, peak) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain(); env(g, t, 0.004, peak, dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
}

// 무전 지직거림 120ms
export function radio() { if (!ready()) return; const t = ctx.currentTime; noise(t, 0.12, 1800, 0.7, 0.35); noise(t + 0.05, 0.06, 3200, 2, 0.15); }
// 유리 두드림: 짧은 감쇠 두 번
export function knock() { if (!ready()) return; const t = ctx.currentTime; for (const dt of [0, 0.16]) { tone(t + dt, 'sine', 820, 520, 0.07, 0.4); noise(t + dt, 0.03, 2500, 3, 0.12); } }
// 걸쇠 철컥
export function latch() { if (!ready()) return; const t = ctx.currentTime; noise(t, 0.025, 4000, 4, 0.4); tone(t + 0.03, 'square', 260, 180, 0.05, 0.12); noise(t + 0.06, 0.02, 3000, 5, 0.25); }
// 좀비 경고 맥박: 낮은 55Hz
export function pulse() { if (!ready()) return; const t = ctx.currentTime; tone(t, 'sine', 55, 48, 0.28, 0.6); tone(t + 0.14, 'sine', 55, 46, 0.2, 0.35); }
// 엔진음: 낮게 깔렸다 멀어진다
export function engine(away) {
  if (!ready()) return; const t = ctx.currentTime, dur = 2.4;
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(away ? 48 : 38, t); o.frequency.linearRampToValueAtTime(away ? 34 : 46, t + dur);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + (away ? 0.2 : 1.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + dur + 0.1);
}
