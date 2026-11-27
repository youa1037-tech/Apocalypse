import { ART } from './art.js';
// 새벽 다섯 시 · 원고 파일
// ───────────────────────────────────────────────────────────
// 이 파일의 문장만 바꾸면 게임 안 글이 바뀝니다. 규칙(engine.js)은 건드리지 않아도 돼요.
//
// 자리표시자
//   {who}  사건의 주인공 이름      {to}  상대(받는 사람) 이름
//   {item} 물건 이름              {zone} 구역 이름
//   뒤에 조사를 붙이면 받침에 맞춰 바뀝니다:  {who:이} → 렌이 / 아케치가
//   쓸 수 있는 조사: 이 · 을 · 은 · 와 · 으로
//
// 관계 꼬리표 (같은 사건을 누가 어떻게 겪었는지)
//   self  내가 한 일 / 내게 일어난 일
//   same  같은 구역에서 직접 봄
//   glass 숙직실 창 너머로 봄 (소리는 거의 안 들림)
//   door  옥상 문 너머로 들음
//   near  붙어 있는 구역에서 들음
//   radio 무전으로 들음
//
// ★ 표시: 개별 집필 권장(누가 무엇을 봤는지가 다음 행동의 의미를 바꾸는 사건)
// ───────────────────────────────────────────────────────────

export const NAMES = { ren: '렌', akechi: '아케치' };
// 얼굴 칸 그림: 직접 그린 그림 경로를 넣으면 이름 첫 글자 대신 쓴다. 예: { ren: 'img/ren.png', akechi: 'img/akechi.png' }
export const AVATARS = { ren: ART.renAv, akechi: ART.akechiAv };
// 스탠딩(코코포리아식 탈): 표정별 그림 경로. 채팅에서 '@웃음 대사'처럼 쓰면 그 표정이 뜬다.
// 예: ren: { 기본: 'img/ren.png', 웃음: 'img/ren_smile.png', 굳음: 'img/ren_stern.png' }
// 비어 있으면 얼굴 칸 그림 → 없으면 흑백 실루엣을 쓴다.
export const TACHIE = { ren: { 기본: null }, akechi: { 기본: null } }; // 무대 스탠딩은 쓰지 않는다(index.html에서 #tachie를 숨김)

// ★ 프롤로그 — 시작 전에 각자 읽는다. 한 항목이 한 장. 줄바꿈은 \n
export const PROLOGUE = {
  title: '도쿄 봉쇄 첫날',
  sub: '새벽 다섯 시까지, 둘 다 살아 있을 것',
  shared: [
    '18시 04분. 모든 휴대폰이 한꺼번에 울렸다.\n23구 전역 이동 제한.\n이유는 적혀 있지 않았다.',
    '21시가 되기 전에 이유는 필요 없어졌다.\n시부야역 앞에서, 사람이 사람을 물었다.',
    '구청 문자가 한 번 더 왔다.\n가까운 대피소로 이동하십시오.\n첫 이송은 모레 새벽 다섯 시, 한 자리.\n마지막 이송은 나흘 뒤 같은 시각.',
  ],
  ren: [
    '르블랑 셔터를 반쯤 내렸을 때 사이렌이 시작됐다.\n가게를 지키라는 말을 들었지만, 골목 끝에서 비명이 들리자 몸이 먼저 나갔다.',
    '대피소로 꺾어지는 신호등 아래, 낯익은 코트가 서 있었다.\n아케치 고로.\n카메라 앞에서 짓는 얼굴은 아니었다.',
    '그가 나를 보고 잠깐 웃었다.\n“하필이면 너구나.”\n대답하기도 전에, 둘은 같은 방향으로 걷고 있었다.',
  ],
  akechi: [
    '방송국 대기실 모니터에 속보가 떴다.\n녹화는 취소됐고, 매니저는 전화를 받지 않았다.\n택시는 한 대도 서지 않았다.',
    '걸었다.\n피하려면 피할 수 있었던 얼굴이 신호등 건너편에 있었다.\n아마미야 렌. 앞치마도 벗지 않은 채였다.',
    '“하필이면 너구나.”\n입에서 먼저 나온 말이 그거였다.\n그래도 걸음을 돌리지는 않았다.',
  ],
  // 나만 아는 것 — 상대 화면에는 나오지 않는다
  secret: {
    ren: '오는 길에 본 것.\n대피소 외벽 배수관 뒤에 누군가 뭔가를 테이프로 붙이고 있었다. 얼굴은 못 봤다.\n들어가기 전에 확인하고 싶다. 아직 아무에게도 말하지 않았다.',
    akechi: '코트 주머니 속 무전기.\n오후에 낯선 남자가 쥐여 주고 갔다. 배터리는 빠져 있었다.\n“22시 15분 방송은 끝까지 들으세요.” 그 말만 남겼다.\n아직 아무에게도 말하지 않았다.',
  },
  arrive: '22시. 대피소 외벽 처마 밑.\n숙직실 창에 불이 켜져 있다.',
  pickTitle: '지금 손에 든 것 하나',
  picks: { light: '휴대 조명 — 어두운 바깥을 빨리 뒤진다', bandage: '붕대 — 다쳤을 때 체력 회복', food: '식량 — 먹으면 기력 +20' },
  lineLabel: '처마 밑에서 처음 건넬 말 (비워도 된다)',
  go: '대피소 앞에 선다',
  waiting: '아직 오는 중이다…',
  starting: '곧 시작된다.',
  tagShared: '그날 밤', tagSecret: '나만 아는 것',
  secretNote: '괄호 속 문장은 내 화면에만 뜬다. 굳이 읽어 주지 않아도 된다.',
};

export const ZONE_TEXT = {
  eaves: {
    short: '처마', name: '외벽 처마', en: 'UNDER THE EAVES',
    look: '대피소 본관 외벽. 처마 끝에서 녹은 눈이 떨어진다. 숙직실 **창문**에 불이 켜져 있다.',
  },
  checkpoint: {
    short: '검문대', name: '검문대', en: 'CHECKPOINT',
    look: '바리케이드와 접이식 탁자. 검사원이 손전등으로 줄을 훑는다. 탁자 위에 **이송 명단**.',
  },
  dorm: {
    short: '숙직실', name: '숙직실', en: 'NIGHT DUTY ROOM',
    look: '이층 침대 두 개와 철제 **구호함**. 벽에 붙은 **수신기**가 낮게 지직거린다. 안쪽으로 옥상 계단 **문**.',
  },
  market: {
    short: '상점가', name: '상점가', en: 'SHOPPING STREET',
    look: '셔터가 반쯤 내려간 편의점과 약국, 넘어진 자판기. 바닥에 깨진 유리. 오래 뒤질수록 **소리**가 난다.',
  },
  pump: {
    short: '급수소', name: '급수소', en: 'WATER PUMP',
    look: '공원 구석의 비상 급수 펌프. 손잡이를 올릴 때마다 **삐걱** 소리가 난다. 물은 끝없이 나오지만 시간이 든다.',
  },
  roof: {
    short: '옥상', name: '비상계단과 옥상', en: 'ROOFTOP',
    look: '바람이 세다. 꺾인 안테나 너머로 꺼진 도시가 보인다. 계단 끝에 숙직실로 내려가는 **옥상 문**.',
  },
};

export const ITEM_TEXT = {
  blanket: { name: '담요', desc: '갖고 있으면 바깥 추위가 덜 쌓인다.' },
  food: { name: '식량', desc: '먹으면 기력 +20.' },
  water: { name: '식수', desc: '마시면 기력 +15.' },
  bandage: { name: '붕대', desc: '일반 부상 회복. 감염에는 효과 없음.' },
  battery: { name: '배터리', desc: '고장 난 무전기에 끼울 수 있다.' },
  radio_broken: { name: '고장 난 무전기', desc: '배터리가 없다.' },
  radio: { name: '무전기', desc: '숙직실 수신기와 이어진다. 말하면 잡음이 난다.' },
  light: { name: '휴대 조명', desc: '바깥을 뒤질 때 시간이 덜 든다.' },
  key: { name: '옥상 열쇠', desc: '옥상 쪽에서 옥상 문을 열고 잠글 수 있다.' },
  kit: { name: '진단 키트', desc: '물림의 경과를 확인한다. 결과지가 나온다.' },
  suppressant: { name: '억제제', desc: '진행을 멈춘다. 본인이 직접 맞아야 한다.' },
  pass: { name: '이송증', desc: '이송 명단 접수 확인. 3일째·5일째 05:00 차량에 필요.' },
  plank: { name: '판자', desc: '창문을 막는 데 쓴다(2개).' },
  cloth: { name: '천', desc: '물통과 함께 정수 통을 만든다.' },
  jug: { name: '물통', desc: '최대 물 6번 분량. 가방 2칸. 4번 분량을 넘으면 무겁다.' },
  result: { name: '진단 결과지', desc: '' },
  note: { name: '쪽지', desc: '' },
  umbrella: { name: '장우산', desc: '맞서기 승산 +10%. 거리를 둬서 밀려도 덜 물린다. 금방 휜다.' },
  knife: { name: '주방칼', desc: '맞서기 승산 +15%. 조용하다. 대신 바짝 붙어야 해서 밀리면 더 물린다.' },
  pipe: { name: '쇠파이프', desc: '맞서기 승산 +20%. 시끄럽다.' },
  bat: { name: '금속 배트', desc: '맞서기 승산 +25%. 시끄럽다. 오래 버틴다.' },
  extinguisher: { name: '소화기', desc: '밀어내기가 헛돌지 않고 오래 비틀거리게 한다. 가방 2칸. 세 번 쓰면 빈다.' },
};

export const RESULT_TEXT = { clear: '물림 흔적 없음', prog: '진행성', non: '비진행성' };

export const TASK_TEXT = {
  move: '이동', retreat: '후퇴', search: '탐색', pick: '줍기', drop: '내려놓기', give: '건네기', sill: '창틀에 두기',
  stash: '구호함에 넣기', inspect: '검사 받기', sign: '명단에 서명', lock: '옥상 문 잠그기', unlock: '옥상 문 열기',
  diagnose: '진단 키트 사용', inject: '억제제 투여', bandage: '붕대 감기', eat: '먹기', drink: '마시기', fixRadio: '무전기 고치기',
  note: '쪽지 쓰기', fight: '맞서기', push: '밀어내기', sleeve: '소매 내리기', showWound: '상처 보여 주기',
  rest: '쉬기', watch: '망보기', tug: '붙잡고 있음', listen: '방송 듣기', pipe: '배수관 확인', build: '설비 만들기', answerSos: '구조 요청 응답', scout: '길 살피기', board: '탑승', fill: '물 채우기', hide: '숨기기', shareMap: '지도 함께 펴기', help: '거들기'
};

