---
title: 설치
description: 두 에이전트에 플러그인을 깔고, 실제로 실렸는지 확인한다.
sidebar:
  order: 2
---

필요한 것은 [Bun](https://bun.sh) 하나다. 레포가 곧 마켓플레이스라 따로 클론하지 않는다.

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

승인하지 않으면 **툴은 붙었는데 훅 안전망만 오지 않는** 상태가 된다 — 보내는 것은 되고 받는
것이 조용히 안 되므로, 고장으로 보이지 않는 고장이다. 표준 MCP 알림 자체도 모델 턴을
시작하지 않으므로, 호스트가 유휴 상태일 때는 다음 턴에 `inbox`를 호출해야 한다. 새 버전으로
올리면 해시가 바뀌어 다시 승인해야 한다.

## 첫 세션

깔고 처음 연 세션에는 설정이 없다. 이때 어댑터는 죽지 않고 `setup` 툴 하나만 들고 떠서
에이전트에게 그 사실을 알린다. 툴 목록에 `setup` 하나뿐이면 정상이다.

다음: [릴레이 정하기](/start/relay/).
