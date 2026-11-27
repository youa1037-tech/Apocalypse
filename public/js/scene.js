// 1비트 도트 장면 (임시 그림). 사용자가 320×180 흑백 PNG를 주면 BG_IMAGES에 넣어 교체한다.
export const W = 192, H = 120;
export const BG_IMAGES = {}; // 예: { eaves: 'img/eaves.png' } — 있으면 그 그림을 배경으로 씀

// 1비트 흑백 도트
export const B = '#000', Wt = '#fff';
let cache = {};

function rand(seed) { let x = seed; return () => ((x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); }

function makeCtx() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  return [c, g];
}
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
function dither(g, x, y, w, h, level, c = Wt) {
  g.fillStyle = c;
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const on = level === 1 ? (xx % 4 === 0 && yy % 4 === 0) || ((xx + 2) % 4 === 0 && (yy + 2) % 4 === 0)
      : level === 2 ? (xx + yy) % 2 === 0
        : level === 3 ? !((xx % 2 === 0) && (yy % 2 === 0))
          : level === 0.5 ? (xx % 6 === 0 && yy % 6 === 0) : false;
    if (on) g.fillRect(xx, yy, 1, 1);
  }
}
function line(g, x0, y0, x1, y1, c = Wt) {
  g.fillStyle = c;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx - dy;
  for (;;) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; } }
}
function box(g, x, y, w, h, fill, stroke = B) { R(g, x, y, w, h, stroke); R(g, x + 1, y + 1, w - 2, h - 2, fill); }
function stars(g, n, maxY, seed) { const r = rand(seed); for (let i = 0; i < n; i++) R(g, r() * W, r() * maxY, 1, 1, Wt); }
function skyline(g, baseY, seed, lit = 0.12) {
  const r = rand(seed);
  let x = 0;
  while (x < W) {
    const w = 8 + r() * 18, h = 10 + r() * 34;
    R(g, x, baseY - h, w, h, B);
    line(g, x | 0, (baseY - h) | 0, (x + w - 1) | 0, (baseY - h) | 0, Wt);
    for (let yy = baseY - h + 3; yy < baseY - 2; yy += 4) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (r() < lit) R(g, xx, yy, 1, 2, Wt);
    x += w + 1 + r() * 3;
  }
}