// 둘이 해낸 일(생존일지·결산). a.who 등은 이미 이름으로 바뀌어 들어온다
export const FEAT_TEXT = {
  fill: (a) => `${j(a.who, '이')} 급수소에서 물통을 ${a.left}번 분량 채웠다.`,
  home: (a) => `${j(a.who, '이')} ${a.dest}에서 돌아왔다 — 물 ${a.water} · 식량 ${a.food}${a.other ? ` · 그 밖에 ${a.other}개` : ''}.`,
  carryHome: (a) => `${j(a.who, '와')} ${j(a.to, '이')} 물통을 함께 들고 돌아왔다.`,
  foundHidden: (a) => `${j(a.who, '이')} ${j(a.by, '이')} ${a.zone}에 숨겨 둔 ${j(a.item, '을')} 찾았다.`,
  radio: (a) => `${j(a.who, '이')} 무전기를 고쳤다.`,
  built: (a) => `${j(a.who, '이')} 숙직실에 ${BUILD_TEXT[a.id].name}을(를) 갖췄다.`,
  stranger: (a) => `창밖의 낯선 사람에게 ${a.item}을(를) 건넸다.`,
  sos: (a) => `${j(a.who, '이')} 수신기의 구조 요청에 응답했다.`,
  sentBus: (a) => `둘은 이송 차량을 보냈다 — 숙직실에 물 ${a.water} · 식량 ${a.food}.`,
  boarded: (a) => `${a.who} 이송 차량에 탔다 — 숙직실에 물 ${a.water} · 식량 ${a.food}을 남기고.`,
};

// 좀비 출신 — 엔진은 번호만 갖고 있다(CFG.ORIGINS와 개수를 맞출 것)
export const ORIGINS = ['경비원', '배달원', '회사원', '학생', '간호사', '노인', '편의점 직원', '택시 기사'];
// 좀비 종류 — 이름 앞에 붙는 말과 주변 카드 설명
export const ZTYPE_TEXT = {
  walker: { pre: '', desc: '서성이다 사람을 보면 다가온다.' },
  sleeper: { pre: '웅크린 ', desc: '구석에 웅크려 있다. 시끄럽게 굴면 깬다. 깨우지 않고 맞서면 거의 이긴다.' },
  tracker: { pre: '귀 밝은 ', desc: '소리를 쫓는다. 아무도 없으면 옆 구역의 사람과 소리를 따라 옮겨 다니고, 빨리 다가온다.' },
  horde: { pre: '', desc: '여럿이다. 맞서기 어렵고, 달려들면 곁에 있는 사람까지 다친다. 물러나는 게 낫다.' },
};
export const zlabel = (a) => (a.ty === 'horde' ? `좀비 떼(${ORIGINS[a.zo] ?? '?'} 외 여럿)` : `${(ZTYPE_TEXT[a.ty] || ZTYPE_TEXT.walker).pre}좀비(${a.of ? NAMES[a.of] || a.of : ORIGINS[a.zo] ?? '?'})`);

// 상태 꼬리표
export const STATUS_TEXT = {
  down: '쓰러짐', bleed: '출혈', scratch: '긁힘', bitten: '물림', fever: '발열', tremor: '떨림', suppressed: '억제',
  exhausted: '탈진', frozen: '얼어붙음', thirst: '갈증', hunger: '허기', heavy: '무거움',
};
// 상태 설명(상태 시트)
export const STATUS_DESC = {
  down: '체력이 바닥났다. 움직일 수 없고, 좀비에게 무방비다. 붕대로 일으킬 수 있다.',
  bleed: '체력이 조금씩 빠진다. 붕대를 감으면 멎는다.',
  scratch: '긁힌 자국. 곧 아문다.',
  bitten: '물린 자리. 진행성인지는 진단 키트로 안다.',
  fever: '열이 오른다. 강행할수록 기력이 더 든다.',
  tremor: '다리에 힘이 들어가지 않는다. 억제하지 못하면 곧 전환된다.',
  suppressed: '억제제로 진행이 멈춰 있다(이틀).',
  exhausted: '숨이 차서 움직일 수 없다. 쉬면 돌아온다.',
  frozen: '몸이 얼어 기력이 빠진다. 안으로 들어가자.',
  thirst: '물을 마시지 못했다. 기력 상한이 줄었다.',
  hunger: '먹지 못했다. 기력 상한이 줄었다.',
  heavy: '물통이 무겁다. 느리고 싸울 수 없다.',
};

// ★ 거점 설비
export const BUILD_TEXT = {
  boards: { name: '창문 판자', good: '밤에 창으로 오는 위험이 막힌다', bad: '창 너머가 안 보이고 창틀을 못 쓴다' },
  charger: { name: '충전기', good: '아침마다 숙직실의 무전기가 꽉 찬다', bad: '배터리를 무전기에 직접 쓸 수 없게 된다' },
  purifier: { name: '정수 통', good: '아침마다 물이 1씩 생긴다', bad: '물통이 붙박여 들고 나갈 수 없다' },
  beds: { name: '침상', good: '불침번 없이도 잠이 깊다', bad: '담요 두 장을 쓴다' },
  wallmap: { name: '벽 지도', good: '아침마다 둘의 지도 표시가 합쳐진다', bad: '쪽지 세 장을 쓴다' },
};
// ★ 말 걸 거리 — 조용한 밤이나 상대 카드에서 나한테만 뜬다(CFG.QUESTIONS와 개수를 맞출 것)
export const QUESTIONS = [
  '봉쇄 전에 마지막으로 먹은 건?', '여기서 나가면 제일 먼저 하고 싶은 일은?', '오늘 가장 무서웠던 순간은?',
  '지금 걱정되는 사람이 있다면?', '숨기고 있는 게 있다면, 언젠가 말할 생각은 있어?', '이 사람과 처음 만났던 날을 기억해?',
  '만약 내가 물린다면, 어떻게 해 줬으면 좋겠어?', '어렸을 때 무서워했던 것은?', '지금 손에 남은 것 중 끝까지 갖고 있을 하나는?',
  '이번에 차가 오면 탈 거야?', '잠이 안 올 때는 보통 뭘 해?', '오늘 고마웠던 일 하나.',
  '내일 아침에 제일 먼저 듣고 싶은 말은?', '이 밤이 끝나면 하고 싶은 말이 있어?',
];
export const OFFER_TEXT = { meal: '식량을 나눠 먹자고 한다', care: '붕대를 감아 주겠다고 한다', lean: '어깨를 빌려주겠다고 한다' };

