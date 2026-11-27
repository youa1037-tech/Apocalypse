// 새벽 다섯 시 · 첫날 검증판 규칙 엔진
// 서버(Durable Object)와 로컬 시험판이 함께 쓰는 순수 로직이다.
// 상태(state)는 전부 JSON으로 저장 가능하며, 난수도 상태 안에서 굴린다(새로고침으로 다시 뽑을 수 없음).

export const ROLES = ['ren', 'akechi'];
export const other = (r) => (r === 'ren' ? 'akechi' : 'ren');

// ── 조정용 숫자 ─────────────────────────────────────────────
export const CFG = {
  MS_PER_MIN: 6000,        // 밤: 게임 1분 = 실제 6초
  DAY_MS_PER_MIN: 2500,    // 낮(06~18시): 게임 1분 = 실제 2.5초
  CAP: 5,                  // 가방 칸
  ROUTE_DUR: { market: { main: 20, alley: 40 }, pump: { main: 25, alley: 45 } }, // 검문대 ↔ 바깥: 큰길 / 뒷골목(게임 분)
  UNDER_DUR: { market: 30, pump: 35 }, // 숙직실 보일러실 계단 ↔ 지하 구간 ↔ 바깥(검문대를 거치지 않는다)
  UNDER_DARK: [0.5, 0.12], // 지하에서 어둠 속 좀비와 마주칠 확률: 조명 없음 / 있음
  CROWD_FOLLOW: 0.6,       // 큰길 무리를 끌고 검문대로 오면 처마 밑까지 따라올 확률
  ALLEY_FIND: 0.35,        // 뒷골목 샛길에서 물자를 줍는 확률
  JUG_CAP: 6, HEAVY: 4, FILL_PER: 2, HEAVY_MULT: 1.6, // 물통: 6번 분량, 4 이상이면 무거움, 1번 분량 펌프질 2분
  HELP_RATE: 1.8,          // 거들면 빨라지는 정도
  SUPPRESS_FOR: 48 * 60,   // 억제제 지속(게임 분)
  NOISE_SPAWN_NIGHT: 3.5,  // 밤에는 소음 조금만 쌓여도 몰려온다
  TURN_AFTER: 120,         // 이동 제한 뒤 억제하지 못하면 이만큼 지나 그 자리에서 전환
  LAST_SCENE: 30,          // 전환 뒤 살아남은 쪽의 마지막 장면(게임 분)
  BLEED_RATE: 0.25,        // 출혈: 분당 체력 감소
  ORIGINS: 8,              // 좀비 출신 종류 수(이름은 text.js)
  QUESTIONS: 14,           // 말 걸 거리 수(문장은 text.js)
  RADIO_SAY: 4, RADIO_DAY: 15, // 무전기 충전: 말 한 번, 하루에 닳는 양
  BUILD: {                 // 거점 설비: 필요한 물건과 걸리는 시간(게임 분)
    boards:   { need: { plank: 2 }, dur: 6 },
    charger:  { need: { battery: 1 }, dur: 4 },
    purifier: { need: { jug: 1, cloth: 1 }, dur: 5 },
    beds:     { need: { blanket: 2 }, dur: 3 },
    wallmap:  { need: { note: 3 }, dur: 3 },
  },
  STEP: 0.1,               // 내부 계산 단위(게임 분)
  START_HOUR: 22,          // 22:00 시작
  NIGHT_END: 240,          // 02:00 첫날 밤 종료
  CHECKPOINT_WARN: 130,    // 00:10 검문 마감 예고
  CHECKPOINT_CLOSE: 150,   // 00:30 검문·접수 마감
  LIGHTS_OUT: 180,         // 01:00 소등·불침번 교대
  BROADCASTS: [190],       // 01:10 지하 구간 방송
  BCAST_EARLY: 15,         // 22:15 수신기 이송 안내 방송(끝까지 들어야 뒷부분을 들음)
  BCAST_LEN: 8,            // 방송이 나오는 시간(게임 분) — '반복합니다' 두 번
  LISTEN: 3,               // 끝까지 듣는 데 드는 시간
  REG_OPEN: 20,            // 22:20 이송 접수 시작
  ZOMBIE1: [16, 20],       // 첫 조우: 방송 무렵 처마 쪽
  ZOMBIE2: [200, 215],     // 옥상 두 번째 좀비
  DUR: {
    move: 2, retreat: 0.5, search: 3, searchDark: 4.5, pick: 0.3, give: 0.2, sill: 0.3, stash: 0.3,
    drop: 0.1, inspect: 1, sign: 2, lock: 1, unlock: 0.5, diagnose: 1, inject: 1, bandage: 1,
    eat: 0.5, drink: 0.3, fixRadio: 1, note: 1, fight: 1, push: 0.5, sleeve: 0.2, showWound: 0.3, pipe: 1.5, scout: 1.5, board: 0.5, hide: 0.5, shareMap: 1, answerSos: 1,
  },
  COST: { move: 3, search: 4, fight: 15, push: 6, guard: 4, cover: 5, contest: 8, sign: 1, inspect: 1, retreat: 2 },
  APPROACH: 2, WARN: 1, STUN: 2,          // 좀비: 접근 2분 → 달려듦 예고 1분(실제 6초)
  BITE_P: 0.55, PUSH_HELP: 0.3, LOWSTAM: 0.2,
  FIGHT_WIN: 0.45,         // 맞서기: 혼자, 멀쩡한 좀비 상대로 이길 확률
  FIGHT_STUN: 0.35,        //   밀어내서 비틀거릴 때 더해지는 확률
  FIGHT_PAIR: 0.2,         //   둘이 같이 맞서면 더해지는 확률
  FIGHT_DARK: 0.1,         //   밤 바깥에서 조명 없이 싸우면 빠지는 확률
  FIGHT_BITE: 0.45,        // 맞서다 밀리면 물릴 확률(아니면 할퀴임)
  DODGE_FAIL: [0.1, 0.35], // 가만히 몸을 낮췄는데 못 피할 확률: 보통 / 기력 30 미만
  PUSH_FAIL: 0.25,         // 기력 30 미만일 때 밀어내기가 헛도는 확률
  TOUGH: 0.3,              // 단단한 좀비(두 번 쓰러뜨려야 함)가 나올 확률
  // 무기: 가방에 있으면 맞서기·밀어내기에 저절로 쓴다(가장 좋은 것). dur = 쓸 수 있는 횟수
  //   fight 승산 더하기 · keep 밀렸을 때 물릴 확률 빼기(거리를 둔다) · noise 소음 더하기
  //   push 밀어내기가 지쳐도 헛돌지 않음 · stun 비틀거리는 시간 더하기(게임 분)
  WEAPONS: {
    umbrella:     { fight: 0.1,  keep: 0.2,  dur: 3, noise: 0 },
    knife:        { fight: 0.15, keep: -0.1, dur: 8, noise: -1 },
    pipe:         { fight: 0.2,  keep: 0,    dur: 5, noise: 1 },
    bat:          { fight: 0.25, keep: 0.05, dur: 6, noise: 1 },
    extinguisher: { push: true,  stun: 1.5,  dur: 3, noise: 1 },
  },
  WEAPON_DAILY: ['pipe', 'bat', 'knife', 'umbrella', 'extinguisher'], // 날마다 상점가·급수소 어딘가에 하나
  SYMPTOM_AFTER: 60, RESTRICT_AFTER: 60,  // 진행성: 물린 뒤 60분 첫 증상, 다시 60분 뒤 이동 제한
  NOISE_SPAWN: 5, MAX_ZOMBIES: 2,
};

// ── 지도 ───────────────────────────────────────────────────
export const ZONES = {
  eaves:      { outside: true,  exits: ['checkpoint', 'roof'], glass: 'dorm', sill: true },
  checkpoint: { outside: true,  exits: ['eaves', 'dorm', 'market', 'pump'] },
  market:     { outside: true,  exits: ['checkpoint'] },
  pump:       { outside: true,  exits: ['checkpoint'] },
  dorm:       { outside: false, exits: ['checkpoint', 'roof'], glass: 'eaves', sill: true, box: true, receiver: true },
  roof:       { outside: true,  exits: ['eaves', 'dorm'] },
};

// ── 시각 ───────────────────────────────────────────────────
// t = 첫날 22:00부터 흐른 게임 분
const T0 = CFG.START_HOUR * 60;
export const clockOf = (t) => (T0 + t) % 1440;                  // 그날 0시부터 몇 분
export const dayOf = (t) => Math.floor((T0 + t) / 1440) + 1;    // 며칠째
export const tAt = (day, h) => (day - 1) * 1440 + h * 60 - T0;  // day일째 h시의 t
export const isDay = (t) => { const h = clockOf(t) / 60; return h >= 6 && h < 18; };
const SIZE = { jug: 2, note: 0, result: 0, pass: 0, key: 0, extinguisher: 2 };
const FAR = new Set(['checkpoint-market', 'checkpoint-pump']);
export const isFar = (a, b) => FAR.has([a, b].sort().join('-'));
const HELPABLE = new Set(['search', 'fill', 'fixRadio', 'build']);
const TAKEOVER = new Set(['search', 'fill', 'fixRadio', 'watch', 'build']);
const sizeOf = (i) => (SIZE[i.kind] ?? 1);

// ── 사건별로 닿는 관계 (self/same/glass/door/near/radio → 기록 종류) ──
const P = (o) => o;
export const PERCEIVE = {
  intro:        P({ self: 'self' }),
  leave:        P({ self: 'self', same: 'see', glass: 'see' }),
  underDark:    P({ self: 'self', same: 'see' }),
  enter:        P({ self: 'self', same: 'see', glass: 'see' }),
  search:       P({ same: 'see' }),
  searchDone:   P({ self: 'self' }),
  special:      P({ self: 'self' }),
  pick:         P({ self: 'self', same: 'see' }),
  drop:         P({ self: 'self', same: 'see' }),
  give:         P({ self: 'self', same: 'see' }),
  sillPut:      P({ self: 'self', same: 'see', glass: 'see' }),
  sillTake:     P({ self: 'self', same: 'see', glass: 'see' }),
  stash:        P({ self: 'self', same: 'see' }),
  inspectPass:  P({ self: 'self', same: 'see' }),
  inspectFail:  P({ self: 'self', same: 'see', near: 'hear' }),
  signStart:    P({ self: 'self', same: 'see' }),
  signDone:     P({ self: 'self', same: 'see' }),
  block:        P({ self: 'self', same: 'see', door: 'hear' }),
  release:      P({ self: 'self', same: 'see', door: 'hear' }),
  yield:        P({ self: 'self', same: 'see', door: 'hear' }),
  pullWin:      P({ self: 'self', same: 'see', door: 'hear' }),
  pullLose:     P({ self: 'self', same: 'see', door: 'hear' }),
  tug:          P({ self: 'self', same: 'see' }),
  tugEnd:       P({ self: 'self', same: 'see' }),
  lockStart:    P({ self: 'self', same: 'see', door: 'hear' }),
  lockDone:     P({ self: 'self', same: 'see', door: 'hear' }),
  unlockDone:   P({ self: 'self', same: 'see', door: 'hear' }),
  knock:        P({ self: 'self', same: 'hear', glass: 'hear', door: 'hear', near: 'hear' }),
  showWound:    P({ self: 'self', same: 'see', glass: 'see' }),
  sleeve:       P({ self: 'self', same: 'see' }),
  zAppear:      P({ self: 'self', same: 'see', glass: 'see', near: 'hear' }),
  zWarn:        P({ self: 'self' }),
  lungeMiss:    P({ self: 'self', same: 'see' }),
  graze:        P({ self: 'self', same: 'see', glass: 'see', near: 'hear', radio: 'radio' }),
  bite:         P({ self: 'self', same: 'see', glass: 'see', door: 'hear', near: 'hear', radio: 'radio' }),
  fight:        P({ self: 'self', same: 'see', glass: 'see', door: 'hear', near: 'hear' }),
  fightLose:    P({ self: 'self', same: 'see', glass: 'see', door: 'hear', near: 'hear', radio: 'radio' }),
  dodgeFail:    P({ self: 'self', same: 'see', glass: 'see' }),
  pushFail:     P({ self: 'self', same: 'see' }),
  weaponBroke:  P({ self: 'self', same: 'see' }),
  spray:        P({ self: 'self', same: 'see', glass: 'see', near: 'hear' }),
  zDown:        P({ self: 'self', same: 'see', glass: 'see', door: 'hear', near: 'hear' }),
  push:         P({ self: 'self', same: 'see', glass: 'see' }),
  cover:        P({ self: 'self', same: 'see' }),
  symptom:      P({ self: 'self', same: 'see', glass: 'see' }),
  symptomDrop:  P({ self: 'self', same: 'see' }),
  restrict:     P({ self: 'self', same: 'see', glass: 'see' }),
  exhausted:    P({ self: 'self', same: 'see', glass: 'see' }),
  diagnose:     P({ self: 'self', same: 'see', door: 'hear', near: 'hear' }),
  diagShared:   P({ same: 'see' }),
  inject:       P({ self: 'self', same: 'see' }),
  injectWaste:  P({ self: 'self', same: 'see' }),
  bandage:      P({ self: 'self', same: 'see' }),
  eat:          P({ self: 'self', same: 'see' }),
  drink:        P({ self: 'self', same: 'see' }),
  fixRadio:     P({ self: 'self', same: 'see' }),
  rest:         P({ self: 'self', same: 'see', glass: 'see' }),
  watch:        P({ self: 'self', same: 'see', glass: 'see' }),
  support:      P({ self: 'self', same: 'see' }),
  note:         P({ self: 'self', same: 'see' }),
  doorScratch:  P({ same: 'hear', door: 'hear' }),
  zEnterDorm:   P({ same: 'see', door: 'hear', near: 'hear' }),
  noiseHint:    P({ same: 'hear', glass: 'hear', near: 'hear' }),
  cold:         P({ self: 'self' }),
  wake:         P({ self: 'self' }),
  built:        P({ self: 'self', same: 'see', glass: 'see' }),
  buildStart:   P({ self: 'self', same: 'see' }),
  offer:        P({ self: 'self', same: 'see' }),
  offerNo:      P({ self: 'self', same: 'see' }),
  meal:         P({ self: 'self', same: 'see' }),
  replay:       P({ self: 'self', same: 'see' }),
  care:         P({ self: 'self', same: 'see' }),
  careBite:     P({ self: 'self' }),
  lean:         P({ self: 'self', same: 'see', glass: 'see' }),
  answerSos:    P({ self: 'self', same: 'see' }),
  zHit:         P({ self: 'self', same: 'see', glass: 'see', near: 'hear' }),
  turn:         P({ self: 'self', same: 'see', glass: 'see', door: 'hear', near: 'hear', radio: 'radio' }),
  moan:         P({ self: 'self', same: 'hear', glass: 'see', door: 'hear', near: 'hear' }),
  emote:        P({ self: 'self', same: 'see', glass: 'see' }),
  fillStart:    P({ self: 'self', same: 'see', near: 'hear' }),
  fillDone:     P({ self: 'self', same: 'see' }),
  hide:         P({ self: 'self', same: 'see' }),
  shareMap:     P({ self: 'self', same: 'see' }),
  carryWith:    P({ self: 'self', same: 'see' }),
  carryStop:    P({ self: 'self', same: 'see' }),
  help:         P({ self: 'self', same: 'see' }),
  takeOver:     P({ self: 'self', same: 'see' }),
  routeShift:   P({ self: 'self' }),
  scout:        P({ self: 'self', same: 'see' }),
  crowd:        P({ self: 'self', same: 'see', near: 'hear', radio: 'radio' }),
  board:        P({ self: 'self', same: 'see' }),
  boardFail:    P({ self: 'self', same: 'see' }),
  death:        P({ self: 'self', same: 'see', glass: 'see', door: 'hear', near: 'hear', radio: 'radio' }),
  listen:       P({ self: 'self', same: 'see' }),
  pipeStart:    P({ same: 'see', glass: 'see' }),
  pipe:         P({ self: 'self', same: 'see' }),
  shout:        P({ self: 'self', same: 'hear', glass: 'hear', door: 'hear', near: 'hear' }),
};
// 기억에 남는(함께 목격 카드 후보) 사건
const MEMORABLE = new Set(['meal', 'care', 'lean', 'built', 'emote', 'bite', 'inspectFail', 'signDone', 'pullWin', 'pullLose', 'block', 'zDown', 'push', 'cover',
  'showWound', 'give', 'inject', 'lockDone', 'tugEnd', 'diagShared', 'symptom', 'restrict']);
const LOUD = new Set(['shout', 'bite', 'fight', 'zDown', 'knock', 'inspectFail', 'zEnterDorm', 'doorScratch', 'graze']);

// ── 물건 ───────────────────────────────────────────────────
export const ITEM_USE = {
  kit: 'diagnose', suppressant: 'inject', bandage: 'bandage', food: 'eat', water: 'drink', jug: 'drink',
  radio_broken: 'fixRadio', battery: 'fixRadio',
};

