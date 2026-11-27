import { createGame, applyCommand, advance, viewFor, ITEM_USE, CFG, archiveOf } from './engine.js';
import { SCENE_TEXT, sceneLine, storyLines, secretLine, ENDING_TEXT, endingKey, PROLOGUE, ROUTE_TEXT, MARK_TEXT, FEAT_TEXT, STATUS_TEXT, STATUS_DESC, AVATARS, TACHIE, BUILD_TEXT, QUESTIONS, OFFER_TEXT, zlabel, NAMES, ZONE_TEXT, ITEM_TEXT, TASK_TEXT, SIGNAL_TEXT, PARTNER_TEXT, RESULT_TEXT, RESULT_CARD, fmt, j, iname, zname } from './text.js';
import { draw, icon, background, W, H } from './scene.js';
import { TutorialHost, STEPS } from './tutorial.js';
import * as SFX from './sfx.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bold = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const LOCAL_ONLY = !!window.__LOCAL_ONLY__;
const DIRS = {
  eaves: { roof: 'N', checkpoint: 'S', _glass: 'E' },
  checkpoint: { eaves: 'W', dorm: 'E', market: 'S', pump: 'S' },
  market: { checkpoint: 'N' },
  pump: { checkpoint: 'N' },
  dorm: { roof: 'N', checkpoint: 'S', _glass: 'W' },
  roof: { eaves: 'W', dorm: 'E' },
};
const WHY = { closed: '셔터가 내려감', notPassed: '검사 필요', locked: '잠겨 있음' };
const ERRS = {
  immobile: '지금은 움직일 수 없다.', beingSupported: '부축받는 중이다.', closed: '이미 닫혔다.', notPassed: '먼저 검사를 받아야 한다.',
  locked: '옥상 문이 잠겨 있다.', needKey: '이쪽에서는 열쇠가 있어야 한다.', noChannel: '말이 닿지 않는다. 쪽지를 쓰자.', notHere: '여기서는 할 수 없다.',
  needBoth: '고장 난 무전기와 배터리가 둘 다 있어야 한다.', cantBlock: '막을 수 있는 순간이 지났다.', outOfReach: '손이 닿지 않는다.', paused: '시간이 멈춰 있다.',
  tugging: '먼저 붙잡은 손을 정해야 한다.', bagFull: '가방이 꽉 찼다.', theirBagFull: '상대 가방이 꽉 찼다.', tooDark: '어두워서 멀리 보이지 않는다.', noBus: '차가 없다.', noPass: '이송증이 없다.', out: '이제 할 수 있는 게 없다.', tutorialPaused: '먼저 카드를 읽고 [다음]을 누르자.', noJug: '물통이 없다.', handsFull: '물통이 무거워 손이 비지 않는다.', carrying: '물통을 함께 드는 중이다. 먼저 손을 떼야 한다.', cantHelp: '지금은 거들 수 없다.', needItems: '재료가 모자라다.', needBandage: '붕대가 없다.', needFood: '나눌 식량이 없다.', noOffer: '받을 것이 없다.', noSos: '구조 요청이 끊겼다.', noSill: '창틀을 쓸 수 없다.', regNotOpen: '이송 접수는 22:20부터다.', noBroadcast: '지금은 방송이 없다.', notSafe: '둘 다 숙직실에 있고 옥상 문이 잠겨 있어야 넘길 수 있다.', already: '이미 했다.', noWound: '상처가 없다.', unreachable: '손이 닿지 않는다.',
};

// ── 시간 표시 ──────────────────────────────────────────────
const clock = (t) => { const m = Math.floor(CFG.START_HOUR * 60 + t) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const isChatEntry = (e) => /^(say|signal|sayRadio|signalRadio|sayGlass|signalGlass|emote\.|moan\.)/.test(e.key) || e.key === 'sc' || e.key === 'scPick' || e.key === 'apronHang' || e.key === 'replayLine';
const isChat = (e) => e.k === 'chat' || /^(say|signal)/.test(e.key);
const rv = (sc, k) => (sc && sc[k] ? sc[k].v : null);
const rvt = (sc, k) => (sc && sc[k] ? sc[k].t : null);
const markLabel = (m) => m.tag === 'hid' ? `${iname(m.item)} 숨겨 둠` : m.tag === 'custom' ? m.text : MARK_TEXT[m.tag];
function featText(f) {
  const a = { ...f.a };
  for (const k of ['who', 'to', 'by']) if (typeof a[k] === 'string') a[k] = NAMES[a[k]] || a[k];
  if (Array.isArray(a.who)) { const ns = a.who.map((q) => NAMES[q]); a.who = ns.length > 1 ? `${j(ns[0], '와')} ${j(ns[1], '이')}` : j(ns[0], '이'); }
  if (a.dest) a.dest = zname(a.dest);
  if (a.zone) a.zone = zname(a.zone);
  if (a.item) a.item = iname(a.item);
  const fn = FEAT_TEXT[f.key];
  return fn ? fn(a) : '';
}
// 탈출 결정 대차표: 탄다 / 남는다 — 내가 아는 것만으로
function ledger(v) {
  const m = v.me, P2 = v.partner, pn = NAMES[P2.role];
  const st = m.lastStock;
  const bagW = m.bag.reduce((n, i) => n + (i.kind === 'water' ? 1 : i.kind === 'jug' ? i.left : 0), 0);
  const bagF = m.bag.filter((i) => i.kind === 'food').length;
  const W = (st ? st.water : 0) + bagW, F = (st ? st.food : 0) + bagF;
  const mornings = Math.floor(Math.min(W, F) / 2);
  const ride = [
    `내 이송증: ${has(v, 'pass') ? '있음' : '없음'}`,
    `${pn} 이송증: ${m.knowsPartnerPass ? '있음 (서명하는 걸 봤다)' : '모름'}`,
    `내 재검사: ${m.bite ? '상처가 보인다 — 탈 수 없다' : '통과할 수 있다'}`,
    `${pn} 재검사: 본인만 안다`,
  ];
  const stay = [
    st ? `숙직실 비축 물 ${st.water} · 식량 ${st.food} (${clock(st.t)}에 봄)` : '숙직실 비축: 아직 못 봤다',
    `내 가방 물 ${bagW} · 식량 ${bagF}`,
    mornings > 0 ? `둘이 아침을 ${mornings}번 먹을 수 있다` : '둘이 먹을 다음 아침이 모자란다',
    ...m.marks.filter((x) => x.tag === 'hid').map((x) => `${zname(x.zone)}에 ${iname(x.item)} 숨겨 둠`),
  ];
  const t = v.totals || {};
  const earned = t.trips ? `이번 판에 길어 온 물 ${t.water} · 가져온 식량 ${t.food} · 원정 ${t.trips}번${t.carry ? ` · 함께 든 길 ${t.carry}번` : ''}` : '';
  return { ride, stay, mornings, earned, canRide: has(v, 'pass') && !m.bite };
}
const busWindow = (v) => v.t >= v.busAt - 720 && v.t < v.busAt + 15;
function ledgerHtml(v) {
  const L = ledger(v);
  return `<div class="ledger"><div><div class="lh">탄다</div>${L.ride.map((x) => `<div>· ${esc(x)}</div>`).join('')}</div><div><div class="lh">차를 보내고 남는다</div>${L.stay.map((x) => `<div>· ${esc(x)}</div>`).join('')}</div></div>${L.earned ? `<p class="dim" style="margin:6px 0 0">${esc(L.earned)}</p>` : ''}`;
}
// 무전 잡음: 상대 대사의 글자가 군데군데 끊긴다(항상 같은 자리)
function garble(text, seed, pct = 14) {
  let h = seed * 2654435761 >>> 0;
  return [...String(text)].map((c) => { h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return c !== ' ' && h % 100 < pct ? '·' : c; }).join('');
}
const clockMin = (t) => (CFG.START_HOUR * 60 + t) % 1440;
const dur = (min) => { min = Math.max(0, Math.ceil(min)); return min >= 60 ? `${Math.floor(min / 60)}시간 ${min % 60}분` : `${min}분`; };
const secs = (min) => Math.max(0, Math.ceil(min * CFG.MS_PER_MIN / 1000));

// ── 호스트: 로컬(한 기기 두 화면) ───────────────────────────────
class LocalHost {
  constructor() {
    this.key = 'saebyeok-local-v8';
    let s = null;
    try { s = JSON.parse(localStorage.getItem(this.key) || 'null'); } catch { s = null; }
    this.s = s && s.v === 1 ? s : createGame((Math.random() * 1e9) | 0, Date.now(), { dev: true });
    this.s.lastReal = Date.now();
    // 화면을 벗어나 멈춘 채 저장된 판은 다시 열면 바로 이어 간다
    if (this.s.pauseReason === 'away') { this.s.paused = false; this.s.pauseReason = null; }
    this.local = true;
    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      advance(this.s, now);
      if (document.hidden && !this.s.paused) { this.s.paused = true; this.s.pauseReason = 'away'; }
      else if (!document.hidden && this.s.pauseReason === 'away') { this.s.paused = false; this.s.pauseReason = null; this.s.lastReal = now; }
      this.save();
    });
  }
  tick() {
    // 화면이 다시 보이는데도 'away'로 멈춰 있으면 풀어 준다(이벤트를 놓친 경우 대비)
    if (this.s.pauseReason === 'away' && !document.hidden) { this.s.paused = false; this.s.pauseReason = null; this.s.lastReal = Date.now(); }
    advance(this.s, Date.now()); if (++this.n % 10 === 0) this.save();
  }
  view(role) { return viewFor(this.s, role, 0); }
  send(role, cmd) { const r = applyCommand(this.s, role, cmd, Date.now()); this.save(); return r; }
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.s)); } catch { /* 저장 불가 환경 */ } }
  restart() { this.s = createGame((Math.random() * 1e9) | 0, Date.now(), { dev: true, archive: archiveOf(this.s) }); this.save(); }
}
LocalHost.prototype.n = 0;