function bgEaves(g) {
  R(g, 0, 0, W, H, B);
  stars(g, 50, 50, 7);
  skyline(g, 78, 3, 0.05);
  // 본관 외벽
  R(g, 96, 14, 96, 82, Wt); dither(g, 97, 15, 94, 80, 2, B);
  // 숙직실 창
  box(g, 118, 34, 46, 32, Wt); R(g, 140, 35, 2, 30, B); R(g, 119, 49, 44, 2, B);
  dither(g, 120, 52, 18, 12, 1, B); R(g, 122, 56, 14, 2, B); R(g, 145, 38, 14, 9, B); R(g, 146, 39, 2, 2, Wt);
  R(g, 116, 66, 50, 3, Wt); R(g, 116, 69, 50, 1, B); // 창틀
  // 처마
  for (let i = 0; i < 18; i++) R(g, 84 + i * 6, 6 + (i % 2), 6, 6, B);
  R(g, 84, 12, 108, 2, Wt); R(g, 84, 14, 108, 2, B);
  for (let i = 0; i < 14; i++) R(g, 90 + i * 7, 16, 1, 2 + (i * 5) % 5, Wt);
  // 배수관
  R(g, 172, 14, 5, 82, B); R(g, 173, 14, 1, 82, Wt); for (let y = 24; y < 96; y += 16) R(g, 171, y, 7, 2, Wt);
  // 눈 덮인 바닥
  R(g, 0, 96, W, 24, Wt); dither(g, 0, 96, W, 3, 2, B);
  const r = rand(11); for (let i = 0; i < 40; i++) R(g, r() * W, 100 + r() * 20, 2, 1, B);
}
function bgCheckpoint(g) {
  R(g, 0, 0, W, H, B);
  stars(g, 40, 40, 21);
  // 건물과 셔터
  R(g, 100, 20, 92, 70, Wt); dither(g, 101, 21, 90, 68, 2, B);
  box(g, 118, 40, 56, 50, Wt); for (let y = 43; y < 88; y += 3) R(g, 119, y, 54, 1, B);
  R(g, 112, 34, 68, 6, B); R(g, 113, 35, 66, 4, Wt);
  // 가로등과 빛
  R(g, 22, 18, 3, 78, Wt); R(g, 16, 16, 15, 4, Wt);
  for (let y = 20; y < 96; y++) { const w = (y - 20) * 0.55; dither(g, (23 - w) | 0, y, (w * 2) | 0, 1, y < 60 ? 1 : 2, Wt); }
  // 땅
  R(g, 0, 96, W, 24, Wt); dither(g, 0, 96, W, 2, 2, B);
  // 바리케이드
  for (let i = 0; i < 3; i++) {
    const x = 34 + i * 22;
    R(g, x, 76, 20, 10, Wt); R(g, x, 76, 20, 1, B); R(g, x, 85, 20, 1, B);
    for (let k = 0; k < 20; k += 6) line(g, x + k, 85, Math.min(x + k + 5, x + 19), 77, B);
    R(g, x + 2, 86, 2, 10, Wt); R(g, x + 16, 86, 2, 10, Wt);
  }
  // 접이식 탁자와 명단
  R(g, 100, 80, 40, 3, Wt); R(g, 103, 83, 2, 13, Wt); R(g, 134, 83, 2, 13, Wt);
  R(g, 112, 77, 12, 3, Wt); R(g, 113, 78, 10, 1, B);
  // 검사원(일반 실루엣)
  R(g, 146, 58, 8, 8, Wt); R(g, 147, 59, 6, 6, B); R(g, 144, 66, 12, 22, Wt); R(g, 145, 67, 10, 20, B);
  line(g, 144, 70, 136, 74, Wt); R(g, 133, 73, 4, 3, Wt);
}
function bgDorm(g) {
  R(g, 0, 0, W, H, Wt);
  dither(g, 0, 0, W, 78, 0.5, B);
  // 바닥
  R(g, 0, 78, W, 42, Wt); R(g, 0, 78, W, 1, B);
  for (let i = 0; i < 9; i++) line(g, 96, 79, i * 24 - 20, 119, B);
  for (let y = 86; y < 120; y += 9) R(g, 0, y, W, 1, B);
  // 창(바깥)
  box(g, 8, 18, 36, 34, B); stars(g, 0, 0, 1); { const r = rand(5); for (let i = 0; i < 10; i++) R(g, 10 + r() * 32, 20 + r() * 30, 1, 1, Wt); }
  R(g, 25, 19, 2, 32, Wt); R(g, 9, 34, 34, 2, Wt); R(g, 6, 52, 40, 3, B);
  // 이층 침대
  R(g, 52, 30, 2, 52, B); R(g, 98, 30, 2, 52, B);
  for (const y of [44, 70]) { R(g, 52, y, 48, 5, B); R(g, 54, y + 1, 44, 3, Wt); R(g, 56, y - 4, 12, 4, B); R(g, 57, y - 3, 10, 2, Wt); }
  // 수신기
  box(g, 112, 22, 26, 16, Wt); for (let x = 115; x < 128; x += 3) R(g, x, 25, 2, 10, B); R(g, 131, 27, 3, 3, B);
  line(g, 125, 22, 129, 12, B);
  // 구호함
  box(g, 110, 66, 26, 18, Wt); R(g, 110, 66, 26, 3, B); R(g, 121, 72, 4, 10, B); R(g, 118, 75, 10, 4, B);
  // 옥상 계단 문
  box(g, 150, 20, 30, 60, B); R(g, 152, 22, 26, 56, B); dither(g, 152, 22, 26, 56, 1, Wt); R(g, 172, 50, 3, 4, Wt);
  R(g, 156, 14, 18, 5, B);
}
function bgRoof(g) {
  R(g, 0, 0, W, H, B);
  stars(g, 90, 70, 33);
  R(g, 150, 10, 9, 9, Wt); R(g, 152, 10, 7, 7, B); // 달
  skyline(g, 82, 9, 0.2);
  // 바닥
  R(g, 0, 82, W, 38, Wt); dither(g, 0, 82, W, 38, 3, B); R(g, 0, 82, W, 1, Wt);
  // 난간
  R(g, 0, 70, 120, 2, Wt); for (let x = 2; x < 120; x += 10) R(g, x, 70, 2, 14, Wt);
  // 꺾인 안테나
  line(g, 40, 84, 44, 30, Wt); line(g, 44, 30, 60, 22, Wt); line(g, 36, 44, 52, 40, Wt); line(g, 38, 58, 50, 56, Wt);
  // 계단실과 옥상 문
  R(g, 128, 34, 64, 54, Wt); R(g, 129, 35, 62, 52, B); dither(g, 129, 35, 62, 52, 1, Wt);
  box(g, 146, 50, 24, 38, Wt); R(g, 148, 52, 20, 36, B); R(g, 164, 70, 2, 3, Wt);
  R(g, 124, 32, 72, 3, Wt);
}
function bgMarket(g) {
  R(g, 0, 0, W, H, B);
  stars(g, 25, 24, 51);
  // 양쪽 가게 줄
  for (let i = 0; i < 4; i++) {
    const x = i * 48;
    R(g, x + 2, 18, 44, 70, Wt); R(g, x + 3, 19, 42, 68, B);
    R(g, x + 6, 22, 36, 9, Wt); R(g, x + 8, 24, 32, 5, B); for (let k = 0; k < 5; k++) R(g, x + 10 + k * 6, 25, 3, 3, Wt); // 간판
    const shut = 18 + ((i * 13) % 22); // 반쯤 내려간 셔터
    R(g, x + 6, 34, 36, shut, Wt); for (let y = 36; y < 34 + shut; y += 3) R(g, x + 7, y, 34, 1, B);
    dither(g, x + 6, 34 + shut, 36, 54 - shut - 4, 1, Wt);
  }
  // 넘어진 자판기
  R(g, 112, 90, 34, 12, Wt); R(g, 113, 91, 32, 10, B); for (let x = 116; x < 140; x += 5) R(g, x, 93, 3, 5, Wt);
  // 바닥과 유리 조각
  R(g, 0, 100, W, 20, Wt); dither(g, 0, 100, W, 20, 2, B);
  const r = rand(71); for (let i = 0; i < 30; i++) R(g, r() * W, 101 + r() * 18, 2, 1, Wt);
}
function bgPump(g) {
  R(g, 0, 0, W, H, B);
  stars(g, 60, 50, 91);
  skyline(g, 70, 17, 0.06);
  // 나무 실루엣
  for (const [x, h] of [[18, 40], [44, 30], [160, 44]]) { R(g, x - 1, 96 - h, 3, h, Wt); for (let k = 0; k < 18; k++) R(g, x - 9 + ((k * 7) % 19), 96 - h - 6 + ((k * 5) % 12), 2, 2, Wt); }
  // 펌프
  R(g, 94, 58, 10, 40, Wt); R(g, 95, 59, 8, 38, B); dither(g, 95, 59, 8, 38, 1, Wt);
  R(g, 88, 56, 22, 5, Wt); line(g, 104, 56, 124, 44, Wt); line(g, 104, 57, 124, 45, Wt); R(g, 122, 42, 5, 5, Wt);
  R(g, 84, 66, 12, 3, Wt); R(g, 84, 69, 3, 5, Wt); // 꼭지
  R(g, 78, 92, 20, 6, Wt); R(g, 79, 93, 18, 4, B); // 받침대
  // 땅과 웅덩이
  R(g, 0, 96, W, 24, Wt); dither(g, 0, 96, W, 24, 2, B);
  R(g, 70, 100, 40, 5, B); for (let x = 72; x < 108; x += 4) R(g, x, 102, 2, 1, Wt);
}
const BG = { eaves: bgEaves, checkpoint: bgCheckpoint, dorm: bgDorm, roof: bgRoof, market: bgMarket, pump: bgPump };