// ── 난수 (상태 안에 저장) ─────────────────────────────────────
function rng(s) {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pickOne = (s, arr) => arr[Math.floor(rng(s) * arr.length)];
const between = (s, [a, b]) => a + rng(s) * (b - a);

// ── 새 판 ───────────────────────────────────────────────────
export function createGame(seed, now, opts = {}) {
  const s = {
    v: 1, seed, rng: seed | 0, t: 0, lastReal: now, speed: 1,
    phase: opts.phase || 'prologue', paused: false, pauseReason: null,
    biteMode: 'random', dev: !!opts.dev,
    players: {}, items: {}, zombies: {}, noise: { eaves: 0, checkpoint: 0, dorm: 0, roof: 0, market: 0, pump: 0 },
    roofDoor: { locked: true }, checkpointOpen: true, regOpen: false, bcast: false,
    routes: { main: 'calm', alley: 'calm' }, morning: null, busHere: false, end: null,
    diary: [], lastDiaryT: 0, endDiary: { ren: null, akechi: null }, archive: opts.archive || [], feats: [],
    base: { boards: false, charger: false, purifier: false, beds: false, wallmap: false }, offer: null, stranger: null, sos: null,
    flags: {}, scene: null,
    sched: [], logs: { ren: [], akechi: [] }, logSeq: 0, nextId: 1,
    tug: null, lastGive: null, shared: [], epilogue: { ren: '', akechi: '' }, disclose: { ren: false, akechi: false },
    heard: { ren: {}, akechi: {} },
  };
  for (const r of ROLES) {
    s.players[r] = {
      role: r, zone: 'eaves', hp: 100, stamina: 85, cold: 10,
      passed: false, signed: false, task: null, stance: null, autoGuard: false,
      bite: null, sleeveDown: false, restricted: false, exhausted: false, down: false,
      blocking: null, supporting: null, supportedBy: null, asleep: false,
      searches: {}, lastSeen: { zone: 'eaves', t: 0 }, typing: 0, watchMin: 0, restMin: 0,
      ready: false, firstLine: '', listened: false, pipe: false, skipVote: false,
      thirst: 0, hunger: 0, dead: false, boarded: false, mready: false, scouted: null,
      marks: [], carrying: null, carryHelp: null, outing: null, lastStock: null, knownPass: {},
    };
  }
  // 시작 소지품
  addItem(s, 'water', { bag: 'ren' });
  addItem(s, 'radio_broken', { bag: 'akechi' });
  // 구호함
  for (const k of ['kit', 'suppressant', 'bandage', 'blanket', 'water', 'food']) addItem(s, k, { box: true });
  addItem(s, 'jug', { box: true }, { data: { left: 0 } }); // 빈 물통 하나
  // 상점가: 한정된 물자. 뒤질수록(각자 탐색 횟수) 더 깊이 있는 게 나온다
  for (const [k, need] of [['water', 1], ['food', 1], ['plank', 1], ['water', 2], ['plank', 2], ['cloth', 2], ['food', 2], ['battery', 3], ['water', 3], ['food', 3], ['bandage', 4], ['food', 4]]) {
    addItem(s, k, { zone: 'market' }, { hidden: { ren: need, akechi: need } });
  }
  // 숨은 물건 (판마다 위치가 바뀜)
  const batteryAt = pickOne(s, ['eaves', 'roof']);
  const keyAt = 'eaves'; // 프롤로그의 렌 비밀: 배수관 뒤
  addItem(s, 'battery', { zone: batteryAt }, { hidden: { ren: 1, akechi: 1 } });
  addItem(s, 'key', { zone: keyAt }, { hidden: { ren: 1, akechi: 2 } }); // 렌 특기: 우회로 흔적을 먼저 알아봄
  addItem(s, 'blanket', { zone: pickOne(s, ['eaves', 'checkpoint']) }, { hidden: { ren: 1, akechi: 1 } });
  addItem(s, 'food', { zone: 'checkpoint' }, { hidden: { ren: 1, akechi: 1 } });
  addItem(s, 'plank', { zone: 'roof' }, { hidden: { ren: 2, akechi: 2 } });
  addItem(s, 'umbrella', { zone: 'eaves' }, { hidden: { ren: 1, akechi: 1 }, data: { dur: CFG.WEAPONS.umbrella.dur } });
  addItem(s, 'pipe', { zone: 'roof' }, { hidden: { ren: 2, akechi: 2 }, data: { dur: CFG.WEAPONS.pipe.dur } });
  addItem(s, 'extinguisher', { zone: 'checkpoint' }, { hidden: { ren: 2, akechi: 1 }, data: { dur: CFG.WEAPONS.extinguisher.dur } });
  addItem(s, 'water', { zone: pickOne(s, ['checkpoint', 'roof']) }, { hidden: { ren: 1, akechi: 1 } });
  s.keyAt = keyAt;
  // 일정
  const at = (t, kind, data = {}) => s.sched.push({ t, kind, data, done: false });
  at(0.01, 'intro');
  at(0.02, 'firstLines');
  at(8, 'pa', { key: 'paOpen' });
  at(CFG.CHECKPOINT_WARN, 'pa', { key: 'paWarn' });
  at(CFG.CHECKPOINT_CLOSE, 'close');
  at(CFG.LIGHTS_OUT, 'pa', { key: 'paLights' });
  at(1, 'pa', { key: 'paBroadcast' });
  at(CFG.BCAST_EARLY, 'bcastStart');
  at(CFG.BCAST_EARLY + CFG.BCAST_LEN, 'bcastEnd');
  at(CFG.REG_OPEN, 'regOpen');
  CFG.BROADCASTS.forEach((t) => at(t, 'broadcast', { n: 1 }));
  at(between(s, CFG.ZOMBIE1), 'zombie1');
  at(between(s, CFG.ZOMBIE2), 'zombie2');
  at(between(s, [tAt(2, 2), tAt(2, 4)]), 'nightEvent');
  at(tAt(2, 6), 'morning');
  at(tAt(3, 4.5), 'pa', { key: 'paBus' });
  at(tAt(3, 5), 'bus');
  at(tAt(3, 5.25), 'busGone');
  return s;
}

// 둘이 해낸 일 — 일지와 결산, 탈출 결정에 남는다
function feat(s, key, a = {}) { s.feats.push({ t: Math.round(s.t), day: dayOf(s.t), key, a }); }
function addMark(p, m) {
  if (p.marks.some((x) => x.zone === m.zone && x.tag === m.tag && x.item === m.item && x.text === m.text)) return;
  p.marks.push({ zone: m.zone, tag: m.tag, item: m.item || null, text: m.text || '', t: m.t || 0 });
  if (p.marks.length > 12) p.marks.shift();
}
export function addItem(s, kind, loc, extra = {}) {
  const id = 'i' + s.nextId++;
  s.items[id] = { id, kind, loc, found: !extra.hidden, hidden: extra.hidden || null, data: extra.data || null };
  return s.items[id];
}

// ── 기록 ───────────────────────────────────────────────────
function log(s, r, k, key, a = {}) {
  const L = s.logs[r];
  L.push({ id: ++s.logSeq, t: Math.round(s.t * 10) / 10, k, key, a });
  if (L.length > 400) L.splice(0, L.length - 400);
}

export function relation(s, fromZone, evZone) {
  if (fromZone === evZone) return 'same';
  if (ZONES[fromZone].glass === evZone) return s.base && s.base.boards ? 'near' : 'glass';
  const pair = [fromZone, evZone].sort().join('-');
  if (pair === 'dorm-roof') return s.roofDoor.locked ? 'door' : 'near';
  if (ZONES[fromZone].exits.includes(evZone)) return 'near';
  return 'none';
}

export function radioLink(s) {
  if (ROLES.some((q) => { const t = s.players[q].task; return t && t.kind === 'move' && t.data && t.data.route === 'under'; })) return null;
  const holder = ROLES.find((r) => bagOf(s, r).some((i) => i.kind === 'radio' && (!i.data || i.data.charge == null || i.data.charge > 0)));
  if (!holder) return null;
  const o = other(holder);
  if (s.players[o].zone === 'dorm' && s.players[holder].zone !== 'dorm') return { holder, base: o };
  return null;
}

function emit(s, type, who, zone, a = {}) {
  const table = PERCEIVE[type] || { self: 'self' };
  const got = {};
  const link = radioLink(s);
  for (const r of ROLES) {
    const p = s.players[r];
    let rel = who === r ? 'self' : relation(s, p.zone, zone);
    if (p.asleep && rel !== 'self') {
      if (LOUD.has(type) && (rel === 'same' || rel === 'door' || rel === 'near')) wake(s, r);
      else if (rel === 'same' || rel === 'glass') rel = 'none';
    }
    let kind = table[rel];
    let useRel = rel;
    if (!kind && table.radio && link && who !== r && (link.holder === who || link.base === who)) {
      kind = 'radio'; useRel = 'radio';
    }
    if (!kind) continue;
    got[r] = useRel;
    log(s, r, kind, type + '.' + useRel, { who, ...a });
    if (who && who !== r && (useRel === 'same' || useRel === 'glass')) p.lastSeen = { zone, t: s.t };
  }
  if (WITNESSED.has(type) && who) {
    const o2 = other(who);
    if (got[o2] && got[o2] !== 'self') { s.flags = s.flags || {}; s.flags['saw_' + type + '_' + who] = true; }
  }
  if (MEMORABLE.has(type) && ROLES.every((r) => got[r] === 'self' || got[r] === 'same')) {
    s.shared.push({ t: s.t, type, a: { who, ...a } });
  }
  return got;
}

const WITNESSED = new Set(['replay', 'pipe', 'listen', 'hide', 'unlockDone', 'lockDone', 'diagShared', 'give']);
function wake(s, r) {
  const p = s.players[r];
  if (!p.asleep) return;
  p.asleep = false;
  if (p.task && p.task.kind === 'rest') p.task = null;
  log(s, r, 'self', 'wake.self', {});
}

// ── 도우미 ─────────────────────────────────────────────────
export const bagOf = (s, r) => Object.values(s.items).filter((i) => i.loc.bag === r);
const itemsAt = (s, z) => Object.values(s.items).filter((i) => i.loc.zone === z);
const boxItems = (s) => Object.values(s.items).filter((i) => i.loc.box);
const sillItems = (s) => Object.values(s.items).filter((i) => i.loc.sill);
const zombieIn = (s, z) => Object.values(s.zombies).find((zb) => zb.zone === z);
const occupants = (s, z) => ROLES.filter((r) => s.players[r].zone === z && !s.players[r].dead && !s.players[r].boarded);
const hasKind = (s, r, k) => bagOf(s, r).find((i) => i.kind === k);
const mult = (p) => (p.bite && p.bite.stage >= 1 && (!p.bite.suppressed || p.bite.penalty) ? 1.5 : 1);
function spend(p, n) { p.stamina = Math.max(0, p.stamina - n * mult(p)); }

export function canPass(s, from, to) {
  if (!ZONES[from].exits.includes(to)) return false;
  const pair = [from, to].sort().join('-');
  if (pair === 'checkpoint-dorm') return s.checkpointOpen;
  if (pair === 'dorm-roof') return !s.roofDoor.locked;
  return true;
}
function passBlockReason(s, p, to) {
  const pair = [p.zone, to].sort().join('-');
  if (pair === 'checkpoint-dorm' && !s.checkpointOpen) return 'closed';
  if (p.zone === 'checkpoint' && to === 'dorm' && !p.passed) return 'notPassed';
  if (pair === 'dorm-roof' && s.roofDoor.locked) return 'locked';
  return null;
}
function selfMobile(p) { return !p.restricted && !p.exhausted && !p.down; }

function itemReachable(s, r, it) {
  const p = s.players[r];
  if (it.loc.bag === r) return true;
  if (it.loc.zone === p.zone && (it.found || it.hiddenBy === r)) return true;
  if (it.loc.box && p.zone === 'dorm') return true;
  if (it.loc.sill && ZONES[p.zone].sill && !s.base.boards) return true;
  return false;
}

function startTask(s, r, kind, dur, data = {}, opts = {}) {
  const p = s.players[r];
  if (p.blocking) releaseBlock(s, r);
  if (p.asleep) p.asleep = false;
  const z = zombieIn(s, p.zone);
  p.task = { kind, dur, prog: 0, data, paused: false, blockedBy: null, interruptible: !!opts.interruptible, contested: false };
  // 달려듦 예고 중에 하던 일을 새로 시작하면 위험을 감수한 것으로 본다
  if (z && z.st === 'warn' && !['retreat', 'move', 'fight', 'push'].includes(kind)) { p.stance = 'persist'; p.autoGuard = false; }
  return p.task;
}
function cancelTask(s, r) {
  const p = s.players[r];
  if (!p.task) return;
  if (p.task.kind === 'tug') return;
  if (p.task.blockedBy) { const b = s.players[p.task.blockedBy]; b.blocking = null; }
  p.task = null; p.autoGuard = false;
}
function releaseBlock(s, r) {
  const p = s.players[r];
  if (!p.blocking) return;
  const t = s.players[p.blocking];
  if (t.task && t.task.blockedBy === r) t.task.blockedBy = null;
  p.blocking = null;
}

// ── 안전할 때 다음 일까지 시간 넘기기(둘 다 동의) ─────────────────
const SKIP_STOPS = new Set(['pa', 'close', 'broadcast', 'regOpen', 'bcastStart', 'morning', 'gateOpen', 'gateClose', 'noon', 'bus', 'nightEvent']);
export function skipOk(s) {
  if (s.phase !== 'play' || s.paused) return false;
  if (s.scene) return false;
  if (!ROLES.every((r) => s.players[r].zone === 'dorm')) return false;
  if (!s.roofDoor.locked || zombieIn(s, 'dorm') || s.tug) return false;
  return true;
}
function skipTarget(s) {
  const next = s.sched.filter((e) => !e.done && e.t > s.t + 0.2 && SKIP_STOPS.has(e.kind)).sort((a, b) => a.t - b.t)[0];
  return next ? next.t : s.t + 60;
}
function fastForward(s, now) {
  const from = s.t, target = skipTarget(s);
  for (const r of ROLES) { s.players[r].skipVote = false; const p = s.players[r]; if (p.task && isFinite(p.task.dur)) p.task = null; }
  while (s.t < target - 0.01 && s.phase === 'play' && skipOk(s)) step(s, Math.min(CFG.STEP, target - s.t));
  s.lastReal = now;
  for (const r of ROLES) log(s, r, 'self', 'skip.self', { from: Math.round(from), to: Math.round(s.t) });
}

// ── 시간 진행 ───────────────────────────────────────────────
export function advance(s, now) {
  if (s.phase !== 'play' || s.paused) { s.lastReal = now; return; }
  let ms = Math.min(now - s.lastReal, 10 * 60 * 1000);
  s.lastReal = now;
  while (ms > 1e-6 && s.phase === 'play') {
    const rate = (isDay(s.t) ? CFG.DAY_MS_PER_MIN : CFG.MS_PER_MIN) / s.speed; // 실제 ms / 게임 분
    const d = Math.min(CFG.STEP, ms / rate);
    step(s, d);
    ms -= d * rate;
  }
}

function step(s, d) {
  s.t += d;
  for (const ev of s.sched) if (!ev.done && s.t >= ev.t) { ev.done = true; fire(s, ev); }
  for (const r of ROLES) stepPlayer(s, r, d);
  for (const z of Object.values(s.zombies)) stepZombie(s, z, d);
  stepNoise(s, d);
  // 같은 방/창 너머면 '마지막으로 본 곳' 갱신
  for (const r of ROLES) {
    const p = s.players[r], o = s.players[other(r)];
    const rel = relation(s, p.zone, o.zone);
    if (!p.asleep && (rel === 'same' || rel === 'glass')) p.lastSeen = { zone: o.zone, t: s.t };
  }
  if (!skipOk(s)) for (const r of ROLES) s.players[r].skipVote = false;
  if (s.offer && s.t - s.offer.t > 5) s.offer = null;
  sceneTick(s);
  for (const r of ROLES) { const p = s.players[r]; if (p.crowdAsk && s.t >= p.crowdAsk.until) crowdResolve(s, r, 'run'); }
  for (const r of ROLES) { const p = s.players[r]; if (p.lean && !(p.task && p.task.kind === 'rest')) p.lean = null; }
  if (s.pendingEnd && s.phase === 'play' && (s.t >= s.pendingEnd.t || ROLES.every((r) => s.players[r].dead))) endRun(s, 'death', s.pendingEnd.who);
}

function fire(s, ev) {
  switch (ev.kind) {
    case 'intro':
      for (const r of ROLES) log(s, r, 'self', 'intro.self', { who: r });
      break;
    case 'firstLines':
      for (const q of ROLES) {
        const text = s.players[q].firstLine;
        if (text) for (const r of ROLES) log(s, r, 'chat', 'say', { who: q, text });
      }
      break;
    case 'pa':
      for (const r of ROLES) { wakeIfAsleepPA(s, r, ev.data.key); log(s, r, 'pa', ev.data.key, {}); }
      if (ev.data.key === 'paWarn' || ev.data.key === 'paOpen') for (const r of ROLES) s.heard[r].closeAt = CFG.CHECKPOINT_CLOSE;
      break;
    case 'close':
      s.checkpointOpen = false;
      for (const r of ROLES) {
        log(s, r, 'pa', 'paClosed', {});
        const p = s.players[r];
        if (p.task && p.task.kind === 'sign') { p.task = null; log(s, r, 'self', 'signLate.self', {}); }
        if (p.task && p.task.kind === 'move') {
          const pair = [p.zone, p.task.data.to].sort().join('-');
          if (pair === 'checkpoint-dorm') { p.task = null; log(s, r, 'self', 'gateShut.self', {}); }
        }
      }
      break;
    case 'broadcast': {
      const link = radioLink(s);
      for (const r of ROLES) {
        const p = s.players[r];
        const hears = p.zone === 'dorm' || hasKind(s, r, 'radio');
        if (!hears) continue;
        if (p.asleep) wake(s, r);
        log(s, r, 'radio', 'broadcast' + ev.data.n, {});
        if (ev.data.n === 1) p.knowsUnder = true;
        if (r === 'akechi') log(s, r, 'self', 'special.akechi' + ev.data.n, {});
      }
      void link;
      break;
    }
    case 'zombie1': {
      // 처마에 누가 있으면 처마, 아니면 사람이 있는 바깥 구역, 없으면 처마
      const zs = ROLES.map((r) => s.players[r].zone);
      const outs = zs.filter((z) => ZONES[z].outside);
      spawnZombie(s, zs.includes('eaves') ? 'eaves' : outs.length ? pickOne(s, outs) : 'eaves');
      break;
    }
    case 'bcastStart':
      s.bcast = true;
      for (const r of ROLES) {
        const p = s.players[r];
        if (p.zone === 'dorm' || hasKind(s, r, 'radio')) { if (p.asleep) wake(s, r); log(s, r, 'radio', 'bcastHead', {}); }
      }
      break;
    case 'bcastEnd':
      s.bcast = false;
      for (const r of ROLES) {
        const p = s.players[r];
        if (p.task && p.task.kind === 'listen') { p.task = null; log(s, r, 'self', 'bcastCut.self', {}); }
      }
      break;
    case 'regOpen':
      s.regOpen = true;
      for (const r of ROLES) log(s, r, 'pa', 'paRegOpen', {});
      break;
    case 'zombie2':
      spawnZombie(s, 'roof');
      break;
    case 'morning': morning(s); break;
    case 'gateOpen':
      { const pool = CFG.WEAPON_DAILY, kind = pool[Math.floor(rng(s) * pool.length)]; addItem(s, kind, { zone: rng(s) < 0.6 ? 'market' : 'pump' }, { hidden: { ren: 1, akechi: 1 }, data: { dur: CFG.WEAPONS[kind].dur } }); }
      s.checkpointOpen = true; s.regOpen = true;
      for (const r of ROLES) { s.players[r].passed = false; log(s, r, 'pa', 'paGateOpen', {}); }
      break;
    case 'gateClose':
      s.checkpointOpen = false;
      for (const r of ROLES) {
        log(s, r, 'pa', 'paGateClose', {});
        const p = s.players[r];
        if (p.task && p.task.kind === 'move' && [p.zone, p.task.data.to].sort().join('-') === 'checkpoint-dorm') { p.task = null; log(s, r, 'self', 'gateShut.self', {}); }
        if (p.task && p.task.kind === 'sign') p.task = null;
      }
      break;
    case 'noon': break;
    case 'nightEvent': nightEvent(s); break;
    case 'strangerEnd': {
      const st = s.stranger; s.stranger = null;
      if (!st) break;
      const gift = sillItems(s).find((i) => ['water', 'food', 'jug', 'bandage', 'blanket'].includes(i.kind));
      for (const r of ROLES) if (s.players[r].zone === 'dorm' || s.players[r].zone === 'eaves') log(s, r, 'hear', gift ? 'nStrangerThanks' : 'nStrangerGone', { item: gift ? gift.kind : null });
      if (gift) { delete s.items[gift.id]; feat(s, 'stranger', { item: gift.kind }); }
      break;
    }
    case 'sosReply': {
      const who = ev.data.who;
      addItem(s, 'water', { zone: 'market' }, { hidden: { ren: 1, akechi: 1 } });
      addItem(s, 'water', { zone: 'market' }, { hidden: { ren: 1, akechi: 1 } });
      addMark(s.players[who], { zone: 'market', tag: 'custom', text: '약국 뒤 창고 — 물', t: Math.round(s.t) });
      for (const r of ROLES) if (s.players[r].zone === 'dorm' || hasKind(s, r, 'radio')) log(s, r, 'radio', 'nSosReply', {});
      feat(s, 'sos', { who });
      break;
    }
    case 'routeShift': {
      const k = rng(s) < 0.5 ? 'main' : 'alley';
      if (rng(s) < 0.7) s.routes[k] = s.routes[k] === 'crowd' ? 'calm' : 'crowd';
      for (const r of ROLES) {
        const p = s.players[r];
        const sees = !p.asleep && !p.dead && isDay(s.t) && (p.zone === 'roof' || (p.zone === 'checkpoint' && k === 'main'));
        if (!sees) continue;
        const today = dayOf(s.t);
        if (!p.scouted || p.scouted.day !== today) p.scouted = { day: today };
        p.scouted[k] = { v: s.routes[k], t: s.t };
        log(s, r, 'self', 'routeShift.self', { route: k, v: s.routes[k] });
      }
      break;
    }
    case 'bus':
      s.busHere = true;
      for (const r of ROLES) log(s, r, 'pa', 'paBusHere', {});
      break;
    case 'busGone': {
      s.busHere = false;
      s.flags = s.flags || {}; s.flags.busZones = { ren: s.players.ren.zone, akechi: s.players.akechi.zone };
      const gone = ROLES.filter((r) => s.players[r].boarded);
      const st = stockCounts(s);
      if (gone.length) { feat(s, 'boarded', { who: gone, water: st.water, food: st.food }); endRun(s, 'bus'); }
      else { feat(s, 'sentBus', { water: st.water, food: st.food }); for (const r of ROLES) log(s, r, 'pa', 'paBusGone', {}); if (ROLES.some((r) => !s.players[r].dead)) { s.flags = s.flags || {}; s.flags.sentBus = true; for (const r of ROLES) log(s, r, 'self', 'sentBus.self', {}); } }
      break;
    }
  }
}
function wakeIfAsleepPA(s, r) { const p = s.players[r]; if (p.asleep) { p.asleep = false; if (p.task && p.task.kind === 'rest') p.task = null; } }

export function spawnZombie(s, zone, opts = {}) {
  if (!opts.force && (Object.keys(s.zombies).length >= CFG.MAX_ZOMBIES || zombieIn(s, zone))) return;
  const id = 'z' + s.nextId++;
  const zo = Math.floor(rng(s) * CFG.ORIGINS);
  const tough = !opts.of && rng(s) < CFG.TOUGH;
  s.zombies[id] = { id, zone, st: 'idle', until: 0, hp: opts.of || tough ? 2 : 1, maxHp: opts.of || tough ? 2 : 1, entered: 0, zo, of: opts.of || null };
  if (!opts.of) emit(s, 'zAppear', null, zone, { zone, zo });
}

function stepNoise(s, d) {
  for (const z of Object.keys(s.noise)) {
    s.noise[z] = Math.max(0, s.noise[z] - 0.15 * d);
    if (ZONES[z].outside && s.noise[z] >= (isDay(s.t) ? CFG.NOISE_SPAWN : CFG.NOISE_SPAWN_NIGHT) && !zombieIn(s, z)) {
      s.noise[z] = 0;
      spawnZombie(s, z);
    } else if (s.noise[z] >= 3 && !s['hint_' + z]) {
      s['hint_' + z] = true;
      emit(s, 'noiseHint', null, z, { zone: z });
    } else if (s.noise[z] < 2) s['hint_' + z] = false;
  }
}
function addNoise(s, z, n) { if (ZONES[z].outside) s.noise[z] += n; }

export const stamCap = (p) => Math.max(20, 100 - 25 * p.hunger - 35 * p.thirst);
function stepPlayer(s, r, d) {
  const p = s.players[r];
  const o = s.players[other(r)];
  if (p.dead || p.boarded) return;
  // 억제제가 다하면 진행이 다시 시작된다
  if (p.bite && p.bite.suppressed && p.bite.supUntil && s.t >= p.bite.supUntil) {
    const b = p.bite;
    b.suppressed = false;
    if (b.stage < 1) { b.symptomAt = s.t + CFG.SYMPTOM_AFTER; b.restrictAt = b.symptomAt + CFG.RESTRICT_AFTER; }
    else if (b.stage < 2) b.restrictAt = s.t + CFG.RESTRICT_AFTER;
    else p.restricted = true;
    if (b.prog) log(s, r, 'self', 'supWear.self', {});
  }
  const out = ZONES[p.zone].outside;
  // 추위
  const blanket = hasKind(s, r, 'blanket');
  p.cold = Math.min(100, Math.max(0, p.cold + (out ? (isDay(s.t) ? 0.12 : blanket ? 0.2 : 0.5) : -2) * d));
  if (p.cold >= 60) {
    p.stamina = Math.max(0, p.stamina - 0.5 * d);
    if (!p.coldWarned) { p.coldWarned = true; log(s, r, 'self', 'cold.self', {}); }
  } else if (p.cold < 40) p.coldWarned = false;
  // 감염
  const b = p.bite;
  if (b && b.prog && !b.suppressed) {
    if (b.stage < 1 && s.t >= b.symptomAt) {
      b.stage = 1; b.known = true; b.penalty = true;
      emit(s, 'symptom', r, p.zone, {});
      const bag = bagOf(s, r).filter((i) => i.kind !== 'key');
      if (bag.length && rng(s) < 0.6) {
        const it = bag.find((i) => i.kind === 'radio' || i.kind === 'radio_broken') || pickOne(s, bag);
        it.loc = { zone: p.zone }; it.found = true;
        emit(s, 'symptomDrop', r, p.zone, { item: it.kind });
      }
    }
    if (b.stage < 2 && s.t >= b.restrictAt) {
      b.stage = 2; p.restricted = true;
      if (p.task && ['move', 'retreat', 'search', 'fight', 'push'].includes(p.task.kind)) p.task = null;
      emit(s, 'restrict', r, p.zone, {});
    }
    if (b.stage >= 2 && s.t >= b.restrictAt + CFG.TURN_AFTER) { turn(s, r); return; }
  }
  // 출혈
  if (p.bleed) { p.hp = Math.max(0, p.hp - CFG.BLEED_RATE * d); if (p.hp <= 0 && !p.down) { p.down = true; } }
  // 휴식·망보기
  const t = p.task;
  if (t && t.kind === 'rest') {
    const watched = o.zone === p.zone && o.task && o.task.kind === 'watch';
    const leaning = p.lean && o.zone === p.zone && o.task && o.task.kind === 'rest' && o.lean === r;
    const rate = (p.zone === 'dorm' ? (watched ? 3 : s.base.beds ? 2.5 : 1.5) : 0.8) * (leaning ? 1.5 : 1);
    p.stamina = Math.min(100, p.stamina + rate * d);
    p.restMin += d;
    if (b && b.suppressed && b.penalty) { b.penaltyRest = (b.penaltyRest || 0) + d; if (b.penaltyRest >= 10) b.penalty = false; }
  } else if (p.zone === 'dorm') p.stamina = Math.min(100, p.stamina + 0.3 * d);
  if (t && t.kind === 'watch' && s.t >= CFG.LIGHTS_OUT) p.watchMin += d;
  if (p.stamina > stamCap(p)) p.stamina = stamCap(p);
  // 탈진
  if (p.stamina <= 0 && !p.exhausted) {
    p.exhausted = true;
    if (p.task && ['move', 'retreat', 'search', 'fight', 'push'].includes(p.task.kind)) p.task = null;
    emit(s, 'exhausted', r, p.zone, {});
  } else if (p.exhausted && p.stamina >= 25) p.exhausted = false;
  if (p.zone === 'dorm' && (!p.lastStock || s.t - p.lastStock.t >= 1)) p.lastStock = { ...stockCounts(s), t: s.t };
  // 거들기·함께 들기 정리
  if (p.task && p.task.kind === 'help' && !(o.zone === p.zone && o.task && HELPABLE.has(o.task.kind))) p.task = null;
  if (p.carryHelp && (s.players[p.carryHelp].zone !== p.zone || !isHeavy(s, r))) { s.players[p.carryHelp].carrying = null; p.carryHelp = null; }
  // 부축 해제(같은 곳이 아니면)
  if (p.supporting && s.players[p.supporting].zone !== p.zone) { s.players[p.supporting].supportedBy = null; p.supporting = null; }
  diffStatus(s, r);
  // 작업 진행
  if (p.task && !p.task.paused && !p.task.blockedBy && p.task.kind !== 'tug' && isFinite(p.task.dur)) {
    let rate = 1;
    if (p.task.kind === 'fight') {
      const z = zombieIn(s, p.zone);
      if (z && o.zone === p.zone && o.task && o.task.kind === 'fight') rate = 2;
    }
    if (HELPABLE.has(p.task.kind) && o.zone === p.zone && o.task && o.task.kind === 'help' && o.task.data.of === r) rate *= CFG.HELP_RATE;
    if (p.task.kind === 'move' && p.task.data.route === 'main' && p.task.data.to === 'checkpoint' && s.routes.main === 'crowd' && !p.task.data.crowdAsked && p.task.prog >= p.task.dur * 0.5) {
      p.task.data.crowdAsked = true; p.task.paused = true;
      p.crowdAsk = { until: s.t + 4 };
      log(s, r, 'self', 'crowdBehind.self', {});
      if (radioLink(s)) log(s, o.role, 'radio', 'crowdBehind.radio', { who: r });
      return;
    }
    p.task.prog += d * rate;
    if (p.task.prog >= p.task.dur) { const done = p.task; p.task = null; complete(s, r, done); }
  }
}

// 무리 선택: 시간이 지나면 그대로 달린 것으로
function crowdResolve(s, r, how) {
  const p = s.players[r];
  if (!p.crowdAsk) return;
  p.crowdAsk = null;
  if (!p.task || p.task.kind !== 'move') return;
  p.task.paused = false;
  if (how === 'veer') {
    const bag = bagOf(s, r).filter((i) => !['key', 'pass', 'note', 'result'].includes(i.kind));
    const drop = bag.sort((a, b) => sizeOf(b) - sizeOf(a))[0];
    if (drop) delete s.items[drop.id];
    p.task.data.route = 'alley'; p.task.dur += 8;
    log(s, r, 'self', 'crowdVeer.self', { item: drop ? drop.kind : null });
  } else log(s, r, 'self', 'crowdRun.self', {});
}
function stepZombie(s, z) {
  const here = occupants(s, z.zone);
  if (z.zone === 'roof' && !s.roofDoor.locked && occupants(s, 'dorm').length && !here.length) {
    z.entered = (z.entered || 0) + CFG.STEP;
    if (z.entered >= 3) { z.zone = 'dorm'; z.st = 'idle'; z.entered = 0; emit(s, 'zEnterDorm', null, 'dorm', {}); return; }
  } else if (z.zone === 'roof' && s.roofDoor.locked && occupants(s, 'dorm').length && !here.length) {
    z.scratch = (z.scratch || 0) + CFG.STEP;
    if (z.scratch >= 4) { z.scratch = 0; emit(s, 'doorScratch', null, 'dorm', {}); }
  }
  if (!here.length) { if (z.st !== 'stun') z.st = 'idle'; return; }
  if (z.st === 'idle') { z.st = 'approach'; z.until = s.t + CFG.APPROACH; return; }
  if (s.t < z.until) return;
  if (z.st === 'approach') {
    z.st = 'warn'; z.until = s.t + CFG.WARN;
    for (const r of here) {
      const p = s.players[r];
      if (p.asleep) wake(s, r);
      p.stance = null;
      if (p.task && !['retreat', 'move', 'fight', 'push', 'tug'].includes(p.task.kind)) { p.task.paused = true; p.autoGuard = true; }
      log(s, r, 'self', 'zWarn.self', {});
    }
  } else if (z.st === 'warn') {
    resolveLunge(s, z, here);
    z.st = 'approach'; z.until = s.t + CFG.APPROACH;
    for (const r of ROLES) { const p = s.players[r]; if (p.autoGuard && p.task) p.task.paused = false; p.autoGuard = false; if (p.zone === z.zone) p.stance = null; }
  } else if (z.st === 'stun') {
    z.st = 'approach'; z.until = s.t + CFG.APPROACH;
  }
}

// 맞서기 승산: 혼자·멀쩡한 상대면 반반 아래, 밀어내 비틀거리게 하거나 둘이 붙으면 올라간다
// 가방에서 가장 좋은 무기(맞서기용 / 밀어내기용)
export function weaponOf(s, r, use = 'fight') {
  let best = null, bv = -1;
  for (const i of bagOf(s, r)) {
    const W = CFG.WEAPONS[i.kind]; if (!W) continue;
    const val = use === 'fight' ? W.fight || 0 : W.push ? 1 : 0;
    if (val > bv && val > 0) { best = i; bv = val; }
  }
  return best;
}
function wear(s, r, it) {
  if (!it) return;
  it.data = it.data || { dur: CFG.WEAPONS[it.kind].dur };
  it.data.dur = (it.data.dur ?? CFG.WEAPONS[it.kind].dur) - 1;
  if (it.data.dur <= 0) { delete s.items[it.id]; emit(s, 'weaponBroke', r, s.players[r].zone, { item: it.kind }); }
}
export function fightWin(s, r, z) {
  const p = s.players[r], o = s.players[other(r)];
  let w = CFG.FIGHT_WIN;
  if (z.st === 'stun') w += CFG.FIGHT_STUN;
  { const wp = weaponOf(s, r, 'fight'); if (wp) w += CFG.WEAPONS[wp.kind].fight; }
  if (o.zone === p.zone && !o.dead && o.task && o.task.kind === 'fight') w += CFG.FIGHT_PAIR;
  if (p.stamina < 30) w -= CFG.LOWSTAM;
  if (!isDay(s.t) && ZONES[p.zone].outside && !hasKind(s, r, 'light')) w -= CFG.FIGHT_DARK;
  return Math.max(0.1, Math.min(0.95, w));
}
// 물리거나 할퀴인다
function wound(s, target, z, prob, dmgGraze = 15) {
  if (s.biteMode === 'none') prob = 0;
  if (s.biteMode === 'prog' || s.biteMode === 'non') prob = Math.max(prob, 0.95);
  if (rng(s) < prob && !target.bite) {
    const prog = s.biteMode === 'prog' ? true : s.biteMode === 'non' ? false : rng(s) < 0.5;
    target.bite = {
      t: s.t, prog, suppressed: false, stage: 0, known: false, penalty: false,
      symptomAt: s.t + CFG.SYMPTOM_AFTER, restrictAt: s.t + CFG.SYMPTOM_AFTER + CFG.RESTRICT_AFTER,
    };
    target.hp = Math.max(0, target.hp - 10);
    target.sleeveDown = false;
    target.bleed = true;
    emit(s, 'bite', target.role, z.zone, { zo: z.zo, of: z.of, dmg: 10 });
  } else {
    target.hp = Math.max(0, target.hp - dmgGraze);
    target.scratchUntil = s.t + 120;
    if (rng(s) < 0.4) target.bleed = true;
    emit(s, 'graze', target.role, z.zone, { zo: z.zo, of: z.of, dmg: dmgGraze });
  }
  if (target.hp <= 0) target.down = true;
}
function resolveLunge(s, z, here) {
  const safe = (p) => p.task && (p.task.kind === 'retreat' || p.task.kind === 'move');
  const ps = here.map((r) => s.players[r]).filter((p) => !safe(p));
  // 노출: 하던 일 계속(위험 감수) · 엄호 · 맞서기/밀어내기 도중. 그 외(경계)는 확실히 피한다.
  const exposed = ps.filter((p) => p.down || p.stance === 'persist' || p.stance === 'cover' || (p.task && (p.task.kind === 'fight' || p.task.kind === 'push')));
  const coverer = exposed.find((p) => p.stance === 'cover');
  for (const p of ps) if (!exposed.includes(p)) spend(p, CFG.COST.guard);
  if (!exposed.length) {
    const t2 = ps.length ? pickOne(s, ps) : null;
    if (t2 && rng(s) < CFG.DODGE_FAIL[t2.stamina < 30 ? 1 : 0]) { emit(s, 'dodgeFail', t2.role, z.zone, { zo: z.zo, of: z.of }); wound(s, t2, z, 0, 10); return; }
    emit(s, 'lungeMiss', null, z.zone, { zo: z.zo, of: z.of }); return;
  }
  const target = coverer || pickOne(s, exposed);
  if (target.down && !coverer) { kill(s, target.role, 'zombie'); return; }
  if (target.stance === 'cover') spend(target, CFG.COST.cover);
  const partner = ps.find((p) => p !== target);
  let prob = CFG.BITE_P;
  if (partner && partner.task && partner.task.kind === 'push') prob -= CFG.PUSH_HELP;
  if (target.stamina < 30) prob += CFG.LOWSTAM;
  wound(s, target, z, prob);
}

// ── 작업 완료 ───────────────────────────────────────────────
function complete(s, r, t) {
  const p = s.players[r];
  const o = s.players[other(r)];
  const it = t.data.item ? s.items[t.data.item] : null;
  switch (t.kind) {
    case 'move': case 'retreat': {
      const to = t.data.to;
      if (passBlockReason(s, p, to)) { log(s, r, 'self', 'moveFail.self', { zone: to }); return; }
      const carried = p.supporting && s.players[p.supporting].zone === p.zone ? p.supporting : null;
      const helper = p.carryHelp && s.players[p.carryHelp].zone === p.zone ? p.carryHelp : null;
      p.zone = to;
      if (helper) { s.players[helper].zone = to; log(s, helper, 'self', 'carryMove.self', { zone: to, who: r }); if (to === 'dorm') feat(s, 'carryHome', { who: r, to: helper }); }
      if (to === 'dorm') {
        for (const q of [r, helper].filter(Boolean)) {
          const pq = s.players[q];
          if (!pq.outing) continue;
          let water = 0, food = 0, other2 = 0;
          for (const i of bagOf(s, q)) { if (i.kind === 'water') water++; else if (i.kind === 'jug') water += i.data.left; else if (i.kind === 'food') food++; else if (!['note', 'result', 'pass', 'key'].includes(i.kind)) other2++; }
          feat(s, 'home', { who: q, dest: pq.outing.dest, water, food, other: other2 });
          pq.outing = null;
        }
      }
      emit(s, 'enter', r, to, { zone: to });
      if (t.data.route === 'under') {
        s.flags = s.flags || {};
        s.flags['usedUnder_' + r] = true;
        if (to === 'dorm') {
          log(s, r, 'self', 'underHome.self', {});
          if (p.bite) s.flags['bypass_' + r] = true;
        } else {
          const lit = hasKind(s, r, 'light');
          if (rng(s) < CFG.UNDER_DARK[lit ? 1 : 0]) { emit(s, 'underDark', r, to, { lit }); spawnZombie(s, to, { force: true }); const zz = zombieIn(s, to); if (zz) { zz.st = 'approach'; zz.until = s.t + 0.3; } }
          const ck = 'underCache_' + dayOf(s.t) + '_' + to;
          if (!s.flags[ck]) { s.flags[ck] = true; const pool = ['suppressant', 'kit', 'battery', 'bat']; const kind = pool[Math.floor(rng(s) * pool.length)]; addItem(s, kind, { zone: to }, CFG.WEAPONS[kind] ? { data: { dur: CFG.WEAPONS[kind].dur } } : {}); log(s, r, 'self', 'underCache.self', { item: kind }); }
        }
      } else if (t.data.route) {
        if (s.routes[t.data.route] === 'crowd') {
          emit(s, 'crowd', r, to, { route: t.data.route }); s.noise[to] = Math.max(s.noise[to], 3); spawnZombie(s, to); const zz = zombieIn(s, to); if (zz) { zz.st = 'approach'; zz.until = s.t + 0.5; }
          if (to === 'checkpoint' && t.data.route === 'main' && rng(s) < CFG.CROWD_FOLLOW) {
            s.flags = s.flags || {}; s.flags.crowdLed = { who: r, day: dayOf(s.t) };
            spawnZombie(s, 'eaves', { force: true }); addNoise(s, 'dorm', 1);
            for (const q of ROLES) if (s.players[q].zone === 'dorm' || s.players[q].zone === 'eaves') log(s, q, 'see', 'crowdFollow', { who: r });
          }
        } else if (t.data.route === 'alley' && (to === 'market' || to === 'pump') && rng(s) < CFG.ALLEY_FIND) {
          const pool = to === 'pump' ? ['water', 'cloth'] : ['food', 'plank', 'cloth'];
          const kind = pool[Math.floor(rng(s) * pool.length)]; addItem(s, kind, { zone: to }); log(s, r, 'self', 'alleyFind.self', { item: kind });
        }
        else if ((to === 'market' || to === 'pump') && rng(s) < (isDay(s.t) ? (to === 'pump' ? 0.15 : 0.25) : 0.8)) spawnZombie(s, to);
      }
      if (carried) { s.players[carried].zone = to; log(s, carried, 'self', 'carried.self', { zone: to, who: r }); }
      if (zombieIn(s, to)) log(s, r, 'self', 'zHere.self', {});
      break;
    }
    case 'search': {
      const z = p.zone;
      p.searches[z] = (p.searches[z] || 0) + 1;
      const found = [];
      for (const i of itemsAt(s, z)) {
        if (i.found || !i.hidden) continue;
        if (p.searches[z] >= i.hidden[r]) { i.found = true; found.push(i.kind); if (i.hiddenBy && i.hiddenBy !== r) feat(s, 'foundHidden', { who: r, by: i.hiddenBy, item: i.kind, zone: z }); }
      }
      addNoise(s, z, z === 'market' ? 1 : 0.5);
      log(s, r, 'self', found.length ? 'searchDone.found' : 'searchDone.none', { items: found, zone: z });
      if (r === 'ren' && z === s.keyAt && !p.trace) { p.trace = true; log(s, r, 'self', 'special.ren.' + z, {}); }
      if (r === 'ren' && z === 'roof' && !p.traceRoof) { p.traceRoof = true; log(s, r, 'self', 'special.ren.door', {}); }
      break;
    }
    case 'pick':
      if (it && itemReachable(s, r, it) && !it.loc.bag) {
        if (bagLoad(s, r) + sizeOf(it) > CFG.CAP) { log(s, r, 'self', 'bagFull.self', { item: it.kind }); break; }
        const wasSill = it.loc.sill, wasBox = it.loc.box;
        it.loc = { bag: r };
        emit(s, wasSill ? 'sillTake' : 'pick', r, p.zone, { item: it.kind, box: !!wasBox });
      }
      break;
    case 'drop':
      if (it && it.loc.bag === r) { it.loc = { zone: p.zone }; it.found = true; emit(s, 'drop', r, p.zone, { item: it.kind }); }
      break;
    case 'stash':
      if (it && it.loc.bag === r && p.zone === 'dorm') { it.loc = { box: true }; emit(s, 'stash', r, p.zone, { item: it.kind }); }
      break;
    case 'sill':
      if (it && it.loc.bag === r && ZONES[p.zone].sill) { it.loc = { sill: true }; emit(s, 'sillPut', r, p.zone, { item: it.kind }); }
      break;
    case 'give':
      if (it && it.loc.bag === r && o.zone === p.zone) {
        if (bagLoad(s, o.role) + sizeOf(it) > CFG.CAP) { log(s, r, 'self', 'theirBagFull.self', { item: it.kind, to: o.role }); break; }
        it.loc = { bag: o.role };
        s.lastGive = { from: r, to: o.role, item: it.kind, t: s.t };
        if (it.kind === 'key' || it.kind === 'result') { s.flags = s.flags || {}; s.flags['gave_' + it.kind + '_' + r] = true; }
        emit(s, 'give', r, p.zone, { item: it.kind, to: o.role });
      }
      break;
    case 'inspect':
      if (!s.checkpointOpen) return;
      spend(p, CFG.COST.inspect);
      if (p.bite) emit(s, 'inspectFail', r, p.zone, {});
      else { p.passed = true; emit(s, 'inspectPass', r, p.zone, {}); }
      break;
    case 'sign':
      if (!s.checkpointOpen) return;
      p.signed = true;
      addItem(s, 'pass', { bag: r }, { data: { name: r } });
      { const got = emit(s, 'signDone', r, p.zone, {}); for (const q of ROLES) if (got[q] === 'same') s.players[q].knownPass[r] = true; }
      break;
    case 'lock':
      s.roofDoor.locked = true; emit(s, 'lockDone', r, p.zone, {});
      break;
    case 'unlock':
      s.roofDoor.locked = false; emit(s, 'unlockDone', r, p.zone, {});
      break;
    case 'diagnose': {
      if (!it || it.loc.bag !== r) return;
      delete s.items[it.id];
      const res = !p.bite ? 'clear' : p.bite.prog ? 'prog' : 'non';
      if (p.bite) p.bite.known = true;
      addItem(s, 'result', { bag: r }, { data: { res, owner: r, t: Math.round(s.t) } });
      emit(s, 'diagnose', r, p.zone, { res });
      if (t.data.share && o.zone === p.zone && !o.asleep) emit(s, 'diagShared', r, p.zone, { res });
      break;
    }
    case 'inject':
      if (!it || it.loc.bag !== r) return;
      delete s.items[it.id];
      if (p.bite && !p.bite.suppressed) {
        p.bite.suppressed = true; p.restricted = false; p.bite.supUntil = s.t + CFG.SUPPRESS_FOR;
        emit(s, 'inject', r, p.zone, {});
      } else emit(s, 'injectWaste', r, p.zone, {});
      break;
    case 'bandage':
      if (!it || it.loc.bag !== r) return;
      delete s.items[it.id];
      p.hp = Math.min(100, p.hp + 30); if (p.hp > 0) p.down = false; p.bleed = false;
      emit(s, 'bandage', r, p.zone, {});
      break;
    case 'eat': case 'drink':
      if (!it || it.loc.bag !== r) return;
      if (it.kind === 'jug' && !(it.data && it.data.left > 0)) { log(s, r, 'self', 'jugEmpty.self', {}); return; }
      if (it.kind === 'jug') it.data.left = Math.max(0, it.data.left - 1);
      else delete s.items[it.id];
      p.stamina = Math.min(100, p.stamina + (t.kind === 'eat' ? 20 : 15));
      emit(s, t.kind, r, p.zone, {});
      break;
    case 'fixRadio': {
      const radio = hasKind(s, r, 'radio_broken') || hasKind(s, r, 'radio'), bat = hasKind(s, r, 'battery');
      if (!radio || !bat) return;
      delete s.items[bat.id];
      if (radio.kind === 'radio') { radio.data = { ...(radio.data || {}), charge: 100 }; log(s, r, 'self', 'recharge.self', {}); break; }
      radio.kind = 'radio'; radio.data = { ...(radio.data || {}), charge: 100 };
      emit(s, 'fixRadio', r, p.zone, {});
      feat(s, 'radio', { who: r });
      break;
    }
    case 'note':
      addItem(s, 'note', { bag: r }, { data: { text: t.data.text, by: r, t: Math.round(s.t) } });
      emit(s, 'note', r, p.zone, {});
      break;
    case 'fight': {
      const z = zombieIn(s, p.zone);
      const wp = weaponOf(s, r, 'fight'), W = wp ? CFG.WEAPONS[wp.kind] : null;
      spend(p, CFG.COST.fight);
      addNoise(s, p.zone, Math.max(0.5, 2 + (W ? W.noise : 0)));
      const winP = z ? fightWin(s, r, z) : 1;
      if (z && wp) wear(s, r, wp);
      if (z && rng(s) >= winP) {
        // 밀렸다: 붙잡힌 채 반격당하고, 좀비는 곧 다시 달려든다
        emit(s, 'fightLose', r, p.zone, { zo: z.zo, of: z.of, item: wp ? wp.kind : null });
        wound(s, p, z, Math.max(0.05, CFG.FIGHT_BITE - (W ? W.keep : 0)));
        z.st = 'approach'; z.until = s.t + 0.5;
      } else if (z) {
        z.hp -= 1;
        if (z.hp > 0) { emit(s, 'zHit', r, p.zone, { zo: z.zo, of: z.of, item: wp ? wp.kind : null }); z.st = 'stun'; z.until = s.t + CFG.STUN; }
        if (z.hp <= 0) {
          delete s.zombies[z.id];
          emit(s, 'zDown', r, p.zone, { zo: z.zo, of: z.of, item: wp ? wp.kind : null });
          if (o.task && o.task.kind === 'fight' && o.zone === p.zone) o.task = null;
          for (const q of ROLES) { const pp = s.players[q]; if (pp.zone === p.zone) { pp.stance = null; if (pp.autoGuard && pp.task) pp.task.paused = false; pp.autoGuard = false; } }
        }
      }
      break;
    }
    case 'push': {
      const z = zombieIn(s, p.zone);
      spend(p, CFG.COST.push);
      addNoise(s, p.zone, 1);
      const pw = weaponOf(s, r, 'push');
      if (z && !pw && p.stamina < 30 && rng(s) < CFG.PUSH_FAIL) { emit(s, 'pushFail', r, p.zone, { zo: z.zo, of: z.of }); break; }
      if (z) {
        z.st = 'stun'; z.until = s.t + CFG.STUN + (pw ? CFG.WEAPONS[pw.kind].stun : 0);
        if (pw) { addNoise(s, p.zone, CFG.WEAPONS[pw.kind].noise); emit(s, 'spray', r, p.zone, { zo: z.zo, of: z.of }); wear(s, r, pw); }
        emit(s, 'push', r, p.zone, { zo: z.zo, of: z.of });
        for (const q of ROLES) { const pp = s.players[q]; if (pp.zone === p.zone) { pp.stance = null; if (pp.autoGuard && pp.task) pp.task.paused = false; pp.autoGuard = false; } }
      }
      break;
    }
    case 'build': {
      const B = CFG.BUILD[t.data.id];
      if (!B || s.base[t.data.id] || p.zone !== 'dorm') return;
      const pool = [...bagOf(s, r), ...dormStock(s)];
      for (const [k, n] of Object.entries(B.need)) if (pool.filter((i) => i.kind === k).length < n) { log(s, r, 'self', 'buildFail.self', {}); return; }
      for (const [k, n] of Object.entries(B.need)) for (let c = 0; c < n; c++) { const it2 = pool.find((i) => i.kind === k && s.items[i.id]); if (it2) delete s.items[it2.id]; }
      s.base[t.data.id] = true;
      emit(s, 'built', r, p.zone, { id: t.data.id });
      feat(s, 'built', { who: r, id: t.data.id });
      break;
    }
    case 'answerSos':
      if (!s.sos) return;
      s.sos = null;
      addNoise(s, p.zone === 'dorm' ? 'eaves' : p.zone, 1);
      emit(s, 'answerSos', r, p.zone, {});
      s.sched.push({ t: s.t + 20, kind: 'sosReply', data: { who: r }, done: false });
      break;
    case 'fill': {
      const jug = s.items[t.data.item];
      if (!jug || jug.loc.bag !== r || p.zone !== 'pump') return;
      jug.data.left = Math.min(CFG.JUG_CAP, jug.data.left + 1);
      addNoise(s, 'pump', 0.8);
      if (jug.data.left < t.data.target) { startTask(s, r, 'fill', CFG.FILL_PER, { item: jug.id, target: t.data.target }); }
      else { emit(s, 'fillDone', r, p.zone, { left: jug.data.left }); feat(s, 'fill', { who: r, left: jug.data.left }); }
      break;
    }
    case 'hide': {
      if (!it || it.loc.bag !== r || !ZONES[p.zone].outside) return;
      it.loc = { zone: p.zone }; it.found = false; it.hidden = { ren: 1, akechi: 1 }; it.hiddenBy = r;
      addMark(p, { zone: p.zone, tag: 'hid', item: it.kind, t: Math.round(s.t) });
      emit(s, 'hide', r, p.zone, { item: it.kind });
      break;
    }
    case 'shareMap': {
      if (o.zone !== p.zone) return;
      for (const m of p.marks) addMark(o, m);
      for (const m of o.marks) addMark(p, m);
      const today = dayOf(s.t);
      const merge = (a, b) => { if (!a || a.day !== today) return b && b.day === today ? JSON.parse(JSON.stringify(b)) : a; if (!b || b.day !== today) return a; const out = { day: today }; for (const k of ['main', 'alley']) out[k] = !a[k] ? b[k] : !b[k] ? a[k] : a[k].t >= b[k].t ? a[k] : b[k]; return out; };
      const m1 = merge(p.scouted, o.scouted);
      p.scouted = m1 ? JSON.parse(JSON.stringify(m1)) : p.scouted; o.scouted = m1 ? JSON.parse(JSON.stringify(m1)) : o.scouted;
      if (p.knowsUnder && !o.knowsUnder) { o.knowsUnder = true; log(s, o.role, 'self', 'underLearn.self', { who: r }); }
      emit(s, 'shareMap', r, p.zone, { to: o.role });
      break;
    }
    case 'scout': {
      const prev = p.scouted && p.scouted.day === dayOf(s.t) ? p.scouted : { day: dayOf(s.t) };
      prev.main = { v: s.routes.main, t: s.t };
      if (p.zone === 'roof') prev.alley = { v: s.routes.alley, t: s.t };
      p.scouted = prev;
      emit(s, 'scout', r, p.zone, { main: prev.main.v, alley: prev.alley ? prev.alley.v : null });
      break;
    }
    case 'board':
      if (!s.busHere) return;
      if (p.bite) { s.flags = s.flags || {}; s.flags['boardFail_' + r] = true; emit(s, 'boardFail', r, p.zone, {}); break; }
      p.boarded = true; p.task = null;
      emit(s, 'board', r, p.zone, {});
      break;
    case 'listen':
      if (!s.bcast) return;
      p.listened = true;
      log(s, r, 'radio', 'bcastTail', {});
      if (r === 'akechi') log(s, r, 'self', 'special.akechi0', {});
      break;
    case 'pipe': {
      p.pipe = true;
      const key = Object.values(s.items).find((i) => i.kind === 'key' && i.loc.zone === 'eaves');
      if (key) { key.found = true; key.loc = { bag: r }; emit(s, 'pipe', r, p.zone, { found: true }); if (r === 'ren') log(s, r, 'self', 'special.ren.pipe', {}); }
      else emit(s, 'pipe', r, p.zone, { found: false });
      break;
    }
    case 'sleeve':
      p.sleeveDown = true; emit(s, 'sleeve', r, p.zone, {});
      break;
    case 'showWound':
      p.sleeveDown = false; emit(s, 'showWound', r, p.zone, {});
      break;
  }
}

// ── 명령 ───────────────────────────────────────────────────
const OK = { ok: true };
const ERR = (e) => ({ ok: false, err: e });

export function applyCommand(s, r, cmd, now) {
  advance(s, now);
  const p = s.players[r];
  const o = s.players[other(r)];
  if (!p) return ERR('noRole');
  if (cmd.type === 'dev') return devCmd(s, cmd, now);
  if (s.phase === 'prologue') return prologueCmd(s, r, cmd, now);
  if (s.phase === 'morning') return morningCmd(s, r, cmd, now);
  if (s.phase === 'result') return resultCmd(s, r, cmd, now);
  if (p.dead && p.turned && cmd.type === 'say') {
    const n = Math.max(3, Math.min(14, String(cmd.text || '').length));
    const text = '그' + 'ㅡ으'.repeat(Math.ceil(n / 3)).slice(0, n) + '…';
    emit(s, 'moan', r, p.zone, { text });
    return OK;
  }
  if (p.dead || p.boarded) { if (p.dead || !['say', 'signal', 'typing'].includes(cmd.type)) return ERR('out'); }
  if (s.phase !== 'play') return ERR('notPlaying');
  if (s.paused) return ERR('paused');
  const z = zombieIn(s, p.zone);
  const inTug = s.tug && s.tug[r];
  const talk = ['say', 'signal', 'typing', 'emote'];
  if (inTug && !['tugRelease', 'tugGive', 'tugKeep', ...talk].includes(cmd.type)) return ERR('tugging');
  if (p.asleep && !talk.includes(cmd.type)) { p.asleep = false; if (p.task && p.task.kind === 'rest') p.task = null; }

  switch (cmd.type) {
    case 'move': {
      const to = cmd.to;
      if (cmd.route === 'under') {
        const ok = p.knowsUnder && s.t >= CFG.BROADCASTS[0] && ((p.zone === 'dorm' && (to === 'market' || to === 'pump')) || ((p.zone === 'market' || p.zone === 'pump') && to === 'dorm'));
        if (!ok) return ERR('noExit');
        if (!selfMobile(p)) return ERR('immobile');
        if (p.supportedBy) return ERR('beingSupported');
        if (p.carrying) return ERR('carrying');
        if (z && z.st !== 'idle') return ERR('busy');
        const dest = to === 'dorm' ? p.zone : to;
        const heavy = isHeavy(s, r) && !(p.carryHelp && s.players[p.carryHelp].zone === p.zone);
        const hadLink = radioLink(s);
        spend(p, CFG.COST.move * 2 * (heavy ? 1.5 : 1));
        if (to !== 'dorm' && !p.outing) p.outing = { t: s.t, dest: to };
        startTask(s, r, 'move', CFG.UNDER_DUR[dest] * (p.supporting ? 1.5 : 1) * (heavy ? CFG.HEAVY_MULT : 1), { to, route: 'under' }, { interruptible: true });
        p.stance = null; p.autoGuard = false;
        emit(s, 'leave', r, p.zone, { zone: to, retreat: false, under: true });
        if (hadLink) log(s, o.role, 'radio', 'underCut', { who: r });
        return OK;
      }
      if (!ZONES[p.zone].exits.includes(to)) return ERR('noExit');
      if (!selfMobile(p)) return ERR('immobile');
      if (p.supportedBy) return ERR('beingSupported');
      const why = passBlockReason(s, p, to);
      if (why) return ERR(why);
      const retreat = z && z.st !== 'idle';
      if (p.carrying) return ERR('carrying');
      const far = isFar(p.zone, to);
      const route = far ? (cmd.route === 'alley' ? 'alley' : 'main') : null;
      const dest = far ? (to === 'checkpoint' ? p.zone : to) : null;
      const base = far ? CFG.ROUTE_DUR[dest][route] : retreat ? CFG.DUR.retreat : CFG.DUR.move;
      const heavy = isHeavy(s, r) && !(p.carryHelp && s.players[p.carryHelp].zone === p.zone);
      const dur = base * (p.supporting ? 1.5 : 1) * (heavy ? CFG.HEAVY_MULT : 1);
      spend(p, (retreat ? CFG.COST.retreat : CFG.COST.move * (far ? 2 : 1)) * (heavy ? 1.5 : 1));
      if (far && route === 'alley') { spend(p, CFG.COST.move); p.cold = Math.min(100, (p.cold || 0) + 8); }
      if (far && to !== 'checkpoint' && !p.outing) p.outing = { t: s.t, dest: to };
      startTask(s, r, retreat ? 'retreat' : 'move', dur, { to, route }, { interruptible: !retreat });
      p.stance = null; p.autoGuard = false;
      emit(s, 'leave', r, p.zone, { zone: to, retreat });
      return OK;
    }
    case 'search': {
      if (!selfMobile(p)) return ERR('immobile');
      const dark = ZONES[p.zone].outside && !isDay(s.t) && !hasKind(s, r, 'light');
      spend(p, CFG.COST.search);
      startTask(s, r, 'search', dark ? CFG.DUR.searchDark : CFG.DUR.search);
      emit(s, 'search', r, p.zone, {});
      return OK;
    }
    case 'cancel':
      if (p.blocking) { releaseBlock(s, r); emit(s, 'release', r, p.zone, {}); return OK; }
      cancelTask(s, r); return OK;
    case 'pick': {
      const it = s.items[cmd.item];
      if (!it || !itemReachable(s, r, it) || it.loc.bag) return ERR('unreachable');
      // 같은 물건을 동시에 집으면 둘 다 손을 뻗은 상태로 남는다
      if (o.task && o.task.kind === 'pick' && o.task.data.item === it.id) {
        s.tug = { item: it.id, ren: 'hold', akechi: 'hold' };
        for (const q of ROLES) { s.players[q].task = { kind: 'tug', dur: Infinity, prog: 0, data: { item: it.id }, paused: false, blockedBy: null }; }
        emit(s, 'tug', r, p.zone, { item: it.kind });
        return OK;
      }
      if (bagLoad(s, r) + sizeOf(it) > CFG.CAP) return ERR('bagFull');
      startTask(s, r, 'pick', CFG.DUR.pick, { item: it.id });
      return OK;
    }
    case 'drop': case 'stash': case 'sill': case 'give': {
      const it = s.items[cmd.item];
      if (!it || it.loc.bag !== r) return ERR('notInBag');
      if (cmd.type === 'stash' && p.zone !== 'dorm') return ERR('noBox');
      if (cmd.type === 'sill' && (!ZONES[p.zone].sill || s.base.boards)) return ERR('noSill');
      if (cmd.type === 'give' && o.zone !== p.zone) return ERR('notHere');
      if (cmd.type === 'give' && bagLoad(s, o.role) + sizeOf(it) > CFG.CAP) return ERR('theirBagFull');
      startTask(s, r, cmd.type, CFG.DUR[cmd.type], { item: it.id });
      return OK;
    }
    case 'use': {
      const it = s.items[cmd.item];
      if (!it || it.loc.bag !== r) return ERR('notInBag');
      const kind = ITEM_USE[it.kind];
      if (!kind) return ERR('cantUse');
      if (kind === 'fixRadio') {
        if (!(hasKind(s, r, 'radio_broken') || hasKind(s, r, 'radio')) || !hasKind(s, r, 'battery')) return ERR('needBoth');
      }
      startTask(s, r, kind, CFG.DUR[kind], { item: it.id, share: !!cmd.share });
      return OK;
    }
    case 'inspect':
      if (p.zone !== 'checkpoint') return ERR('notHere');
      if (!s.checkpointOpen) return ERR('closed');
      if (p.passed) return ERR('already');
      startTask(s, r, 'inspect', CFG.DUR.inspect);
      return OK;
    case 'sign':
      if (p.zone !== 'checkpoint') return ERR('notHere');
      if (!s.checkpointOpen) return ERR('closed');
      if (!s.regOpen) return ERR('regNotOpen');
      if (!p.passed) return ERR('notPassed');
      if (p.signed) return ERR('already');
      spend(p, CFG.COST.sign);
      startTask(s, r, 'sign', CFG.DUR.sign, {}, { interruptible: true });
      emit(s, 'signStart', r, p.zone, {});
      return OK;
    case 'lock': case 'unlock': {
      if (p.zone !== 'dorm' && p.zone !== 'roof') return ERR('notHere');
      if (p.zone === 'roof' && !hasKind(s, r, 'key')) return ERR('needKey');
      if (cmd.type === 'lock' && s.roofDoor.locked) return ERR('already');
      if (cmd.type === 'unlock' && !s.roofDoor.locked) return ERR('already');
      startTask(s, r, cmd.type, CFG.DUR[cmd.type], {}, { interruptible: true });
      if (cmd.type === 'lock') emit(s, 'lockStart', r, p.zone, {});
      return OK;
    }
    case 'fill': {
      if (p.zone !== 'pump') return ERR('notHere');
      const jug = jugOf(s, r);
      if (!jug) return ERR('noJug');
      const target = cmd.amount === 'full' ? CFG.JUG_CAP : Math.max(3, Math.min(CFG.JUG_CAP, jug.data.left + 1));
      if (jug.data.left >= target) return ERR('already');
      startTask(s, r, 'fill', CFG.FILL_PER, { item: jug.id, target });
      emit(s, 'fillStart', r, p.zone, {});
      return OK;
    }
    case 'hide': {
      const it = s.items[cmd.item];
      if (!it || it.loc.bag !== r) return ERR('notInBag');
      if (!ZONES[p.zone].outside) return ERR('notHere');
      startTask(s, r, 'hide', CFG.DUR.hide, { item: it.id });
      return OK;
    }
    case 'mark': {
      if (!ZONES[cmd.zone]) return ERR('bad');
      const tag = ['water', 'crowd', 'danger', 'wait', 'supply', 'custom'].includes(cmd.tag) ? cmd.tag : 'custom';
      addMark(p, { zone: cmd.zone, tag, text: tag === 'custom' ? String(cmd.text || '').slice(0, 20) : '', t: Math.round(s.t) });
      return OK;
    }
    case 'unmark':
      p.marks.splice(+cmd.i, 1);
      return OK;
    case 'shareMap':
      if (o.zone !== p.zone) return ERR('notHere');
      startTask(s, r, 'shareMap', CFG.DUR.shareMap);
      return OK;
    case 'carryWith':
      if (p.carrying) { s.players[p.carrying].carryHelp = null; p.carrying = null; emit(s, 'carryStop', r, p.zone, { to: o.role }); return OK; }
      if (o.zone !== p.zone) return ERR('notHere');
      if (!isHeavy(s, o.role)) return ERR('notNeeded');
      if (!selfMobile(p)) return ERR('immobile');
      cancelTask(s, r);
      p.carrying = o.role; o.carryHelp = r;
      emit(s, 'carryWith', r, p.zone, { to: o.role });
      return OK;
    case 'help': {
      if (o.zone !== p.zone || !o.task || !HELPABLE.has(o.task.kind)) return ERR('cantHelp');
      startTask(s, r, 'help', Infinity, { of: o.role });
      emit(s, 'help', r, p.zone, { kind: o.task.kind, to: o.role });
      return OK;
    }
    case 'takeOver': {
      if (o.zone !== p.zone || !o.task || !TAKEOVER.has(o.task.kind)) return ERR('cantHelp');
      const ot = o.task;
      const need = ot.kind === 'fill' ? [s.items[ot.data.item]] : ot.kind === 'fixRadio' ? [hasKind(s, o.role, 'radio_broken'), hasKind(s, o.role, 'battery')] : [];
      const add = need.filter(Boolean).reduce((n, i) => n + sizeOf(i), 0);
      if (bagLoad(s, r) + add > CFG.CAP) return ERR('bagFull');
      for (const i of need) if (i) i.loc = { bag: r };
      if (o.carryHelp) { s.players[o.carryHelp].carrying = null; o.carryHelp = null; }
      startTask(s, r, ot.kind, ot.dur, ot.data);
      p.task.prog = ot.prog;
      o.task = null;
      emit(s, 'takeOver', r, p.zone, { kind: ot.kind, to: o.role });
      return OK;
    }
    case 'build': {
      if (p.zone !== 'dorm') return ERR('notHere');
      const B = CFG.BUILD[cmd.id];
      if (!B || s.base[cmd.id]) return ERR('already');
      const pool = [...bagOf(s, r), ...dormStock(s)];
      for (const [k, n] of Object.entries(B.need)) if (pool.filter((i) => i.kind === k).length < n) return ERR('needItems');
      startTask(s, r, 'build', B.dur, { id: cmd.id });
      emit(s, 'buildStart', r, p.zone, { id: cmd.id });
      return OK;
    }
    case 'offer': {
      if (o.zone !== p.zone || o.dead) return ERR('notHere');
      if (!['meal', 'care', 'lean'].includes(cmd.kind)) return ERR('bad');
      if (cmd.kind === 'care' && !hasKind(s, r, 'bandage')) return ERR('needBandage');
      if (cmd.kind === 'meal' && ![...bagOf(s, r), ...(p.zone === 'dorm' ? dormStock(s) : [])].some((i) => i.kind === 'food')) return ERR('needFood');
      const style = cmd.kind === 'meal' && cmd.style === 'split' ? 'split' : cmd.kind === 'meal' ? 'push' : null;
      s.offer = { from: r, to: o.role, kind: cmd.kind, style, t: s.t };
      emit(s, 'offer', r, p.zone, { kind: cmd.kind, style, to: o.role });
      return OK;
    }
    case 'replay': {
      const rec = recFor(s, r);
      if (!rec) return ERR('noRecord');
      rec.plays++; p.replays = (p.replays || 0) + 1;
      p.replayed = p.replayed || {}; p.replayed[rec.from] = (p.replayed[rec.from] || 0) + 1;
      emit(s, 'replay', r, p.zone, { n: rec.plays });
      for (const l of rec.lines) log(s, r, 'radio', 'replayLine', { who: l.who, text: l.text, n: rec.plays });
      return OK;
    }
    case 'crowdChoice':
      if (!p.crowdAsk) return ERR('noChoice');
      crowdResolve(s, r, cmd.how === 'veer' ? 'veer' : 'run');
      return OK;
    case 'sceneChoice': {
      const sc = s.scene;
      if (!sc || !sc.choice || sc.choice.role !== r) return ERR('noScene');
      const opt = sc.choice.opts.find((o2) => o2[0] === cmd.id);
      if (!opt) return ERR('bad');
      for (const q of ROLES) log(s, q, 'see', 'scPick', { sc: sc.id, opt: opt[0], who: r });
      enterBeat(s, opt[1]);
      return OK;
    }
    case 'offerReply':
      if (!s.offer || s.offer.to !== r) return ERR('noOffer');
      resolveOffer(s, !!cmd.yes, cmd.how);
      return OK;
    case 'answerSos':
      if (!s.sos || s.t > s.sos.until) return ERR('noSos');
      if (p.zone !== 'dorm' && !hasKind(s, r, 'radio')) return ERR('notHere');
      startTask(s, r, 'answerSos', CFG.DUR.answerSos);
      return OK;
    case 'scout':
      if (p.zone !== 'roof' && p.zone !== 'checkpoint') return ERR('notHere');
      if (!isDay(s.t)) return ERR('tooDark');
      startTask(s, r, 'scout', CFG.DUR.scout);
      return OK;
    case 'board':
      if (!s.busHere) return ERR('noBus');
      if (p.zone !== 'checkpoint') return ERR('notHere');
      if (!hasKind(s, r, 'pass')) return ERR('noPass');
      startTask(s, r, 'board', CFG.DUR.board);
      return OK;
    case 'listen':
      if (!s.bcast) return ERR('noBroadcast');
      if (p.zone !== 'dorm' && !hasKind(s, r, 'radio')) return ERR('notHere');
      if (p.listened) return ERR('already');
      startTask(s, r, 'listen', CFG.LISTEN);
      emit(s, 'listen', r, p.zone, {});
      return OK;
    case 'pipe':
      if (p.zone !== 'eaves') return ERR('notHere');
      if (p.pipe) return ERR('already');
      startTask(s, r, 'pipe', CFG.DUR.pipe);
      emit(s, 'pipeStart', r, p.zone, {});
      return OK;
    case 'shout':
      addNoise(s, p.zone, 1.5);
      emit(s, 'shout', r, p.zone, { to: o.role });
      return OK;
    case 'skip': {
      if (!skipOk(s)) { p.skipVote = false; return ERR('notSafe'); }
      p.skipVote = !p.skipVote;
      if (p.skipVote && o.skipVote) fastForward(s, now);
      return OK;
    }
    case 'rest':
      startTask(s, r, 'rest', Infinity);
      p.asleep = p.zone === 'dorm';
      emit(s, 'rest', r, p.zone, {});
      return OK;
    case 'watch':
      if (p.zone !== 'dorm') return ERR('notHere');
      startTask(s, r, 'watch', Infinity);
      emit(s, 'watch', r, p.zone, {});
      return OK;
    case 'sleeve': case 'showWound':
      if (!p.bite) return ERR('noWound');
      startTask(s, r, cmd.type, CFG.DUR[cmd.type]);
      return OK;
    case 'knock': {
      const zz = ZONES[p.zone];
      if (!zz.glass && p.zone !== 'roof' && p.zone !== 'dorm') return ERR('nothingToKnock');
      addNoise(s, p.zone, 0.5);
      emit(s, 'knock', r, p.zone, {});
      return OK;
    }
    case 'support':
      if (p.supporting) { s.players[p.supporting].supportedBy = null; p.supporting = null; return OK; }
      if (o.zone !== p.zone) return ERR('notHere');
      if (selfMobile(o)) return ERR('notNeeded');
      if (!selfMobile(p)) return ERR('immobile');
      p.supporting = o.role; o.supportedBy = r;
      emit(s, 'support', r, p.zone, { to: o.role });
      return OK;
    case 'block': {
      const ot = o.task;
      if (!ot || !ot.interruptible || ot.contested || ot.blockedBy) return ERR('cantBlock');
      const doorPair = [p.zone, o.zone].sort().join('-') === 'dorm-roof' && (ot.kind === 'lock' || ot.kind === 'unlock');
      if (o.zone !== p.zone && !doorPair) return ERR('outOfReach');
      cancelTask(s, r);
      ot.blockedBy = r; p.blocking = o.role;
      s.flags = s.flags || {};
      if (ot.kind === 'sign' && !s.flags.signBlocked) s.flags.signBlocked = { by: r, on: o.role, t: Math.round(s.t), day: dayOf(s.t) };
      emit(s, 'block', r, p.zone, { kind: ot.kind, to: o.role });
      return OK;
    }
    case 'release':
      if (!p.blocking) return ERR('notBlocking');
      releaseBlock(s, r); emit(s, 'release', r, p.zone, {});
      return OK;
    case 'yield': {
      if (!p.task || !p.task.blockedBy) return ERR('notBlocked');
      const kind = p.task.kind;
      s.players[p.task.blockedBy].blocking = null;
      p.task = null;
      if (kind === 'sign' && s.flags.signBlocked && !s.flags.signOutcome) s.flags.signOutcome = 'yield';
      emit(s, 'yield', r, p.zone, { kind });
      return OK;
    }
    case 'pull': {
      if (!p.task || !p.task.blockedBy) return ERR('notBlocked');
      const b = s.players[p.task.blockedBy];
      const win = rng(s) < Math.min(0.8, Math.max(0.2, 0.5 + (p.stamina - b.stamina) / 200));
      spend(p, CFG.COST.contest); spend(b, CFG.COST.contest);
      b.blocking = null;
      const kind = p.task.kind;
      if (kind === 'sign' && s.flags.signBlocked && !s.flags.signOutcome) s.flags.signOutcome = win ? 'pulled' : 'stopped';
      if (win) { p.task.blockedBy = null; p.task.contested = true; emit(s, 'pullWin', r, p.zone, { kind, to: b.role }); }
      else { p.task = null; emit(s, 'pullLose', r, p.zone, { kind, to: b.role }); }
      return OK;
    }
    case 'tugRelease': case 'tugGive': {
      if (!inTug) return ERR('notTugging');
      endTug(s, other(r), cmd.type === 'tugGive' ? 'give' : 'release', r);
      return OK;
    }
    case 'tugKeep': {
      if (!inTug) return ERR('notTugging');
      s.tug[r] = 'keep';
      if (s.tug[other(r)] === 'keep') {
        const a = s.players.ren, b = s.players.akechi;
        spend(a, CFG.COST.contest); spend(b, CFG.COST.contest);
        const renWins = rng(s) < Math.min(0.8, Math.max(0.2, 0.5 + (a.stamina - b.stamina) / 200));
        endTug(s, renWins ? 'ren' : 'akechi', 'contest', null);
      }
      return OK;
    }
    // 대응: 달려듦
    case 'push': case 'fight':
      if (!z) return ERR('noZombie');
      if (!selfMobile(p)) return ERR('immobile');
      if (isHeavy(s, r)) return ERR('handsFull');
      startTask(s, r, cmd.type, CFG.DUR[cmd.type]);
      p.stance = null; p.autoGuard = false;
      if (cmd.type === 'fight') emit(s, 'fight', r, p.zone, {});
      return OK;
    case 'cover':
      if (!z) return ERR('noZombie');
      if (o.zone !== p.zone) return ERR('notHere');
      if (!selfMobile(p)) return ERR('immobile');
      if (p.task && p.task.kind !== 'tug') { p.task.paused = true; p.autoGuard = true; }
      p.stance = 'cover';
      emit(s, 'cover', r, p.zone, { to: o.role });
      return OK;
    case 'persist':
      if (!p.task) return ERR('noTask');
      p.task.paused = false; p.autoGuard = false; p.stance = 'persist';
      return OK;
    case 'guard':
      if (p.task && p.task.kind !== 'tug') { p.task.paused = true; p.autoGuard = true; }
      p.stance = null;
      return OK;
    // 말
    case 'say': {
      const text = String(cmd.text || '').slice(0, 140).trim();
      if (!text) return ERR('empty');
      const ch = chatChannel(s, r);
      if (ch === 'none') return ERR('noChannel');
      const face = cmd.face ? String(cmd.face).slice(0, 8) : null; // 스탠딩 표정(@웃음 같은 것)
      p.typing = 0;
      if (ch === 'same') {
        log(s, r, 'chat', 'say', { who: r, text, face });
        if (o.asleep) wake(s, o.role);
        log(s, o.role, 'chat', 'say', { who: r, text, face });
      } else if (ch === 'radio') {
        log(s, r, 'radio', 'sayRadio', { who: r, text, face });
        log(s, o.role, 'radio', 'sayRadio', { who: r, text, face });
        const link = radioLink(s);
        if (link && r === link.holder) {
          const rec = s.dormRec;
          if (!rec || s.t - rec.last > 15) s.dormRec = { lines: [], last: s.t, plays: 0, from: r };
          s.dormRec.lines.push({ who: r, text }); s.dormRec.lines = s.dormRec.lines.slice(-8); s.dormRec.last = s.t; s.dormRec.plays = 0;
        }
        if (link && r !== link.holder) {
          const rd2 = bagOf(s, link.holder).find((i) => i.kind === 'radio');
          if (rd2) {
            rd2.data = rd2.data || { charge: 100 };
            const rec = rd2.data.rec;
            if (!rec || s.t - rec.last > 15) rd2.data.rec = { lines: [], last: s.t, plays: 0, from: r };
            rd2.data.rec.lines.push({ who: r, text }); rd2.data.rec.lines = rd2.data.rec.lines.slice(-8); rd2.data.rec.last = s.t; rd2.data.rec.plays = 0;
          }
        }
        if (link) { addNoise(s, s.players[link.holder].zone, 0.7); const rd = bagOf(s, link.holder).find((i) => i.kind === 'radio'); if (rd) { rd.data = rd.data || { charge: 100 }; rd.data.charge = Math.max(0, (rd.data.charge ?? 100) - CFG.RADIO_SAY); if (rd.data.charge <= 0) log(s, link.holder, 'self', 'radioDead.self', {}); } }
      } else if (ch === 'glass') {
        log(s, r, 'chat', 'sayGlass.self', { who: r, text });
        if (!o.asleep) log(s, o.role, 'see', 'sayGlass.glass', { who: r });
      }
      return OK;
    }
    case 'signal': {
      const which = ['wait', 'coming', 'goahead', 'help'].includes(cmd.which) ? cmd.which : 'wait';
      const ch = chatChannel(s, r);
      if (ch === 'none') return ERR('noChannel');
      p.typing = 0;
      const key = ch === 'glass' ? 'signalGlass' : ch === 'radio' ? 'signalRadio' : 'signal';
      log(s, r, ch === 'radio' ? 'radio' : 'chat', key, { who: r, which });
      if (!o.asleep || ch === 'same') { if (o.asleep) wake(s, o.role); log(s, o.role, ch === 'radio' ? 'radio' : ch === 'glass' ? 'see' : 'chat', key, { who: r, which }); }
      return OK;
    }
    case 'typing':
      p.typing = cmd.on ? s.t : 0;
      return OK;
    case 'emote': {
      // 별표로 쓴 행동 묘사 — 보이는 사람에게만 서술로 남는다
      const text = String(cmd.text || '').replace(/\*/g, '').slice(0, 80).trim();
      if (!text) return ERR('empty');
      p.typing = 0;
      emit(s, 'emote', r, p.zone, { text });
      return OK;
    }
    case 'note': {
      const text = String(cmd.text || '').slice(0, 120).trim();
      if (!text) return ERR('empty');
      startTask(s, r, 'note', CFG.DUR.note, { text });
      return OK;
    }
    default:
      return ERR('unknown');
  }
}

function endTug(s, winner, how, by) {
  const it = s.items[s.tug.item];
  for (const q of ROLES) s.players[q].task = null;
  s.tug = null;
  if (it) it.loc = { bag: winner };
  emit(s, 'tugEnd', winner, s.players[winner].zone, { item: it ? it.kind : '', how, by, to: winner });
}

export function chatChannel(s, r) {
  const p = s.players[r], o = s.players[other(r)];
  if (p.zone === o.zone) return 'same';
  if (radioLink(s)) return 'radio';
  if (relation(s, p.zone, o.zone) === 'glass') return 'glass';
  return 'none';
}

function devCmd(s, cmd, now) {
  if (!s.dev) return ERR('noDev');
  advance(s, now);
  switch (cmd.op) {
    case 'speed': s.speed = Math.max(0.25, Math.min(20, +cmd.v || 1)); break;
    case 'pause': s.paused = !s.paused; s.pauseReason = s.paused ? 'dev' : null; s.lastReal = now; break;
    case 'jump': { const target = +cmd.t; while (s.t < target && s.phase === 'play') step(s, Math.min(CFG.STEP, target - s.t)); break; }
    case 'biteMode': s.biteMode = cmd.v; break;
    case 'spawn': spawnZombie(s, cmd.zone || 'eaves'); break;
    case 'end': endRun(s, 'dev'); break;
  }
  return OK;
}

// 프롤로그: 각자 읽고 '손에 든 것 하나'를 고른 뒤 둘 다 준비되면 시계가 움직인다
export const START_PICKS = ['light', 'bandage', 'food'];
function prologueCmd(s, r, cmd, now) {
  const p = s.players[r];
  if (cmd.type !== 'ready') return ERR('prologue');
  if (p.ready) return ERR('already');
  const pick = START_PICKS.includes(cmd.pick) ? cmd.pick : 'light';
  addItem(s, pick, { bag: r });
  p.ready = true;
  p.firstLine = String(cmd.line || '').slice(0, 80).trim();
  if (ROLES.every((q) => s.players[q].ready)) {
    s.phase = 'play'; s.t = 0; s.lastReal = now; s.paused = false; s.pauseReason = null;
  }
  return OK;
}

function resultCmd(s, r, cmd, now) {
  if (cmd.type === 'epilogue') { s.epilogue[r] = String(cmd.text || '').slice(0, 80); return OK; }
  if (cmd.type === 'endPick') { const n = s.shared.filter((m) => m.t >= s.lastDiaryT).length; s.endDiary[r] = diaryInput({ pick: cmd.pick, line: '' }, n).pick; return OK; }
  if (cmd.type === 'disclose') { s.disclose[r] = !!cmd.on; return OK; }
  if (cmd.type === 'reveal') { s.reveal = s.reveal || {}; s.reveal[r] = cmd.open ? 'open' : 'closed'; s.disclose[r] = !!cmd.open; return OK; }
  void now;
  return ERR('resultPhase');
}

// 판이 끝난 뒤 다음 판으로 넘길 일지
export function featTotals(s) {
  const t = { water: 0, food: 0, trips: 0, carry: 0, found: 0 };
  for (const f of s.feats) {
    if (f.key === 'home') { t.water += f.a.water; t.food += f.a.food; t.trips++; }
    if (f.key === 'carryHome') t.carry++;
    if (f.key === 'foundHidden') t.found++;
  }
  return t;
}
// JSON으로 저장했다 불러오면 끝이 없는 일(쉬기·망보기·줄다리기)의 길이가 null이 된다 — 되살린다
export function revive(s) {
  if (!s || !s.players) return s;
  for (const r of ROLES) { const t = s.players[r] && s.players[r].task; if (t && (t.dur == null || t.dur === 'Infinity')) t.dur = Infinity; }
  return s;
}
export function archiveOf(s) {
  const moments = s.shared.filter((m) => m.t >= s.lastDiaryT);
  const pk = (q) => (s.endDiary && s.endDiary[q] != null && s.endDiary[q] >= 0 ? moments[s.endDiary[q]] : null);
  const last = { day: s.end ? s.end.day : dayOf(s.t), feats: s.feats.filter((f) => f.t >= s.lastDiaryT), picks: { ren: pk('ren'), akechi: pk('akechi') }, lines: { ren: s.epilogue.ren || '', akechi: s.epilogue.akechi || '' }, last: true };
  const run = { days: s.end ? s.end.day : dayOf(s.t), left: stockCounts(s), totals: featTotals(s), reason: s.end ? s.end.reason : 'quit', who: s.end ? s.end.who : null, diary: [...s.diary, last] };
  return [...(s.archive || []), run].slice(-5);
}
function endRun(s, reason, who = null) {
  if (s.phase === 'result') return;
  s.phase = 'result';
  s.end = { reason, who, day: dayOf(s.t), t: s.t };
  for (const r of ROLES) { const p = s.players[r]; p.task = null; p.asleep = false; }
  s.tug = null;
}
// ── 장면: 작가가 쓴 짧은 장면. 대사는 text.js의 SCENE_TEXT, 흐름은 여기 ─────────
// 비트(beat): lines = 차례로 흐를 줄(키), choice = { role: 'akechi'|'ren'|'holder'|'other', opts: [[선택지 키, 다음 비트]] }
const SCENES = {
  apron: {
    beats: {
      open: { lines: ['open'], choice: { role: 'akechi', opts: [['fold', 'fold'], ['leave', 'leaveIt']] } },
      fold: {
        // 아케치가 막았다 → 렌이 묻는다 / 렌이 막았다 → 아케치가 되묻는다 / 아무도 안 막았다
        lines: (s) => {
          const B = s.flags.signBlocked;
          if (!B) return ['b1', 'b2'];
          if (B.by === 'ren') return ['r1', 'r2', 'r3', 'r4'];
          return ['a1', 'a2', 'a3', 'a4', s.flags.signOutcome === 'pulled' ? 'a5p' : 'a5'];
        },
        choice: (s) => {
          const B = s.flags.signBlocked;
          if (!B) return { role: 'akechi', opts: [['tie', 'tieB'], ['hand', 'handOnly']] };
          if (B.by === 'ren') return { role: 'ren', opts: [s.players.ren.listened ? ['renTell', 'renTell'] : ['renOwn', 'renOwn'], ['fidget', 'fidget']] };
          return { role: 'akechi', opts: [s.players.akechi.listened ? ['tell', 'tell'] : ['own', 'own'], ['tie', 'tie']] };
        } },
      renTell: { lines: ['rt1', 'tellTail', 'rt2', 'rt3'], set: { broadcastShared: true, renExplained: true } },
      renOwn: { lines: ['ro1', 'ro2'], set: { ownReason: true } },
      fidget: { lines: ['f1', 'f2', 'f3'], set: { renSilent: true, apronTied: true } },
      tell: { lines: ['tell1', 'tellTail', 'tell2'], set: { broadcastShared: true }, choice: { role: 'ren', opts: [['understood', 'understood'], ['quiet', 'quietEnd']] } },
      tie: { lines: ['tie1'], set: { apronTied: true }, choice: { role: 'ren', opts: [['ask', 'ask'], ['letTie', 'letTie']] } },
      tieB: { lines: ['tie1'], set: { apronTied: true }, choice: { role: 'ren', opts: [['thanks', 'thanks'], ['letTie', 'letTie']] } },
      ask: { lines: ['ask1'], set: { asked: true }, choice: (s) => ({ role: 'akechi', opts: [s.players.akechi.listened ? ['tell', 'tell'] : ['own', 'own'], ['silent', 'silent']] }) },
      own: { lines: ['own1', 'own2'], set: { ownReason: true }, choice: { role: 'ren', opts: [['understood', 'understood'], ['quiet', 'quietEnd']] } },
      silent: { lines: ['silent1'], set: { askedNoAnswer: true } },
      letTie: { lines: ['letTie1'] },
      thanks: { lines: ['thanks1', 'thanks2'] },
      understood: { lines: ['und1', 'und2'] },
      quietEnd: { lines: ['quiet1'] },
      leaveIt: { lines: ['leave1'] },
      handOnly: { lines: ['hand1'], set: { apronHanded: true } },
    },
  },
  night2: {
    beats: {
      open: { lines: ['open', 'o1', 'o2'],
        choice: (s) => ({ role: 'akechi', opts: [['alone', 'alone'], ['why', 'why'], ...(s.players.akechi.listened && !s.flags.broadcastShared ? [['confess', 'confess']] : [])] }) },
      alone: { lines: ['al1', 'al2'], choice: { role: 'ren', opts: [['refuse', 'refuse'], ['yourName', 'yourName']] } },
      refuse: { lines: ['rf1', 'rf2', 'rf3'], set: { n2Together: true } },
      yourName: { lines: ['yn1', 'yn2'], set: { n2Deflect: true } },
      why: { lines: ['wy1'], choice: { role: 'ren', opts: [['cafe', 'cafe'], ['you', 'you']] } },
      cafe: { lines: ['cf1', 'cf2'], set: { n2Coffee: true } },
      you: { lines: ['yu1', 'yu2'], set: { n2You: true } },
      confess: { lines: ['cs1', 'tellTail', 'cs2'], set: { broadcastShared: true, n2Confess: true }, choice: { role: 'ren', opts: [['stillGo', 'stillGo'], ['stayTogether', 'stayTogether']] } },
      stillGo: { lines: ['sg1', 'sg2'], set: { n2StillGo: true } },
      stayTogether: { lines: ['st1', 'st2'], set: { n2Stay: true } },
    },
  },
  lastMeal: {
    beats: {
      open: { lines: (s) => [s.scene.data.short ? 'shortOpen' : 'fedOpen'],
        choice: (s) => (s.scene.data.short ? { role: 'chooser', opts: [['yield', 'yield'], ['split', 'split'], ['goOut', 'goOut']] } : { role: 'chooser', opts: [['lockIn', 'lockIn'], ['walk', 'walk']] }) },
      lockIn: { lines: ['l1', 'l2'], meal: 'lockIn' },
      walk: { lines: ['w1', 'w2'], meal: 'walk' },
      yield: { lines: ['y1', 'y2'], meal: 'yield' },
      split: { lines: ['s1', 's2', 's3'], meal: 'split' },
      goOut: { lines: ['g1', 'g2', 'g3'], meal: 'goOut' },
    },
  },
  pen: {
    beats: {
      open: { lines: ['open'], choice: { role: 'holder', opts: [['offer', 'offer'], ['keep', 'keep']] } },
      offer: { lines: (s) => [s.flags.signBlocked ? 'offerA' : 'offerB'], set: { penOffered: true }, choice: { role: 'other', opts: [['write', 'write'], ['refuse', 'refuse']] } },
      write: { lines: (s) => [s.flags.signBlocked ? 'writeA' : 'writeB', 'write2'], set: { penWritten: true }, act: 'signOther' },
      refuse: { lines: ['refuse1'], set: { penRefused: true } },
      keep: { lines: ['keep1'] },
    },
  },
};
function sceneLog(s, sc, key, data) {
  const who = sceneWho(s, sc, key, data);
  for (const r of ROLES) if (!s.players[r].dead) log(s, r, who ? 'chat' : 'see', 'sc', { sc, b: key, who, holder: data.holder || null, other: data.other || null });
}
function sceneWho(s, sc, key, data) { return SCENE_SPEAKER[sc] && SCENE_SPEAKER[sc][key] ? resolveRole(SCENE_SPEAKER[sc][key], data) : null; }
const resolveRole = (x, data) => (data && typeof data[x] === 'string' && (data[x] === 'ren' || data[x] === 'akechi') ? data[x] : x);
// 각 줄을 누가 말하는지(없으면 서술)
const SCENE_SPEAKER = {
  apron: { r1: 'akechi', r2: 'ren', r4: 'akechi', rt1: 'ren', rt2: 'ren', rt3: 'akechi', ro1: 'ren', ro2: 'akechi', f3: 'akechi', a5p: 'akechi', own1: 'akechi', own2: 'akechi', a1: 'akechi', a2: 'ren', a4: 'ren', a5: 'akechi', b1: 'akechi', b2: 'ren', tell2: 'akechi', ask1: 'ren', thanks1: 'ren', thanks2: 'akechi', und1: 'ren', und2: 'akechi' },
  night2: { o1: 'akechi', o2: 'ren', al1: 'akechi', al2: 'akechi', rf1: 'ren', rf2: 'akechi', rf3: 'ren', yn1: 'ren', yn2: 'akechi', wy1: 'akechi', cf1: 'ren', cf2: 'akechi', yu1: 'ren', cs2: 'akechi', sg1: 'ren', sg2: 'akechi', st1: 'ren', st2: 'akechi' },
  lastMeal: { l1: 'chooser', l2: 'partner', w1: 'chooser', w2: 'partner', y1: 'chooser', y2: 'partner', s2: 'partner', s3: 'chooser', g1: 'chooser', g2: 'partner' },
  pen: { offerA: 'holder', offerB: 'holder', writeA: 'other', writeB: 'other', refuse1: 'other' },
};
function enterBeat(s, beatId) {
  const sc = s.scene, def = SCENES[sc.id].beats[beatId];
  sc.beat = beatId;
  const lines = typeof def.lines === 'function' ? def.lines(s) : def.lines || [];
  for (const k of lines) sceneLog(s, sc.id, k, sc.data);
  if (def.set) Object.assign(s.flags, def.set);
  if (def.meal) s.flags.lastMeal = { o: def.meal, who: sc.data.chooser };
  if (def.act === 'signOther') { const q = s.players[sc.data.other]; if (!q.signed) { q.signed = true; addItem(s, 'pass', { bag: q.role }, { data: { name: q.role } }); const got = emit(s, 'signDone', q.role, q.zone, {}); for (const w of ROLES) if (got[w] === 'same') s.players[w].knownPass[q.role] = true; } }
  const ch = typeof def.choice === 'function' ? def.choice(s) : def.choice;
  if (ch) { sc.choice = { role: resolveRole(ch.role, sc.data), opts: ch.opts }; sc.t = s.t; }
  else { sc.choice = null; s.flags[sc.id + 'Done'] = true; s.shared.push({ t: s.t, type: 'scene', a: { sc: sc.id, end: beatId } }); s.scene = null; if (sc.id === 'lastMeal') endRun(s, 'stay'); }
}
function startLastMeal(s, rep) {
  const [R, A] = [s.players.ren, s.players.akechi];
  const short = ROLES.filter((q) => !s.players[q].dead && rep[q] && (!rep[q].water || !rep[q].food));
  if (R.dead || A.dead) { endRun(s, 'stay'); return; }
  if (R.zone !== A.zone) { s.flags.lastMeal = { o: 'apart' }; endRun(s, 'stay'); return; }
  const chooser = short.length === 1 ? short[0] : 'akechi';
  startScene(s, 'lastMeal', { zone: R.zone, short: short.length > 0, chooser, partner: other(chooser) });
}
function startScene(s, id, data = {}) {
  s.scene = { id, beat: null, choice: null, data, t: s.t };
  enterBeat(s, 'open');
}
function sceneTick(s) {
  if (!s.flags) s.flags = {};
  const [R, A] = [s.players.ren, s.players.akechi];
  // 첫날 밤: 렌이 숙직실에 있으면 젖은 앞치마를 걸어 둔다
  if (!s.flags.apronHung && s.t >= 60 && s.t < tAt(2, 6) && R.zone === 'dorm' && !R.dead) {
    s.flags.apronHung = true;
    for (const r of ROLES) if (s.players[r].zone === 'dorm' && !s.players[r].asleep) log(s, r, 'see', 'apronHang', {});
  }
  const safe = (z) => !zombieIn(s, z) && !s.tug && ROLES.every((r) => s.players[r].zone === z && !s.players[r].dead && !s.players[r].asleep && !s.players[r].boarded);
  const together = (z) => !zombieIn(s, z) && !s.tug && ROLES.every((r) => s.players[r].zone === z && !s.players[r].dead && !s.players[r].boarded && !s.players[r].down);
  const rouse = (key) => { for (const r of ROLES) if (s.players[r].asleep) { wake(s, r); log(s, r, 'self', key, {}); } };
  if (s.scene) {
    const sc = s.scene;
    // 둘이 흩어지거나 위험해지면 장면은 조용히 끝난다
    const z = sc.id === 'pen' ? 'checkpoint' : sc.id === 'lastMeal' ? sc.data.zone : 'dorm';
    if (!safe(z) || s.t - sc.t > 30) { s.flags[sc.id + 'Done'] = true; s.scene = null; if (sc.id === 'lastMeal') { if (!s.flags.lastMeal) s.flags.lastMeal = { o: 'interrupted' }; endRun(s, 'stay'); } }
    return;
  }
  if (s.phase !== 'play') return;
  const h = clockOf(s.t) / 60, day = dayOf(s.t);
  const apronOk = !s.flags.apronDone && s.flags.apronHung && day >= 2 && h >= 6 && h < 17;
  const night2Ok = !s.flags.night2Done && s.t >= tAt(2, 21) && s.t < tAt(3, 4);
  if (apronOk && h < 7 && together('dorm')) { rouse('wakeApron.self'); startScene(s, 'apron'); }
  else if (apronOk && safe('dorm')) startScene(s, 'apron');
  else if (night2Ok && s.t >= tAt(2, 22) && together('dorm')) { rouse('wakeNight2.self'); startScene(s, 'night2'); }
  else if (night2Ok && safe('dorm')) startScene(s, 'night2');
  else if (!s.flags.penDone && day >= 2 && s.checkpointOpen && s.regOpen && safe('checkpoint') && !(R.signed && A.signed)) {
    const holder = R.signed && !A.signed ? 'ren' : A.signed && !R.signed ? 'akechi' : s.flags.signBlocked ? s.flags.signBlocked.by : 'ren';
    s.flags.penHolder = holder;
    startScene(s, 'pen', { holder, other: other(holder) });
  }
}

// ── 밤 사건 ─────────────────────────────────────────────
function nightEvent(s) {
  const inDorm = ROLES.filter((r) => s.players[r].zone === 'dorm' && !s.players[r].dead);
  if (!inDorm.length) return;
  const awake = inDorm.filter((r) => !s.players[r].asleep);
  const asleep = inDorm.filter((r) => s.players[r].asleep);
  const pool = ['scratch', 'sos', 'stranger', 'quiet', 'quiet'];
  if (asleep.length && awake.length) pool.push('sleeptalk', 'sleeptalk');
  const kind = pickOne(s, pool);
  const hearAll = (key, a = {}, k = 'hear') => { for (const r of inDorm) { if (s.players[r].asleep && k !== 'radio') continue; log(s, r, k, key, a); } };
  if (kind === 'scratch') {
    if (s.base.boards) { hearAll('nScratchBoards'); return; }
    spawnZombie(s, 'eaves');
    for (const r of inDorm) { wake(s, r); log(s, r, 'hear', 'nScratch', {}); }
  } else if (kind === 'sos') {
    s.sos = { until: s.t + 15 };
    for (const r of ROLES) if (s.players[r].zone === 'dorm' || hasKind(s, r, 'radio')) log(s, r, 'radio', 'nSos', {});
  } else if (kind === 'stranger') {
    if (s.base.boards) { hearAll('nStrangerBoards'); return; }
    s.stranger = { until: s.t + 12 };
    s.sched.push({ t: s.t + 12, kind: 'strangerEnd', data: {}, done: false });
    for (const r of ROLES) if (s.players[r].zone === 'dorm' || s.players[r].zone === 'eaves') { if (s.players[r].asleep) wake(s, r); log(s, r, 'hear', 'nStranger', {}); }
  } else if (kind === 'sleeptalk') {
    for (const r of awake) log(s, r, 'hear', 'nSleeptalk', { who: asleep[0] });
  } else {
    const q = Math.floor(rng(s) * CFG.QUESTIONS);
    for (const r of awake) log(s, r, 'self', 'nQuiet', { q });
  }
}
// ── 권하기: 받을지는 상대가 정한다 ─────────────────────────────
// 다시 들을 녹음: 들고 있는 무전기가 먼저, 없으면 숙직실 수신기
function recFor(s, r) {
  const p = s.players[r];
  const rd = bagOf(s, r).find((i) => i.kind === 'radio' && i.data && i.data.rec && i.data.rec.lines.length && i.data.rec.from !== r);
  if (rd) return rd.data.rec;
  if (p.zone === 'dorm' && s.dormRec && s.dormRec.lines.length && s.dormRec.from !== r) return s.dormRec;
  return null;
}
function resolveOffer(s, yes, how) {
  const of = s.offer; s.offer = null;
  if (!of) return;
  const a = s.players[of.from], b = s.players[of.to];
  if (a.zone !== b.zone || a.dead || b.dead) return;
  if (!yes) { emit(s, 'offerNo', of.to, b.zone, { kind: of.kind, to: of.from }); return; }
  if (of.kind === 'meal') {
    const pool = [...bagOf(s, of.from), ...(a.zone === 'dorm' ? dormStock(s) : [])];
    const f = pool.find((i) => i.kind === 'food');
    if (!f) { log(s, of.from, 'self', 'offerFail.self', {}); return; }
    delete s.items[f.id];
    const style = of.style || 'push';
    const h = style === 'split' ? (how === 'right' ? 'right' : 'left') : how === 'half' ? 'half' : 'take';
    if (h === 'take') { b.stamina = Math.min(stamCap(b), b.stamina + 20); a.stamina = Math.min(stamCap(a), a.stamina + 4); }
    else for (const p of [a, b]) p.stamina = Math.min(stamCap(p), p.stamina + 12);
    s.flags.meals = [...(s.flags.meals || []), { day: dayOf(s.t), t: Math.round(s.t), from: of.from, to: of.to, style, how: h }].slice(-12);
    emit(s, 'meal', of.from, a.zone, { to: of.to, style, how: h });
  } else if (of.kind === 'care') {
    const band = bagOf(s, of.from).find((i) => i.kind === 'bandage');
    if (!band) { log(s, of.from, 'self', 'offerFail.self', {}); return; }
    delete s.items[band.id];
    b.hp = Math.min(100, b.hp + 30); b.bleed = false; if (b.hp > 0) b.down = false;
    emit(s, 'care', of.from, a.zone, { to: of.to });
    if (b.bite) { b.sleeveDown = false; s.flags['biteSeen_' + of.to] = true; log(s, of.from, 'see', 'careBite.self', { to: of.to }); log(s, of.to, 'self', 'careSeen.self', { who: of.from }); }
  } else if (of.kind === 'lean') {
    for (const [p, q] of [[a, b], [b, a]]) { p.task = { kind: 'rest', dur: Infinity, prog: 0, data: {}, paused: false, blockedBy: null }; p.asleep = p.zone === 'dorm'; p.lean = q.role; }
    emit(s, 'lean', of.from, a.zone, { to: of.to });
  }
}

// 감염 전환: 그 자리에 좀비(이름)가 남고, 살아남은 쪽은 마지막 장면을 겪는다
function turn(s, r) {
  const p = s.players[r];
  if (p.dead) return;
  p.dead = true; p.turned = true; p.cause = 'turned'; p.task = null; p.asleep = false;
  if (p.blocking) releaseBlock(s, r);
  if (p.carryHelp) { s.players[p.carryHelp].carrying = null; p.carryHelp = null; }
  if (p.carrying) { s.players[p.carrying].carryHelp = null; p.carrying = null; }
  emit(s, 'turn', r, p.zone, {});
  const old = zombieIn(s, p.zone);
  if (old) delete s.zombies[old.id];
  spawnZombie(s, p.zone, { of: r, force: true });
  const zz = zombieIn(s, p.zone); if (zz) { zz.st = 'approach'; zz.until = s.t + CFG.APPROACH; }
  s.pendingEnd = { t: s.t + CFG.LAST_SCENE, who: r };
  if (s.phase === 'morning') s.phase = 'play';
}
// 상태 꼬리표
const SEEN_STATUS = new Set(['bleed', 'tremor', 'exhausted', 'frozen', 'heavy', 'down', 'scratch']);
export function statusOf(s, p) {
  const out = [];
  const b = p.bite;
  if (p.down) out.push('down');
  if (p.bleed) out.push('bleed');
  if (p.scratchUntil && s.t < p.scratchUntil) out.push('scratch');
  if (b) out.push('bitten');
  if (b && b.prog && b.stage >= 1 && !b.suppressed) out.push(b.stage >= 2 ? 'tremor' : 'fever');
  if (b && b.suppressed) out.push('suppressed');
  if (p.exhausted) out.push('exhausted');
  if (p.cold >= 60 || (p.frozenOn && p.cold >= 50)) out.push('frozen');
  if (p.thirst) out.push('thirst');
  if (p.hunger) out.push('hunger');
  if (isHeavy(s, p.role)) out.push('heavy');
  return out;
}
function diffStatus(s, r) {
  const p = s.players[r], o = s.players[other(r)];
  const now = statusOf(s, p);
  p.frozenOn = now.includes('frozen');
  const prev = p.statusPrev || [];
  for (const k of now) if (!prev.includes(k)) {
    log(s, r, 'status', 'statusOn', { who: r, st: k });
    if (SEEN_STATUS.has(k) && o.zone === p.zone && !o.asleep && !o.dead) log(s, o.role, 'status', 'statusSeen', { who: r, st: k });
  }
  for (const k of prev) if (!now.includes(k)) log(s, r, 'status', 'statusOff', { who: r, st: k });
  p.statusPrev = now;
}
function kill(s, r, cause) {
  const p = s.players[r];
  if (p.dead) return;
  p.dead = true; p.task = null; p.cause = cause;
  emit(s, 'death', r, p.zone, { cause });
  endRun(s, 'death', r);
}
const jugOf = (s, r) => bagOf(s, r).find((i) => i.kind === 'jug');
export const isHeavy = (s, r) => { const j = jugOf(s, r); return !!(j && j.data.left >= CFG.HEAVY); };
export const bagLoad = (s, r) => bagOf(s, r).reduce((n, i) => n + sizeOf(i), 0);

// ── 아침 점검 ───────────────────────────────────────────────
function dormStock(s) {
  return Object.values(s.items).filter((i) => i.loc.box || i.loc.zone === 'dorm' || i.loc.sill);
}
function stockCounts(s) {
  let water = 0, food = 0;
  for (const i of dormStock(s)) { if (i.kind === 'water') water++; if (i.kind === 'jug') water += i.data.left; if (i.kind === 'food') food++; }
  return { water, food };
}
function consume(s, r, kind) {
  const p = s.players[r];
  const pools = [bagOf(s, r)];
  if (p.zone === 'dorm') pools.push(dormStock(s));
  for (const [i, pool] of pools.entries()) {
    const it = pool.find((x) => x.kind === kind) || (kind === 'water' ? pool.find((x) => x.kind === 'jug' && x.data && x.data.left > 0) : null);
    if (!it) continue;
    if (it.kind === 'jug') it.data.left = Math.max(0, it.data.left - 1);
    else delete s.items[it.id];
    return i === 0 ? 'bag' : 'stock';
  }
  return null;
}
function morning(s) {
  const day = dayOf(s.t);
  const rep = {};
  for (const r of ROLES) {
    const p = s.players[r];
    rep[r] = { water: null, food: null, hp: 0 };
    if (p.dead || p.boarded) continue;
    if (p.asleep) { p.asleep = false; if (p.task && p.task.kind === 'rest') p.task = null; }
    rep[r].water = consume(s, r, 'water');
    rep[r].food = consume(s, r, 'food');
    p.thirst = rep[r].water ? 0 : p.thirst + 1;
    p.hunger = rep[r].food ? 0 : p.hunger + 1;
    const hp0 = p.hp;
    if (p.thirst >= 2) p.hp -= 30;
    if (p.hunger >= 3) p.hp -= 20;
    p.hp = Math.max(0, p.hp);
    if (p.hp <= 0) p.down = true;
    rep[r].hp = p.hp - hp0;
  }
  // 새벽 판정: 억제하지 못한 진행성 감염이 두 번째 악화에 이르렀으면 전환
  for (const r of ROLES) {
    const p = s.players[r];
    if (!p.dead && p.bite && p.bite.prog && !p.bite.suppressed && p.bite.stage >= 2) { turn(s, r); return; }
  }
  // 오늘의 길
  s.routes = { main: rng(s) < 0.5 ? 'crowd' : 'calm', alley: rng(s) < 0.3 ? 'crowd' : 'calm' };
  const moments = s.shared.filter((m) => m.t >= s.lastDiaryT).slice(-6);
  const feats = s.feats.filter((f) => f.t >= s.lastDiaryT);
  s.lastDiaryT = s.t;
  const made = [];
  if (s.base.purifier) { addItem(s, 'water', { box: true }); made.push('water'); }
  for (const i of Object.values(s.items)) if (i.kind === 'radio') {
    i.data = i.data || { charge: 100 };
    i.data.charge = Math.max(0, (i.data.charge ?? 100) - CFG.RADIO_DAY);
    const inDorm = i.loc.box || i.loc.zone === 'dorm' || (i.loc.bag && s.players[i.loc.bag].zone === 'dorm');
    if (s.base.charger && inDorm) { i.data.charge = 100; made.push('charge'); }
  }
  if (s.base.wallmap) { const [a, b] = ROLES.map((q) => s.players[q]); for (const mk of a.marks) addMark(b, mk); for (const mk of b.marks) addMark(a, mk); made.push('wallmap'); }
  s.morning = { day, rep, stock: stockCounts(s), moments, feats, made, diary: { ren: null, akechi: null } };
  for (const r of ROLES) s.players[r].mready = false;
  s.phase = 'morning';
  // 오늘 하루 일정과 다음 아침
  const at = (t, kind, data = {}) => s.sched.push({ t, kind, data, done: false });
  at(tAt(day, 7), 'gateOpen');
  at(tAt(day, 12), 'noon');
  for (const h of [10, 13, 15.5]) at(tAt(day, h), 'routeShift');
  at(tAt(day, 16.5), 'pa', { key: 'paGateWarn' });
  at(tAt(day, 17), 'gateClose');
  at(tAt(day, 18), 'pa', { key: 'paDusk' });
  for (let k = 0; k < 2; k++) at(between(s, [tAt(day, 22.5), tAt(day + 1, 4.5)]), 'nightEvent');
  at(tAt(day + 1, 6), 'morning');
  s.sched = s.sched.filter((e) => !e.done || e.t > s.t - 1);
}
function diaryInput(cmd, n) {
  const pick = Number.isInteger(+cmd.pick) && +cmd.pick >= 0 && +cmd.pick < n ? +cmd.pick : -1;
  return { pick, line: String(cmd.line || '').slice(0, 80).trim() };
}
function morningCmd(s, r, cmd, now) {
  const mo = s.morning;
  if (cmd.type === 'diary') { mo.diary[r] = diaryInput(cmd, mo.moments.length); return OK; }
  if (cmd.type !== 'startDay') return ERR('morning');
  s.players[r].mready = true;
  if (ROLES.every((q) => s.players[q].mready || s.players[q].dead || s.players[q].boarded)) {
    const pk = (q) => (mo.diary[q] && mo.diary[q].pick >= 0 ? mo.moments[mo.diary[q].pick] : null);
    s.diary.push({ day: mo.day - 1, feats: mo.feats || [], picks: { ren: pk('ren'), akechi: pk('akechi') }, lines: { ren: mo.diary.ren ? mo.diary.ren.line : '', akechi: mo.diary.akechi ? mo.diary.akechi.line : '' } });
    s.phase = 'play'; s.lastReal = now; s.paused = false; s.pauseReason = null;
    for (const q of ROLES) log(s, q, 'self', 'dayStart.self', { day: s.morning.day });
    if (s.flags && s.flags.sentBus && !s.flags.lastMeal) startLastMeal(s, mo.rep);
  }
  return OK;
}


// 새벽 판정 미리보기(감염 경로)
export function dawnPath(p) {
  if (!p.bite) return 'normal';
  if (p.bite.suppressed || !p.bite.prog) return 'normal';
  if (p.bite.stage >= 2) return 'turn';
  return 'progressing';
}

// ── 화면에 보낼 정보(각자 관찰 가능한 것만) ───────────────────────
function taskView(t) {
  if (!t) return null;
  return { kind: t.kind, prog: isFinite(t.dur) ? Math.min(1, t.prog / t.dur) : null, left: isFinite(t.dur) ? Math.max(0, t.dur - t.prog) : null,
    paused: t.paused, blockedBy: t.blockedBy, interruptible: t.interruptible, contested: t.contested, to: t.data.to || null, item: t.data.item || null };
}
function itemView(s, i, viewer) {
  const v = { id: i.id, kind: i.kind };
  if (i.kind === 'note' && i.loc.bag === viewer) v.text = i.data.text, v.by = i.data.by;
  if (i.kind === 'result' && i.loc.bag === viewer) v.res = i.data.res, v.owner = i.data.owner;
  if (i.kind === 'pass' && i.data) v.name = i.data.name;
  if (i.kind === 'jug') v.left = i.data.left;
  if (CFG.WEAPONS[i.kind]) v.dur = i.data && i.data.dur != null ? i.data.dur : CFG.WEAPONS[i.kind].dur;
  if (i.kind === 'radio' && i.data && i.data.charge != null) v.charge = i.data.charge;
  return v;
}

export function viewFor(s, r, sinceLog = 0) {
  const p = s.players[r], o = s.players[other(r)];
  const rel = relation(s, p.zone, o.zone);
  const zb = zombieIn(s, p.zone);
  const zone = {
    id: p.zone,
    exits: ZONES[p.zone].exits.map((to) => ({ to, why: passBlockReason(s, p, to), far: isFar(p.zone, to) })),
    floor: itemsAt(s, p.zone).filter((i) => i.found || i.hiddenBy === r).map((i) => ({ ...itemView(s, i, r), hid: !i.found })),
    box: p.zone === 'dorm' ? boxItems(s).map((i) => itemView(s, i, r)) : null,
    sill: ZONES[p.zone].sill && !s.base.boards ? sillItems(s).map((i) => itemView(s, i, r)) : null,
    zombie: zb ? { zo: zb.zo, of: zb.of, hp: zb.hp, maxHp: zb.maxHp || zb.hp, odds: fightWin(s, r, zb), weapon: (weaponOf(s, r, 'fight') || {}).kind || null, pusher: (weaponOf(s, r, 'push') || {}).kind || null, st: zb.st, left: zb.st === 'warn' || zb.st === 'approach' || zb.st === 'stun' ? Math.max(0, zb.until - s.t) : null } : null,
    noise: Math.round(s.noise[p.zone] * 10) / 10,
    door: p.zone === 'dorm' || p.zone === 'roof' ? { locked: s.roofDoor.locked } : null,
    gate: p.zone === 'checkpoint' || p.zone === 'dorm' ? { open: s.checkpointOpen } : null,
    glass: ZONES[p.zone].glass || null,
  };
  const seen = rel === 'same' || (rel === 'glass' && !p.asleep);
  const partner = { role: o.role, rel, lastSeen: p.lastSeen };
  if (seen && !p.asleep) {
    partner.zone = o.zone;
    partner.asleep = o.asleep;
    partner.down = o.restricted || o.exhausted || o.down;
    partner.typing = o.typing && s.t - o.typing < 1.5;
    if (rel === 'same') {
      partner.task = o.task ? { kind: o.task.kind, to: o.task.data ? o.task.data.to || null : null, interruptible: o.task.interruptible && !o.task.contested && !o.task.blockedBy, blockedByMe: o.task.blockedBy === r, prog: isFinite(o.task.dur) ? Math.min(1, o.task.prog / o.task.dur) : null } : null;
      partner.tired = o.stamina < 35 || (o.bite && o.bite.stage >= 1 && (!o.bite.suppressed || o.bite.penalty));
      partner.blood = !!(o.bite && !o.sleeveDown);
      partner.supportedByMe = o.supportedBy === r;
      partner.stance = o.stance;
      partner.heavy = isHeavy(s, o.role);
      partner.status = statusOf(s, o).filter((k) => SEEN_STATUS.has(k));
      partner.turned = !!o.turned;
      partner.carriedByMe = o.carryHelp === r;
      partner.helpable = !!(o.task && HELPABLE.has(o.task.kind));
      partner.takeable = !!(o.task && TAKEOVER.has(o.task.kind));
    }
  } else if (rel === 'door' || rel === 'near') {
    // 문 너머 상대가 걸쇠를 만지는 중이면 밀 수 있다
    if (o.task && (o.task.kind === 'lock' || o.task.kind === 'unlock') && rel === 'door') {
      partner.doorTask = { kind: o.task.kind, interruptible: o.task.interruptible && !o.task.contested && !o.task.blockedBy };
    }
  }
  const bite = p.bite ? {
    t: p.bite.t, known: p.bite.known, prog: p.bite.known ? p.bite.prog : null, suppressed: p.bite.suppressed,
    stage: p.bite.stage, next: p.bite.known && p.bite.prog && !p.bite.suppressed ? (p.bite.stage < 1 ? p.bite.symptomAt : p.bite.stage < 2 ? p.bite.restrictAt : null) : null,
  } : null;
  const me = {
    role: r, zone: p.zone, hp: Math.round(p.hp), stamina: Math.round(p.stamina), cold: Math.round(p.cold),
    passed: p.passed, signed: p.signed, task: taskView(p.task), stance: p.stance, autoGuard: p.autoGuard,
    bite, sleeveDown: p.sleeveDown, restricted: p.restricted, exhausted: p.exhausted, down: p.down,
    blocking: p.blocking, supporting: p.supporting, supportedBy: p.supportedBy, asleep: p.asleep,
    bag: bagOf(s, r).map((i) => itemView(s, i, r)), mobile: selfMobile(p), multi: mult(p),
    searched: p.searches[p.zone] || 0, listened: p.listened, pipe: p.pipe, skipVote: p.skipVote,
    status: statusOf(s, p), turned: !!p.turned, lastScene: s.pendingEnd ? { who: s.pendingEnd.who, left: Math.max(0, s.pendingEnd.t - s.t) } : null,
    load: bagLoad(s, r), thirst: p.thirst, hunger: p.hunger, cap: stamCap(p), boarded: p.boarded, dead: p.dead,
    scouted: p.scouted && p.scouted.day === dayOf(s.t) ? p.scouted : null,
    marks: p.marks, heavy: isHeavy(s, r), carrying: p.carrying, carryHelp: p.carryHelp,
    lastStock: p.zone === 'dorm' ? { ...stockCounts(s), t: s.t } : p.lastStock, knowsPartnerPass: !!p.knownPass[o.role],
  };
  const tug = s.tug && s.tug[r] ? { item: s.items[s.tug.item] ? s.items[s.tug.item].kind : '', mine: s.tug[r], theirs: s.tug[other(r)] } : null;
  const v = {
    role: r, t: s.t, phase: s.phase, paused: s.paused, pauseReason: s.pauseReason, speed: s.speed, dev: s.dev, biteMode: s.dev ? s.biteMode : undefined,
    me, zone, partner, tug,
    channel: chatChannel(s, r), radio: !!radioLink(s),
    closeAt: s.heard[r].closeAt || null, checkpointOpen: s.checkpointOpen, regOpen: s.regOpen,
    bcast: s.bcast && (p.zone === 'dorm' || !!hasKind(s, r, 'radio')), bcastAt: CFG.BCAST_EARLY,
    skip: skipOk(s) ? { to: skipTarget(s), partnerVote: o.skipVote } : null,
    log: s.logs[r].filter((e) => e.id > sinceLog),
    cfg: { night: CFG.NIGHT_END, lights: CFG.LIGHTS_OUT, start: CFG.START_HOUR, cap: CFG.CAP, routeDur: CFG.ROUTE_DUR, jugCap: CFG.JUG_CAP, heavy: CFG.HEAVY },
    day: dayOf(s.t), isDay: isDay(s.t), busHere: s.busHere, busAt: tAt(3, 5),
    stock: p.zone === 'dorm' ? stockCounts(s) : null,
    gateHours: s.t >= CFG.CHECKPOINT_CLOSE,
  };
  if (s.phase === 'result') v.result = resultCard(s, r);
  v.base = s.base; v.buildNeed = CFG.BUILD;
  v.scene = s.scene ? { id: s.scene.id, data: s.scene.data, choice: s.scene.choice ? { role: s.scene.choice.role, opts: s.scene.choice.opts.map((o2) => o2[0]) } : null } : null;
  { const rec = recFor(s, r); v.rec = rec ? { n: rec.lines.length, plays: rec.plays, from: rec.from, t: rec.last, dorm: rec === s.dormRec } : null; }
  v.crowdAsk = p.crowdAsk ? { left: Math.max(0, p.crowdAsk.until - s.t), drop: (bagOf(s, r).filter((i) => !['key', 'pass', 'note', 'result'].includes(i.kind)).sort((a, b) => sizeOf(b) - sizeOf(a))[0] || {}).kind || null } : null;
  v.under = { knows: !!p.knowsUnder, open: s.t >= CFG.BROADCASTS[0], dur: CFG.UNDER_DUR };
  v.offer = s.offer && (s.offer.to === r || s.offer.from === r) ? { kind: s.offer.kind, style: s.offer.style || null, mine: s.offer.from === r } : null;
  v.stranger = !!(s.stranger && (p.zone === 'dorm' || p.zone === 'eaves'));
  v.sos = !!(s.sos && s.t <= s.sos.until && (p.zone === 'dorm' || hasKind(s, r, 'radio')));
  { const pool = [...bagOf(s, r), ...(p.zone === 'dorm' ? dormStock(s) : [])]; v.have = {}; for (const i of pool) v.have[i.kind] = (v.have[i.kind] || 0) + 1; }
  v.diary = s.diary; v.archive = s.archive; v.featsToday = s.feats.filter((f) => f.t >= s.lastDiaryT); v.totals = featTotals(s);
  if (s.phase === 'result') { v.endMoments = s.shared.filter((m) => m.t >= s.lastDiaryT).slice(-6); v.endPick = s.endDiary[r]; }
  if (s.phase === 'prologue') v.prologue = { ready: p.ready, partnerReady: o.ready };
  if (s.phase === 'morning' && s.morning) {
    const m = s.morning;
    v.morning = { day: m.day, mine: m.rep[r], stock: p.zone === 'dorm' ? m.stock : null, ready: p.mready, partnerReady: o.mready,
      made: m.made || [],
      moments: m.moments, myDiary: m.diary[r],
      thirst: p.thirst, hunger: p.hunger, hp: Math.round(p.hp), inside: p.zone === 'dorm' };
  }
  if (s.dev) v.devInfo = { dawn: dawnPath(p), keyAt: s.keyAt };
  return v;
}

// 끝까지 숨긴 것 — 결산에서 비밀 시트처럼 편다. 문장은 text.js의 SECRET_TEXT
function secretsOf(s, q) {
  const p = s.players[q], F = s.flags || {}, o = other(q), out = [];
  if (q === 'ren') {
    if (!p.pipe) out.push({ k: 'tapeUnseen', kept: true });
    else {
      const known = F['saw_pipe_ren'] || F['saw_unlockDone_ren'] || F['saw_lockDone_ren'] || F.gave_key_ren;
      out.push({ k: known ? 'keyKnown' : 'keyKept', kept: !known });
    }
  }
  if (q === 'akechi') {
    if (!p.listened) out.push({ k: 'radioUnheard', kept: true });
    else if (F.broadcastShared) out.push({ k: 'bcastTold', kept: false });
    else if (s.players[o].listened) out.push({ k: 'bcastBoth', kept: true });
    else out.push({ k: 'bcastKept', kept: !F['saw_listen_akechi'], seen: !!F['saw_listen_akechi'] });
  }
  if (p.bite) {
    const known = F['biteSeen_' + q] || p.cause === 'turned';
    out.push({ k: known ? 'biteKnown' : 'biteKept', kept: !known, prog: p.bite.known ? (p.bite.prog ? 'prog' : 'non') : 'unknown' });
  }
  if (p.knowsUnder && !s.players[o].knowsUnder) out.push({ k: 'underKept', kept: true, used: !!F['usedUnder_' + q] });
  if (F['bypass_' + q]) out.push({ k: 'underBypass', kept: !F['biteSeen_' + q] });
  if (p.replays) {
    const whom = Object.keys(p.replayed || {})[0] || o;
    out.push({ k: 'replay', kept: true, seen: !!F['saw_replay_' + q], n: p.replays, whom });
  }
  for (const it of Object.values(s.items)) {
    if (it.kind === 'result' && it.data.owner === q) {
      const told = F['saw_diagShared_' + q] || F['gave_result_' + q];
      out.push({ k: told ? 'resultTold' : 'resultKept', kept: !told, res: it.data.res });
    }
    if (it.kind === 'note' && it.loc.bag === q && it.data && it.data.by === q && it.data.text) out.push({ k: 'noteKept', kept: true, text: it.data.text });
    if (it.hiddenBy === q) {
      const z = it.loc.zone || null;
      out.push({ k: it.found ? 'hideFound' : 'hideKept', kept: !it.found, item: it.kind, zone: z });
    }
  }
  return out;
}
function resultCard(s, r) {
  const card = { players: {}, lastGive: s.lastGive, shared: s.shared.length ? s.shared[s.shared.length - 1] : null, epilogue: s.epilogue, end: s.end, feats: s.feats, totals: featTotals(s), left: stockCounts(s), flags: s.flags,
    partnerLog: null, secrets: {} };
  const RV = s.reveal || {}, both = !!(RV.ren && RV.akechi), o = other(r);
  card.reveal = { me: RV[r] || null, partner: !!RV[o], both, partnerOpen: both && !!s.disclose[o] };
  card.secrets[r] = secretsOf(s, r);
  if (both && s.disclose[o]) { card.secrets[o] = secretsOf(s, o); card.partnerLog = s.logs[o].slice(-300); }
  for (const q of ROLES) {
    const p = s.players[q];
    const fate = p.dead ? (p.cause === 'turned' ? 'turned' : 'dead') : p.boarded ? 'boarded' : 'stayed';
    const entry = { zone: p.zone, fate, down: p.restricted || p.exhausted || p.down, signed: p.signed, disclosed: s.disclose[q] };
    if (q === r || ((s.reveal || {}).ren && (s.reveal || {}).akechi && s.disclose[q])) {
      entry.private = { bitten: !!p.bite, prog: p.bite ? p.bite.prog : null, known: p.bite ? p.bite.known : null, suppressed: p.bite ? p.bite.suppressed : null, dawn: dawnPath(p) };
    }
    card.players[q] = entry;
  }
  return card;
}