// ── 호스트: 온라인 ─────────────────────────────────────────
class RemoteHost {
  constructor(code, role) {
    this.code = code; this.role = role; this.v = null; this.logs = []; this.lastId = 0; this.status = 'connecting';
    this.connect();
  }
  connect() {
    const tk = store.get(`sb:${this.code}:${this.role}`) || '';
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/api/room/${this.code}/ws?role=${this.role}&token=${encodeURIComponent(tk)}`);
    this.ws = ws;
    ws.onmessage = (e) => {
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (m.type === 'hello') { store.set(`sb:${this.code}:${this.role}`, m.token); this.logs = []; this.lastId = 0; this.status = 'ok'; }
      else if (m.type === 'lobby') { this.lobby = m.present; this.v = null; }
      else if (m.type === 'view') {
        for (const e2 of m.v.log) if (e2.id > this.lastId) { this.logs.push(e2); this.lastId = e2.id; }
        m.v.log = this.logs; this.v = m.v; this.lobby = null;
      } else if (m.type === 'err') toast(ERRS[m.err] || '할 수 없다.');
      ui.refresh();
    };
    ws.onclose = (e) => {
      if (e.code === 4000) { this.status = 'replaced'; ui.refresh(); return; }
      this.status = 'reconnecting'; ui.refresh();
      setTimeout(() => this.connect(), 1500);
    };
  }
  tick() {}
  view() { return this.v; }
  send(_role, cmd) { try { this.ws.send(JSON.stringify({ type: 'cmd', cmd })); } catch { /* 재연결 중 */ } return { ok: true }; }
  restart() { try { this.ws.send(JSON.stringify({ type: 'restart' })); } catch { /* */ } }
}

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* */ } },
};

function store0(k) { try { return localStorage.getItem(k); } catch { return null; } }

// 같은 방에서 상대가 막을 수 있는 일을 시작하는 순간(눈앞에서 본 것만)
function witness(v) {
  const P2 = v.partner, pt = P2.task;
  if (v.me.dead || v.me.asleep) return null;
  if (P2.rel === 'same' && P2.zone && pt && pt.interruptible && !pt.blockedByMe) {
    const n = NAMES[P2.role];
    const text = pt.kind === 'move' ? `${j(n, '이')} ${pt.to ? zname(pt.to) + ' 쪽으로' : ''} 발을 돌린다.` : pt.kind === 'sign' ? `${j(n, '이')} 이송 명단에 펜을 댄다.` : `${j(n, '이')} 옥상 문 걸쇠에 손을 뻗는다.`;
    const label = pt.kind === 'move' ? '붙잡기' : pt.kind === 'sign' ? '종이 누르기' : '손 얹기';
    return { text, label, prog: pt.prog || 0 };
  }
  if (P2.doorTask && P2.doorTask.interruptible) return { text: '문 너머에서 걸쇠가 움직인다.', label: '문 밀기', prog: 0 };
  return null;
}
// 맞서기 승산을 말로
const oddsWord = (o) => (o >= 0.75 ? '승산 높음' : o >= 0.5 ? '반반' : '밀릴 수도');
const witnessHtml = (w) => `<span class="wt">${esc(w.text)}<span class="bar sm"><i style="width:${Math.round(w.prog * 100)}%"></i></span></span><button class="btn sm inv" data-cmd="block">${esc(w.label)}</button>`;

// ── 목표와 다음 할 일(안내) ─────────────────────────────────
const has = (v, k) => v.me.bag.some((i) => i.kind === k);
function goalsOf(v, ui) {
  const m = v.me, inside = m.zone === 'dorm';
  if (v.zone.door) ui.door = v.zone.door.locked;
  const doorItem = { t: '옥상 문 잠그기', d: ui.door === null ? '숙직실 안쪽 걸쇠. 잠가 두면 밤에 안전하다' : ui.door ? '잠겨 있다(마지막으로 봤을 때)' : '열려 있다(마지막으로 봤을 때)', done: ui.door === true };
  const radioItem = { t: '무전기 고치기', d: '고장 난 무전기 + 배터리. 떨어져 있어도 숙직실 수신기와 말이 닿는다', done: v.radio || has(v, 'radio'), opt: true };
  const bite = m.bite ? [
    { t: '경과 확인', d: '진단 키트(숙직실 구호함)로 진행성인지 본다', done: m.bite.known },
    { t: '억제제 맞기', d: '진행성이면 필요하다. 한 번에 이틀을 버틴다', done: m.bite.suppressed },
    { t: '말할지 정하기', d: '먼저 알리기 · 상처 보여 주기 · 소매 내리기 — 정하는 건 나', opt: true },
  ] : null;
  // 첫날 밤
  if (v.day === 1 || (v.day === 2 && clockMin(v.t) < 6 * 60)) {
    const lights = v.t >= v.cfg.lights;
    const mine = v.role === 'ren' ? { t: '배수관 뒤 확인하기', d: '오는 길에 본 것 — 처마 외벽', done: m.pipe, opt: true }
      : { t: '22:15 방송 끝까지 듣기', d: '숙직실 수신기(또는 고친 무전기) 앞에서 자리를 지킨다', done: m.listened, opt: true };
    const list = [
      mine,
      { t: '숙직실에 들어가기', d: v.checkpointOpen ? `검문대에서 검사를 받으면 들어갈 수 있다 · 마감 ${clock(v.closeAt || 150)}` : '검문이 닫혔다 — 안에서 옥상 문을 열어 주거나 열쇠로', done: inside || m.passed },
      doorItem, radioItem,
      { t: '이송 명단에 서명', d: '3일째 05:00 이송 차량에 필요 · 되돌릴 수 없다', done: m.signed, opt: true },
      { t: '불침번 정하기', d: '01:00 소등 후 한 명은 쉬고, 한 명은 망보기. 안전하면 아침까지 넘길 수 있다', done: lights && m.task && (m.task.kind === 'watch' || m.task.kind === 'rest') },
      { t: '아침 06:00까지 버티기', d: '아침마다 물 1 · 식량 1이 든다', done: false },
    ];
    let main;
    if (v.role === 'akechi' && !m.listened && v.t < CFG.BCAST_EARLY + 1) main = '22:15 방송 듣기 — 숙직실 수신기';
    else if (v.role === 'ren' && !m.pipe && !inside && v.t < 30) main = '배수관 뒤 확인 · 숙직실에 들어가기';
    else if (!inside && !lights) main = v.checkpointOpen ? '숙직실에 들어가기 — 검문대에서 검사' : '숙직실에 들어가기 — 옥상 문으로';
    else if (inside && ui.door === false) main = '옥상 문 잠그기';
    else if (!lights) main = '밤 준비 — 물자 · 무전기 · 이송 접수';
    else main = '아침까지 — 한 명은 쉬고 한 명은 망보기';
    return { main, list, bite };
  }
  // 둘째 날부터
  const cm = clockMin(v.t);
  const st = v.stock;
  const short = st ? Math.max(0, 2 - st.water) + Math.max(0, 2 - st.food) : null;
  const list = [
    { t: '내일 아침 물자', d: st ? `숙직실 비축 물 ${st.water} · 식량 ${st.food} — 둘이 물 2 · 식량 2 필요` : '숙직실에 있을 때 비축분이 보인다. 가방에 든 것도 아침에 쓴다', done: st ? short === 0 : false },
    { t: '상점가 다녀오기', d: '검문대 남쪽 · 큰길(빠름) / 뒷골목(느림) · 가방 5칸', opt: true },
    { t: '길 살피기', d: '옥상에서는 두 길 모두, 검문대에서는 큰길만 · 낮에만', done: !!rv(m.scouted, 'alley'), opt: true },
    { t: '18:00 전에 숙직실로', d: '검문은 17:00에 닫힌다. 그 뒤엔 옥상 문으로', done: inside && cm >= 17 * 60 },
    doorItem, radioItem,
  ];
  if (v.t < v.busAt) list.push({ t: '3일째 05:00 이송 차량', d: '검문대 앞 · 이송증 필요 · 재검사에서 상처가 보이면 못 탄다', done: m.boarded, opt: true });
  list.push({ t: `버틴 날: ${v.day}일째`, d: '한 사람이라도 잃으면 끝난다' });
  let main;
  if (v.busHere) main = '이송 차량 — 탈지, 보낼지';
  else if (v.t < v.busAt && v.busAt - v.t < 120 && m.signed) main = '05:00 이송 차량 — 검문대 앞';
  else if (!v.isDay) main = inside ? '밤을 넘기기 — 문 잠그고 쉬기' : '밤이다 — 숙직실로';
  else if (!inside && cm >= 16.5 * 60) main = '해 지기 전에 숙직실로';
  else if (short === null || short > 0) main = '물자 구하기 — 상점가(검문대 남쪽)';
  else main = '오늘은 버틸 만하다 — 쉬거나 더 모으거나';
  return { main, list, bite };
}
function hbtn(b) {
  if (b.move) return `<button class="btn sm" data-hmove="${b.move}">${esc(b.l)}</button>`;
  if (b.sheet) return `<button class="btn sm" data-sheet="${b.sheet}">${esc(b.l)}</button>`;
  return `<button class="btn sm${b.risk ? ' risk' : ' inv'}" data-cmd='${esc(JSON.stringify(b.cmd))}'>${esc(b.l)}</button>`;
}
function hintOf(v) {
  const m = v.me, z = v.zone.id, p = v.partner, btns = [];
  const go = (to) => { const ex = v.zone.exits.find((e) => e.to === to); return ex && !ex.why ? { l: `${zname(to)}(${DIRS[z][to]})로`, move: to } : null; };
  const push = (b) => { if (b && btns.length < 3) btns.push(b); };
  const lights = v.t >= v.cfg.lights;
  const floor = v.zone.floor[0];
  // 물림이 최우선
  if (m.bite && !m.bite.suppressed && (!m.bite.known || m.bite.prog)) {
    const kit = m.bag.find((i) => i.kind === 'kit'), sup = m.bag.find((i) => i.kind === 'suppressant');
    if (sup) push({ l: '억제제 맞기', cmd: { type: 'use', item: sup.id } });
    if (kit && !m.bite.known) push({ l: '진단 키트 쓰기', cmd: { type: 'use', item: kit.id } });
    if (z === 'dorm' && !sup) push({ l: '구호함 보기', sheet: 'bag' });
    return { text: m.bite.known ? '진행성이다. 억제제가 있어야 멈춘다 — 숙직실 구호함.' : '물렸다. 경과는 진단 키트로 확인할 수 있고, 억제제는 확인 전에도 맞을 수 있다.', btns };
  }
  if (v.bcast && !m.listened) {
    push({ l: '방송 끝까지 듣기', cmd: { type: 'listen' } });
    return { text: `수신기에서 방송이 나온다. 끝까지 들으려면 ${secs(CFG.LISTEN)}초 동안 자리를 지켜야 한다. 자리를 뜨면 놓친다.`, btns };
  }
  if (v.role === 'akechi' && !m.listened && v.t < CFG.BCAST_EARLY) {
    const left = `22:15까지 ${Math.max(0, Math.ceil(CFG.BCAST_EARLY - v.t))}분`;
    if (z === 'eaves') push(go('checkpoint'));
    if (z === 'checkpoint' && !m.passed && v.checkpointOpen) push({ l: '검사 받기', cmd: { type: 'inspect' } });
    if (z === 'checkpoint' && m.passed) push(go('dorm'));
    if (z === 'dorm') return { text: `곧 수신기 방송이 나온다(${left}). 그 남자는 끝까지 들으라고 했다.`, btns };
    return { text: `22:15 방송을 끝까지 들으라고 했다. 숙직실 수신기까지 가야 한다(${left}).`, btns };
  }
  if (v.role === 'ren' && !m.pipe && z === 'eaves' && v.t < 60) {
    push({ l: '배수관 뒤 확인', cmd: { type: 'pipe' } });
    push(go('checkpoint'));
    return { text: '오는 길에 본 그 배수관이다. 들어가기 전에 확인할 수 있다.', btns };
  }
  if (has(v, 'radio_broken') && has(v, 'battery')) { const r = m.bag.find((i) => i.kind === 'radio_broken'); return { text: '무전기와 배터리가 다 있다. 고치면 떨어져서도 말이 닿는다.', btns: [{ l: '무전기 고치기', cmd: { type: 'use', item: r.id } }] }; }
  if (floor) push({ l: `${iname(floor.kind)} 줍기`, cmd: { type: 'pick', item: floor.id } });
  if (v.t >= 470) {
    const cm = clockMin(v.t), out = z !== 'dorm';
    const home = () => { if (z === 'market') push({ l: '검문대로 돌아가기', sheet: 'route' }); else if (z === 'checkpoint') { push(go('dorm') || go('eaves')); } else if (z === 'eaves') { push(go('roof')); push(go('checkpoint')); } else if (z === 'roof') push(go('dorm')); };
    if (v.busHere && z === 'checkpoint') { if (has(v, 'pass')) push({ l: '차에 타기', cmd: { type: 'board' }, risk: true }); return { text: has(v, 'pass') ? '이송 차량이 와 있다. 05:15에 떠난다. 타면 여기서 끝이고, 재검사에서 상처가 보이면 탈 수 없다.' : '이송 차량이 와 있다. 이송증이 없으면 탈 수 없다.', btns }; }
    if (v.t < v.busAt && v.busAt - v.t < 60 && has(v, 'pass')) { if (z !== 'checkpoint') { push(go('checkpoint')); push(go('eaves')); push(go('roof')); } return { text: '05:00에 검문대 앞으로 이송 차량이 온다. 탈지, 보낼지.', btns }; }
    if (out && !v.isDay) { home(); return { text: '밤이다. 바깥에서는 조금만 소리가 나도 몰려온다. 숙직실로 돌아가자.', btns }; }
    if (out && cm >= 16.5 * 60) { home(); return { text: cm < 17 * 60 && v.checkpointOpen ? '곧 검문이 닫힌다(17:00). 해는 18:00에 진다.' : '검문이 닫혔다. 해 지기 전에 옥상 문으로 돌아가자.', btns }; }
    if (z === 'pump') {
      const jug = m.bag.find((i) => i.kind === 'jug');
      if (!jug) { push({ l: '돌아가기', sheet: 'route' }); return { text: '물통이 없다. 숙직실 구호함에 빈 물통이 있다.', btns }; }
      if (jug.left < 3) push({ l: '반만 채우기', cmd: { type: 'fill', amount: 'half' } });
      if (jug.left < v.cfg.jugCap) push({ l: '가득 채우기', cmd: { type: 'fill', amount: 'full' } });
      push({ l: '돌아가기', sheet: 'route' });
      const sc = m.scouted, crowd = ['main', 'alley'].filter((k) => rv(sc, k) === 'crowd').map((k) => ROUTE_TEXT[k]);
      return { text: `물통 ${jug.left}/${v.cfg.jugCap}. 반이면 가볍게 빨리, 가득이면 무거워져 느리고 싸울 수 없다(함께 들면 괜찮다).${crowd.length ? ` 마지막으로 알기로 ${crowd.join('·')}에 무리.` : ''} 숨겨 두고 빈손으로 갈 수도 있다.`, btns };
    }
    if (z === 'market') {
      const full = m.load >= v.cfg.cap;
      if (!full) push({ l: '상점가 뒤지기', cmd: { type: 'search' } });
      push({ l: '돌아가기', sheet: 'route' });
      return { text: full ? `가방이 꽉 찼다(${m.load}/${v.cfg.cap}). 돌아가자.` : `가방 ${m.load}/${v.cfg.cap}. 뒤질수록 더 나오지만 소리가 쌓인다.`, btns };
    }
    if (z === 'roof' && v.isDay && !rv(m.scouted, 'alley')) { push({ l: '길 살피기', cmd: { type: 'scout' } }); push(go('eaves')); return { text: '옥상에서는 큰길과 뒷골목이 둘 다 내려다보인다.', btns }; }
    if (z === 'checkpoint' && v.isDay) {
      if (!rv(m.scouted, 'main')) push({ l: '큰길 살피기', cmd: { type: 'scout' } });
      push({ l: '시내로 (상점가·급수소)', sheet: 'route' });
      if (!m.passed && v.checkpointOpen) push({ l: '검사 받기', cmd: { type: 'inspect' } }); else push(go('dorm'));
      const sc = m.scouted;
      return { text: `남쪽으로 나가면 상점가와 급수소다.${rv(sc, 'main') ? ` 큰길은 ${rv(sc, 'main') === 'crowd' ? '무리가 몰려 있다' : '조용하다'}(${clock(rvt(sc, 'main'))} 기준).` : ''}${!m.passed && v.checkpointOpen ? ' 숙직실로 들어가려면 다시 검사를 받아야 한다.' : ''}`, btns };
    }
    if (z === 'dorm') {
      const st = v.stock;
      if (!v.isDay) { push({ l: '쉬기', cmd: { type: 'rest' } }); push({ l: '망보기', cmd: { type: 'watch' } }); return { text: `밤이다. 문을 잠그고 쉬자.${st ? ` 비축: 물 ${st.water} · 식량 ${st.food}.` : ''}`, btns }; }
      if (v.checkpointOpen) push(go('checkpoint')); else push(go('roof'));
      if (v.zone.box && v.zone.box.length) push({ l: v.zone.box.some((i) => i.kind === 'jug') ? '구호함(빈 물통)' : '구호함 보기', sheet: 'bag' });
      return { text: st ? `비축: 물 ${st.water} · 식량 ${st.food}. 내일 아침 둘이 물 2 · 식량 2가 필요하다.${v.checkpointOpen ? '' : ' 검문은 07:00에 연다.'}` : '숙직실.', btns };
    }
    if (z === 'eaves') { push(go('checkpoint')); push(go('roof')); return { text: '검문대를 지나 남쪽으로 가면 상점가다.', btns }; }
  }
  if (z === 'eaves') {
    if (m.searched === 0) push({ l: '처마 밑 뒤지기', cmd: { type: 'search' } });
    if (v.checkpointOpen) { push(go('checkpoint')); return { text: v.t < 5 ? '처음이라면: 남쪽 검문대에서 검사를 받으면 숙직실에 들어갈 수 있다. 그 전에 주변을 뒤져 봐도 된다.' : '검문대(S)에서 검사를 받으면 안으로 들어갈 수 있다.', btns }; }
    push(go('roof'));
    if (p.rel === 'glass' && p.zone) push({ l: '창 두드리기', cmd: { type: 'knock' } });
    return { text: '검문이 닫혔다. 안에서 옥상 문을 열어 주거나, 옥상 열쇠가 있어야 들어갈 수 있다.', btns };
  }
  if (z === 'checkpoint') {
    if (v.checkpointOpen && !m.passed) { push({ l: '검사 받기', cmd: { type: 'inspect' } }); return { text: '검사원에게 소매를 걷어 보이면 숙직실로 들어갈 수 있다.', btns }; }
    if (v.checkpointOpen && m.passed && !m.signed && !v.regOpen) { push(go('dorm')); return { text: '통과했다. 이송 접수는 22:20부터 받는다.', btns }; }
    if (v.checkpointOpen && m.passed && !m.signed) { push(go('dorm')); push({ l: '명단에 서명', cmd: { type: 'sign' }, risk: true }); return { text: '통과했다. 숙직실(E)로 들어가거나, 이송 명단에 서명할 수 있다(되돌릴 수 없음).', btns }; }
    push(go('dorm')); push(go('eaves'));
    return { text: v.checkpointOpen ? '숙직실(E)로 들어가자.' : '검문이 닫혔다.', btns };
  }
  if (z === 'dorm') {
    if (v.zone.door && !v.zone.door.locked && !lights) push({ l: '옥상 문 잠그기', cmd: { type: 'lock' } });
    if (lights) { push({ l: '망보기', cmd: { type: 'watch' } }); push({ l: '쉬기', cmd: { type: 'rest' } }); return { text: '소등했다. 한 명은 쉬고 한 명은 망을 보면 잠이 깊어진다.', btns }; }
    if (v.zone.box && v.zone.box.length) push({ l: '구호함 보기', sheet: 'bag' });
    const out = !(p.rel === 'same' && p.zone);
    return { text: out ? `${NAMES[p.role]}는 아직 밖이다. 창 너머라면 손짓하거나 창틀에 물건을 둘 수 있다. 구호함에는 진단 키트·억제제·붕대·담요가 있다.` : '구호함에 진단 키트·억제제·붕대·담요가 있다. 옥상 문은 안쪽 걸쇠로 잠근다.', btns };
  }
  if (z === 'roof') {
    if (m.searched === 0) push({ l: '옥상 뒤지기', cmd: { type: 'search' } });
    const key = has(v, 'key');
    if (key && v.zone.door.locked) push({ l: '옥상 문 열기', cmd: { type: 'unlock' } });
    push(go('dorm')); push(go('eaves'));
    return { text: v.zone.door.locked ? (key ? '열쇠로 옥상 문을 열 수 있다.' : '옥상 문은 잠겨 있다. 안에서 열어 주거나 열쇠가 있어야 한다.') : '옥상 문이 열려 있다. 숙직실(E)로 내려갈 수 있다.', btns };
  }
  return null;
}

// ── UI ────────────────────────────────────────────────────
const ui = {
  host: null, role: 'ren', page: {}, pick: {}, line: {}, dpick: {}, dline: {}, markZone: null, hints: store0('saebyeok-hints') !== 'off', door: null, sheet: null, sel: null, tagsHtml: '', lastLogShown: 0, prev: {},
  start(host, role) {
    this.host = host; this.role = role;
    $('#lobby').hidden = true; $('#game').hidden = false;
    $('#tabs').hidden = !host.local;
    document.body.classList.toggle('tut', !!host.tutorial);
    document.body.classList.add('ingame');
    document.body.classList.toggle('scene-big', store.get('saebyeok-scene2') === 'big');
    this.paneKey = null; this.tab = this.tab || 'chat';
    $('#coach').hidden = !host.tutorial;
    this.refresh();
    if (!this.loop) {
      this.loop = setInterval(() => { this.host.tick(); this.refresh(); }, 200);
      const frame = (now) => { this.paint(now); requestAnimationFrame(frame); };
      requestAnimationFrame(frame);
    }
  },
  send(cmd) {
    const r = this.host.send(this.role, cmd);
    if (r && !r.ok) toast(ERRS[r.err] || '할 수 없다.');
    if (navigator.vibrate && cmd.type !== 'typing') try { navigator.vibrate(8); } catch { /* */ }
    this.refresh(true);
    return r;
  },
  view() { return this.host ? this.host.view(this.role) : null; },
  paint(now) {
    const v = this.view(); if (!v) return;
    const cv = $('#scene');
    const tags = draw(cv, v, now);
    // 장면은 띠 모양으로 잘라 보여 준다(object-fit: cover). 이름표 위치도 같이 맞춘다
    const cw = cv.clientWidth, chh = cv.clientHeight, sc = Math.max(cw / W, chh / H);
    const ox = (cw - W * sc) / 2, oy = (chh - H * sc) / 2;
    const html = tags.map((t) => `<span class="tag${t.small ? ' sm' : ''}" style="left:${Math.round(ox + t.x * sc)}px;top:${Math.round(Math.max(18, oy + t.y * sc))}px">${esc(NAMES[t.role])}${t.typing ? ' …' : ''}</span>`).join('');
    if (html !== this.tagsHtml) { $('#tags').innerHTML = html; this.tagsHtml = html; }
  },
  set(id, html) { if (this.prev[id] !== html) { const el = document.getElementById(id); if (el) el.innerHTML = html; this.prev[id] = html; } },
  refresh() {
    const h = this.host; if (!h) return;
    const v = this.view();
    if (h instanceof RemoteHost) {
      if (!v) {
        const st = h.status === 'replaced' ? '다른 기기에서 이 역할로 접속했다.' : h.lobby ? `방 코드 <b>${esc(h.code)}</b> · 상대를 기다리는 중 (${h.lobby.ren ? '렌 ✓' : '렌 …'} / ${h.lobby.akechi ? '아케치 ✓' : '아케치 …'})` : '연결 중…';
        this.set('pane', `<li class="cn2"><p>${st}</p><p class="dim">친구에게 이 주소를 보내세요:<br><span class="code">${esc(location.origin + location.pathname + '#' + h.code)}</span></p></li>`);
        return;
      }
    }
    if (!v) return;
    this.renderTabs(v);
    $('#bDev').hidden = !(v.dev && !this.host.local);
    this.renderBand(v);
    this.renderMe(v);
    this.renderMap(v);
    this.renderLoc(v);
    this.renderPane(v);
    this.renderStage(v);
    this.cues(v);
    this.renderPrompt(v);
    this.renderQuick(v);
    this.renderTask(v);
    this.renderInput(v);
    if (this.sheet) this.renderSheet(v);
    $('#prologue').hidden = v.phase !== 'prologue' && v.phase !== 'morning';
    if (v.phase === 'prologue') this.renderPrologue(v);
    if (v.phase === 'morning') this.renderMorning(v);
    $('#result').hidden = v.phase !== 'result';
    if (v.phase === 'result') this.renderResult(v);
    if (this.host.tutorial) this.renderCoach();
    $('#pausebar').hidden = !v.paused || v.pauseReason === 'tutorial';
    if (v.paused) this.set('pausebar', v.pauseReason === 'disconnect' ? '상대 연결이 끊겨 시간이 멈췄다. 돌아오면 이어진다.' : v.pauseReason === 'away' ? '화면을 벗어나 시간이 멈췄다.' : '시간 정지 (시험 도구)');
  },
  renderCoach() {
    const h = this.host, st = h.cur, n = STEPS.length;
    const btns = st.last ? '<div class="row"><button class="btn inv" data-act="home">처음 화면으로</button><button class="btn" data-act="restart">다시 연습</button></div>'
      : st.info ? '<div class="row"><button class="btn inv" data-act="coachNext">다음</button></div>' : '<p class="cdo">▶ 직접 해 보자</p>';
    this.set('coach', `<div class="ch2"><span class="cstep">${h.step + 1}/${n}</span><b>${esc(st.title || '')}</b></div><p>${esc(st.text)}</p>${btns}`);
    if (this.coachTarget !== st.target) {
      document.querySelectorAll('.coach-target').forEach((el) => el.classList.remove('coach-target'));
      if (st.target) { const el = $(st.target); if (el) el.classList.add('coach-target'); }
      this.coachTarget = st.target;
    }
  },
  renderTabs(v) {
    if (!this.host.local) return;
    const urgent = (r) => { const x = this.host.view(r); return (x.zone.zombie && x.zone.zombie.st === 'warn') || x.tug || (x.me.task && x.me.task.blockedBy); };
    this.set('tabs', ['ren', 'akechi'].map((r) => `<button class="tab${r === this.role ? ' on' : ''}" data-role="${r}">${NAMES[r]}${urgent(r) && r !== this.role ? ' <b class="bang">!</b>' : ''}</button>`).join('') +
      `<button class="tab dev" data-sheet="dev">도구</button>`);
    void v;
  },
  // ── 맨 위 흐르는 띠: 며칠째 · 구역 · 시각 · 마감 ──
  renderBand(v) {
    const cm = clockMin(v.t);
    const until = (h) => { let d = h * 60 - cm; if (d <= 0) d += 1440; return d; };
    let dl;
    if (v.lastScene) dl = `마지막 장면 ${dur(v.lastScene.left)}`;
    else if (v.busHere) dl = `차 출발 05:15 · ${dur(until(5.25))}`;
    else if (v.t < v.busAt && v.busAt - v.t <= 180) dl = `이송 차량 05:00 · ${dur(v.busAt - v.t)}`;
    else if (v.day === 1 && v.checkpointOpen) dl = `검문 마감 ${dur((v.closeAt || 150) - v.t)}`;
    else if (v.isDay) dl = cm < 17 * 60 && v.checkpointOpen ? `검문 마감 ${dur(until(17))}` : `해 질 녘 ${dur(until(18))}`;
    else dl = `아침까지 ${dur(until(6))}`;
    // 전광판은 안내 방송·수신기 방송이 들어올 때만 잠깐 켠다
    const pa = [...v.log].reverse().find((e) => e.k === 'pa' || (e.k === 'radio' && /^(bcast|broadcast|nSos)/.test(e.key)));
    const bkey = v.role + ':' + (pa ? pa.id : 0);
    if (this.bandKey === undefined || this.bandRole !== v.role) { this.bandKey = bkey; this.bandRole = v.role; }
    else if (pa && this.bandKey !== bkey) { this.bandKey = bkey; this.bandUntil = Date.now() + 15000; }
    const showBand = Date.now() < (this.bandUntil || 0);
    $('#band').hidden = !showBand;
    if (showBand && pa) { const part = `${fmt(pa.key, pa.a, v.role)} ■ `; this.set('bandText', `<span>${esc(part.repeat(3))}</span><span aria-hidden="true">${esc(part.repeat(3))}</span>`); }
    this.set('locClock', `${v.day}일 ${clock(v.t)}<span class="dl"> · ${esc(dl)}</span>`);
  },
  avatar(role, extra = '') {
    const src = AVATARS[role];
    return `<span class="av${extra}">${src ? `<img src="${esc(src)}" alt="">` : esc((NAMES[role] || '?').slice(0, 1))}</span>`;
  },
  tags(list, max = 9) {
    const shown = list.slice(0, max);
    return shown.map((k) => `<span class="st${['bleed', 'bitten', 'fever', 'tremor', 'down'].includes(k) ? ' bad' : ''}">${esc(STATUS_TEXT[k])}</span>`).join('') + (list.length > max ? `<span class="st">+${list.length - max}</span>` : '');
  },
  // ── 생존자 줄: 얼굴 · 이름 · 상태 꼬리표 · 막대 ──
  renderMe(v) {
    const m = v.me;
    const bar = (ic, cls, val, label) => `<span class="mini" title="${label} ${val}">${icon(ic, 11)}<span class="bar b-${cls}"><i style="width:${Math.max(0, Math.min(100, val))}%"></i></span></span>`;
    void bar;
    const BAD = ['bleed', 'bitten', 'fever', 'tremor', 'down'];
    const worst = m.status.find((k) => BAD.includes(k)) || m.status[0];
    const tag = m.turned ? '감염 전환' : worst ? STATUS_TEXT[worst] : m.cold >= 60 ? '추움' : m.cold >= 35 ? '서늘함' : '이상 없음';
    const warn = m.turned || (worst && BAD.includes(worst)) || m.hp < 35 || m.cold >= 60;
    const h = (x) => Math.max(2, Math.round(Math.max(0, Math.min(100, x)) / 10));
    $('#me').classList.toggle('warn', !!warn);
    this.set('me', `<span class="mb" aria-hidden="true"><i style="height:${h(m.hp)}px"></i><i style="height:${h(m.stamina)}px"></i><i class="c" style="height:${h(m.cold)}px"></i></span><span class="pl4">${esc(NAMES[m.role])} · <b>${esc(tag)}</b></span>`);
  },
  statusHtml(v) {
    const m = v.me, p = v.partner;
    const row = (ic, cls, label, val) => `<div class="srow"><span class="tile t-${cls}">${icon(ic, 18)}</span><div class="sbody"><div class="sl"><span>${label}</span><b>${val}<small>/100</small></b></div><span class="bar b-${cls}"><i style="width:${Math.max(0, Math.min(100, val))}%"></i></span></div></div>`;
    const extra = [];
    if (m.bite && m.bite.next) extra.push(`다음 악화 ${clock(m.bite.next)}`);
    if (m.passed) extra.push('출입 띠');
    if (m.signed) extra.push('이송 접수');
    if (v.radio) extra.push('무전 연결');
    const sts = m.status.map((k) => `<div class="sd"><span class="st${['bleed', 'bitten', 'fever', 'tremor', 'down'].includes(k) ? ' bad' : ''}">${esc(STATUS_TEXT[k])}</span><span>${esc(STATUS_DESC[k])}</span></div>`).join('');
    const me = `<div class="card me"><div class="ch">${this.avatar(m.role)}<div class="cn"><b>${esc(NAMES[m.role])}</b><span class="cs">가방 ${m.load}/${v.cfg.cap}${extra.length ? ' · ' + esc(extra.join(' · ')) : ''}</span></div></div>
      ${row('heart', 'hp', '체력', m.hp)}${row('bolt', 'st', '기력', m.stamina)}${row('snow', 'cold', '추위', m.cold)}
      ${sts ? `<div class="sds">${sts}</div>` : '<p class="dim" style="margin:0">이상 없음</p>'}</div>`;
    const seen = !!p.zone;
    const where = p.rel === 'same' && seen ? '곁에 있다' : p.rel === 'glass' && seen ? '창 너머' : `보이지 않는다 · 마지막: ${zname(p.lastSeen.zone)} ${clock(p.lastSeen.t)}`;
    const pt = `<div class="card${seen ? '' : ' far'}"><div class="ch">${this.avatar(p.role)}<div class="cn"><b>${esc(NAMES[p.role])}</b><span class="cs">${esc(where)}</span></div></div>
      ${seen && p.status && p.status.length ? `<div class="sts">${this.tags(p.status)}</div>` : ''}<p class="dim" style="margin:0;font-size:12px">눈에 보이는 것만 나온다. 물림·발열은 보이지 않는다.</p></div>`;
    return `<div class="cards">${me}${pt}</div>`;
  },
  renderMap(v) {
    const pos = { roof: '1 / 4', eaves: '1 / 2', dorm: '3 / 4', checkpoint: '1 / 4', market: '1 / 2', pump: '3 / 4' };
    const rowOf = { roof: 1, eaves: 2, dorm: 2, checkpoint: 3, market: 4, pump: 4 };
    const cells = Object.keys(pos).map((z) => `<i class="mc${v.me.zone === z ? ' here' : ''}${v.partner.zone === z ? ' pt' : ''}" style="grid-column:${pos[z]};grid-row:${rowOf[z]}"></i>`).join('');
    this.set('mini', cells);
  },
  // ── 위치 패널: 제목 띠 + 도트 장면 + 묘사 + 목표 ──
  renderLoc(v) {
    this.set('locTitle', esc(ZONE_TEXT[v.zone.id].name));
    {
      const z = v.zone.zombie, P2 = v.partner, pn = NAMES[P2.role];
      let bt, bc = '';
      if (z && z.st === 'warn') { bt = `경고 · ${secs(z.left)}초 안에 대응`; bc = 'danger'; }
      else if (P2.turned) bt = `${pn}였던 것`;
      else if (P2.rel === 'same' && P2.zone) bt = `곁에 · ${pn}`;
      else if (P2.rel === 'glass' && P2.zone) bt = `창 너머 · ${pn}`;
      else if (v.channel === 'radio') bt = `무전 · ${pn}`;
      else bt = '혼자';
      const el = $('#stageBadge'); if (el.className !== bc) el.className = bc;
      this.set('stageBadge', `${bc ? '' : '<span class="wd"></span>'}${esc(bt)}`);
      this.snowOn = !!(ZONES_OUT[v.zone.id]);
    }
    this.set('locDesc', bold(ZONE_TEXT[v.zone.id].look));
    const g = goalsOf(v, this);
    this.hintNow = this.hints && !this.host.tutorial ? hintOf(v) : null;
    const w = witness(v);
    $('#goalbar').classList.toggle('alert', !!w);
    this.set('goalbar', w ? witnessHtml(w) : `<button class="gbtn" data-sheet="goals"><span class="gk">목표</span><span class="gt">${esc(g.main)}</span><span class="gm">▸</span></button>`);
  },
  // ── 채팅 | 기록 | 주변 ──
  // 대화와 기록을 한 줄기로: 말은 말풍선, 일어난 일은 서술 줄
  splitLog(v) {
    const chat = [], log = [];
    for (const e of v.log) { chat.push(e); if (!isChatEntry(e)) log.push(e); }
    return { chat, log };
  },
  renderSeg(v, parts) {
    const tab = this.tab || 'chat';
    const last = (arr) => (arr.length ? arr[arr.length - 1].id : 0);
    const key = v.role;
    this.seen = this.seen || {};
    const seen = this.seen[key] || (this.seen[key] = { chat: 0, log: 0 });
    seen[tab === 'near' ? 'near' : tab] = last(tab === 'chat' ? parts.chat : []);
    const unread = (arr, k) => arr.filter((e) => e.id > (seen[k] || 0) && !(e.a && e.a.who === v.role && k === 'chat')).length;
    const nc = tab === 'chat' ? 0 : unread(parts.chat, 'chat');
    const nl = tab === 'log' ? 0 : unread(parts.log, 'log');
    const z = v.zone.zombie;
    const nearAlert = this.sheet !== 'near' && ((z && z.st !== 'idle') || (v.partner.rel === 'same' && v.partner.task && v.partner.task.interruptible));
    const b = (n) => (n ? `<b>${n > 99 ? '99+' : n}</b>` : '');
    void nl;
    const nn = this.nearCount || 0;
    { const bn = $('#bNear'); const badge = nearAlert || (z && z.st === 'warn') ? '<b class="al">!</b>' : nn ? `<b>${nn}</b>` : ''; const t = `${icon('eye', 17)}<span class="tl">주변</span>${badge}`; if (bn && this.bnKey !== t) { bn.innerHTML = t; this.bnKey = t; } if (bn) bn.classList.toggle('alert', !!(nearAlert || (z && z.st === 'warn'))); }
    this.set('seg', `<button role="tab" data-tab="chat" aria-selected="${tab === 'chat'}">대화 · 기록${b(nc)}</button><button role="tab" data-tab="near" aria-selected="${tab === 'near'}">주변${nearAlert ? '<b class="al">!</b>' : nn ? `<span class="cnt">${nn}</span>` : ''}</button>`);
  },
  renderPane(v) {
    const parts = this.splitLog(v);
    this.renderSeg(v, parts);
    this.tab = 'chat';
    this.nearCount = (this.nearHtml(v).match(/<li class="nc/g) || []).length;
    const tab = this.tab || 'chat';
    const el = $('#pane');
    el.className = 'pane-' + tab;
    let html, key;
    if (tab === 'chat') {
      key = 'c:' + v.role + ':' + (parts.chat.length ? parts.chat[parts.chat.length - 1].id : 0);
      if (this.paneKey === key) return;
      html = this.chatHtml(v, parts.chat.slice(-140)) || `<li class="empty">아직 나눈 말이 없다. 아래에 쓰면 곁에 있는 사람에게 닿는다. <span class="dim">*행동*은 별표로.</span></li>`;
    } else if (tab === 'log') {
      key = 'l:' + v.role + ':' + (parts.log.length ? parts.log[parts.log.length - 1].id : 0);
      if (this.paneKey === key) return;
      html = this.logHtml(v, parts.log.slice(-120));
    } else {
      html = this.nearHtml(v);
      key = 'n:' + html;
      if (this.paneKey === key) return;
    }
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80 || this.paneTab !== tab + v.role;
    el.innerHTML = html;
    this.paneKey = key;
    if (tab !== 'near' && nearBottom) el.scrollTop = el.scrollHeight;
    if (tab === 'near' && this.paneTab !== tab + v.role) el.scrollTop = 0;
    this.paneTab = tab + v.role;
  },
  chatHtml(v, list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const e = list[i], who = e.a && e.a.who, t = clock(e.t);
      const head = (w, extra = '') => `<div class="ch3"><b>${esc(w === v.role ? NAMES[w] : NAMES[w] || '')}</b><time>${t}</time>${extra}</div>`;
      const row = (w, body, cls = '', extra = '') => `<li class="cm${w === v.role ? ' me' : ''}${cls}">${this.avatar(w)}<div>${head(w, extra)}<p>${body}</p></div></li>`;
      if (e.key.startsWith('emote.')) {
        // 바로 뒤에 같은 사람의 대사가 오면 대사 옆 괄호로 붙인다
        const nx = list[i + 1];
        const txt = e.a.text;
        if (nx && nx.key === 'say' && nx.a.who === who && nx.t - e.t < 0.5) { out.push(row(who, `${esc(nx.a.text)} <i class="paren">(${esc(txt)})</i>`)); i++; continue; }
        out.push(row(who, `<i class="paren">(${esc(txt)})</i>`, ' act', e.key === 'emote.glass' ? '<span class="tg">창 너머</span>' : ''));
        continue;
      }
      if (e.key === 'sc') {
        if (who) out.push(row(who, esc(sceneLine(e.a)), ' scn'));
        else out.push(`<li class="cn2 scn"><p>${esc(sceneLine(e.a))}</p><time>${t}</time></li>`);
        continue;
      }
      if (e.key === 'replayLine') { out.push(row(who, esc(garble(e.a.text, e.id, 34)), ' radio rec', '<span class="tg">녹음</span>')); continue; }
      if (e.key === 'scPick') { out.push(`<li class="cn2 scp"><p>${esc(NAMES[who])} — ${esc(SCENE_TEXT[e.a.sc].opts[e.a.opt])}</p></li>`); continue; }
      if (e.key === 'say') { out.push(row(who, esc(e.a.text))); continue; }
      if (e.key === 'signal') { out.push(row(who, esc(SIGNAL_TEXT[e.a.which]), '', '<span class="tg">손짓</span>')); continue; }
      if (e.key === 'sayRadio' || e.key === 'signalRadio') {
        const raw = e.key === 'sayRadio' ? e.a.text : SIGNAL_TEXT[e.a.which];
        out.push(row(who, esc(who === v.role ? raw : garble(raw, e.id)), ' radio', '<span class="tg">무전</span>'));
        continue;
      }
      if (e.key === 'sayGlass.self') { out.push(row(who, `${esc(e.a.text)}<span class="note">유리 너머라 들리지 않았을 것이다</span>`, ' muted')); continue; }
      if (e.key.startsWith('moan.')) {
        if (e.key === 'moan.same' || e.key === 'moan.self') out.push(`<li class="cm zom">${this.avatar(who, ' z')}<div><div class="ch3"><b>좀비(${esc(NAMES[who])})</b><time>${t}</time></div><p>${esc(e.a.text)}</p></div></li>`);
        else out.push(`<li class="cn2"><p>${esc(fmt(e.key, e.a, v.role))}</p><time>${t}</time></li>`);
        continue;
      }
      out.push(`<li class="nr k-${e.k}"><p>${esc(fmt(e.key, e.a, v.role))}</p><time>${t}</time></li>`);
    }
    return out.join('');
  },
  logHtml(v, list) {
    const COMBAT = /^(graze|bite|lungeMiss|zDown|zHit|push|fight|crowd|death|turn|zWarn|zAppear|zEnterDorm)\./;
    return list.map((e) => {
      let mark = '·', cls = '';
      if (COMBAT.test(e.key) || e.key === 'zWarn.self') { mark = icon('sword', 12); cls = ' cb'; }
      else if (e.key === 'statusOn' || e.key === 'statusSeen') { mark = '+'; cls = ' sOn'; }
      else if (e.key === 'statusOff') { mark = '−'; cls = ' sOff'; }
      else if (e.k === 'pa') { mark = '■'; cls = ' pa'; }
      else if (e.k === 'radio') { mark = icon('radio', 12); cls = ' rd'; }
      else if (e.k === 'hear') { mark = '♪'; cls = ' hr'; }
      const extra = e.key === 'enter.self' && e.a.zone ? `<span class="lk2">${bold(ZONE_TEXT[e.a.zone].look)}</span>` : '';
      return `<li class="lg${cls}"><time>${v.day > 1 || e.t >= 120 ? clock(e.t) : clock(e.t)}</time><span class="mk2">${mark}</span><p>${esc(fmt(e.key, e.a, v.role))}${extra}</p></li>`;
    }).join('');
  },
  // 주변: 이 구역의 사람·좀비·물건과 할 수 있는 일
  nearHtml(v) {
    const m = v.me, P2 = v.partner, z = v.zone.zombie, zid = v.zone.id;
    const btn = (label, attr, cls = '') => `<button class="btn sm${cls}" ${attr}>${esc(label)}</button>`;
    const cmd = (label, c, cls = '') => btn(label, `data-cmd='${esc(JSON.stringify(typeof c === 'string' ? { type: c } : c))}'`, cls);
    const card = (title, sub, body, btns, cls = '', av = '') => `<li class="nc${cls}">${av}<div class="nb"><div class="nt"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div>${body || ''}${btns.length ? `<div class="row wrap">${btns.join('')}</div>` : ''}</div></li>`;
    const out = [];
    const recCard = () => card(v.rec.dorm ? '숙직실 수신기' : '수신기', `${esc(NAMES[v.rec.from])}의 목소리가 녹음되어 있다 · ${clock(v.rec.t)}`, '<p class="dim">다시 들어도 아무도 모른다. 곁에 있으면 귀에 대는 모습은 보인다.</p>', [cmd('다시 듣기', 'replay')], ' thing rec');
    if (v.rec && P2.rel !== 'same') out.push(recCard());
    // 지금 할 일
    const g = goalsOf(v, this), h = this.hintNow;
    const gb = [];
    if (h) for (const b of h.btns) if (!b.move && b.sheet !== 'route') gb.push(hbtn(b));
    if (v.skip && !m.skipVote) gb.push(cmd(`${clock(v.skip.to)}까지 넘기자`, 'skip', ' inv'));
    if (busWindow(v)) { const Lg = ledger(v); gb.push(btn(`05:00 차 · 탄다 ${Lg.canRide ? '가능' : '불가'} / 남는다 아침 ${Lg.mornings}번`, 'data-sheet="goals"')); }
    out.push(card('지금 할 일', '', `<p>${esc(g.main)}</p>${h && h.text ? `<p class="dim">${esc(h.text)}</p>` : ''}`, gb, ' ngoal'));
    out.push(card(esc(ZONE_TEXT[zid].name), '이 구역', `<p class="dim">${esc(String(ZONE_TEXT[zid].look || '').replace(/\*\*/g, ''))}</p>`, [btn('주변 탐색', 'data-act="search"', ' inv')], ' zone'));
    // 좀비
    if (z) {
      const st = z.st === 'warn' ? `달려든다 — ${secs(z.left)}초` : z.st === 'stun' ? `비틀거린다 · ${secs(z.left)}초` : z.st === 'approach' ? `다가온다 · ${secs(z.left)}초` : '서성인다';
      const bs = [];
      if (m.mobile && !m.heavy && z.st !== 'stun') bs.push(cmd('밀어내기', 'push'));
      if (m.mobile && !m.heavy) bs.push(cmd(`맞서기 · ${oddsWord(z.odds)}`, 'fight', z.odds < 0.5 ? ' risk' : ' inv'));
      bs.push(btn('물러나기', 'data-sheet="map"'));
      out.push(card(esc(zlabel(z)), esc(st), `${z.of ? `<p class="dim">${esc(NAMES[z.of])}였던 것.</p>` : ''}${(z.maxHp || 1) > 1 ? `<p class="dim">단단하다. 두 번 쓰러뜨려야 한다${z.hp < z.maxHp ? ' — 한 번 남았다' : ''}.</p>` : ''}<p class="dim">밀어내서 비틀거릴 때 맞서면 승산이 오른다. 둘이 같이 맞서도 오른다.</p>`, bs, ' zom' + (z.st === 'warn' ? ' warn' : ''), `<span class="av z">${icon('person', 18)}</span>`));
    }
    // 상대
    if (P2.turned) { /* 좀비 카드로 대신 */ }
    else if (P2.rel === 'same' && P2.zone) {
      const obs = [];
      if (P2.asleep) obs.push(PARTNER_TEXT.asleep);
      if (P2.tired) obs.push(PARTNER_TEXT.tired);
      if (P2.blood) obs.push(PARTNER_TEXT.blood);
      if (P2.task && !P2.asleep) obs.push(TASK_TEXT[P2.task.kind] + ' 중');
      const bs = [btn('말 걸기', 'data-act="focusSay"'), btn('말 걸 거리', 'data-act="question"'), btn('건네기', 'data-sheet="bag"')];
      if (!v.offer) {
        if (v.have.food || (zid === 'dorm' && v.stock && v.stock.food)) bs.push(cmd('통조림 밀어 주기', { type: 'offer', kind: 'meal', style: 'push' }), cmd('두 몫으로 나누기', { type: 'offer', kind: 'meal', style: 'split' }));
        if (m.bag.some((i) => i.kind === 'bandage')) bs.push(cmd('붕대 감아 주기', { type: 'offer', kind: 'care' }));
        bs.push(cmd('어깨 빌려주기', { type: 'offer', kind: 'lean' }));
      }
      const pt = P2.task;
      if (pt && pt.interruptible) bs.push(cmd(pt.kind === 'sign' ? '종이 누르기' : pt.kind === 'move' ? '붙잡기' : '손 얹기', 'block', ' inv'));
      if (P2.helpable && !(m.task && m.task.kind === 'help')) bs.push(cmd('거들기', 'help'));
      if (P2.takeable) bs.push(cmd('대신 맡기', 'takeOver'));
      if (P2.heavy) bs.push(cmd(P2.carriedByMe ? '그만 들기' : '함께 들기', 'carryWith', P2.carriedByMe ? '' : ' inv'));
      if (P2.down || m.supporting) bs.push(cmd(m.supporting ? '부축 그만' : '부축하기', 'support'));
      out.push(card(esc(NAMES[P2.role]), '곁에 있다', `${P2.status && P2.status.length ? `<div class="sts">${this.tags(P2.status)}</div>` : ''}${obs.length ? `<p>${esc(obs.join(' · '))}</p>` : ''}`, bs, '', this.avatar(P2.role)));
    } else if (P2.rel === 'glass' && P2.zone) {
      out.push(card(esc(NAMES[P2.role]), '창 너머', `<p class="dim">말은 들리지 않는다. 손짓과 창틀만 닿는다.</p>`, [btn('손짓', 'data-act="sigs"'), cmd('창 두드리기', 'knock'), btn('창틀', 'data-sheet="bag"')], '', this.avatar(P2.role)));
    } else {
      const bs = [cmd(`${NAMES[P2.role]} 부르기`, 'shout')];
      out.push(card(esc(NAMES[P2.role]), `보이지 않는다 · 마지막 ${esc(zname(P2.lastSeen.zone))} ${clock(P2.lastSeen.t)}`, v.radio ? '<p class="dim">무전은 닿는다.</p>' : '', bs, ' far', this.avatar(P2.role)));
    }
    if (v.rec && P2.rel === 'same') out.push(recCard());
    if (zid === 'dorm' && v.under && v.under.knows && v.under.open) out.push(card('보일러실 계단', '지하역 연결 통로로 이어진다', '<p class="dim">검문대를 거치지 않는다. 내려가면 무전이 닿지 않는다.</p>', [btn('지하로', 'data-sheet="route"')], ' thing'));
    // 이 구역의 물건
    const T = (title, sub, bs) => out.push(card(esc(title), sub ? esc(sub) : '', '', bs, ' thing'));
    if (zid === 'eaves') { if (!m.pipe) T('배수관', '외벽을 따라 내려온다', [cmd('뒤를 확인', 'pipe')]); T('숙직실 창', '창틀로 물건을 주고받는다', [cmd('두드리기', 'knock'), btn('창틀 보기', 'data-sheet="bag"')]); }
    if (zid === 'checkpoint') {
      const bs = [];
      if (v.checkpointOpen && !m.passed) bs.push(cmd('검사 받기', 'inspect', ' inv'));
      if (v.checkpointOpen && m.passed && !m.signed && v.regOpen) bs.push(cmd('명단에 서명', 'sign'));
      if (v.busHere) bs.push(cmd('차에 타기', 'board', ' inv'));
      T('검사원', v.checkpointOpen ? (m.passed ? '통과했다' : '소매를 걷어 보이면 들여보내 준다') : '셔터가 내려가 있다', bs);
      if (v.isDay) T('큰길', '남쪽 시내로 이어진다', [cmd('살피기', 'scout')]);
    }
    if (v.stranger) out.push(card('창밖의 낯선 사람', '“물… 물 좀…”', '<p class="dim">창틀에 물이나 먹을 것을 두면 가져간다. 곧 떠난다.</p>', [btn('창틀에 두기', 'data-sheet="bag"')], ' zom'));
    if (v.sos) out.push(card('수신기의 구조 요청', '지직거린다', '<p class="dim">응답하면 소리가 난다. 그래도 답할까.</p>', [cmd('응답하기', 'answerSos', ' inv')], ' zom'));
    if (zid === 'dorm') {
      const rows = Object.entries(BUILD_TEXT).map(([id, b]) => {
        const need = v.buildNeed[id].need;
        const ok = Object.entries(need).every(([k, n]) => (v.have[k] || 0) >= n);
        const needTxt = Object.entries(need).map(([k, n]) => `${iname(k)} ${Math.min(v.have[k] || 0, n)}/${n}`).join(' · ');
        return `<div class="brow${v.base[id] ? ' done' : ''}"><div><b>${esc(b.name)}</b><span>${esc(b.good)}</span><span class="dim">${v.base[id] ? '갖췄다' : `${esc(needTxt)} · 대가: ${esc(b.bad)}`}</span></div>${v.base[id] ? '<i>✓</i>' : `<button class="btn sm${ok ? ' inv' : ''}" data-cmd='${esc(JSON.stringify({ type: 'build', id }))}'${ok ? '' : ' disabled'}>만들기</button>`}</div>`;
      }).join('');
      const nb = Object.values(v.base).filter(Boolean).length;
      out.push(`<li class="nc thing fold"><button class="foldh" data-act="baseFold"><b>거점 정비</b><span>${nb}/5 갖춤</span><span class="gm">${this.baseOpen ? '▴' : '▾'}</span></button>${this.baseOpen ? `<div class="blist">${rows}</div>` : ''}</li>`);
      T('구호함', `${(v.zone.box || []).length}개 들어 있다`, [btn('열기', 'data-sheet="bag"')]);
      if (v.bcast && !m.listened) T('수신기', '방송이 나오고 있다', [cmd('끝까지 듣기', 'listen', ' inv')]);
      else T('수신기', '낮게 지직거린다', []);
      T('옥상 문', v.zone.door.locked ? '잠겨 있다' : '열려 있다', [cmd(v.zone.door.locked ? '열기' : '잠그기', v.zone.door.locked ? 'unlock' : 'lock'), cmd('두드리기', 'knock')]);
      T('침대', '', [cmd('쉬기', 'rest'), cmd('망보기', 'watch')]);
    }
    if (zid === 'roof') {
      const key = m.bag.some((i) => i.kind === 'key');
      T('옥상 문', v.zone.door.locked ? (key ? '잠겨 있다 · 열쇠가 있다' : '잠겨 있다') : '열려 있다', key ? [cmd(v.zone.door.locked ? '열쇠로 열기' : '잠그기', v.zone.door.locked ? 'unlock' : 'lock')] : [cmd('두드리기', 'knock')]);
      if (v.isDay) T('난간', '큰길과 뒷골목이 내려다보인다', [cmd('길 살피기', 'scout')]);
    }
    if (zid === 'market') T('가게들', '뒤질수록 더 나오지만 소리가 난다', [cmd('뒤지기', 'search', ' inv')]);
    if (zid === 'pump') {
      const jug = m.bag.find((i) => i.kind === 'jug');
      T('펌프', jug ? `물통 ${jug.left}/${v.cfg.jugCap}` : '물통이 있어야 한다', jug ? [cmd('반 채우기', { type: 'fill', amount: 'half' }), cmd('가득 채우기', { type: 'fill', amount: 'full' }, ' inv')] : []);
    }
    if (v.zone.floor.length) T('바닥', v.zone.floor.map((i) => iname(i.kind)).join(', '), [btn('줍기', 'data-sheet="bag"')]);
    return out.join('');
  },
  // 지금 당장 정해야 하는 것(좀비·막힘·붙잡음)만 띄운다
  renderPrompt(v) {
    const m = v.me, z = v.zone.zombie;
    if (!(z && z.st === 'warn')) this.warnMax = {};
    let html = '', danger = false;
    if (m.turned) html = '<p><b>감염 전환.</b> 이제 지켜볼 수 있다. 말은 신음으로만 나간다.</p>';
    else if (v.tug) {
      html = `<p><b>${esc(iname(v.tug.item))}</b>에 두 손이 동시에 닿았다.${v.tug.mine === 'keep' ? ' 놓지 않고 버틴다.' : ''}</p>
        <div class="row"><button class="btn" data-cmd="tugRelease">놓기</button><button class="btn" data-cmd="tugGive">건네기</button><button class="btn inv" data-cmd="tugKeep">계속 쥐기</button></div>`;
    } else if (m.task && m.task.blockedBy) {
      const what = m.task.kind === 'sign' ? '종이를 누르고 있다' : m.task.kind === 'move' ? '팔을 붙잡고 있다' : '문을 밀고 있다';
      html = `<p><b>${esc(j(m.task.blockedBy, '이'))}</b> ${what}.</p><div class="row"><button class="btn" data-cmd="yield">놓고 물러나기</button><button class="btn inv" data-cmd="pull">뿌리치기</button></div>`;
    } else if (m.blocking) {
      html = `<p>${esc(NAMES[m.blocking])}를 막고 있다. 시간은 계속 흐른다.</p><div class="row"><button class="btn" data-cmd="release">놓아 주기</button></div>`;
    } else if (z && z.st === 'warn') {
      danger = true;
      const parts = v.zone.exits.filter((e) => !e.why && !e.far).map((e) => `<button class="btn inv" data-move="${e.to}">${esc(j(ZONE_TEXT[e.to].short, '으로'))}</button>`);
      if (m.mobile && !m.heavy) parts.push('<button class="btn" data-cmd="push">밀어내기</button>', `<button class="btn${z.odds < 0.5 ? ' risk' : ''}" data-cmd="fight">맞서기 · ${oddsWord(z.odds)}</button>`);
      if (v.partner.rel === 'same' && m.mobile) parts.push(`<button class="btn" data-cmd="cover">${esc(NAMES[v.partner.role])} 엄호</button>`);
      if (m.task && m.autoGuard) parts.push(`<button class="btn risk" data-cmd="persist">${esc(TASK_TEXT[m.task.kind])} 계속 (위험)</button>`);
      const stance = m.stance === 'cover' ? '앞을 막아섰다 — 대신 노출된다.' : m.stance === 'persist' ? '하던 일을 계속한다 — 노출된다.' : !(m.task && ['fight', 'push', 'retreat', 'move'].includes(m.task.kind)) ? (m.stamina < 30 ? '가만히 있으면 몸을 낮춰 피한다 — 지쳐서 못 피할 수도 있다.' : '가만히 있으면 몸을 낮춰 피한다. 맞서다 밀리면 물릴 수 있다.') : '';
      this.warnMax = this.warnMax || {};
      const wk = z.id || 'z'; if (!this.warnMax[wk] || z.left > this.warnMax[wk]) this.warnMax[wk] = z.left;
      const pct = Math.round(Math.max(0, Math.min(1, z.left / this.warnMax[wk])) * 100);
      html = `<div class="at"><span>${esc(zlabel(z))} 몸을 낮춘다!</span><span class="sec">${secs(z.left)}초</span></div><div class="ab"><i style="width:${pct}%"></i></div><div class="row wrap">${parts.join('')}</div>${stance ? `<p class="dim">${stance}</p>` : ''}`;
    } else if (v.scene && v.scene.choice) {
      const S = SCENE_TEXT[v.scene.id], ch = v.scene.choice;
      if (ch.role === v.role) html = `<p class="sct">「${esc(S.title)}」</p><div class="col">${ch.opts.map((o) => `<button class="btn scb" data-cmd='${esc(JSON.stringify({ type: 'sceneChoice', id: o }))}'>${esc(S.opts[o])}</button>`).join('')}</div><p class="dim">고르지 않고 말을 걸어도 된다.</p>`;
      else html = `<div class="pline"><span>「${esc(S.title)}」 · ${esc(j(NAMES[ch.role], '이'))} 고르는 중</span></div>`;
    } else if (this.sheet && witness(v)) {
      html = `<div class="pline">${witnessHtml(witness(v))}</div>`;
    } else if (v.offer && !v.offer.mine) {
      const oc = (label, o2, cls = '') => `<button class="btn${cls}" data-cmd='${esc(JSON.stringify({ type: 'offerReply', ...o2 }))}'>${esc(label)}</button>`;
      if (v.offer.kind === 'meal' && v.offer.style === 'split') html = `<p><b>${esc(NAMES[v.partner.role])}</b>가 통조림을 먼저 두 몫으로 나눠 놓는다. 고르라는 듯이.</p><div class="row">${oc('거절', { yes: false })}${oc('왼쪽 몫', { yes: true, how: 'left' }, ' inv')}${oc('오른쪽 몫', { yes: true, how: 'right' }, ' inv')}</div>`;
      else if (v.offer.kind === 'meal') html = `<p><b>${esc(NAMES[v.partner.role])}</b>가 통조림을 내 쪽으로 밀어 둔다.</p><div class="row wrap">${oc('거절', { yes: false })}${oc('반을 덜어 돌려준다', { yes: true, how: 'half' })}${oc('그대로 받는다', { yes: true, how: 'take' }, ' inv')}</div>`;
      else html = `<p><b>${esc(NAMES[v.partner.role])}</b>가 ${esc(OFFER_TEXT[v.offer.kind])}.${v.offer.kind === 'care' && m.bite ? ' <span class="dim">(감으려면 소매를 걷어야 한다)</span>' : ''}</p><div class="row"><button class="btn" data-cmd='${esc(JSON.stringify({ type: 'offerReply', yes: false }))}'>거절</button><button class="btn inv" data-cmd='${esc(JSON.stringify({ type: 'offerReply', yes: true }))}'>받는다</button></div>`;
    } else if (v.offer && v.offer.mine) {
      html = `<div class="pline"><span>권했다 · ${esc(NAMES[v.partner.role])}의 대답을 기다리는 중</span></div>`;
    } else if (m.skipVote && v.skip) {
      html = `<div class="pline"><span>넘기자고 했다 · ${esc(NAMES[v.partner.role])}를 기다리는 중</span><button class="btn sm" data-cmd="skip">취소</button></div>`;
    }
    $('#prompt').hidden = !html;
    $('#prompt').classList.toggle('danger', danger);
    document.body.classList.toggle('sheet-open', !!this.sheet);
    document.body.classList.toggle('danger', danger);
    this.set('prompt', html);
    // 상대가 넘기자고 하면 확인창
    const vkey = v.skip && v.skip.partnerVote && !m.skipVote ? `${v.role}:${Math.round(v.skip.to)}` : null;
    const showVote = !!vkey && this.voteNo !== vkey;
    $('#vote').hidden = !showVote;
    if (showVote) this.set('vote', `<div class="dlg panel"><h2 class="tbar">다음 일로</h2><p>${esc(NAMES[v.partner.role])}가 ${clock(v.skip.to)}까지 시간을 넘기자고 한다.</p><p class="dim">넘기는 동안에도 쉬기와 감염 진행은 그대로 흐른다.</p><div class="row"><button class="btn" data-act="voteNo" data-k="${vkey}">아직</button><button class="btn inv" data-cmd="skip">넘어간다</button></div></div>`);
  },
  // ── 무대: 도트 장면 위로 스탠딩과 대사창(코코포리아식) ──
  stageEntries(v) {
    return v.log.filter((e) => /^(say|signal|sayRadio|signalRadio|sayGlass|signalGlass|emote\.|moan\.(self|same))/.test(e.key) || e.key === 'enter.self' || e.key === 'intro.self' || /^n[A-Z]/.test(e.key) || e.key === 'sc' || e.key === 'apronHang' || e.key === 'replayLine');
  },
  renderStage(v) {
    const key = v.role;
    this.dq = this.dq || {};
    const st = this.dq[key] || (this.dq[key] = { last: 0, queue: [], cur: null, at: 0 });
    const list = this.stageEntries(v);
    if (!st.last && list.length) { st.cur = list[list.length - 1]; st.last = st.cur.id; st.at = Date.now(); }
    for (const e of list) if (e.id > st.last) { st.queue.push(e); st.last = e.id; }
    const now = Date.now();
    if (st.queue.length && (!st.cur || now - st.at > 1800 || st.skip)) { st.cur = st.queue.shift(); st.at = now; st.skip = false; }
    const e = st.cur;
    if (!e) { this.set('dlg', ''); $('#dlg').hidden = true; this.set('tachie', ''); return; }
    const who = e.a && e.a.who;
    let name = '', text = '', cls = '', tag = '', tachieWho = null, face = null;
    if (e.key === 'say' || e.key === 'sayRadio') { name = NAMES[who]; text = e.key === 'sayRadio' && who !== v.role ? garble(e.a.text, e.id) : e.a.text; tachieWho = who; face = e.a.face; if (e.key === 'sayRadio') { cls = ' radio'; tag = '무전'; } }
    else if (e.key === 'signal' || e.key === 'signalRadio') { name = NAMES[who]; text = SIGNAL_TEXT[e.a.which]; tachieWho = who; tag = e.key === 'signalRadio' ? '무전' : '손짓'; }
    else if (e.key === 'sayGlass.self') { name = NAMES[who]; text = e.a.text; tachieWho = who; cls = ' muted'; tag = '유리 너머'; }
    else if (e.key === 'sayGlass.glass' || e.key === 'signalGlass') { name = NAMES[who]; text = e.key === 'signalGlass' ? `(손짓) ${SIGNAL_TEXT[e.a.which]}` : '……'; tachieWho = who; cls = ' muted'; tag = '창 너머'; }
    else if (e.key.startsWith('emote.')) { name = ''; text = fmt(e.key, e.a, v.role); cls = ' nar'; }
    else if (e.key.startsWith('moan.')) { name = `좀비(${NAMES[who]})`; text = e.a.text; cls = ' zom'; }
    else if (e.key === 'enter.self' && e.a.zone) { text = ZONE_TEXT[e.a.zone].look.replace(/\*\*/g, ''); cls = ' nar'; }
    else if (e.key === 'intro.self') { text = fmt(e.key, e.a, v.role); cls = ' nar'; }
    else if (e.key === 'sc') { text = sceneLine(e.a); if (who) { name = NAMES[who]; tachieWho = who; } else cls = ' nar'; }
    else if (e.key === 'replayLine') { name = NAMES[who]; text = garble(e.a.text, e.id, 34); tachieWho = who; cls = ' radio'; tag = '녹음'; }
    else if (e.key === 'apronHang') { text = fmt(e.key, e.a, v.role); cls = ' nar'; }
    else if (/^n[A-Z]/.test(e.key)) { text = fmt(e.key, e.a, v.role); cls = /^nSos/.test(e.key) ? ' radio nar' : ' nar'; }
    if (!st.queue.length && now - st.at > 15000) { $('#dlg').hidden = true; this.set('dlg', ''); this.set('tachie', ''); return; }
    const old = '';
    const more = st.queue.length ? `<span class="more">▶ ${st.queue.length}</span>` : '';
    $('#dlg').hidden = false;
    this.set('dlg', `<div class="dbox${cls}${old}">${name ? `<b class="dn">${esc(name)}${tag ? `<i>${esc(tag)}</i>` : ''}</b>` : ''}<p>${esc(text)}</p>${more}</div>`);
    this.set('tachie', tachieWho ? this.tachieHtml(tachieWho, face, tachieWho === v.role) : '');
  },
  // 새 기록을 보고 소리와 화면 반전을 낸다(처음 열 때 지난 기록은 울리지 않는다)
  cues(v) {
    this.cueLast = this.cueLast || {};
    const k = v.role, logs = v.log || [];
    const top = logs.length ? logs[logs.length - 1].id : 0;
    if (this.cueLast[k] == null) { this.cueLast[k] = top; this.phaseSeen = v.phase; return; }
    let snd = null, flash = false;
    for (const e of logs) {
      if (e.id <= this.cueLast[k]) continue;
      const key = e.key;
      if ((key === 'sayRadio' || key === 'signalRadio') && e.a.who !== v.role) snd = snd || 'radio';
      else if (key === 'replayLine' || key === 'bcastTail' || /^nSos/.test(key)) snd = snd || 'radio';
      else if (key.startsWith('knock.')) snd = snd || 'knock';
      else if (key.startsWith('lockDone.') || key.startsWith('unlockDone.')) snd = snd || 'latch';
      else if (key === 'paBusHere') snd = 'engineIn';
      else if (key === 'paBusGone' || key.startsWith('board.')) snd = 'engineOut';
      if (key === 'bite.self' || key.startsWith('turn.')) flash = true;
    }
    this.cueLast[k] = top;
    if (this.phaseSeen !== v.phase) {
      if (v.phase === 'result' && v.result && v.result.end && (v.result.end.reason === 'bus' || v.result.end.reason === 'stay')) { flash = true; snd = 'engineOut'; }
      this.phaseSeen = v.phase;
    }
    if (snd === 'radio') SFX.radio(); else if (snd === 'knock') SFX.knock(); else if (snd === 'latch') SFX.latch();
    else if (snd === 'engineIn') SFX.engine(false); else if (snd === 'engineOut') SFX.engine(true);
    const z = v.zone && v.zone.zombie;
    if (z && z.st === 'warn' && v.phase === 'play' && !v.paused) { const now = Date.now(); if (!this.pulseAt || now - this.pulseAt > 1000) { this.pulseAt = now; SFX.pulse(); } }
    if (flash && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      document.documentElement.classList.add('flash');
      clearTimeout(this.flashH); this.flashH = setTimeout(() => document.documentElement.classList.remove('flash'), 180);
    }
    const sb = $('#sndBtn'); if (sb) { const t = SFX.soundOn() ? '소리' : '무음'; if (sb.textContent !== t) { sb.textContent = t; sb.setAttribute('aria-pressed', String(SFX.soundOn())); } }
  },
  tachieHtml(who, face, mine) {
    const T = TACHIE[who] || {};
    const src = (face && T[face]) || T.기본 || AVATARS[who];
    const inner = src ? `<img src="${esc(src)}" alt="">` : `<svg viewBox="0 0 60 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><pattern id="dz" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#fff"/></pattern></defs><circle cx="30" cy="24" r="14" fill="#000" stroke="#fff" stroke-width="2"/><path d="M6 100 C6 60 16 44 30 44 C44 44 54 60 54 100 Z" fill="#000" stroke="#fff" stroke-width="2"/><path d="M8 100 C8 62 18 46 30 46 C42 46 52 62 52 100 Z" fill="url(#dz)" opacity=".5"/></svg>`;
    if (!src) return '';
    void inner;
    return `<div class="tc${mine ? ' mine' : ''}">${inner}</div>`;
  },
  renderQuick(v) {
    const out = [];
    if (this.sigOpen && v.channel !== 'none') for (const [k, t] of Object.entries(SIGNAL_TEXT)) out.push(`<button class="qc sig" data-sig="${k}">${esc(t)}</button>`);
    this.set('quick', out.join(''));
  },
  renderTask(v) {
    const t = v.me.task;
    let html = '';
    if (v.me.carrying) html = `<span class="cap">${esc(NAMES[v.me.carrying])}와 물통을 함께 드는 중</span><button class="btn sm" data-cmd="carryWith">손 떼기</button>`;
    else if (t && t.kind === 'help') html = `<span class="cap">${esc(NAMES[v.partner.role])}를 거드는 중</span><button class="btn sm" data-cmd="cancel">그만</button>`;
    else if (t && t.kind !== 'tug') {
      const name = TASK_TEXT[t.kind] + (t.to ? ` → ${zname(t.to)}` : '');
      const state = t.blockedBy ? ' (막힘)' : t.paused ? ' (멈춤)' : '';
      const bar = t.prog !== null ? `<span class="bar"><i style="width:${t.prog * 100}%"></i></span><span class="sec">${secs(t.left)}초</span>` : '';
      html = `<span class="cap">${esc(name)}${state}</span>${bar}<button class="btn sm" data-cmd="cancel">그만</button>`;
    } else if (v.me.asleep) html = '<span class="cap">잠든 중</span>';
    $('#task').hidden = !html;
    this.set('task', html);
  },
  renderInput(v) {
    const ch = v.channel;
    const label = { same: '곁', radio: '무전', glass: '창 너머', none: '닿지 않음' }[ch];
    const chanEl = $('#chan');
    const lab = ch === 'none' ? label : `${label} · 손짓`;
    if (chanEl.textContent !== lab) chanEl.textContent = lab;
    const cls = 'c-' + ch + (this.sigOpen ? ' on' : '');
    if (chanEl.className !== cls) chanEl.className = cls;
    chanEl.disabled = ch === 'none';
    if (ch === 'none') this.sigOpen = false;
    const input = $('#say'), btn = $('#sayBtn');
    if (input.disabled) { input.disabled = false; btn.disabled = false; }
    const ph = ch === 'none' ? '말은 닿지 않는다 · *행동*은 쓸 수 있다' : ch === 'glass' ? '입 모양만 보인다 · *행동*은 보인다' : ch === 'radio' ? '무전으로 말하기 · *행동*은 별표로' : '말하기 · *행동*은 별표로';
    if (input.placeholder !== ph) input.placeholder = ph;
  },
  // 시트
  open(name) { this.sheet = name; this.markTools(); this.sel = null; this.prev.sheetBody = null; $('#sheet').hidden = false; this.renderSheet(this.view()); if (name === 'talk') setTimeout(() => { const el = $('#sheetBody'); if (el) el.scrollTop = el.scrollHeight; }, 30); },
  markTools() { document.querySelectorAll('.tb').forEach((b) => b.classList.toggle('on', b.dataset.sheet === this.sheet)); },
  close() { this.sheet = null; this.markTools(); $('#sheet').hidden = true; this.prev.sheetBody = null; },
  renderSheet(v) {
    if (!v) return;
    const titles = { near: '주변', status: '상태', route: '어느 길로 갈까', goals: '할 일', act: '행동', bag: '가방', talk: '쪽지 · 지난 대화', log: '일지 · 기록', map: '지도', menu: '메뉴', dev: '시험 도구' };
    this.set('sheetTitle', titles[this.sheet] || '');
    const body = this['sheet_' + this.sheet](v);
    if (this.sheet === 'talk') { this.set('sheetBody', body.top); this.set('sheetFoot', body.foot); }
    else { this.set('sheetBody', body); this.set('sheetFoot', ''); }
    if (this.sheet === 'log') { const el = $('#sheetBody'); if (el && !this.logScrolled) { el.scrollTop = el.scrollHeight; this.logScrolled = true; } }
  },
  sheet_route(v) {
    const sc = v.me.scouted;
    const slow = v.me.heavy && !v.me.carryHelp ? 1.6 : 1;
    const rate = (v.isDay ? 2.5 : 6) * slow;
    const known = (k) => rv(sc, k) ? `${rv(sc, k) === 'crowd' ? '무리가 몰려 있다' : '조용하다'} (${clock(rvt(sc, k))}에 봄)` : '오늘 상태 모름';
    const zid = v.zone.id, U = v.under || {};
    const canUnder = U.knows && U.open;
    const now = clockMin(v.t), close = 17 * 60;
    const hm = (m) => { const x = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
    // 돌아오는 시각: 나가는 길이면 가장 빠른 길로 돌아오는 것까지 더한다
    const eta = (go, back) => { const at = now + go + (back || 0); const left = close - at; return `${back ? '왕복 최소' : '도착'} ${hm(at)}${v.isDay && now < close ? (left >= 0 ? ` · 17:00 마감까지 ${Math.round(left)}분 남음` : ' · 17:00 마감을 넘긴다') : ''}`; };
    const NOTE = {
      main: { risk: '무리가 붙으면 검문대 앞까지 끌고 온다. 처마 밑, 숙직실 창밖까지 따라올 수 있다.', gain: '빠르다 · 무전 닿음', info: known('main') },
      alley: { risk: '춥고 더 지친다. 늦으면 검문 마감에 걸려 옥상으로 돌아야 한다.', gain: '조용하다 · 무전 닿음 · 샛길에서 물자를 줍기도 한다', info: known('alley') },
      under: { risk: '무전이 끊긴다. 상대가 살았는지 알 수 없다. 조명이 없으면 어둠 속에서 물린다.', gain: '검문·17:00 마감과 상관없다 · 그날 처음 가면 핵심 물자', info: v.have && v.have.light ? '휴대 조명이 있다' : '조명 없음' },
    };
    const row = (to, k, go, back) => `<button class="li rt" data-cmd='${esc(JSON.stringify({ type: 'move', to, route: k }))}'><span><b>${esc(ROUTE_TEXT[k])}</b> — ${dur(go * slow)} (실제 약 ${Math.round(go * rate)}초)</span><span class="dim">${esc(NOTE[k].gain)}</span><span class="dim">감수할 것: ${esc(NOTE[k].risk)}</span><span class="dim">${esc(NOTE[k].info)} · ${esc(eta(go * slow, back))}</span></button>`;
    const D = v.cfg.routeDur, UD = U.dur || {};
    const parts = [];
    if (zid === 'checkpoint') for (const d of ['market', 'pump']) parts.push(`<div class="sh">${esc(zname(d))}으로</div><div class="list">${row(d, 'main', D[d].main, D[d].main)}${row(d, 'alley', D[d].alley, D[d].main)}</div>`);
    if (zid === 'market' || zid === 'pump') parts.push(`<div class="sh">돌아가기</div><div class="list">${row('checkpoint', 'main', D[zid].main)}${row('checkpoint', 'alley', D[zid].alley)}${canUnder ? row('dorm', 'under', UD[zid]) : ''}</div>`);
    if (zid === 'dorm' && canUnder) for (const d of ['market', 'pump']) parts.push(`<div class="sh">보일러실 계단 → ${esc(zname(d))}</div><div class="list">${row(d, 'under', UD[d], UD[d])}</div>`);
    return `<p class="dim" style="margin:0 0 8px">길마다 치르는 값이 다르다. 길 상태는 낮 동안 바뀐다.${v.isDay ? '' : ' 밤길은 위험하다.'}${slow > 1 ? ' 물통이 무거워 느리다.' : ''}</p>${parts.join('')}`;
  },
  sheet_status(v) { return this.statusHtml(v); },
  sheet_goals(v) {
    const g = goalsOf(v, this);
    const hl = this.hintNow && this.hintNow.text ? `<p class="hintline">${esc(this.hintNow.text)}</p>` : '';
    const row = (it) => `<div class="gl${it.done ? ' done' : ''}"><span class="gx">${it.done ? '✓' : it.opt ? '·' : '□'}</span><div><b>${esc(it.t)}</b>${it.d ? `<div class="dim">${esc(it.d)}</div>` : ''}</div></div>`;
    const led = busWindow(v) || v.t < v.busAt ? `<div class="sh">3일째 05:00 이송 차량 — 탈까, 보낼까</div>${ledgerHtml(v)}` : '';
    return `${hl}${led}<div class="list gls">${g.list.map(row).join('')}</div>
      ${g.bite ? `<div class="sh">물렸다면</div><div class="list gls">${g.bite.map(row).join('')}</div>` : ''}
      <div class="sh">조작</div>
      <ul class="howto"><li><b>나침반</b> — 옆 구역으로 이동. 빗금 친 칸은 지금 못 감.</li><li><b>탐색</b> — 이 구역을 뒤져 숨은 물건을 찾는다.</li><li><b>행동</b> — 검사·서명·문 잠그기·쉬기·망보기.</li><li><b>가방</b> — 물건 쓰기·건네기·창틀에 두기·구호함.</li><li><b>대화창</b> — 같은 곳이면 말, 창 너머면 손짓만, 무전이 있으면 멀리서도.</li><li>시간은 계속 흐른다. 아무것도 안 누르면 그 자리에 머문다.</li></ul>
      <div class="row"><button class="btn sm" data-act="hints">${this.hints ? '힌트 끄기' : '힌트 켜기'}</button></div>`;
  },
  sheet_act(v) {
    const m = v.me, z = v.zone.id, rows = [];
    const row = (cmd, label, hint, extra = '') => rows.push(`<button class="li" data-cmd='${esc(JSON.stringify(cmd))}'><span>${esc(label)}</span><span class="dim">${esc(hint)}</span>${extra}</button>`);
    const dur = (k) => `${secs(CFG.DUR[k])}초`;
    row({ type: 'search' }, '주변 탐색', '이 구역을 뒤져 숨은 물건을 찾는다');
    if (z === 'checkpoint') {
      if (!m.passed && v.checkpointOpen) row({ type: 'inspect' }, '검사 받기', `소매를 걷어 보인다 · ${dur('inspect')}`);
      if (m.passed && !m.signed && v.checkpointOpen) row({ type: 'sign' }, '이송 명단에 서명', `되돌릴 수 없음 · ${dur('sign')}`);
    }
    if (z === 'dorm' || z === 'roof') {
      const hasKey = m.bag.some((i) => i.kind === 'key');
      if (z === 'dorm' || hasKey) row({ type: v.zone.door.locked ? 'unlock' : 'lock' }, v.zone.door.locked ? '옥상 문 열기' : '옥상 문 잠그기', z === 'roof' ? '열쇠 사용' : '안쪽 걸쇠');
    }
    if ((z === 'roof' || z === 'checkpoint') && v.isDay) row({ type: 'scout' }, z === 'roof' ? '길 살피기 (큰길·뒷골목)' : '큰길 살피기', `오늘 어느 길에 무리가 있는지 · ${dur(CFG.DUR.scout)}`);
    if (z === 'checkpoint' && v.busHere) row({ type: 'board' }, '이송 차량 타기', '이송증 · 재검사 · 타면 여기서 끝');
    if (z === 'eaves' && !m.pipe) row({ type: 'pipe' }, '배수관 뒤 확인', `외벽 배수관 · ${dur('pipe')}`);
    if (v.bcast && !m.listened) row({ type: 'listen' }, '방송 끝까지 듣기', `${secs(CFG.LISTEN)}초 · 자리를 뜨면 놓친다`);
    if (v.skip) row({ type: 'skip' }, m.skipVote ? '시간 넘기기 취소' : '다음 일까지 시간 넘기기', `${clock(v.skip.to)}까지 · 둘 다 눌러야 넘어간다`);
    if (!(v.partner.rel === 'same' && v.partner.zone)) row({ type: 'shout' }, `${NAMES[v.partner.role]} 부르기`, '크게 부른다 · 옆 구역까지 들린다 · 소음');
    if (z === 'dorm') row({ type: 'watch' }, '망보기', '깨어서 지킨다 · 상대의 잠이 깊어진다');
    row({ type: 'rest' }, '쉬기', z === 'dorm' ? '눈을 붙인다 · 기력 회복' : '잠깐 숨을 돌린다');
    if (m.bite) {
      row({ type: 'showWound' }, '상처 보여 주기', '같은 곳이나 창 너머에서 보인다');
      if (!m.sleeveDown) row({ type: 'sleeve' }, '소매 내리기', '피 묻은 소매를 덮는다');
    }
    if (z === 'eaves' || z === 'dorm') row({ type: 'knock' }, '창 두드리기', '소리가 난다');
    if (z === 'roof' || z === 'dorm') row({ type: 'knock' }, '옥상 문 두드리기', '소리가 난다');
    if (v.partner.rel === 'same' && (v.partner.down || m.supporting)) row({ type: 'support' }, m.supporting ? '부축 그만' : `${NAMES[v.partner.role]} 부축하기`, '함께 이동 · 느려짐');
    rows.push(`<button class="li" data-sheet="talk"><span>쪽지 쓰기</span><span class="dim">쪽지 탭에서</span></button>`);
    return `<div class="list">${rows.join('')}</div>`;
  },
  sheet_bag(v) {
    const m = v.me, sec = [];
    const partnerHere = v.partner.rel === 'same';
    const itemRow = (it, where) => {
      const t = ITEM_TEXT[it.kind] || { name: it.kind, desc: '' };
      let desc = t.desc;
      if (it.kind === 'note' && it.text) desc = `“${it.text}” — ${NAMES[it.by]}`;
      if (it.kind === 'result' && it.res) desc = `${NAMES[it.owner]}: ${RESULT_TEXT[it.res]}`;
      if (it.kind === 'pass' && it.name) desc = `${NAMES[it.name]} 명의`;
      if (it.kind === 'radio' && it.charge != null) desc = `충전 ${it.charge}%${it.charge <= 0 ? ' · 꺼짐 — 배터리나 충전기' : ''}`;
      if (it.kind === 'jug') desc = `물 ${it.left}/${v.cfg.jugCap}${it.left >= v.cfg.heavy ? ' · 무거움' : ''} · 가방 2칸`;
      if (it.hid) desc = '(내가 숨겨 둔 것) ' + desc;
      const open = this.sel === it.id;
      let acts = '';
      if (open) {
        const b = [];
        if (where === 'bag') {
          const use = ITEM_USE[it.kind];
          if (use === 'diagnose') { b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'use', item: it.id })}'>혼자 보기</button>`); if (partnerHere) b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'use', item: it.id, share: true })}'>같이 보기</button>`); }
          else if (use === 'fixRadio') b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'use', item: it.id })}'>무전기 고치기</button>`);
          else if (use) b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'use', item: it.id })}'>쓰기</button>`);
          if (partnerHere) b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'give', item: it.id })}'>${esc(NAMES[v.partner.role])}에게 건네기</button>`);
          if (v.zone.sill) b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'sill', item: it.id })}'>창틀에 두기</button>`);
          if (v.zone.box) b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'stash', item: it.id })}'>구호함에</button>`);
          if (it.kind === 'jug' && v.zone.id === 'pump') { if (it.left < 3) b.push(`<button class="btn sm inv" data-cmd='${JSON.stringify({ type: 'fill', amount: 'half' })}'>반 채우기</button>`); b.push(`<button class="btn sm inv" data-cmd='${JSON.stringify({ type: 'fill', amount: 'full' })}'>가득 채우기</button>`); }
          if (v.zone.id !== 'dorm') b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'hide', item: it.id })}'>숨기기</button>`);
          b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'drop', item: it.id })}'>내려놓기</button>`);
        } else b.push(`<button class="btn sm" data-cmd='${JSON.stringify({ type: 'pick', item: it.id })}'>${where === 'box' ? '꺼내기' : where === 'sill' ? '가져오기' : '집기'}</button>`);
        acts = `<div class="acts">${b.join('')}</div>`;
      }
      return `<div class="it${open ? ' open' : ''}"><button class="ih" data-sel="${it.id}"><span class="tile"><span>${esc(t.name.slice(0, 1))}</span></span><span class="nm">${esc(t.name)}</span><span class="dim">${esc(desc)}</span></button>${acts}</div>`;
    };
    const section = (title, arr, where) => sec.push(`<div class="sh">${title}</div>${arr.length ? arr.map((i) => itemRow(i, where)).join('') : '<div class="empty dim">비어 있다</div>'}`);
    section('내 가방', m.bag, 'bag');
    section('이곳 바닥', v.zone.floor, 'floor');
    if (v.zone.box) section('구호함', v.zone.box, 'box');
    if (v.zone.sill) section('창틀', v.zone.sill, 'sill');
    return sec.join('');
  },
  sheet_talk(v) {
    const chats = v.log.filter(isChat)
      .map((e) => `<li class="k-${e.k}">${clock(e.t)} ${esc(fmt(e.key, e.a, v.role))}</li>`).join('');
    return {
      top: `<div class="sh">지금까지 나눈 말</div><ul class="chat">${chats || '<li class="dim">아직 아무 말도 없었다.</li>'}</ul>`,
      foot: `<div class="sh">쪽지</div><p class="dim" style="margin:2px 0 0;font-size:13px">말이 닿지 않을 때. 가방에 들어가고, 내려놓거나 창틀에 두거나 건넬 수 있다.</p>
        <form id="noteForm" class="say"><input id="note" maxlength="120" autocomplete="off" placeholder="쪽지 내용 (${secs(CFG.DUR.note)}초)"><button class="btn">쪽지 쓰기</button></form>`,
    };
  },
  sheet_log(v) {
    const tag = { self: '나', see: '봄', hear: '들음', radio: '무전', pa: '안내', chat: '말' };
    const entry = (e) => `<div class="de"><b>${e.day}일째${e.last ? ' (마지막 날)' : ''}</b>${(e.feats || []).map((f) => `<div class="ft">${esc(featText(f))}</div>`).join('')}${['ren', 'akechi'].map((q) => (e.picks[q] || e.lines[q]) ? `<div><span class="dn">${esc(NAMES[q])}</span> ${e.picks[q] ? `<i>${esc(fmt(e.picks[q].type + '.same', e.picks[q].a, '_'))}</i>` : ''}${e.lines[q] ? ` “${esc(e.lines[q])}”` : ''}</div>` : '').join('')}</div>`;
    const diary = v.diary && v.diary.length ? v.diary.map(entry).join('') : '<p class="dim">아침 점검 때 어제의 장면과 한 줄을 남기면 여기에 쌓인다.</p>';
    const arch = v.archive && v.archive.length ? `<div class="sh">지난 판</div>${v.archive.slice().reverse().map((run) => `<details class="run"><summary>${run.days}일 버팀 · ${esc(RESULT_CARD.ends[run.reason] || '')}${run.totals && run.totals.trips ? ` · 물 ${run.totals.water} 길어 옴` : ''}</summary>${run.diary.map(entry).join('')}</details>`).join('')}` : '';
    return `<div class="sh">생존일지</div>${diary}${arch}<div class="sh">기록</div><ul class="log">${v.log.map((e) => `<li class="k-${e.k}"><span class="lt">${clock(e.t)}</span><span class="lk">${tag[e.k] || ''}</span><span>${esc(fmt(e.key, e.a, v.role))}</span></li>`).join('')}</ul>`;
  },
  sheet_map(v) {
    const p = v.partner, me = v.me;
    const where = p.zone ? `${zname(p.zone)} · ${p.rel === 'same' ? '같은 곳' : '창 너머'}` : `안 보인다 · 마지막 ${zname(p.lastSeen.zone)} ${clock(p.lastSeen.t)}`;
    const marksAt = (z) => me.marks.map((m, i) => ({ m, i })).filter((x) => x.m.zone === z);
    const exOf = (z) => v.zone.exits.find((e) => e.to === z);
    const sub = (z) => {
      if (me.zone === z) return '지금 여기';
      const ex = exOf(z);
      if (!ex) return '바로 못 감';
      if (ex.why) return WHY[ex.why];
      if (!me.mobile) return '못 움직임';
      return ex.far ? '길 고르기' : `${dur(CFG.DUR.move)}`;
    };
    const cell = (z) => {
      const ex = exOf(z), can = ex && !ex.why && me.mobile, here = me.zone === z;
      const who = `${here ? '<i class="pp me">나</i>' : ''}${p.zone === z ? `<i class="pp">${esc(NAMES[p.role])}</i>` : ''}`;
      const mk = marksAt(z).map((x) => `<button class="mk" data-cmd='${esc(JSON.stringify({ type: 'unmark', i: x.i }))}' title="지우기">${esc(markLabel(x.m))} ×</button>`).join('');
      return `<div class="mz mz-${z}${here ? ' here' : ''}${can ? ' can' : ''}${ex && ex.why ? ' shut' : ''}"${can ? ` data-move="${z}" role="button" tabindex="0"` : ''}><div class="mzt"><b>${esc(ZONE_TEXT[z].name)}</b>${who}</div><span class="mzs">${esc(sub(z))}${can ? ' ▸' : ''}</span>${mk ? `<div class="mks">${mk}</div>` : ''}</div>`;
    };
    const sc = me.scouted;
    const rs = (k) => (rv(sc, k) ? `${rv(sc, k) === 'crowd' ? '무리' : '조용'} ${clock(rvt(sc, k))}` : '모름');
    const tags = ['water', 'supply', 'crowd', 'danger', 'wait'];
    const zOpts = ['eaves', 'checkpoint', 'roof', 'dorm', 'market', 'pump'];
    const markZone = this.markZone || me.zone;
    const info = [[NAMES[p.role], where], ['큰길', rs('main')], ['뒷골목', rs('alley')], ['옥상 문', v.zone.door ? (v.zone.door.locked ? '잠김' : '열림') : '여기선 모름'], ['검문', v.checkpointOpen ? '열림' : '닫힘']];
    return `<div class="mapg">
        <div class="mrow">${cell('roof')}</div>
        <div class="mlink" aria-hidden="true"><i></i><i></i></div>
        <div class="mrow two">${cell('eaves')}<span class="mglass" aria-hidden="true">창</span>${cell('dorm')}</div>
        <div class="mlink" aria-hidden="true"><i></i><i></i></div>
        <div class="mrow">${cell('checkpoint')}</div>
        <div class="mlink far" aria-hidden="true"><i></i><i></i></div>
        <div class="mrow two">${cell('market')}${cell('pump')}</div>
      </div>
      <dl class="minfo">${info.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
      ${p.rel === 'same' && p.zone ? '<button class="btn sm" data-cmd="shareMap" style="width:100%">지도 함께 펴기 · 서로 본 길과 표시를 합친다</button>' : '<p class="dim" style="margin:0;font-size:12px">곁에 있으면 지도를 함께 펴서 본 것을 합칠 수 있다.</p>'}
      <details class="mmark"><summary>표시 남기기</summary>
      <div class="row wrap">${zOpts.map((z) => `<button class="btn sm${z === markZone ? ' inv' : ''}" data-mz="${z}">${esc(ZONE_TEXT[z].short)}</button>`).join('')}</div>
      <div class="row wrap">${tags.map((t) => `<button class="btn sm" data-cmd='${esc(JSON.stringify({ type: 'mark', zone: markZone, tag: t }))}'>${esc(MARK_TEXT[t])}</button>`).join('')}</div>
      <form id="markForm" class="say"><input id="markText" maxlength="20" autocomplete="off" placeholder="${esc(ZONE_TEXT[markZone].short)}에 직접 쓰기"><button class="btn">남기기</button></form></details>`;
  },
  // ── 주변: 따로 연 시트(탭 대신) ──
  sheet_near(v) { return `<ol class="nearlist">${this.nearHtml(v)}</ol>`; },

  sheet_menu() {
    return `<div class="list"><button class="li" data-sheet="log"><span>기록</span><span class="dim">본 것 · 들은 것 · 무전</span></button>
      <button class="li" data-sheet="map"><span>지도</span><span class="dim">구역과 마지막으로 본 곳</span></button>
      ${this.host.local || (this.view() && this.view().dev) ? '<button class="li" data-sheet="dev"><span>시험 도구</span><span class="dim">속도 · 물림 결과 고정</span></button>' : ''}
      <button class="li" data-act="home"><span>처음 화면으로</span><span class="dim">${this.host.local ? '진행은 저장된다' : '방은 그대로 남는다'}</span></button></div>`;
  },
  sheet_dev(v) {
    const modes = { random: '무작위', prog: '진행성 고정', non: '비진행성 고정', none: '물림 없음' };
    return `<div class="sh">속도</div><div class="row wrap">${[1, 4, 10].map((x) => `<button class="btn sm${v.speed === x ? ' inv' : ''}" data-dev='{"op":"speed","v":${x}}'>×${x}</button>`).join('')}<button class="btn sm" data-dev='{"op":"pause"}'>${v.paused ? '재개' : '정지'}</button></div>
      <div class="sh">물림 결과</div><div class="row wrap">${Object.entries(modes).map(([k, t]) => `<button class="btn sm${v.biteMode === k ? ' inv' : ''}" data-dev='{"op":"biteMode","v":"${k}"}'>${t}</button>`).join('')}</div>
      <div class="sh">시간 이동</div><div class="row wrap">${[[145, '1일 00:25'], [205, '1일 01:25'], [470, '2일 05:50'], [840, '2일 12:00'], [1060, '2일 17:40'], [1850, '3일 04:50']].map(([t, l]) => `<button class="btn sm" data-dev='{"op":"jump","t":${t}}'>${l}</button>`).join('')}</div>
      <div class="sh">사건</div><div class="row wrap"><button class="btn sm" data-dev='{"op":"spawn","zone":"${v.me.zone}"}'>여기에 좀비</button><button class="btn sm" data-dev='{"op":"end"}'>밤 끝내기</button>${this.host.local ? '<button class="btn sm" data-act="restart">새 판</button>' : ''}</div>
      <p class="dim">새벽 판정 미리보기(${esc(NAMES[v.role])}): ${esc(RESULT_CARD.dawn[v.devInfo ? v.devInfo.dawn : 'normal'])} · 열쇠 위치: ${esc(zname(v.devInfo ? v.devInfo.keyAt : ''))}</p>`;
  },
  prologuePages(role) {
    return [{ t: 'title' }, ...PROLOGUE.shared.map((x) => ({ t: 'text', x, tag: PROLOGUE.tagShared })),
      ...PROLOGUE[role].map((x) => ({ t: 'text', x, tag: NAMES[role] })), { t: 'text', x: PROLOGUE.secret[role] + '\n\n' + PROLOGUE.secretNote, tag: PROLOGUE.tagSecret, secret: true }, { t: 'pick' }];
  },
  renderPrologue(v) {
    const role = v.role, pages = this.prologuePages(role);
    const idx = Math.max(0, Math.min(this.page[role] || 0, pages.length - 1));
    const lines = (x) => x.split('\n').map((l) => `<span>${esc(l)}</span>`).join('');
    const tabs = this.host.local ? `<div class="ptabs">${['ren', 'akechi'].map((r) => `<button class="tab${r === this.role ? ' on' : ''}" data-role="${r}">${NAMES[r]}${this.host.view(r).prologue && this.host.view(r).prologue.ready ? ' ✓' : ''}</button>`).join('')}</div>` : '';
    let body;
    if (v.prologue.ready) {
      body = `<div class="pg wait"><p class="pt">${lines(PROLOGUE.arrive)}</p><p class="dim">${v.prologue.partnerReady ? PROLOGUE.starting : esc(j(NAMES[v.partner.role], '이') + ' ' + PROLOGUE.waiting)}</p></div>`;
    } else {
      const pg = pages[idx];
      const dots = `<div class="pdots">${pages.map((_, i) => `<i class="${i === idx ? 'on' : ''}"></i>`).join('')}</div>`;
      const nav = `<div class="pnav"><button class="btn sm" data-pg="-1"${idx === 0 ? ' disabled' : ''}>이전</button>${dots}${pg.t === 'pick' ? '<span></span>' : '<button class="btn sm inv" data-pg="1">다음</button>'}</div>`;
      if (pg.t === 'title') body = `<div class="pg title" data-pg="1"><canvas id="pcv" width="${W}" height="${H}"></canvas><h1>${esc(PROLOGUE.title)}</h1><p class="dim">${esc(PROLOGUE.sub)}</p><p class="tapme">눌러서 넘기기</p></div>${nav}`;
      else if (pg.t === 'text') body = `<div class="pg${pg.secret ? ' secret' : ''}" data-pg="1"><span class="ptag">${esc(pg.tag)}</span><p class="pt">${lines(pg.x)}</p></div>${nav}`;
      else {
        const cur = this.pick[role] || 'light';
        body = `<div class="pg pick"><p class="pt">${lines(PROLOGUE.arrive)}</p><div class="sh">${esc(PROLOGUE.pickTitle)}</div>
          <div class="list">${Object.entries(PROLOGUE.picks).map(([k, t]) => `<button class="li${cur === k ? ' sel' : ''}" data-ppick="${k}"><span>${esc(t.split(' — ')[0])}</span><span class="dim">${esc(t.split(' — ')[1] || '')}</span></button>`).join('')}</div>
          <div class="sh">${esc(PROLOGUE.lineLabel)}</div><input id="firstLine" maxlength="80" autocomplete="off" placeholder="예: 들어가자. 여긴 춥다.">
          <button class="btn inv go" data-act="ready">${esc(PROLOGUE.go)}</button></div>${nav}`;
      }
    }
    this.set('prologueBody', tabs + body);
    const cv = $('#pcv');
    if (cv && !cv.dataset.drawn) { cv.getContext('2d').drawImage(background('roof'), 0, 0); cv.dataset.drawn = '1'; }
    const inp = $('#firstLine');
    if (inp && document.activeElement !== inp && inp.value !== (this.line[role] || '')) inp.value = this.line[role] || '';
  },
  renderMorning(v) {
    const mo = v.morning; if (!mo) return;
    const src = (x, what) => x === 'bag' ? `${what}: 가방에서` : x === 'stock' ? `${what}: 숙직실 비축분에서` : `${what}: 없었다`;
    const tabs = this.host.local ? `<div class="ptabs">${['ren', 'akechi'].map((r) => `<button class="tab${r === this.role ? ' on' : ''}" data-role="${r}">${NAMES[r]}${this.host.view(r).morning && this.host.view(r).morning.ready ? ' ✓' : ''}</button>`).join('')}</div>` : '';
    const lines = [src(mo.mine.water, '물'), src(mo.mine.food, '식량')];
    const warn = [];
    if (mo.thirst) warn.push(`갈증 ${mo.thirst}일째 — 기력 상한이 줄었다${mo.thirst >= 2 ? ', 몸이 상하기 시작했다' : ''}`);
    if (mo.hunger) warn.push(`허기 ${mo.hunger}일째 — 기력 상한이 줄었다`);
    if (mo.mine.hp < 0) warn.push(`체력 ${mo.mine.hp}`);
    const stock = mo.stock ? `숙직실 비축: 물 ${mo.stock.water} · 식량 ${mo.stock.food}<br><span class="dim">내일 아침 둘이 필요한 양: 물 2 · 식량 2</span>` : '숙직실 밖에서 아침을 맞았다. 비축분은 모른다.';
    const pick = this.dpick[v.role] ?? -1;
    const last = v.diary && v.diary[v.diary.length - 1];
    const prevLines = last && (last.lines.ren || last.lines.akechi) ? `<p style="margin:0 0 6px">${['ren', 'akechi'].filter((q) => last.lines[q]).map((q) => `<span class="dn">${esc(NAMES[q])}</span> “${esc(last.lines[q])}”`).join('<br>')}</p><p class="dim" style="margin:0 0 6px">${last.day}일째에 남긴 말. 답해도 된다.</p>` : '';
    const body = mo.ready
      ? `<div class="pg wait"><p class="pt"><span>${mo.day}일째 아침.</span></p><p class="dim">${mo.partnerReady ? '곧 시작된다.' : esc(j(NAMES[v.partner.role], '이') + ' 아직 아침을 확인하는 중이다…')}</p></div>`
      : `<div class="pg pick"><span class="ptag">${mo.day}일째 아침 06:00</span>
        <div class="sh">아침 점검</div><p class="pt" style="font-size:16px">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</p>
        ${warn.length ? `<p class="pt" style="font-size:14px">${warn.map((l) => `<span>· ${esc(l)}</span>`).join('')}</p>` : ''}
        <div class="sh">비축</div><p style="margin:0">${stock}</p>${(mo.made || []).length ? `<p class="dim" style="margin:4px 0 0">${mo.made.map((x) => x === 'water' ? '정수 통: 물 1이 생겼다' : x === 'charge' ? '충전기: 무전기가 꽉 찼다' : '벽 지도: 둘의 표시를 합쳤다').join(' · ')}</p>` : ''}
        ${mo.day === 2 ? `<div class="sh">내일 05:00 이송 차량</div>${ledgerHtml(v)}` : ''}
        <div class="sh">오늘</div><p class="dim" style="margin:0">검문 07:00–17:00 (들어올 때 다시 검사) · 해 질 녘 18:00 · 상점가는 검문대 남쪽<br>${mo.day === 2 ? '이송 차량은 내일(3일째) 05:00, 검문대 앞.' : '이송 차량은 떠났다. 이제 버티는 날을 센다.'}</p>
        <div class="sh">생존일지 — 어제</div>
        ${prevLines}
        ${(mo.feats || []).length ? `<div class="feats">${mo.feats.map((f) => `<div>· ${esc(featText(f))}</div>`).join('')}</div>` : ''}
        ${mo.moments.length ? `<p class="dim" style="margin:0">어제 둘이 함께 본 장면 하나 (선택)</p><div class="list">${mo.moments.map((mm, i) => `<button class="li${pick === i ? ' sel' : ''}" data-dpick="${i}"><span>${esc(fmt(mm.type + '.same', mm.a, '_'))}</span><span class="dim">${clock(mm.t)}</span></button>`).join('')}</div>` : '<p class="dim" style="margin:0">어제는 둘이 함께 본 장면이 없었다.</p>'}
        <input id="diaryLine" maxlength="80" autocomplete="off" placeholder="한 줄 남기기 (선택)">
        <button class="btn inv go" data-act="startDay">하루 시작</button></div>`;
    this.set('prologueBody', tabs + body);
    const dl = $('#diaryLine'); if (dl && document.activeElement !== dl && dl.value !== (this.dline[v.role] || '')) dl.value = this.dline[v.role] || '';
  },
  renderResult(v) {
    const c = v.result;
    const row = (r) => {
      const p = c.players[r];
      const st = [RESULT_CARD.fate[p.fate], zname(p.zone)];
      if (p.signed) st.push(RESULT_CARD.signed);
      let priv = '';
      if (p.private) {
        const b = p.private;
        priv = `<div class="dim">${b.bitten ? `물림 · ${b.known ? (b.prog ? '진행성' : '비진행성') : '경과 확인 안 함'}${b.suppressed ? ' · 억제' : ''}` : '물림 없음'} · ${esc(RESULT_CARD.dawn[b.dawn])}${r !== v.role ? ' (공개함)' : p.disclosed ? ' (공개 중)' : ' (나만 봄)'}</div>`;
      }
      const ep = c.epilogue[r] ? `<div class="ep">“${esc(c.epilogue[r])}”</div>` : '';
      return `<div class="rc"><div class="rn">${esc(NAMES[r])}</div><div>${esc(st.join(' · '))}</div>${priv}${ep}</div>`;
    };
    const give = c.lastGive ? `${NAMES[c.lastGive.from]} → ${NAMES[c.lastGive.to]} · ${iname(c.lastGive.item)} (${clock(c.lastGive.t)})` : RESULT_CARD.noGive;
    const shared = c.shared ? `${fmt(c.shared.type + '.same', c.shared.a, '_')} (${clock(c.shared.t)})` : RESULT_CARD.noShared;
    const mine = c.players[v.role];
    const e = c.end || {};
    const head = `<div class="rt">${e.day || 1}일째 — ${esc(RESULT_CARD.ends[e.reason] || RESULT_CARD.title)}</div><p class="dim" style="margin:0 0 8px">${e.reason === 'death' ? esc(j(NAMES[e.who], '을') + ' 잃었다.') : ''} 버틴 날: ${e.day || 1}일</p>`;
    const T = c.totals || {}, Lf = c.left || { water: 0, food: 0 };
    const more = Math.floor(Math.min(Lf.water, Lf.food) / 2);
    const leaveLine = e.reason === 'bus' ? `숙직실에 물 ${Lf.water} · 식량 ${Lf.food}을 남기고 떠났다.${more ? ` 남았다면 둘이 아침을 ${more}번 더 먹을 수 있었다.` : ''}` : `남은 비축: 물 ${Lf.water} · 식량 ${Lf.food}`;
    const earned = `<div class="sh">둘이 해낸 일</div><p style="margin:0 0 4px">${T.trips ? `길어 온 물 ${T.water} · 가져온 식량 ${T.food} · 원정 ${T.trips}번${T.carry ? ` · 함께 든 길 ${T.carry}번` : ''}${T.found ? ` · 숨긴 물건 찾기 ${T.found}번` : ''}` : '바깥 원정은 없었다.'}</p><p class="dim" style="margin:0 0 4px">${esc(leaveLine)}</p>${(c.feats || []).slice(-8).map((f) => `<div class="ft">${f.day}일 ${clock(f.t)} · ${esc(featText(f))}</div>`).join('')}`;
    const story = storyLines(c.flags || {});
    const pr = v.partner.role, ek = endingKey(c, v.role), pek = endingKey(c, pr);
    const RV = c.reveal || {};
    this.resStage = this.resStage || {};
    const stage = RV.both ? 3 : RV.me || this.resStage[v.role] === 2 ? 2 : 1;
    const secRow = (q) => (c.secrets && c.secrets[q] ? `<div class="sec"><div class="sn">${esc(q === v.role ? '내가' : NAMES[pr] + '가')} 끝까지 숨긴 것</div>${c.secrets[q].length ? c.secrets[q].map((x) => `<p class="${x.kept ? 'kept' : 'out'}"><i>${x.kept ? '■' : '□'}</i>${esc(secretLine(x))}</p>`).join('') : '<p class="dim">숨긴 것이 없다.</p>'}</div>` : '');
    let html;
    if (stage === 1) {
      // 1단계: 내 기억 한 문단만, 정적 속에
      html = `<div class="stp">STEP 01 / 03 · 내 기억</div>${head}<div class="endp solo"><p>${esc(ENDING_TEXT[v.role][ek])}</p></div><div class="row"><button class="btn inv" data-act="resNext">다음</button></div>`;
    } else if (stage === 2) {
      // 2단계: 한 줄 남기고, 내 비밀 시트를 혼자 본 뒤, 펼칠지 고른다
      const wait = RV.me ? `<div class="pline"><span>${RV.me === 'open' ? '펼칠 준비를 했다' : '내 시트는 덮어 두었다'} · ${esc(NAMES[pr])}${RV.partner ? '도 준비했다' : '를 기다리는 중'}</span></div>` : '';
      html = `<div class="stp">STEP 02 / 03 · 한 줄과 비밀 시트</div>${head}<div class="endp"><p>${esc(ENDING_TEXT[v.role][ek])}</p></div>
      <div class="sh">한 줄 남기기</div>
      <form id="epiForm" class="say"><input id="epi" maxlength="80" placeholder="${esc(c.epilogue[v.role] || '이 판에 남길 한 줄 (선택)')}"><button class="btn">남기기</button></form>
      <div class="sh">이번 판에서 간직할 장면 (마지막 날)</div>
      ${v.endMoments && v.endMoments.length ? `<div class="list">${v.endMoments.map((mm, i2) => `<button class="li${v.endPick === i2 ? ' sel' : ''}" data-cmd='${esc(JSON.stringify({ type: 'endPick', pick: i2 }))}'><span>${esc(fmt(mm.type + '.same', mm.a, '_'))}</span><span class="dim">${clock(mm.t)}</span></button>`).join('')}</div>` : `<p>${esc(shared)}</p>`}
      <div class="sh">비밀 시트 · 아직 나만 본다</div>${secRow(v.role)}
      <p class="dim">둘 다 고르면 같은 순간에 열린다. 펼치면 ${esc(NAMES[pr])}가 내 비밀 시트·내 기억·내 화면 기록을 보게 된다.</p>
      ${wait || `<div class="row wrap"><button class="btn" data-cmd='${esc(JSON.stringify({ type: 'reveal', open: false }))}'>내 건 덮어 둔다</button><button class="btn inv" data-cmd='${esc(JSON.stringify({ type: 'reveal', open: true }))}'>비밀 시트 함께 펼치기</button></div>`}`;
    } else {
      // 3단계: 같은 순간에 펼친다
      const endHtml = `<div class="endp"><p>${esc(ENDING_TEXT[v.role][ek])}</p>${RV.partnerOpen ? `<p class="endo"><b>${esc(NAMES[pr])}의 기억</b> ${esc(ENDING_TEXT[pr][pek])}</p>` : ''}</div>`;
      const secHtml = `<div class="sh">비밀 시트</div>${secRow(v.role)}${secRow(pr) || `<p class="dim">${esc(NAMES[pr])}는 자기 시트를 덮어 두었다.</p>`}`;
      const storyHtml = story.length ? `<div class="sh">그날 밤의 일</div><div class="story">${story.map((l) => `<p>${esc(l)}</p>`).join('')}</div>` : '';
      const pl = c.partnerLog;
      const plHtml = pl ? `<div class="sh">다른 쪽 화면</div><details class="plog"><summary>${esc(NAMES[pr])}의 화면에 떴던 것 (${pl.length}줄)</summary><ol>${pl.map((le) => `<li><time>${clock(le.t)}</time> ${esc(le.key === 'sc' ? sceneLine(le.a) : fmt(le.key, le.a, pr))}</li>`).join('')}</ol></details>` : '';
      html = `<div class="stp">STEP 03 / 03 · 시점 전환 · 비밀 시트</div>${head}${endHtml}${row('ren')}${row('akechi')}${storyHtml}${secHtml}${earned}
      <div class="sh">마지막으로 건넨 물건</div><p>${esc(give)}</p>
      ${plHtml}
      <div class="row wrap"><button class="btn" data-act="saveImg">한 장으로 저장</button><button class="btn" data-act="restart">다시 하기</button></div>`;
      this.lastCard = { c, role: v.role, story, ek, pek };
    }
    void mine;
    if (document.activeElement && document.activeElement.id === 'epi') return;
    this.set('resultBody', html);
  },
};

