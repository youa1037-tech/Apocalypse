// 도트 장면. 구역 배경은 겨울 도트(사용자 시안). PNG를 쓰려면 BG_IMAGES에 넣는다(192×120 비율).
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

// ── 구역 배경: 겨울 도트(사용자 시안 「인게임 도트 맵 배경 6종」) ──
// Shared clean winter pixel palette (exact vibe of the first mockup)
const C = {
  sky: '#070C15',
  skyDusk: '#0B1322',
  star: 'rgba(203, 224, 248, 0.55)',
  city: '#0F1829',
  cityRim: '#22324F',
  wall: '#182235',
  wallDark: '#101827',
  wallHi: '#273754',
  roof: '#0B111E',
  snow: '#DCEBFA',
  snowShade: '#94B2D6',
  ice: '#93C5FD',
  warm: '#FDE68A',
  warmDim: 'rgba(253, 230, 138, 0.22)',
  warmSoft: 'rgba(253, 230, 138, 0.12)',
  red: '#FB7185',
  redDim: '#9F1239',
  metal: '#475569',
  metalHi: '#94A3B8',
  black: '#05080F',
  stripeY: '#EAB308',
  stripeR: '#E11D48',
  teal: '#5EEAD4',
};

function starsC(g, n, maxY, seed) {
  const r = rand(seed);
  for (let i = 0; i < n; i++) R(g, r() * W, r() * maxY, 1, 1, C.star);
}
function skylineC(g, baseY, seed, lit = 0.08) {
  const r = rand(seed);
  let x = 0;
  while (x < W) {
    const w = 10 + r() * 18, h = 12 + r() * 30;
    R(g, x, baseY - h, w, h, C.city);
    R(g, x, baseY - h, w, 1, C.cityRim);
    for (let yy = baseY - h + 4; yy < baseY - 3; yy += 5)
      for (let xx = x + 3; xx < x + w - 3; xx += 4)
        if (r() < lit) R(g, xx, yy, 1, 2, 'rgba(253,230,138,0.45)');
    x += w + 2 + r() * 3;
  }
}

// 1. 외벽 처마 (eaves)
function bgEaves(g, ts) {
  R(g, 0, 0, W, H, C.sky);
  starsC(g, 28, 48, 7);
  skylineC(g, 82, 3, 0.05);
  // 본관 외벽
  R(g, 92, 16, 100, 80, C.wall);
  R(g, 92, 16, 2, 80, C.wallHi);
  // 처마 + 눈 + 고드름
  R(g, 82, 9, 110, 8, C.roof);
  R(g, 82, 9, 110, 3, C.snow);
  for (let x = 88; x < 188; x += 9) R(g, x, 17, 1, 2 + ((x * 5) % 5), C.ice);
  // 따뜻한 숙직실 창문
  R(g, 112, 33, 48, 34, C.roof);
  const glow = 0.85 + Math.sin(ts / 900) * 0.06;
  R(g, 114, 35, 44, 30, `rgba(253, 230, 138, ${glow})`);
  R(g, 135, 35, 2, 30, C.roof);
  R(g, 114, 49, 44, 2, C.roof);
  // 창틀 + 작은 무전기 + 빨간 불빛
  R(g, 109, 67, 54, 3, C.snow);
  R(g, 118, 62, 4, 5, C.roof);
  R(g, 120, 59, 1, 3, C.roof);
  R(g, 119, 64, 1, 1, (Math.floor(ts / 650) % 2 === 0) ? C.red : C.redDim);
  // 배수관
  R(g, 172, 17, 5, 79, C.roof);
  R(g, 173, 17, 1, 79, C.metalHi);
  for (let y = 28; y < 92; y += 16) R(g, 171, y, 7, 2, C.metal);
  // 눈 덮인 바닥 + 창문 빛 반사
  R(g, 0, 96, W, 24, C.snow);
  R(g, 0, 96, W, 2, C.snowShade);
  R(g, 104, 98, 56, 8, 'rgba(253, 230, 138, 0.28)');
}

