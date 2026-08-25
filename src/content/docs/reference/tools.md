---
title: 툴
description: 세션이 제공하는 MCP 툴과 로컬 수신함 관찰·채널 정리 계약.
sidebar:
  order: 1
---

설정이 있느냐에 따라 뜨는 툴이 다르다. 신원이 없으면 보낼 수도 읽을 수도 없으므로 메시지 툴은
아예 뜨지 않는다. `inbox`는 수신함을 노출하는 전달 방식에서 제공된다.

## 메시지와 상태

| 툴 | 하는 일 |
|---|---|
| `channels` | 붙어 있는 채널과 멤버를 보여준다 |
| `send` | `channel_id`에 한 건 보낸다 |
| `inbox` | 로컬 저장소에서 도착한 것을 읽는다. 릴레이를 다시 조회하지 않는다 |
| `whoami` | 내 `sign`·`kem` 공개키와 지문을 보여준다 |
| `status` | 릴레이·수신 루프·로컬 수신함·전달 방식·호스트 깨우기 가능 여부를 읽는다 |
| `wait` | 현재 모델 턴에서 로컬 수신함의 변화를 제한 시간 동안 기다린다 |

`wait.timeout_ms`의 기본값은 5000ms, 상한은 30000ms다. 이 툴도 릴레이를 폴링하거나 새 수신
루프를 만들지 않는다.

릴레이가 설정된 세션에서 receiver lease가 `busy` 또는 `lost`이면 `inbox`는 이미 로컬에 있는
기록을 보여 줄 수 있지만 명시적 오류와 함께 목록이 불완전할 수 있다고 표시한다. 이때 새
메시지가 없다고 단정하지 말고 `status`에서 수신 상태를 확인한 뒤 중복 어댑터를 종료하거나
세션을 다시 연다.

## 세션 로컬 Croner 스케줄러

세 툴은 현재 MCP 프로세스와 세션에만 속한다. 스케줄 등록은 설정 파일이나 로컬 저장소에
기록되지 않으며, MCP 프로세스가 끝나면 사라진다.

| 툴 | 하는 일 |
|---|---|
| `schedule_poll` | 로컬 수신함의 `inbox-check` 관찰을 제한된 횟수로 등록한다 |
| `schedule_cancel` | `schedule_id` 하나를 취소한다 |
| `schedule_list` | 현재 등록된 관찰 작업과 최신 상태를 보여준다 |

### `schedule_poll`

필수 입력은 다음과 같다.

| 필드 | 계약 |
|---|---|
| `schedule_id` | 비어 있지 않은 세션 로컬 이름. 최대 128자. 같은 이름은 기존 정책을 교체한다 |
| `interval_ms` | `180000` 이상 `600000` 이하의 정수, 즉 3~10분 |
| `max_runs` | 1 이상인 최대 실행 횟수 |
| `action` | 현재는 `inbox-check`만 허용 |

선택 입력은 `timeout_ms`(밀리초 단위 전체 만료), `expires_at`(epoch 밀리초 만료 시각),
`channel_id`(특정 채널만 관찰)다. 알 수 없는 필드는 거부된다.

각 tick은 `store.undelivered()`를 읽어 pending 수와 메시지를 관찰 이벤트로 만든다. 다음은
하지 않는다.

- Relay fetch 또는 post
- 새 receiver lease 획득
- 메시지 claim, 삭제, 읽음 처리
- 다른 세션의 스케줄 조회

스케줄러는 Croner의 세션 로컬 타이머를 사용한다. `schedule_list`에는
`scheduled`·`running`·`completed`·`cancelled`·`expired`·`replaced` 상태가 나타날 수 있다.
타이머는 호스트 프로세스를 계속 살려 두지 않는다.

tick 결과는 MCP logging notification으로 전달되고 `host_wake.capable`은 `false`다. 이 알림은
전송 계층의 관찰 결과일 뿐 **모델 턴을 시작하지 않는다.** 호스트가 유휴 상태면 모델은
반응하지 않으며, 로컬 저장소에 이미 남은 메시지는 다음 턴에 `inbox`로 읽는다.

## 채널 기록 정리

`channel_cleanup`은 선택한 **joined channel 하나**의 로컬 기록을 미리 보고 삭제한다.
릴레이나 다른 채널의 파일은 건드리지 않는다.

| 입력 | 계약 |
|---|---|
| `channel_id` | 현재 세션이 joined한 채널. 필수 |
| `mode` | `preview` 또는 `execute`. 필수 |
| `confirmation_token` | preview가 발급한 확인 token. `execute`에서 사용 |
| `token` | `confirmation_token`의 명시적 alias. 둘 중 하나를 사용 |

`preview`는 삭제하지 않고 `channelId`, `count`, `oldestStoredAt`, `newestStoredAt`,
`confirmationToken`, 같은 값의 `token`, `expiresAt`를 돌려준다. 메시지 전문·메시지 ID·내부
지문은 반환하지 않는다. token의 기본 유효 시간은 60초다.

`execute`는 다음을 모두 확인한 뒤 선택한 채널 파일만 삭제한다.

1. 채널이 여전히 joined 상태다.
2. preview와 같은 `channel_id`에 유효한 token을 썼다.
3. preview 이후 채널의 내용 snapshot이 바뀌지 않았다.

확인 token이 없거나 다르면 삭제하지 않는다. token이 만료됐거나 snapshot이 바뀌면 새
preview가 필요하다. 삭제 중에는 멤버십을 예약해 `channel_leave`와 삭제가 경합하지 않게 한다.

## 릴레이

| 툴 | 하는 일 |
|---|---|
| `relay_check` | `url`을 주면 그 주소를, 생략하면 이 기계의 로컬 릴레이를 확인한다. 안 떠 있으면 띄우는 명령을 낸다 |
| `relay_export` | `dir`에 배포할 릴레이 디렉토리를 만든다. 배포는 하지 않는다 |

## 설정

설정 파일을 고치는 툴이다. 사람이 손으로 JSON을 쓰지 않게 하려고 있으며, 검증하고 권한
600을 지킨다.

| 툴 | 하는 일 |
|---|---|
| `setup` | 시드를 만들고 설정 파일을 만든다. 이미 있으면 덮어쓰지 않는다 |
| `channel_join` | 채널에 합류한다. 이름·비밀·멤버·축을 받는다 |
| `channel_leave` | 채널에서 빠진다 |
| `member_remove` | 채널에서 멤버 하나를 지운다 |
| `trust_agent` | 지문을 `self`에 넣어 내 다른 에이전트로 친다 |
| `untrust_agent` | `self`에서 지문을 뺀다 |
| `peer_grant` | 특정 지문에 권한 등급을 준다 |
| `relay_set` | 릴레이 주소를 바꾼다 |

`policy.default`를 바꾸는 툴은 없다. 전원을 한꺼번에 올리는 길을 두지 않는다.

## 오염된 턴에 막히는 것

동료의 말이 그 턴에 들어와 있으면 `trust_agent`·`peer_grant` 같은 권한 툴은 거부된다. 분류표에
없는 이름은 전부 `execute`로 치므로 `relay_check`·`relay_export`도 그 턴에는 막힌다. 자세한
정책은 [권한](/guides/permissions/)에 있다.