// 결산을 한 장의 흑백 이미지로. 시험판(아티팩트)에서는 플랫폼 저장을 쓴다 — 배포판엔 window.claude가 없다
const dlP = typeof window !== 'undefined' && window.claude && window.claude.use ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
async function saveResultImage(ui) {
  const L = ui.lastCard; if (!L) return;
  const { c, role, story, ek, pek } = L, pr = role === 'ren' ? 'akechi' : 'ren';
  try { await document.fonts.load('20px Galmuri'); await document.fonts.load('bold 20px Galmuri'); } catch (e) { /* 기본 글꼴로 */ }
  const Wd = 720, pad = 44, fs = 20, lh = 32;
  const cv = document.createElement('canvas'); const g = cv.getContext('2d');
  const e = c.end || {}, RV = c.reveal || {};
  const blocks = [['h', '새벽 다섯 시'], ['s', `${e.day || 1}일째 — ${RESULT_CARD.ends[e.reason] || RESULT_CARD.title}`], ['gap'], ['p', ENDING_TEXT[role][ek]]];
  if (RV.partnerOpen) blocks.push(['gap'], ['q', `${NAMES[pr]}의 기억 — ${ENDING_TEXT[pr][pek]}`]);
  blocks.push(['gap']);
  for (const q of ['ren', 'akechi']) blocks.push(['p', `${NAMES[q]} · ${RESULT_CARD.fate[c.players[q].fate]}${c.epilogue[q] ? `  “${c.epilogue[q]}”` : ''}`]);
  if (story.length) { blocks.push(['gap'], ['b', '그날 밤의 일']); for (const l of story) blocks.push(['p', l]); }
  for (const q of [role, pr]) if (c.secrets && c.secrets[q] && c.secrets[q].length) {
    blocks.push(['gap'], ['b', `${NAMES[q]}가 끝까지 숨긴 것`]);
    for (const x of c.secrets[q]) blocks.push(['p', `${x.kept ? '■' : '□'} ${secretLine(x)}`]);
  }
  blocks.push(['gap'], ['s', '@nyamaker']);
  const font = (b) => `${b ? 'bold ' : ''}${fs}px Galmuri, monospace`;
  const wrap = (t, b) => { g.font = font(b); const out = []; let cur = ''; for (const ch of String(t)) { if (ch === '\n') { out.push(cur); cur = ''; continue; } if (g.measureText(cur + ch).width > Wd - pad * 2) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); return out; };
  const lines = [];
  for (const [k, t] of blocks) { if (k === 'gap') { lines.push([k, '']); continue; } for (const w of wrap(t, k === 'h' || k === 'b')) lines.push([k, w]); }
  cv.width = Wd; cv.height = pad * 2 + lines.length * lh;
  g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
  g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(14, 14, cv.width - 28, cv.height - 28);
  g.fillStyle = '#fff'; g.textBaseline = 'top';
  lines.forEach(([k, t], i) => { g.font = font(k === 'h' || k === 'b'); g.globalAlpha = k === 's' || k === 'q' ? 0.65 : 1; g.fillText(t, pad, pad + i * lh); });
  g.globalAlpha = 1;
  const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
  const name = `saebyeok-${e.day || 1}일-${NAMES[role]}.png`;
  const dl = await dlP;
  if (dl) {
    try { await dl.save({ filename: name, data: blob }); toast('이미지를 저장했다'); }
    catch (err) { if (!err || err.code !== 'declined') toast('여기서는 저장할 수 없다'); }
    return;
  }
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); return; } catch (err) { if (err && err.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('이미지를 저장했다');
}

const ZONES_OUT = { eaves: 1, checkpoint: 1, market: 1, pump: 1, roof: 1 };
function startSnow() {
  const cv = $('#snow'); if (!cv) return;
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flakes = Array.from({ length: 46 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 0.18 + Math.random() * 0.4, dx: -0.12 - Math.random() * 0.2, s: Math.random() < 0.25 ? 2 : 1 }));
  let shown = null;
  const draw = () => {
    const want = !!ui.snowOn && !document.hidden;
    if (want !== shown) { shown = want; g.clearRect(0, 0, W, H); cv.hidden = !want; }
    if (want) {
      g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.85)';
      for (const f of flakes) { if (!still) { f.y += f.v; f.x += f.dx; if (f.y > H) { f.y = -2; f.x = Math.random() * W; } if (f.x < 0) f.x = W; } g.fillRect(f.x | 0, f.y | 0, f.s, f.s); }
    }
    if (!still) requestAnimationFrame(draw); else setTimeout(draw, 1000);
  };
  draw();
}

