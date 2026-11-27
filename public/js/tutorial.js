// 새벽 다섯 시 · 연습 판(튜토리얼)
// 혼자 렌을 맡고, 아케치는 정해진 대로 움직이는 대역이다.
// 설명 카드(info)가 떠 있는 동안 시계가 멈추고, 직접 해 보는 단계에서만 시간이 흐른다.
// 문장은 각 단계의 text만 고치면 된다. target은 깜빡일 화면 요소(CSS 선택자).
import { createGame, applyCommand, advance, viewFor, addItem, spawnZombie, radioLink } from './engine.js';

const bagHas = (s, r, k) => Object.values(s.items).some((i) => i.loc.bag === r && i.kind === k);
const P = (s) => s.players.ren, A = (s) => s.players.akechi;

export const STEPS = [
  { id: 'hello', info: true, title: '연습 판',
    text: '너는 렌, 친구는 아케치를 맡는다. 실제 게임에서는 시간이 계속 흐르지만, 연습에서는 이 카드가 떠 있는 동안 멈춘다.' },
  { id: 'screen', info: true, target: '#me', title: '화면 읽기',
    text: '맨 위 가운데에 구역과 며칠째·시각, 오른쪽 알약이 나 — 막대 셋은 체력·기력·추위, 글자는 지금 가장 신경 쓸 상태. 누르면 자세히 볼 수 있다.' },
  { id: 'feed', info: true, target: '#seg', title: '대화 · 기록 / 주변',
    text: '대화 · 기록에는 주고받은 말과 일어난 일이 한 줄기로 쌓인다. 주변에는 이 구역의 사람·좀비·물건이 카드로 나오고, 카드의 버튼으로 행동한다.' },
  { id: 'search', target: '#seg', title: '탐색',
    text: '[주변] 탭을 열고 맨 위 구역 카드의 [주변 탐색]을 눌러 처마 밑을 뒤져 보자. 막대가 다 차면 끝난다.',
    done: (s) => (P(s).searches.eaves || 0) >= 1 && !(P(s).task && P(s).task.kind === 'search') },
  { id: 'pick', target: '#bBag', title: '줍기',
    text: '배터리를 찾았다. [가방] → ‘이곳 바닥’에서 배터리를 눌러 집자.',
    done: (s) => bagHas(s, 'ren', 'battery') },
  { id: 'bag', info: true, target: '#bBag', title: '가방',
    text: '가방은 5칸. 물건을 눌러 쓰기·건네기·창틀에 두기·숨기기를 고를 수 있다.' },
  { id: 'move', target: '#bMap', title: '이동',
    text: '이동은 지도에서 한다. 아래 [지도]나 장면 왼쪽 위 작은 지도를 눌러, 검문대를 누르자.',
    done: (s) => P(s).zone === 'checkpoint' },
  { id: 'inspect', target: '#seg', title: '검사',
    text: '숙직실에 들어가려면 검사를 받아야 한다. [주변] 탭의 검사원 카드에서 [검사 받기].',
    done: (s) => P(s).passed },
  { id: 'enter', target: '#bMap', title: '들어가기',
    text: '[지도]를 열어 숙직실을 누르자.',
    done: (s) => P(s).zone === 'dorm' && !P(s).task },
  { id: 'glass', info: true, target: '#seg', title: '창 너머',
    text: '아케치는 아직 처마 밑에 있다. 숙직실 창으로 서로 보이지만, 유리 너머로는 말이 들리지 않고 손짓만 닿는다.' },
  { id: 'signal', target: '#chan', title: '손짓',
    text: '입력창 왼쪽의 [창 너머 · 손짓]을 누르고 [기다려]를 골라 보자.',
    done: (s) => s.logs.ren.some((e) => e.key === 'signalGlass' && e.a.who === 'ren') },
  { id: 'sill', target: '#bBag', title: '창틀',
    text: '물건은 창틀로 주고받는다. [가방]에서 배터리를 눌러 [창틀에 두기].',
    done: (s) => Object.values(s.items).some((i) => i.kind === 'battery' && i.loc.sill) || bagHas(s, 'akechi', 'battery') || bagHas(s, 'akechi', 'radio') },
  { id: 'radioWait', title: '무전기',
    text: '아케치가 창틀의 배터리를 가져가 무전기를 고치는 중이다…',
    auto: (s, h) => {
      const a = A(s);
      if (a.task) return;
      const bat = Object.values(s.items).find((i) => i.kind === 'battery' && i.loc.sill);
      if (bat) h.partner({ type: 'pick', item: bat.id });
      else if (bagHas(s, 'akechi', 'battery')) { const r = Object.values(s.items).find((i) => i.loc.bag === 'akechi' && i.kind === 'radio_broken'); if (r) h.partner({ type: 'use', item: r.id }); }
    },
    done: (s) => !!radioLink(s) },
  { id: 'radio', info: true, target: '#sayForm', title: '무전',
    text: '무전기가 살아났다. 이제 떨어져 있어도 숙직실 수신기로 말이 닿는다. 대신 바깥에서 무전으로 말하면 소리가 나서 좀비가 모일 수 있다.' },
  { id: 'say', target: '#sayForm', title: '말하기',
    text: '맨 아래 입력창에 아무 말이나 써서 보내 보자.',
    done: (s) => s.logs.ren.some((e) => e.key === 'sayRadio' && e.a.who === 'ren'),
    after: (s, h) => h.partnerSay('들려. 거기 있어.') },
  { id: 'emote', target: '#sayForm', title: '행동 쓰기',
    text: '별표로 감싸면 대사가 아니라 행동이 된다. *고개를 끄덕인다* 처럼 써서 보내 보자. 상대가 볼 수 있을 때만 상대 화면에 남는다.',
    done: (s) => s.logs.ren.some((e) => e.key === 'emote.self') },
  { id: 'unlock', target: '#seg', title: '옥상 문',
    text: '옥상으로 나가 보자. [주변] 탭의 옥상 문 카드에서 [열기]. 숙직실 안쪽 걸쇠라 열쇠는 필요 없다.',
    done: (s) => !s.roofDoor.locked },
  { id: 'roof', target: '#bMap', title: '옥상으로',
    text: '[지도]에서 옥상을 눌러 올라가자.',
    done: (s) => P(s).zone === 'roof' && !P(s).task },
  { id: 'zombieInfo', info: true, target: '#seg', title: '좀비',
    enter: (s) => spawnZombie(s, 'roof'),
    text: '좀비가 다가온다. 원래 누구였는지가 이름에 붙는다. 달려들기 직전 6초 동안 입력창 위 칸이 까맣게 바뀐다. 가만히 있으면 몸을 낮춰 피한다 — 물리는 건 ‘하던 일 계속’이나 ‘엄호’를 직접 고른 사람뿐이다.' },
  { id: 'zombie', target: '#seg', title: '대응', enter: (s) => { s.speed = 1; },
    text: '[주변] 탭의 좀비 카드에서 [밀어내기]나 [맞서기]를 눌러 보자. 기다려서 경고를 직접 봐도 된다.',
    done: (s) => { const z = Object.values(s.zombies)[0]; return !z || z.st === 'stun'; },
    after: (s) => { s.zombies = {}; s.speed = 2; } },
  { id: 'back', target: '#bMap', title: '돌아가기',
    text: '[지도]에서 숙직실을 눌러 돌아가자.',
    done: (s) => P(s).zone === 'dorm' && !P(s).task },
  { id: 'lock', target: '#seg', title: '잠그기',
    text: '[주변] 탭의 옥상 문 카드에서 [잠그기]. 잠가 두면 밤에 안전하다.',
    done: (s) => s.roofDoor.locked && !(P(s).task && P(s).task.kind === 'lock') },
  { id: 'partnerIn', title: '아케치',
    text: '아케치가 검문을 지나 들어오는 중이다…',
    enter: (s) => { s.speed = 4; },
    auto: (s, h) => {
      const a = A(s);
      if (a.task) return;
      if (a.zone === 'eaves') h.partner({ type: 'move', to: 'checkpoint' });
      else if (a.zone === 'checkpoint' && !a.passed) h.partner({ type: 'inspect' });
      else if (a.zone === 'checkpoint') h.partner({ type: 'move', to: 'dorm' });
    },
    done: (s) => A(s).zone === 'dorm' && !A(s).task,
    after: (s) => { s.speed = 2; } },
  { id: 'together', info: true, target: '#seg', title: '손 보태기',
    text: '같은 곳에 있으면 상대가 하는 일에 끼어들 수 있다. [주변] 탭의 상대 카드에 버튼이 뜬다 — 거들기, 대신 맡기, 함께 들기, 붙잡기. 손대지 않는 것도 선택이다.' },
  { id: 'help', target: '#seg', title: '거들기',
    text: '아케치가 숙직실을 뒤지기 시작했다. [주변] 탭의 아케치 카드에서 [거들기]를 눌러 보자.',
    enter: (s, h) => h.partner({ type: 'search' }),
    auto: (s, h) => { if (!A(s).task) h.partner({ type: 'search' }); },
    done: (s) => !!(P(s).task && P(s).task.kind === 'help'),
    after: (s) => { A(s).task = null; P(s).task = null; } },
  { id: 'hold', target: '#seg', title: '붙잡기',
    text: '아케치가 말없이 나가려 한다. [주변] 탭의 아케치 카드에서 [붙잡기]로 팔을 붙들어 보자.',
    enter: (s, h) => { s.speed = 1; h.partner({ type: 'move', to: 'checkpoint' }); },
    auto: (s, h) => {
      const a = A(s);
      if (a.task) return;
      if (a.zone === 'checkpoint') h.partner({ type: 'move', to: 'dorm' });
      else if (a.zone === 'dorm') h.partner({ type: 'move', to: 'checkpoint' });
    },
    done: (s) => !!(A(s).task && A(s).task.blockedBy === 'ren'),
    after: (s, h) => { h.partner({ type: 'yield' }); h.partnerSay('…알았어. 안 갈게.'); s.speed = 2; } },
  { id: 'holdInfo', info: true, target: '#seg', title: '막힌 쪽',
    text: '막힌 사람은 걸음을 멈추거나 뿌리칠 수 있다. 서명하는 종이, 잠그는 걸쇠도 같은 방식으로 막는다. 이유는 게임이 아니라 둘이 말로 정한다.' },
  { id: 'days', info: true, title: '하루',
    text: '매일 06:00 아침 점검에서 각자 물 1 · 식량 1을 쓴다. 낮에는 급수소와 상점가로 원정을 나간다. 물통은 가득 채우면 무거워 둘이 함께 들어야 빠르다.' },
  { id: 'bus', info: true, title: '이송 차량',
    text: '3일째 05:00 이송 차량이 첫 탈출 기회다. 탈지, 모아 둔 비축을 믿고 차를 보낼지는 둘이 정한다. 한 사람이라도 잃으면 끝나고, 버틴 날을 센다.' },
  { id: 'end', info: true, last: true, title: '연습 끝',
    text: '둘 다 숙직실에 있고 문이 잠겨 있으면 다음 일까지 시간을 넘길 수 있다. 막히면 [주변]의 ‘지금 할 일’을 보자. 쪽지는 [행동]에서 쓴다. 이제 친구와!' },
];