// 2. 검문대 (checkpoint)
function bgCheckpoint(g, ts) {
  R(g, 0, 0, W, H, C.sky);
  starsC(g, 24, 42, 21);
  skylineC(g, 76, 13, 0.04);
  // 대피소 건물 + 반쯤 내린 셔터
  R(g, 98, 18, 94, 78, C.wall);
  R(g, 98, 18, 94, 3, C.snow);
  R(g, 112, 36, 62, 60, C.black);
  R(g, 112, 36, 62, 28, C.metal);
  for (let y = 39; y < 64; y += 3) R(g, 113, y, 60, 1, C.wallDark);
  R(g, 108, 32, 70, 4, C.wallHi);
  // 가로등 + 원뿔형 따뜻한 빛
  R(g, 26, 20, 3, 76, C.metal);
  R(g, 26, 20, 1, 76, C.metalHi);
  R(g, 20, 18, 15, 3, C.metalHi);
  R(g, 23, 21, 9, 2, C.warm);
  const pulse = 0.14 + Math.sin(ts / 1100) * 0.02;
  for (let y = 23; y < 96; y++) {
    const w = (y - 22) * 0.42;
    R(g, 27 - w, y, w * 2, 1, `rgba(253, 230, 138, ${pulse * (1 - (y - 23) / 110)})`);
  }
  // 바리케이드 2개
  for (const bx of [46, 72]) {
    R(g, bx, 78, 20, 8, C.snow);
    for (let k = 2; k < 18; k += 6) R(g, bx + k, 78, 3, 8, bx === 46 ? C.stripeR : C.stripeY);
    R(g, bx + 2, 86, 2, 10, C.metalHi);
    R(g, bx + 16, 86, 2, 10, C.metalHi);
  }
  // 접이식 탁자 + 명단 종이
  R(g, 106, 80, 44, 3, C.metalHi);
  R(g, 109, 83, 2, 13, C.metal);
  R(g, 145, 83, 2, 13, C.metal);
  R(g, 118, 78, 12, 2, C.snow);
  R(g, 134, 78, 8, 2, C.warm);
  // 눈 덮인 바닥
  R(g, 0, 96, W, 24, C.snow);
  R(g, 0, 96, W, 2, C.snowShade);
  R(g, 8, 98, 42, 9, 'rgba(253, 230, 138, 0.22)');
}

// 3. 숙직실 (dorm)
function bgDorm(g, ts) {
  // 어두운 실내 벽과 바닥
  R(g, 0, 0, W, 82, '#161D2B');
  R(g, 0, 82, W, 38, '#1E2738');
  R(g, 0, 81, W, 2, '#0B101A');
  // 천장 형광등(은은한 따뜻한 빛)
  R(g, 74, 6, 44, 3, C.metal);
  R(g, 78, 9, 36, 2, 'rgba(253, 230, 138, 0.75)');
  R(g, 40, 11, 112, 70, 'rgba(253, 230, 138, 0.05)');
  // 왼쪽 바깥 창문 (눈 내리는 밤하늘)
  R(g, 10, 18, 36, 36, C.roof);
  R(g, 12, 20, 32, 32, C.sky);
  R(g, 12, 48, 32, 4, C.snow);
  R(g, 27, 20, 2, 32, C.roof);
  R(g, 12, 35, 32, 2, C.roof);
  R(g, 8, 54, 40, 3, C.metalHi);
  // 작은 난로
  R(g, 16, 67, 14, 15, C.metal);
  R(g, 18, 70, 10, 8, '#F59E0B');
  R(g, 19, 71, 8, 6, C.warm);
  // 이층 침대
  R(g, 56, 28, 2, 56, C.metalHi);
  R(g, 104, 28, 2, 56, C.metalHi);
  for (const by of [44, 68]) {
    R(g, 56, by, 50, 4, C.metal);
    R(g, 58, by - 3, 12, 3, C.snow); // 베개
    R(g, 72, by - 2, 30, 3, '#64748B'); // 이불
  }
  // 벽 수신기 + 깜빡이는 LED
  R(g, 116, 24, 24, 14, C.wallDark);
  R(g, 117, 25, 22, 12, C.metal);
  for (let x = 119; x < 130; x += 3) R(g, x, 27, 2, 8, C.roof);
  R(g, 134, 28, 2, 2, (Math.floor(ts / 500) % 2 === 0) ? C.red : C.redDim);
  line(g, 128, 24, 134, 15, C.metalHi);
  // 탁자와 철제 구호함
  R(g, 112, 68, 30, 3, C.metalHi);
  R(g, 114, 71, 2, 12, C.metal);
  R(g, 138, 71, 2, 12, C.metal);
  R(g, 116, 56, 20, 12, C.snow);
  R(g, 125, 59, 2, 6, C.stripeR);
  R(g, 123, 61, 6, 2, C.stripeR);
  // 오른쪽 옥상 계단 문
  R(g, 152, 20, 30, 62, C.roof);
  R(g, 154, 22, 26, 58, C.wallHi);
  R(g, 174, 50, 3, 4, C.snow); // 걸쇠
  R(g, 158, 12, 18, 5, 'rgba(94, 234, 212, 0.55)'); // 비상구 표시등
}

