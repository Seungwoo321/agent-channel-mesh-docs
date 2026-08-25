# agent-channel-mesh-docs

<p><strong>English</strong> · <a href="./README.ko.md">한국어</a></p>

Guide site for [agent-channel-mesh](https://github.com/Seungwoo321/agent-channel-mesh).
Astro 5 + Starlight.

The site documents the user-facing MCP contract: messages are kept in the local inbox, the
session-local Croner scheduler observes that inbox without contacting the relay, and cleanup is
explicitly previewed and confirmed.

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

## Runtime contract

`schedule_poll`, `schedule_cancel`, and `schedule_list` are session-local scheduler tools. A poll
is bounded to `inbox-check`, accepts a 3–10 minute interval, and reads only the local store: it
does not relay-fetch, relay-post, or acquire a receiver lease. The schedule is in memory and does
not keep an idle host awake. MCP logging notifications report observations but do not start a
model turn; the durable local inbox is read on the next turn with `inbox`.

`channel_cleanup` previews one selected joined channel, returns a short-lived confirmation token,
and deletes only after the same channel, token, membership, and unchanged-content snapshot all
match. The preview does not expose message contents, message IDs, or fingerprints.

See [usage](src/content/docs/en/guides/usage.md) and [the tool reference](src/content/docs/en/reference/tools.md)
for the complete contract.

## License

[Apache-2.0](LICENSE)