export class TutorialHost {
  constructor() {
    this.tutorial = true; this.local = false;
    this.reset();
  }
  reset() {
    const now = Date.now();
    const s = createGame((Math.random() * 1e9) | 0, now, { phase: 'play' });
    s.sched = s.sched.filter((e) => e.kind === 'intro');
    s.biteMode = 'none';
    s.speed = 2;
    addItem(s, 'light', { bag: 'ren' });
    for (const i of Object.values(s.items)) if (i.kind === 'battery') { i.loc = { zone: 'eaves' }; i.found = false; i.hidden = { ren: 1, akechi: 1 }; }
    this.s = s;
    this.step = 0;
  }
  get cur() { return STEPS[this.step]; }
  partner(cmd) {
    const s = this.s, was = s.paused;
    s.paused = false;
    const r = applyCommand(s, 'akechi', cmd, Date.now());
    s.paused = was;
    return r;
  }
  partnerSay(text) { const s = this.s; s.logs.ren.push({ id: ++s.logSeq, t: s.t, k: 'radio', key: radioLink(s) ? 'sayRadio' : 'say', a: { who: 'akechi', text } }); s.logs.akechi.push({ id: ++s.logSeq, t: s.t, k: 'chat', key: 'say', a: { who: 'akechi', text } }); }
  next() {
    const st = this.cur;
    if (st && st.after) st.after(this.s, this);
    if (this.step < STEPS.length - 1) this.step++;
    const nx = this.cur;
    if (nx.enter) nx.enter(this.s, this);
  }
  tick() {
    const s = this.s, st = this.cur, now = Date.now();
    if (st.info) { if (!s.paused) { advance(s, now); s.paused = true; s.pauseReason = 'tutorial'; } s.lastReal = now; return; }
    if (s.pauseReason === 'tutorial') { s.paused = false; s.pauseReason = null; s.lastReal = now; }
    advance(s, now);
    if (st.auto) st.auto(s, this);
    if (st.done && st.done(s, this)) this.next();
  }
  view(role) { return viewFor(this.s, role, 0); }
  send(role, cmd) {
    if (this.s.pauseReason === 'tutorial') return { ok: false, err: 'tutorialPaused' };
    return applyCommand(this.s, role, cmd, Date.now());
  }
  restart() { this.reset(); }
}