// 4. 비상계단과 옥상 (roof)
function bgRoof(g) {
  R(g, 0, 0, W, H, C.sky);
  starsC(g, 42, 66, 33);
  // 초승달
  R(g, 34, 14, 9, 9, C.snow);
  R(g, 36, 13, 8, 8, C.sky);
  // 꺼진 도시 스카이라인
  skylineC(g, 82, 9, 0.02);
  // 난간
  R(g, 0, 68, 124, 2, C.metalHi);
  R(g, 0, 67, 124, 1, C.snow);
  for (let x = 4; x < 124; x += 10) R(g, x, 70, 2, 14, C.metal);
  // 꺾인 안테나
  line(g, 52, 82, 56, 30, C.metalHi);
  line(g, 56, 30, 72, 23, C.metalHi);
  line(g, 48, 42, 64, 38, C.metal);
  line(g, 50, 54, 62, 52, C.metal);
  // 계단실과 옥상 문
  R(g, 126, 32, 66, 56, C.wall);
  R(g, 124, 30, 70, 3, C.snow);
  R(g, 144, 48, 24, 38, C.roof);
  R(g, 146, 50, 20, 34, C.wallHi);
  R(g, 162, 66, 2, 3, C.snow);
  // 눈 쌓인 옥상 바닥
  R(g, 0, 84, W, 36, C.snow);
  R(g, 0, 84, W, 2, C.snowShade);
  R(g, 18, 92, 32, 4, C.snowShade);
  R(g, 88, 102, 40, 5, C.snowShade);
}

// 5. 상점가 (market)
function bgMarket(g, ts) {
  R(g, 0, 0, W, H, C.skyDusk);
  starsC(g, 16, 22, 51);
  // 전선
  line(g, 0, 12, 192, 16, '#1E293B');
  line(g, 0, 18, 192, 14, '#1E293B');
  // 가게 4채 (편의점·약국 등)
  const signs = [C.ice, C.warm, C.teal, C.metalHi];
  for (let i = 0; i < 4; i++) {
    const x = i * 48;
    R(g, x + 2, 22, 44, 74, C.wall);
    R(g, x + 2, 21, 44, 2, C.snow);
    // 간판
    R(g, x + 6, 26, 36, 8, C.roof);
    R(g, x + 8, 28, 32, 4, signs[i]);
    // 반쯤 내려간 셔터
    const shut = 20 + ((i * 11) % 18);
    R(g, x + 6, 38, 36, 54, C.black);
    R(g, x + 6, 38, 36, shut, C.metal);
    for (let y = 40; y < 38 + shut; y += 3) R(g, x + 7, y, 34, 1, C.wallDark);
  }
  // 넘어진 자판기 (약하게 깜빡임)
  R(g, 108, 86, 34, 14, C.wallHi);
  R(g, 110, 88, 30, 10, C.roof);
  const flick = (Math.floor(ts / 320) % 5 === 0) ? 0.35 : 0.75;
  R(g, 113, 90, 22, 6, `rgba(94, 234, 212, ${flick})`);
  // 바닥 눈 + 깨진 유리 조각
  R(g, 0, 96, W, 24, '#1E293B');
  R(g, 0, 96, W, 3, C.snow);
  R(g, 10, 102, 46, 6, C.snow);
  R(g, 134, 105, 50, 7, C.snow);
  const r = rand(71);
  for (let i = 0; i < 18; i++) R(g, r() * W, 100 + r() * 16, 2, 1, C.ice);
}