export function background(zone) {
  if (cache[zone]) return cache[zone];
  const [c, g] = makeCtx();
  const src = BG_IMAGES[zone];
  if (src) {
    const img = new Image();
    img.onload = () => { g.drawImage(img, 0, 0, W, H); };
    img.src = src;
    BG[zone](g);
  } else BG[zone](g);
  cache[zone] = c;
  return c;
}

// 일반 실루엣(캐릭터 도트는 사용자가 교체)
function figure(g, x, y, s = 1, posture = 'stand', inv = false) {
  const F = inv ? B : Wt, O = inv ? Wt : B;
  if (posture === 'lie') { R(g, x - 10 * s, y - 5 * s, 20 * s, 5 * s, O); R(g, x - 9 * s, y - 4 * s, 18 * s, 3 * s, F); R(g, x - 13 * s, y - 6 * s, 5 * s, 5 * s, O); R(g, x - 12 * s, y - 5 * s, 3 * s, 3 * s, F); return; }
  const h = posture === 'sit' ? 12 : 20;
  R(g, x - 3 * s, y - (h + 8) * s, 7 * s, 7 * s, O); R(g, x - 2 * s, y - (h + 7) * s, 5 * s, 5 * s, F);
  R(g, x - 4 * s, y - h * s, 9 * s, h * s, O); R(g, x - 3 * s, y - (h - 1) * s, 7 * s, (h - 1) * s, F);
  if (posture !== 'sit') R(g, x, y - 8 * s, 1 * s, 8 * s, O);
}
function zombie(g, x, y, s, shake) {
  const dx = shake ? ((Math.random() * 3) | 0) - 1 : 0;
  x += dx;
  R(g, x - 5 * s, y - 24 * s, 7 * s, 7 * s, Wt); R(g, x - 4 * s, y - 23 * s, 5 * s, 5 * s, B); R(g, x - 3 * s, y - 21 * s, 1 * s, 1 * s, Wt);
  R(g, x - 4 * s, y - 18 * s, 10 * s, 18 * s, Wt); R(g, x - 3 * s, y - 17 * s, 8 * s, 17 * s, B);
  dither(g, x - 3 * s, y - 17 * s, 8 * s, 17 * s, 1, Wt);
  R(g, x - 12 * s, y - 16 * s, 9 * s, 2 * s, Wt); R(g, x - 13 * s, y - 15 * s, 2 * s, 3 * s, Wt);
  R(g, x - 10 * s, y - 12 * s, 7 * s, 2 * s, Wt);
}

