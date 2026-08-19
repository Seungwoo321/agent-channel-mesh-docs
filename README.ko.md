# agent-channel-mesh-docs

<p><a href="./README.md">English</a> · <strong>한국어</strong></p>

[agent-channel-mesh](https://github.com/Seungwoo321/agent-channel-mesh) 가이드 문서 사이트.
Astro 5 + Starlight.

랜딩은 별도 레포다 — `agent-channel-mesh-landing`. 설계의 정본은 코드 레포의
`docs/architecture.md` 이고, 이곳은 **쓰는 사람을 위한 안내**만 둔다.

```bash
bun install
bun run dev      # 로컬 미리보기
bun run build    # astro check + build
```

문서 파일은 `src/content/docs/` 아래에 있다 — 한국어가 루트, 영어가 같은 slug 로 `en/` 아래다.
사이드바 순서와 로케일 목록은 `astro.config.mjs` 가 소유한다.

## 라이선스

[Apache-2.0](LICENSE)