// ★ 장면 — 작가가 쓴 대사. 누가 말하는지는 engine.js의 SCENE_SPEAKER에 있다(없으면 서술).
//   {holder} {other} 는 펜을 쥔 사람 / 받는 사람 이름으로 바뀐다
export const SCENE_TEXT = {
  apron: {
    title: '앞치마',
    lines: {
      open: '의자 등받이에 어젯밤 걸어 둔 앞치마가 말라 있다.',
      a1: '르블랑에선 앞치마를 이렇게 반듯하게 개나?',
      a2: '아니. 네가 갰잖아.',
      a3: '아케치가 손을 뗀다.',
      a4: '그럼 왜 물어?',
      a5: '어제도 네가 먼저 손을 뗐나 해서.',
      a5p: '어제는 네가 뿌리쳤잖아. 그래서 물어본 거야.',
      r1: '르블랑에선 앞치마를 이렇게 반듯하게 개나?',
      r2: '아니. 네가 갰잖아.',
      r3: '아케치가 개던 손을 멈춘다.',
      r4: '어제는 네가 먼저 손을 뻗었잖아.',
      rt1: '수신기 방송, 끝 문장만 음질이 달랐어.',
      rt2: '재검사에서 떨어지면 명단에서 뺀대. 그 문장만 나중에 붙인 것 같았어.',
      rt3: '…너도 그걸 들었구나.',
      ro1: '네 이름이 거기 혼자 적히는 게 싫었어.',
      ro2: '이유가 그거야? …너답네.',
      f1: '렌은 대답 대신 앞치마 끈만 만지작거린다.',
      f2: '아케치가 끈을 가져가 허리 뒤로 돌린다.',
      f3: '대답 안 해도 돼. 매듭은 내가 묶을게.',
      b1: '젖은 채로 두면 못 쓰게 돼.',
      b2: '…고마워.',
      tell1: '아케치가 어젯밤 수신기에서 들은 방송을 처음부터 다시 읊는다.',
      own1: '명단이 마음에 안 들었어. 이름을 적으면, 누군가 그걸로 사람을 고를 수 있잖아.',
      own2: '증거는 없어. 그냥… 싫었어.',
      tellTail: '“…접수자는 탑승 시 재검사를 받습니다. 재검사 불합격자는 명단에서 제외…”',
      tell2: '끝 문장만 나중에 덧입혔어. 누가 왜 그랬는지는 몰라.',
      tie1: '아케치가 앞치마를 다시 펴서, 말없이 렌의 허리에 두른다.',
      ask1: '그래서, 어제 왜 막았어?',
      silent1: '아케치는 대답 대신 매듭을 한 번 더 조인다.',
      letTie1: '렌은 가만히 서 있다. 등 뒤에서 매듭이 단단히 묶인다.',
      thanks1: '…잘 묶네.',
      thanks2: '한 번 본 건 잊어버리지 않아서.',
      und1: '…그래서 막았구나.',
      und2: '확실한 건 아니야.',
      quiet1: '렌은 아무 말도 하지 않는다. 앞치마 끈만 만지작거린다.',
      leave1: '앞치마는 그대로 의자에 걸려 있다.',
      hand1: '아케치가 갠 앞치마를 렌의 손에 얹어 준다. 그뿐이다.',
    },
    opts: {
      fold: '앞치마를 개서 건넨다', leave: '그냥 둔다', tell: '어제 들은 방송을 들려준다', tie: '앞치마를 다시 펴서 렌에게 두른다',
      hand: '갠 앞치마를 손에 얹어 준다', own: '자기 말로 이유를 댄다',
      renTell: '들은 방송을 말한다', renOwn: '자기 말로 이유를 댄다', fidget: '대답 대신 앞치마 끈을 만지작거린다', ask: '더 묻는다', letTie: '매듭을 묶게 둔다', thanks: '고맙다고 한다',
      understood: '“그래서 막았구나.”', quiet: '아무 말도 하지 않는다', silent: '대답 대신 매듭을 조인다',
    },
  },
  night2: {
    title: '이름',
    lines: {
      open: '마지막 밤. 다섯 시까지 일곱 시간쯤 남았다. 숙직실 형광등이 한 번 깜빡인다.',
      o1: '내일 몇 시에 일어날 거야.',
      o2: '네 시 반.',
      al1: '명단이 뭘 고르는지 우린 몰라.',
      al2: '둘 다 이름을 걸 필요는 없잖아. 너 혼자 타.',
      rf1: '싫어.',
      rf2: '…그런 말은 쉽게 하는 거 아니야.',
      rf3: '쉽게 한 거 아니야. 같이 가거나, 같이 남거나.',
      yn1: '네 이름은?',
      yn2: '내 이름은 원래 어디에 올라가도 곤란해.',
      wy1: '너는 왜 타려고 해?',
      cf1: '르블랑 셔터, 반만 내리고 나왔거든.',
      cf2: '…그럼 커피 한 잔은 빚으로 해 둘게.',
      yu1: '네가 타니까.',
      yu2: '아케치가 등을 돌린다. 이불 끝이 조금 움직이다 멈춘다.',
      cs1: '아케치가 코트 주머니에서 무전기를 꺼내 탁자에 내려놓는다.',
      tellTail: '“…접수자는 탑승 시 재검사를 받습니다. 재검사 불합격자는 명단에서 제외…”',
      cs2: '첫날 밤에 들었어. 끝 문장만 누가 덧입혔고. 그래도 갈 거야?',
      sg1: '그래도 가. 둘 다.',
      sg2: '…너는 정말, 사람 말을 안 들어.',
      st1: '그럼 같이 남자.',
      st2: '그건 내가 들은 대답 중에 제일 바보 같아.',
    },
    opts: {
      alone: '“너 혼자 타.”', why: '“너는 왜 타려고 해?”', confess: '무전기를 꺼내 놓는다',
      refuse: '“싫어.”', yourName: '“네 이름은?”', cafe: '르블랑 이야기를 한다', you: '“네가 타니까.”',
      stillGo: '“그래도 가.”', stayTogether: '“그럼 같이 남자.”',
    },
  },
  lastMeal: {
    title: '마지막 배급',
    lines: {
      fedOpen: '06시. 배급이라 부르기엔 초라한 통조림 두 개와 물 두 병. 그래도 둘 몫이다.',
      shortOpen: '06시. 구호함 바닥이 보인다. 둘이 나누기엔 모자라다.',
      l1: '문 걸어. 하루 더 버티자.',
      l2: '…하루씩 늘려 가는 거, 나쁘지 않네.',
      w1: '밝아지면 걸어서 나가자. 차 없이도.',
      w2: '갈 데가 있다는 얼굴이네.',
      y1: '내 건 됐어. 너 먹어.',
      y2: '…그런 말, 두 번은 안 들어 줘.',
      s1: '남은 걸 반으로 나눈다. 한 숟가락씩 번갈아.',
      s2: '배는 안 부르네.',
      s3: '그래도 같이 먹었잖아.',
      g1: '다녀올게. 상점가까지만.',
      g2: '…늦으면 문 안 열어 줄 거야.',
      g3: '문이 닫힌다. 걸쇠 소리가 오래 남는다.',
    },
    opts: { lockIn: '“문 걸어. 하루 더 버티자.”', walk: '“밝아지면 걸어서 나가자.”', yield: '내 몫을 넘긴다', split: '남은 걸 반씩 나눈다', goOut: '혼자 다시 나간다' },
  },
  pen: {
    title: '펜',
    lines: {
      open: '탁자 위에 이송 명단. 펜은 하나뿐이다.',
      offerA: '이번엔 네가 먼저 써.',
      offerB: '먼저 써.',
      writeA: '…이번엔 안 막아?',
      writeB: '같이 가자.',
      write2: '{other}가 명단에 이름을 쓴다.',
      refuse1: '아직은.',
      keep1: '펜은 {holder}의 손에 남아 있다.',
    },
    opts: { offer: '펜을 내민다 — “먼저 써.”', keep: '펜을 쥐고 있는다', write: '이름을 쓴다', refuse: '“아직은.”' },
  },
};
export function sceneLine(a) {
  const S = SCENE_TEXT[a.sc]; if (!S) return '';
  const t = String(S.lines[a.b] || '').replace('{holder}', NAMES[a.holder] || '').replace('{other}', NAMES[a.other] || '').replace('{chooser}', NAMES[a.chooser] || '');
  return t;
}
// ★ 끝까지 숨긴 것 — 결산에서 비밀 시트처럼 편다. a: { item, zone, res, prog }
export const SECRET_TEXT = {
  tapeUnseen: '배수관 뒤 테이프는 끝내 확인하지 않았다.',
  keyKept: '배수관 뒤에서 옥상 열쇠를 찾았다. 아무도 몰랐다.',
  keyKnown: '배수관 뒤에서 옥상 열쇠를 찾았다. 결국 상대도 알게 됐다.',
  radioUnheard: '무전기는 끝내 켜지 않았다. 22시 15분 방송의 끝 문장은 듣지 못했다.',
  bcastKept: (a) => `22시 15분 방송의 덧입혀진 끝 문장을 혼자 들었다.${a.seen ? ' 무전기를 든 모습은 들켰다.' : ''} 내용은 끝내 말하지 않았다.`,
  bcastBoth: '둘 다 그 방송을 들었다. 그 이야기는 한 번도 하지 않았다.',
  bcastTold: '22시 15분 방송의 끝 문장을 털어놓았다.',
  underKept: (a) => `01시 10분 지하 구간 방송을 혼자 들었다.${a.used ? ' 그 길을 혼자 썼다.' : ''} 끝내 말하지 않았다.`,
  underBypass: (a) => `물린 채로 보일러실 계단을 올라왔다. 검문은 거치지 않았다.${a.kept ? '' : ' 결국 들켰다.'}`,
  noteKept: (a) => `끝내 건네지 못한 쪽지: 「${a.text}」`,
  replay: (a) => `${NAMES[a.whom]}의 무전 녹음을 ${a.n}번 다시 들었다.${a.seen ? ' 수신기를 귀에 대는 모습은 들켰다.' : ''}`,
  biteKept: (a) => `물린 자국을 소매 밑에 숨겼다.${a.prog === 'prog' ? ' 진행성이라는 것도 알고 있었다.' : a.prog === 'non' ? ' 비진행성이라는 건 혼자 알았다.' : ''}`,
  biteKnown: '물린 자국은 결국 들켰다.',
  resultKept: (a) => `진단 결과지(${a.res === 'clear' ? '이상 없음' : a.res === 'prog' ? '진행성' : '비진행성'})를 혼자 봤다.`,
  resultTold: (a) => `진단 결과지(${a.res === 'clear' ? '이상 없음' : a.res === 'prog' ? '진행성' : '비진행성'})를 보여 주었다.`,
  hideKept: (a) => `${a.zone ? j(ZONE_TEXT[a.zone].short, '에') + ' ' : ''}${j(ITEM_TEXT[a.item] ? ITEM_TEXT[a.item].name : a.item, '을')} 숨겨 두었다. 끝내 찾지 못했다.`,
  hideFound: (a) => `숨겨 둔 ${j(ITEM_TEXT[a.item] ? ITEM_TEXT[a.item].name : a.item, '은')} 들켰다.`,
};
export const secretLine = (x) => { const t = SECRET_TEXT[x.k]; return typeof t === 'function' ? t(x) : t || ''; };

// ★ 결말 문단 — 같은 결말도 렌과 아케치가 다르게 기억한다
//   together 둘 다 탔다 / iWent 나만 탔다 / iStayed 나만 남았다 / bothStayed 둘 다 남았다
//   theyTurned 상대가 전환됐다 / iTurned 내가 전환됐다 / theyDied 상대를 잃었다 / iDied 내가 죽었다 / bothGone 둘 다
export const ENDING_TEXT = {
  ren: {
    together: '버스 창에 김이 서렸다. 옆자리의 아케치는 자는 척을 했다. 어깨가 닿아도 비키지 않았다. 도쿄를 벗어나는 표지판을 둘 다 못 봤다.',
    iWent: '뒷유리 너머로 대피소 지붕이 작아졌다. 창에 손바닥을 댔다. 저쪽에서 손을 들어 주지는 않았다. 아케치다운 배웅이었다.',
    iStayed: '버스가 떠났다. 창가에 앉은 얼굴이 이쪽을 보지 않으려 애쓰는 게 보였다. 그거면 됐다. 셔터를 반만 내린 가게 하나쯤, 누가 지켜야 하니까.',
    bothStayed: '엔진 소리가 멀어졌다. 둘 다 숙직실 바닥에 앉아 그 소리가 다 사라질 때까지 기다렸다. 아케치가 먼저 웃었다. 이유는 묻지 않았다.',
    stayedApart: (c) => `${zn(c, 'ren')}에서 엔진 소리가 멀어지는 걸 들었다. 소리가 다 끊긴 뒤에도 아케치는 오지 않았다. 아마 그도 어딘가에서 같은 소리를 듣고 있었을 것이다.`,
    iRefused: '검사원이 고개를 저었다. 아무 말 없이 줄에서 빠졌다. 소매 밑의 자국이 그제야 아프기 시작했다.',
    iStayedAway: (c) => `${zn(c, 'ren')}에서 엔진 소리만 들었다. 그 차에 누가 탔는지는, 돌아와서 빈자리를 보고서야 알았다.`,
    theyTurned: '그가 마지막으로 낸 소리는 이름이 아니었다. 그래도 나는 그걸 대답이라고 여기기로 했다.',
    iTurned: '마지막으로 기억나는 건 손목을 붙잡던 손의 온도다. 차가웠는지 따뜻했는지는, 이제 알 수 없다.',
    theyDied: '새벽이 왔다. 다섯 시는 둘이 함께 세던 숫자였다. 혼자 세니 너무 짧았다.',
    iDied: '아케치가 뭐라고 했다. 처음으로 가면 없는 목소리였는데, 끝까지 들을 수가 없었다.',
    bothGone: '대피소에는 아무도 남지 않았다. 숙직실 의자에 앞치마 하나가 걸려 있었다.',
  },
  akechi: {
    together: '창에 기대 눈을 감았다. 잠든 척이라는 건 렌도 알 것이다. 그래도 어깨를 빼지 않았다. 이번만은, 계산하지 않기로 했다.',
    iWent: '돌아보지 않았다. 돌아보면 내릴 것 같아서. 명단의 이름 두 줄 중 한 줄이 먼저 지워지는 걸 상상하지 않으려고 창밖만 봤다.',
    iStayed: '버스 꽁무니가 모퉁이를 돌았다. 잘 됐다. 원래 혼자 남는 쪽이 익숙하다. 그런데 왜 이렇게 조용한지 모르겠다.',
    bothStayed: '바보 같은 선택이었다. 둘 다 알고 있었다. 그래서 웃음이 났다. 다섯 시가 지나도 해는 그냥 떴다.',
    stayedApart: (c) => `${zn(c, 'akechi')}에서 엔진 소리를 들었다. 같은 소리를 렌도 들었을까. 확인하러 가지는 않았다. 아직은.`,
    iRefused: '재검사에서 걸렸다. 놀라지 않았다. 줄에서 빠지면서, 렌 쪽은 보지 않았다.',
    iStayedAway: (c) => `${zn(c, 'akechi')}에서 차가 떠나는 소리를 들었다. 창가에 앉은 얼굴은 못 봤다. 보지 않아서 다행이라고 생각하기로 했다.`,
    theyTurned: '“…렌.” 대답은 신음이었다. 끝까지 솔직해지지 못한 건 결국 이쪽이었다.',
    iTurned: '이름을 부르려고 했다. 입에서 나온 건 다른 소리였다. 그 애가 울지 않기를, 그것만은 아직 바랄 수 있었다.',
    theyDied: '경쟁자가 사라진 세상은 생각보다 시시했다. 그걸 확인하려고 살아남은 건 아니었는데.',
    iDied: '하필이면 너구나, 라고 했었다. 마지막도 하필이면 너였다. 나쁘지 않았다.',
    bothGone: '누구의 이름도 명단에 남지 않았다. 처음부터 그 편이 나았을지도 모른다.',
  },
};
const zn = (c, r) => { const z = c.flags && c.flags.busZones ? c.flags.busZones[r] : c.players[r].zone; return ZONE_TEXT[z] ? ZONE_TEXT[z].name : '대피소'; };
// 결말 문단(문장이 함수면 그 판의 자리를 넣어 쓴다)
const PROMISE_TEXT = { ren: '‘같이 가거나, 같이 남거나.’ 그렇게 말한 건 나였다.', akechi: '‘같이 가거나, 같이 남거나.’ 렌은 그렇게 말했었다.' };
export function endingText(c, me) {
  const k = endingKey(c, me), f = c.flags || {};
  let t = ENDING_TEXT[me][k]; t = typeof t === 'function' ? t(c) : t || '';
  const gone = ['iDied', 'iTurned', 'bothGone'].includes(k);
  // 마지막 밤의 약속을 한 사람만 떠난 판에서 깨뜨렸다
  if (f.n2Together && ['iWent', 'iStayed', 'iStayedAway', 'iRefused'].includes(k)) t = `${PROMISE_TEXT[me]} ${t}`;
  const tail = [];
  if (f.n2Coffee && !gone) tail.push(k === 'together' ? '커피는 르블랑에서 갚기로 했다.' : ['theyDied', 'theyTurned'].includes(k) ? '빚진 커피 한 잔이 남았다.' : '커피 한 잔은 아직 빚으로 남아 있다.');
  if (f.apronTied && !gone) tail.push(me === 'ren' ? '허리 뒤의 매듭은 아직 풀지 않았다.' : '그 매듭은 내가 묶은 거였다.');
  return [t, ...tail].join(' ');
}
export function endingKey(c, me) {
  const P = c.players, a = P[me].fate, b = P[me === 'ren' ? 'akechi' : 'ren'].fate;
  const F = c.flags || {}, Z = F.busZones;
  if (a === 'stayed' && F['boardFail_' + me]) return 'iRefused';
  if (a === 'stayed' && b === 'boarded' && Z && Z[me] !== 'checkpoint') return 'iStayedAway';
  if (a === 'stayed' && b === 'stayed' && Z && Z.ren !== Z.akechi) return 'stayedApart';
  const gone = (f) => f === 'dead' || f === 'turned';
  if (gone(a) && gone(b)) return 'bothGone';
  if (a === 'turned') return 'iTurned';
  if (a === 'dead') return 'iDied';
  if (b === 'turned') return 'theyTurned';
  if (b === 'dead') return 'theyDied';
  if (a === 'boarded' && b === 'boarded') return 'together';
  if (a === 'boarded') return 'iWent';
  if (b === 'boarded') return 'iStayed';
  return 'bothStayed';
}