// 6. 급수소 (pump)
function bgPump(g) {
  R(g, 0, 0, W, H, C.sky);
  starsC(g, 36, 46, 91);
  skylineC(g, 74, 17, 0.04);
  // 공원 울타리
  R(g, 0, 76, W, 2, C.metal);
  for (let x = 4; x < W; x += 8) R(g, x, 76, 1, 18, C.metal);
  // 앙상한 겨울 나무 실루엣
  for (const [tx, th] of [[20, 42], [46, 30], [164, 46]]) {
    R(g, tx, 94 - th, 3, th, C.roof);
    line(g, tx + 1, 94 - th + 12, tx - 10, 94 - th + 2, C.roof);
    line(g, tx + 2, 94 - th + 8, tx + 12, 94 - th - 2, C.roof);
    line(g, tx + 1, 94 - th + 11, tx - 10, 94 - th + 1, C.snowShade);
  }
  // 작은 공원 가로등
  R(g, 34, 34, 2, 60, C.metalHi);
  R(g, 32, 31, 6, 4, C.snow);
  R(g, 20, 35, 30, 58, 'rgba(165, 216, 255, 0.08)');
  // 비상 급수 펌프
  R(g, 92, 60, 10, 34, C.metal);
  R(g, 94, 60, 2, 34, C.metalHi);
  R(g, 88, 57, 18, 4, C.metalHi);
  R(g, 88, 56, 18, 1, C.snow);
  line(g, 104, 60, 122, 48, C.metalHi);
  line(g, 104, 61, 122, 49, C.metal);
  R(g, 82, 68, 10, 3, C.metalHi);
  R(g, 82, 71, 3, 5, C.metal);
  // 콘크리트 받침대와 얼어붙은 물웅덩이
  R(g, 74, 92, 44, 6, C.wallHi);
  R(g, 0, 96, W, 24, C.snow);
  R(g, 0, 96, W, 2, C.snowShade);
  R(g, 72, 100, 46, 7, '#1E3A5F');
  R(g, 78, 102, 16, 1, C.ice);
  R(g, 98, 104, 12, 1, C.snow);
}

const BG = { eaves: bgEaves, checkpoint: bgCheckpoint, dorm: bgDorm, roof: bgRoof, market: bgMarket, pump: bgPump };

export function background(zone, now = 0) {
  if (!cache[zone]) cache[zone] = makeCtx();
  const [c, g] = cache[zone];
  g.imageSmoothingEnabled = false;
  BG[zone](g, now);
  const img = BG_IMAGES[zone] && imgCache[zone];
  if (img && img.complete && img.naturalWidth) g.drawImage(img, 0, 0, W, H);
  else if (BG_IMAGES[zone] && !imgCache[zone]) { const im = new Image(); im.src = BG_IMAGES[zone]; imgCache[zone] = im; }
  return c;
}
const imgCache = {};

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
  g.drawImage(background(zone, now), 0, 0);
  const p = v.partner;
  const groundY = zone === 'dorm' ? 98 : 104;
  const tags = [];
  if (p.rel === 'same' && p.zone) {
    const posture = p.asleep ? 'lie' : p.down ? 'sit' : 'stand';
    const px = zone === 'dorm' ? 76 : 62, py = zone === 'dorm' && p.asleep ? 68 : groundY;
    figure(g, px, py, 1.4, posture);
    tags.push({ x: px, y: py - (posture === 'lie' ? 14 : 44), role: p.role, typing: p.typing });
  } else if (p.rel === 'glass' && p.zone) {
    if (zone === 'eaves') { figure(g, 146, 64, 0.7, p.asleep ? 'lie' : 'stand', true); tags.push({ x: 146, y: 34, role: p.role, typing: p.typing, small: true }); }
    if (zone === 'dorm') { figure(g, 20, 48, 0.6, 'stand'); tags.push({ x: 20, y: 22, role: p.role, typing: p.typing, small: true }); }
  }
  // 검문대: 펜을 든 손 → 종이를 누른 손
  if (zone === 'checkpoint') {
    const mt = v.me.task, pt = p.rel === 'same' ? p.task : null;
    const signing = (mt && mt.kind === 'sign') || (pt && pt.kind === 'sign');
    const blocked = (mt && mt.kind === 'sign' && mt.blockedBy) || (pt && pt.kind === 'sign' && pt.blockedByMe);
    if (signing) {
      const wob = blocked ? 0 : (Math.floor(now / 160) % 3) - 1;
      // 펜 든 손(오른쪽에서)
      R(g, 128 + wob, 72, 8, 5, B); R(g, 129 + wob, 73, 6, 3, Wt);
      R(g, 135 + wob, 74, 6, 2, B); R(g, 136 + wob, 74, 4, 1, Wt);
      line(g, 129 + wob, 76, 126 + wob, 79, B);
      if (blocked) {
        // 종이를 누른 손(왼쪽에서) — 손가락 넷
        R(g, 112, 72, 12, 7, B); R(g, 113, 73, 10, 5, Wt);
        for (let k = 0; k < 4; k++) R(g, 114 + k * 2, 73, 1, 3, B);
        R(g, 104, 74, 9, 3, B); R(g, 104, 75, 8, 1, Wt);
        if (Math.floor(now / 300) % 2) { R(g, 118, 64, 1, 5, Wt); R(g, 118, 70, 1, 1, Wt); }
      }
    }
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