// 매 프레임: 배경 + 상대·좀비
export function draw(canvas, v, now) {
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
  const zone = v.zone.id;
  g.drawImage(background(zone), 0, 0);
  const p = v.partner;
  const groundY = zone === 'dorm' ? 98 : 104;
  const tags = [];
  if (p.rel === 'same' && p.zone) {
    const posture = p.asleep ? 'lie' : p.down ? 'sit' : 'stand';
    const px = zone === 'dorm' ? 76 : 62, py = zone === 'dorm' && p.asleep ? 68 : groundY;
    figure(g, px, py, 1.4, posture);
    tags.push({ x: px, y: py - (posture === 'lie' ? 14 : 44), role: p.role, typing: p.typing });
  } else if (p.rel === 'glass' && p.zone) {
    if (zone === 'eaves') { figure(g, 130, 66, 0.7, p.asleep ? 'lie' : 'stand', true); tags.push({ x: 130, y: 36, role: p.role, typing: p.typing, small: true }); }
    if (zone === 'dorm') { figure(g, 26, 52, 0.7, 'stand'); tags.push({ x: 26, y: 26, role: p.role, typing: p.typing, small: true }); }
  }
  const z = v.zone.zombie;
  if (z) {
    const st = z.st;
    const s = st === 'warn' ? 1.9 : st === 'approach' ? 1.2 + (1 - Math.min(1, z.left / 2)) * 0.5 : 1.1;
    const x = st === 'warn' ? 140 : 160 - (st === 'approach' ? (1 - Math.min(1, z.left / 2)) * 16 : 0);
    if (st === 'warn' && Math.floor(now / 180) % 2) R(g, 0, 0, W, 2, Wt), R(g, 0, H - 2, W, 2, Wt);
    zombie(g, x | 0, groundY, s, st === 'warn');
  }
  return tags;
}

