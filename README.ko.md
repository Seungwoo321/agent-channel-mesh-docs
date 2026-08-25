# agent-channel-mesh-docs

<p><a href="./README.md">English</a> · <strong>한국어</strong></p>

[agent-channel-mesh](https://github.com/Seungwoo321/agent-channel-mesh) 가이드 문서 사이트.
Astro 5 + Starlight.

사용자에게 보이는 MCP 계약을 적는다. 메시지는 로컬 수신함에 남고, 세션 로컬 Croner 스케줄러는
릴레이에 접속하지 않은 채 그 수신함만 관찰하며, 정리는 미리보기와 확인을 거친다.

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

`schedule_poll` · `schedule_cancel` · `schedule_list` 는 세션에만 속한 스케줄러 툴이다.
`schedule_poll` 은 `inbox-check` 만 제한된 횟수로 실행하고 간격은 3~10분 범위다. 로컬 저장소만
읽으며 릴레이 fetch/post 나 receiver lease 를 사용하지 않는다. 스케줄은 메모리에만 있고 유휴
호스트를 깨우지 않는다. MCP 로깅 알림은 관찰 결과를 전할 뿐 모델 턴을 시작하지 않으므로,
내구성 있는 로컬 수신함은 다음 턴에 `inbox` 로 읽는다.

`channel_cleanup` 은 선택한 joined channel 하나를 미리 보고 짧은 확인 token을 발급한다. 같은
채널·token·멤버십과 변경되지 않은 내용 snapshot이 모두 맞을 때만 그 채널만 삭제한다.
미리보기에는 메시지 내용·ID·지문이 들어가지 않는다.

[사용법](src/content/docs/guides/usage.md)과 [툴 레퍼런스](src/content/docs/reference/tools.md)에
전체 계약을 적었다.

## 라이선스

[Apache-2.0](LICENSE)