function toast(msg, ms = 1800) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, ms);
}

// ── 입력 ───────────────────────────────────────────────────
document.addEventListener('pointerdown', () => { if (SFX.soundOn()) SFX.unlock(); }, { passive: true });
document.addEventListener('click', (e) => {
  const b = e.target.closest('button, [data-cmd], [data-move], [data-sheet], [data-pg], [data-act]');
  if (!b) { if (e.target.id === 'sheet') ui.close(); return; }
  const d = b.dataset;
  if (d.act === 'dlgNext') { const st = ui.dq && ui.dq[ui.role]; if (st) { if (st.queue.length) st.skip = true; else st.at = Date.now() - 60000; } ui.prev.dlg = null; ui.refresh(); return; }
  if (d.tab) { ui.tab = d.tab; ui.paneKey = null; ui.refresh(); return; }
  if (d.act === 'focusSay') { ui.tab = 'chat'; ui.paneKey = null; ui.refresh(); const i = $('#say'); if (i) i.focus(); return; }
  if (d.act === 'baseFold') { ui.baseOpen = !ui.baseOpen; ui.paneKey = null; ui.refresh(); return; }
  if (d.act === 'question') { const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]; toast(`말 걸 거리 — ${q}`, 5000); return; }
  if (d.act === 'voteNo') { ui.voteNo = d.k; ui.refresh(); return; }
  if (d.dpick !== undefined) { ui.dpick[ui.role] = ui.dpick[ui.role] === +d.dpick ? -1 : +d.dpick; ui.refresh(); return; }
  if (d.act === 'startDay') { const i = $('#diaryLine'); ui.send({ type: 'diary', pick: ui.dpick[ui.role] ?? -1, line: i ? i.value : ui.dline[ui.role] || '' }); ui.send({ type: 'startDay' }); return; }
  if (d.mz) { ui.markZone = d.mz; ui.prev.sheetBody = null; ui.renderSheet(ui.view()); return; }
  if (d.pg) { ui.page[ui.role] = Math.max(0, (ui.page[ui.role] || 0) + +d.pg); ui.refresh(); return; }
  if (d.ppick) { ui.pick[ui.role] = d.ppick; ui.refresh(); return; }
  if (d.act === 'ready') { const i = $('#firstLine'); ui.send({ type: 'ready', pick: ui.pick[ui.role] || 'light', line: i ? i.value : ui.line[ui.role] || '' }); return; }
  if (d.role) { ui.role = d.role; ui.prev = {}; ui.logScrolled = false; ui.refresh(); return; }
  if (d.move) {
    const v = ui.view(); const ex = v && v.zone.exits.find((e) => e.to === d.move);
    if (ex && ex.far) { ui.open('route'); return; }
    if (ex && ex.why) { toast(WHY[ex.why] || '갈 수 없다.'); return; }
    ui.send({ type: 'move', to: d.move }); if (ui.sheet === 'map') ui.close(); return;
  }
  if (d.cmd) { let cmd; try { cmd = d.cmd.startsWith('{') ? JSON.parse(d.cmd) : { type: d.cmd }; } catch { return; } ui.send(cmd); if (ui.sheet && ['use', 'give', 'drop', 'sill', 'stash', 'pick'].includes(cmd.type)) ui.sel = null; if (ui.sheet === 'act' || ui.sheet === 'route' || (ui.sheet === 'near' && !['give'].includes(cmd.type)) || (ui.sheet === 'bag' && ['fill', 'hide'].includes(cmd.type))) ui.close(); return; }
  if (d.sheet) { ui.logScrolled = false; ui.open(d.sheet); return; }
  if (d.sel) { ui.sel = ui.sel === d.sel ? null : d.sel; ui.prev.sheetBody = null; ui.renderSheet(ui.view()); return; }
  if (d.sig) { ui.send({ type: 'signal', which: d.sig }); ui.sigOpen = false; ui.refresh(); return; }
  if (d.act === 'sceneToggle') { const big = !document.body.classList.contains('scene-big'); document.body.classList.toggle('scene-big', big); store.set('saebyeok-scene2', big ? 'big' : 'normal'); ui.tagsHtml = ''; return; }
  if (d.act === 'sigs') { ui.sigOpen = !ui.sigOpen; ui.prev.quick = null; ui.refresh(); return; }
  if (d.dev) { ui.send({ type: 'dev', ...JSON.parse(d.dev) }); return; }
  if (d.act === 'close') { ui.close(); return; }
  if (d.act === 'hints') { ui.hints = !ui.hints; store.set('saebyeok-hints', ui.hints ? 'on' : 'off'); ui.prev = {}; ui.refresh(); return; }
  if (d.hmove) { const v = ui.view(); const ex = v && v.zone.exits.find((e) => e.to === d.hmove); if (ex && ex.far) { ui.open('route'); return; } ui.send({ type: 'move', to: d.hmove }); return; }
  if (d.act === 'home') { document.querySelectorAll('.coach-target').forEach((el) => el.classList.remove('coach-target')); document.body.classList.remove('tut'); ui.close(); location.hash = ''; showLobby(); return; }
  if (d.act === 'sound') { SFX.setSound(!SFX.soundOn()); ui.cues(ui.view()); return; }
  if (d.act === 'resNext') { ui.resStage = ui.resStage || {}; const vv = ui.view(); if (vv) ui.resStage[vv.role] = 2; ui.prev = {}; ui.refresh(); return; }
  if (d.act === 'saveImg') { saveResultImage(ui); return; }
  if (d.act === 'restart') { ui.resStage = {}; ui.lastCard = null; }
  if (d.act === 'restart') { ui.coachTarget = null; ui.prev = {}; ui.page = {}; ui.pick = {}; ui.line = {}; ui.dpick = {}; ui.dline = {}; ui.host.restart(); ui.close(); ui.prev = {}; ui.refresh(); return; }
  if (d.act === 'search') { ui.send({ type: 'search' }); if (ui.sheet === 'near') ui.close(); return; }
  if (d.act === 'local') { startLocal(); return; }
  if (d.act === 'tutorial') { ui.coachTarget = null; ui.prev = {}; ui.start(new TutorialHost(), 'ren'); return; }
  if (d.act === 'coachNext') { ui.host.next(); ui.prev.coach = null; ui.refresh(); return; }
  if (d.act === 'create') { createRoom(); return; }
  if (d.act === 'join') { joinRoom($('#codeIn').value); return; }
  if (d.pick) { pickRole(d.pick); return; }
});
document.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id === 'sayForm') {
    const i = $('#say'); const raw = i.value.trim();
    if (raw) {
      // *행동* 부분은 서술로, 나머지는 대사로
      const acts = [...raw.matchAll(/\*([^*]+)\*/g)].map((m) => m[1].trim()).filter(Boolean);
      const speech = raw.replace(/\*[^*]*\*/g, ' ').replace(/\s+/g, ' ').trim();
      for (const a of acts) ui.send({ type: 'emote', text: a });
      // '@표정 대사' → 스탠딩 표정
      const fm = speech.match(/^@(\S{1,8})\s+(.+)$/);
      if (fm) { ui.face = fm[1]; ui.send({ type: 'say', text: fm[2], face: fm[1] }); }
      else if (speech) ui.send({ type: 'say', text: speech, face: ui.face || null });
      if (!acts.length && !speech) ui.send({ type: 'emote', text: raw });
    }
    i.value = ''; ui.typingOn = false;
  }
  if (e.target.id === 'markForm') { const i = $('#markText'); if (i.value.trim()) ui.send({ type: 'mark', zone: ui.markZone || ui.view().me.zone, tag: 'custom', text: i.value }); i.value = ''; }
  if (e.target.id === 'noteForm') { const i = $('#note'); if (i.value.trim()) ui.send({ type: 'note', text: i.value }); i.value = ''; }
  if (e.target.id === 'epiForm') { const i = $('#epi'); ui.send({ type: 'epilogue', text: i.value }); i.value = ''; i.blur(); ui.prev.resultBody = null; }
});
// 키보드가 올라오면 화면 높이를 실제 보이는 높이에 맞추고, 무대와 입력창만 남긴다.
// '입력 중' 모드는 초점이 아니라 실제 키보드가 떠 있는지로 정한다(뒤로 가기로 키보드만 내려도 풀리게).
{
  const vv = window.visualViewport;
  let maxH = 0;
  const kbOpen = () => (vv ? vv.height : window.innerHeight) < maxH - 120;
  const sync = () => {
    const h = vv ? vv.height : window.innerHeight;
    maxH = Math.max(maxH, h);
    document.documentElement.style.setProperty('--appH', Math.round(h) + 'px');
    const typing = kbOpen() && document.activeElement === $('#say');
    document.body.classList.toggle('typing', typing);
    if (document.body.classList.contains('ingame')) window.scrollTo(0, 0);
  };
  if (vv) { vv.addEventListener('resize', sync); vv.addEventListener('scroll', sync); }
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', () => { maxH = 0; setTimeout(sync, 300); });
  document.addEventListener('focusin', (e) => { if (e.target.id === 'say') { setTimeout(sync, 80); setTimeout(sync, 400); } });
  document.addEventListener('focusout', (e) => { if (e.target.id === 'say') setTimeout(sync, 150); });
  sync();
}
document.addEventListener('input', (e) => {
  if (e.target.id === 'firstLine') ui.line[ui.role] = e.target.value;
  if (e.target.id === 'diaryLine') ui.dline[ui.role] = e.target.value;
  if (e.target.id === 'say') {
    const on = e.target.value.length > 0;
    if (on !== ui.typingOn) { ui.typingOn = on; ui.host.send(ui.role, { type: 'typing', on }); }
  }
});