// 결산의 '그날 밤의 일'
export function storyLines(f) {
  const out = [];
  const N = (r) => NAMES[r] || r;
  if (f.signBlocked) {
    out.push(`${f.signBlocked.day}일 밤, ${j(N(f.signBlocked.by), '이')} ${N(f.signBlocked.on)}의 서명을 막았다.`);
    if (f.signOutcome === 'yield') out.push(`${j(N(f.signBlocked.on), '은')} 펜을 내려놓았다.`);
    if (f.signOutcome === 'pulled') out.push(`${j(N(f.signBlocked.on), '은')} 뿌리치고 이름을 썼다.`);
    if (f.signOutcome === 'stopped') out.push('펜은 끝내 멈췄다.');
    if (f.broadcastShared) out.push('이튿날, 막은 이유(덧입힌 방송)를 들려주었다.');
    else if (f.ownReason) out.push(`이튿날, ${j(N(f.signBlocked.by), '은')} 방송 대신 자기 말로 이유를 댔다.`);
    else if (f.askedNoAnswer) out.push('이튿날 렌이 물었지만, 대답은 매듭이었다.');
    else if (f.renSilent) out.push('이튿날 아케치가 되물었지만, 렌은 앞치마 끈만 만지작거렸다.');
    else out.push('막은 이유는 끝내 말하지 않았다.');
  }
  if (f.apronTied) out.push('앞치마는 다시 렌의 허리에 묶였다.');
  else if (f.apronHanded) out.push('앞치마는 갠 채로 렌의 손에 돌아갔다.');
  if (f.n2Together) out.push('마지막 밤, 렌은 “같이 가거나, 같이 남거나”라고 했다.');
  if (f.n2Deflect) out.push('마지막 밤, 아케치는 자기 이름 이야기를 피했다.');
  if (f.n2Coffee) out.push('커피 한 잔이 빚으로 남았다.');
  if (f.n2You) out.push('“네가 타니까.” 아케치는 대답하지 않았다.');
  if (f.n2Confess) out.push(`마지막 밤, 아케치가 무전기를 꺼내 놓았다.${f.n2StillGo ? ' 렌은 그래도 가자고 했다.' : f.n2Stay ? ' 렌은 같이 남자고 했다.' : ''}`);
  { // 나눠 먹기: 어제 받은 방식을 기억했는가
    const ms = f.meals || [];
    let said = 0;
    for (let i = 0; i < ms.length && said < 2; i++) {
      const m = ms[i];
      if (m.how === 'half') { out.push(`${m.day}일, ${j(N(m.to), '은')} 받은 통조림을 정확히 반 덜어 돌려주었다.`); said++; continue; }
      if (m.style === 'split') {
        const prev = ms.slice(0, i).find((x) => x.how === 'half' && x.from === m.from && x.to === m.to);
        if (prev) { out.push(`${m.day > prev.day ? '다음 날' : '다음번'}, ${j(N(m.from), '은')} 처음부터 두 몫으로 나눠 ${N(m.to)}에게 고르게 했다.`); said++; }
      }
    }
  }
  if (f.manMet) out.push(f.manTold === 'full' ? '셋째 날 밤, 무전기를 준 남자가 창을 두드렸다. 물을 받고, 끝 문장과 열쇠의 주인을 털어놓았다.' : '셋째 날 밤, 무전기를 준 남자가 창을 두드리고 갔다.');
  if (f.crowdLed) out.push(`${f.crowdLed.day}일, ${j(N(f.crowdLed.who), '이')} 큰길의 무리를 대피소 앞까지 끌고 왔다.`);
  if (f.lastMeal) {
    const LM = { lockIn: '마지막 배급을 둘이 나눠 먹고, 문을 걸었다.', walk: '마지막 배급을 먹고, 걸어서 나가기로 했다.', yield: `모자란 아침, ${j(N(f.lastMeal.who), '은')} 자기 몫을 넘겼다.`, split: '모자란 아침을 반씩 나눴다.', goOut: `모자란 아침, ${j(N(f.lastMeal.who), '은')} 혼자 다시 문을 나섰다.`, apart: '마지막 아침, 둘은 같은 곳에 있지 않았다.', interrupted: '마지막 아침은 끝까지 먹지 못했다.' };
    if (LM[f.lastMeal.o]) out.push(LM[f.lastMeal.o]);
  }
  if (f.penOffered) out.push(`${j(N(f.penHolder), '이')} 먼저 펜을 내밀었다.${f.penWritten ? ' 이름이 적혔다.' : f.penRefused ? ' “아직은.”' : ''}`);
  return out;
}

export const MARK_TEXT = { water: '물', crowd: '무리', danger: '위험', wait: '여기서 기다림', supply: '물자', hid: '숨겨 둠', custom: '' };

export const ROUTE_TEXT = { main: '큰길', alley: '뒷골목', under: '지하 구간' };
export const DANGER_TEXT = { crowd: '무리가 몰려 있다', calm: '조용하다' };

export const SIGNAL_TEXT = { wait: '기다려', coming: '지금 갈게', goahead: '먼저 가', help: '도와줘' };

