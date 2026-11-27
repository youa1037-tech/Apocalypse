# 새벽 다섯 시 · 첫날 검증판

주아케 2인 협동 좀비 생존 웹게임. 첫날 밤 → 아침 점검 → 낮(상점가) → 밤이 반복되고, 3일째 05:00 이송 차량이 첫 탈출 기회입니다. 한 사람이라도 잃으면 끝나고 버틴 날을 셉니다.

## 온라인으로 올리기 (Cloudflare)

컴퓨터에 Node.js가 있어야 합니다. 이 폴더에서:

```
npm install
npx wrangler login      # 브라우저가 열리면 Cloudflare 계정으로 허용
npx wrangler deploy
```

끝나면 `https://saebyeok.<내-계정>.workers.dev` 주소가 나옵니다.
- 방 만들기 → 주소 끝의 `#코드`까지 복사해 친구에게 보내기 → 각자 렌/아케치 선택
- 시험 도구가 필요하면 주소 뒤에 `?dev=1`을 붙이고 방을 만드세요.
- 내 컴퓨터에서만 돌려 보려면 `npx wrangler dev`

## 파일

| 파일 | 내용 |
|---|---|
| `public/js/text.js` | **원고.** 모든 문장. ★ 표시가 개별 집필 권장 사건 |
| `public/js/tutorial.js` | 연습 판(튜토리얼) 단계와 문장 |
| `public/js/engine.js` | 규칙. 맨 위 `CFG`에서 시간·확률 숫자 조정 |
| `public/js/scene.js` | 임시 도트 장면. `BG_IMAGES`에 PNG 경로를 넣으면 배경 교체 |
| `public/js/client.js` | 화면 |
| `worker/index.js` | 서버(방, 역할 토큰, 끊김 시 정지, 저장) |

## 배경 그림 넣기

`public/img/eaves.png`처럼 넣고 `scene.js`의
`export const BG_IMAGES = {}` 를
`export const BG_IMAGES = { eaves: 'img/eaves.png', checkpoint: 'img/checkpoint.png', dorm: 'img/dorm.png', roof: 'img/roof.png' };`
로 바꾸면 됩니다. 흑백 1비트, 192×120 또는 그 배수(384×240 등)를 권장합니다.

## 글꼴

갈무리(Galmuri11) — SIL Open Font License 1.1 (`public/fonts/OFL.md`).
