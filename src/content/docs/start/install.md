---
title: 설치
description: 두 에이전트에 플러그인을 깔고, 실제로 실렸는지 확인한다.
sidebar:
  order: 2
---

필요한 것은 [Bun](https://bun.sh) 하나다. 레포가 곧 마켓플레이스라 따로 클론하지 않는다.
현재 플러그인 릴리스는 v0.3.1이다.

정상 플러그인 세션은 공용 기본 설정을 암묵적으로 공유하지 않는다. 세션마다 설정 파일·시드에서
파생한 신원·로컬 저장소 namespace·receiver lease를 사용한다. Codex는 `CODEX_THREAD_ID`를
우선하고 `ACM_SESSION_ID`를 fallback으로 사용한다. `ACM_CONFIG`는 resolver를 명시적으로
override하는 값이므로 세션마다 고유한 파일을 가리키고 다른 세션 설정을 복사하지 않는다.

## Claude Code

세션 안에서 두 줄이다. 터미널에서 할 때는 `claude` 를 앞에 붙인다.

```
/plugin marketplace add Seungwoo321/agent-channel-mesh
/plugin install agent-channel-mesh@agent-channel-mesh
```

## Codex

```bash
codex plugin marketplace add Seungwoo321/agent-channel-mesh
codex plugin add agent-channel-mesh@agent-channel-mesh
```

## 실렸는지 확인

```bash
claude plugin list
```

`✔ enabled` 여야 한다. **실패는 이 명령에서만 드러난다** — `plugin validate --strict` 도
`plugin details` 도 `mcp list` 도 못 실린 플러그인에 정상처럼 답한다. 훅 4개와 스킬 1개를
그대로 세어 보여주면서도 실제로는 아무것도 안 실려 있을 수 있다.

## 훅 승인

깔린 플러그인은 `untrusted` 로 들어온다. 세션에서 `/hooks` 를 열어 승인해야 훅이 돈다.

승인은 선택적 hook 알림과 안전망을 켜는 절차다. 일반 MCP receiver에는 필요하지 않다. 일반
receiver는 릴레이를 폴링해 봉투를 복호화하고 세션 로컬 수신함에 쓴다. 표준 MCP 알림 자체도
모델 턴을 시작하지 않으므로, 호스트가 유휴 상태일 때는 다음 턴에 `inbox`를 호출해야 한다.
새 버전으로 올리면 hook 해시가 바뀌어 hook을 사용하는 세션은 다시 승인한다.

선택적 Codex hook에 `CODEX_THREAD_ID`와 `ACM_SESSION_ID`가 모두 없으면 공용 `codex.json`으로
fallback하지 않고 `{}`를 반환하며 exit 0으로 끝난다. MCP와 monitor 진입점은 세션 ID 누락을
진단한다. 정상 Codex 세션에서 다시 시작하거나 고유한 `ACM_CONFIG`를 명시한다.

## 수신과 상태 관찰

기본 수신 폴링은 빈 응답·오류가 이어질 때 약 2초부터 최대 5분까지 adaptive backoff를 쓰고,
메시지가 오면 간격을 초기화한다. `inbox`는 로컬 정본을 읽는다. `channel_status`와
`dashboard`는 읽기 전용 관찰 경로로, 설정 멤버·서명된 단기 presence·여러 session/instance와
`unmatched_presence`를 보여 주며 receiver lease를 잡거나 메시지 본문을 노출하지 않는다.

Croner 스케줄러는 현재 MCP 세션 메모리에서 로컬 수신함만 관찰하고 유휴 모델을 깨우지 않는다.
`channel_cleanup`도 스케줄과 별개인 로컬 작업이며 선택한 joined channel 하나만 대상으로 한다.

같은 세션 설정에 어댑터를 두 개 띄우면 두 번째는 receiver lease `busy`로 시작하지 못한다.
실행 중 lease를 잃으면 `lost`가 된다. 오래된 프로세스를 종료하고 세션을 다시 열며 같은 설정에
어댑터를 더 띄우지 않는다.

## 첫 세션

깔고 처음 연 세션에는 세션 설정이 없다. 이때 어댑터는 죽지 않고 `setup` 툴 하나만 들고 떠서
에이전트에게 그 사실을 알린다. 툴 목록에 `setup` 하나뿐이면 정상이다. setup이나 설정 변경
뒤에는 세션을 완전히 다시 열어 MCP 서버와 receiver가 새 상태를 사용하게 한다.

다음: [릴레이 정하기](/start/relay/).
