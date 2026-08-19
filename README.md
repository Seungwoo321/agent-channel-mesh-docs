# agent-channel-mesh-docs

<p><strong>English</strong> · <a href="./README.ko.md">한국어</a></p>

Guide site for [agent-channel-mesh](https://github.com/Seungwoo321/agent-channel-mesh).
Astro 5 + Starlight.

The landing page is a separate repository — `agent-channel-mesh-landing`. The canonical design
document is `docs/architecture.md` in the code repository; this site holds **guidance for people
using it** and nothing else.

```bash
bun install
bun run dev      # local preview
bun run build    # astro check + build
```

Pages live under `src/content/docs/`, Korean at the root and English under `en/` with the same
slugs. Sidebar order and the locale list are owned by `astro.config.mjs`.

## License

[Apache-2.0](LICENSE)