// ── 로비 ───────────────────────────────────────────────────
let pendingCode = null;
function showLobby() {
  document.body.classList.remove('ingame', 'danger');
  $('#game').hidden = true; $('#lobby').hidden = false; $('#result').hidden = true;
  $('#online').hidden = LOCAL_ONLY; $('#localNote').hidden = !LOCAL_ONLY;
  $('#rolePick').hidden = true;
}
function startLocal() { ui.start(ui.host && ui.host.local ? ui.host : new LocalHost(), 'ren'); }
async function createRoom() {
  try {
    const dev = new URLSearchParams(location.search).has('dev') ? '?dev=1' : '';
    const r = await fetch('/api/room' + dev, { method: 'POST' });
    const { code } = await r.json();
    location.hash = code; joinRoom(code);
  } catch { toast('방을 만들 수 없다. 배포 상태를 확인하세요.'); }
}
async function joinRoom(raw) {
  const code = String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) { toast('방 코드는 다섯 글자'); return; }
  try {
    const info = await (await fetch(`/api/room/${code}/info`)).json();
    if (!info.exists) { toast('없는 방이다.'); return; }
    pendingCode = code;
    const mine = ['ren', 'akechi'].filter((r) => store.get(`sb:${code}:${r}`));
    if (mine.length === 1) { pickRole(mine[0]); return; }
    $('#rolePick').hidden = false;
    $('#rolePick').innerHTML = `<p>방 <b>${code}</b> — 누구로 할까?</p><div class="row">${['ren', 'akechi'].map((r) => `<button class="btn${info.taken[r] && !store.get(`sb:${code}:${r}`) ? ' off' : ''}" data-pick="${r}"${info.taken[r] && !store.get(`sb:${code}:${r}`) ? ' disabled' : ''}>${NAMES[r]}${info.taken[r] ? ' (자리 있음)' : ''}</button>`).join('')}</div>`;
  } catch { toast('연결할 수 없다.'); }
}
function pickRole(r) { if (!pendingCode) return; location.hash = pendingCode; ui.start(new RemoteHost(pendingCode, r), r); }

// 버튼 아이콘
const TB = { bNear: ['eye', '주변'], bAct: ['act', '행동'], bBag: ['bag', '가방'], bMap: ['map', '지도'], bLog: ['book', '일지'], bDev: ['gear', '도구'] };
for (const [id, [ic, label]] of Object.entries(TB)) $('#' + id).innerHTML = `${icon(ic, 17)}<span class="tl">${label}</span>`;
$('#bHome').innerHTML = icon('home', 16);
startSnow();
const sc = $('#scene'); sc.width = W; sc.height = H;

showLobby();
if (!LOCAL_ONLY && /^#[A-Z0-9]{5}$/.test(location.hash)) joinRoom(location.hash.slice(1));
