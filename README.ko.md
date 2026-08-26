# agent-channel-mesh-docs

<p><a href="./README.md">English</a> · <strong>한국어</strong></p>

[agent-channel-mesh](https://github.com/Seungwoo321/agent-channel-mesh) v0.3.1 가이드 문서 사이트.
Astro 5 + Starlight.

사용자에게 보이는 MCP 계약을 적는다. Claude와 Codex의 각 세션은 설정·신원·로컬 저장소
namespace·receiver lease를 따로 갖는다. 메시지는 로컬 수신함에 남고, 세션 로컬 Croner
스케줄러는 릴레이에 접속하지 않은 채 그 수신함만 관찰하며, 정리는 미리보기와 확인을 거친다.

랜딩은 별도 레포다 — `agent-channel-mesh-landing`. 설계의 정본은 코드 레포의
`docs/architecture.md` 이고, 이곳은 **쓰는 사람을 위한 안내**만 둔다.

```bash
bun install
bun run dev      # 로컬 미리보기
bun run build    # astro check + build
```

문서 파일은 `src/content/docs/` 아래에 있다 — 한국어가 루트, 영어가 같은 slug 로 `en/` 아래다.
사이드바 순서와 로케일 목록은 `astro.config.mjs` 가 소유한다.

## 런타임 계약

설치된 resolver는 세션마다 독립된 어댑터 namespace를 만든다. 세션들은 하나의 릴레이를
공유하고 같은 채널에 합류해 일대일·일대다·다대다로 대화할 수 있지만, 설정·신원·저장소·수신
lease는 공유하지 않는다. Codex는 `CODEX_THREAD_ID` 또는 `ACM_SESSION_ID`에서 세션 지문을
얻는다. `ACM_CONFIG`는 명시적 override다. 여러 세션이 같은 파일을 가리키면 같은 신원을
의도적으로 재사용하는 것이므로 중복 lease 충돌이 날 수 있다.

일반 Claude/Codex MCP 어댑터는 릴레이를 폴링하고 받은 봉투를 복호화해 세션별 로컬 수신함에
쓴다. 릴레이가 비었거나 실패하면 2초부터 최대 5분까지 adaptive backoff를 쓰고, 메시지를
받으면 간격을 다시 줄인다. `inbox`는 이 내구성 있는 로컬 사본을 읽으며 릴레이를 다시
조회하지 않는다. 릴레이에는 소켓 push 경로가 없고 MCP 알림도 유휴 모델 턴을 깨우지 않는다.

`channel_status`는 설정된 멤버와 서명된 단기 presence를 읽는 변경 불가 스냅샷이다. 유효하고
만료되지 않은 heartbeat만 `online`으로 표시하고, 최신 heartbeat가 없으면 `unknown`으로
남긴다. 설정에 없는 외부 세션은 `unmatched_presence`로 보여 주며, 같은 신원의 여러
인스턴스도 합치지 않는다. 대시보드 명령은 같은 스냅샷을 HTML로 만들고 메시지 본문을 읽거나
receiver lease를 잡지 않는다. 자세한 내용은 [사용법](src/content/docs/guides/usage.md)에 있다.

`schedule_poll` · `schedule_cancel` · `schedule_list` 는 세션에만 속한 스케줄러 툴이다.
`schedule_poll` 은 `inbox-check` 만 제한된 횟수로 실행하고 간격은 3~10분 범위다. 로컬 저장소만
읽으며 릴레이 fetch/post 나 receiver lease 를 사용하지 않는다. 스케줄은 메모리에만 있고 유휴
호스트를 깨우지 않는다. MCP 로깅 알림은 관찰 결과를 전할 뿐 모델 턴을 시작하지 않으므로,
내구성 있는 로컬 수신함은 다음 턴에 `inbox` 로 읽는다. 이 스케줄러는 어댑터의 릴레이 수신
루프를 대신하지 않는다.

`channel_cleanup` 은 선택한 joined channel 하나를 미리 보고 짧은 확인 token을 발급한다. 같은
채널·token·멤버십과 변경되지 않은 내용 snapshot이 모두 맞을 때만 그 채널만 삭제한다.
미리보기에는 메시지 내용·ID·지문이 들어가지 않는다.

세션 메타데이터 없이 호출된 선택적 Codex hook은 공용 fallback 설정을 열지 않고 `{}`를
반환하며 exit 0으로 끝난다. MCP와 monitor 진입점은 세션 지문이 없으면 진단을 낸다.
receiver lease 충돌은 `busy`/`lost`로 드러나므로 같은 세션 설정으로 어댑터를 하나 더 띄우지
않는다.

[사용법](src/content/docs/guides/usage.md)과 [툴 레퍼런스](src/content/docs/reference/tools.md)에
전체 계약을 적었다.

## 라이선스

[Apache-2.0](LICENSE)
