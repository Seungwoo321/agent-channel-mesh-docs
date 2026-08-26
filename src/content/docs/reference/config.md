---
title: 설정 파일
description: 어댑터의 유일한 입력. 권한 600 보다 넓으면 읽지 않고 죽는다.
sidebar:
  order: 2
---

설정 파일은 어댑터의 **유일한** 입력이다. `ACM_CONFIG`로 경로를 명시할 수 있다. 플러그인
resolver가 세션 ID를 받은 정상 세션은 기본적으로 세션 namespace 아래의 설정 파일을 사용한다.
직접 지정한 `ACM_CONFIG`는 이 규칙보다 우선한다.

**권한이 600 보다 넓으면 읽지 않고 죽는다.** 이 파일 하나로 모든 암호가 무력화되므로 경고로
넘어가지 않는다. 이 문서는 값의 뜻을 적어 두는 것이고, 파일은 손으로 쓰지 않는다 —
[설정 툴](/reference/tools/) 이 검증하고 권한을 지킨다.

## 최상위

| 필드 | 뜻 |
|---|---|
| `seed` | 신원의 개인 시드(hex 64자). **밖으로 나가지 않는다** |
| `relay` | 릴레이 base URL. 설정 전체에 하나다 |
| `relayToken` | 릴레이가 쓰기 토큰을 요구할 때. 환경변수로 넣는 길이 우선이다 |
| `channels` | 채널 목록 |
| `self` | 내 다른 에이전트의 지문 목록. 여기 적힌 것만 `execute` 다 |
| `policy` | 도착한 말의 기본 권한과 지문별 예외 |
| `store` | 로컬 저장소 위치·보관 |

## 세션별 격리

플러그인이 시작한 정상 세션은 세션마다 설정 파일·시드에서 파생한 신원·로컬 저장소 namespace·
receiver lease를 독립적으로 가진다. 여러 세션은 같은 릴레이와 채널을 공유할 수 있지만, 한
세션의 `inbox`가 다른 세션에 나타나지 않는다. Codex 세션 ID는 `CODEX_THREAD_ID`를 우선하고,
없으면 `ACM_SESSION_ID`를 사용한다.

`ACM_CONFIG`를 여러 세션에 같은 경로로 지정하면 이 격리를 명시적으로 해제한다. 그 경우 같은
신원·저장소·receiver lease를 재사용하게 되고, 두 번째 어댑터가 `busy`가 될 수 있다. 메타데이터가
없는 선택적 Codex hook은 이 공용 경로로 fallback하지 않고 `{}`와 exit 0을 반환한다. MCP와
monitor 진입점은 세션 ID가 없다는 진단을 낸다.

## `channels[]`

| 필드 | 뜻 |
|---|---|
| `secret` | 채널 비밀(hex 64자). 채널을 여는 쪽이 만들어 대역 외로 나눈다 |
| `name` | 사람이 읽는 채널 이름 |
| `members[]` | 상대의 `sign`·`kem` 공개키와 표시용 `label` |
| `axis` | `internal` / `external` — 사람이 읽는 라벨이다. 권한 판정에 쓰이지 않는다 |
| `mentions` | 나를 부르는 이름들 |
| `maxHops` | 자동 응답이 이어질 수 있는 홉 상한 |
| `messageBudget` | 한 대화에서 쓸 수 있는 메시지 예산 |

`members[].label` 은 **상대가 자기 설정에 적은 이름**이 아니라 내가 내 설정에 적는 이름이다.
어느 쪽이든 신뢰의 근거가 아니다 — 근거는 지문이다.

## `policy`

| 필드 | 뜻 |
|---|---|
| `default` | 지문이 `self` 에도 `peers` 에도 없을 때의 등급. 기본 `read` |
| `peers` | 지문 → 등급. 그 사람에게만 다르게 준다 |

등급은 `read` · `write` · `execute` 다. `default` 를 바꾸는 툴은 없다 — 올리면 아직 지문도
대조하지 않은 사람까지 함께 올라간다.

## `store`

| 필드 | 기본값 | 뜻 |
|---|---|---|
| `dir` | `~/.agent-channel-mesh/messages` | 바깥 디렉토리 |
| `retentionMs` | 30일 | 보관 기한. 무제한은 열어 두지 않는다 |
| `maxPerChannel` | 2000 | 채널당 보관 개수 상한 |

resolver가 만든 세션 설정에서는 실제 파일이 세션별 `store.dir` namespace 아래에 들어간다.
그 안에서도 신원·채널별로 나뉜다. `ACM_CONFIG`나 `store.dir`을 여러 세션에 수동으로 공유하면
격리가 깨져 한쪽이 받은 메시지가 다른 쪽과 섞이거나 receiver lease 충돌이 난다.

파일 권한은 `0600`, 디렉토리는 `0700` 이다.

## 환경변수

| 이름 | 어디 쓰나 |
|---|---|
| `ACM_CONFIG` | 설정 파일 경로. 지정하면 resolver의 세션별 기본 경로를 override한다 |
| `CODEX_THREAD_ID` | Codex 세션 식별자. 있으면 `ACM_SESSION_ID`보다 우선한다 |
| `ACM_SESSION_ID` | Codex 세션 식별자의 fallback. resolver가 세션 namespace와 presence에 사용한다 |
| `ACM_RELAY_TOKEN` | 릴레이 쓰기 토큰. 명령줄 인자로 받으면 `ps` 에 찍힌다 |

릴레이 쪽 환경변수(`UPSTASH_REDIS_REST_URL` · `_TOKEN` · `CRON_SECRET`)는
[다른 사람과](/guides/other-people/) 에 있다.

## 세션에만 남는 상태

`schedule_poll`로 등록한 Croner 작업과 `channel_cleanup` preview가 발급한 확인 token은 설정
파일이나 로컬 저장소에 기록하지 않는다. MCP 프로세스가 끝나면 사라진다. 반대로 이미 저장된
메시지는 로컬 수신함의 보관 정책 안에서 남아 있으므로, 같은 세션 namespace를 다시 열면
`inbox`로 읽을 수 있다. presence heartbeat는 릴레이에 서명된 TTL 메타데이터로 잠시 남지만
설정 파일에 저장되는 세션 상태는 아니다.