// 기록 문장
export const LOG = {
  'intro.self': '도쿄 봉쇄 첫날 밤 22시. 대피소 외벽 처마 밑. 첫 이송은 모레 새벽 다섯 시, 자리는 하나. 마지막은 나흘 뒤 새벽 다섯 시라고 했다.',

  // 안내 방송(대피소 전체)
  paOpen: '[안내] 검문은 00시 30분에 닫힙니다.',
  paBroadcast: '[안내] 22시 15분, 숙직실 수신기로 이송 안내를 송출합니다.',
  paRegOpen: '[안내] 지금부터 검문대에서 이송 접수를 받습니다.',
  // ★ 22:15 방송 — 앞부분은 수신기 근처면 저절로, 뒷부분은 끝까지 들어야
  bcastHead: '지직— [이송 안내] 이송 차량은 셋째 날 오전 다섯 시, 구립 체육관 앞… 접수는 검문대에서…',
  bcastTail: '…접수자는 탑승 시 재검사를 받습니다. ……재검사 불합격자는 명단에서 제외… 반복합니다—',
  'bcastCut.self': '방송이 끝났다. 끝부분을 놓쳤다.',
  'listen.self': '수신기에 귀를 댄다.',
  'listen.same': '{who:이} 수신기에 귀를 댄다.',
  'pipeStart.same': '{who:이} 배수관 뒤를 더듬는다.',
  'pipeStart.glass': '창 너머의 {who:이} 배수관 쪽으로 손을 뻗는다.',
  'pipe.self': (a) => a.found ? '배수관 뒤에 테이프로 붙여 둔 열쇠. 꼬리표에 ‘옥상’.' : '배수관 뒤에는 테이프 자국만 남아 있다.',
  'pipe.same': (a) => a.found ? `${j(a.who, '이')} 배수관 뒤에서 뭔가를 떼어 낸다.` : `${j(a.who, '이')} 배수관 뒤를 더듬다 손을 뺀다.`,
  'special.ren.pipe': '(오는 길에 본 그거다. 누가, 왜 대피소 옥상 열쇠를 밖에 숨겨 뒀지?)',
  'shout.self': '{to:을} 불렀다.',
  'shout.same': '{who:이} 소리쳐 부른다.',
  'shout.glass': '창 너머에서 {who:이} 이름을 부른다. 유리 너머로도 들린다.',
  'shout.door': '옥상 문 너머에서 {who:이} 부르는 소리.',
  'shout.near': '어디선가 {who:이} 부르는 소리.',
  'skip.self': (a) => `— 시간이 흘렀다. —`,
  sc: (a) => (a.who ? `${a.who} 「${sceneLine(a)}」` : sceneLine(a)),
  scPick: (a) => `(${a.who} — ${SCENE_TEXT[a.sc] ? SCENE_TEXT[a.sc].opts[a.opt] : ''})`,
  'scene.same': (a) => `장면 「${SCENE_TEXT[a.sc] ? SCENE_TEXT[a.sc].title : ''}」`,
  apronHang: '렌이 젖은 앞치마를 벗어 의자 등받이에 걸어 둔다.',
  'buildStart.self': (a) => `${BUILD_TEXT[a.id].name}을(를) 만들기 시작한다.`,
  'buildStart.same': (a) => `${j(a.who, '이')} ${BUILD_TEXT[a.id].name} 일을 시작한다.`,
  'built.self': (a) => `${BUILD_TEXT[a.id].name}을(를) 갖췄다.`,
  'built.same': (a) => `${j(a.who, '이')} ${BUILD_TEXT[a.id].name}을(를) 갖춘다.`,
  'built.glass': (a) => `창 너머에서 ${j(a.who, '이')} 뭔가를 고정한다.`,
  'buildFail.self': '재료가 모자라 손을 멈췄다.',
  'recharge.self': '배터리를 갈아 끼웠다. 무전기가 꽉 찼다.',
  'radioDead.self': '무전기 불이 꺼졌다. 충전이 다 됐다.',
  'offer.self': (a) => `${a.to}에게 ${a.kind === 'meal' ? '식량을 나눠 먹자고 했다' : a.kind === 'care' ? '붕대를 감아 주겠다고 했다' : '어깨를 빌려주겠다고 했다'}.`,
  'offer.same': (a) => `${j(a.who, '이')} ${a.kind === 'meal' ? '식량을 내밀며 나눠 먹자고 한다' : a.kind === 'care' ? '붕대를 꺼내 감아 주겠다고 한다' : '말없이 어깨를 내준다'}.`,
  'offerNo.self': '고개를 저었다.',
  'offerNo.same': '{who:이} 고개를 젓는다.',
  'offerFail.self': '건넬 것이 없다.',
  'meal.self': (a) => (a.style === 'split' ? `먼저 두 몫으로 나눠 놓았다. ${j(a.to, '이')} ${a.how === 'left' ? '왼쪽' : '오른쪽'} 몫을 골랐다.`
    : a.how === 'half' ? `통조림을 ${a.to} 쪽으로 밀어 두었다. ${j(a.to, '은')} 정확히 반을 덜어 돌려준다.`
    : `통조림을 ${a.to} 쪽으로 밀어 두었다. ${j(a.to, '은')} 그대로 받았다.`),
  'meal.same': (a) => (a.style === 'split' ? `${j(a.who, '이')} 먼저 두 몫으로 나눠 놓는다. ${a.how === 'left' ? '왼쪽' : '오른쪽'} 몫을 골랐다.`
    : a.how === 'half' ? `${j(a.who, '이')} 통조림을 내 쪽으로 밀어 둔다. 정확히 반을 덜어 돌려주었다.`
    : `${j(a.who, '이')} 통조림을 내 쪽으로 밀어 둔다. 그대로 받았다.`),
  'wakeApron.self': '아침 점검 방송에 눈이 떠진다. 바깥은 아직 닫혀 있다.',
  'wakeNight2.self': '형광등이 한 번 깜빡인다. 잠이 얕게 깬다.',
  'sentBus.self': '차는 떠났다. 06시 배급까지, 남은 것으로 버텨야 한다.',
  'jugEmpty.self': '물통이 비어 있다.',
  'crowdBehind.self': '등 뒤로 발소리가 불어난다. 큰길의 무리가 따라붙었다!',
  'crowdBehind.radio': (a) => `지직— ${a.who}의 숨이 거칠다. 뒤에서 여럿의 발소리.`,
  'crowdRun.self': '그대로 달린다. 검문대까지 끌고 갈 수도 있다.',
  'crowdVeer.self': (a) => `${a.item ? `${j(ITEM_TEXT[a.item] ? ITEM_TEXT[a.item].name : a.item, '을')} 내려놓고 ` : ''}골목으로 튼다. 돌아가는 길이 길어진다.`,
  'replay.self': (a) => `수신기를 귀에 대고 녹음을 다시 튼다.${a.n > 1 ? ` (${a.n}번째)` : ''}`,
  'replay.same': '{who:이} 수신기를 귀에 댄다.',
  replayLine: (a) => `녹음 — 지직… ${a.who} 「${a.text}」`,
  'care.self': '{to}의 상처에 붕대를 감아 주었다.',
  'care.same': '{who:이} 상처에 붕대를 감아 준다.',
  'careBite.self': '{to}의 왼팔에 잇자국이 있다.',
  'careSeen.self': '{who:이} 왼팔의 잇자국을 봤다.',
  'lean.self': '{to}에게 어깨를 빌려주었다. 둘이 기대어 눈을 감는다.',
  'lean.same': '{who:이} 어깨를 내준다. 둘이 기대어 눈을 감는다.',
  'lean.glass': '창 너머로 둘이 기대어 앉은 게 보인다.',
  'answerSos.self': '수신기에 대고 응답했다. 목소리가 벽에 울린다.',
  'answerSos.same': '{who:이} 수신기에 대고 응답한다.',
  nScratch: '창을 긁는 소리. 손톱 같은 것이 유리를 긁는다.',
  nScratchBoards: '판자 너머에서 긁는 소리. 판자가 버틴다.',
  nSos: '지직— …여기는 미나토구… 아이 둘이랑… 물이… 누구 없— 지직—',
  nSosReply: '지직— …고마워요. 상점가 약국 뒤 창고, 물이 남아 있어요. 우리는 못 가요… 지직—',
  nStranger: '창을 두드리는 소리. 낯선 목소리가 작게 말한다. “물… 물 좀…”',
  nStrangerBoards: '판자를 두드리는 소리. 누군가 한참 서 있다 간다.',
  nStrangerThanks: (a) => `창틀의 ${a.item ? ITEM_TEXT[a.item].name : '물건'}이 사라졌다. “…고마워요.”`,
  nStrangerGone: '두드리는 소리가 멎었다. 발소리가 멀어진다.',
  nManBoards: '판자 너머에서 낮은 목소리. “…무전기, 잘 쓰고 있어요?” 대답을 기다리지 않고 발소리가 멀어진다.',
  nManPart: '멀어지던 발소리가 한 번 멈춘다. “끝 문장, 들었죠? 그거면 됐어요.”',
  nManTell1: '“방송 끝 문장은 내가 붙였어요. 물린 사람은 안 태운대요. 위에서는 그 말을 빼고 내보내더라고.”',
  nManTell2: '“배수관 열쇠도 나예요. 검문대에서 쫓겨난 사람이 들어갈 문 하나쯤은 있어야지. 지하 중계기도 내가 켜 뒀어요.”',
  'special.akechi.man': '(이 목소리. 오후에 무전기를 쥐여 준 그 남자다.)',
  'special.akechi.bus': '(그 문장이다. 덧입힌 건 음모가 아니라 경고였다.)',
  'special.ren.bus': '(아케치가 말한 그 문장이다.)',
  nSleeptalk: (a) => `${j(a.who, '이')} 잠결에 뭔가 중얼거린다. 알아들을 수 있는 건 누군가의 이름 하나뿐이다.`,
  nQuiet: (a) => `아주 조용하다. (말 걸 거리 — ${QUESTIONS[a.q]})`,
  'fillStart.self': '펌프 손잡이를 잡는다.',
  'fillStart.same': '{who:이} 펌프질을 시작한다.',
  'fillStart.near': '멀리서 삐걱거리는 펌프 소리.',
  'fillDone.self': (a) => `물통에 물을 채웠다 (${a.left}번 분량).${a.left >= 4 ? ' 무겁다.' : ''}`,
  'fillDone.same': '{who:이} 물통 마개를 잠근다.',
  'hide.self': '{item:을} 숨겨 두었다. 지도에 표시했다.',
  'hide.same': '{who:이} {item:을} 어딘가에 숨긴다.',
  'shareMap.self': '{to}와 지도를 함께 폈다. 서로의 표시를 옮겨 적었다.',
  'shareMap.same': '{who:이} 지도를 펴 보인다. 서로의 표시를 옮겨 적었다.',
  'carryWith.self': '{to}의 물통 한쪽을 함께 든다.',
  'carryWith.same': '{who:이} 물통 한쪽을 함께 든다.',
  'carryStop.self': '물통에서 손을 뗐다.',
  'carryStop.same': '{who:이} 물통에서 손을 뗀다.',
  'carryMove.self': '{who}와 물통을 함께 들고 {zone:으로} 왔다.',
  'help.self': '{to}를 거든다.',
  'help.same': '{who:이} 옆에서 거든다.',
  'takeOver.self': '{to}가 하던 일을 넘겨받았다.',
  'takeOver.same': '{who:이} 하던 일을 넘겨받는다.',
  'routeShift.self': (a) => `${a.route === 'main' ? '큰길' : '뒷골목'}${a.v === 'crowd' ? '로 무리가 흘러든다.' : '의 무리가 흩어진다.'}`,
  paGateOpen: '[안내] 07시, 검문을 엽니다. 들어올 때는 다시 검사를 받으십시오.',
  paGateWarn: '[안내] 30분 뒤 검문을 닫습니다.',
  paGateClose: '[안내] 검문을 닫았습니다.',
  paDusk: '[안내] 해가 졌습니다. 바깥 활동을 삼가십시오.',
  paBus: '[안내] 05시, 검문대 앞에 이송 차량이 도착합니다. 이송증을 준비하십시오.',
  paBus1: '[안내] 05시, 검문대 앞에 첫 이송 차량이 도착합니다. 남은 자리는 하나입니다. 이송증을 준비하십시오.',
  paBus2: '[안내] 05시, 검문대 앞에 마지막 이송 차량이 도착합니다. 이송증을 준비하십시오.',
  paBusHere1: '[안내] 첫 이송 차량이 도착했습니다. 자리는 하나입니다. 05시 15분에 출발합니다. 물린 자국이 있는 분은 탑승할 수 없습니다.',
  paBusGone1: '[안내] 첫 이송 차량이 출발했습니다. 마지막 차량은 5일째 05시입니다.',
  'busFull.self': '자리가 없다. 문이 눈앞에서 닫힌다.',
  'busFull.same': '{who:이} 차에 오르려다 멈춘다. 자리가 없다.',
  paBusHere: '[안내] 이송 차량이 도착했습니다. 05시 15분에 출발합니다. 탑승 전 재검사가 있습니다. 물린 자국이 있는 분은 탑승할 수 없습니다.',
  paBusGone: '[안내] 이송 차량이 출발했습니다. 다음 차량은 미정입니다.',
  'dayStart.self': (a) => `— ${a.day}일째. —`,
  'scout.self': (a) => `큰길: ${a.main === 'crowd' ? '무리가 몰려 있다' : '조용하다'}.` + (a.alley ? ` 뒷골목: ${a.alley === 'crowd' ? '무리가 몰려 있다' : '조용하다'}.` : ''),
  'scout.same': '{who:이} 멀리 길을 살핀다.',
  'crowd.self': (a) => `${a.route === 'main' ? '큰길' : '뒷골목'}에 무리가 몰려 있었다. 따라붙었다!`,
  crowdFollow: (a) => `처마 밑 창밖으로 무언가 따라붙었다. ${j(a.who, '이')} 큰길에서 끌고 온 것들이다.`,
  'leave.self': (a) => a.under ? `보일러실 계단을 내려간다. 지하 구간으로.` : a.retreat ? `${j(a.zone, '으로')} 물러선다.` : `${j(a.zone, '으로')} 향한다.`,
  'leave.same': (a) => a.under ? `${j(a.who, '이')} 보일러실 계단 아래로 내려간다.` : a.retreat ? `${j(a.who, '이')} ${j(a.zone, '으로')} 물러선다.` : `${j(a.who, '이')} ${j(a.zone, '으로')} 간다.`,
  underCut: '지직— 무전이 끊겼다. 잡음조차 없다.',
  'underDark.self': (a) => (a.lit ? '조명 끝에 뭔가 걸린다. 매표소 그늘에서 몸을 일으킨다!' : '어둠 속에서 숨소리가 바로 옆이다. 보이지 않는다!'),
  'underDark.same': '{who:이} 지하 출구에서 뛰쳐나온다. 뒤에 뭔가 붙어 있다!',
  'underCache.self': (a) => `역무실 철문 안쪽, 누가 두고 간 상자. ${j(ITEM_TEXT[a.item] ? ITEM_TEXT[a.item].name : a.item, '이')} 들어 있다.`,
  'underHome.self': '보일러실 계단으로 숙직실에 올라왔다. 검문대는 거치지 않았다.',
  'underLearn.self': (a) => `${j(a.who, '이')} 지도에 선을 하나 더 긋는다. 숙직실 보일러실 계단에서 지하역으로.`,
  'alleyFind.self': (a) => `샛길 담장 밑, 누가 숨겨 둔 ${j(ITEM_TEXT[a.item] ? ITEM_TEXT[a.item].name : a.item, '이')} 있다.`,
  'crowd.same': '{who:이} 무리를 끌고 들어온다!',
  'crowd.near': '멀리서 여럿이 몰려오는 발소리.',
  'crowd.radio': '지직— 숨이 찬 소리, 그 뒤로 여럿의 발소리.',
  'board.self': '재검사를 통과했다. 차에 오른다.',
  'board.same': '{who:이} 차에 오른다.',
  'boardFail.self': '재검사. 검사원이 왼팔에서 손을 멈춘다. “탈 수 없습니다.”',
  'boardFail.same': '검사원이 {who}의 왼팔을 보고 고개를 젓는다.',
  'death.self': (a) => a.cause === 'turned' ? '열이 머리끝까지 차오른다. 더는 내가 아니다.' : '더는 움직일 수 없다.',
  'death.same': (a) => a.cause === 'turned' ? `${j(a.who, '이')} 일어선다. 눈이 다르다.` : `${j(a.who, '이')} 더는 움직이지 않는다.`,
  'death.glass': '창 너머에서 {who:이} 쓰러진다.',
  'death.door': '문 너머에서 비명이 끊긴다.',
  'death.near': '어딘가에서 비명이 끊긴다.',
  'death.radio': '지직— …그리고 아무 소리도 없다.',
  'supWear.self': '억제제가 다했다. 열이 다시 오른다.',
  'bagFull.self': '가방이 꽉 찼다. {item:은} 들 수 없다.',
  'theirBagFull.self': '{to}의 가방이 꽉 찼다.',
  paWarn: '[안내] 20분 뒤 검문과 이송 접수를 마감합니다.',
  paClosed: '[안내] 검문을 마감했습니다. 셔터가 내려간다.',
  paLights: '[안내] 소등합니다. 불침번을 정하십시오.',
  paEnd: '— 02:00. 첫날 밤이 지나갔다. —',
  'signLate.self': '셔터가 내려오며 검사원이 명단을 거둬 갔다.',
  'gateShut.self': '눈앞에서 검문 셔터가 내려왔다.',

  // 무전·수신기 방송
  broadcast1: '지직— …지하 구간 일부 개방… 반복합니다, 지하 구간…',
  'special.akechi0': '(재검사 문장 직전에 잡음이 한 번 뚝 끊겼다. 앞부분과 음질이 다르다.)',
  'special.akechi1': '(송출 위치가 구청 비상망이 아니다. 지하역 쪽 중계기 잡음이 섞여 있다.)',

  // 이동
  'leave.glass': '창 너머의 {who:이} 자리를 뜬다.',
  'enter.self': '{zone}.',
  'enter.same': '{who:이} 들어온다.',
  'enter.glass': '창 너머에 {who:이} 나타난다.',
  'moveFail.self': '{zone} 쪽 길이 막혀 있다.',
  'carried.self': '{who:이} 부축해 {zone:으로} 함께 왔다.',
  'zHere.self': '— 무언가 있다.',

  // 탐색
  'search.same': '{who:이} 주변을 뒤진다.',
  'searchDone.found': (a) => `뒤져서 찾았다: ${a.items.map((k) => ITEM_TEXT[k].name).join(', ')}.`,
  'searchDone.none': '더 찾을 만한 건 없어 보인다.',
  'special.ren.eaves': '(배수관 뒤에 뭔가 끼워 둔 자국. 누군가 이 길로 드나들었다.)',
  'special.ren.door': '(옥상 문 걸쇠가 안쪽에서만 걸린다. 안에서 열어 주면 이 길로 들어갈 수 있다.)',

  // 물건
  'pick.self': (a) => a.box ? `구호함에서 ${j(iname(a.item), '을')} 꺼냈다.` : `${j(iname(a.item), '을')} 집었다.`,
  'pick.same': (a) => a.box ? `${j(a.who, '이')} 구호함에서 ${j(iname(a.item), '을')} 꺼낸다.` : `${j(a.who, '이')} ${j(iname(a.item), '을')} 집는다.`,
  'drop.self': '{item:을} 내려놓았다.',
  'drop.same': '{who:이} {item:을} 내려놓는다.',
  'give.self': '{to}에게 {item:을} 건넸다.',
  'give.same': (a) => a.toMe ? `${j(a.who, '이')} ${j(iname(a.item), '을')} 건넨다.` : `${j(a.who, '이')} ${a.to}에게 ${j(iname(a.item), '을')} 건넨다.`,
  'sillPut.self': '창틀에 {item:을} 올려 두었다.',
  'sillPut.same': '{who:이} 창틀에 {item:을} 올려 둔다.',
  'sillPut.glass': '창 너머의 {who:이} 창틀에 {item:을} 올려 둔다.',
  'sillTake.self': '창틀에서 {item:을} 가져왔다.',
  'sillTake.same': '{who:이} 창틀에서 {item:을} 가져간다.',
  'sillTake.glass': '창 너머에서 {who:이} 창틀의 {item:을} 가져간다.',
  'stash.self': '구호함에 {item:을} 넣었다.',
  'stash.same': '{who:이} 구호함에 {item:을} 넣는다.',

  // ★ 검문
  'inspectPass.self': '검사원이 양팔을 확인하고 손목에 출입 띠를 감아 준다.',
  'inspectPass.same': '{who:이} 소매를 걷어 보이고 검사를 통과한다.',
  'inspectFail.self': '검사원의 손전등이 왼팔에서 멈춘다. “들어갈 수 없습니다.”',
  'inspectFail.same': '검사원이 {who}의 소매를 걷는다. 왼팔에 잇자국. 출입이 거부된다.',
  'inspectFail.near': '검문대 쪽에서 실랑이하는 목소리가 들린다.',

  // ★ 서명과 개입
  'signStart.self': '이송 명단을 당겨 이름을 적기 시작한다.',
  'signStart.same': '{who:이} 이송 명단을 당겨 펜을 든다.',
  'signDone.self': '이송 명단에 이름을 적었다. 이송증을 받았다.',
  'signDone.same': '{who:이} 서명을 마치고 이송증을 받는다.',
  'block.self': (a) => a.kind === 'sign' ? '종이를 손바닥으로 눌렀다.' : a.kind === 'move' ? '팔을 붙잡았다.' : '문을 몸으로 밀었다.',
  'block.same': (a) => a.kind === 'sign' ? `${j(a.who, '이')} 종이를 손바닥으로 누른다. 펜이 멈췄다.` : a.kind === 'move' ? `${j(a.who, '이')} 팔을 붙잡는다.` : `${j(a.who, '이')} 걸쇠 위로 손을 얹는다.`,
  'block.door': '문 너머에서 누군가 문을 민다. 걸쇠가 걸리지 않는다.',
  'release.self': '손을 뗐다.',
  'release.same': '{who:이} 손을 뗀다.',
  'release.door': '문을 미는 힘이 사라졌다.',
  'yield.self': (a) => a.kind === 'sign' ? '펜을 내려놓았다.' : a.kind === 'move' ? '걸음을 멈췄다.' : '걸쇠에서 손을 뗐다.',
  'yield.same': (a) => a.kind === 'sign' ? `${j(a.who, '이')} 펜을 내려놓는다.` : a.kind === 'move' ? `${j(a.who, '이')} 걸음을 멈춘다.` : `${j(a.who, '이')} 걸쇠에서 손을 뗀다.`,
  'yield.door': '문 안쪽 걸쇠 소리가 멎는다.',
  'pullWin.self': (a) => a.kind === 'move' ? '팔을 뿌리쳤다.' : '다시 당겼다. 손이 떨어져 나간다.',
  'pullWin.same': (a) => a.kind === 'move' ? `${j(a.who, '이')} 팔을 뿌리친다.` : `${j(a.who, '이')} 종이를 다시 당긴다. 손이 미끄러진다.`,
  'pullWin.door': '걸쇠가 억지로 움직이는 소리.',
  'pullLose.self': (a) => a.kind === 'move' ? '뿌리치지 못했다.' : '당겨 봤지만 소용없다. 손을 놓쳤다.',
  'pullLose.same': (a) => a.kind === 'move' ? `${j(a.who, '이')} 뿌리치려다 멈춘다.` : `${j(a.who, '이')} 종이를 당기다 놓친다.`,
  'pullLose.door': '걸쇠가 덜컥거리다 멎는다.',
  'tug.self': '{item}에 두 손이 동시에 닿았다.',
  'tug.same': '{item}에 두 손이 동시에 닿았다.',
  'tugEnd.self': (a) => a.how === 'contest' ? `${j(iname(a.item), '을')} 끝까지 쥐고 있었다.` : `${j(iname(a.item), '을')} 넘겨받았다.`,
  'tugEnd.same': (a) => a.how === 'give' ? `${j(a.by, '이')} ${j(iname(a.item), '을')} 건넨다.` : a.how === 'release' ? `${j(a.by, '이')} 손을 놓는다.` : `${j(a.who, '이')} ${j(iname(a.item), '을')} 끝까지 쥐고 있었다.`,

  // ★ 옥상 문
  'lockStart.self': '옥상 문 걸쇠에 손을 뻗는다.',
  'lockStart.same': '{who:이} 옥상 문 걸쇠에 손을 뻗는다.',
  'lockStart.door': '문 안쪽에서 걸쇠가 덜컥거린다.',
  'lockDone.self': '옥상 문을 잠갔다.',
  'lockDone.same': '{who:이} 옥상 문을 잠근다.',
  'lockDone.door': '찰칵. 옥상 문이 잠겼다.',
  'unlockDone.self': '옥상 문을 열었다.',
  'unlockDone.same': '{who:이} 옥상 문을 연다.',
  'unlockDone.door': '걸쇠가 풀리는 소리.',

  // 두드리기
  'knock.self': '두드렸다.',
  'knock.same': '{who:이} 두드린다.',
  'knock.glass': '창을 두드리는 소리. 유리 너머에 {who:이} 있다.',
  'knock.door': '옥상 문을 두드리는 소리.',
  'knock.near': '어디선가 두드리는 소리.',

  // ★ 상처
  'showWound.self': '소매를 걷어 상처를 보였다.',
  'showWound.same': '{who:이} 왼팔 소매를 걷는다. 잇자국.',
  'showWound.glass': '창 너머의 {who:이} 소매를 걷어 팔을 내민다. 잇자국 같은 것이 보인다.',
  'sleeve.self': '소매를 내려 상처를 덮었다.',
  'sleeve.same': '{who:이} 소매를 내린다.',

  // 좀비
  'zAppear.same': (a) => `어둠 속에서 ${zlabel(a)}가 비틀거리며 다가온다.`,
  'zAppear.glass': '창 너머 처마 밑으로 그림자 하나가 다가온다.',
  'zAppear.near': '근처에서 질질 끄는 발소리.',
  'zWarn.self': '몸을 낮춘다. 달려들 기세다!',
  'lungeMiss.same': (a) => `${zlabel(a)}가 허공을 물어뜯는다.`,
  'graze.self': (a) => `${zlabel(a)}의 할퀴기! ${a.dmg}의 피해.`,
  'graze.same': (a) => `${zlabel(a)}의 할퀴기! ${a.who}에게 ${a.dmg}의 피해.`,
  'graze.glass': '창 너머에서 {who:이} 비틀거린다.',
  'graze.near': '몸싸움하는 소리.',
  'graze.radio': '무전 너머로 거친 숨소리.',
  // ★ 물림
  'bite.self': (a) => `${zlabel(a)}가 왼팔을 물었다! ${a.dmg}의 피해.`,
  'bite.same': (a) => `${zlabel(a)}가 ${a.who}의 왼팔을 물었다! ${a.dmg}의 피해.`,
  'bite.glass': '창 너머의 {who:이} 왼팔을 움켜쥔다.',
  'bite.door': '문 너머에서 몸싸움하는 소리와 짧은 신음.',
  'bite.near': '어딘가에서 몸싸움하는 소리와 짧은 신음.',
  'bite.radio': '무전 너머로 짧은 비명과 잡음.',
  'fight.self': '맞선다.',
  'zWake.same': (a) => `${zlabel({ ...a, ty: 'walker' })}가 고개를 든다. 깼다!`,
  'zWake.glass': '창 너머 구석에서 뭔가 몸을 일으킨다.',
  'zWake.near': '어딘가에서 뭔가 깨어나는 소리.',
  'zFollow.same': (a) => `${zlabel(a)}가 ${ZONE_TEXT[a.from] ? ZONE_TEXT[a.from].short : '어딘가'} 쪽에서 소리를 따라왔다.`,
  'zFollow.glass': '창 너머로 뭔가 이쪽으로 걸어온다.',
  'zFollow.near': '발소리가 옆 구역으로 옮겨 간다.',
  'weaponBroke.self': (a) => `${j(ITEM_TEXT[a.item] ? ITEM_TEXT[a.item].name : a.item, '이')} 못 쓰게 됐다.`,
  'weaponBroke.same': (a) => `${a.who}의 ${j(ITEM_TEXT[a.item] ? ITEM_TEXT[a.item].name : a.item, '이')} 부러진다.`,
  'spray.self': (a) => `소화기를 뿌린다. 하얀 가루 속에서 ${zlabel(a)}가 허우적댄다.`,
  'spray.same': '{who:이} 소화기를 뿌린다. 하얀 가루가 번진다.',
  'spray.glass': '창 너머가 하얗게 뿌예진다.',
  'spray.near': '치익— 뭔가 뿜어지는 소리.',
  'fightLose.self': (a) => `밀렸다! ${zlabel(a)}가 팔을 붙들고 늘어진다.`,
  'fightLose.same': (a) => `${j(a.who, '이')} 밀린다! ${zlabel(a)}가 달라붙는다.`,
  'fightLose.glass': '창 너머에서 누군가 밀려 넘어진다.',
  'fightLose.door': '문 너머에서 넘어지는 소리.',
  'fightLose.near': '어딘가에서 몸싸움이 길어진다.',
  'fightLose.radio': '지직— 짧은 비명, 그리고 뭔가 부딪히는 소리.',
  'dodgeFail.self': '몸을 낮췄지만 한 박자 늦었다.',
  'dodgeFail.same': '{who:이} 피하려다 한 박자 늦는다.',
  'dodgeFail.glass': '창 너머의 {who:이} 피하다 휘청인다.',
  'pushFail.self': (a) => `팔에 힘이 들어가지 않는다. ${zlabel(a)}가 밀리지 않는다.`,
  'pushFail.same': '{who:이} 밀어내려다 헛손질한다.',
  'fight.same': '{who:이} 맞선다.',
  'fight.glass': '창 너머에서 {who:이} 좀비와 엉겨 붙는다.',
  'fight.door': '문 너머에서 부딪히는 소리.',
  'fight.near': '부딪히는 소리.',
  'zDown.self': (a) => `반격! ${zlabel(a)}가 쓰러져 움직이지 않는다.`,
  'zDown.same': (a) => `${a.who}의 반격! ${zlabel(a)}가 쓰러졌다.`,
  'zHit.self': (a) => `${a.item ? `${j(ITEM_TEXT[a.item].name, '으로')} ` : ''}반격! ${zlabel(a)}가 비틀거린다. 아직 서 있다.`,
  'zHit.same': (a) => `${a.who}의 반격! ${zlabel(a)}가 비틀거린다.`,
  'zHit.glass': '창 너머에서 무언가 휘청인다.',
  'zHit.near': '둔탁한 소리.',
  'turn.self': '열이 머리끝까지 차오른다. 더는 내가 아니다.',
  'turn.same': '{who:이} 고개를 든다. 눈이 다르다.',
  'turn.glass': '창 너머의 {who:이} 이상한 각도로 고개를 꺾는다.',
  'turn.door': '문 너머에서 낮은 신음이 길게 이어진다.',
  'turn.near': '어딘가에서 낮은 신음이 길게 이어진다.',
  'turn.radio': '지직— …그르르…',
  'moan.self': (a) => `「${a.text}」`,
  'moan.same': (a) => `좀비(${a.who}) 「${a.text}」`,
  'moan.glass': '창 너머에서 입이 벌어졌다 닫힌다.',
  'moan.door': '문 너머에서 신음.',
  'moan.near': '어딘가에서 신음.',
  statusOn: (a) => `${j(a.who, '이')} [${STATUS_TEXT[a.st]}] 상태가 되었다.`,
  statusOff: (a) => `[${STATUS_TEXT[a.st]}] 상태가 풀렸다.`,
  statusSeen: (a) => `${j(a.who, '이')} [${STATUS_TEXT[a.st]}] 상태로 보인다.`,
  'zDown.glass': '창 너머에서 좀비가 쓰러진다.',
  'zDown.door': '둔탁한 소리. 그리고 조용해진다.',
  'zDown.near': '둔탁한 소리. 그리고 조용해진다.',
  'push.self': (a) => `${zlabel(a)}를 밀쳐 냈다. 잠깐 틈이 생겼다.`,
  'push.same': (a) => `${j(a.who, '이')} ${zlabel(a)}를 밀쳐 낸다.`,
  'push.glass': '창 너머에서 {who:이} 무언가를 밀쳐 낸다.',
  'cover.self': '{to} 앞을 막아섰다.',
  'cover.same': '{who:이} 앞을 막아선다.',
  'zEnterDorm.same': '옥상 계단에서 좀비가 내려온다!',
  'zEnterDorm.door': '옥상 쪽에서 무언가 계단을 굴러 내려오는 소리.',
  'zEnterDorm.near': '옥상 쪽에서 무언가 계단을 굴러 내려오는 소리.',
  'doorScratch.same': '옥상 문 너머에서 긁는 소리.',
  'doorScratch.door': '옥상 문 너머에서 긁는 소리.',
  'noiseHint.same': '멀리서 무리가 움직이는 기척.',
  'noiseHint.glass': '창밖 멀리서 무리가 움직이는 기척.',
  'noiseHint.near': '멀리서 무리가 움직이는 기척.',

  // ★ 감염 경과
  'symptom.self': '손끝이 떨리고 열이 오른다. 악화가 시작됐다.',
  'symptom.same': '{who:이} 잠깐 비틀거리다 벽을 짚는다.',
  'symptom.glass': '창 너머의 {who:이} 벽에 손을 짚는다.',
  'symptomDrop.self': '{item:을} 떨어뜨렸다.',
  'symptomDrop.same': '{who:이} {item:을} 떨어뜨린다.',
  'restrict.self': '다리에 힘이 들어가지 않는다. 움직일 수 없다.',
  'restrict.same': '{who:이} 주저앉아 일어나지 못한다.',
  'restrict.glass': '창 너머의 {who:이} 주저앉는다.',
  'exhausted.self': '숨이 차서 더는 움직일 수 없다.',
  'exhausted.same': '{who:이} 숨을 몰아쉬며 주저앉는다.',
  'exhausted.glass': '창 너머의 {who:이} 주저앉는다.',

  // ★ 진단·억제
  'diagnose.self': (a) => `진단 키트가 결과지를 뱉는다: ${RESULT_TEXT[a.res]}.`,
  'diagnose.same': '{who:이} 진단 키트를 쓴다.',
  'diagnose.door': '삐— 하는 짧은 진단음.',
  'diagnose.near': '삐— 하는 짧은 진단음.',
  'diagShared.same': (a) => `${j(a.who, '와')} 함께 결과지를 본다: ${RESULT_TEXT[a.res]}.`,
  'inject.self': '억제제를 놓았다. 열이 천천히 가라앉는다.',
  'inject.same': '{who:이} 팔에 주사기를 꽂는다.',
  'injectWaste.self': '억제제를 놓았다. 아무 일도 일어나지 않는다.',
  'injectWaste.same': '{who:이} 팔에 주사기를 꽂는다.',
  'bandage.self': '붕대를 감았다.',
  'bandage.same': '{who:이} 붕대를 감는다.',
  'eat.self': '먹었다. 조금 낫다.',
  'eat.same': '{who:이} 뭔가 먹는다.',
  'drink.self': '마셨다.',
  'drink.same': '{who:이} 물을 마신다.',
  'fixRadio.self': '배터리를 끼우자 무전기에 불이 들어온다.',
  'fixRadio.same': '{who:이} 무전기를 만지작거린다. 잡음이 터진다.',
  'note.self': '쪽지를 썼다.',
  'note.same': '{who:이} 뭔가 적는다.',

  // 휴식
  'rest.self': '눈을 붙인다.',
  'rest.same': '{who:이} 눕는다.',
  'rest.glass': '창 너머의 {who:이} 눕는다.',
  'watch.self': '창가에 앉아 망을 본다.',
  'watch.same': '{who:이} 창가에 앉아 망을 본다.',
  'watch.glass': '창 안쪽에 {who:이} 앉아 있다.',
  'wake.self': '잠에서 깼다.',
  'support.self': '{to:을} 부축했다.',
  'support.same': '{who:이} 부축한다.',
  'cold.self': '몸이 얼어붙는다. 기력이 빠져나간다.',

  // 말
  say: '{who} 「{text}」',
  // 행동 묘사(*…*) — 플레이어가 쓴 문장 앞에 이름을 붙인다
  'emote.self': (a) => act(a.who, a.text),
  'emote.same': (a) => act(a.who, a.text),
  'emote.glass': (a) => `창 너머 — ${act(a.who, a.text)}`,
  sayRadio: '지직— {who} 「{text}」',
  'sayGlass.self': '{who} 「{text}」 (유리 너머라 들리지 않았을 것이다)',
  'sayGlass.glass': '창 너머의 {who:이} 뭔가 말한다. 입 모양만 보인다.',
  signal: (a) => `${a.who} 「${SIGNAL_TEXT[a.which]}」`,
  signalRadio: (a) => `지직— ${a.who} 「${SIGNAL_TEXT[a.which]}」`,
  signalGlass: (a) => `창 너머의 ${j(a.who, '이')} 손짓한다: ${SIGNAL_TEXT[a.which]}`,
};

