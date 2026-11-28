// 장면 직접 누르기 — 구역 그림 위의 "누를 수 있는 곳".
// 좌표는 장면 캔버스 기준(192×120). 지금은 외벽 처마(eaves)만 시제품으로 깔았다.
// 각 항목: { id, x, y, w, h, label, cmd | move | sheet, off, hot }
//   cmd   — 바로 보낼 명령(JSON)        move  — 옆 구역 이동(기존 data-move 흐름)
//   sheet — 시트 열기(주변·가방 등)      off   — 지금은 못 함(흐리게, 눌러도 안내만)
//   hot   — 지금 눌러 볼 만한 곳(깜빡임)

const ZONE_SPOTS = {
  eaves(v) {
    const m = v.me, out = [];
    const exit = (to) => v.zone.exits.find((e) => e.to === to);
    // 배수관 — 오는 길에 본 그 자리
    out.push({
      id: 'pipe', x: 166, y: 17, w: 17, h: 79, label: m.pipe ? '배수관 · 확인함' : '배수관 뒤 확인',
      cmd: m.pipe ? null : { type: 'pipe' }, off: !!m.pipe, hot: !m.pipe && m.role === 'ren',
    });
    // 숙직실 창 — 두드리기
    out.push({ id: 'window', x: 112, y: 33, w: 48, h: 34, label: '창 두드리기', cmd: { type: 'knock' } });
    // 창틀 — 물건 두기·가져오기
    out.push({ id: 'sill', x: 106, y: 66, w: 60, h: 8, label: '창틀', sheet: 'bag', la: 'l' });
    // 눈 바닥 — 주변 뒤지기
    out.push({ id: 'snow', x: 6, y: 97, w: 92, h: 22, label: '주변 뒤지기', cmd: { type: 'search' } });
    // 왼쪽 끝 — 검문대 쪽으로
    const cp = exit('checkpoint');
    if (cp) out.push({ id: 'go-checkpoint', x: 0, y: 60, w: 16, h: 16, label: '◀ 검문대', move: 'checkpoint', off: !!cp.why, pin: 'l' });
    // 오른쪽 끝 — 비상계단(옥상)
    const rf = exit('roof');
    if (rf) out.push({ id: 'go-roof', x: 184, y: 60, w: 8, h: 16, label: '옥상 ▶', move: 'roof', off: !!rf.why, pin: 'r' });
    return out;
  },
};

export function hotspotsFor(v) {
  if (!v || !v.zone || v.phase !== 'play') return [];
  const f = ZONE_SPOTS[v.zone.id];
  if (!f) return [];
  const out = f(v);
  // 좀비가 보이면 그 자리를 누르면 주변(맞서기·밀치기·피하기)이 열린다
  const z = v.zone.zombie;
  if (z && z.st !== 'dormant') out.push({ id: 'zombie', x: 118, y: 40, w: 60, h: 66, label: z.st === 'warn' ? '달려든다!' : '다가온다', sheet: 'near', hot: true, danger: true });
  const busy = !!(v.me.task || v.me.down || v.me.dead);
  return out.map((s) => ({ ...s, busy }));
}

// 장면 크기·잘림(object-fit: cover)에 맞춰 버튼 HTML을 만든다
export function hotspotsHtml(spots, map, esc, cw = 9999) {
  return spots.map((s) => {
    const r = map(s);
    // 이름표가 장면 밖으로 잘리지 않게: 가장자리면 안쪽으로 붙이고, 키 큰 곳은 위쪽에 단다
    const al = s.la ? 'al-' + s.la : r.x + r.w > cw - 48 ? 'al-r' : r.x < 48 ? 'al-l' : '';
    const lt = r.h > 70 ? 'lt' : '';
    const attr = s.off ? 'data-hsoff="1"' : s.move ? `data-move="${s.move}"` : s.sheet ? `data-sheet="${s.sheet}"` : s.cmd ? `data-cmd='${esc(JSON.stringify(s.cmd))}'` : 'data-hsoff="1"';
    const cls = ['hs', s.off ? 'off' : '', s.hot ? 'hot' : '', s.danger ? 'danger' : '', s.busy ? 'busy' : '', al, lt].filter(Boolean).join(' ');
    if (r.w < 8 || r.h < 8) return '';
    return `<button type="button" class="${cls}" data-hs="${s.id}" ${attr} aria-label="${esc(s.label)}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px"><i class="hsc tl"></i><i class="hsc br"></i><span class="hsl">${esc(s.label)}</span></button>`;
  }).join('');
}