// 선 아이콘 (16×16)
const ICONS = {
  heart: '<path d="M8 13.5 2.6 8.1A3.1 3.1 0 0 1 8 4.2a3.1 3.1 0 0 1 5.4 3.9z"/>',
  bolt: '<path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z"/>',
  snow: '<path d="M8 1.5v13M2.4 4.8l11.2 6.4M2.4 11.2l11.2-6.4M6.2 2.6 8 4.2l1.8-1.6M6.2 13.4 8 11.8l1.8 1.6"/>',
  search: '<circle cx="7" cy="7" r="4.5"/><path d="m10.4 10.4 4 4"/>',
  act: '<path d="M5.2 8.5V3.6a1.2 1.2 0 0 1 2.4 0v3.9M7.6 7V2.6a1.2 1.2 0 0 1 2.4 0V7M10 7.2V4a1.2 1.2 0 0 1 2.4 0v5.2c0 2.9-2 4.9-4.6 4.9-2 0-3.2-1.1-4.1-2.9L2.6 8.9a1.1 1.1 0 0 1 1.9-1.1l.7 1.3"/>',
  bag: '<path d="M4.2 5.5h7.6a1.7 1.7 0 0 1 1.7 1.7v6.3h-11V7.2a1.7 1.7 0 0 1 1.7-1.7zM6 5.5V4a2 2 0 0 1 4 0v1.5M5 13.5v-3.5h6v3.5"/>',
  note: '<path d="M3 2.5h6.5l3.5 3.5v7.5H3zM9.5 2.5V6H13M5.5 8.5h5M5.5 11h3.5"/>',
  book: '<path d="M8 4.4C6.6 3.2 4.6 2.9 2 3.1v9.7c2.6-.2 4.6.1 6 1.3 1.4-1.2 3.4-1.5 6-1.3V3.1c-2.6-.2-4.6.1-6 1.3zM8 4.4v9.7"/>',
  map: '<path d="M1.5 3.6 5.5 2l5 1.8 4-1.4v10.1l-4 1.5-5-1.8-4 1.4zM5.5 2v10.2M10.5 3.8V14"/>',
  gear: '<circle cx="8" cy="8" r="2.3"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/>',
  person: '<circle cx="8" cy="4.6" r="2.6"/><path d="M3 14.2c0-3 2.2-5.1 5-5.1s5 2.1 5 5.1"/>',
  eye: '<path d="M1.5 8S4 3.6 8 3.6 14.5 8 14.5 8 12 12.4 8 12.4 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
  home: '<path d="M2 7.5 8 2.5l6 5M3.5 6.5v7h9v-7M6.5 13.5V10h3v3.5"/>',
  sword: '<path d="M13.5 2.5 6 10M13.5 2.5l-.5 3-6.5 6.5M13.5 2.5l-3 .5M4 9l3 3M3 13l2-2"/>',
  radio: '<path d="M4 5.5h8a1 1 0 0 1 1 1v7H3v-7a1 1 0 0 1 1-1zM5 5.5 11 2M5.5 8.5h5M5.5 11h5"/>',
};
export function icon(name, size = 20) {
  const d = ICONS[name]; if (!d) return '';
  return `<svg class="ic" viewBox="0 0 16 16" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