// 상대에 대해 보이는 것(같은 구역일 때)
export const PARTNER_TEXT = {
  asleep: '잠들어 있다', down: '주저앉아 있다', tired: '지쳐 보인다', blood: '소매에 피가 배어 있다',
  typing: '뭔가 말하려 한다', typingGlass: '입을 달싹인다', glass: '창 너머에 있다', supportedByMe: '내가 부축하는 중',
};

// 결과 카드
export const RESULT_CARD = {
  title: '결산',
  fate: { stayed: '남았다', boarded: '이송 차량 탑승', dead: '잃었다', turned: '감염 전환' },
  ends: { bus: '이송 차량이 떠났다', stay: '둘 다 차를 보냈다', death: '한 사람을 잃었다', dev: '시험 종료' },
  secured: '잠자리 확보', unsecured: '잠자리 불안', down: '움직이지 못함', signed: '이송 접수',
  dawn: { normal: '새벽 판정: 일반 판정', progressing: '새벽 판정: 감염 진행 중 생환', turn: '새벽 판정: 감염 전환' },
  noGive: '건넨 물건 없음', noShared: '함께 본 일 없음',
};

// ── 조사 처리 ─────────────────────────────────────────────
function hasBatchim(word) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}
function rieul(word) { const c = word.charCodeAt(word.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 8; }
const PAIRS = { 이: ['이', '가'], 을: ['을', '를'], 은: ['은', '는'], 와: ['과', '와'], 으로: ['으로', '로'] };
export function j(word, p) {
  const w = NAMES[word] || word;
  const pair = PAIRS[p];
  if (!pair) return w + p;
  if (p === '으로' && rieul(w)) return w + '로';
  return w + (hasBatchim(w) ? pair[0] : pair[1]);
}
function act(who, text) {
  const t = String(text || '').trim();
  return `${j(who, '이')} ${t}${/[.!?…」~]$/.test(t) ? '' : '.'}`;
}
const iname = (k) => (ITEM_TEXT[k] ? ITEM_TEXT[k].name : k);
const zname = (k) => (ZONE_TEXT[k] ? ZONE_TEXT[k].name : k);

// ★ 같은 사건, 다른 문장 — 보는 사람(렌/아케치)에 따라 바꿔 쓴다.
//   '.self'는 내가 한 일, '.same'은 곁에 있는 상대가 한 일. 괄호는 내 화면에만 뜨는 속마음.
//   함수가 null을 돌려주면 기본 문장(LOG)을 쓴다.
export const LOG_ROLE = {
  ren: {
    'listen.self': '수신기에 귀를 댄다. (아케치는 이걸 혼자 들었던 걸까.)',
    'listen.same': '아케치가 등을 돌린 채 수신기 볼륨을 줄인다.',
    'pipe.self': (a) => (a.found ? '배수관 뒤에 테이프로 붙여 둔 열쇠. 꼬리표에 ‘옥상’. (오는 길에 본 그 손이다.)' : '배수관 뒤에는 테이프 자국만 남아 있다. (누가 먼저 다녀갔다.)'),
    'pipe.same': (a) => (a.found ? '아케치가 배수관 뒤에서 뭔가를 떼어 낸다. 주머니에 넣는 손이 빠르다.' : null),
    'block.self': (a) => (a.kind === 'sign' ? '종이를 손바닥으로 눌렀다. (손이 먼저 나갔다.)' : null),
    'block.same': (a) => (a.kind === 'sign' ? '아케치의 손바닥이 종이를 누른다. 펜이 멈췄다. 이유는 말하지 않는다.' : null),
    'sleeve.self': '소매를 내려 상처를 덮었다. (아무렇지 않은 얼굴이라면 자신 있다.)',
    'sleeve.same': '아케치가 소매를 끝까지 내린다. 장갑 낀 손목까지.',
    'lean.same': '아케치가 말없이 어깨를 내준다. 이쪽은 보지 않는다.',
    'care.same': '아케치가 붕대를 감아 준다. 손끝이 생각보다 조심스럽다.',
    'offerNo.same': '아케치가 고개를 젓는다. “동정이라면 사양이야.”',
    'replay.same': '아케치가 수신기를 귀에 댄다. 뭘 듣는지 묻기엔 표정이 너무 조용하다.',
  },
  akechi: {
    'listen.self': '수신기에 귀를 댄다. (음질이 다른 끝 문장을 놓치지 않으려 숨을 죽인다.)',
    'listen.same': '렌이 수신기에 귀를 댄다. 들키지 않으려는 기색도 없다.',
    'pipe.same': (a) => (a.found ? '렌이 배수관 뒤에서 뭔가를 떼어 낸다. 처음부터 거기 있는 걸 알았다는 손놀림이다.' : '렌이 배수관 뒤를 더듬다 손을 뺀다. 아쉬운 기색을 숨기지 못한다.'),
    'block.self': (a) => (a.kind === 'sign' ? '종이를 손바닥으로 눌렀다. (설명은 나중이다. 나중이 있다면.)' : null),
    'block.same': (a) => (a.kind === 'sign' ? '렌의 손바닥이 종이를 누른다. 늘 그렇듯 이유보다 손이 먼저다.' : null),
    'sleeve.self': '소매를 내려 상처를 덮었다. (가면이라면 익숙하다.)',
    'sleeve.same': '렌이 소매를 내린다. 아무렇지 않은 척이 서툴다.',
    'lean.same': '렌이 어깨를 내준다. 거절할 이유를 찾다가, 그만둔다.',
    'care.same': '렌이 붕대를 감아 준다. 아프냐고 한 번도 묻지 않는다.',
    'offerNo.same': '렌이 고개를 젓는다. “괜찮아.” 괜찮지 않은 얼굴로.',
    'replay.self': (a) => `수신기를 귀에 대고 녹음을 다시 튼다.${a.n > 1 ? ` (${a.n}번째. 한 번 들은 건 잊지 않는데도.)` : ''}`,
    'replay.same': '렌이 수신기를 귀에 댄다. 숨길 생각도 없는 얼굴이다.',
  },
};
export function fmt(key, a = {}, viewer) {
  const ov = viewer && LOG_ROLE[viewer] ? LOG_ROLE[viewer][key] : undefined;
  if (ov !== undefined) {
    if (typeof ov === 'string') return ov;
    const r = fmtWith(ov, key, a, viewer);
    if (r != null) return r;
  }
  return fmtWith(LOG[key], key, a, viewer);
}
function fmtWith(tpl, key, a = {}, viewer) {
  const args = { ...a, viewer };
  const names = {
    who: a.who ? NAMES[a.who] : '',
    to: a.to ? (a.to === viewer ? '나' : NAMES[a.to]) : '',
    by: a.by ? NAMES[a.by] : '',
    item: a.item ? iname(a.item) : '',
    zone: a.zone ? zname(a.zone) : '',
    text: a.text || '',
  };
  if (tpl === undefined) return '…';
  if (typeof tpl === 'function') {
    return tpl({ ...args, who: names.who, to: names.to, toMe: a.to === viewer, by: names.by, zone: names.zone, item: a.item, items: a.items });
  }
  return tpl.replace(/\{(\w+)(?::(\S+?))?\}/g, (_, k, p) => {
    const w = names[k] !== undefined ? names[k] : String(a[k] ?? '');
    return p ? j(w, p) : w;
  });
}
export { iname, zname };
