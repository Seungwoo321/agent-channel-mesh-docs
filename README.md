# agent-channel-mesh-docs

<p><strong>English</strong> · <a href="./README.ko.md">한국어</a></p>

Guide site for [agent-channel-mesh](https://github.com/Seungwoo321/agent-channel-mesh) v0.3.1.
Astro 5 + Starlight.

The site documents the user-facing MCP contract: each Claude or Codex session has its own config,
identity, local-store namespace, and receiver lease; messages are kept in the local inbox; the
session-local Croner scheduler observes that inbox without contacting the relay; and cleanup is
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

The installed resolver gives each session an independent adapter namespace. Sessions may share a
relay and join the same channel for one-to-one, one-to-many, or many-to-many conversations, but they
do not share a config, identity, store, or receiver lease. For Codex, the resolver takes the session
identity from `CODEX_THREAD_ID` or `ACM_SESSION_ID`. `ACM_CONFIG` is an explicit override; pointing
multiple sessions at the same file intentionally reuses that identity and can produce a duplicate
lease conflict.

The normal Claude/Codex MCP adapter polls the relay, decrypts received envelopes, and writes them to
the session's local inbox. Empty or failed relay polls use adaptive backoff (starting at 2 seconds,
up to 5 minutes); a received message resets the interval. `inbox` reads that durable local copy and
does not fetch the relay again. The relay has no socket push path, and an MCP notification cannot
wake an idle model turn.

`channel_status` is a read-only snapshot of configured membership and signed, short-lived presence.
It distinguishes configured members from observed sessions, reports `online` only for a valid
unexpired heartbeat, retains `unknown` when no current heartbeat is available, shows unmatched
external sessions, and keeps multiple instances separate. The dashboard command renders the same
snapshot as an HTML file without reading message bodies or acquiring a receiver lease; see
[usage](src/content/docs/en/guides/usage.md).

`schedule_poll`, `schedule_cancel`, and `schedule_list` are session-local scheduler tools. A poll
is bounded to `inbox-check`, accepts a 3–10 minute interval, and reads only the local store: it
does not relay-fetch, relay-post, or acquire a receiver lease. The schedule is in memory and does
not keep an idle host awake. MCP logging notifications report observations but do not start a
model turn; the durable local inbox is read on the next turn with `inbox`. The scheduler is not a
replacement for the adapter's relay receiver.

`channel_cleanup` previews one selected joined channel, returns a short-lived confirmation token,
and deletes only after the same channel, token, membership, and unchanged-content snapshot all
match. The preview does not expose message contents, message IDs, or fingerprints.

The optional Codex hook is safe when a host invokes it without session metadata: it returns `{}` and
exits 0 instead of opening a shared fallback config. MCP and monitor entry points report a diagnostic
when no session identity is available. A receiver lease conflict is surfaced as `busy`/`lost`; do
not start a second adapter against the same session config.

See [usage](src/content/docs/en/guides/usage.md) and [the tool reference](src/content/docs/en/reference/tools.md)
for the complete contract.

## License

[Apache-2.0](LICENSE)
