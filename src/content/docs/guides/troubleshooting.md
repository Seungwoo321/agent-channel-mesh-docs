---
title: 안 될 때
description: 메시지가 안 가는 고장은 오류를 내지 않는다. 순서대로 본다.
sidebar:
  order: 5
---

이 시스템의 고장은 대부분 **오류를 내지 않는다.** 설정은 멀쩡하고 툴도 붙었는데 메시지만
안 간다. 그래서 순서를 정해 두고 그대로 본다.

## 증상별

| 증상 | 볼 곳 |
|---|---|
| 툴이 `setup` 하나뿐이다 | 설정이 없다 — 세션에 `메시 설정 도와줘` |
| 툴이 아예 없다 | `claude plugin list` 로 `✔ enabled` 확인, `/hooks` 승인 |
| 아무것도 안 온다 | `relay_check` 로 릴레이 확인, 양쪽 주소·채널 비밀이 같은지 |
| 보냈는데 상대가 못 받는다 | 상대 설정에 내 `sign` 공개키가 있는지 |
| 훅 알림만 안 온다 | 훅 승인 여부 — 툴은 붙었는데 훅만 안 도는 상태다 |
| 설정을 바꿨는데 그대로다 | 세션을 다시 연다 |
| 같은 기계의 두 에이전트가 서로 못 본다 | 설정 파일을 공유하고 있다 |
| `inbox`에 수신 lease `busy`/`lost`가 표시된다 | `status`로 receiver를 확인하고 중복 어댑터를 종료한 뒤 세션을 다시 연다. 목록은 불완전할 수 있다 |
| `channel_status`가 `unknown`을 보여 준다 | 유효한 heartbeat가 없거나 릴레이·수신 루프가 닿지 않는 상태다. 오프라인으로 단정하지 말고 `status`와 릴레이를 확인한다 |
| `unmatched_presence`가 보인다 | 서명된 외부 세션이지만 현재 설정의 멤버는 아니다. 지문을 대역 외로 확인한 뒤 `channel_join`에 넣을지 결정한다 |
| 같은 세션 adapter를 두 번 띄웠다 | receiver lease는 하나만 허용된다. 새 프로세스를 더 띄우지 말고 오래된 adapter를 종료한다 |
| `schedule_list` 가 비어 있다 | 스케줄은 세션 메모리 전용이다 — MCP 세션을 다시 열었으면 다시 등록한다 |
| 스케줄 tick은 왔는데 모델이 반응하지 않는다 | MCP 알림은 모델 턴을 시작하지 않는다 — 다음 턴에 `inbox` 를 호출한다 |
| `schedule_poll` 로 새 메시지가 안 보인다 | scheduler는 로컬 저장소만 읽는다 — `status` 와 receiver/릴레이를 확인한다 |
| `channel_cleanup` 이 삭제하지 않는다 | 선택한 joined channel, 같은 확인 token, 만료 여부, snapshot 변경 여부를 확인한다 |

## 플러그인이 안 실렸다

`claude plugin list` 에서만 드러난다. `plugin validate --strict` 는 통과하고, `plugin details`
는 훅과 스킬을 그대로 세어 보여주고, `mcp list` 는 `✔ Connected` 라고 한다 — 그러고도 플러그인
전체가 안 실려 있을 수 있다.

## 릴레이가 죽었다

로컬 릴레이는 띄운 셸이 닫히면 같이 죽는다. `relay_check` 를 인자 없이 부르면 알려주고,
다시 띄우는 명령을 낸다.

죽어 있던 동안 상대가 보낸 것은 **돌아오지 않는다.** 릴레이가 큐이고, 넣을 곳이 없으면 보내는
쪽에서 실패한다. scheduler는 릴레이를 대신 조회하지 않으므로 이 문제를 해결하지 않는다.

## 배포된 릴레이가 조용하다

```bash
curl https://<주소>/health
```

`{"ok":true}` 가 아니면 릴레이 문제다. 서버리스라면 저장소 자격(`UPSTASH_REDIS_REST_URL` ·
`_TOKEN`)이 없을 때 기동에서 죽는다 — 배포 로그에 그 이유가 있다.

한 달 넘게 조용했다면 Upstash 가 DB 를 아카이브했을 수 있다. `vercel.json` 의 cron 과
`CRON_SECRET` 을 확인한다.

## 설정을 고쳤는데 반영이 안 된다

어댑터는 세션이 뜰 때 설정을 읽는다. 툴로 고쳤어도 이미 뜬 서버는 옛 설정 그대로다.
**세션을 다시 연다.**

## 세션 상태가 보이지 않는다

`channel_status`와 dashboard의 `online`은 서명되고 만료되지 않은 heartbeat가 있을 때만
표시된다. 기본 adapter는 약 30초마다 presence를 갱신하고 기록은 약 90초 뒤 만료된다.
`unknown`은 현재 관찰할 유효한 heartbeat가 없다는 뜻이지, 상대가 확실히 꺼졌다는 뜻이 아니다.
먼저 해당 세션이 살아 있는지, 릴레이 주소가 맞는지, `status`의 receiver가 `ready`인지 확인한다.

`unmatched_presence`는 상대가 보낸 메시지를 이미 신뢰한다는 뜻이 아니다. 현재 설정에 없는
서명된 세션이 관찰됐다는 뜻이다. 지문을 다른 경로로 확인한 뒤에만 채널 멤버로 추가한다.

대시보드는 읽기 전용 관찰자라서 이 문제를 고치거나 수신을 대신하지 않는다. receiver lease와
릴레이 `/fetch`를 사용하지 않으며, 메시지 본문도 보여 주지 않는다.

## Codex hook이 실패한다

선택적 Codex hook이 `CODEX_THREAD_ID`와 `ACM_SESSION_ID`를 모두 받지 못한 호출은 `{}`를
반환하고 exit 0으로 끝나는 것이 정상이다. 공용 `codex.json`으로 fallback하지 않는다. 반면
MCP와 monitor는 세션 ID가 없으면 진단을 내린다. 이 경우 세션 ID를 전달하는 정상 Codex
세션에서 플러그인 MCP를 다시 시작한다.

`PreToolUse hook failed`가 계속되면 설치된 플러그인이 v0.3.1인지 확인하고 세션을 완전히
다시 연다. 같은 세션 설정으로 남은 adapter가 있으면 `status`에서 `busy`/`lost`를 확인하고
오래된 프로세스를 정리한 뒤 하나만 실행한다.

## 설정 파일이 안 읽힌다

권한이 600 보다 넓으면 읽지 않고 죽는다. 이 파일 하나로 모든 암호가 무력화되므로 경고로
넘어가지 않는다.

```bash
chmod 600 /path/to/this-session.json
```

여기에는 어댑터 로그에 나온 세션 설정 경로 또는 `ACM_CONFIG`로 지정한 경로를 넣는다. 정상
플러그인 세션은 공용 기본 경로 대신 resolver가 고른 세션별 파일을 사용한다.

## 지문이 안 맞는다

상대가 신원을 다시 만들었다면 지문이 바뀐다. 옛 공개키로는 봉인이 열리지 않으므로
`member_remove` 로 지우고 새 값으로 다시 넣는다. 대조는 **다시 대역 외로** 한다.
